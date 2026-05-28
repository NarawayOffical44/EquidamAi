"use client";

import Script from "next/script";

const DEFAULT_GA4_MEASUREMENT_ID = "G-TPJBBP9TKQ";

export function GA4Script() {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || DEFAULT_GA4_MEASUREMENT_ID;

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
            function evaldamHasAnalyticsConsent(){
              try {
                if (window.localStorage && window.localStorage.getItem('evaldam_cookie_consent') === 'accepted') return true;
              } catch (e) {}
              return document.cookie.split('; ').some(function(item){ return item === 'evaldam_cookie_consent=accepted'; });
            }
            gtag('consent', 'default', {
              analytics_storage: evaldamHasAnalyticsConsent() ? 'granted' : 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });
            window.evaldamInitGA4 = window.evaldamInitGA4 || function(){
              if (window.evaldamGA4Initialized) return;
              window.evaldamGA4Initialized = true;
              gtag('js', new Date());
              gtag('config', '${measurementId}', { anonymize_ip: true });
            };
            window.evaldamInitGA4();
            window.addEventListener('evaldam:analytics-consent', function(event){
              gtag('consent', 'update', {
                analytics_storage: event.detail === 'accepted' ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
            });
          `,
        }}
      />
    </>
  );
}
