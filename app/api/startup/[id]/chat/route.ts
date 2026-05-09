import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/claude/providers";
import { createClient } from "@/lib/supabase/server";

const SYSTEM = `You are Evaldam AI â€” an expert startup valuation analyst. You have full context about a startup (provided in each message). Your job:
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
    const { id } = await params;
    const { messages, startup } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ response: "Please log in to use Evaldam AI chat.", updates: {} }, { status: 401 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ response: "Send a message to continue.", updates: {} }, { status: 400 });
    }

    const { data: dbStartup, error: startupError } = await supabase
      .from("startups")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (startupError || !dbStartup) {
      return NextResponse.json({ response: "Startup not found.", updates: {} }, { status: 404 });
    }

    const contextStartup = {
      ...dbStartup,
      ...(startup || {}),
      id: dbStartup.id,
      user_id: dbStartup.user_id,
    };

    const startupContext = JSON.stringify({
      name: contextStartup.company_name,
      stage: contextStartup.stage,
      industry: contextStartup.industry,
      description: contextStartup.description,
      arr: contextStartup.arr,
      monthlyGrowthRate: contextStartup.monthly_growth_rate,
      tam: contextStartup.total_addressable_market,
      teamSize: contextStartup.team_size,
      website: contextStartup.website_url,
      ...(contextStartup.profile_data || {}),
    }, null, 2);

    const history = messages.slice(0, -1)
      .map((m: any) => `${m.role === "user" ? "User" : "Evaldam AI"}: ${String(m.content || "").slice(0, 2000)}`)
      .join("\n\n");
    const lastMsg = String(messages[messages.length - 1]?.content || "").slice(0, 4000);
    const userContent = `Startup context:\n${startupContext}\n\n${history ? `Previous conversation:\n${history}\n\n` : ""}User: ${lastMsg}`;

    const rawResponse = await callLLM(
      [{ role: "user", content: userContent }],
      { system: SYSTEM, maxTokens: 600, temperature: 0.5, useCase: "report" }
    );

    let response = rawResponse;
    let updates: Record<string, any> = {};
    const match = rawResponse.match(/<updates>([\s\S]*?)<\/updates>/);
    if (match) {
      response = rawResponse.replace(/<updates>[\s\S]*?<\/updates>/g, "").trim();
      try {
        updates = sanitizeUpdates(JSON.parse(match[1].trim()));
      } catch {
        updates = {};
      }
    }

    return NextResponse.json({ response, updates });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ response: "I encountered an issue. Please try again.", updates: {} }, { status: 500 });
  }
}

function sanitizeUpdates(raw: Record<string, any>): Record<string, any> {
  const updates: Record<string, any> = {};
  const profileData: Record<string, any> = {};

  const numberFields = new Set(["arr", "monthly_growth_rate", "total_addressable_market", "team_size"]);
  const stringFields = new Set(["industry", "description"]);
  const stages = new Set(["pre-revenue", "seed", "series-a", "series-b+"]);
  const profileNumberFields = new Set(["burn_rate", "runway_months", "funding_raised"]);
  const profileStringFields = new Set(["patent_details", "founder_exits", "competitive_moat", "revenue_model", "key_investors"]);

  for (const [key, value] of Object.entries(raw || {})) {
    if (numberFields.has(key)) {
      const num = toFiniteNumber(value);
      if (num !== null) updates[key] = num;
      continue;
    }

    if (stringFields.has(key) && typeof value === "string" && value.trim()) {
      updates[key] = value.trim().slice(0, 2000);
      continue;
    }

    if (key === "stage" && typeof value === "string" && stages.has(value)) {
      updates.stage = value;
      continue;
    }

    if (key === "profile_data" && value && typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        sanitizeProfileDataField(profileData, nestedKey, nestedValue, profileNumberFields, profileStringFields);
      }
      continue;
    }

    if (key.startsWith("profile_data.")) {
      sanitizeProfileDataField(profileData, key.replace("profile_data.", ""), value, profileNumberFields, profileStringFields);
    }
  }

  if (Object.keys(profileData).length > 0) updates.profile_data = profileData;
  return updates;
}

function sanitizeProfileDataField(
  profileData: Record<string, any>,
  key: string,
  value: any,
  numberFields: Set<string>,
  stringFields: Set<string>
) {
  if (key === "has_patent" && typeof value === "boolean") {
    profileData.has_patent = value;
    return;
  }

  if (numberFields.has(key)) {
    const num = toFiniteNumber(value);
    if (num !== null) profileData[key] = num;
    return;
  }

  if (stringFields.has(key) && typeof value === "string" && value.trim()) {
    profileData[key] = value.trim().slice(0, 2000);
  }
}

function toFiniteNumber(value: any): number | null {
  const num = typeof value === "number" ? value : Number(String(value).replace(/[$,%\s,]/g, ""));
  return Number.isFinite(num) ? num : null;
}
