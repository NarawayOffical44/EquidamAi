"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import React from "react";
import { Menu, X, CheckCircle, Download, ExternalLink, TrendingUp, BarChart3, Target, Users, FileText, Zap, Sparkles, Lock, Clock, Shield, ArrowRight } from "lucide-react";

export default function ValuationReportPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("features");

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
        <section className="relative py-28 md:py-40 px-4 sm:px-6 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-cyan-500/5" />

          {/* Decorative Elements */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

          <div className="max-w-6xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-xs sm:text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              Proprietary Platform for India
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Valuations Built for<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">Indian Founders</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Data-driven valuations using 10,000+ Indian startup benchmarks. 6 proven methods. Investor-ready reports in 60 seconds. Trusted by 3,000+ founders.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={downloadSampleReport}
                className="px-6 sm:px-8 py-3 sm:py-4 text-sm font-bold text-white bg-primary rounded-lg transition-all hover:shadow-lg hover:scale-105 inline-flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Download className="w-5 h-5" />
                Download Sample Report
              </button>
              <Link href="/signup" className="w-full sm:w-auto">
                <button className="w-full px-6 sm:px-8 py-3 sm:py-4 text-sm font-bold text-primary border-2 border-primary rounded-lg hover:bg-primary/5 transition-colors">
                  Start Free Trial
                </button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto px-2 sm:px-0">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-primary mb-1 sm:mb-2">3,000+</div>
                <div className="text-xs sm:text-sm text-gray-600">Founders</div>
              </div>
              <div className="text-center border-l border-r border-gray-200">
                <div className="text-2xl sm:text-3xl font-black text-primary mb-1 sm:mb-2">94%</div>
                <div className="text-xs sm:text-sm text-gray-600">Approval</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-primary mb-1 sm:mb-2">60s</div>
                <div className="text-xs sm:text-sm text-gray-600">Generate</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT'S INCLUDED SECTION ── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 sm:mb-4">
                What's Inside Your Report
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Comprehensive analysis backed by 10,000+ Indian startup benchmarks, proprietary methodologies, and real market data.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {[
                {
                  icon: <BarChart3 className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "6 Valuation Methods",
                  desc: "Scorecard, Berkus, VC Method, DCF Long-Term Growth, DCF Exit Multiples, Proprietary Score",
                  color: "from-primary/20 to-primary/10"
                },
                {
                  icon: <TrendingUp className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "India-Focused Benchmarks",
                  desc: "Compare against 10,000+ Indian startups by stage, industry, ARR, growth rate, and burn metrics",
                  color: "from-green-500/20 to-green-500/10"
                },
                {
                  icon: <Target className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Real Market Data",
                  desc: "Live Indian startup funding rounds, exits, and valuation multiples. Updated weekly for accuracy",
                  color: "from-orange-500/20 to-orange-500/10"
                },
                {
                  icon: <Users className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Investor Benchmarking",
                  desc: "See how your valuation ranks against investor expectations for your stage and industry in India",
                  color: "from-purple-500/20 to-purple-500/10"
                },
                {
                  icon: <FileText className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Executive Summary",
                  desc: "Professional one-page valuation snapshot with key metrics, growth drivers, and funding positioning",
                  color: "from-blue-500/20 to-blue-500/10"
                },
                {
                  icon: <Shield className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Risk Analysis",
                  desc: "Sensitivity analysis and bull/base/bear scenarios based on Indian market conditions and peer data",
                  color: "from-red-500/20 to-red-500/10"
                }
              ].map((item, i) => (
                <div key={i} className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 sm:p-8 border border-gray-200/50 hover:border-primary/30 transition-all group`}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 rounded-lg bg-white/50 group-hover:bg-white transition-colors text-primary flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VISUAL REPORT SHOWCASE ── */}
        <section className="py-20 md:py-28 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 sm:mb-4">
                AI-Generated Insights You'll Get
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Proprietary AI analyzes your startup data against 10,000+ Indian startups. Instant, investor-ready valuations powered by machine learning.
              </p>
            </div>

            {/* Report Mockup Grid */}
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-12 sm:mb-16">
              {/* Left: Report Preview */}
              <div className="relative order-2 lg:order-1">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-lg blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                  {/* Evaldam Report Header */}
                  <div className="bg-gradient-to-r from-primary to-cyan-500 h-32 sm:h-40 rounded-t-xl -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 sm:mb-8 p-4 sm:p-6 flex flex-col justify-end">
                    <h4 className="text-white text-sm font-bold">AI-Powered Valuation Report</h4>
                    <p className="text-white/90 text-xs">Evaldam AI • TechStartup Inc. • Series A</p>
                  </div>

                  {/* Report Content */}
                  <div className="space-y-5 sm:space-y-6">
                    {/* Valuation Card */}
                    <div className="bg-gradient-to-br from-primary/5 to-cyan-500/5 rounded-xl p-4 sm:p-5 border border-primary/20">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Pre-Money Valuation</div>
                      <div className="text-3xl sm:text-4xl font-black text-primary mb-2">₹12.5M</div>
                      <div className="text-xs sm:text-sm text-gray-600">Range: ₹8.5M - ₹18.2M</div>
                    </div>

                    {/* Methods Summary */}
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Method Analysis</div>
                      <div className="space-y-2">
                        {[
                          { name: "Scorecard", val: "₹10.2M", w: "w-2/3" },
                          { name: "Berkus", val: "₹11.8M", w: "w-1/2" },
                          { name: "VC Method", val: "₹14.5M", w: "w-3/4" }
                        ].map((m, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-600">{m.name}</span>
                              <span className="font-bold text-gray-900">{m.val}</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full ${m.w} bg-gradient-to-r from-primary to-cyan-500 rounded-full`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                      <div>
                        <div className="text-xs text-gray-500">Revenue</div>
                        <div className="text-sm font-bold text-gray-900">₹2.5Cr</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Growth</div>
                        <div className="text-sm font-bold text-green-600">+150% YoY</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Features */}
              <div className="order-1 lg:order-2 space-y-6 sm:space-y-8">
                <h3 className="text-3xl sm:text-4xl font-black text-gray-900">Professional Report Features</h3>

                {[
                  { icon: <Sparkles />, title: "AI-Powered Analysis", desc: "Machine learning trained on 10,000+ Indian startup data points" },
                  { icon: <Target />, title: "India-Focused Benchmarks", desc: "Compare against actual Indian startups in your stage and industry" },
                  { icon: <Clock />, title: "60-Second Reports", desc: "Proprietary AI generates comprehensive valuations instantly" },
                  { icon: <Lock />, title: "Enterprise Security", desc: "Bank-grade encryption. Your startup data stays completely private." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0 h-fit mt-0.5 flex items-center justify-center">
                      <div className="w-5 sm:w-6 h-5 sm:h-6">{item.icon}</div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-0.5 text-sm sm:text-base">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={downloadSampleReport}
                  className="w-full mt-8 px-6 py-3 sm:py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Download className="w-5 h-5" />
                  Download Sample Report
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY EVALDAM REPORTS ── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 sm:mb-4">
                Why 3,000+ Founders Trust Evaldam
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Proprietary platform built specifically for Indian startups with real market data and proven methodologies.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {[
                {
                  icon: <Target className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "10,000+ Indian Comparables",
                  desc: "Real startup data by stage, industry, ARR, and growth rate. No generic global benchmarks here"
                },
                {
                  icon: <BarChart3 className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "6 Proven Methods",
                  desc: "Scorecard, Berkus, VC Method, DCF models, and proprietary scoring—all calibrated for Indian market dynamics"
                },
                {
                  icon: <Clock className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Instant Reports",
                  desc: "Get investor-ready valuations in 60 seconds. While others take weeks, we deliver results minutes"
                },
                {
                  icon: <TrendingUp className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Live Market Data",
                  desc: "Weekly updates to Indian startup funding, exits, and valuation multiples. Always current, never outdated"
                },
                {
                  icon: <Users className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Investor Benchmarking",
                  desc: "See your valuation against investor expectations for your stage. Know if you're asking too much or too little"
                },
                {
                  icon: <Shield className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Enterprise Security",
                  desc: "Bank-grade encryption. Your startup data is never shared, sold, or used for anything except your valuation"
                }
              ].map((item, i) => (
                <div key={i} className="group bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all">
                  <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary w-fit mb-4 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REPORT USE CASES ── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 sm:mb-4">
                Use Cases That Drive Results
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Trusted by founders for the most critical moments in their journey
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {[
                {
                  icon: "📈",
                  title: "Seed & Series A Fundraising",
                  desc: "Back your funding ask with credible, multi-method valuation analysis"
                },
                {
                  icon: "🤝",
                  title: "M&A Negotiations",
                  desc: "Use data-backed valuation for confident acquisition discussions"
                },
                {
                  icon: "📊",
                  title: "Employee Equity",
                  desc: "Fair valuation for ESOP structuring and equity grant decisions"
                },
                {
                  icon: "🎯",
                  title: "Strategic Planning",
                  desc: "Understand your current valuation to guide growth strategy"
                },
                {
                  icon: "👥",
                  title: "Board Reporting",
                  desc: "Present professional valuation analysis in investor board meetings"
                },
                {
                  icon: "💼",
                  title: "Angel Pitches",
                  desc: "Show early-stage investors a credible valuation for their decision"
                }
              ].map((item, i) => (
                <div key={i} className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden">
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{item.icon}</div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 flex-shrink-0" />
                      <span>{item.desc}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SAMPLE REPORT CTA ── */}
        <section className="py-16 md:py-24 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-cyan-500">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">
              See Your Report in Action
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10">
              Download our sample valuation report—a real Series A SaaS startup with full analysis across all 6 methods.
            </p>
            <button
              onClick={downloadSampleReport}
              className="px-6 sm:px-8 py-3 sm:py-4 text-sm font-bold text-primary bg-white rounded-lg transition-all hover:shadow-xl hover:scale-105 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Download className="w-5 h-5" />
              Download Sample Report
            </button>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 sm:mb-6">
                Ready to Get Your Valuation?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-2">
                Join 3,000+ founders who've already raised with confidence
              </p>
              <p className="text-sm sm:text-base text-gray-500">
                Start free, upgrade anytime when you need more reports
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 border border-gray-200 shadow-lg mb-8">
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-primary mb-2 sm:mb-3">1</div>
                  <p className="text-sm sm:text-base text-gray-600">Free startup valuation</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">Start instantly, no card required</p>
                </div>
                <div className="text-center border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
                  <div className="text-4xl sm:text-5xl font-black text-primary mb-2 sm:mb-3">3</div>
                  <p className="text-sm sm:text-base text-gray-600">Full reports per month</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">With Pro plan ($99/mo)</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/free-valuation" className="flex-1 sm:flex-none">
                <button className="w-full px-6 sm:px-8 py-3 sm:py-4 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                  Start Free Valuation
                </button>
              </Link>
              <Link href="/signup" className="flex-1 sm:flex-none">
                <button className="w-full px-6 sm:px-8 py-3 sm:py-4 text-sm font-bold text-primary border-2 border-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
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
