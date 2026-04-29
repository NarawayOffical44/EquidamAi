"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ArrowRight, CheckCircle } from "lucide-react";
import { Metadata } from "next";

export default function MethodologyPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const methodologySchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the Scorecard Method?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Scorecard Method was developed by renowned American business angels to value the elements that guarantee future success in pre-revenue, early stage companies. It evaluates factors like team, product, market, and other key metrics."
        }
      },
      {
        "@type": "Question",
        "name": "What is the Berkus Method?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Berkus Method is a checklist method that evaluates startups based on key success factors. It's particularly useful for pre-revenue companies where traditional valuation methods don't apply."
        }
      },
      {
        "@type": "Question",
        "name": "What is the VC Method?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Venture Capital Method takes into account the returns investors expect to earn upon exit in order to have a profitable portfolio. It works backwards from a desired exit value."
        }
      },
      {
        "@type": "Question",
        "name": "What is DCF Valuation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "DCF (Discounted Cash Flow) is a standard and most traditional method according to which a company is worth the cash that it's going to generate in the future. We offer two variants: with Long Term Growth and with Exit Multiples."
        }
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(methodologySchema) }} />

      <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ── NAV ── */}
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-md" />
                <span className="text-sm font-black text-gray-900 tracking-tight">evaldam</span>
              </Link>

              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
                <Link href="/methodology" className="font-bold text-primary">Methodology</Link>
                <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                  Sign in
                </Link>
                <Link href="/signup">
                  <button className="px-5 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 bg-primary">
                    BUY NOW
                  </button>
                </Link>
              </div>

              <button className="md:hidden p-2 text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-3 bg-white">
              <Link href="/pricing" className="block text-sm font-medium text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/methodology" className="block text-sm font-bold text-primary">
                Methodology
              </Link>
              <Link href="/contact" className="block text-sm font-medium text-gray-600 hover:text-gray-900">
                Contact
              </Link>
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <Link href="/login" className="flex-1">
                  <button className="w-full py-2 text-sm font-medium border border-gray-300 rounded-lg">
                    Sign in
                  </button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <button className="w-full py-2 text-sm font-bold text-white rounded-lg bg-primary">
                    BUY NOW
                  </button>
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* ── HERO ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
                5 Valuation methods in one
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Looking at the business from different perspectives results in a more comprehensive and reliable view. Our methods look at the value of a startup from 3 different points of view.
              </p>
            </div>
          </div>
        </section>

        {/* ── METHODOLOGY GRID ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">

              {/* Left: Qualitative Methods */}
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight text-teal-700">
                  Qualitative Aspects
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-3">
                      Scorecard Method
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Developed by renowned American business angels to value the elements that guarantee future success in pre-revenues, early stage companies
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-3">
                      Checklist Method
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      A systematic approach to evaluate key success factors and qualitative metrics that drive startup value
                    </p>
                  </div>
                </div>
              </div>

              {/* Center: Venn Diagram Placeholder */}
              <div className="flex justify-center">
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  <svg viewBox="0 0 300 300" className="w-full h-full">
                    {/* Yellow circle (Qualitative) */}
                    <circle cx="100" cy="150" r="90" fill="#FFD700" opacity="0.6" />

                    {/* Cyan circle (DCF) */}
                    <circle cx="150" cy="90" r="90" fill="#00E5FF" opacity="0.6" />

                    {/* Blue circle (VC) */}
                    <circle cx="200" cy="150" r="90" fill="#00A0FF" opacity="0.6" />

                    {/* Labels and connectors */}
                    <text x="30" y="160" fontSize="12" fontWeight="bold" fill="#333">
                      QUALITATIVE
                    </text>
                    <text x="150" y="40" fontSize="12" fontWeight="bold" fill="#333" textAnchor="middle">
                      FUTURE CASH
                    </text>
                    <text x="150" y="55" fontSize="12" fontWeight="bold" fill="#333" textAnchor="middle">
                      FLOWS
                    </text>
                    <text x="260" y="160" fontSize="12" fontWeight="bold" fill="#333" textAnchor="end">
                      INVESTORS
                    </text>
                    <text x="260" y="175" fontSize="12" fontWeight="bold" fill="#333" textAnchor="end">
                      RETURNS
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">

              {/* Right: Quantitative Methods */}
              <div className="md:order-2">
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight text-teal-700">
                  Future Cash Flows & Investor Returns
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-3">
                      DCF with Long Term Growth
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Projects future cash flows and discounts them back to present value, assuming long-term sustainable growth
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-3">
                      DCF with Exit Multiples
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      The standard and most traditional method according to which a company is worth the cash that it's going to generate in the future
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-3">
                      Venture Capital Method
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      This method takes into account the returns investors expect to earn upon exit in order to have a profitable portfolio
                    </p>
                  </div>
                </div>
              </div>

              {/* Left: Additional Context */}
              <div className="md:order-1">
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                  <h3 className="text-lg font-black text-gray-900 mb-4">Why Multiple Methods?</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    Using multiple valuation methods provides a more comprehensive view of your startup's value. Different methods are suited to different stages and market conditions.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">Qualitative methods best for pre-revenue startups</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">DCF methods for revenue-generating companies</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">VC method for investor-backed rounds</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── EVALDAM PROPRIETARY ── */}
        <section className="py-16 md:py-20 px-6 bg-gradient-to-r from-teal-50 to-blue-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Plus: Evaldam AI Score
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Our proprietary AI-powered scoring method combines insights from all 5 traditional methods with machine learning analysis of market trends, comparable companies, and emerging patterns to deliver a blended valuation that's both rigorous and forward-looking.
            </p>
            <Link href="/signup">
              <button className="px-8 py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 bg-primary inline-flex items-center gap-2">
                Get Your Valuation <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Ready to value your startup?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Get an instant multi-method valuation in under 60 seconds. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/free-valuation">
                <button className="px-8 py-3 text-sm font-bold text-gray-900 rounded-lg transition-colors border-2 border-gray-300 hover:border-gray-400">
                  Try Free Valuation
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-8 py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 bg-primary">
                  Sign Up Free
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-gray-200 py-12 px-6">
          <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
            <p>© 2024 Evaldam AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
