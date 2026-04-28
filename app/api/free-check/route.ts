import { NextRequest, NextResponse } from "next/server";
import { extractProfileFromPitchDeck } from "@/lib/claude/extractProfile";
import { ScorecardMethod } from "@/lib/claude/methods/scorecard";
import { BerkusMethod } from "@/lib/claude/methods/berkus";
import { DCFLTGMethod } from "@/lib/claude/methods/dcfLTG";
import { EvalDamScoreMethod } from "@/lib/claude/methods/evaldam-score";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { sendEmail } from "@/lib/email/client";
import { valuationResultsEmailTemplate, newLeadNotificationEmailTemplate } from "@/lib/email/templates";
import { checkAndIncrementRateLimit } from "@/lib/utils/rate-limit";
import { z } from "zod";

const FreeCheckRequestSchema = z.object({
  websiteUrl: z.string().url("Invalid website URL"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  sessionToken: z.string().optional(),
  ipData: z.object({
    ip: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    org: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = FreeCheckRequestSchema.parse(body);

    const { websiteUrl, email, phone, sessionToken, ipData } = validatedData;

    logger.info("Free valuation check started", {
      websiteUrl,
      email,
      sessionToken: sessionToken?.substring(0, 10) + "...",
      country: ipData?.country,
    });

    // Rate limiting check (session token-based)
    const adminClient = createAdminClient();

    if (!sessionToken) {
      logger.warn("No session token provided");
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 }
      );
    }

    const rateLimitResult = await checkAndIncrementRateLimit(
      sessionToken,
      5,
      adminClient,
      {
        ip: ipData?.ip,
        country: ipData?.country,
        city: ipData?.city,
        isp: ipData?.org,
      }
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded", {
        email,
        sessionToken: sessionToken.substring(0, 10) + "...",
        remaining: rateLimitResult.remaining,
      });

      return NextResponse.json(
        {
          error: "Daily limit reached",
          message: "You've used all 5 free valuations for today. Your limit resets at midnight UTC.",
          remainingChecks: 0,
          resetsAt: rateLimitResult.resetsAt,
        },
        { status: 429 }
      );
    }

    logger.info("Rate limit check passed", {
      email,
      sessionToken: sessionToken.substring(0, 10) + "...",
      remaining: rateLimitResult.remaining,
    });

    // Step 1: Extract profile from website
    let extractedData;
    try {
      extractedData = await extractProfileFromPitchDeck("", websiteUrl);
      logger.info("Profile extracted from website", {
        companyName: extractedData.autoExtracted.companyName,
        stage: extractedData.autoExtracted.stage,
        confidence: extractedData.extractionConfidence,
      });
    } catch (error) {
      logger.error("Failed to extract profile from website", error);
      return NextResponse.json(
        {
          error: "Could not analyze website. Please ensure it's a valid startup website with publicly available information.",
          details: String(error),
        },
        { status: 400 }
      );
    }

    // Build startup profile from extracted data
    const data = extractedData.autoExtracted;

    // Map extracted industry to valid types
    const mapIndustry = (rawIndustry: string): "saas" | "ai" | "fintech" | "deeptech" | "other" => {
      const ind = String(rawIndustry || "").toLowerCase();
      if (ind.includes("ai") || ind.includes("ml") || ind.includes("machine learning")) return "ai";
      if (ind.includes("fintech") || ind.includes("finance") || ind.includes("crypto")) return "fintech";
      if (ind.includes("deep") || ind.includes("biotech") || ind.includes("hardware")) return "deeptech";
      if (ind.includes("saas") || ind.includes("software") || ind.includes("platform")) return "saas";
      return "other";
    };

    const profile = {
      id: "",
      userId: "",
      companyName: data.companyName || "Unknown Company",
      tagline: data.tagline || "",
      websiteUrl: data.websiteUrl || websiteUrl || "",
      stage: (data.stage || "seed") as "pre-revenue" | "seed" | "series-a" | "series-b+",
      industry: mapIndustry(data.industry),
      founded: data.founded ? String(data.founded) : undefined,
      headquarters: data.headquarters || data.location || "",
      team: data.team || [],
      annualRecurringRevenue: data.annualRecurringRevenue || 0,
      monthlyRecurringRevenue: data.monthlyRecurringRevenue || 0,
      monthlyGrowthRate: data.monthlyGrowthRate || 0,
      totalAddressableMarket: data.totalAddressableMarket || 0,
      marketDescription: data.description || "",
      competitiveAdvantage: data.competitiveMoat || "",
      patentCount: data.hasPatent ? 1 : 0,
      moatScore: 50,
      fundingHistory: [],
      totalFunded: data.fundingRaised || 0,
      customerCount: data.customerCount || 0,
      customValuationContext: {},
      additionalFactors: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Step 2: Run 4 valuation methods for free version
    logger.info("Running 4 valuation methods", {
      company: profile.companyName,
    });

    const [scorecardResult, berkusResult, dcfLTGResult, evalDamResult] = await Promise.allSettled([
      new ScorecardMethod(profile).execute(),
      new BerkusMethod(profile).execute(),
      new DCFLTGMethod(profile).execute(),
      new EvalDamScoreMethod(profile).execute(),
    ]);

    // Collect all method results
    let scorecardValue = null;
    let berkusValue = null;
    let dcfLTGValue = null;
    let evalDamValue = null;
    let reasoning = "";
    const methodResults: Array<{ name: string; value: number | null }> = [];

    if (scorecardResult.status === "fulfilled") {
      scorecardValue = scorecardResult.value.midEstimate;
      reasoning = scorecardResult.value.reasoning;
      methodResults.push({ name: "Scorecard Method", value: scorecardValue });
    } else {
      logger.warn("Scorecard method failed", scorecardResult.reason);
    }

    if (berkusResult.status === "fulfilled") {
      berkusValue = berkusResult.value.midEstimate;
      methodResults.push({ name: "Berkus Method", value: berkusValue });
    } else {
      logger.warn("Berkus method failed", berkusResult.reason);
    }

    if (dcfLTGResult.status === "fulfilled") {
      dcfLTGValue = dcfLTGResult.value.midEstimate;
      methodResults.push({ name: "DCF Long-Term Growth", value: dcfLTGValue });
    } else {
      logger.warn("DCF LTG method failed", dcfLTGResult.reason);
    }

    if (evalDamResult.status === "fulfilled") {
      evalDamValue = evalDamResult.value.midEstimate;
      methodResults.push({ name: "Evaldam Score", value: evalDamValue });
    } else {
      logger.warn("Evaldam Score method failed", evalDamResult.reason);
    }

    // Calculate blended valuation from available results
    const validValues = methodResults
      .filter((m) => m.value !== null && m.value > 0)
      .map((m) => m.value as number);

    let blendedMid: number;
    if (validValues.length > 0) {
      blendedMid = Math.round(
        validValues.reduce((a, b) => a + b, 0) / validValues.length
      );
    } else {
      return NextResponse.json(
        { error: "Valuation calculation failed. Please try again." },
        { status: 500 }
      );
    }

    // Generate range (±20%)
    const rangeLow = Math.round(blendedMid * 0.8);
    const rangeHigh = Math.round(blendedMid * 1.2);

    // Extract 3 key reasons from reasoning text (simplified)
    const keyReasons = reasoning
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, 3)
      .map((line) => line.replace(/^[-•]\s*/, "").trim());

    logger.info("Valuation calculated", {
      blendedMid,
      low: rangeLow,
      high: rangeHigh,
    });

    // Step 3: Save lead to database
    const { error: dbError } = await adminClient.from("leads").insert({
      email,
      phone: phone || null,
      website_url: websiteUrl,
      ip_address: ipData?.ip || null,
      country: ipData?.country || null,
      city: ipData?.city || null,
      isp: ipData?.org || null,
      valuation_low: rangeLow,
      valuation_mid: blendedMid,
      valuation_high: rangeHigh,
      company_name: profile.companyName,
    });

    if (dbError) {
      logger.warn("Failed to save lead to database", dbError);
      // Don't fail the response - we still want to return the valuation
    } else {
      logger.info("Lead saved successfully", { email });
    }

    // Step 4: Send emails (non-blocking)
    const valTemplate = valuationResultsEmailTemplate({
      companyName: profile.companyName,
      email,
      valuationLow: rangeLow,
      valuationMid: blendedMid,
      valuationHigh: rangeHigh,
      scorecard: scorecardValue || undefined,
      berkus: berkusValue || undefined,
      keyReasons,
      website: websiteUrl,
    });

    const leadTemplate = newLeadNotificationEmailTemplate({
      companyName: profile.companyName,
      email,
      phone,
      website: websiteUrl,
      country: ipData?.country,
      valuationLow: rangeLow,
      valuationMid: blendedMid,
      valuationHigh: rangeHigh,
    });

    // Send email to lead (don't wait for it)
    sendEmail({
      recipients: { to: [email] },
      content: {
        subject: `Your Free Startup Valuation — ${profile.companyName}`,
        htmlBody: valTemplate.html,
        textBody: valTemplate.text,
      },
    }).catch((err) => {
      logger.warn("Failed to send valuation email to lead", { email, error: String(err) });
    });

    // Send admin notification (don't wait for it)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail({
        recipients: { to: [adminEmail] },
        content: {
          subject: `New Lead: ${profile.companyName} — $${(blendedMid / 1000000).toFixed(1)}M`,
          htmlBody: leadTemplate.html,
          textBody: leadTemplate.text,
        },
      }).catch((err) => {
        logger.warn("Failed to send new lead notification", { adminEmail, error: String(err) });
      });
    }

    // Step 5: Return results with all 4 methods
    return NextResponse.json({
      success: true,
      data: {
        companyName: profile.companyName,
        industry: profile.industry,
        stage: profile.stage,
        valuation: {
          low: rangeLow,
          mid: blendedMid,
          high: rangeHigh,
        },
        methods: {
          scorecard: scorecardValue,
          berkus: berkusValue,
          dcfLTG: dcfLTGValue,
          evalDamScore: evalDamValue,
        },
        methodResults: methodResults, // For detailed display
        keyReasons: keyReasons.length > 0 ? keyReasons : ["Based on available market data and company metrics."],
      },
    });
  } catch (error) {
    logger.error("Free valuation check error", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process valuation check", details: String(error) },
      { status: 500 }
    );
  }
}
