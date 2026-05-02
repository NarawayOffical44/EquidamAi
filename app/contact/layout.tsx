import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Evaldam AI | Startup Valuation Support",
  description: "Get in touch with Evaldam AI for questions about startup valuation, enterprise plans, or partnerships. Contact us via email or WhatsApp.",
  keywords: "contact evaldam, startup valuation support, enterprise valuation, contact support, Indian startup support",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://equidamai.com/contact",
    title: "Contact Evaldam AI",
    description: "Get in touch with Evaldam AI's team for support, partnerships, and enterprise inquiries.",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/logo.png",
        width: 360,
        height: 360,
        alt: "Evaldam AI Logo",
      },
    ],
  },
  alternates: {
    canonical: "https://equidamai.com/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
