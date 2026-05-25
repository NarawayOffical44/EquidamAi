import Script from "next/script";
const ADSENSE_CLIENT_ID = "ca-pub-1786643855119477";
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

export function GoogleAdSenseScript() {
  return (
    <Script
      id="google-adsense"
      strategy="afterInteractive"
      async
      src={ADSENSE_SCRIPT_SRC}
      crossOrigin="anonymous"
      data-ad-client={ADSENSE_CLIENT_ID}
    />
  );
}
