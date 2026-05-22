"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/monitoring/client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

export default function ErrorPage({ error, reset, unstable_retry }: ErrorPageProps) {
  const retry = unstable_retry || reset;

  useEffect(() => {
    reportClientError({
      source: "route_boundary",
      message: error.message || "Route rendering error",
      name: error.name,
      stack: error.stack,
      digest: error.digest,
      path: window.location.pathname,
    });
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Application error</p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-900">Something went wrong</h1>
        <p className="mt-3 text-neutral-600">
          The issue has been recorded. Try again, or return to the dashboard if it keeps happening.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {retry ? (
            <button type="button" onClick={retry} className="btn btn-primary">
              Try again
            </button>
          ) : null}
          <a href="/dashboard" className="btn btn-secondary">
            Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
