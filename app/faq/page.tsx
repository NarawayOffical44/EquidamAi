"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, HelpCircle, Search, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const faqGroups = [
  {
    title: "Valuation Methodology",
    faqs: [
      {
        q: "How does Evaldam calculate startup valuation?",
        a: "Evaldam uses a blended methodology across Scorecard, Berkus, Venture Capital Method, DCF with Long-Term Growth, DCF with Exit Multiples, and Evaldam Score. The weighting depends on stage and data quality, so pre-revenue companies lean more on qualitative methods while revenue-stage companies use more financial modeling.",
        keywords: ["methodology", "valuation", "methods", "scorecard", "berkus", "dcf", "vc"],
      },
      {
        q: "Why should the valuation stay the same when I run it again?",
        a: "For paid reports, the same saved startup inputs, assumptions, methodology version, and market-data snapshot should reuse the existing valuation. A new valuation version is created when material business data, assumptions, or methodology changes.",
        keywords: ["same result", "repeatable", "deterministic", "changes", "rerun"],
      },
      {
        q: "Does the AI decide my valuation?",
        a: "No. Your valuation comes from six proven methods - Scorecard, Berkus, VC Method, two DCF models, and the Evaldam Score - not from an AI guessing a number. The AI is an assistant: it reads your business, runs the methodology, explains every figure in plain language, and answers your questions. That is what keeps the result defensible when an investor pushes back.",
        keywords: ["ai", "assistant", "how it works", "defensible", "black box", "trust"],
      },
      {
        q: "Is Evaldam a certified appraisal or investment advice?",
        a: "No. Evaldam is a decision-support and fundraising-preparation tool. It helps founders and advisors structure a valuation conversation, but it is not a certified appraisal, legal opinion, investment advice, or guarantee of funding terms.",
        keywords: ["certified", "legal", "investment advice", "disclaimer", "appraisal"],
      },
      {
        q: "What is the difference between a valuation range and a single valuation number?",
        a: "A range is more credible for early-stage startups because assumptions are uncertain. Evaldam gives low, mid, and high estimates so investors can see the conservative case, base case, and upside case.",
        keywords: ["range", "low", "mid", "high", "pre-money"],
      },
    ],
  },
  {
    title: "Free Tools",
    faqs: [
      {
        q: "What does the free website valuation include?",
        a: "The free website valuation is a quick preview based on public website signals and limited methods. It is useful for a starting range, but it does not replace the full paid report with saved assumptions, six methods, scenarios, and PDF output.",
        keywords: ["free", "website", "preview", "checker"],
      },
      {
        q: "What does the GitHub repo valuation mean?",
        a: "The GitHub repo valuation estimates the startup opportunity if a public repo became a company. It values execution quality, idea clarity, traction signals, monetization potential, investor risks, and comparable startup patterns, not the repo as a sellable asset.",
        keywords: ["github", "repo", "open source", "idea stage"],
      },
      {
        q: "Why do you ask for email and phone on the free tool?",
        a: "The free tool is also a lead workflow. Contact details let Evaldam deliver results, prevent abuse, and follow up with founders who may need a full report before fundraising.",
        keywords: ["email", "phone", "lead", "free tool"],
      },
    ],
  },
  {
    title: "Reports and Paid Plans",
    faqs: [
      {
        q: "Why would a founder pay for Evaldam instead of asking ChatGPT?",
        a: "A chatbot can produce a one-off opinion. Evaldam provides a repeatable valuation workflow with saved inputs, method weights, assumptions, comparables, sensitivity analysis, report history, and investor-ready PDF output.",
        keywords: ["chatgpt", "claude", "pay", "why pay", "report"],
      },
      {
        q: "What is included in the full paid report?",
        a: "Paid reports include six valuation methods, blended low/mid/high range, executive summary, assumptions trail, method breakdown, sensitivity analysis, comparables, review workflow, and investor-ready PDF/report output.",
        keywords: ["paid", "report", "pdf", "sensitivity", "assumptions"],
      },
      {
        q: "Can I track my valuation over time?",
        a: "Yes. Evaldam keeps every valuation version, so you can see how your number changes round over round and tie each move to a milestone. Instead of a one-time snapshot before a raise, you carry a live track record of your value - momentum you can show investors.",
        keywords: ["track", "over time", "history", "versions", "momentum", "rounds"],
      },
      {
        q: "Can I share the report with investors?",
        a: "Yes. The investor-ready report can be shared by link or PDF. It includes the method breakdown, comparables, assumptions, and sensitivity analysis, so the answer to \"how did you get this number?\" travels with it.",
        keywords: ["share", "investors", "link", "pdf", "send"],
      },
      {
        q: "Can I edit inputs and generate a new valuation version?",
        a: "Yes. Edit the startup profile, financials, assumptions, or market context, then generate a new valuation. If nothing material changed, Evaldam reuses the existing result to preserve trust.",
        keywords: ["edit", "version", "new valuation", "inputs"],
      },
      {
        q: "Who is Evaldam best for?",
        a: "Evaldam is best for founders preparing for angel, seed, or venture conversations, plus advisors and consultants who need repeatable valuation reports for multiple startup clients.",
        keywords: ["founder", "advisor", "consultant", "ICP", "customer"],
      },
    ],
  },
  {
    title: "Account and Usage",
    faqs: [
      {
        q: "How many startups can I create per month?",
        a: "Your monthly startup quota depends on your paid plan: Founder/Pro includes 3, Advisor/Plus includes 15, and Enterprise can be configured for higher volume.",
        keywords: ["quota", "startups", "monthly", "limit", "plan"],
      },
      {
        q: "What if I delete startups? Does my quota reset?",
        a: "No. Monthly quota is based on startup creations, not current active startups. Deleting a startup does not restore the creation quota for that month.",
        keywords: ["delete", "quota", "reset"],
      },
      {
        q: "Can I upgrade my plan to get more startup profiles?",
        a: "Yes. When you upgrade, your available quota and paid features update based on the new plan.",
        keywords: ["upgrade", "plan", "more startups"],
      },
      {
        q: "When does my monthly quota reset?",
        a: "Your monthly quota resets on your subscription renewal date. After renewal, your plan receives a fresh creation quota.",
        keywords: ["reset", "renewal", "monthly"],
      },
    ],
  },
];

type FlatFaq = (typeof faqGroups)[number]["faqs"][number] & {
  group: string;
  key: string;
};

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>("Valuation Methodology-0");
  const [searchQuery, setSearchQuery] = useState("");

  const allFaqs = useMemo<FlatFaq[]>(
    () =>
      faqGroups.flatMap((group) =>
        group.faqs.map((faq, index) => ({
          ...faq,
          group: group.title,
          key: `${group.title}-${index}`,
        }))
      ),
    []
  );

  const filteredFaqs = allFaqs.filter((faq) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      faq.q.toLowerCase().includes(query) ||
      faq.a.toLowerCase().includes(query) ||
      faq.group.toLowerCase().includes(query) ||
      faq.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    );
  });

  const groupedFiltered = faqGroups
    .map((group) => ({
      title: group.title,
      faqs: filteredFaqs.filter((faq) => faq.group === group.title),
    }))
    .filter((group) => group.faqs.length > 0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.slice(0, 12).map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const faqBreadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://equidamai.com" },
      { "@type": "ListItem", position: 2, name: "FAQ", item: "https://equidamai.com/faq" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqBreadcrumbSchema) }} />

      <div className="public-page min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_46%,#ffffff_100%)] text-gray-900">
        <Navbar />

        <section className="border-b border-gray-100 px-4 py-12 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-primary">
                Help center
              </span>
              <h1 className="mt-5 text-3xl font-black leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                Answers about startup valuation, reports, and plans
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
                Learn how Evaldam calculates valuations, why repeatability matters, what the free tools include, and when the full paid report is useful.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/70">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">Search answers</p>
                  <p className="text-xs text-gray-500">Try "GitHub", "same result", "paid report", or "quota".</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setOpenKey(null);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-4 pl-12 pr-12 text-sm text-gray-900 shadow-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setOpenKey("Valuation Methodology-0");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                {[
                  ["Methods", "6"],
                  ["Free tools", "2"],
                  ["Paid report", "PDF"],
                  ["Versioning", "Stable"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm font-black text-gray-900">{value}</p>
                    <p className="text-[11px] font-bold uppercase text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[260px_1fr] md:py-16">
          <aside className="hidden md:block">
            <div className="sticky top-24 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-black uppercase tracking-wide text-gray-400">Categories</p>
              <div className="space-y-1">
                {faqGroups.map((group) => (
                  <a key={group.title} href={`#${group.title.replace(/\s+/g, "-").toLowerCase()}`} className="block rounded-md px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-primary/5 hover:text-primary">
                    {group.title}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {filteredFaqs.length > 0 ? (
              <div className="space-y-8">
                {groupedFiltered.map((group) => (
                  <section key={group.title} id={group.title.replace(/\s+/g, "-").toLowerCase()}>
                    <div className="mb-3 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-black text-gray-900">{group.title}</h2>
                    </div>
                    <div className="space-y-3">
                      {group.faqs.map((faq) => {
                        const isOpen = openKey === faq.key;
                        return (
                          <div key={faq.key} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <button
                              onClick={() => setOpenKey(isOpen ? null : faq.key)}
                              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 sm:px-6"
                            >
                              <span className="text-sm font-black leading-relaxed text-gray-900 sm:text-base">{faq.q}</span>
                              {isOpen ? (
                                <ChevronUp className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                              ) : (
                                <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                              )}
                            </button>
                            {isOpen && (
                              <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
                                <p className="text-sm leading-relaxed text-gray-600">{faq.a}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-lg font-black text-gray-900">No answers found for "{searchQuery}"</p>
                <p className="mt-2 text-sm text-gray-500">Try a broader term or browse all questions.</p>
                <button onClick={() => setSearchQuery("")} className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                  Clear Search
                </button>
              </div>
            )}

            <div className="mt-10 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-black text-gray-900">Still need help?</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    Contact us if you need help choosing a plan, interpreting a valuation report, or setting up an advisor workflow.
                  </p>
                </div>
                <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90">
                  Contact Support <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
