'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const DEFAULT_GA4_MEASUREMENT_ID = 'G-TPJBBP9TKQ';

export function GA4Script() {
  const pathname = usePathname();
  const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || DEFAULT_GA4_MEASUREMENT_ID;

  useEffect(() => {
    if (!window.gtag) return;

    window.gtag('config', GA4_MEASUREMENT_ID, {
      page_path: `${pathname}${window.location.search}`,
      page_title: document.title,
      anonymize_ip: true,
    });
  }, [GA4_MEASUREMENT_ID, pathname]);

  return (
    <>
      <Script
        id="google-analytics-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA4_MEASUREMENT_ID}', { send_page_view: false, anonymize_ip: true });
          `,
        }}
      />
    </>
  );
}
