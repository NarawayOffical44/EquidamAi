import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAiLimitMessage, getAiUsageAccess, recordAiUsageUse } from "@/lib/india-finance-ai/usage-limits";

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

    const result = calculatePreview(payload);
    const usage = await recordAiUsageUse(access.key, access.usage);

    return NextResponse.json({
      success: true,
      data: {
        result,
        usage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid preview inputs", details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not calculate valuation preview" }, { status: 500 });
  }
}

function calculatePreview(payload: z.infer<typeof PreviewSchema>) {
  const stageBase: Record<string, number> = {
    "pre-revenue": 350_000,
    seed: 1_200_000,
    "series-a": 5_000_000,
    "series-b+": 15_000_000,
  };
  const revenueMultiple: Record<string, number> = {
    "pre-revenue": 4,
    seed: 7,
    "series-a": 9,
    "series-b+": 11,
  };
  const base = stageBase[payload.stage] || stageBase.seed;
  const revenueValue = payload.arr * (revenueMultiple[payload.stage] || 7);
  const teamPremium = Math.min(payload.teamSize, 50) * 45_000;
  const growthPremium = payload.arr * Math.max(payload.monthlyGrowthRate, 0) * 0.45;
  const marketAnchor = payload.totalAddressableMarket ? Math.min(payload.totalAddressableMarket * 0.006, 10_000_000) : 0;
  const mid = Math.max(base, base + revenueValue * 0.45 + teamPremium + growthPremium + marketAnchor);
  const confidence = payload.arr > 0 && payload.teamSize > 0 && payload.totalAddressableMarket > 0
    ? "medium"
    : payload.teamSize > 0
      ? "early"
      : "low";

  return {
    companyName: payload.companyName,
    low: Math.max(50_000, mid * 0.65),
    mid,
    high: mid * 1.45,
    confidence,
  };
}
