import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { GA4Script } from "@/components/GA4Script";
import { AttributionCapture } from "@/components/AttributionCapture";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { ErrorReporter } from "@/components/ErrorReporter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

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
  themeColor: "#007a7a",
};

export const metadata: Metadata = {
  title: {
    default: "Evaldam AI - AI Startup Valuation & Investor-Ready Reports",
    template: "%s | Evaldam AI",
  },
  description: "Evaldam AI values your startup with six proven methods, writes an investor-ready report you can share, and tracks how your valuation grows over time. Free to start.",
  keywords: [
    "startup valuation platform",
    "startup valuation software",
    "AI startup valuation",
    "investor-ready valuation report",
    "shareable valuation report",
    "startup valuation tracking",
    "pre-money valuation calculator",
    "free startup valuation",
    "seed round valuation",
    "angel funding valuation",
    "Berkus method calculator",
    "Scorecard valuation method",
    "VC method valuation",
    "DCF startup valuation",
    "SAFE valuation cap",
    "SaaS startup valuation",
    "startup valuation for founders",
    "startup valuation for advisors",
    "startup valuation for VCs",
    "Equidam alternative",
    "startup valuation India",
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
    title: "Evaldam AI - AI Startup Valuation & Investor-Ready Reports",
    description: "Value your startup with six proven methods, share an investor-ready report, and track your valuation over time. Built for founders, advisors, and investors across 40+ markets.",
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
    title: "Evaldam AI - AI Startup Valuation & Investor-Ready Reports",
    description: "Six valuation methods, investor-ready shareable reports, and valuation tracking over time - for founders, advisors, and investors worldwide.",
    creator: "@EquidamAi",
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
  slogan: "Know your startup's worth - and prove it.",
  url: "https://equidamai.com",
  logo: "https://equidamai.com/logo.png",
  image: "https://equidamai.com/logo.png",
  email: "hello@equidamai.com",
  sameAs: [
    "https://www.linkedin.com/company/evaldamai",
    "https://x.com/EquidamAi",
    "https://instagram.com/evaldamai",
    "https://www.youtube.com/@EvaldamAi",
  ],
  description: "Evaldam AI is a startup valuation platform that values companies with six proven methods, generates investor-ready reports, and tracks valuation over time - for founders, advisors, and investors worldwide.",
  knowsAbout: [
    "startup valuation",
    "pre-money and post-money valuation",
    "Scorecard valuation method",
    "Berkus method",
    "Venture Capital method",
    "discounted cash flow valuation",
    "comparable company analysis",
    "SAFE valuation caps",
    "term sheets and dilution",
    "fundraising preparation",
    "investor-ready valuation reports",
    "valuation tracking over time",
  ],
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
  description: "Startup valuation platform with a purpose-built valuation AI, six methods, comparable benchmarking, investor-ready shareable reports, sensitivity analysis, and valuation tracking over time.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "999",
    offerCount: "4",
  },
  featureList: [
    "Free startup valuation preview",
    "Purpose-built valuation AI",
    "Six professional valuation methods",
    "Investor-ready shareable valuation reports",
    "Valuation tracking over time",
    "Comparable company benchmarking across 40+ markets",
    "Assumptions and evidence trail",
    "Scenario and sensitivity analysis",
    "GitHub repo idea-stage valuation",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://equidamai.com/#website",
  name: "Evaldam AI",
  url: "https://equidamai.com",
  publisher: { "@id": "https://equidamai.com/#organization" },
  inLanguage: "en",
  description: "Startup valuation platform for investor-ready reports, founder workflows, and ongoing valuation tracking.",
  about: [
    "startup valuation platform",
    "AI startup valuation",
    "investor-ready valuation reports",
    "valuation tracking over time",
    "pre-money valuation",
    "startup fundraising",
    "startup valuation methods",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${robotoMono.variable} h-full`}>
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
