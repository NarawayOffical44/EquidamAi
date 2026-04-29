"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, CheckCircle, Download, ExternalLink, TrendingUp, BarChart3, Target, Users, FileText, Zap } from "lucide-react";

export default function ValuationReportPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const downloadSampleReport = () => {
    window.location.href = "/sample-valuation-report.pdf";
  };

  const reportSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is included in the Evaldam valuation report?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our professional valuation report includes multi-method analysis (6 methods), executive summary, detailed financial projections, market benchmarking, competitive analysis, risk assessment, and investor-ready formatting."
        }
      },
      {
        "@type": "Question",
        "name": "How can I use the valuation report?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The report is designed for fundraising, investor pitches, employee equity planning, acquisition discussions, and strategic decision-making."
        }
      },
      {
        "@type": "Question",
        "name": "Is the valuation report credible for investors?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Our reports follow IPEV (International Private Equity Valuation) guidelines and use methodologies trusted by professional investors worldwide."
        }
      },
      {
        "@type": "Question",
        "name": "Can I customize the report?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Pro and Plus plans allow you to generate multiple reports, adjust assumptions, and create scenario analyses."
        }
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reportSchema) }} />

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
                <Link href="/valuation-report" className="font-bold text-primary">Valuation Report</Link>
                <Link href="/methodology" className="hover:text-gray-900 transition-colors">Methodology</Link>
                <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
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
              <Link href="/valuation-report" className="block text-sm font-bold text-primary">
                Valuation Report
              </Link>
              <Link href="/methodology" className="block text-sm font-medium text-gray-600 hover:text-gray-900">
                Methodology
              </Link>
              <Link href="/pricing" className="block text-sm font-medium text-gray-600 hover:text-gray-900">
                Pricing
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
        <section className="relative py-20 md:py-32 px-6" style={{ background: "linear-gradient(135deg, #1B6A96 0%, #2D8AB8 100%)" }}>
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight uppercase tracking-tight">
              Investor-Ready<br />Valuation Reports
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              Professional, comprehensive startup valuations that stand up to investor scrutiny. Get multi-method analysis, financial insights, and market benchmarking in one report.
            </p>
            <button
              onClick={downloadSampleReport}
              className="px-8 py-4 text-sm font-bold text-gray-900 bg-white rounded-lg transition-all hover:shadow-lg hover:scale-105 inline-flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              DOWNLOAD SAMPLE REPORT
            </button>
          </div>
        </section>

        {/* ── WHAT'S INCLUDED SECTION ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
              What's Inside Your Report
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <h3 className="text-xl font-black text-gray-900">Executive Summary</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  High-level overview of your startup's valuation, key metrics, and investment opportunity. Perfect for initial investor conversations.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <BarChart3 className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <h3 className="text-xl font-black text-gray-900">Multi-Method Analysis</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  6 independent valuation methods: Scorecard, Berkus, VC Method, DCF Long-Term Growth, DCF Exit Multiples, and Evaldam AI Score with detailed reasoning.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <TrendingUp className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <h3 className="text-xl font-black text-gray-900">Financial Projections</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  3-5 year cash flow projections, revenue forecasts, burn rate analysis, and profitability timeline based on your startup's metrics and growth assumptions.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <Target className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                  <h3 className="text-xl font-black text-gray-900">Market Benchmarking</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Compare your metrics against industry peers. See where you stand in ARR growth, burn rate, team size, and valuation multiples percentiles.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <Users className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
                  <h3 className="text-xl font-black text-gray-900">Comparable Analysis</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Real-world comparable companies at similar stages. See valuation ranges, exit outcomes, and metrics of companies that exited successfully.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <Zap className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <h3 className="text-xl font-black text-gray-900">Risk Assessment</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Valuation sensitivity analysis showing how key assumptions impact your valuation. Scenario analysis for bull, base, and bear cases.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY EVALDAM REPORTS ── */}
        <section className="py-16 md:py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
              Why Choose Evaldam Reports?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  IPEV Compliant
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Follows International Private Equity Valuation Guidelines. Your report carries the credibility investors expect.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  AI-Powered Insights
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our proprietary Evaldam AI Score combines traditional methods with machine learning for forward-looking valuations.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  India-First Data
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Built with Indian startup benchmarks and comparable data. More accurate for India-based founders.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  Professional Format
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Beautifully designed PDF ready for investor pitches, board meetings, and fundraising discussions.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  Instant Generation
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Get comprehensive reports in under 60 seconds. Update assumptions and regenerate anytime.
                </p>
              </div>

              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  Unlimited Updates
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  With Pro and Plus plans, regenerate reports with new data. Always have current valuations ready.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── REPORT USE CASES ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
              Perfect For...
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Seed & Series A Fundraising</h3>
                    <p className="text-sm text-gray-600">Provide investors with credible, methodical valuation backing your ask</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Acquisition Discussions</h3>
                    <p className="text-sm text-gray-600">Have data-backed valuation for M&A negotiations</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Employee Equity Planning</h3>
                    <p className="text-sm text-gray-600">Use our valuation for ESOP structuring and equity grants</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Strategic Planning</h3>
                    <p className="text-sm text-gray-600">Understand your startup's current valuation for growth planning</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Board Discussions</h3>
                    <p className="text-sm text-gray-600">Present professional valuation analysis to your board</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Angel Investor Pitches</h3>
                    <p className="text-sm text-gray-600">Show angels a credible valuation for early-stage investment discussions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SAMPLE REPORT CTA ── */}
        <section className="py-16 md:py-20 px-6 bg-gradient-to-r from-primary/10 to-cyan-500/10 border-t border-b border-primary/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              See It For Yourself
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Download our sample valuation report to see exactly what you'll get. Based on a real SaaS startup in the Series A stage.
            </p>
            <button
              onClick={downloadSampleReport}
              className="px-8 py-4 text-sm font-bold text-white rounded-lg transition-all hover:shadow-lg hover:scale-105 bg-primary inline-flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              DOWNLOAD SAMPLE REPORT
            </button>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-16 md:py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Ready to Value Your Startup?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Start with a free valuation check, or upgrade to Pro to unlock unlimited reports, comparables, and investor benchmarking.
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
