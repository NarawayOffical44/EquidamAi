import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evaldam AI | Professional Startup Valuations",
  description: "AI-powered startup valuation platform. Upload your pitch deck, get a credible investor-ready valuation report in minutes backed by 5 professional methods.",
  keywords: "startup valuation, AI valuation, VC method, DCF, investor reports, funding",
  authors: [{ name: "Evaldam AI" }],
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
