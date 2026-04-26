import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#00b2b2",
};

export const metadata: Metadata = {
  title: "Evaldam AI | Best Affordable Startup Valuation Platform in India",
  description: "Professional AI-powered startup valuation for Indian startups. Get credible investor-ready reports at affordable rates using 6 valuation methods. Free tier: 1 startup + 3 reports/month. Perfect for angel funding, seed rounds, and venture capital.",
  keywords: "startup valuation India, AI valuation report, best valuation platform India, affordable startup valuation, Indian startup funding, startup valuation tools, VC method calculator, DCF valuation, angel investment India, seed funding report, venture capital India, business valuation India, startup evaluation tool",
  authors: [{ name: "Evaldam AI" }],
  metadataBase: new URL("https://evaldam.ai"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://evaldam.ai",
    title: "Evaldam AI | Best Affordable Startup Valuation Platform in India",
    description: "Professional AI-powered startup valuation for Indian startups. 6 valuation methods. Affordable pricing. Free tier: 1 startup + 3 reports/month. Perfect for angel funding & seed rounds.",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://evaldam.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "Evaldam AI - Startup Valuation Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Evaldam AI | Professional Startup Valuations",
    description: "Get credible AI-powered startup valuations in 60 seconds with 6 professional methods.",
    images: ["https://evaldam.ai/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  alternates: {
    canonical: "https://evaldam.ai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-neutral-100 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
