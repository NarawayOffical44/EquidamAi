"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Play, BarChart2, Cpu, BookOpen, FileText, ChevronRight, Star, ArrowRight } from "lucide-react";
import { FreeValuationWidget } from "@/components/FreeValuationWidget";
import { VideoModal } from "@/components/VideoModal";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Evaldam AI",
    "description": "Best affordable AI-powered startup valuation platform for Indian startups.",
    "url": "https://equidamai.com",
    "applicationCategory": "BusinessApplication",
    "areaServed": ["IN", "US", "UK", "UAE"],
    "inLanguage": "en-IN",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "127" },
    "author": { "@type": "Organization", "name": "Evaldam AI Inc." },
    "potentialAction": { "@type": "UseAction", "target": "https://equidamai.com/free-valuation" }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Evaldam AI",
    "url": "https://equidamai.com",
    "logo": "https://equidamai.com/logo.png",
    "description": "Professional AI-powered startup valuation platform for Indian founders",
    "address": { "@type": "PostalAddress", "addressCountry": "IN" },
    "contactPoint": { "@type": "ContactPoint", "contactType": "Customer Support", "url": "https://equidamai.com/contact" }
  };

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
    "description": "Introduction to Evaldam AI platform for startup valuation using 6 professional methods. Learn how the platform works and get your startup valued in 60 seconds.",
    "thumbnailUrl": ["https://equidamai.com/logo.png"],
    "uploadDate": "2026-04-30",
    "duration": "PT1M30S",
    "contentUrl": "https://equidamai.com/videos/evaldam-intro.mp4",
    "embedUrl": "https://equidamai.com/videos/evaldam-intro",
    "interactionCount": "127",
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
    "description": "Professional AI-powered startup valuation platform for Indian startups",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ── NAV ── */}
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Evaldam AI" width={32} height={32} className="rounded-md" />
                <span className="text-sm font-black text-gray-900 tracking-tight">evaldam</span>
              </Link>

              {/* Desktop links */}
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                <a href="#solutions" className="hover:text-gray-900 transition-colors">Solutions</a>
                <a href="#product" className="hover:text-gray-900 transition-colors">Product</a>
                <a href="#customers" className="hover:text-gray-900 transition-colors">Customers</a>
                <a href="#resources" className="hover:text-gray-900 transition-colors">Resources</a>
                <Link href="/valuation-report" className="hover:text-gray-900 transition-colors">Valuation Report</Link>
                <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
              </div>

              {/* Desktop CTAs */}
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

              {/* Mobile toggle */}
              <button className="md:hidden p-2 text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-3 bg-white">
              <a href="#solutions" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>Solutions</a>
              <a href="#product" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>Product</a>
              <a href="#customers" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>Customers</a>
              <a href="#resources" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>Resources</a>
              <Link href="/valuation-report" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>Valuation Report</Link>
              <Link href="/pricing" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>Pricing</Link>
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <Link href="/login" className="flex-1"><button className="w-full py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg">Sign in</button></Link>
                <Link href="/signup" className="flex-1"><button className="w-full py-2 text-sm font-bold text-white rounded-lg bg-primary">BUY NOW</button></Link>
              </div>
            </div>
          )}
        </nav>

        {/* ── HERO ── */}
        <section className="bg-white pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left: Copy */}
              <div>
                <h1 className="text-5xl lg:text-[3.75rem] font-black text-gray-900 leading-[1.06] tracking-tight mb-6">
                  Valuation that<br />
                  <span className="text-primary">wins investors.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 max-w-lg">
                  Credible, benchmarked, and investor-ready in under 60 seconds. Built for Indian startups raising angel and seed rounds.
                </p>
                <div className="flex flex-wrap gap-3 mb-10">
                  <button
                    onClick={() => setVideoOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 text-sm font-bold border-2 border-gray-800 text-gray-800 rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> WATCH VIDEO
                  </button>
                  <Link href="/signup">
                    <button className="px-7 py-3 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 bg-primary">
                      BUY NOW
                    </button>
                  </Link>
                </div>
                <p className="text-sm text-gray-400">
                  Trusted by founders in 🇮🇳 India raising <span className="font-semibold text-gray-600">angel & seed rounds</span>
                </p>
              </div>

              {/* Right: Product Mockup */}
              <div className="hidden lg:flex justify-center">
                <div className="relative w-full max-w-md">
                  {/* Main card */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pre-money Valuation</span>
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Donut chart + value */}
                      <div className="flex items-center justify-center gap-10 mb-6">
                        <div className="text-center">
                          <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Low Bound</div>
                          <div className="text-base font-black text-gray-700">$8.3M</div>
                        </div>

                        <div className="relative">
                          <svg width="110" height="110" viewBox="0 0 110 110">
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#00b2b2" strokeWidth="12"
                              strokeDasharray="180 84" strokeDashoffset="42" strokeLinecap="round"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                            <circle cx="55" cy="55" r="42" fill="none" stroke="#4dd4d4" strokeWidth="12"
                              strokeDasharray="80 184" strokeDashoffset="-138" strokeLinecap="round"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-2xl font-black text-gray-900">$13.6M</div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">High Bound</div>
                          <div className="text-base font-black text-gray-700">$18.9M</div>
                        </div>
                      </div>

                      {/* Comparables table */}
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="text-left px-4 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Company</th>
                              <th className="text-right px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Rev ×</th>
                              <th className="text-right px-4 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">EBITDA ×</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: "Razorpay", rev: "6.50 > 7.20", ebitda: "40.90 > 26.60" },
                              { name: "Zepto", rev: "16.60 > 17.70", ebitda: "28.20 > 31.20" },
                              { name: "Groww", rev: "7.86 > 17.90", ebitda: "30.40 > 33.70" },
                            ].map((r, i) => (
                              <tr key={r.name} className={i < 2 ? "border-b border-gray-50" : ""}>
                                <td className="px-4 py-2.5 font-semibold text-gray-800">{r.name}</td>
                                <td className="px-3 py-2.5 text-right text-primary font-medium">{r.rev}</td>
                                <td className="px-4 py-2.5 text-right text-primary font-medium">{r.ebitda}</td>
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

        {/* ── STATS BAR ── */}
        <section className="border-y border-gray-100 bg-gray-50 py-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-gray-200 text-center">
              {[
                { stat: "140,000+", label: "Startups valued globally" },
                { stat: "94%", label: "Positive investor reactions" },
                { stat: "$5B+", label: "Funding reports generated" },
              ].map((s) => (
                <div key={s.label} className="px-10">
                  <div className="text-3xl font-black text-primary mb-1">{s.stat}</div>
                  <div className="text-sm text-gray-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VIDEO SECTION ── */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-gray-900 mb-4">
                See Evaldam in Action
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Watch how founders get professional valuations in under 60 seconds—credible, benchmarked, and investor-ready.
              </p>
            </div>

            {/* Video Player */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: "56.25%" }}>
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
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors md:hidden"
              >
                <div className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors">
                  <Play className="w-8 h-8 text-primary fill-primary" />
                </div>
              </button>
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <p className="text-sm text-gray-500 mb-4">Ready to get your valuation?</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/free-valuation">
                  <button className="px-6 py-3 text-sm font-bold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity">
                    TRY FREE VALUATION
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="px-6 py-3 text-sm font-bold text-gray-900 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    SIGN UP
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── REPORT SECTION (equidam-inspired) ── */}
        <section id="product" className="py-0 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 min-h-[560px]">

              {/* Left: Steps */}
              <div className="flex flex-col justify-center px-10 py-20 lg:px-16 lg:py-24">
                <h2 className="text-4xl font-black leading-tight mb-3">
                  <span className="text-primary">The valuation report</span><br />
                  <span className="text-gray-900">investors read</span>
                </h2>
                <p className="text-gray-500 text-base mb-12 max-w-md leading-relaxed">
                  Six methods. Real benchmarks. Transparent analysis—so your valuation stands up to investor scrutiny.
                </p>

                <div className="space-y-8">
                  {[
                    { n: "1", title: "Create your account", desc: "Sign up free in seconds. No credit card needed. Includes 1 startup profile and 3 full valuation reports." },
                    { n: "2", title: "Enter your startup data", desc: "Paste your website URL or upload your pitch deck. Our AI auto-extracts key metrics and benchmarks instantly." },
                    { n: "3", title: "Download your investor-ready report", desc: "Get a blended valuation range from 6 methods with full PDF report, sensitivity analysis, and comparables." },
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
              <div className="relative flex items-center justify-center overflow-hidden" style={{ background: "#00b2b2" }}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white" />
                  <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full bg-white" />
                </div>
                {/* Angled report document */}
                <div className="relative z-10 m-10" style={{ transform: "rotate(6deg)" }}>
                  <div className="bg-white rounded-xl shadow-2xl w-72 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Evaldam AI · Valuation Report</div>
                      <div className="font-black text-gray-900 text-lg">Current funding round</div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Pre-money valuation</div>
                        <div className="text-2xl font-black" style={{ color: "#00b2b2" }}>₹ 9,560,380</div>
                        <div className="flex gap-4 mt-1">
                          <div className="text-[10px] text-gray-400">Low <span className="font-bold text-gray-700">₹ 7.1M</span></div>
                          <div className="text-[10px] text-gray-400">High <span className="font-bold text-gray-700">₹ 13.5M</span></div>
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
                          <div className="text-base font-black text-gray-900">₹ 1,590,000</div>
                          <div className="text-[10px] text-gray-400">Post-money: ₹ 11.1M</div>
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
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
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

        {/* ── FREE VALUATION CTA ── */}
        <section id="solutions" className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              {/* Left: Copy */}
              <div>
                <span className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-5">No Signup Required</span>
                <h2 className="text-4xl font-black text-gray-900 leading-tight mb-5">
                  Try a free instant valuation
                </h2>
                <p className="text-gray-600 text-lg md:text-xl mb-8 leading-relaxed">
                  Paste your startup website URL and get an instant pre-money valuation estimate. No credit card, no signup required.
                </p>
                <div className="space-y-3 mb-8">
                  {["No signup required", "No credit card", "Results in 60 seconds"].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">✓</div>
                      <span className="text-gray-700 text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/free-valuation">
                  <button className="flex items-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-white font-bold rounded-lg transition-all text-sm">
                    Check My Valuation <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Right: Widget */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <FreeValuationWidget />
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUSTED BY ── */}
        <section id="customers" className="py-14 border-t border-gray-100 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-center text-xs font-bold text-gray-400 mb-8 uppercase tracking-widest">Trusted by leading organizations</p>
            <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-4">
              {["JP Morgan", "Carta", "Microsoft", "SBA START", "EIC", "Tech Nation", "VC4A", "Startup Chile"].map((name) => (
                <span key={name} className="text-sm font-black text-gray-300 hover:text-gray-500 transition-colors tracking-tight uppercase">{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">WHY EVALDAM</span>
              <h2 className="text-3xl font-black text-gray-900 mt-3 mb-3">Everything you need to raise with confidence</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
                Six industry-standard valuation methods run in parallel, blended by startup stage for maximum accuracy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: <BarChart2 className="w-6 h-6" />, title: "6 Valuation Methods", desc: "Scorecard, Berkus, VC Method, DCF Long-Term Growth, DCF Exit Multiples, and our proprietary Evaldam AI Score — all blended by startup stage." },
                { icon: <Cpu className="w-6 h-6" />, title: "AI-Powered Data Extraction", desc: "Upload your pitch deck or paste your website URL. Our AI extracts key metrics, fills your profile, and benchmarks against 10,000+ comparable startups." },
                { icon: <BookOpen className="w-6 h-6" />, title: "Real Market Comparables", desc: "Your valuation is anchored to actual market data. See how your startup compares to peers by stage, industry, and growth rate — not guesswork." },
                { icon: <FileText className="w-6 h-6" />, title: "Investor-Ready PDF Reports", desc: "Professional PDF with 6-method breakdown, sensitivity analysis, executive summary, and benchmarks — ready to share with angels and VCs." },
              ].map((f) => (
                <div key={f.title} className="flex gap-5 p-7 rounded-2xl border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIAL ── */}
        <section className="py-20 border-t border-gray-100 bg-gray-50">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
            </div>
            <blockquote className="text-xl font-semibold text-gray-800 leading-relaxed mb-8">
              &ldquo;Evaldam gave us a credible, methodology-backed valuation that our lead investor trusted immediately. The AI extraction saved us hours of manual work. It&apos;s exactly what Indian founders need.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-sm">RK</div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-900">Rohit K.</div>
                <div className="text-xs text-gray-500">Founder, Series A · YC Alumni</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── GLOBAL REACH ── */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-gray-900 mb-3">140,000 startups valued across 90 countries</h2>
              <p className="text-gray-500 text-base max-w-xl mx-auto">From Bengaluru to Berlin, founders trust Evaldam to set the right price for their vision.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { region: "North America", count: "44,827" },
                { region: "Europe", count: "48,005" },
                { region: "Asia Pacific", count: "23,116" },
                { region: "Rest of World", count: "24,052" },
              ].map((r) => (
                <div key={r.region} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="text-2xl font-black text-gray-900 mb-1">{r.count}</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{r.region}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3-COLUMN TRUST (equidam-style) ── */}
        <section id="resources" className="py-20 border-t border-gray-100 relative overflow-hidden">
          {/* Subtle background dot pattern */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.5
          }} />
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

        {/* ── DARK CTA ── */}
        <section className="py-20 text-center" style={{ background: "#0a2a3a" }}>
          <div className="max-w-2xl mx-auto px-6">
            <p className="text-xs font-black uppercase tracking-widest mb-5 text-primary">GET STARTED NOW</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-snug">
              Start your valuation today.
            </h2>
            <p className="text-white/50 text-base mb-10">
              94% of investors respond positively to Evaldam reports. Join 3,200+ founders who raised with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <button className="px-8 py-3 text-sm font-bold text-white border-2 border-white/30 rounded-lg hover:border-white transition-colors">
                  GET A DEMO
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-8 py-3 text-sm font-bold text-white rounded-lg hover:opacity-90 transition-opacity bg-primary">
                  BUY NOW
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-0">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-14">

              {/* Product */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-900 mb-5">Product</p>
                <div className="space-y-3">
                  {[
                    { label: "How It Works", href: "#product" },
                    { label: "Methodology", href: "#" },
                    { label: "Valuation Report", href: "#" },
                    { label: "API", href: "#" },
                    { label: "Data Sources", href: "#" },
                    { label: "Pricing", href: "/pricing" },
                    { label: "Compare", href: "#" },
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
                    { label: "Help Center", href: "#" },
                    { label: "FAQs", href: "/pricing" },
                    { label: "Partners", href: "#" },
                    { label: "Blog & Articles", href: "#" },
                    { label: "Newsletter", href: "#" },
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
                    { label: "About Us", href: "#" },
                    { label: "Careers", href: "#" },
                    { label: "Research Center", href: "#" },
                    { label: "Contact Us", href: "/contact" },
                    { label: "Privacy", href: "#" },
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
                  Available in 🇮🇳 India and the{" "}
                  <a href="#" className="text-primary font-medium hover:underline">rest of the world</a>
                </p>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-gray-200 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Evaldam AI Inc. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Terms</a>
                <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Cookies</a>
                <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Privacy</a>
                {/* Social icons */}
                <div className="flex items-center gap-3 ml-2">
                  <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary transition-colors">
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
