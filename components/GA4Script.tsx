"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getAnalyticsConsent } from "@/lib/analytics/consent";

const DEFAULT_GA4_MEASUREMENT_ID = "G-YPLREJKKVK";

export function GA4Script() {
  const [enabled, setEnabled] = useState(false);
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || DEFAULT_GA4_MEASUREMENT_ID;

  useEffect(() => {
    const syncConsent = () => setEnabled(getAnalyticsConsent() === "accepted");
    syncConsent();
    window.addEventListener("evaldam:analytics-consent", syncConsent);
    return () => window.removeEventListener("evaldam:analytics-consent", syncConsent);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="ga4-script"
        strategy="afterInteractive"
        data-cookie-consent="analytics"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            window.evaldamInitGA4 = window.evaldamInitGA4 || function(){
              if (window.evaldamGA4Initialized) return;
              window.evaldamGA4Initialized = true;
              gtag('js', new Date());
              gtag('config', '${measurementId}', { anonymize_ip: true });
            };
            window.evaldamInitGA4();
          `,
        }}
      />
    </>
  );
}
