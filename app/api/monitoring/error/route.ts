import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureServerError } from "@/lib/monitoring/errors";

const ErrorEventSchema = z.object({
  source: z.enum(["client", "route_boundary", "global_boundary"]).default("client"),
  message: z.string().min(1).max(1000),
  name: z.string().max(120).optional(),
  stack: z.string().max(8000).optional(),
  digest: z.string().max(120).optional(),
  componentStack: z.string().max(4000).optional(),
  path: z.string().max(300).optional(),
  userAgent: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = ErrorEventSchema.parse(await request.json());
    await captureServerError({
      source: payload.source,
      message: payload.message,
      name: payload.name,
      stack: payload.stack,
      digest: payload.digest,
      componentStack: payload.componentStack,
      path: payload.path,
      metadata: {
        ...payload.metadata,
        userAgent: payload.userAgent,
        ip:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          null,
      },
    });

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid error event" }, { status: 400 });
    }

    console.error("Error monitoring endpoint failed", error);
    return NextResponse.json({ success: true }, { status: 202 });
  }
}
