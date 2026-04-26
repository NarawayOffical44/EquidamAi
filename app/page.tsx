"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Play, BarChart2, Cpu, BookOpen, FileText, ChevronRight, Users, Lock, Info } from "lucide-react";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="text-xl font-black tracking-tight text-primary">
              evaldam
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
              <a href="#valuation" className="hover:text-gray-900 transition-colors">Valuation</a>
              <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
              <a href="#customers" className="hover:text-gray-900 transition-colors">Customers</a>
              <a href="#resources" className="hover:text-gray-900 transition-colors">Resources</a>
              <Link href="/login" className="hover:text-gray-900 transition-colors">Login</Link>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <button className="px-4 py-2 text-sm font-semibold text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  Get a demo
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 text-sm font-bold text-white rounded transition-opacity hover:opacity-90 bg-primary">
                  Buy Now
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
            {["Valuation", "Pricing", "Customers", "Resources"].map((item) => (
              <a key={item} href="#" className="block text-sm font-medium text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>{item}</a>
            ))}
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <Link href="/login" className="flex-1"><button className="w-full py-2 text-sm font-semibold border border-gray-300 rounded">Login</button></Link>
              <Link href="/signup" className="flex-1"><button className="w-full py-2 text-sm font-bold text-white rounded bg-primary">Buy Now</button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="bg-white pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Copy */}
            <div>
              <div className="mb-4">
                <span className="inline-block px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary uppercase tracking-wide">6-Method AI Valuation Engine</span>
              </div>
              <h1 className="text-5xl lg:text-[3.6rem] font-black text-gray-900 leading-[1.08] tracking-tight mb-5">
                Professional Valuations<br />in 60 Seconds
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
                Upload your data → AI extracts insights → 6 methods run in parallel → Get investor-ready report with benchmarks and methodology.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-2 border-gray-900 text-gray-900 rounded hover:bg-gray-900 hover:text-white transition-colors">
                  <Play className="w-3 h-3 fill-current" /> WATCH VIDEO
                </button>
                <Link href="/signup">
                  <button className="px-6 py-2.5 text-sm font-bold text-white rounded transition-opacity hover:opacity-90 bg-primary">
                    BUY NOW
                  </button>
                </Link>
              </div>
            </div>

            {/* Right: Dashboard Mockup */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                {/* Mockup top bar */}
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Professional Valuation</span>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                </div>

                <div className="p-5 flex gap-6">
                  {/* Left col: number + bars */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Blended Valuation</div>
                    <div className="text-4xl font-black text-gray-900 mb-5">$ 13,886<span className="text-xl font-bold text-gray-400">K</span></div>

                    <div className="space-y-2.5">
                      {[
                        { label: "Scorecard",  val: "$11.2M", pct: 68, color: "#00b2b2" },
                        { label: "Berkus",     val: "$9.8M",  pct: 59, color: "#22d3ee" },
                        { label: "VC Method",  val: "$16.5M", pct: 100,color: "#0891b2" },
                        { label: "DCF-LTG",    val: "$12.1M", pct: 73, color: "#06b6d4" },
                        { label: "DCF-Mult",   val: "$14.3M", pct: 87, color: "#67e8f9" },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center gap-2 text-xs">
                          <span className="w-14 text-gray-500 flex-shrink-0 truncate">{m.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${m.pct}%`, background: m.color }} />
                          </div>
                          <span className="w-11 text-right font-semibold text-gray-700">{m.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right col: donut */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2">
                    <svg width="96" height="96" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="36" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                      <circle cx="48" cy="48" r="36" fill="none" stroke="#00b2b2" strokeWidth="12"
                        strokeDasharray="90 136" strokeDashoffset="36" strokeLinecap="round"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                      <circle cx="48" cy="48" r="36" fill="none" stroke="#22d3ee" strokeWidth="12"
                        strokeDasharray="50 176" strokeDashoffset="-54" strokeLinecap="round"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                      <circle cx="48" cy="48" r="36" fill="none" stroke="#0891b2" strokeWidth="12"
                        strokeDasharray="30 196" strokeDashoffset="-104" strokeLinecap="round"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                      <text x="48" y="44" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="800">HIGH</text>
                      <text x="48" y="56" textAnchor="middle" fill="#9ca3af" fontSize="8">Confidence</text>
                    </svg>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Confidence</span>
                  </div>
                </div>

                {/* Bottom table */}
                <div className="border-t border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Method</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Low</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Mid</th>
                        <th className="text-right px-5 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[10px]">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { m: "Scorecard", lo: "$9.0M",  mid: "$11.2M", hi: "$13.4M" },
                        { m: "VC Method", lo: "$13.2M", mid: "$16.5M", hi: "$19.8M" },
                        { m: "DCF-LTG",   lo: "$9.7M",  mid: "$12.1M", hi: "$14.5M" },
                      ].map((r, i) => (
                        <tr key={r.m} className={i < 2 ? "border-b border-gray-50" : ""}>
                          <td className="px-5 py-2 text-gray-700 font-medium">{r.m}</td>
                          <td className="px-3 py-2 text-right text-gray-400">{r.lo}</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-900">{r.mid}</td>
                          <td className="px-5 py-2 text-right text-gray-400">{r.hi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-gray-200">
            {[
              {
                stat: "%",
                headline: "Positive feedback from investors",
                sub: "94% in 133 collected responses",
              },
              {
                stat: "$ B",
                headline: "Funding raised by startups on Evaldam",
                sub: "$5+ billion reports since 2012",
              },
              {
                stat: "140K+",
                headline: "Startups valued in 90+ countries",
                sub: "the largest valuation database worldwide",
              },
            ].map((s) => (
              <div key={s.headline} className="flex flex-col items-start md:items-center md:text-center px-0 md:px-10 gap-1">
                <div className="text-2xl font-black mb-1 text-primary">{s.stat}</div>
                <div className="text-sm font-semibold text-gray-800">{s.headline}</div>
                <div className="text-xs text-gray-500">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section id="customers" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-gray-400 mb-8 uppercase tracking-widest">Trusted by</p>
          {/* Row 1 */}
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5 mb-6">
            {["JP Morgan", "Carta", "EIC", "SBA START", "Microsoft"].map((name) => (
              <span key={name} className="text-base font-black text-gray-300 hover:text-gray-500 transition-colors tracking-tight uppercase">{name}</span>
            ))}
          </div>
          {/* Row 2 */}
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
            {["RasMat", "MDEC", "Tech Nation", "VC4A", "Startup Chile"].map((name) => (
              <span key={name} className="text-base font-black text-gray-300 hover:text-gray-500 transition-colors tracking-tight uppercase">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS / FEATURES ── */}
      <section id="valuation" className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-primary/10 rounded-full mb-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wide">POWERFUL FEATURES</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3">6 Professional Valuation Methods in Seconds</h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto">
              Run multiple industry-standard valuation approaches simultaneously. Get a blended, well-reasoned result with transparent methodology that investors trust.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <BarChart2 className="w-7 h-7" />,
                title: "6 Valuation Methods",
                desc: "Scorecard, Berkus, VC Method, DCF (2x), + Proprietary Score. Blended weighting by startup stage.",
                link: "Learn more",
              },
              {
                icon: <Cpu className="w-7 h-7" />,
                title: "AI Auto-Fill & Benchmarking",
                desc: "Upload pitch deck → AI extracts data. Compare against 10K+ similar startups. Real-time industry benchmarks.",
                link: "Learn more",
              },
              {
                icon: <BookOpen className="w-7 h-7" />,
                title: "Industry Comparables",
                desc: "Valuation anchored to actual market data. See how you stack against peers by stage, industry, growth rate.",
                link: "Learn more",
              },
              {
                icon: <FileText className="w-7 h-7" />,
                title: "Investor-Ready Reports",
                desc: "PDF reports with 6-method breakdown, sensitivity analysis, executive summary, and professional citations.",
                link: "Learn more",
              },
            ].map((f) => (
              <div key={f.title} className="border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-gray-300 transition-all">
                <div className="mb-4 text-primary">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.desc}</p>
                <a href="#" className="text-xs font-bold uppercase tracking-wide flex items-center gap-1 hover:gap-2 transition-all text-primary">
                  {f.link} <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REPORT INVESTORS READ ── */}
      <section className="py-0 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2">

            {/* Left: Steps */}
            <div className="px-10 py-16 lg:px-16 lg:py-20" style={{ background: "#e0f5f5" }}>
              <h2 className="text-3xl font-black mb-2 leading-tight" style={{ color: "#007a7a" }}>
                Professional Reports<br />Ready for Investors
              </h2>
              <p className="text-sm mb-10" style={{ color: "#007a7a", opacity: 0.75 }}>
                Get a transparent, multi-method valuation that stands up to investor scrutiny.
              </p>

              <div className="space-y-8">
                {[
                  {
                    n: "1",
                    title: "Sign up free",
                    desc: "Create account in seconds. Free tier includes 1 startup + 3 evaluation reports. No credit card needed.",
                  },
                  {
                    n: "2",
                    title: "Upload data (seconds)",
                    desc: "Pitch deck → AI auto-extracts. Or fill key metrics manually. Our platform finds comparables instantly.",
                  },
                  {
                    n: "3",
                    title: "Get professional report (60 seconds)",
                    desc: "6 methods run in parallel. Get blended valuation, sensitivity analysis, investor summary PDF.",
                  },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5 bg-primary"
                    >
                      {s.n}
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1" style={{ color: "#007a7a" }}>{s.title}</div>
                      <div className="text-sm leading-relaxed" style={{ color: "#007a7a", opacity: 0.7 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Document mockup */}
            <div className="bg-white flex flex-col items-center justify-center py-16 px-10 gap-8">
              {/* Fake report document */}
              <div className="w-full max-w-xs bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-primary">
                  <div className="text-white text-xs font-bold uppercase tracking-widest mb-0.5">Valuation Report</div>
                  <div className="text-white/80 text-[10px]">Acme Technologies · Series A</div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Blended Valuation Range</div>
                    <div className="text-2xl font-black text-gray-900">$11.2M — $16.5M</div>
                  </div>
                  <div className="space-y-1.5">
                    {["Scorecard Method", "Berkus Method", "VC Method", "DCF Long-Term Growth", "DCF with Exit Multiples"].map((m) => (
                      <div key={m} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary" />
                        <div className="text-[11px] text-gray-600">{m}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="h-2 rounded bg-gray-100 mb-1.5 w-full" />
                    <div className="h-2 rounded bg-gray-100 mb-1.5 w-4/5" />
                    <div className="h-2 rounded bg-gray-100 w-3/5" />
                  </div>
                </div>
              </div>

              <a href="#" className="px-8 py-3 text-sm font-bold text-white rounded uppercase tracking-widest hover:opacity-90 transition-opacity bg-primary">
                Download Sample Report
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TAKE CONTROL ── */}
      <section className="py-24 text-center" style={{ background: "linear-gradient(135deg, #f0fafa 0%, #e0f5f5 50%, #f0fafa 100%)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-black text-gray-900 mb-5 leading-tight">Take control of your valuation</h2>
          <p className="text-gray-500 text-base mb-10 max-w-xl mx-auto leading-relaxed">
            Stop guessing what your startup is worth. Get a credible, methodology-backed valuation that investors trust — in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <button className="px-8 py-3 text-sm font-bold border-2 text-gray-800 border-gray-800 rounded hover:bg-gray-800 hover:text-white transition-colors">
                SCHEDULE A CALL
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-8 py-3 text-sm font-bold text-white rounded hover:opacity-90 transition-opacity bg-primary">
                BUY NOW
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 140,000 STARTUPS VALUED ── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-3">140,000 startups valued</h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Startups from 90 countries use Evaldam to understand their value and close fair deals.
            </p>
          </div>

          {/* World map (SVG approximation) */}
          <div className="relative rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden py-10 px-6">
            <svg viewBox="0 0 900 400" className="w-full opacity-20 absolute inset-0 h-full" style={{ pointerEvents: "none" }}>
              {/* Simplified continent blobs */}
              <ellipse cx="180" cy="180" rx="120" ry="80" fill="#cbd5e1" />
              <ellipse cx="430" cy="160" rx="90" ry="70" fill="#cbd5e1" />
              <ellipse cx="590" cy="140" rx="110" ry="85" fill="#cbd5e1" />
              <ellipse cx="750" cy="180" rx="80" ry="60" fill="#cbd5e1" />
              <ellipse cx="200" cy="290" rx="70" ry="50" fill="#cbd5e1" />
              <ellipse cx="480" cy="300" rx="40" ry="55" fill="#cbd5e1" />
              <ellipse cx="640" cy="300" rx="50" ry="40" fill="#cbd5e1" />
              <ellipse cx="800" cy="280" rx="50" ry="35" fill="#cbd5e1" />
            </svg>

            {/* Region stats */}
            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { region: "North America",    count: "44,827" },
                { region: "Europe",           count: "48,005" },
                { region: "Asia Pacific",     count: "23,116" },
                { region: "Rest of World",    count: "24,052" },
              ].map((r) => (
                <div key={r.region}>
                  <div className="text-2xl font-black text-gray-900 mb-1">{r.count}</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{r.region}</div>
                </div>
              ))}
            </div>

            <p className="relative text-center mt-8 text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Listed on Startups.com · Featured in TechCrunch
            </p>
          </div>
        </div>
      </section>

      {/* ── WHY US (teal band) ── */}
      <section className="py-16 bg-primary">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-8">Most founders and investors ask why us</p>
          {/* Founder photo placeholder */}
          <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 48 48" className="w-16 h-16 text-white/60" fill="currentColor">
              <circle cx="24" cy="18" r="10" />
              <path d="M4 42c0-11 8.95-20 20-20s20 8.95 20 20" />
            </svg>
          </div>
          <p className="text-white text-sm max-w-xl mx-auto leading-relaxed mb-2">
            &ldquo;Only a few minutes of work, and I receive a comprehensive and professional report that I can use when pitching investors. The methodology behind it is solid, too.&rdquo;
          </p>
          <p className="text-white/60 text-xs font-semibold">— Founder, Series A startup · YC Alumni</p>
        </div>
      </section>

      {/* ── 3 COLUMNS ── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: "Ask Our Team",
                desc: "Do you have a question about the evaluation of your startup? Our team of specialists is always happy to help.",
              },
              {
                icon: <Lock className="w-6 h-6" />,
                title: "Company Privacy",
                desc: "We will never share your company data with third parties. Your financials stay fully private and secure.",
              },
              {
                icon: <Info className="w-6 h-6" />,
                title: "Company Evaldam",
                desc: "We are a team of entrepreneurs, investors and finance professionals who believe every startup deserves a fair valuation.",
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="mb-4 text-primary">{col.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{col.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{col.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK CTA ── */}
      <section className="py-20 text-center" style={{ background: "#0a2a3a" }}>
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-5 text-primary">GET STARTED NOW</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-snug">
            94% positive reactions from investors<br />from 133 responses.<br />Start your valuation today.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <button className="px-8 py-3 text-sm font-bold text-white border-2 border-white/40 rounded hover:border-white transition-colors">
                GET A DEMO
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-8 py-3 text-sm font-bold text-white rounded hover:opacity-90 transition-opacity bg-primary">
                BUY NOW
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── BEST STARTUPS ARE VALUED ── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-5 leading-snug">
            The best startups are valued, not priced
          </h2>
          <p className="text-gray-500 text-sm leading-loose mb-4">
            Pricing a startup is a guess. Valuation is a discipline. Through methodology, data, and market context, we give you a defensible number — one that holds up to investor scrutiny.
          </p>
          <p className="text-gray-500 text-sm leading-loose mb-8">
            Trust and respect begin with transparency. The right valuation doesn&apos;t just close deals — it sets the tone for long-term investor relationships. Startups that approach fundraising with rigour move faster, negotiate better, and build stronger investor trust.
          </p>
          <a href="#" className="inline-flex items-center gap-2 px-7 py-2.5 text-sm font-bold border-2 border-primary text-primary rounded transition-colors hover:text-white hover:bg-primary hover:border-primary">
            CHECK OUR RECENT BLOG POSTS <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-200 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Product</p>
              <div className="space-y-2.5">
                {["Valuation", "Benchmarks", "Pricing", "Reports", "API"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-gray-500 hover:text-gray-800 transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Resources</p>
              <div className="space-y-2.5">
                {["Blog", "Methodology", "Docs", "Case Studies", "Glossary"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-gray-500 hover:text-gray-800 transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Support</p>
              <div className="space-y-2.5">
                {["Help Center", "Contact Us", "Privacy Policy", "Terms of Use", "Status"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-gray-500 hover:text-gray-800 transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-3">
              <Link href="/" className="text-2xl font-black text-primary">evaldam</Link>
              <p className="text-xs text-gray-400 leading-relaxed">
                Professional startup valuations for founders raising capital globally.
              </p>
              <p className="text-xs font-semibold text-gray-400">US · UK · UAE</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Evaldam AI Inc. All rights reserved.</p>
            <p className="text-xs text-gray-400">Built for founders raising in the US, UK &amp; UAE</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
