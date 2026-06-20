"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { Play, BarChart2, Check, BookOpen, FileText, ChevronRight, Repeat2, ArrowRight, Star, TrendingUp } from "lucide-react";
import { FreeValuationWidget } from "@/components/FreeValuationWidget";
import { Navbar } from "@/components/Navbar";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { trackHomepageCtaClick } from "@/lib/analytics/ga4";

const VideoModal = dynamic(() => import("@/components/VideoModal").then((mod) => mod.VideoModal));

export default function Home() {
  const [videoOpen, setVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const comparableRows = [
    { name: "Fintech SaaS A", rev: "6.2 > 7.8", ebitda: "38.4 > 29.1" },
    { name: "DevTools B", rev: "14.3 > 16.9", ebitda: "25.7 > 30.5" },
    { name: "AI Platform C", rev: "8.1 > 18.4", ebitda: "31.2 > 35.8" },
  ];

  useEffect(() => {
    const targets = document.querySelectorAll<Element>('.s-reveal, .s-stagger, .evaldam-report-in');
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07, rootMargin: '0px 0px -44px 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

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
      { "@type": "Question", "name": "Which countries does Evaldam support?", "acceptedAnswer": { "@type": "Answer", "text": "Evaldam works for startups across 40+ markets, with deep comparable data even in emerging markets like India where most valuation tools fall short." } },
      { "@type": "Question", "name": "Does the AI decide my valuation?", "acceptedAnswer": { "@type": "Answer", "text": "No. Your valuation comes from six proven methods, not from AI guessing a number. The AI is an assistant that runs the methodology, explains every figure in plain language, and answers your questions — which is what keeps the result defensible to investors." } },
      { "@type": "Question", "name": "Can I track my startup valuation over time?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Evaldam keeps every valuation version so you can see how your number grows round over round and tie each change to a milestone — a live track record instead of a one-time snapshot." } },
      { "@type": "Question", "name": "Can I share the valuation report with investors?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. The investor-ready report is shareable by link or PDF and includes the method breakdown, comparables, assumptions, and sensitivity analysis behind the number." } }
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
      "https://x.com/EquidamAi",
      "https://instagram.com/evaldamai",
      "https://www.youtube.com/@EvaldamAi",
      "https://www.linkedin.com/company/evaldamai"
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

      <div className="public-page min-h-screen overflow-x-hidden bg-white text-gray-900">

        {/* -- NAV -- */}
        <Navbar />

        <main>
        {/* -- HERO -- */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/[0.04] via-white to-white pb-16 pt-10 sm:pt-14 md:pb-24 md:pt-24">
          <div aria-hidden className="pointer-events-none absolute -top-24 right-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -top-10 left-0 h-[320px] w-[320px] rounded-full bg-[#7c3aed]/5 blur-3xl" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">

              {/* Left: Copy */}
              <div className="flex flex-col justify-center">
                <h1 className="mb-6 text-[2rem] font-black leading-[1.12] text-gray-900 sm:text-4xl md:mb-7 lg:text-[3.55rem]">
                  Walk into valuation conversations <br className="hidden sm:block" />
                  <span className="text-primary italic">with a defensible range.</span>
                </h1>
                <p className="mb-12 max-w-xl text-base leading-7 text-gray-600 sm:mb-16 sm:text-lg sm:leading-8 lg:text-[21px]">
                  Evaldam AI values your company across six proven methods, writes the investor-grade report behind the number, and tracks how it grows over time — so you walk into every round knowing your worth and able to prove it.
                </p>
                <div className="mb-12 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:gap-4">
                  <a
                    href="https://evaldamai.zohobookings.in/portal-embed#/evaldamai-booking"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackHomepageCtaClick({
                        label: "Book Demo",
                        location: "homepage_hero",
                        destination: "https://evaldamai.zohobookings.in/portal-embed#/evaldamai-booking",
                        ctaType: "demo",
                      })
                    }
                    className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg border-2 border-gray-900 bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-gray-800 hover:bg-gray-800"
                  >
                    Book Demo
                  </a>
                  <Link
                    href="/signup"
                    onClick={() =>
                      trackHomepageCtaClick({
                        label: "Build Full Report",
                        location: "homepage_hero",
                        destination: "/signup",
                        ctaType: "signup",
                      })
                    }
                    className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-[#005f5f] px-7 py-3 text-center text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
                  >
                    Build Full Report <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/valuation-report"
                    onClick={() =>
                      trackHomepageCtaClick({
                        label: "Download Sample Report",
                        location: "homepage_hero",
                        destination: "/valuation-report",
                        ctaType: "sample_report",
                      })
                    }
                    className="inline-flex min-w-[150px] items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-5 py-3 text-center text-sm font-bold text-gray-900 transition-colors hover:border-gray-400"
                  >
                    Download Sample Report
                  </Link>
                </div>
                <Link href="/startup-valuation-benchmarks" className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-bold text-primary hover:underline">
                  Benchmark by country, stage, and industry <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-1 flex w-full flex-col items-center gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-3">
                  <a
                    href="https://www.producthunt.com/products/evaldam-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-evaldam-ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View Evaldam AI on Product Hunt"
                    className="inline-flex h-[54px] w-[250px] max-w-full shrink-0 justify-center overflow-hidden"
                  >
                    <img
                      src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1154599&theme=dark&t=1780210360117"
                      alt="Evaldam AI - AI that understands startups, valuation, funding and finance | Product Hunt"
                      width={250}
                      height={54}
                      loading="lazy"
                      decoding="async"
                      className="h-[54px] w-full max-w-[250px]"
                    />
                  </a>
                  <a
                    href="https://www.trustpilot.com/review/equidamai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Review Evaldam AI on Trustpilot"
                    className="inline-flex h-[54px] w-[250px] max-w-full shrink-0 items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 text-gray-900 transition-colors hover:border-[#00b67a]"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00b67a] text-white">
                      <Star className="h-4 w-4 fill-current" />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-[11px] font-black uppercase leading-none tracking-wider text-gray-500">Review us on</span>
                      <span className="mt-1 block text-lg font-black leading-none text-gray-900">Trustpilot</span>
                    </span>
                  </a>
                </div>
              </div>

              {/* Right: Product Mockup */}
              <div className="flex justify-center items-center lg:justify-end">
                <div className="evaldam-3d-stage relative h-auto w-full max-w-full sm:max-w-md">
                  {/* Main card */}
                  <div className="evaldam-hero-orbit-card w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg shadow-gray-200/60">
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-gray-300 flex items-center justify-between bg-white">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Pre-money Valuation</span>
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full border border-gray-300 bg-white" />
                        <div className="w-2.5 h-2.5 rounded-full border border-gray-300 bg-white" />
                        <div className="w-2.5 h-2.5 rounded-full border border-primary/40 bg-white" />
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      {/* Donut chart + value */}
                      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center justify-center gap-2 sm:gap-8">
                        <div className="min-w-0 text-center">
                          <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 sm:text-[11px]">Low Bound</div>
                          <div className="font-mono text-sm font-black tabular-nums text-gray-700 sm:text-base">$8.3M</div>
                        </div>

                        <div className="relative overflow-hidden rounded-full border border-primary/20 bg-white p-1">
                          <svg viewBox="0 0 110 110" className="relative z-10 h-20 w-20 sm:h-[110px] sm:w-[110px]">
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                            <circle className="evaldam-ring-primary" cx="55" cy="55" r="42" fill="none" stroke="var(--primary)" strokeWidth="12"
                              strokeDasharray="180 84" strokeDashoffset="42" strokeLinecap="round"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                            <circle className="evaldam-ring-secondary" cx="55" cy="55" r="42" fill="none" stroke="#4dd4d4" strokeWidth="12"
                              strokeDasharray="80 184" strokeDashoffset="-138" strokeLinecap="round"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                          </svg>
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                            <div className="font-mono text-lg font-black tabular-nums text-gray-900 sm:text-2xl">$13.6M</div>
                          </div>
                        </div>

                        <div className="min-w-0 text-center">
                          <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 sm:text-[11px]">High Bound</div>
                          <div className="font-mono text-sm font-black tabular-nums text-gray-700 sm:text-base">$18.9M</div>
                        </div>
                      </div>

                      {/* Comparables table */}
                      <div className="overflow-hidden rounded-lg border border-gray-300">
                        <div className="grid gap-2 p-3 sm:hidden">
                          {comparableRows.map((r, i) => (
                            <div
                              key={r.name}
                              className="evaldam-motion-row rounded-md border border-gray-200 bg-white p-3"
                              style={{ animationDelay: `${i * 140}ms` }}
                            >
                              <div className="mb-2 font-semibold text-gray-800">{r.name}</div>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <div className="font-semibold uppercase tracking-wide text-gray-500">Rev x</div>
                                  <div className="mt-0.5 font-medium text-primary">{r.rev}</div>
                                </div>
                                <div>
                                  <div className="font-semibold uppercase tracking-wide text-gray-500">EBITDA x</div>
                                  <div className="mt-0.5 font-medium text-primary">{r.ebitda}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <table className="hidden w-full text-xs sm:table">
                          <thead>
                            <tr className="bg-white border-b border-gray-300">
                              <th className="text-left px-3 sm:px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide text-[11px]">Company</th>
                              <th className="text-right px-2 sm:px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide text-[11px]">Rev x</th>
                              <th className="text-right px-3 sm:px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide text-[11px]">EBITDA x</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparableRows.map((r, i) => (
                              <tr
                                key={r.name}
                                className={`evaldam-motion-row ${i < 2 ? "border-b border-gray-300" : ""}`}
                                style={{ animationDelay: `${i * 140}ms` }}
                              >
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

        {/* -- GLOBAL TRUST BAND -- */}
        <section className="border-y border-gray-200 bg-gray-50 py-10 s-reveal">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-500">
              Trusted by founders, advisors, and investors raising across 40+ countries
            </p>
            <div className="mt-7 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
              {[
                { stat: "12,000+", label: "Valuations generated" },
                { stat: "$2.5B+", label: "In valuations modeled" },
                { stat: "40+", label: "Countries served" },
                { stat: "6", label: "Professional methods" },
              ].map((s) => (
                <div key={s.label} className="transition-transform hover:-translate-y-0.5">
                  <div className="text-2xl md:text-3xl font-black text-primary">{s.stat}</div>
                  <div className="mt-1 text-xs md:text-sm font-medium text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- 3-STEP JOURNEY -- */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-12 text-center s-reveal">
              <span className="text-xs font-black uppercase tracking-widest text-primary">How it works</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-black text-gray-900">
                From first guess to <span className="italic text-primary">tracked track record.</span>
              </h2>
            </div>
            <div className="relative grid gap-6 md:grid-cols-3 s-stagger">
              <div aria-hidden className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-primary/30 via-primary/30 to-primary/30 md:block" />
              {[
                { n: "1", Icon: BarChart2, title: "Get your range", desc: "Drop your website or details. A defensible low–mid–high pre-money range in minutes — free." },
                { n: "2", Icon: FileText, title: "Build the report", desc: "Six methods, comparables, and assumptions become an investor-ready report you can share by link or PDF." },
                { n: "3", Icon: TrendingUp, title: "Track over time", desc: "Keep every version. Watch your value grow round over round and walk in showing real momentum." },
              ].map((s) => (
                <div key={s.n} className="group relative rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg s-item">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#005f5f] text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
                    <s.Icon className="h-6 w-6" />
                  </div>
                  <div className="mb-2 text-xs font-black uppercase tracking-widest text-primary">Step {s.n}</div>
                  <h3 className="text-lg font-black text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-gray-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- ICP / TRUST POSITIONING -- */}
        <section className="bg-white py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div className="s-reveal">
                <span className="text-xs font-black uppercase tracking-widest text-primary">Who it&apos;s for</span>
                <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                  Built for everyone with a stake in the number.
                </h2>
                <p className="mt-4 max-w-xl text-base text-gray-600 leading-relaxed">
                  Getting a number is easy. Defending the range, the assumptions, and the tradeoffs when someone pushes back is the hard part. Evaldam turns that moment into a repeatable workflow — whichever side of the table you&apos;re on.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 s-stagger">
                {[
                  { title: "For founders", desc: "Know your range, build the report, and walk into every raise able to defend your number." },
                  { title: "For advisors & accelerators", desc: "Value and track an entire portfolio on one consistent methodology — no rebuilt spreadsheets." },
                  { title: "For angels & investors", desc: "Sanity-check founder asks and watch how each company's value moves over time." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg s-item">
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
        <section className="bg-white py-10 s-reveal">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-gray-200 text-center">
              {[
                { stat: "6-method AI", label: "Purpose-built valuation engine" },
                { stat: "Shareable", label: "Investor-ready reports" },
                { stat: "Over time", label: "Track your valuation as you grow" },
              ].map((s) => (
                <div key={s.label} className="px-10 transition-transform hover:-translate-y-0.5">
                  <div className="text-3xl font-black text-primary mb-1">{s.stat}</div>
                  <div className="text-sm text-gray-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- VIDEO SECTION -- */}
        <section className="py-20 bg-white s-reveal">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                Watch a defensible valuation <span className="italic text-primary">come together.</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From website to investor-ready range in minutes: see how the methods run, the AI explains, and the report gets built.
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
                preload="metadata"
                playsInline
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
                <Link href="/free-valuation" className="rounded-lg bg-gradient-to-r from-primary to-[#005f5f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
                  Get your valuation in 2 minutes
                </Link>
                <Link href="/signup" className="rounded-lg border-2 border-gray-300 px-6 py-3 text-sm font-bold text-gray-900 transition-colors hover:border-gray-400">
                  Sign up free
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

                <div className="space-y-8 s-stagger">
                  {[
                    { n: "1", title: "Capture your fundraising case", desc: "Add website, deck, revenue, growth, team, market, and private assumptions in one workspace." },
                    { n: "2", title: "Run a repeatable valuation", desc: "Use the same saved inputs to get the same valuation version. Create a new version only when the business case changes." },
                    { n: "3", title: "Share the investor-ready report", desc: "Export a PDF with blended range, method breakdown, sensitivity analysis, comparables, and evidence trail." },
                  ].map((s) => (
                    <div key={s.n} className="flex gap-4 items-start s-item">
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
                  <Link href="/valuation-report" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-[#005f5f] text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
                    Download sample report <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right: Teal bg with report mockup */}
              <div
                className="relative flex min-w-0 items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: "var(--primary)",
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              >
                {/* Angled report document */}
                <div className="evaldam-report-3d evaldam-report-in relative z-10 m-4 sm:m-10">
                  <div className="evaldam-report-page bg-white rounded-xl shadow-2xl w-64 overflow-hidden sm:w-72">
                    <div className="px-5 py-4 border-b border-gray-300">
                      <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest mb-1">Evaldam AI - Valuation Report</div>
                      <div className="font-black text-gray-900 text-lg">Current funding round</div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="text-[11px] text-gray-500 font-semibold mb-1">Pre-money valuation</div>
                        <div className="text-2xl font-black text-primary">$9.56M</div>
                        <div className="flex gap-4 mt-1">
                          <div className="text-[11px] text-gray-500">Low <span className="font-bold text-gray-700">$7.1M</span></div>
                          <div className="text-[11px] text-gray-500">High <span className="font-bold text-gray-700">$13.5M</span></div>
                        </div>
                      </div>
                      {/* Mini donut */}
                      <div className="flex items-center gap-4">
                        <svg width="64" height="64" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="24" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                          <circle cx="32" cy="32" r="24" fill="none" stroke="var(--primary)" strokeWidth="8"
                            strokeDasharray="100 51" strokeDashoffset="24" strokeLinecap="round"
                            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                          <text x="32" y="36" textAnchor="middle" fontSize="10" fontWeight="900" fill="#111827">22%</text>
                        </svg>
                        <div>
                          <div className="text-[11px] text-gray-500 font-semibold">Capital needed</div>
                          <div className="text-base font-black text-gray-900">$1.59M</div>
                          <div className="text-[11px] text-gray-500">Post-money: $11.1M</div>
                        </div>
                      </div>
                      {/* Method bars */}
                      <div className="space-y-2">
                        {[
                          { label: "Scorecard", pct: 68 },
                          { label: "Berkus", pct: 55 },
                          { label: "VC Method", pct: 100 },
                        ].map((m) => (
                          <div key={m.label} className="flex items-center gap-2 text-[11px]">
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

        {/* -- AI MOAT SECTION -- */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left: copy */}
              <div className="s-reveal">
                <span className="text-xs font-black uppercase tracking-widest text-primary">Your startup journey assistant</span>
                <h2 className="mt-3 text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                  An AI that actually <span className="italic text-primary">understands the founder journey.</span>
                </h2>
                <p className="mt-4 max-w-xl text-base md:text-lg text-gray-600 leading-relaxed">
                  Valuation is just the start. Ask about fundraising, dilution, ESOPs, term sheets, runway, and your next move — and get clear, situation-aware guidance. Your valuation still rests on six proven methods, so the number stays defensible while the AI helps with everything around it.
                </p>
                <div className="mt-8 space-y-4 s-stagger">
                  {[
                    { t: "Guidance for the whole journey", d: "Fundraising, dilution, ESOPs, term sheets, runway, and next steps — not just the valuation." },
                    { t: "Situation-aware answers", d: "Reads your stage, traction, and goals, then advises the way a seasoned founder would." },
                    { t: "Defensible where it counts", d: "Your valuation stays grounded in six proven methods, so the number holds up with investors." },
                  ].map((item) => (
                    <div key={item.t} className="flex gap-4 items-start s-item">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-white text-primary">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{item.t}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">{item.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: AI explanation card */}
              <div className="evaldam-3d-stage s-reveal">
                <div className="evaldam-hero-orbit-card overflow-hidden rounded-xl border border-gray-300 bg-white shadow-xl shadow-gray-200/60">
                  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
                        <BarChart2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black text-gray-900">Evaldam AI</span>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">Live reasoning</span>
                  </div>
                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-gray-900 px-4 py-2.5 text-sm text-white">
                      Why is my pre-money $13.6M and not higher?
                    </div>
                    <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
                      Your $13.6M base sits between a $8.3M floor and $18.9M ceiling. Strong 14% MoM growth and a clear market pull the number up. What holds it back: early revenue and a small team weigh on the Scorecard and VC methods.
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          { k: "Growth", v: "+", c: "text-green-600" },
                          { k: "Revenue", v: "–", c: "text-amber-600" },
                          { k: "Market", v: "+", c: "text-green-600" },
                        ].map((m) => (
                          <div key={m.k} className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-center">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{m.k}</div>
                            <div className={`text-base font-black ${m.c}`}>{m.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="max-w-[70%] rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700">
                      Add 3 months of revenue history to lift confidence to 80%+.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -- TRACK OVER TIME SECTION -- */}
        <section className="py-20" style={{ background: "#0a2a3a" }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left: chart */}
              <div className="order-2 lg:order-1 s-reveal">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                  <div className="mb-6 flex items-end justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-white/40">Current valuation</div>
                      <div className="mt-1 font-mono text-3xl font-black text-white">$13.6M</div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                      <TrendingUp className="h-3.5 w-3.5" /> +212% in 18 months
                    </div>
                  </div>
                  <svg viewBox="0 0 320 150" className="w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trackFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,120 L64,104 L128,86 L192,58 L256,40 L320,18 L320,150 L0,150 Z" fill="url(#trackFill)" />
                    <path d="M0,120 L64,104 L128,86 L192,58 L256,40 L320,18" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {[[0,120],[64,104],[128,86],[192,58],[256,40],[320,18]].map(([x,y]) => (
                      <circle key={x} cx={x} cy={y} r="3.5" fill="#0a2a3a" stroke="var(--primary)" strokeWidth="2" />
                    ))}
                  </svg>
                  <div className="mt-4 flex justify-between text-[11px] font-semibold text-white/40">
                    {["Idea", "Pre-seed", "Seed", "Bridge", "Series A", "Today"].map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Right: copy */}
              <div className="order-1 lg:order-2 s-reveal">
                <span className="text-xs font-black uppercase tracking-widest text-primary">Valuation over time</span>
                <h2 className="mt-3 text-3xl md:text-4xl font-black text-white leading-tight">
                  Your valuation isn&apos;t a one-time number. <span className="italic text-primary">It&apos;s a track record.</span>
                </h2>
                <p className="mt-4 max-w-xl text-base md:text-lg text-white/60 leading-relaxed">
                  Most tools value you once and disappear. Evaldam keeps every version, so you can tie each jump to a milestone, watch your number compound round over round, and walk into your next raise showing real momentum — not a single snapshot.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 s-stagger">
                  {[
                    { t: "Every round, in one timeline", d: "See how each raise and milestone moved your value." },
                    { t: "Momentum investors can see", d: "Show growth over time, not just today's estimate." },
                  ].map((item) => (
                    <div key={item.t} className="rounded-lg border border-white/10 bg-white/[0.03] p-5 s-item">
                      <div className="font-bold text-white">{item.t}</div>
                      <div className="mt-1 text-sm text-white/55 leading-relaxed">{item.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -- FREE VALUATION CTA -- */}
        <section id="solutions" className="py-20 bg-white s-reveal">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              {/* Left: Copy */}
              <div>
                <span className="inline-block px-3 py-1 border border-primary/20 bg-white rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-5">No Signup Required</span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-5">
                  Before pricing the round, <span className="italic text-primary">get a starting valuation</span>
                </h2>
                <p className="text-gray-600 text-lg md:text-xl mb-8 leading-relaxed">
                  Paste your startup website URL and get a quick pre-money valuation preview. When the conversation gets serious, upgrade for the full six-method report, saved assumptions, and investor-facing proof.
                </p>
                <div className="space-y-3 mb-8">
                  {["No signup required", "Useful starting valuation", "Paid report built for investor conversations"].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border border-primary/20 bg-white flex items-center justify-center text-primary font-bold text-xs">&#10003;</div>
                      <span className="text-gray-700 text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/free-valuation"
                  onClick={() =>
                    trackHomepageCtaClick({
                      label: "Generate my valuation",
                      location: "homepage_free_valuation",
                      destination: "/free-valuation",
                      ctaType: "free_valuation",
                    })
                  }
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-[#005f5f] text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 text-sm"
                >
                  Generate my valuation <ChevronRight className="w-4 h-4" />
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
        <section className="py-16 md:py-20 bg-white s-reveal">
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
                    <div className="rounded-lg border border-gray-300 bg-gray-900 p-2 text-white">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.22-3.37-1.22-.46-1.19-1.12-1.51-1.12-1.51-.92-.64.07-.63.07-.63 1.01.07 1.55 1.07 1.55 1.07.9 1.58 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.04-2.75-.1-.26-.45-1.3.1-2.71 0 0 .85-.28 2.78 1.05A9.4 9.4 0 0 1 12 6.99c.86 0 1.72.12 2.53.34 1.93-1.33 2.78-1.05 2.78-1.05.55 1.41.2 2.45.1 2.71.65.72 1.04 1.63 1.04 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.13 10.13 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
                      </svg>
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
                      <p className="text-xs font-bold uppercase text-gray-500">{metric.label}</p>
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
                <Link
                  href="/github-valuation"
                  onClick={() =>
                    trackHomepageCtaClick({
                      label: "Get an idea-stage valuation - no pitch deck needed",
                      location: "homepage_github_valuation",
                      destination: "/github-valuation",
                      ctaType: "github_valuation",
                    })
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                >
                  Get an idea-stage valuation — no pitch deck needed <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT SIGNALS */}
        <section id="customers" className="py-14 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-center text-xl font-black text-gray-900 mb-8 s-reveal">Everything in the platform — purpose-built for startup value.</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 s-stagger">
              {[
                { name: "Evidence Trail", desc: "Show the assumptions and sources behind the number." },
                { name: "Repeatable Results", desc: "Regenerate consistently when inputs change." },
                { name: "Comparables", desc: "Benchmark against relevant market and workspace peers." },
                { name: "Scenario Analysis", desc: "Test how growth, margins, and risk move the range." },
                { name: "Shareable Reports", desc: "Send investor-ready reports by link or PDF." },
                { name: "AI Assistant", desc: "Ask anything about your valuation and assumptions." },
                { name: "Pitch Deck Extraction", desc: "Turn existing materials into structured inputs." },
                { name: "Local Market Depth", desc: "Deep comparable data across 40+ markets, including ones others overlook." },
              ].map((item) => (
                <div key={item.name} className="rounded-lg border border-gray-200 bg-white px-4 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md s-item">
                  <p className="text-sm font-black uppercase tracking-tight text-gray-950">{item.name}</p>
                  <p className="mt-1 text-[15px] leading-6 text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- FEATURES -- */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 s-reveal">
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                Not a calculator. <span className="italic text-primary">A valuation intelligence platform.</span>
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto text-base leading-relaxed">
                A purpose-built AI, investor-ready reports, and a live valuation track record — everything you need to raise with confidence and grow your number over time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 s-stagger">
              {[
                { icon: <BarChart2 className="w-6 h-6" />, title: "A purpose-built valuation AI", desc: "Not a generic chatbot. Evaldam's AI understands startups, funding, and finance — running six proven methods and explaining every number in plain language." },
                { icon: <FileText className="w-6 h-6" />, title: "Reports you can share with investors", desc: "A clean, investor-grade report with method breakdown, comparables, sensitivity analysis, and assumptions — shareable by link or PDF, ready for the room." },
                { icon: <TrendingUp className="w-6 h-6" />, title: "Track your valuation over time", desc: "Valuation isn't a one-time number. Watch it grow round over round, tie jumps to milestones, and walk into every raise showing real momentum." },
                { icon: <BookOpen className="w-6 h-6" />, title: "Coverage in 40+ markets", desc: "Live market data and comparable companies across 40+ countries — including the emerging markets, like India, that most tools treat as an afterthought. Your number reflects your real market." },
              ].map((f) => (
                <div key={f.title} className="group flex flex-col gap-4 p-5 sm:p-8 rounded-xl border border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg transition-all s-item">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[#005f5f] flex items-center justify-center text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
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

        {/* -- 6 METHODS, PLAIN ENGLISH -- */}
        <section className="bg-gray-50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-12 max-w-3xl s-reveal">
              <span className="text-xs font-black uppercase tracking-widest text-primary">Why the number holds up</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-black leading-tight text-gray-900">
                Six ways to value your startup, <span className="italic text-primary">cross-checked into one.</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Anyone can pull a number out of thin air. Evaldam looks at your company from six angles investors already trust, then blends them, so the range you bring is hard to argue with.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 s-stagger">
              {[
                { n: "01", title: "Compared to similar startups", desc: "How companies at your stage, in your space, get priced." },
                { n: "02", title: "Credit for what you've built", desc: "Your product, team, and traction each add real value." },
                { n: "03", title: "Worked back from your exit", desc: "What investors need today to hit the return they want." },
                { n: "04", title: "Your future cash, valued now", desc: "The money your business will throw off, in today's terms." },
                { n: "05", title: "What buyers pay for your kind", desc: "Real acquisition and market multiples for companies like yours." },
                { n: "06", title: "An AI cross-check", desc: "Our model weighs every signal and flags anything that looks off." },
              ].map((m) => (
                <div key={m.n} className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg s-item">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-primary/30 transition-colors group-hover:text-primary/60">{m.n}</span>
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-black text-gray-900">{m.title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-gray-600">{m.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm font-semibold text-gray-500 s-reveal">
              Blended by stage into one low–mid–high range you can defend.
            </p>
          </div>
        </section>

        {/* -- TESTIMONIALS CAROUSEL -- */}
        <TestimonialsSection />

        {/* -- GLOBAL REACH -- */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12 s-reveal">
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                One number every founder and investor will <span className="italic text-primary">trust</span>
              </h2>
              <p className="text-gray-600 text-base max-w-xl mx-auto">Use one workspace to capture assumptions, compare peers, review valuation drivers, and generate investor-ready outputs.</p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 s-stagger">
              {[
                { count: "40+", label: "Countries with local comparable data" },
                { count: "Multi", label: "Currency support across all markets" },
                { count: "6", label: "Professional valuation methods blended" },
                { count: "Link", label: "Shareable investor-ready reports" },
              ].map((r) => (
                <div key={r.label} className="rounded-lg border border-gray-200 bg-white p-6 text-center hover:border-primary/40 hover:shadow-md transition-all s-item">
                  <div className="text-3xl font-black text-primary mb-2">{r.count}</div>
                  <div className="text-xs font-semibold text-gray-600 leading-relaxed">{r.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- FOUNDER JOURNEY MOMENTS -- */}
        <section className="py-20 bg-gray-50 s-reveal">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-14 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                The moments that matter most in a raise — <span className="italic text-primary">handled.</span>
              </h2>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                From the first number to a signed term sheet, Evaldam gives founders the financial clarity to move with confidence at every stage.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 s-stagger">
              {/* Moment 1 */}
              <div className="group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg s-item">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-primary">Before investor outreach</p>
                <h3 className="mt-2 text-lg font-black text-gray-900">Know your range before the call.</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Run six proven methods against your real inputs and get a defensible low–mid–high range in minutes. Walk into every first conversation with a number you can explain.
                </p>
                <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-700">
                  <span className="font-bold text-gray-900">Outcome:</span> A $6.2M–$14.8M range with documented assumptions — not a guess.
                </div>
              </div>

              {/* Moment 2 */}
              <div className="group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg s-item">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-primary">During due diligence</p>
                <h3 className="mt-2 text-lg font-black text-gray-900">Share the proof, not just the claim.</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Send a report link that shows methods, comparables, sensitivity analysis, and evidence trail. When the investor pushes back on assumptions, the AI walks you through each one.
                </p>
                <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-700">
                  <span className="font-bold text-gray-900">Outcome:</span> Fewer surprises in diligence. Investor sees the logic, not just the slide.
                </div>
              </div>

              {/* Moment 3 */}
              <div className="group rounded-2xl border border-primary/20 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg s-item">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-primary">When the term sheet lands</p>
                <h3 className="mt-2 text-lg font-black text-gray-900">Model dilution before you sign.</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Ask the AI how post-money ownership changes across different pre-money scenarios. Model ESOP pool sizing, liquidation preferences, and what each number means for your cap table.
                </p>
                <div className="mt-5 rounded-xl bg-primary/5 px-4 py-3 text-xs text-primary">
                  <span className="font-bold">Outcome:</span> Go into negotiation with real numbers — and close at a valuation you actually understood.
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link href="/free-valuation" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-[#005f5f] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
                Start your fundraising journey <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* -- 3-COLUMN TRUST (equidam-style) -- */}
        <section id="resources" className="py-20 bg-white relative overflow-hidden">
          <div className="relative max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center s-stagger">
              {[
                {
                  title: "Built for the raise of your life",
                  desc: "Pre-seed to Series B, your number has to hold up under pressure. Evaldam makes sure it does — ",
                  link: "talk to our team",
                  linkHref: "/contact",
                  suffix: " before your next round."
                },
                {
                  title: "Your data is yours, period",
                  desc: "We never sell it, never share it. Your cap table, deck, and numbers stay private and encrypted.",
                  link: null,
                  suffix: ""
                },
                {
                  title: "Priced to win, built to last",
                  desc: "A fraction of a consultant, sharper than a spreadsheet, and it compounds every round. ",
                  link: "see the plans",
                  linkHref: "/pricing",
                  suffix: "."
                },
              ].map((col) => (
                <div key={col.title} className="s-item">
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

        {/* -- VISION -- */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-12 max-w-3xl s-reveal">
              <span className="text-xs font-black uppercase tracking-widest text-primary">Where this is going</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-black leading-tight text-gray-900">
                Valuation becomes a number you <span className="italic text-primary">manage, like revenue.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-gray-600">
                Today you get a defensible range and a report. Tomorrow, your value updates as you grow, benchmarks itself against every funded peer, and walks into the room before you do. We&apos;re building the layer the whole market prices on.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3 s-stagger">
              {[
                { Icon: TrendingUp, title: "Always-current value", desc: "Your valuation re-prices itself as revenue, traction, and the market move — no rebuild, ever." },
                { Icon: BarChart2, title: "Live peer benchmarks", desc: "See exactly where you stand against every comparable raise, in real time, in your market." },
                { Icon: FileText, title: "An investor-trusted standard", desc: "One methodology founders, advisors, and funds agree on — so the number stops being a fight." },
              ].map((v) => (
                <div key={v.title} className="group rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-primary/[0.03] p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg s-item">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#005f5f] text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
                    <v.Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">{v.title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-gray-600">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- DARK CTA -- */}
        <section className="py-20 text-center s-reveal" style={{ background: "#0a2a3a" }}>
          <div className="max-w-2xl mx-auto px-6">
            <p className="text-xs font-black uppercase tracking-widest mb-5 text-cyan-200">Your valuation, managed</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-snug drop-shadow-sm">
              Start free. Grow your number. Prove it to investors.
            </h2>
            <p className="text-white/80 text-base mb-10">
              Get your first valuation in minutes, build the investor-ready report, and track your value every round — all on one platform, anywhere in the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="inline-flex w-full justify-center rounded-lg border-2 border-white/55 bg-white/5 px-8 py-3 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white/10 sm:w-auto">
                See pricing
              </Link>
              <Link href="/signup" className="inline-flex w-full justify-center rounded-lg bg-gradient-to-r from-primary to-[#005f5f] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 sm:w-auto">
                Start free
              </Link>
            </div>
          </div>
        </section>
        </main>

        {/* -- FOOTER -- */}
        <footer className="bg-white pt-16 pb-0">
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
                    { label: "Benchmarks", href: "/startup-valuation-benchmarks" },
                    { label: "Comparables", href: "/comparable-companies" },
                    { label: "Pricing", href: "/pricing" },
                    { label: "Free Valuation", href: "/free-valuation" },
                    { label: "FAQ", href: "/faq" },
                  ].map((l) => (
                    <a key={l.label} href={l.href} className="block text-[13px] font-semibold uppercase tracking-wide text-gray-500 hover:text-primary transition-colors">{l.label}</a>
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
                    <a key={l.label} href={l.href} className="block text-[13px] font-semibold uppercase tracking-wide text-gray-500 hover:text-primary transition-colors">{l.label}</a>
                  ))}
                </div>
              </div>

              {/* Evaldam */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-900 mb-5">Evaldam AI</p>
                <div className="space-y-3">
                  {[
                    { label: "Contact Us", href: "/contact" },
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms & Conditions", href: "/terms" },
                    { label: "Email Us", href: "mailto:hello@equidamai.com" },
                  ].map((l) => (
                    <a key={l.label} href={l.href} className="block text-[13px] font-semibold uppercase tracking-wide text-gray-500 hover:text-primary transition-colors">{l.label}</a>
                  ))}
                </div>
              </div>

              {/* Logo + availability */}
              <div className="flex flex-col items-start gap-4">
                <Link href="/">
                  <Image src="/logo.png" alt="Evaldam AI" width={40} height={40} className="rounded-md" />
                </Link>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Built in India, trusted by founders{" "}
                  <a href="/contact" className="text-primary font-medium hover:underline">worldwide</a>
                </p>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gray-300 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Evaldam AI Inc. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <a href="/terms" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Terms</a>
                <a href="/privacy" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Privacy</a>
                {/* Social icons */}
                <div className="flex items-center gap-3 ml-2">
                  <a href="https://www.linkedin.com/company/evaldamai" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" title="LinkedIn">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                  <a href="https://x.com/EquidamAi" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" title="X">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://www.youtube.com/@EvaldamAi" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" title="YouTube">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                  <a
                    href="https://www.producthunt.com/products/evaldam-ai?utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-evaldam-ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-gray-500 transition-colors hover:text-primary"
                    title="Product Hunt"
                    aria-label="View Evaldam AI on Product Hunt"
                  >
                    PH
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

