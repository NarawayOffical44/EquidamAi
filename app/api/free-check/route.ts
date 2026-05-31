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
import { checkAndIncrementRateLimits, getFreeToolDailyLimit } from "@/lib/utils/rate-limit";
import { enrichStartupData, mergeEnrichedData } from "@/lib/valuation/data-enricher";
import { calculateConfidenceScore, getConfidenceLabel } from "@/lib/valuation/confidence-calculator";
import { getMethodWeights, calculateWeightedValuation } from "@/lib/valuation/method-weighting";
import { fetchPublicValuationData, compareToPublicValuation } from "@/lib/valuation/data-fetchers/public-valuation-fetcher";
import { buildSignalAnalysis } from "@/lib/valuation/signal-analysis";
import { withLeadAttribution } from "@/lib/leads/attribution";
import { insertLead } from "@/lib/leads/store";
import { trackServerEvent } from "@/lib/analytics/server-ga4";
import { z } from "zod";

const FreeCheckRequestSchema = z.object({
  websiteUrl: z.string().url("Invalid website URL"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(3, "Phone number required"),
  sessionToken: z.string().optional(),
  ipData: z.object({
    ip: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    org: z.string().optional(),
  }).optional(),
  attribution: z.unknown().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = FreeCheckRequestSchema.parse(body);

    const { websiteUrl, email, phone, sessionToken, ipData, attribution } = validatedData;

    logger.info("Free valuation check started", {
      websiteUrl,
      email,
      sessionToken: sessionToken?.substring(0, 10) + "...",
      country: ipData?.country,
    });

    // Rate limiting check (session token + submitted details).
    const adminClient = createAdminClient();

    if (!sessionToken) {
      logger.warn("No session token provided");
      return NextResponse.json(
        { error: "Session token required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, "") || phone.trim().toLowerCase();
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientIp = ipData?.ip || forwardedFor || request.headers.get("x-real-ip") || undefined;

    const dailyLimit = getFreeToolDailyLimit("FREE_VALUATION_DAILY_LIMIT");
    const rateLimitResult = await checkAndIncrementRateLimits(
      [
        `free-check:session:${sessionToken}`,
        `free-check:email:${normalizedEmail}`,
        `free-check:phone:${normalizedPhone}`,
      ],
      dailyLimit,
      adminClient,
      {
        ip: clientIp,
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
        limitedBy: rateLimitResult.limitedBy,
      });

      return NextResponse.json(
        {
          error: "Daily limit reached",
          message: `You've used all ${dailyLimit} free valuations for today. Your limit resets at midnight UTC.`,
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

    // Step 1: Fetch and extract profile from website
    let extractedData;
    try {
      // Fetch actual website content
      let websiteContent = "";
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(websiteUrl, {
          headers: {
            "User-Agent": "Evaldam-Bot/1.0 (+https://equidamai.com/bot)",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const html = await response.text();
          // Extract text content (basic parsing)
          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 8000); // First 8000 chars
          websiteContent = `Website URL: ${websiteUrl}\n\nContent:\n${textContent}`;
        }
      } catch (fetchError) {
        logger.warn("Failed to fetch website content", { error: String(fetchError) });
        // Fall back to just URL
        websiteContent = `Website URL: ${websiteUrl}`;
      }

      extractedData = await extractProfileFromPitchDeck(websiteContent, websiteUrl);
      logger.info("Profile extracted from website", {
        companyName: extractedData.autoExtracted.companyName,
        stage: extractedData.autoExtracted.stage,
        confidence: extractedData.extractionConfidence,
      });
    } catch (error) {
      logger.error("Failed to extract profile from website", error);
      return NextResponse.json(
        {
          error: "Could not analyze website. Please ensure it's a valid startup website.",
          details: String(error),
        },
        { status: 400 }
      );
    }

    // Build startup profile from extracted data
    const data = extractedData.autoExtracted;

    // Validate critical fields before proceeding
    if (!data.companyName) {
      return NextResponse.json(
        {
          error: "Could not identify company name from website. Please try another URL.",
        },
        { status: 400 }
      );
    }

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
      companyName: data.companyName,
      tagline: data.tagline || "",
      websiteUrl: data.websiteUrl || websiteUrl || "",
      stage: (data.stage || "seed") as "pre-revenue" | "seed" | "series-a" | "series-b+",
      industry: mapIndustry(data.industry),
      founded: data.founded ? String(data.founded) : undefined,
      headquarters: data.headquarters || data.location || "",
      team: data.team || [],
      annualRecurringRevenue: Math.max(0, data.annualRecurringRevenue || 0),
      monthlyRecurringRevenue: Math.max(0, data.monthlyRecurringRevenue || 0),
      monthlyGrowthRate: Math.max(0, data.monthlyGrowthRate || 0),
      totalAddressableMarket: Math.max(0, data.totalAddressableMarket || 0),
      marketDescription: data.description || "",
      competitiveAdvantage: data.competitiveMoat || "",
      patentCount: data.hasPatent ? 1 : 0,
      moatScore: data.moatScore || 50,
      fundingHistory: [],
      totalFunded: data.fundingRaised || 0,
      customerCount: data.customerCount || 0,
      customValuationContext: {},
      additionalFactors: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Step 1.5: Enrich profile with external data (Crunchbase, LinkedIn, News, MCA)
    logger.info("Enriching startup data with external sources", {
      company: profile.companyName,
    });
    const enrichedData = await enrichStartupData(profile, websiteUrl);
    const enrichedProfile = mergeEnrichedData(profile, enrichedData);

    // Step 1.6: Fetch public valuation data (if available)
    const publicValuationData = await fetchPublicValuationData(profile.companyName);
    if (publicValuationData.knownValuation) {
      logger.info("Found public valuation data", {
        company: profile.companyName,
        valuation: publicValuationData.knownValuation,
      });
      enrichedData.confidence.valuation = true; // Mark that we have valuation data
    }

    // Calculate confidence score based on data completeness
    const confidenceScore = calculateConfidenceScore(enrichedData.confidence);
    const confidenceResult = getConfidenceLabel(confidenceScore);

    logger.info("Confidence score calculated", {
      company: profile.companyName,
      score: confidenceScore,
      label: confidenceResult.label,
      enrichmentSources: enrichedData.enrichmentSources,
    });

    // Step 2: Run 4 valuation methods for free version (with enriched data)
    logger.info("Running 4 valuation methods", {
      company: enrichedProfile.companyName,
      arr: enrichedProfile.annualRecurringRevenue,
      enrichmentSources: enrichedData.enrichmentSources,
    });

    const [scorecardResult, berkusResult, dcfLTGResult, evalDamResult] = await Promise.allSettled([
      new ScorecardMethod(enrichedProfile).execute(),
      new BerkusMethod(enrichedProfile).execute(),
      new DCFLTGMethod(enrichedProfile).execute(),
      new EvalDamScoreMethod(enrichedProfile).execute(),
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
      methodResults.push({ name: "Website Signal Score", value: evalDamValue });
    } else {
      logger.warn("Website signal score method failed", evalDamResult.reason);
    }

    // Calculate blended valuation with ARR-based dynamic weighting
    interface MethodValue {
      name: string;
      value: number;
      confidence: "high" | "medium" | "low";
    }

    const methodsWithConfidence: MethodValue[] = [];

    // Use ARR-based dynamic weighting (better for large companies like GitHub)
    const arr = enrichedProfile.annualRecurringRevenue || 0;
    const dynamicWeights = getMethodWeights(arr);
    const companyStage = enrichedProfile.stage;

    // Assign confidence based on data availability and ARR
    if (scorecardValue !== null && dynamicWeights.scorecard > 0) {
      methodsWithConfidence.push({
        name: "scorecard",
        value: scorecardValue,
        confidence:
          companyStage === "pre-revenue" || companyStage === "seed"
            ? "high"
            : "medium",
      });
    }

    if (berkusValue !== null && dynamicWeights.berkus > 0) {
      methodsWithConfidence.push({
        name: "berkus",
        value: berkusValue,
        confidence:
          companyStage === "pre-revenue" || companyStage === "seed"
            ? "high"
            : "medium",
      });
    }

    if (dcfLTGValue !== null && dynamicWeights.dcfLTG > 0) {
      methodsWithConfidence.push({
        name: "dcfLTG",
        value: dcfLTGValue,
        confidence:
          (enrichedProfile.annualRecurringRevenue ?? 0) > 0 ? "high" : "low",
      });
    }

    if (evalDamValue !== null && dynamicWeights.evaldamScore > 0) {
      methodsWithConfidence.push({
        name: "evalDamScore",
        value: evalDamValue,
        confidence: "medium",
      });
    }

    if (methodsWithConfidence.length === 0) {
      return NextResponse.json(
        { error: "Valuation calculation failed. Please try again." },
        { status: 500 }
      );
    }

    // Detect outliers using median
    const values = methodsWithConfidence.map((m) => m.value);
    const sortedValues = [...values].sort((a, b) => a - b);
    const median =
      sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] +
            sortedValues[sortedValues.length / 2]) /
          2
        : sortedValues[Math.floor(sortedValues.length / 2)];

    // Filter outliers (values >50% away from median)
    const filteredMethods = methodsWithConfidence.filter((m) => {
      const deviation = median > 0 ? Math.abs(m.value - median) / median : 0;
      return deviation < 0.5;
    });
    const methodsForValuation =
      filteredMethods.length > 0 ? filteredMethods : methodsWithConfidence;
    const includedMethodNames = new Set(methodsForValuation.map((m) => m.name));

    // Calculate weighted blended valuation using ARR-based dynamic weights
    const blendedMid = calculateWeightedValuation(
      {
        scorecard: includedMethodNames.has("scorecard")
          ? scorecardValue || undefined
          : undefined,
        berkus: includedMethodNames.has("berkus")
          ? berkusValue || undefined
          : undefined,
        vcMethod: undefined, // Not available in free tier (4 methods only)
        dcfLTG: includedMethodNames.has("dcfLTG")
          ? dcfLTGValue || undefined
          : undefined,
        dcfMultiples: undefined, // Not available in free tier
        evaldamScore: includedMethodNames.has("evalDamScore")
          ? evalDamValue || undefined
          : undefined,
      },
      dynamicWeights
    );

    // Determine overall confidence
    const highConfidenceCount = methodsWithConfidence.filter(
      (m) => m.confidence === "high"
    ).length;
    const overallConfidence =
      highConfidenceCount >= 2
        ? ("high" as const)
        : highConfidenceCount === 1
          ? ("medium" as const)
          : ("low" as const);

    // Generate adaptive asymmetric range based on method spread
    // Low range: conservative (limited by minimum method valuation)
    // High range: optimistic scenario including marketing/sales potential (50-70% upside)
    const maxValue = Math.max(...methodsForValuation.map((m) => m.value));
    const minValue = Math.min(...methodsForValuation.map((m) => m.value));
    const spread = maxValue - minValue;

    // Conservative range (downside): ±20% from mid or based on method spread (whichever is more conservative)
    const downside = Math.max(20, Math.min(30, (spread / blendedMid) * 100));
    const rangeLow = Math.round(blendedMid * (1 - downside / 100));

    // Optimistic range (upside): 50-70% depending on confidence and stage
    // Higher confidence + later stage = higher optimistic multiplier
    // This reflects: base valuation + marketing/sales execution scenarios
    const hasHighConfidence = overallConfidence === "high";
    const isLaterStage = ["series-a", "series-b+"].includes(profile.stage);
    const optimisticMultiplier = isLaterStage
      ? hasHighConfidence ? 0.65 : 0.55
      : hasHighConfidence ? 0.55 : 0.45;
    const rangeHigh = Math.round(blendedMid * (1 + optimisticMultiplier));

    // Extract 3 key reasons from reasoning text (simplified)
    const keyReasons = reasoning
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, 3)
      .map((line) => line.replace(/^[-•]\s*/, "").trim());

    // Add valuation range explanation for transparency
    const rangeExplanation = `
Range Breakdown:
• Low: ${(rangeLow / 1000000).toFixed(1)}M - Conservative scenario (current traction + organic growth)
• Mid: ${(blendedMid / 1000000).toFixed(1)}M - Base case directional estimate
• High: ${(rangeHigh / 1000000).toFixed(1)}M - Optimistic scenario (successful marketing/sales execution + market timing)

The high estimate assumes strong execution on marketing and sales initiatives, which are key value drivers.
Get the full report to see detailed breakdowns for each scenario and market comparables.
`;

    logger.info("Valuation calculated", {
      blendedMid,
      low: rangeLow,
      high: rangeHigh,
    });

    // Step 3: Save free valuation lead to database.
    const leadMetadata = withLeadAttribution(request, {
      source: "free_valuation",
      websiteUrl,
      companyName: profile.companyName,
      useCase: "Free valuation preview",
    }, attribution);

    const { error: dbError } = await insertLead(adminClient, {
      email,
      phone: phone || null,
      website_url: websiteUrl,
      metadata: leadMetadata,
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

    trackServerEvent("free_valuation_submitted", {
      industry: enrichedProfile.industry,
      startup_stage: enrichedProfile.stage,
      valuation_mid: blendedMid,
      value: blendedMid,
      currency: "USD",
      confidence_score: confidenceScore,
      has_public_valuation: Boolean(publicValuationData.knownValuation),
    }).catch((err) => {
      logger.warn("Failed to track free valuation server event", { error: String(err) });
    });

    // Step 4: Send result email and admin notification (non-blocking).
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

    sendEmail({
      recipients: { to: [email] },
      content: {
        subject: `Your free valuation preview for ${profile.companyName}`,
        htmlBody: valTemplate.html,
        textBody: valTemplate.text,
      },
    }).then((result) => {
      if (!result.success) {
        logger.warn("Failed to send valuation email to lead", { email, error: result.error });
      }
    }).catch((err) => {
      logger.warn("Failed to send valuation email to lead", { email, error: String(err) });
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail({
        recipients: { to: [adminEmail] },
        content: {
          subject: `New lead: ${profile.companyName} - $${(blendedMid / 1000000).toFixed(1)}M`,
          htmlBody: leadTemplate.html,
          textBody: leadTemplate.text,
        },
      }).then((result) => {
        if (!result.success) {
          logger.warn("Failed to send new lead notification", { adminEmail, error: result.error });
        }
      }).catch((err) => {
        logger.warn("Failed to send new lead notification", { adminEmail, error: String(err) });
      });
    }

    const emailSequenceUrl = new URL('/api/leads/email-sequence', request.url);
    fetch(emailSequenceUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        companyName: profile.companyName,
        valuationMid: blendedMid,
      }),
    }).catch((err) => {
      logger.warn("Failed to enroll lead in email sequence", { email, error: String(err) });
    });

    // Step 5: Return results with confidence score + enrichment sources + public valuation comparison
    const publicComparison = publicValuationData.knownValuation
      ? compareToPublicValuation(blendedMid, publicValuationData)
      : null;
    const signalAnalysis = buildSignalAnalysis({
      profile: enrichedProfile,
      confidence: enrichedData.confidence,
      confidenceScore,
      methods: methodsForValuation,
      publicComparison,
      rangeLow,
      rangeHigh,
    });

    const response: {
      success: boolean;
      data: Record<string, unknown> & { publicValuation?: unknown };
    } = {
      success: true,
      data: {
        companyName: enrichedProfile.companyName,
        industry: enrichedProfile.industry,
        stage: enrichedProfile.stage,
        valuation: {
          low: rangeLow,
          mid: blendedMid,
          high: rangeHigh,
        },
        valuationExplanation: rangeExplanation.trim(),
        confidence: {
          score: confidenceScore,
          label: confidenceResult.label,
          color: confidenceResult.color,
          message: confidenceResult.message,
          nextSteps: confidenceResult.nextSteps,
          fieldsToAdd: confidenceResult.fieldsToAdd,
        },
        enrichmentSources: enrichedData.enrichmentSources,
        methods: {
          scorecard: scorecardValue,
          berkus: berkusValue,
          dcfLTG: dcfLTGValue,
          evalDamScore: evalDamValue,
        },
        methodConfidence: Object.fromEntries(
          methodsWithConfidence.map((m) => [m.name, m.confidence])
        ),
        methodResults: methodResults,
        signalAnalysis,
        keyReasons: keyReasons.length > 0 ? keyReasons : ["Based on available market data and company metrics."],
        disclaimer: "This free valuation uses 4 methods with dynamic weighting based on company size. Public enrichment is used when available and configured. Get full professional reports with all 6 methods, detailed market analysis, comparable context, sensitivity analysis, and PDF export.",
      },
    };

    // Add public valuation comparison if available
    if (publicValuationData.knownValuation && publicComparison) {
      response.data.publicValuation = {
        knownValuation: publicValuationData.knownValuation,
        source: publicValuationData.roundOrType,
        date: publicValuationData.date,
        comparison: publicComparison,
      };
    }

    return NextResponse.json(response);
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
