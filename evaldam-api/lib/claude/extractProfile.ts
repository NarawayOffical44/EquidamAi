import { callLLM } from "./providers";

export interface ExtractedProfileData {
  autoExtracted: Record<string, any>;
  extractionConfidence: number;
  extractedFields: string[];
  missingCriticalFields: string[];
}

export async function extractProfileFromPitchDeck(
  pdfText: string,
  websiteUrl?: string
): Promise<ExtractedProfileData> {
  const systemPrompt = `You are an expert startup analyst. Extract ALL available startup data from the provided pitch deck or website content. Be thorough — extract every data point you can find. Return ONLY valid JSON, no markdown.`;

  // Truncate to ~8k chars to stay within token limits
  const truncatedText = pdfText ? pdfText.slice(0, 8000) : "";

  const userPrompt = `Extract ALL startup data from the following content:
${truncatedText ? `\nPITCH DECK:\n${truncatedText}` : ""}
${websiteUrl ? `\nWEBSITE: ${websiteUrl}` : ""}

Return ONLY this JSON (use null for any field not found):
{
  "companyName": "string",
  "tagline": "string or null",
  "description": "2-3 sentence company description or null",
  "stage": "pre-revenue|seed|series-a|series-b+",
  "industry": "string (e.g. SaaS, Fintech, AI, HealthTech) or null",
  "founded": "YYYY or null",
  "headquarters": "City, Country or null",
  "websiteUrl": "string or null",
  "teamSize": "number or null",
  "team": [{"name": "string", "role": "string", "background": "string or null"}],
  "annualRecurringRevenue": "number in USD or null",
  "monthlyRecurringRevenue": "number in USD or null",
  "monthlyGrowthRate": "percentage number e.g. 15 or null",
  "burnRate": "monthly burn in USD or null",
  "runwayMonths": "number or null",
  "totalAddressableMarket": "number in USD or null",
  "serviceableAddressableMarket": "number in USD or null",
  "serviceableObtainableMarket": "number in USD or null",
  "revenueModel": "saas-subscription|usage-based|marketplace|one-time|freemium|enterprise|transactional or null",
  "customerCount": "number or null",
  "fundingRaised": "total raised in USD or null",
  "lastRound": "e.g. Seed $500K Q2 2024 or null",
  "accelerators": ["YC", "Techstars", etc],
  "competitiveMoat": "string or null",
  "founderExits": "string describing previous exits or null",
  "hasPatent": "boolean or null",
  "patentDetails": "string or null",
  "keyInvestors": "string or null",
  "linkedinUrl": "string or null",
  "location": "City, Country or null",
  "extractedFields": ["list of field names that were found"],
  "overallConfidence": "number 0-100"
}`;

  const responseText = await callLLM(
    [{ role: "user", content: userPrompt }],
    { system: systemPrompt, useCase: "extraction", maxTokens: 2000 }
  );

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse extraction response as JSON");

  const d = JSON.parse(jsonMatch[0]);

  return {
    autoExtracted: d,
    extractionConfidence: d.overallConfidence || 60,
    extractedFields: d.extractedFields || [],
    missingCriticalFields: [],
  };
}
