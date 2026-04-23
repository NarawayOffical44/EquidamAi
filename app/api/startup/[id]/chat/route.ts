import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/claude/providers";

const SYSTEM = `You are Evaldam AI — an expert startup valuation analyst. You have full context about a startup (provided in each message). Your job:
1. Answer valuation questions conversationally and with insight
2. When the user shares new facts (metrics, milestones, IP, team history, growth data), extract and return structured updates
3. Always explain the valuation impact of new information
4. Be specific, concise, and actionable

When you detect updatable profile data, append a JSON block ONLY at the very end of your response:
<updates>
{ "field": value }
</updates>

Updatable fields:
- arr (number in USD)
- monthly_growth_rate (number, percentage)
- total_addressable_market (number in USD)
- team_size (number)
- industry (string)
- description (string)
- stage ("pre-revenue"|"seed"|"series-a"|"series-b+")
- profile_data.has_patent (boolean)
- profile_data.patent_details (string)
- profile_data.founder_exits (string)
- profile_data.competitive_moat (string)
- profile_data.burn_rate (number per month)
- profile_data.runway_months (number)
- profile_data.funding_raised (number in USD)
- profile_data.revenue_model (string)
- profile_data.key_investors (string)

Only include fields you are CONFIDENT the user mentioned. Keep response under 200 words.`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { messages, startup } = await request.json();

    const startupContext = JSON.stringify({
      name: startup.company_name,
      stage: startup.stage,
      industry: startup.industry,
      description: startup.description,
      arr: startup.arr,
      monthlyGrowthRate: startup.monthly_growth_rate,
      tam: startup.total_addressable_market,
      teamSize: startup.team_size,
      website: startup.website_url,
      ...(startup.profile_data || {}),
    }, null, 2);

    // Build conversation for context
    const history = messages.slice(0, -1)
      .map((m: any) => `${m.role === "user" ? "User" : "Evaldam AI"}: ${m.content}`)
      .join("\n\n");
    const lastMsg = messages[messages.length - 1].content;
    const userContent = `Startup context:\n${startupContext}\n\n${history ? `Previous conversation:\n${history}\n\n` : ""}User: ${lastMsg}`;

    const rawResponse = await callLLM(
      [{ role: "user", content: userContent }],
      { system: SYSTEM, maxTokens: 600, temperature: 0.5, useCase: "report" }
    );

    // Parse updates
    let response = rawResponse;
    const updates: Record<string, any> = {};
    const match = rawResponse.match(/<updates>([\s\S]*?)<\/updates>/);
    if (match) {
      response = rawResponse.replace(/<updates>[\s\S]*?<\/updates>/g, "").trim();
      try {
        const raw = JSON.parse(match[1].trim());
        for (const [k, v] of Object.entries(raw)) {
          if (k.startsWith("profile_data.")) {
            if (!updates.profile_data) updates.profile_data = {};
            updates.profile_data[k.replace("profile_data.", "")] = v;
          } else {
            updates[k] = v;
          }
        }
      } catch { /* bad JSON — no updates */ }
    }

    return NextResponse.json({ response, updates });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ response: "I encountered an issue. Please try again.", updates: {} }, { status: 500 });
  }
}
