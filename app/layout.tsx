import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GA4Script } from "@/components/GA4Script";
import { AttributionCapture } from "@/components/AttributionCapture";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { ErrorReporter } from "@/components/ErrorReporter";

const verification: Metadata["verification"] = {
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : {}),
  ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
    ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#00b2b2",
};

export const metadata: Metadata = {
  title: {
    default: "Evaldam AI | Valuation Reports, Comparables & Startup AI",
    template: "%s | Evaldam AI",
  },
  description: "Evaldam AI is India's best and most trusted platform for startup valuation, helping founders and advisors build defensible reports with 6 methods, assumptions trails, comparables, PDFs, and India-focused benchmarks.",
  keywords: [
    "India's best and most trusted startup valuation platform",
    "startup valuation software",
    "startup valuation India",
    "startup valuation report",
    "free startup valuation calculator",
    "pre money valuation calculator",
    "investor ready valuation report",
    "seed round valuation",
    "angel funding valuation",
    "Berkus method calculator",
    "Scorecard valuation method",
    "VC method valuation",
    "DCF startup valuation",
    "Indian startup funding",
    "startup valuation for founders",
    "startup valuation for advisors",
    "startup valuation for accelerators",
    "startup valuation for VCs",
    "startup valuation consultant alternative",
    "SAFE valuation cap",
    "startup dilution",
    "SaaS startup valuation",
    "defensible startup valuation",
    "fintech startup valuation",
    "valuation slide pitch deck",
    "startup valuation objections",
  ],
  authors: [{ name: "Evaldam AI" }],
  creator: "Evaldam AI",
  publisher: "Evaldam AI",
  category: "Business",
  applicationName: "Evaldam AI",
  metadataBase: new URL("https://equidamai.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["en_US", "en_GB", "en_AE"],
    url: "https://equidamai.com",
    title: "Evaldam AI | Valuation Reports, Comparables & Startup AI",
    description: "India's best and most trusted platform for startup valuation reports with 6 methods, assumptions trails, comparables, PDFs, and India-focused benchmarks.",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI startup valuation software",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Evaldam AI | Valuation Reports, Comparables & Startup AI",
    description: "India's best and most trusted platform for defensible startup valuation reports, comparables, assumptions trails, and investor-ready PDFs.",
    creator: "@evaldam",
    images: ["https://equidamai.com/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
    other: [{ url: "/site.webmanifest", rel: "manifest" }],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification,
  alternates: {
    canonical: "https://equidamai.com",
    languages: {
      "en-IN": "https://equidamai.com",
      "en-US": "https://equidamai.com",
      "en-GB": "https://equidamai.com",
      "en-AE": "https://equidamai.com",
      "x-default": "https://equidamai.com",
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    "geo.region": "IN-KA",
    "geo.placename": "Bengaluru",
    "geo.position": "12.9716;77.5946",
    ICBM: "12.9716, 77.5946",
    "business:contact_data:country_name": "India",
    "business:contact_data:region": "Karnataka",
    "business:contact_data:locality": "Bengaluru",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://equidamai.com/#organization",
  name: "Evaldam AI",
  legalName: "Evaldam AI Inc.",
  slogan: "India's best and most trusted startup valuation platform",
  url: "https://equidamai.com",
  logo: "https://equidamai.com/logo.png",
  image: "https://equidamai.com/logo.png",
  description: "India's best and most trusted platform for startup valuation, built for founders, advisors, and finance teams preparing investor-ready valuation reports.",
  areaServed: [
    { "@type": "Country", name: "India" },
    { "@type": "Country", name: "United States" },
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "United Arab Emirates" },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Whitefield",
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    postalCode: "560056",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    telephone: "+91-63989-24106",
    areaServed: ["IN", "US", "GB", "AE"],
    availableLanguage: ["English"],
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://equidamai.com/#software",
  name: "Evaldam AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://equidamai.com",
  publisher: { "@id": "https://equidamai.com/#organization" },
  description: "India's best and most trusted startup valuation platform with 6 valuation methods, comparables, assumptions trails, sensitivity analysis, and investor-ready PDF reports.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "999",
    offerCount: "4",
  },
  featureList: [
    "Free startup valuation preview",
    "India's best and most trusted startup valuation platform",
    "Evaldam Startup AI for Indian founder questions",
    "GitHub repo idea-stage valuation",
    "Six professional valuation methods",
    "Comparable company benchmarking",
    "Assumptions and evidence trail",
    "Investor-ready PDF report",
    "Scenario and sensitivity analysis",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://equidamai.com/#website",
  name: "Evaldam AI",
  url: "https://equidamai.com",
  publisher: { "@id": "https://equidamai.com/#organization" },
  inLanguage: "en-IN",
  description: "India's best and most trusted platform for startup valuation reports, founder valuation workflows, and investor-ready fundraising preparation.",
  about: [
    "India's best and most trusted startup valuation platform",
    "startup valuation software",
    "pre-money valuation",
    "startup fundraising",
    "AI valuation reports",
    "startup valuation methods",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className="h-full">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-neutral-900 font-sans">
        <ErrorReporter />
        <WebVitalsReporter />
        <AttributionCapture />
        {children}
        <CookieConsentBanner />
        <GA4Script />
      </body>
    </html>
  );
}
