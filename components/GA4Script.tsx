'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export function GA4Script() {
  const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  useEffect(() => {
    if (!GA4_MEASUREMENT_ID) return;

    // Initialize Google Analytics 4
    window.dataLayer = window.dataLayer || [];
    function gtag(command: string, ...args: any[]) {
      window.dataLayer?.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA4_MEASUREMENT_ID, {
      anonymize_ip: true,
    });

    // Track page view
    gtag('event', 'page_view', {
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }, [GA4_MEASUREMENT_ID]);

  if (!GA4_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
      />
    </>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (command: string, ...args: any[]) => void;
  }
}
