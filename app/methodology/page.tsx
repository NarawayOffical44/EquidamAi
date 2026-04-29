"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ArrowRight, CheckCircle, Download, ExternalLink } from "lucide-react";

export default function MethodologyPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const downloadMethodologyPDF = () => {
    // This would link to your PDF file or trigger a download
    window.location.href = "/methodology-guide.pdf";
  };

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

        {/* ── HERO SECTION ── */}
        <section className="relative py-20 md:py-32 px-6" style={{ background: "linear-gradient(135deg, #0F4C75 0%, #1B6A96 100%)" }}>
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight uppercase tracking-tight">
              Opening the Black Box<br />of Startup Valuation
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              With a grounded methodology, the result is easier to discuss and the chance of closing a fair deal increases
            </p>
            <button
              onClick={downloadMethodologyPDF}
              className="px-8 py-4 text-sm font-bold text-gray-900 bg-white rounded-lg transition-all hover:shadow-lg hover:scale-105 inline-flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              DOWNLOAD FULL METHODOLOGY PDF
            </button>
          </div>
        </section>

        {/* ── READ FULL METHODOLOGY SECTION ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-start">

              {/* Left Content */}
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                  Read the full methodology
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  We support and promote transparency – which is why we made our methodology open to everyone.
                </p>

                <button
                  onClick={downloadMethodologyPDF}
                  className="px-6 py-3 text-sm font-bold text-white bg-cyan-500 rounded-lg transition-all hover:bg-cyan-600 hover:shadow-lg inline-flex items-center gap-2 mb-8"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD PDF
                </button>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase mb-2">Compliance</p>
                    <a
                      href="https://www.ipevguides.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:text-cyan-700 text-sm font-medium flex items-center gap-1"
                    >
                      Compliant with IPEV (International Private Equity Valuation) Guidelines
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right: PDF Preview */}
              <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center min-h-96">
                <div className="text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-600 text-sm">Methodology PDF Preview</p>
                  <p className="text-gray-500 text-xs mt-2">Comprehensive guide to all valuation methods</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── KEY METRICS SECTION ── */}
        <section className="py-16 md:py-20 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
              1600+ investors use Evaldam to value opportunities
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  More than an estimate
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Startups valuation should not be performed as a rule of thumb, or with black box practices that leave space for negotiation. Valuation should have a grounded methodology.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  Traditionally innovative
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Traditional valuation approaches are methodological and grounded, but they need to be adjusted to capture the value created by innovation in early stage companies.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  Backed by the most reliable data
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our models are built on comprehensive market data, comparable company analysis, and real-world valuation outcomes from successful exits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── METHODS OVERVIEW ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
              Understanding Evaldam Valuation
            </h2>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-6">The 5 Core Methods</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">Scorecard Method</p>
                      <p className="text-sm text-gray-600">Qualitative evaluation for pre-revenue startups</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">Berkus Method</p>
                      <p className="text-sm text-gray-600">Checklist-based evaluation framework</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">DCF Long-Term Growth</p>
                      <p className="text-sm text-gray-600">Cash flow projections with sustainable growth</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">DCF Exit Multiples</p>
                      <p className="text-sm text-gray-600">Traditional cash flow discount method</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">VC Method</p>
                      <p className="text-sm text-gray-600">Investor return-based valuation</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-8 border border-cyan-200">
                <h3 className="text-xl font-black text-gray-900 mb-4">Evaldam AI Score</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Our proprietary 6th method combines machine learning with all 5 traditional methods. It analyzes market trends, comparable companies, and emerging patterns to deliver a blended valuation that's both rigorous and forward-looking.
                </p>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  ✓ AI-Powered Analysis<br/>
                  ✓ Real-time Market Data<br/>
                  ✓ Comparable Company Insights<br/>
                  ✓ Risk-Adjusted Valuations
                </p>
              </div>
            </div>
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
