import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, FileText, LineChart, MessageSquareText, ShieldCheck, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const pageUrl = "https://equidamai.com/about";

export const metadata: Metadata = {
  title: "About Evaldam AI | Startup Valuation Platform",
  description:
    "Learn about Evaldam AI, the startup valuation platform built for founders, investors, advisors, incubators, accelerators, and agencies.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "About Evaldam AI",
    description:
      "Evaldam AI helps founders and startup operators build valuation, funding, benchmarking, and investor-ready report workflows.",
    url: pageUrl,
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI startup valuation platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Evaldam AI",
    description:
      "The startup valuation platform for defensible valuation, Startup AI guidance, benchmarking, reports, and valuation tracking.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${pageUrl}#about`,
  url: pageUrl,
  name: "About Evaldam AI",
  description:
    "Evaldam AI is a startup valuation platform for founders, investors, advisors, incubators, accelerators, and agencies.",
  mainEntity: {
    "@type": "Organization",
    "@id": "https://equidamai.com/#organization",
    name: "Evaldam AI",
    url: "https://equidamai.com",
    email: "hello@equidamai.com",
    sameAs: [
      "https://www.linkedin.com/company/evaldamai/",
      "https://x.com/EquidamAi",
      "https://instagram.com/evaldamai",
      "https://www.youtube.com/@EvaldamAi",
    ],
  },
};

const pillars = [
  {
    icon: BarChart3,
    title: "Valuation engine",
    text: "Structured valuation methods, assumptions, benchmarks, and scoring designed for startup fundraising conversations.",
  },
  {
    icon: MessageSquareText,
    title: "Startup AI",
    text: "AI guidance that helps users understand valuation drivers, funding context, dilution, and investor questions.",
  },
  {
    icon: FileText,
    title: "Reports and history",
    text: "Investor-ready reports and saved valuation records so progress can be tracked over time instead of rebuilt from scratch.",
  },
];

const audiences = [
  "Founders preparing for angel, seed, or advisor conversations",
  "Investors reviewing early-stage opportunities",
  "Incubators and accelerators supporting startup cohorts",
  "Agencies, CFO partners, and advisors managing multiple companies",
];

const operatingPrinciples = [
  {
    icon: ShieldCheck,
    title: "Defensible before decorative",
    text: "The product is built around methods, assumptions, evidence, and clear report outputs.",
  },
  {
    icon: LineChart,
    title: "Track progress over time",
    text: "Valuation is not a one-time number. It changes as the startup adds traction, capital, team strength, and market proof.",
  },
  {
    icon: Users,
    title: "Built for real decision makers",
    text: "The workflow is designed for users who need to explain the number to investors, partners, teams, and portfolio stakeholders.",
  },
];

export default function AboutPage() {
  return (
    <div className="public-page min-h-screen bg-white text-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Navbar />

      <main>
        <section className="border-b border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
            <div className="max-w-3xl">
              <p className="mb-5 text-sm font-black uppercase tracking-[0.24em] text-primary">About Evaldam AI</p>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-gray-950 sm:text-5xl md:text-6xl">
                We help startups explain what they are worth.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                Evaldam AI brings valuation methods, benchmarking, Startup AI guidance, and investor-ready reporting into one workspace for founders and teams that need a clear, defensible number.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/free-valuation"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm shadow-primary/20 transition-opacity hover:opacity-90"
                >
                  Start valuation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-950 transition-colors hover:border-gray-400 hover:bg-gray-50"
                >
                  Contact team
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="rounded-xl bg-gray-950 p-5 text-white">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Platform focus</div>
                <div className="mt-8 grid gap-4">
                  {[
                    ["01", "Valuation methods"],
                    ["02", "Market context"],
                    ["03", "Investor-ready reports"],
                    ["04", "Tracking over time"],
                  ].map(([index, label]) => (
                    <div key={label} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                      <span className="text-sm font-bold text-white/50">{index}</span>
                      <span className="text-sm font-bold text-white">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-2xl font-black text-gray-950">6</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-500">Methods</div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-2xl font-black text-gray-950">40+</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-500">Markets</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">Why we exist</h2>
            <p className="mt-4 text-base leading-8 text-gray-600">
              Startup valuation is usually split across spreadsheets, consultant decks, market databases, and scattered investor feedback. Evaldam AI is built to make that workflow easier to repeat, review, and share.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-gray-300 bg-white p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-5 text-lg font-black text-gray-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-950 py-16 text-white md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Who we build for</h2>
              <p className="mt-4 text-base leading-8 text-white/65">
                Evaldam AI is designed for startup valuation workflows where speed matters, but the explanation still needs to stand up in a serious conversation.
              </p>
            </div>
            <div className="grid gap-3">
              {audiences.map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-white/90">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">How we think</h2>
              <p className="mt-4 text-base leading-8 text-gray-600">
                The platform is not built to replace judgement. It is built to make valuation inputs, assumptions, and outputs easier to inspect.
              </p>
            </div>
            <div className="grid gap-5">
              {operatingPrinciples.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-xl border border-gray-300 bg-white p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-950">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-gray-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-gray-500">Follow us</span>
            <a href="https://www.linkedin.com/company/evaldamai/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#0A66C2] hover:text-[#0A66C2]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
            <a href="https://x.com/EquidamAi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X (Twitter)
            </a>
            <a href="https://www.youtube.com/@EvaldamAi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-600 hover:text-red-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              YouTube
            </a>
            <a href="https://instagram.com/evaldamai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-pink-500 hover:text-pink-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              Instagram
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:pb-20">
          <div className="rounded-2xl border border-gray-300 bg-[#f6f9fb] p-6 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-950">Build a valuation workflow that can be explained.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
                Start with a free valuation, then move into the full workspace when you need reports, benchmarking, history, and collaboration.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <Link href="/free-valuation" className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white">
                Start valuation
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-950">
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
