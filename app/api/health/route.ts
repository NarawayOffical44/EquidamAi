import { NextResponse } from "next/server";
import { getMissingRequiredEnvVars } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const missingEnv = getMissingRequiredEnvVars();
  const strict = new URL(request.url).searchParams.get("strict") === "1";
  const envOk = missingEnv.length === 0;

  return NextResponse.json(
    {
      status: envOk ? "ok" : "degraded",
      service: "evaldam",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks: {
        env: {
          ok: envOk,
          missing: missingEnv,
        },
      },
    },
    {
      status: strict && !envOk ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
