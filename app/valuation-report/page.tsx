"use client";

import Link from "next/link";
import { useState } from "react";
import React from "react";
import { CheckCircle, TrendingUp, BarChart3, Target, Users, FileText, Sparkles, Lock, Clock, Shield, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { trackFormSubmission, trackReportDownload } from "@/lib/analytics/ga4";
import { getLeadAttribution } from "@/lib/leads/client-attribution";

export default function ValuationReportPage() {
  const [activeTab, setActiveTab] = useState("features");
  const [sampleForm, setSampleForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
  });
  const [sampleStatus, setSampleStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [sampleError, setSampleError] = useState("");

  const startFreeValuation = () => {
    window.location.href = "/free-valuation";
  };

  const handleSampleReportDownload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSampleError("");
    setSampleStatus("submitting");

    try {
      const response = await fetch("/api/leads/sample-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sampleForm,
          attribution: getLeadAttribution(),
        }),
      });

      if (!response.ok) {
        let message = "Could not download the sample report. Please try again.";
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // Keep the generic message when the response is not JSON.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "evaldam-sample-valuation-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      trackFormSubmission("sample_report_download", {
        companyName: sampleForm.companyName,
        source: "valuation_report_page",
      });
      trackReportDownload({
        companyName: "Evaldam Sample",
        reportType: "full",
      });
      setSampleStatus("success");
    } catch (error) {
      setSampleError(error instanceof Error ? error.message : "Could not download the sample report. Please try again.");
      setSampleStatus("idle");
    }
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
          "text": "The report is designed to support investor conversations by showing methods, assumptions, comparable context, sensitivity analysis, and limitations. It is not a certified appraisal, legal opinion, or investment advice."
        }
      },
      {
        "@type": "Question",
        "name": "Can I customize the report?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Startup and Agency / Investor plans allow you to generate reports, adjust assumptions, and create scenario analyses."
        }
      }
    ]
  };

  const reportServiceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://equidamai.com/valuation-report#service",
    "name": "Investor-Ready Startup Valuation Report",
    "serviceType": "Startup valuation report",
    "url": "https://equidamai.com/valuation-report",
    "provider": {
      "@id": "https://equidamai.com/#organization"
    },
    "audience": [
      { "@type": "Audience", "audienceType": "Founders" },
      { "@type": "Audience", "audienceType": "Advisors" },
      { "@type": "Audience", "audienceType": "Accelerators" },
      { "@type": "Audience", "audienceType": "Investors" }
    ],
    "areaServed": [
      { "@type": "Country", "name": "India" },
      { "@type": "Country", "name": "United States" },
      { "@type": "Country", "name": "United Kingdom" },
      { "@type": "Country", "name": "United Arab Emirates" }
    ],
    "description": "Startup valuation reports with six-method analysis, assumptions, comparable context, sensitivity analysis, and investor-ready PDF output.",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Evaldam valuation report outputs",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Six-method startup valuation analysis" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Assumptions and evidence trail" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Comparable company context" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Investor-ready PDF report" } }
      ]
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reportSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reportServiceSchema) }} />

      <div className="public-page min-h-screen bg-white text-gray-900">

        <Navbar />

        <main>

        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 md:py-28">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-cyan-500/5" />

          <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-xs sm:text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              Powered by a proprietary valuation AI
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The report that does{" "}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">the explaining for you</span>
            </h1>

            <p className="section-copy text-base sm:text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              A clean, investor-grade valuation report you can share by link or PDF - six methods, comparables, assumptions, and the full business analysis behind your number. So when an investor asks &ldquo;how did you get this?&rdquo;, the answer is already in their inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                type="button"
                onClick={startFreeValuation}
                className="px-6 sm:px-8 py-3 sm:py-4 text-sm font-bold text-white bg-primary rounded-lg transition-all hover:shadow-lg hover:scale-105 inline-flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <ArrowRight className="w-5 h-5" />
                Start Free Valuation
              </button>
              <Link href="/signup" className="w-full rounded-lg border-2 border-primary px-6 py-3 text-center text-sm font-bold text-primary transition-colors hover:bg-primary/5 sm:w-auto sm:px-8 sm:py-4">
                View Pricing
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 grid grid-cols-3 gap-6 sm:gap-12 max-w-3xl mx-auto px-2 sm:px-0">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-3">6</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Methods</div>
              </div>
              <div className="text-center border-l border-r border-gray-200">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-3">PDF</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Report</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-3">60s</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Generate</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT'S INCLUDED SECTION ── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                What's Inside Your Report
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                6 valuation methods, saved assumptions, comparables, and sensitivity analysis.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {[
                {
                  icon: <BarChart3 className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "6 Valuation Methods",
                  desc: "Scorecard, Berkus, VC Method, DCF Long-Term Growth, DCF Exit Multiples, Comparables, plus Evaldam supporting score",
                  color: "from-primary/20 to-primary/10"
                },
                {
                  icon: <TrendingUp className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Market-Aware Benchmarks",
                  desc: "Compare against peer context by stage, industry, ARR, growth rate, and burn - across 40+ markets",
                  color: "from-green-500/20 to-green-500/10"
                },
                {
                  icon: <Target className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Market Context",
                  desc: "Use market assumptions, available comparable records, and valuation multiples to support the range",
                  color: "from-orange-500/20 to-orange-500/10"
                },
                {
                  icon: <Users className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Investor Benchmarking",
                  desc: "See how your valuation ranks against investor expectations for your stage, industry, and market",
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
                  desc: "Sensitivity analysis and bull/base/bear scenarios based on real market conditions and peer data",
                  color: "from-red-500/20 to-red-500/10"
                }
              ].map((item, i) => (
                <div key={i} className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 sm:p-8 border border-gray-200/50 hover:border-primary/30 transition-all group h-full flex flex-col`}>
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="p-2.5 sm:p-3 rounded-lg bg-white/50 group-hover:bg-white transition-colors text-primary flex-shrink-0 mt-1">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">{item.title}</h3>
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
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                AI-Generated Insights You'll Get
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Evaldam turns your startup inputs into method-backed outputs with assumptions, scenarios, and investor-ready summaries.
              </p>
            </div>

            {/* Report Mockup Grid */}
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center mb-12 sm:mb-16">
              {/* Left: Report Preview */}
              <div className="relative order-2 lg:order-1">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-lg" />
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                  {/* Evaldam Report Header */}
                  <div className="bg-gradient-to-r from-primary to-cyan-500 h-32 sm:h-40 rounded-t-xl -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 sm:mb-8 p-4 sm:p-6 flex flex-col justify-end">
                    <h4 className="text-white text-sm font-bold">Investor-Ready Valuation Report</h4>
                    <p className="text-white/90 text-xs">Evaldam AI • TechStartup Inc. • Series A</p>
                  </div>

                  {/* Report Content */}
                  <div className="space-y-5 sm:space-y-6">
                    {/* Valuation Card */}
                    <div className="bg-gradient-to-br from-primary/5 to-cyan-500/5 rounded-xl p-4 sm:p-5 border border-primary/20">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Pre-Money Valuation</div>
                      <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">₹12.5M</div>
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
                        <div className="text-sm font-bold text-green-700">+150% YoY</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Features */}
              <div className="order-1 lg:order-2 space-y-6 sm:space-y-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Professional Report Features</h3>

                {[
                  { icon: <Sparkles />, title: "Assumption-Backed Analysis", desc: "Structured valuation workflow with saved inputs, assumptions, and method-level outputs" },
                  { icon: <Target />, title: "Market-Aware Benchmarks", desc: "Use market-aware assumptions and peer context for your stage, industry, and country" },
                  { icon: <Clock />, title: "Fast Report Drafts", desc: "Generate a structured valuation report before investor calls, pricing discussions, and board reviews" },
                  { icon: <Lock />, title: "Data Privacy", desc: "Your startup data is used to generate your valuation workflow and report." }
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
                  type="button"
                  onClick={startFreeValuation}
                  className="w-full mt-8 px-6 py-3 sm:py-4 bg-gradient-to-r from-primary to-[#005f5f] text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <ArrowRight className="w-5 h-5" />
                Start Free Valuation
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY EVALDAM REPORTS ── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Why founders use Evaldam for valuation work
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                A structured platform for turning startup inputs into method-backed valuation reports.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {[
                {
                  icon: <Target className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Comparable Context",
                  desc: "Benchmark stage, industry, ARR, and growth assumptions where peer data is available."
                },
                {
                  icon: <BarChart3 className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "6 Proven Methods",
                  desc: "Scorecard, Berkus, VC Method, DCF models, and our proprietary Evaldam Score - calibrated to your market"
                },
                {
                  icon: <Clock className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Instant Reports",
                  desc: "Get investor-ready valuations. While others take weeks, we deliver results in minutes."
                },
                {
                  icon: <TrendingUp className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Live Market Data",
                  desc: "Uses available market context, assumptions, and benchmark data to support valuation reasoning."
                },
                {
                  icon: <Users className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Investor Benchmarking",
                  desc: "See your valuation against investor expectations for your stage. Know if you're asking too much or too little"
                },
                {
                  icon: <Shield className="w-7 sm:w-8 h-7 sm:h-8" />,
                  title: "Enterprise Security",
                  desc: "Your startup data is used to generate your valuation workflow and report."
                }
              ].map((item, i) => (
                <div key={i} className="group bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all h-full flex flex-col">
                  <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary w-fit mb-4 group-hover:scale-110 transition-transform flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 leading-tight">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REPORT USE CASES ── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Use Cases That Drive Results
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Built for founders preparing important valuation conversations
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
              ].map((item, i) => {
                const Icon = [TrendingUp, Target, BarChart3, FileText, Users, Shield][i] || FileText;

                return (
                <div key={i} className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden">
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item.desc}</span>
                    </p>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SAMPLE REPORT CTA ── */}
        <section id="sample-report" className="py-16 md:py-24 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-cyan-500">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full" />
          </div>

          <div className="max-w-5xl mx-auto relative z-10 grid lg:grid-cols-[1fr_420px] gap-10 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Before Reviewing a Portfolio Company
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
                Download a sample valuation report to see how the range, assumptions, comparables, and method logic are presented.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 text-sm text-white/90">
                {["Six methods", "PDF output", "Investor-ready structure"].map((item) => (
                  <div key={item} className="rounded-lg bg-white/10 px-4 py-3 font-semibold">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSampleReportDownload} className="bg-white rounded-2xl p-6 sm:p-7 shadow-xl text-left">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">Sample report download</p>
                <h3 className="text-2xl font-bold text-gray-900">Get the PDF</h3>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold text-gray-700">Full name</span>
                  <input
                    required
                    value={sampleForm.fullName}
                    onChange={(event) => setSampleForm({ ...sampleForm, fullName: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Your name"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-gray-700">Work email</span>
                  <input
                    required
                    type="email"
                    value={sampleForm.email}
                    onChange={(event) => setSampleForm({ ...sampleForm, email: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="you@company.com"
                  />
                </label>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-bold text-gray-700">Company</span>
                    <input
                      required
                      value={sampleForm.companyName}
                      onChange={(event) => setSampleForm({ ...sampleForm, companyName: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Company"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-gray-700">Phone</span>
                    <input
                      value={sampleForm.phone}
                      onChange={(event) => setSampleForm({ ...sampleForm, phone: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="+91..."
                    />
                  </label>
                </div>
              </div>

              {sampleError && (
                <p className="mt-4 text-sm font-semibold text-red-600">{sampleError}</p>
              )}
              {sampleStatus === "success" && (
                <p className="mt-4 text-sm font-semibold text-emerald-700">Sample report downloaded.</p>
              )}

              <button
                type="submit"
                disabled={sampleStatus === "submitting"}
                className="mt-6 w-full px-6 py-4 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-70 inline-flex items-center justify-center gap-2"
              >
                {sampleStatus === "submitting" ? "Preparing PDF..." : "Download Sample Report"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Before the Next Investor Conversation
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-2">
                Build a cleaner valuation story before investor calls, seed round pricing, or advisor review.
              </p>
              <p className="text-sm sm:text-base text-gray-500">
                Start free, upgrade anytime when you need more reports
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 border border-gray-200 shadow-lg mb-8">
              <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-primary mb-2 sm:mb-3">1</div>
                  <p className="text-sm sm:text-base text-gray-600">Free startup valuation</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">Start instantly, no card required</p>
                </div>
                <div className="text-center border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
                  <div className="text-4xl sm:text-5xl font-bold text-primary mb-2 sm:mb-3">Pro</div>
                  <p className="text-sm sm:text-base text-gray-600">Full report workflow</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">With Startup plan ($44/mo)</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/free-valuation" className="flex-1 rounded-lg bg-gradient-to-r from-primary to-[#005f5f] px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 sm:flex-none sm:px-8 sm:py-4">
                Start Free Valuation
              </Link>
              <Link href="/signup" className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-primary px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/5 sm:flex-none sm:px-8 sm:py-4">
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        </main>

        <footer className="border-t border-gray-200 py-12 px-6">
          <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
            <p>© 2024 Evaldam AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
