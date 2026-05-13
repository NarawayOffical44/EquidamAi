"use client";

import { useEffect } from "react";
import { captureLeadAttribution } from "@/lib/leads/client-attribution";

export function AttributionCapture() {
  useEffect(() => {
    captureLeadAttribution();
  }, []);

  return null;
}
