import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ProfessionalValuationEngine } from "@/lib/valuation/professional-engine";
import type { Industry, StartupProfile } from "@/types";
import {
  getAiLimitMessage,
  getAiUsageAccess,
  recordAiUsageUseIfAvailable,
} from "@/lib/india-finance-ai/usage-limits";

export const dynamic = "force-dynamic";

const PreviewSchema = z.object({
  companyName: z.string().trim().max(120).optional().default(""),
  stage: z.enum(["pre-revenue", "seed", "series-a", "series-b+"]).default("seed"),
  industry: z.string().trim().max(80).optional().default(""),
  teamSize: z.coerce.number().min(0).max(100000).optional().default(0),
  arr: z.coerce.number().min(0).max(1_000_000_000_000).optional().default(0),
  monthlyGrowthRate: z.coerce.number().min(-100).max(1000).optional().default(0),
  totalAddressableMarket: z.coerce.number().min(0).max(100_000_000_000_000).optional().default(0),
});

export async function POST(request: NextRequest) {
  try {
    const payload = PreviewSchema.parse(await request.json().catch(() => null));
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Login is required for dashboard previews" }, { status: 401 });
    }

    const { data: startupContributorAccess } = await supabase
      .from("startup_card_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();

    if (startupContributorAccess) {
      return NextResponse.json(
        { error: "Startup contributor accounts can only update the shared startup card." },
        { status: 403 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const access = await getAiUsageAccess({
      supabase,
      sessionToken: "valuation-preview",
      ip,
      feature: "valuation_preview",
    });

    if (access.usage.upgradeRequired) {
      return NextResponse.json(
        {
          error: "Valuation preview limit reached",
          message: getAiLimitMessage(access.usage),
          usage: access.usage,
          upgradeUrl: "/pricing?plan=startup",
        },
        { status: 429 }
      );
    }

    const reservation = await recordAiUsageUseIfAvailable(access.key, access.usage);
    if (!reservation.allowed) {
      return NextResponse.json(
        {
          error: "Valuation preview limit reached",
          message: getAiLimitMessage(reservation.usage),
          usage: reservation.usage,
          upgradeUrl: "/pricing?plan=startup",
        },
        { status: 429 }
      );
    }

    const result = await calculatePreview(payload, user.id);

    return NextResponse.json({
      success: true,
      data: {
        result,
        usage: reservation.usage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid preview inputs", details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not calculate valuation preview" }, { status: 500 });
  }
}

async function calculatePreview(payload: z.infer<typeof PreviewSchema>, userId: string) {
  const profile = buildPreviewProfile(payload, userId);
  const valuation = await new ProfessionalValuationEngine(profile, userId, {
    includeEvaldamScore: false,
  }).execute();
  const methodNames = valuation.methods.map((method) => method.methodName);

  return {
    companyName: payload.companyName,
    low: valuation.blended.lowRange,
    mid: valuation.blended.weightedAverage,
    high: valuation.blended.highRange,
    confidence: valuation.confidenceLevel,
    currency: isIndianPreview(payload) ? "INR" : "USD",
    methods: methodNames,
    methodology: "professional-engine-preview-without-evaldam-score",
  };
}

function buildPreviewProfile(payload: z.infer<typeof PreviewSchema>, userId: string): StartupProfile {
  const now = new Date().toISOString();
  const teamSize = Math.min(Math.max(Math.round(payload.teamSize || 0), 0), 50);

  return {
    id: `preview_${Date.now()}`,
    userId,
    companyName: payload.companyName || "Preview company",
    stage: payload.stage,
    industry: normalizeIndustry(payload.industry),
    headquarters: isIndianPreview(payload) ? "India" : "United States",
    team: Array.from({ length: teamSize }, (_, index) => ({
      name: `Team member ${index + 1}`,
      role: "Team member",
    })),
    annualRecurringRevenue: payload.arr,
    monthlyGrowthRate: payload.monthlyGrowthRate,
    totalAddressableMarket: payload.totalAddressableMarket,
    customerCount: 0,
    grossMargin: payload.industry.toLowerCase().includes("saas") ? 75 : 60,
    customValuationContext: {},
    additionalFactors: {},
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeIndustry(industry: string): Industry {
  const value = industry.toLowerCase();
  if (value.includes("ai") || value.includes("machine learning") || value.includes("ml")) return "ai";
  if (value.includes("fintech") || value.includes("finance") || value.includes("payment")) return "fintech";
  if (value.includes("deeptech") || value.includes("deep tech") || value.includes("hardware") || value.includes("biotech")) return "deeptech";
  if (value.includes("saas") || value.includes("software") || value.includes("platform")) return "saas";
  return "other";
}

function isIndianPreview(payload: z.infer<typeof PreviewSchema>): boolean {
  const text = `${payload.companyName} ${payload.industry}`.toLowerCase();
  return /india|indian|inr|mumbai|delhi|bangalore|bengaluru|hyderabad|pune|chennai|kolkata/.test(text);
}
