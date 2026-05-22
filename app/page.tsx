"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Play, BarChart2, Check, BookOpen, FileText, ChevronRight, Code2, Repeat2, ArrowRight } from "lucide-react";
import { FreeValuationWidget } from "@/components/FreeValuationWidget";
import { VideoModal } from "@/components/VideoModal";
import { Navbar } from "@/components/Navbar";
import { TestimonialsSection } from "@/components/TestimonialsSection";

export default function Home() {
  const [videoOpen, setVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoElement.muted = false;
          videoElement.play().catch(() => {});
        } else {
          videoElement.muted = true;
          videoElement.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(videoElement);
    return () => observer.disconnect();
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How do I get a free instant startup valuation?", "acceptedAnswer": { "@type": "Answer", "text": "Visit Evaldam's free valuation checker, paste your startup website URL, enter your email, and get an instant pre-money valuation estimate in seconds. No signup or credit card required." } },
      { "@type": "Question", "name": "What valuation methods does Evaldam use?", "acceptedAnswer": { "@type": "Answer", "text": "Evaldam uses 6 professional valuation methods: Scorecard, Berkus, VC Method, DCF Long-Term Growth, DCF Exit Multiples, and Evaldam AI Score." } },
      { "@type": "Question", "name": "Is Evaldam suitable for Indian startups?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! Evaldam is specifically optimized for Indian startups raising angel funding or seed rounds." } }
    ]
  };

  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Evaldam AI - Professional Startup Valuations",
    "description": "Introduction to Evaldam AI platform for startup valuation using 6 professional methods. Learn how the platform works and get your startup valued.",
    "thumbnailUrl": ["https://equidamai.com/logo.png"],
    "uploadDate": "2026-04-30",
    "duration": "PT1M30S",
    "contentUrl": "https://equidamai.com/videos/evaldam-intro.mp4",
    "embedUrl": "https://equidamai.com/videos/evaldam-intro",
    "publication": {
      "@type": "BroadcastEvent",
      "isLiveNow": false
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Evaldam AI",
    "image": "https://equidamai.com/logo.png",
    "description": "Defensible startup valuation reports for founders preparing to raise",
    "url": "https://equidamai.com",
    "telephone": "+91 63989 24106",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Whitefield",
      "addressLocality": "Bengaluru",
      "addressRegion": "Karnataka",
      "postalCode": "560056",
      "addressCountry": "IN"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "sameAs": [
      "https://equidamai.com",
      "https://twitter.com/evaldam",
      "https://linkedin.com/company/evaldam"
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://equidamai.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Solutions",
        "item": "https://equidamai.com/#solutions"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Product",
        "item": "https://equidamai.com/#product"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Pricing",
        "item": "https://equidamai.com/pricing"
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">

        {/* -- NAV -- */}
        <Navbar />

        <main>
        {/* -- HERO -- */}
        <section className="bg-white pt-10 md:pt-20 pb-12 md:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Left: Copy */}
              <div className="flex flex-col justify-center">
                <span className="mb-5 inline-flex w-fit rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-primary">
                  Before investor calls
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-[3.55rem] font-black text-gray-900 leading-[1.06] mb-5 md:mb-6">
                  Walk into valuation conversations<br className="hidden sm:block" />
                  <span className="text-primary italic">with a defensible range.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 sm:mb-10 max-w-lg">
                  Build a methodology-backed pre-money range, assumptions trail, comparables, and a report investors can question clearly before your next angel, seed, or advisor conversation.
                </p>
                <div className="flex flex-col gap-3 mb-8 sm:mb-10 sm:flex-row">
                  <button
                    onClick={() => setVideoOpen(true)}
                    className="flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-bold border-2 border-gray-800 text-gray-800 rounded-lg hover:border-primary hover:text-primary transition-colors sm:w-auto"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> WATCH VIDEO
                  </button>
                  <Link href="/signup" className="w-full px-7 py-3 text-center text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 hover:-translate-y-0.5 bg-primary shadow-lg shadow-primary/20 hover:shadow-[0_0_20px_rgba(0,178,178,0.3)] sm:w-auto">
                    Build Full Report
                  </Link>
                </div>
              </div>

              {/* Right: Product Mockup */}
              <div className="flex justify-center items-center lg:justify-end">
                <div className="relative w-full max-w-sm sm:max-w-md h-auto">
                  {/* Main card */}
                  <div className="bg-white rounded-lg border border-gray-300 shadow-2xl shadow-gray-200/70 overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-gray-300 flex items-center justify-between bg-white">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pre-money Valuation</span>
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full border border-gray-300 bg-white" />
                        <div className="w-2.5 h-2.5 rounded-full border border-gray-300 bg-white" />
                        <div className="w-2.5 h-2.5 rounded-full border border-primary/40 bg-white" />
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      {/* Donut chart + value */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-center gap-3 sm:gap-8 mb-6">
                        <div className="text-center">
                          <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Low Bound</div>
                          <div className="font-mono text-base font-black text-gray-700 tabular-nums">$8.3M</div>
                        </div>

                        <div className="relative overflow-hidden rounded-full border border-primary/20 bg-white p-1">
                          <svg viewBox="0 0 110 110" className="relative z-10 h-24 w-24 sm:h-[110px] sm:w-[110px]">
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#00b2b2" strokeWidth="12"
                              strokeDasharray="180 84" strokeDashoffset="42" strokeLinecap="round"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#4dd4d4" strokeWidth="12"
                              strokeDasharray="80 184" strokeDashoffset="-138" strokeLinecap="round"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                          </svg>
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                            <div className="font-mono text-xl sm:text-2xl font-black text-gray-900 tabular-nums">$13.6M</div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">High Bound</div>
                          <div className="font-mono text-base font-black text-gray-700 tabular-nums">$18.9M</div>
                        </div>
                      </div>

                      {/* Comparables table */}
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <table className="w-full text-[11px] sm:text-xs">
                          <thead>
                            <tr className="bg-white border-b border-gray-300">
                              <th className="text-left px-3 sm:px-4 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Company</th>
                              <th className="text-right px-2 sm:px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Rev x</th>
                              <th className="text-right px-3 sm:px-4 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">EBITDA x</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: "Razorpay", rev: "6.50 > 7.20", ebitda: "40.90 > 26.60" },
                              { name: "Zepto", rev: "16.60 > 17.70", ebitda: "28.20 > 31.20" },
                              { name: "Groww", rev: "7.86 > 17.90", ebitda: "30.40 > 33.70" },
                            ].map((r, i) => (
                              <tr key={r.name} className={i < 2 ? "border-b border-gray-300" : ""}>
                                <td className="px-3 sm:px-4 py-2.5 font-semibold text-gray-800">{r.name}</td>
                                <td className="px-2 sm:px-3 py-2.5 text-right text-primary font-medium">{r.rev}</td>
                                <td className="px-3 sm:px-4 py-2.5 text-right text-primary font-medium">{r.ebitda}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -- ICP / TRUST POSITIONING -- */}
        <section className="bg-white py-12 md:py-16 border-y border-gray-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-primary">Who pays for Evaldam</span>
                <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                  Before pricing a seed round, sending a valuation slide, or advising a founder.
                </h2>
                <p className="mt-4 max-w-xl text-base text-gray-600 leading-relaxed">
                  The hard part is not getting a number. It is explaining the range, the assumptions, the comparables, and the tradeoffs when someone pushes back. Evaldam turns that moment into a repeatable workflow.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: "Before investor calls", desc: "Know your low, mid, and high pre-money range before discussing terms." },
                  { title: "Before sending a slide", desc: "Show methods, assumptions, and comparable logic instead of a one-line estimate." },
                  { title: "Before advising a founder", desc: "Create repeatable reports across multiple startups without rebuilding spreadsheets." },
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border border-gray-300 bg-white p-5">
                    <div className="mb-3 h-8 w-8 rounded-md border border-primary/20 bg-white text-primary flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-black text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="border-y border-gray-300 bg-white py-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-gray-200 text-center">
              {[
                { stat: "6", label: "Professional methods" },
                { stat: "Stable", label: "Same inputs, same result" },
                { stat: "PDF", label: "Investor-ready report" },
              ].map((s) => (
                <div key={s.label} className="px-10">
                  <div className="text-3xl font-black text-primary mb-1">{s.stat}</div>
                  <div className="text-sm text-gray-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- VIDEO SECTION -- */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                See Evaldam in <span className="italic">Action</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Watch how founders get <span className="font-semibold">professional, investor-ready valuations</span> that are credible, benchmarked, and methodology-backed.
              </p>
            </div>

            {/* Video Player */}
            <div className="relative bg-white rounded-lg overflow-hidden border border-gray-300 shadow-2xl" style={{ paddingBottom: "56.25%" }}>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full"
                poster="/logo.png"
                muted={true}
                loop
              >
                <source src="/videos/evaldam-intro.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Play button overlay (for mobile) */}
              <button
                onClick={() => setVideoOpen(true)}
                aria-label="Play Evaldam intro video"
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-transparent transition-colors md:hidden"
              >
                <div className="rounded-full bg-white/95 p-4 shadow-lg transition-transform hover:scale-105">
                  <Play className="w-8 h-8 text-primary fill-primary" />
                </div>
              </button>
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <p className="text-sm text-gray-500 mb-4">Ready to get your valuation?</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/free-valuation" className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
                  TRY FREE VALUATION
                </Link>
                <Link href="/signup" className="rounded-lg border-2 border-gray-300 px-6 py-3 text-sm font-bold text-gray-900 transition-colors hover:border-gray-400">
                  SIGN UP
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* -- REPORT SECTION (equidam-inspired) -- */}
        <section id="product" className="py-0 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid min-w-0 lg:grid-cols-2 min-h-[560px]">

              {/* Left: Steps */}
              <div className="flex flex-col justify-center px-4 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
                <h2 className="text-3xl md:text-4xl font-black leading-tight mb-3">
                  Before investors question<br />
                  <span className="italic text-primary">the valuation slide</span>
                </h2>
                <p className="text-gray-600 text-base mb-12 max-w-md leading-relaxed">
                  Six methods, comparables, and transparent assumptions help your valuation stand up to investor scrutiny.
                </p>

                <div className="space-y-8">
                  {[
                    { n: "1", title: "Capture your fundraising case", desc: "Add website, deck, revenue, growth, team, market, and private assumptions in one workspace." },
                    { n: "2", title: "Run a repeatable valuation", desc: "Use the same saved inputs to get the same valuation version. Create a new version only when the business case changes." },
                    { n: "3", title: "Share the investor-ready report", desc: "Export a PDF with blended range, method breakdown, sensitivity analysis, comparables, and evidence trail." },
                  ].map((s) => (
                    <div key={s.n} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0 bg-primary">
                        {s.n}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 mb-1">{s.title}</div>
                        <div className="text-sm text-gray-500 leading-relaxed">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Link href="/valuation-report" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                    DOWNLOAD SAMPLE REPORT <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right: Teal bg with report mockup */}
              <div
                className="relative flex min-w-0 items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: "#00b2b2",
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              >
                {/* Angled report document */}
                <div className="relative z-10 m-4 sm:m-10" style={{ transform: "rotate(3deg)" }}>
                  <div className="bg-white rounded-xl shadow-2xl w-64 overflow-hidden sm:w-72">
                    <div className="px-5 py-4 border-b border-gray-300">
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Evaldam AI - Valuation Report</div>
                      <div className="font-black text-gray-900 text-lg">Current funding round</div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Pre-money valuation</div>
                        <div className="text-2xl font-black" style={{ color: "#00b2b2" }}>INR 9,560,380</div>
                        <div className="flex gap-4 mt-1">
                          <div className="text-[10px] text-gray-400">Low <span className="font-bold text-gray-700">INR 7.1M</span></div>
                          <div className="text-[10px] text-gray-400">High <span className="font-bold text-gray-700">INR 13.5M</span></div>
                        </div>
                      </div>
                      {/* Mini donut */}
                      <div className="flex items-center gap-4">
                        <svg width="64" height="64" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="24" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                          <circle cx="32" cy="32" r="24" fill="none" stroke="#00b2b2" strokeWidth="8"
                            strokeDasharray="100 51" strokeDashoffset="24" strokeLinecap="round"
                            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                          <text x="32" y="36" textAnchor="middle" fontSize="10" fontWeight="900" fill="#111827">22%</text>
                        </svg>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Capital needed</div>
                          <div className="text-base font-black text-gray-900">INR 1,590,000</div>
                          <div className="text-[10px] text-gray-400">Post-money: INR 11.1M</div>
                        </div>
                      </div>
                      {/* Method bars */}
                      <div className="space-y-2">
                        {[
                          { label: "Scorecard", pct: 68 },
                          { label: "Berkus", pct: 55 },
                          { label: "VC Method", pct: 100 },
                        ].map((m) => (
                          <div key={m.label} className="flex items-center gap-2 text-[10px]">
                            <span className="w-14 text-gray-500 truncate">{m.label}</span>
                            <div className="flex-1 border border-gray-300 bg-white rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${m.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -- FREE VALUATION CTA -- */}
        <section id="solutions" className="py-20 bg-white border-t border-gray-300">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              {/* Left: Copy */}
              <div>
                <span className="inline-block px-3 py-1 border border-primary/20 bg-white rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-5">No Signup Required</span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-5">
                  Before pricing the round, <span className="italic text-primary">get a starting range</span>
                </h2>
                <p className="text-gray-600 text-lg md:text-xl mb-8 leading-relaxed">
                  Paste your startup website URL and get a quick pre-money valuation preview. When the conversation gets serious, upgrade for the full six-method report, saved assumptions, and investor-facing proof.
                </p>
                <div className="space-y-3 mb-8">
                  {["No signup required", "Useful starting range", "Paid report built for investor conversations"].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border border-primary/20 bg-white flex items-center justify-center text-primary font-bold text-xs">&#10003;</div>
                      <span className="text-gray-700 text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/free-valuation" className="flex items-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-white font-bold rounded-lg transition-all text-sm">
                  Check My Valuation <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right: Widget */}
              <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-5 sm:p-8">
                <FreeValuationWidget />
              </div>
            </div>
          </div>
        </section>

        {/* -- FREE GITHUB REPO VALUATION -- */}
        <section className="py-16 md:py-20 bg-white border-t border-gray-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div>
                <span className="inline-block px-3 py-1 border border-primary/20 bg-white rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-5">
                  Free repo tool
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-5">
                  Turn a GitHub repo into an <span className="italic text-primary">idea-stage valuation</span>
                </h2>
                <p className="text-gray-600 text-base md:text-lg mb-7 leading-relaxed">
                  For open source projects, AI tools, prototypes, and devtools, Evaldam reads repo signals as evidence of execution, adoption, market clarity, and startup potential.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Explains why the range is high or low",
                    "Reviews investor risks and next milestones",
                    "Uses Berkus and Scorecard-style idea-stage logic",
                    "Feeds naturally into a full startup valuation report",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-white text-primary">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-300 bg-white p-5 md:p-6 shadow-xl shadow-gray-200/70">
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-gray-300 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">GitHub Repo Valuation</p>
                      <p className="text-xs text-gray-500">Free marketing tool for idea-stage projects</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-bold text-primary">New</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Score", value: "0-100" },
                    { label: "Range", value: "$25K+" },
                    { label: "Review", value: "AI analyst" },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-gray-300 bg-white p-4 text-center">
                      <p className="text-xs font-bold uppercase text-gray-400">{metric.label}</p>
                      <p className="mt-1 text-lg font-black text-gray-900">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-lg border border-blue-100 bg-white p-4">
                  <div className="flex gap-3">
                    <Repeat2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                    <p className="text-sm leading-relaxed text-blue-900">
                      Same repo data and same assumptions should produce the same result. Valuation changes only when signals, inputs, or methodology change.
                    </p>
                  </div>
                </div>
                <Link href="/github-valuation" className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90">
                  Value a GitHub Repo <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT SIGNALS */}
        <section id="customers" className="py-14 border-t border-gray-300 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-center text-xs font-bold text-gray-400 mb-8 uppercase tracking-widest">Built for high-stakes valuation conversations</p>
            <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-4">
              {["Evidence Trail", "Repeatable Results", "Comparables", "Scenario Analysis", "PDF Reports", "AI Chat", "Pitch Deck Extraction", "India-First Benchmarks"].map((name) => (
                <span key={name} className="text-sm font-black text-gray-300 hover:text-gray-500 transition-colors tracking-tight uppercase">{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* -- FEATURES -- */}
        <section className="py-20 bg-white border-t border-gray-300">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">WHY EVALDAM</span>
              <h2 className="text-3xl font-black text-gray-900 mt-3 mb-3">
                Everything you need to <span className="italic">raise with confidence</span>
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto text-base leading-relaxed">
                Six industry-standard valuation methods run in parallel, blended by startup stage for maximum accuracy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: <BarChart2 className="w-6 h-6" />, title: "6 Valuation Methods", desc: "Scorecard, Berkus, VC Method, DCF Long-Term Growth, DCF Exit Multiples, and Evaldam Score blended by startup stage." },
                { icon: <Repeat2 className="w-6 h-6" />, title: "Repeatable Valuation Versions", desc: "Same saved inputs reuse the existing valuation. New versions are created only when material assumptions, business data, or methodology change." },
                { icon: <BookOpen className="w-6 h-6" />, title: "Comparable Reasoning", desc: "Anchor the valuation to market patterns, funding stage, geography, business model, growth, and risk rather than a generic AI answer." },
                { icon: <FileText className="w-6 h-6" />, title: "Investor-Ready PDF Reports", desc: "Professional PDF with method breakdown, sensitivity analysis, executive summary, assumptions trail, and investor-facing valuation story." },
              ].map((f) => (
                <div key={f.title} className="flex flex-col gap-4 p-5 sm:p-8 rounded-lg border border-gray-300 bg-white hover:border-primary/60 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl border border-primary/20 bg-white flex items-center justify-center text-primary">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- TESTIMONIALS CAROUSEL -- */}
        <TestimonialsSection />

        {/* -- GLOBAL REACH -- */}
        <section className="py-16 bg-white border-t border-gray-300">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                Built for founders preparing <span className="italic text-primary">serious rounds</span>
              </h2>
              <p className="text-gray-600 text-base max-w-xl mx-auto">Use one workspace to capture assumptions, compare peers, review valuation drivers, and generate investor-ready outputs.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { region: "Methods", count: "6" },
                { region: "Currencies", count: "INR/USD/EUR" },
                { region: "Workflow", count: "Review" },
                { region: "Outputs", count: "PDF" },
              ].map((r) => (
                <div key={r.region} className="p-6 rounded-lg bg-white border border-gray-300 hover:border-primary/60 hover:shadow-md transition-all">
                  <div className="text-3xl font-black text-primary mb-2">{r.count}</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{r.region}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- COMPARISON TABLE -- */}
        <section className="py-20 bg-white border-t border-gray-300">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                Before the valuation number gets challenged
              </h2>
              <p className="text-gray-600 text-base max-w-2xl mx-auto">
                Evaldam gives founders, advisors, accelerators, and VCs a practical startup valuation consultant alternative: faster, repeatable, and easier to explain.
              </p>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 bg-white">
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-900 w-1/4">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-primary">Evaldam</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-gray-600">Consultants</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-gray-600">Other Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">Free preview</td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-primary">Website + GitHub</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">2-4 weeks</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Prompt-only</td>
                  </tr>
                  <tr className="transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">Repeatable output</td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-primary">Same inputs, same result</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">INR 20,000+</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Can vary by prompt</td>
                  </tr>
                  <tr className="transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">Indian comparables</td>
                    <td className="px-6 py-4 text-center"><span className="text-green-600 text-lg">Yes</span></td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Sometimes</td>
                    <td className="px-6 py-4 text-center"><span className="text-red-500 text-lg">No</span></td>
                  </tr>
                  <tr className="transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">Multi-currency</td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-green-600">INR/USD/EUR</td>
                    <td className="px-6 py-4 text-center"><span className="text-red-500 text-lg">No</span></td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">USD only</td>
                  </tr>
                  <tr className="transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">AI chat for assumptions</td>
                    <td className="px-6 py-4 text-center"><span className="text-green-600 text-lg">Yes</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-red-500 text-lg">No</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-red-500 text-lg">No</span></td>
                  </tr>
                  <tr className="transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">Pitch deck extraction</td>
                    <td className="px-6 py-4 text-center"><span className="text-green-600 text-lg">Yes</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-red-500 text-lg">No</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-red-500 text-lg">No</span></td>
                  </tr>
                  <tr className="transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">Self-serve</td>
                    <td className="px-6 py-4 text-center"><span className="text-green-600 text-lg">Yes</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-red-500 text-lg">No</span></td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Partial</td>
                  </tr>
                  <tr className="transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">Change assumptions</td>
                    <td className="px-6 py-4 text-center"><span className="text-green-600 text-lg">Yes</span></td>
                    <td className="px-6 py-4 text-center"><span className="text-red-500 text-lg">No</span></td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Partial</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile: Card Stack */}
            <div className="lg:hidden space-y-4">
              {[
                { feature: "Free preview", evaldam: "Website + GitHub", consultant: "2-4 weeks", other: "Prompt-only" },
                { feature: "Repeatable output", evaldam: "Same inputs, same result", consultant: "Manual", other: "Can vary" },
                { feature: "Indian comparables", evaldam: "Yes", consultant: "Sometimes", other: "No" },
                { feature: "Multi-currency", evaldam: "INR/USD/EUR", consultant: "No", other: "USD only" },
                { feature: "AI chat for assumptions", evaldam: "Yes", consultant: "No", other: "No" },
                { feature: "Pitch deck extraction", evaldam: "Yes", consultant: "No", other: "No" },
                { feature: "Self-serve", evaldam: "Yes", consultant: "No", other: "Partial" },
                { feature: "Change assumptions", evaldam: "Yes", consultant: "No", other: "Partial" },
              ].map((row) => (
                <div key={row.feature} className="bg-white border border-gray-300 rounded-lg p-4">
                  <div className="font-bold text-gray-900 text-sm mb-3">{row.feature}</div>
                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                    <div className="text-center">
                      <div className="font-bold text-primary">{row.evaldam}</div>
                      <div className="text-gray-500 text-[10px] mt-1">Evaldam</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">{row.consultant}</div>
                      <div className="text-gray-500 text-[10px] mt-1">Consultants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">{row.other}</div>
                      <div className="text-gray-500 text-[10px] mt-1">Other Tools</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Link href="/pricing" className="inline-flex w-full justify-center rounded-lg bg-primary px-8 py-3 font-bold text-white transition-opacity hover:opacity-90 sm:w-auto">
                See Pricing & Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* -- 3-COLUMN TRUST (equidam-style) -- */}
        <section id="resources" className="py-20 border-t border-gray-300 bg-white relative overflow-hidden">
          <div className="relative max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {[
                {
                  title: "Ask Our Team",
                  desc: "For any technical or financial questions,",
                  link: "just get in touch",
                  linkHref: "/contact",
                  suffix: "! We will be happy to provide you with relevant and tailored answers."
                },
                {
                  title: "India-First Privacy",
                  desc: "We care about your data. We don't sell it, share it, and we do everything we can to protect it.",
                  link: null,
                  suffix: ""
                },
                {
                  title: "Compare Evaldam",
                  desc: "Evaldam is the most thorough startup valuation platform built for Indian founders. It's ",
                  link: "faster and more affordable than traditional services",
                  linkHref: "/pricing",
                  suffix: "."
                },
              ].map((col) => (
                <div key={col.title}>
                  <h3 className="font-bold text-lg mb-1 inline-block border-b-2 border-primary text-primary pb-0.5">
                    {col.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mt-3">
                    {col.desc}
                    {col.link && (
                      <a href={col.linkHref} className="text-primary font-medium hover:underline">{col.link}</a>
                    )}
                    {col.suffix}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- DARK CTA -- */}
        <section className="py-20 text-center" style={{ background: "#0a2a3a" }}>
          <div className="max-w-2xl mx-auto px-6">
            <p className="text-xs font-black uppercase tracking-widest mb-5 text-primary">Before the next valuation conversation</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-snug">
              Bring a range, not a guess.
            </h2>
            <p className="text-white/60 text-base mb-10">
              Build a cleaner valuation story with methods, comparables, assumptions, review notes, and investor-ready reports in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="inline-flex w-full justify-center rounded-lg border-2 border-white/30 px-8 py-3 text-sm font-bold text-white transition-colors hover:border-white sm:w-auto">
                GET A DEMO
              </Link>
              <Link href="/signup" className="inline-flex w-full justify-center rounded-lg bg-primary px-8 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto">
                Choose Plan
              </Link>
            </div>
          </div>
        </section>
        </main>

        {/* -- FOOTER -- */}
        <footer className="bg-white border-t border-gray-300 pt-16 pb-0">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 gap-8 pb-14 sm:grid-cols-2 md:grid-cols-4 md:gap-10">

              {/* Product */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-900 mb-5">Product</p>
                <div className="space-y-3">
                  {[
                    { label: "How It Works", href: "#product" },
                    { label: "Methodology", href: "/methodology" },
                    { label: "Valuation Report", href: "/valuation-report" },
                    { label: "Comparables", href: "/comparable-companies" },
                    { label: "Pricing", href: "/pricing" },
                    { label: "Free Valuation", href: "/free-valuation" },
                    { label: "FAQ", href: "/faq" },
                  ].map((l) => (
                    <a key={l.label} href={l.href} className="block text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-primary transition-colors">{l.label}</a>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-900 mb-5">Resources</p>
                <div className="space-y-3">
                  {[
                    { label: "Schedule a Demo", href: "/login" },
                    { label: "Free Calculator", href: "/free-valuation" },
                    { label: "Methodology Docs", href: "/methodology" },
                    { label: "FAQs", href: "/faq" },
                    { label: "Contact Support", href: "/contact" },
                  ].map((l) => (
                    <a key={l.label} href={l.href} className="block text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-primary transition-colors">{l.label}</a>
                  ))}
                </div>
              </div>

              {/* Evaldam */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-900 mb-5">Evaldam</p>
                <div className="space-y-3">
                  {[
                    { label: "Contact Us", href: "/contact" },
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms & Conditions", href: "/terms" },
                    { label: "Email Us", href: "mailto:hello@equidamai.com" },
                  ].map((l) => (
                    <a key={l.label} href={l.href} className="block text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-primary transition-colors">{l.label}</a>
                  ))}
                </div>
              </div>

              {/* Logo + availability */}
              <div className="flex flex-col items-start gap-4">
                <Link href="/">
                  <Image src="/logo.png" alt="Evaldam AI" width={40} height={40} className="rounded-md" />
                </Link>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Available in India and the{" "}
                  <a href="/contact" className="text-primary font-medium hover:underline">rest of the world</a>
                </p>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gray-300 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Evaldam AI Inc. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <a href="/terms" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Terms</a>
                <a href="/privacy" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Privacy</a>
                {/* Social icons */}
                <div className="flex items-center gap-3 ml-2">
                  <a href="https://linkedin.com/company/evaldam" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" title="LinkedIn">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                  <a href="https://twitter.com/evaldam" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" title="Twitter/X">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://youtube.com/@evaldam" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" title="YouTube">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>

        {/* Video Modal */}
        <VideoModal
          isOpen={videoOpen}
          onClose={() => setVideoOpen(false)}
          videoSrc="/videos/evaldam-intro.mp4"
          title="Evaldam AI - Professional Startup Valuations"
        />

      </div>
    </>
  );
}




