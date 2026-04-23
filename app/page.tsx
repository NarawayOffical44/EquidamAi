"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Sparkles, ArrowRight, TrendingUp, Zap, FileText, CheckCircle2,
  Upload, Lightbulb, BarChart3, Download, Shield, Clock,
  Menu, X, Star
} from "lucide-react";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container-max px-container">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Evaldam AI</span>
            </Link>

            <div className="hidden md:flex items-center gap-1 text-sm">
              <a href="#features" className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors font-medium">Features</a>
              <a href="#methods"  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors font-medium">Methods</a>
              <Link href="/pricing" className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors font-medium">Pricing</Link>
              <a href="#how-it-works" className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors font-medium">How It Works</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Login</Link>
              <Link href="/signup">
                <button className="btn btn-primary btn-sm flex items-center gap-1.5">
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>

            <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
              <a href="#features"    className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="#methods"     className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileOpen(false)}>Methods</a>
              <Link href="/pricing"  className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileOpen(false)}>Pricing</Link>
              <a href="#how-it-works" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md" onClick={() => setMobileOpen(false)}>How It Works</a>
              <div className="pt-2 border-t border-gray-100 flex gap-2 px-3">
                <Link href="/login"   className="btn btn-secondary btn-sm flex-1 justify-center">Login</Link>
                <Link href="/signup"  className="btn btn-primary  btn-sm flex-1 justify-center">Get Started</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-white to-violet-50/30 pointer-events-none" />
        <div className="container-max px-container py-hero relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-full px-3.5 py-1.5 mb-7">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-primary uppercase tracking-widest">AI-Powered Startup Valuation</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.07] tracking-tight mb-6">
                Professional<br />
                valuations for<br />
                <span className="gradient-text">serious founders.</span>
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
                5-method AI valuation with the rigour of top chartered accountants.
                Investor-ready reports delivered in under 60 seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/signup">
                  <button className="btn btn-primary btn-lg flex items-center gap-2 w-full sm:w-auto justify-center">
                    Start Free Trial <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/pricing">
                  <button className="btn btn-secondary btn-lg w-full sm:w-auto justify-center">
                    View Pricing
                  </button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-6 border-t border-gray-100">
                {[
                  { v: "2,400+", l: "Valuations" },
                  { v: "5",      l: "VC Methods" },
                  { v: "<60s",   l: "Turnaround" },
                  { v: "4.9★",   l: "Rating" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-xl font-bold text-gray-900">{s.v}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Product Preview Card */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-violet-100 rounded-3xl blur-3xl opacity-30" />
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-sm mx-auto">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Acme Technologies</div>
                    <div className="text-xs text-gray-400 mt-0.5">Series A · SaaS · US</div>
                  </div>
                  <span className="badge badge-success">Complete</span>
                </div>

                {/* Main valuation */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-1">Blended Valuation Range</div>
                  <div className="text-2xl font-bold text-gray-900 mb-3">$8.2M — $12.4M</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full" style={{width: '78%'}} />
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">78% confidence</span>
                  </div>
                </div>

                {/* Method breakdown */}
                <div className="space-y-2.5 mb-5">
                  {[
                    { name: "Scorecard",    value: "$9.1M",  w: 73 },
                    { name: "Berkus",       value: "$7.8M",  w: 63 },
                    { name: "VC Method",    value: "$11.2M", w: 90 },
                    { name: "DCF-LTG",      value: "$8.6M",  w: 69 },
                    { name: "DCF-Multiples",value: "$12.4M", w: 100},
                  ].map((m) => (
                    <div key={m.name} className="flex items-center gap-3">
                      <div className="text-xs text-gray-500 w-24 flex-shrink-0">{m.name}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                        <div className="bg-primary/50 h-1 rounded-full" style={{width: `${m.w}%`}} />
                      </div>
                      <div className="text-xs font-semibold text-gray-700 w-12 text-right">{m.value}</div>
                    </div>
                  ))}
                </div>

                <button className="w-full text-sm font-semibold text-primary bg-rose-50 hover:bg-rose-100 rounded-lg py-2.5 transition-colors">
                  View Full Report →
                </button>

                {/* Floating label */}
                <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  AI Generated
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="container-max px-container">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trusted by founders backed by</p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {["Y Combinator", "Techstars", "Sequoia Capital", "a16z", "Accel Partners"].map((n) => (
                <span key={n} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors">{n}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-section bg-white">
        <div className="container-max px-container">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything a serious founder needs</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Professional-grade valuation engine trusted by founders raising from top-tier VCs in the US, UK, and UAE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Zap className="w-5 h-5" />,          color: "bg-amber-50 text-amber-600",  title: "AI Auto-Fill from Pitch Deck",  desc: "Upload your pitch deck — our AI extracts 70–80% of data automatically in seconds." },
              { icon: <BarChart3 className="w-5 h-5" />,     color: "bg-blue-50 text-blue-600",    title: "5 Professional Methods",        desc: "Scorecard, Berkus, VC Method, DCF-LTG, DCF-Multiples — the full VC toolkit." },
              { icon: <FileText className="w-5 h-5" />,      color: "bg-violet-50 text-violet-600",title: "Investor-Ready PDF Reports",    desc: "25–35 page reports with charts, methodology breakdowns, and market comparables." },
              { icon: <CheckCircle2 className="w-5 h-5" />,  color: "bg-green-50 text-green-600",  title: "Full Transparency",             desc: "Every calculation shown, every assumption cited. No black boxes — exactly what investors expect." },
              { icon: <Shield className="w-5 h-5" />,        color: "bg-rose-50 text-rose-600",    title: "Enterprise Security",           desc: "Your sensitive financial data is encrypted end-to-end and never shared." },
              { icon: <Clock className="w-5 h-5" />,         color: "bg-cyan-50 text-cyan-600",    title: "60-Second Turnaround",          desc: "All 5 methods run in parallel. Get a complete blended valuation in under a minute." },
            ].map((f) => (
              <div key={f.title} className="card group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUATION METHODS ── */}
      <section id="methods" className="py-section bg-gray-50">
        <div className="container-max px-container">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Methodology</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">5 professional methods.<br />One comprehensive result.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              The same rigour used by top VC firms — blended with dynamic stage-based weighting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { num: "01", name: "Scorecard Method",       by: "Bill Payne · Ohio TechAngels",  desc: "Compares your startup to similar funded companies using weighted criteria." },
              { num: "02", name: "Berkus Method",          by: "Dave Berkus Framework",         desc: "Values 5 key risk-reduction factors up to $2.5M each." },
              { num: "03", name: "VC Method",              by: "Venture Capital Standard",      desc: "Works backwards from expected exit using target ROI and dilution." },
              { num: "04", name: "DCF Long-Term Growth",   by: "Discounted Cash Flow",          desc: "Projects future cash flows discounted at risk-adjusted rates." },
              { num: "05", name: "DCF with Exit Multiples",by: "Market-Based DCF",              desc: "DCF analysis calibrated with comparable exit multiple benchmarks." },
              { num: "✦",  name: "Evaldam Blended Score",  by: "Proprietary Algorithm",         desc: "Dynamic stage-based weighting synthesises all 5 methods into one trusted range.", featured: true },
            ].map((m) => (
              <div key={m.name} className={`rounded-xl p-6 border transition-all ${m.featured ? "bg-primary text-white border-primary" : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>
                <div className={`text-xs font-bold mb-3 ${m.featured ? "text-rose-200" : "text-primary"}`}>{m.num}</div>
                <h3 className={`font-semibold text-base mb-1 ${m.featured ? "text-white" : "text-gray-900"}`}>{m.name}</h3>
                <p className={`text-xs mb-3 ${m.featured ? "text-rose-200" : "text-gray-400"}`}>{m.by}</p>
                <p className={`text-sm leading-relaxed ${m.featured ? "text-rose-100" : "text-gray-500"}`}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-section bg-white">
        <div className="container-max px-container">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Pitch deck to report in 4 steps</h2>
            <p className="text-lg text-gray-500">Simple process. Professional results.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { icon: <Upload className="w-6 h-6" />,    title: "Upload Your Deck",      desc: "Share your pitch deck PDF or company info." },
              { icon: <Lightbulb className="w-6 h-6" />, title: "AI Extracts Data",      desc: "Our AI reads and structures all key metrics." },
              { icon: <BarChart3 className="w-6 h-6" />, title: "5-Method Valuation",    desc: "All methods run simultaneously in parallel." },
              { icon: <Download className="w-6 h-6" />,  title: "Download Your Report",  desc: "Receive an investor-ready PDF immediately." },
            ].map((s, i) => (
              <div key={s.title} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
                    {s.icon}
                  </div>
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-primary text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="py-section bg-gray-50 border-y border-gray-100">
        <div className="container-max px-container text-center">
          <div className="flex justify-center gap-0.5 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <blockquote className="text-2xl font-medium text-gray-900 max-w-3xl mx-auto mb-5 leading-snug">
            &ldquo;We closed our Series A 3 weeks after using Evaldam&rsquo;s valuation report. The methodology gave our investors full confidence.&rdquo;
          </blockquote>
          <p className="text-sm text-gray-500 font-medium">— Sarah Chen, Founder & CEO · Nexus AI · YC W24</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-section bg-gray-950">
        <div className="container-sm px-container text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-white/60" />
            <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Ready to start?</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Value your startup<br />
            <span className="gradient-text">professionally today.</span>
          </h2>

          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            Join founders raising from Y Combinator, Sequoia, and a16z who trust Evaldam for investor-ready valuations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="btn btn-primary btn-lg flex items-center gap-2 w-full sm:w-auto justify-center">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="btn btn-lg w-full sm:w-auto justify-center" style={{background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)'}}>
                View Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 border-t border-gray-800 text-gray-500 py-14">
        <div className="container-max px-container">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white font-bold text-sm">Evaldam AI</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                Professional startup valuations for founders raising capital globally.
              </p>
              <p className="mt-4 text-xs text-gray-600">US · UK · UAE</p>
            </div>

            {[
              { title: "Product",  links: ["Features", "Methods", "Pricing", "Reports"] },
              { title: "Company",  links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal",    links: ["Privacy", "Terms", "Security"] },
              { title: "Support",  links: ["Docs", "Help Center", "Status"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
                <div className="space-y-2.5">
                  {col.links.map((link) => (
                    <a key={link} href="#" className="block text-sm text-gray-600 hover:text-gray-300 transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">&copy; 2026 Evaldam AI Inc. All rights reserved.</p>
            <p className="text-xs text-gray-700">Built for founders raising in the US, UK & UAE</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
