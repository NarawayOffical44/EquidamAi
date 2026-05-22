"use client";

import { useReportWebVitals } from "next/web-vitals";
import { hasAnalyticsConsent } from "@/lib/analytics/consent";

type WebVitalsMetric = Parameters<typeof useReportWebVitals>[0] extends (metric: infer Metric) => void
  ? Metric
  : never;

function reportMetric(metric: WebVitalsMetric) {
  if (!hasAnalyticsConsent()) return;

  const payload = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
    pathname: window.location.pathname,
  };

  window.gtag?.("event", "web_vital", {
    metric_id: payload.id,
    metric_name: payload.name,
    metric_value: Math.round(payload.name === "CLS" ? payload.value * 1000 : payload.value),
    metric_delta: Math.round(payload.name === "CLS" ? payload.delta * 1000 : payload.delta),
    metric_rating: payload.rating,
    page_path: payload.pathname,
    non_interaction: true,
  });

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/web-vitals", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/analytics/web-vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function WebVitalsReporter() {
  useReportWebVitals(reportMetric);
  return null;
}
