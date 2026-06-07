import { NextResponse } from "next/server";
import { getMissingLlmEnvVars, getMissingRequiredEnvVars } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const missingEnv = getMissingRequiredEnvVars();
  const missingLlmEnv = getMissingLlmEnvVars();
  const strict = new URL(request.url).searchParams.get("strict") === "1";
  const envOk = missingEnv.length === 0;
  const llmOk = missingLlmEnv.length === 0;
  const ok = envOk && llmOk;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      service: "evaldam",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks: {
        env: {
          ok: envOk,
          missing: missingEnv,
        },
        llm: {
          ok: llmOk,
          missing: missingLlmEnv,
        },
      },
    },
    {
      status: strict && !ok ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
