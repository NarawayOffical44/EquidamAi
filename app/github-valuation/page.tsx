"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle, Code2, FileText, GitBranch, Lightbulb, Repeat2 } from "lucide-react";
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
    "Free GitHub repo startup valuation tool for technical founders. It reviews public repository signals to estimate an idea-stage startup valuation range.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Public GitHub repository signal review",
    "Idea-stage startup valuation range",
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
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
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

export default function GitHubValuationPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_46%,#ffffff_100%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(githubValuationSoftwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(githubValuationFaqJsonLd) }} />
      <Navbar />

      <main>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <Link href="/free-valuation" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to free tools
        </Link>

        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-start">
          <div className="pt-4 lg:pt-10">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <GitHubMark className="h-3.5 w-3.5" />
              Free repo valuation preview
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 mb-5 leading-tight tracking-tight">
              GitHub Repo Startup Valuation
            </h1>
            <p className="max-w-xl text-lg text-gray-600 mb-8">
              Paste a public GitHub repo and estimate what the project could be worth as an idea-stage startup. The free result helps technical founders understand execution signal, adoption signal, and what is still missing for a full startup valuation.
            </p>

            <div className="grid gap-3 mb-8 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Code2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Execution Signal</p>
                    <p className="text-sm text-gray-500">Code maturity, docs, tests, releases, and development activity</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <GitBranch className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Market Pull</p>
                    <p className="text-sm text-gray-500">Stars, forks, contributors, usage clues, and buyer clarity</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Idea-Stage Valuation</p>
                    <p className="text-sm text-gray-500">Berkus and Scorecard-style logic for pre-revenue projects</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">What this valuation means</p>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  "It values the startup opportunity, not the repo as a sellable asset.",
                  "It assumes little or no ARR unless commercial evidence is provided.",
                  "It highlights what customer, market, revenue, and founder details would improve the full valuation.",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Repeat2 className="h-5 w-5 shrink-0 text-blue-700" />
                  <div>
                    <p className="text-sm font-black text-blue-950">Repeatable methodology</p>
                    <p className="mt-1 text-sm text-blue-900">Same repo data and same inputs produce the same valuation range until signals, assumptions, or methodology change.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-black text-gray-900">Full valuation path</p>
                    <p className="mt-1 text-sm text-gray-600">Use the repo result as the hook. After signup, add customer, market, revenue, and execution details to build the company valuation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden bg-white rounded-lg shadow-xl shadow-gray-200/70 border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 md:px-8">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary">
                  <GitHubMark className="h-4 w-4" />
                  Technical founder tool
                </p>
                <p className="mt-1 text-lg font-black text-gray-900">Value a public GitHub repo</p>
              </div>
              <div className="p-6 md:p-8">
                <GitHubRepoValuationWidget />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 max-w-3xl">
            <span className="inline-block px-3 py-1.5 border border-primary/20 bg-white rounded-full text-xs font-bold text-primary uppercase tracking-wide mb-4">
              GitHub valuation FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 leading-tight">
              From public repo signals to a startup valuation
            </h2>
            <p className="text-base text-gray-600">
              GitHub data is useful evidence for technical execution. A full startup report still needs customer, market, revenue, and founder details.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {githubValuationFaqs.map((item) => (
              <div key={item.question} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black text-gray-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
