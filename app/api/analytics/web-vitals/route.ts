import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trackServerEvent } from "@/lib/analytics/server-ga4";

const WebVitalsSchema = z.object({
  id: z.string().max(120),
  name: z.enum(["TTFB", "FCP", "LCP", "FID", "CLS", "INP"]),
  value: z.number().finite().nonnegative(),
  delta: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  navigationType: z.string().max(40).optional(),
  pathname: z.string().max(300).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = WebVitalsSchema.parse(await request.json());
    const normalizedValue = payload.name === "CLS" ? payload.value * 1000 : payload.value;
    const normalizedDelta = payload.name === "CLS" ? payload.delta * 1000 : payload.delta;

    await trackServerEvent("web_vital", {
      metric_id: payload.id,
      metric_name: payload.name,
      metric_value: Math.round(normalizedValue),
      metric_delta: Math.round(normalizedDelta),
      metric_rating: payload.rating,
      navigation_type: payload.navigationType,
      page_path: payload.pathname,
    });

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid web vital metric" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to record web vital metric" }, { status: 500 });
  }
}
