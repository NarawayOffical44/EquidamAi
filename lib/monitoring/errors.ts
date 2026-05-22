import { createAdminClient } from "@/lib/supabase/admin";

export type ErrorSeverity = "info" | "warning" | "error" | "fatal";
export type ErrorSource = "client" | "server" | "route_boundary" | "global_boundary";

type CaptureErrorInput = {
  source: ErrorSource;
  message: string;
  name?: string;
  stack?: string;
  digest?: string;
  severity?: ErrorSeverity;
  path?: string;
  componentStack?: string;
  metadata?: Record<string, unknown>;
};

function trim(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.slice(0, maxLength) : undefined;
}

export async function captureServerError(input: CaptureErrorInput) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Captured application error", {
        source: input.source,
        message: input.message,
        name: input.name,
        digest: input.digest,
        path: input.path,
      });
      return;
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.from("error_events").insert({
      source: input.source,
      level: input.severity || "error",
      message: trim(input.message, 1000) || "Unknown application error",
      name: trim(input.name, 120) || null,
      stack: trim(input.stack, 8000) || null,
      digest: trim(input.digest, 120) || null,
      component_stack: trim(input.componentStack, 4000) || null,
      path: trim(input.path, 300) || null,
      metadata: input.metadata || {},
    });

    if (error) {
      console.error("Failed to persist application error", {
        message: error.message,
        source: input.source,
        capturedMessage: input.message,
      });
    }
  } catch (error) {
    console.error("Error monitoring capture failed", error instanceof Error ? error.message : String(error));
  }
}
