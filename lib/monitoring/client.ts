"use client";

export type ClientErrorSource = "client" | "route_boundary" | "global_boundary";

type ClientErrorInput = {
  source: ClientErrorSource;
  message: string;
  name?: string;
  stack?: string;
  digest?: string;
  componentStack?: string;
  path?: string;
  metadata?: Record<string, unknown>;
};

function trim(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.slice(0, maxLength) : undefined;
}

export function reportClientError(input: ClientErrorInput) {
  if (typeof window === "undefined") return;

  const payload = {
    source: input.source,
    message: trim(input.message, 1000) || "Unknown client error",
    name: trim(input.name, 120),
    stack: trim(input.stack, 8000),
    digest: trim(input.digest, 120),
    componentStack: trim(input.componentStack, 4000),
    path: trim(input.path || window.location.pathname, 300),
    userAgent: trim(window.navigator.userAgent, 500),
    metadata: input.metadata || {},
  };

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/monitoring/error", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/monitoring/error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
