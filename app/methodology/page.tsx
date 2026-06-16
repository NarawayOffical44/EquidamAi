import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calculator,
  CheckCircle,
  FileText,
  GitCompare,
  Repeat2,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const methods = [
  {
    name: "Scorecard Method",
    tag: "Early-stage benchmark",
    description:
      "Explains the Scorecard valuation method by starting from a comparable stage benchmark and adjusting for team, market size, product, competition, go-to-market, and capital efficiency.",
    bestFor: "Pre-revenue, angel, and seed startups where qualitative risk reduction matters.",
  },
  {
    name: "Berkus Method",
    tag: "Milestone checklist",
    description:
      "Works like a Berkus method calculator by assigning value to concrete progress: sound idea, prototype, team quality, strategic relationships, and rollout or traction.",
    bestFor: "Idea-stage and pre-revenue companies where ARR is not yet a reliable input.",
  },
  {
    name: "Venture Capital Method",
    tag: "Exit-back calculation",
    description:
      "Works backward from a plausible future exit value using investor return expectations, holding period, dilution, and exit multiples.",
    bestFor: "Fundraising conversations, seed round valuation, and SAFE valuation cap discussions where investors think in terms of required return.",
  },
  {
    name: "DCF with Long-Term Growth",
    tag: "Cash-flow model",
    description:
      "Projects future cash flows and discounts them to present value using discount rate, tax, margin, and terminal growth assumptions.",
    bestFor: "Revenue-stage companies with enough financial data to support projections.",
  },
  {
    name: "DCF with Exit Multiples",
    tag: "Market terminal value",
    description:
      "Uses projected cash flows plus a terminal value derived from exit multiples, keeping the model closer to comparable market behavior.",
    bestFor: "High-growth startups where a pure perpetuity assumption can be too fragile.",
  },
  {
    name: "Evaldam Score",
    tag: "Platform score",
    description:
      "Combines stage, industry, growth, team signal, IP, moat, market timing, and risk factors into a proprietary consistency check.",
    bestFor: "Blending structured inputs into a single sanity check alongside the traditional methods.",
  },
];

const workflow = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Capture inputs",
    text: "Website, pitch deck, revenue, growth, team, market, geography, assumptions, and optional founder context are normalized into a startup profile.",
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: "Run methods",
    text: "The engine calculates multiple valuation approaches instead of relying on one prompt or one simple multiple.",
  },
  {
    icon: <GitCompare className="h-5 w-5" />,
    title: "Blend the range",
    text: "Method weights change by stage and data quality. Early-stage companies lean more on Scorecard and Berkus; revenue-stage companies lean more on VC and DCF logic.",
  },
  {
    icon: <Repeat2 className="h-5 w-5" />,
    title: "Version the result",
    text: "The same saved inputs and same methodology version reuse the existing valuation. A new version is created only when material inputs or methodology change.",
  },
];

const methodologySchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Evaldam AI Startup Valuation Methodology",
  description:
    "How Evaldam AI calculates startup valuations using Scorecard, Berkus, VC Method, DCF Long-Term Growth, DCF Exit Multiples, and Evaldam Score.",
  author: {
    "@type": "Organization",
    name: "Evaldam AI",
    url: "https://equidamai.com",
    sameAs: [
      "https://x.com/EquidamAi",
      "https://instagram.com/evaldamai",
      "https://www.youtube.com/@EvaldamAi",
    ],
  },
  about: [
    "Startup valuation",
    "Pre-money valuation",
    "Scorecard Method",
    "Berkus Method",
    "Venture Capital Method",
    "Discounted Cash Flow",
  ],
  mainEntityOfPage: "https://equidamai.com/methodology",
};

export default function MethodologyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(methodologySchema) }} />

      <div className="public-page min-h-screen bg-white text-gray-900">
        <Navbar />

        <main>
        <section className="border-b border-gray-100 bg-white px-4 py-12 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-primary">
                Valuation methodology
              </span>
              <h1 className="mt-5 text-3xl font-black leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                A valuation you can defend, line by line.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
                Evaldam's AI runs six proven valuation methods, shows its work, and documents every assumption — so your number holds up under any investor's questions. Repeatable by design: the same inputs always return the same result.
              </p>
              <p className="mt-3 max-w-2xl text-sm text-gray-500">
                Grounded in live market data across 40+ countries, with real depth where one-size-fits-all platforms stay shallow — RBI rates, regional filings, and country-specific comparables. Your number reflects your actual market, not a generic baseline.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/free-valuation" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-[#005f5f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
                  Get your valuation range in 2 minutes <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/valuation-report" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold text-gray-800 hover:border-primary hover:text-primary">
                  View Report Format
                </Link>
                <Link href="/startup-valuation-benchmarks" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold text-gray-800 hover:border-primary hover:text-primary">
                  View Benchmarks
                </Link>
              </div>

              {/* Additional unique depth to address thin/templated content */}
              <div className="mt-8 text-sm leading-relaxed text-gray-600">
                <p className="mb-3">
                  Every method in Evaldam is implemented with the same discipline you would expect from a professional valuation provider: explicit assumptions, stage-appropriate weighting, and full sensitivity analysis. The platform never collapses the output to a single “best” number. Instead it surfaces the range and the reasoning so you can defend it line by line in front of investors, your board, or your own team.
                </p>
                <p>
                  The six methods are not marketing checkboxes. Scorecard and Berkus are optimized for pre-revenue and idea-stage companies where qualitative risk reduction matters most. The VC Method and both DCF variants are applied when revenue or clear exit paths exist. The Evaldam Score acts as an internal consistency check across all inputs. When you change an assumption, every affected method updates instantly so you can see the real impact instead of guessing.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/70 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500">Method stack</p>
                  <p className="mt-1 text-xl font-black text-gray-900">6-method blended valuation</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-3">
                {methods.map((method, index) => (
                  <div key={method.name} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-white text-xs font-black text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-gray-900">{method.name}</p>
                      <p className="text-xs font-semibold text-gray-500">{method.tag}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <span className="text-xs font-black uppercase tracking-widest text-primary">Workflow</span>
              <h2 className="mt-3 text-2xl font-black text-gray-900 sm:text-3xl">
                The logic is structured before AI writes the report
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                AI helps extract, explain, and format the output. The valuation itself is constrained by method logic, saved inputs, assumptions, and a methodology version.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {workflow.map((item) => (
                <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-white text-primary">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-black text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-gray-100 bg-white px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <span className="text-xs font-black uppercase tracking-widest text-primary">Methods</span>
              <h2 className="mt-3 text-2xl font-black text-gray-900 sm:text-3xl">
                What each method contributes
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {methods.map((method) => (
                <div key={method.name} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h3 className="text-lg font-black text-gray-900">{method.name}</h3>
                    <span className="shrink-0 rounded-full border border-primary/20 bg-white px-2.5 py-1 text-[11px] font-bold uppercase text-primary">
                      {method.tag}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">{method.description}</p>
                  <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-gray-500">Best used for</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">{method.bestFor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-blue-100 bg-white p-6">
              <Repeat2 className="mb-4 h-7 w-7 text-blue-700" />
              <h3 className="text-lg font-black text-blue-950">Repeatability policy</h3>
              <p className="mt-3 text-sm leading-relaxed text-blue-900">
                If a startup profile, assumptions, methodology version, and market-data snapshot are unchanged, the paid valuation should reuse the existing report instead of producing a different number.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Settings2 className="mb-4 h-7 w-7 text-primary" />
              <h3 className="text-lg font-black text-gray-900">Assumptions trail</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Discount rates, growth rates, exit multiples, stage, industry, geography, revenue inputs, and qualitative signals are stored so the valuation can be reviewed and challenged.
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-white p-6">
              <AlertTriangle className="mb-4 h-7 w-7 text-amber-700" />
              <h3 className="text-lg font-black text-amber-950">Important limits</h3>
              <p className="mt-3 text-sm leading-relaxed text-amber-900">
                Evaldam is not a certified appraisal, legal opinion, investment advice, or a guarantee of funding terms. It is a structured decision-support report for fundraising conversations.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-primary">Free vs paid</span>
                <h2 className="mt-3 text-2xl font-black text-gray-900 sm:text-3xl">
                  The free tools are previews. The paid product is the defensible report.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-gray-600">
                  Free website and GitHub valuations are useful acquisition tools. They help users understand directionally where the opportunity sits. Paid reports add saved inputs, deeper assumptions, six-method output, evidence, sensitivity analysis, and an investor-ready format.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="grid grid-cols-3 border-b border-gray-200 bg-white text-xs font-black uppercase tracking-wide text-gray-500">
                  <div className="p-4">Capability</div>
                  <div className="p-4 text-center">Free preview</div>
                  <div className="p-4 text-center">Paid report</div>
                </div>
                {[
                  ["Directional valuation range", true, true],
                  ["Six-method methodology", false, true],
                  ["Saved assumptions and evidence", false, true],
                  ["Sensitivity and scenarios", false, true],
                  ["Country-aware benchmarks", false, true],
                  ["Investor-ready PDF", false, true],
                  ["Repeatable report versions", false, true],
                ].map(([label, free, paid]) => (
                  <div key={String(label)} className="grid grid-cols-3 border-b border-gray-100 text-sm last:border-b-0">
                    <div className="p-4 font-semibold text-gray-800">{label}</div>
                    <div className="flex items-center justify-center p-4">
                      {free ? <CheckCircle className="h-5 w-5 text-primary" /> : <span className="text-gray-300">-</span>}
                    </div>
                    <div className="flex items-center justify-center p-4">
                      {paid ? <CheckCircle className="h-5 w-5 text-primary" /> : <span className="text-gray-300">-</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <ShieldCheck className="mx-auto mb-5 h-10 w-10 text-primary" />
            <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
              Use the output as a negotiation starting point
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
              A good valuation report does not remove negotiation. It makes the conversation clearer by showing the range, assumptions, drivers, risks, and milestones that could move the valuation up or down.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90">
                Build Full Report <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/free-valuation" className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold text-gray-800 hover:border-primary hover:text-primary">
                View Plans
              </Link>
            </div>
          </div>
        </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
