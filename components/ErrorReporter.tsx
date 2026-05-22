"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/monitoring/client";

function errorName(error: unknown) {
  return error instanceof Error ? error.name : undefined;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unhandled promise rejection";
}

function errorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}

export function ErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportClientError({
        source: "client",
        message: event.message || "Unhandled client error",
        name: errorName(event.error),
        stack: errorStack(event.error),
        path: window.location.pathname,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      reportClientError({
        source: "client",
        message: errorMessage(event.reason),
        name: errorName(event.reason),
        stack: errorStack(event.reason),
        path: window.location.pathname,
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
