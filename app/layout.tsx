import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GA4Script } from "@/components/GA4Script";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#00b2b2",
};

export const metadata: Metadata = {
  title: "Evaldam AI | Best Startup Valuation Platform in India",
  description: "Professional AI-powered startup valuation for Indian startups. Get credible investor-ready reports using 6 valuation methods. Free tier: 1 startup + 3 reports/month. Perfect for angel funding, seed rounds, and venture capital.",
  keywords: "startup valuation India, AI valuation report, best valuation platform India, startup valuation methods, Indian startup funding, startup valuation tools, VC method calculator, DCF valuation, angel investment India, seed funding report, venture capital India, business valuation India, startup evaluation tool",
  authors: [{ name: "Evaldam AI" }],
  creator: "Evaldam AI",
  publisher: "Evaldam AI",
  metadataBase: new URL("https://evaldam.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://evaldam.com",
    title: "Evaldam AI | Best Startup Valuation Platform in India",
    description: "Professional AI-powered startup valuation for Indian startups. 6 valuation methods. Free tier: 1 startup + 3 reports/month. Perfect for angel funding & seed rounds.",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://evaldam.com/logo.png",
        width: 360,
        height: 360,
        alt: "Evaldam AI Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Evaldam AI | Professional Startup Valuations",
    description: "Get credible AI-powered startup valuations in 60 seconds with 6 professional methods.",
    creator: "@evaldam",
    images: ["https://evaldam.com/logo.png"],
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
  verification: {
    google: "google_site_verification_code",
    other: {
      "msvalidate.01": "bing_site_verification_code",
    },
  },
  alternates: {
    canonical: "https://evaldam.com",
    languages: {
      "en-IN": "https://evaldam.com",
      "en-US": "https://evaldam.com",
      "en-GB": "https://evaldam.com",
      "en-AE": "https://evaldam.com",
      "x-default": "https://evaldam.com",
    },
  },
  appLinks: {
    ios: [
      {
        url: "https://evaldam.com",
        app_store_id: "123456789",
        app_name: "Evaldam AI",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <GA4Script />
      </head>
      <body className="min-h-full flex flex-col bg-neutral-100 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
