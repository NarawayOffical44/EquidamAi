"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle, Code2, FileText, GitBranch, Lightbulb, Repeat2, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GitHubRepoValuationWidget } from "@/components/GitHubRepoValuationWidget";

const pageUrl = "https://equidamai.com/github-valuation";

const githubValuationFaqs = [
  {
    question: "Can a GitHub repo be valued as a startup?",
    answer:
      "A repo can be used as evidence for an idea-stage startup valuation, but the tool values the startup opportunity behind the project, not the repository as a standalone asset.",
  },
  {
    question: "What repo signals affect valuation?",
    answer:
      "Evaldam reviews execution quality, documentation, tests, releases, stars, forks, contributor activity, adoption clues, monetization clarity, market category, and founder commitment.",
  },
  {
    question: "Is this accurate without revenue?",
    answer:
      "It is a directional preview for technical founders. Without revenue, customers, or market inputs, the range should be treated as an early estimate rather than a final professional report.",
  },
  {
    question: "What details are needed for a full report?",
    answer:
      "A full startup valuation needs customer, market, revenue, growth, runway, burn, team, funding, monetization, assumptions, and proof details beyond the public GitHub repository.",
  },
  {
    question: "Who is this GitHub valuation tool for?",
    answer:
      "It is built for technical founders, developer-tool builders, AI product teams, and open-source maintainers who want to understand whether a project can become a fundable startup.",
  },
];

const githubValuationSoftwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${pageUrl}#github-valuation-tool`,
  name: "GitHub Repo Valuation Calculator",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: pageUrl,
  publisher: { "@id": "https://equidamai.com/#organization" },
  description:
    "Free GitHub repo startup valuation tool for technical founders. It reviews public repository signals to estimate an idea-stage startup valuation.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Public GitHub repository signal review",
    "Idea-stage startup valuation",
    "Technical execution and adoption signal scoring",
    "Revenue potential and investor risk notes",
    "Account path for full startup valuation reports",
  ],
};

const githubValuationFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: githubValuationFaqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

function GitHubMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.22-3.37-1.22-.46-1.19-1.12-1.51-1.12-1.51-.92-.64.07-.63.07-.63 1.01.07 1.55 1.07 1.55 1.07.9 1.58 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.04-2.75-.1-.26-.45-1.3.1-2.71 0 0 .85-.28 2.78 1.05A9.4 9.4 0 0 1 12 6.99c.86 0 1.72.12 2.53.34 1.93-1.33 2.78-1.05 2.78-1.05.55 1.41.2 2.45.1 2.71.65.72 1.04 1.63 1.04 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.13 10.13 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

const signals = [
  {
    icon: Code2,
    label: "Execution Signal",
    desc: "Code maturity, docs, tests, releases, and development activity",
    bg: "bg-teal-50",
    iconColor: "text-teal-600",
    border: "border-teal-100",
  },
  {
    icon: GitBranch,
    label: "Market Pull",
    desc: "Stars, forks, contributors, usage clues, and buyer clarity",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    border: "border-blue-100",
  },
  {
    icon: Lightbulb,
    label: "Idea-Stage Valuation",
    desc: "Berkus and Scorecard-style logic for pre-revenue projects",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    border: "border-amber-100",
  },
];

export default function GitHubValuationPage() {
  return (
    <div className="public-page min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_46%,#ffffff_100%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(githubValuationSoftwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(githubValuationFaqJsonLd) }} />
      <Navbar />

      <main>
        {/* Hero + Widget */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
          <Link href="/free-valuation" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-primary transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" />
            Back to free tools
          </Link>

          <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-start">
            {/* Left */}
            <div className="pt-2 lg:pt-8">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                <GitHubMark className="h-3.5 w-3.5" />
                Free · No signup needed
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-[1.07] tracking-tight">
                Is your GitHub project worth funding?
              </h1>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-lg">
                Paste a public repo URL. Evaldam reads your execution signal, market pull, and idea-stage potential - and returns a startup valuation in under 60 seconds.
              </p>

              {/* Signal cards */}
              <div className="grid gap-3 mb-8 sm:grid-cols-3 lg:grid-cols-1">
                {signals.map(({ icon: Icon, label, desc, bg, iconColor, border }) => (
                  <div key={label} className={`rounded-xl border ${border} ${bg} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 shrink-0 rounded-lg p-1.5 bg-white shadow-sm`}>
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* What it means */}
              <div className="rounded-xl border-l-4 border-primary bg-white border border-gray-100 shadow-sm p-5 mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">What this valuation means</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  {[
                    "Values the startup opportunity, not the repo as a sellable asset.",
                    "Assumes little or no ARR unless commercial evidence is provided.",
                    "Highlights what details would improve the full valuation.",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 items-start">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <Repeat2 className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-950">Repeatable methodology</p>
                      <p className="mt-1 text-xs text-blue-800 leading-relaxed">Same repo and inputs always return the same range - no black box.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Path to a full report</p>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">After signup, add customer, market, and revenue details for the complete 6-method report.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Widget */}
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-200 bg-white">
                <div className="px-6 py-5 md:px-8 bg-gradient-to-r from-primary to-[#005f5f]">
                  <div className="flex items-center gap-2 mb-1">
                    <GitHubMark className="h-4 w-4 text-white/80" />
                    <p className="text-xs font-bold uppercase tracking-widest text-white/70">Technical founder tool</p>
                  </div>
                  <p className="text-xl font-black text-white">Value a public GitHub repo</p>
                  <p className="text-sm text-white/60 mt-0.5">Free · No credit card · Result in &lt;60s</p>
                </div>
                <div className="p-6 md:p-8">
                  <GitHubRepoValuationWidget />
                </div>
              </div>

              {/* Trust row */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-primary" />No account needed</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-primary" />Data never sold</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-primary" />Result in under 60s</span>
              </div>
            </div>
          </div>
        </section>

        {/* Substantial explanatory content added to address low-value / thin content flags */}
        <section className="border-t border-gray-100 bg-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What GitHub signals actually tell investors</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                A public repository is one of the few places a technical founder can demonstrate execution quality before they have customers or revenue. Evaldam reviews code maturity (tests, releases, documentation), adoption signals (stars, forks, contributors, external usage mentions), and market-pull clues (README clarity, monetization hints, category positioning). These inputs feed into early-stage frameworks (primarily Berkus and Scorecard logic) that produce a directional idea-stage valuation range.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                The output is intentionally wide for pre-revenue projects. The goal is not precision - it is to give founders a credible starting point they can defend when they begin talking to angel investors or accelerators. The preview also surfaces the exact signals that moved the number so you can decide which parts of the repo to strengthen before your next conversation.
              </p>

              <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">Important limitations of repo-only valuation</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-3">
                <li>GitHub data says nothing about customer willingness to pay or competitive moat.</li>
                <li>Stars and forks can be gamed; the model looks for quality signals (tests, docs, release cadence) more than raw popularity.</li>
                <li>Existing cap table, prior funding, and founder experience outside the repo are invisible.</li>
                <li>Market size and go-to-market execution risk are only partially inferable from the project itself.</li>
              </ul>

              <p className="text-sm text-gray-600 leading-relaxed">
                The highest-leverage next step is to turn the repo preview into a full workspace. Add customer interviews, revenue projections, market sizing, team background, and funding history so the same engine can run the complete six-method valuation and produce an investor-ready report with assumptions and evidence.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mt-3">
                Many technical founders start here because the repo is the only public proof of execution they have. The preview turns that proof into a number they can use to decide whether to keep building toward a fundable company.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-gray-100 bg-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <span className="inline-block px-3 py-1.5 border border-primary/20 bg-primary/5 rounded-full text-xs font-bold text-primary uppercase tracking-widest mb-4">
                GitHub valuation FAQ
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 leading-tight">
                From public repo signals to a startup valuation
              </h2>
              <p className="text-base text-gray-500">
                GitHub data is useful evidence of technical execution. A full startup report still needs customer, market, revenue, and founder details.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {githubValuationFaqs.map((item) => (
                <div key={item.question} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                  <div className="flex gap-3 items-start">
                    <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">{item.question}</h3>
                      <p className="text-sm leading-relaxed text-gray-500">{item.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white py-14">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Ready for the full picture?</p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">Turn your repo result into a full investor report</h2>
            <p className="text-gray-500 text-sm mb-8">Add revenue, market, team, and assumptions. Get a 6-method report with PDF export - ready for investor calls.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 inline-flex items-center gap-2">
                Create free account
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
              <Link href="/free-valuation" className="px-6 py-3.5 border border-gray-200 bg-white rounded-xl font-semibold text-gray-700 hover:border-gray-300 transition text-sm">
                Try website valuation instead
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
