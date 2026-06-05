import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Database,
  Globe2,
  LineChart,
  MapPin,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BENCHMARK_COUNTRY_OPTIONS,
  getBenchmarkPersonalization,
} from "@/lib/personalization/country-benchmarks";

const pageUrl = "https://equidamai.com/startup-valuation-benchmarks";

export const metadata: Metadata = {
  title: "Startup Valuation Benchmarks by Country, Stage and Industry",
  description:
    "Benchmark startup valuations by country, stage, industry, ARR, growth, and data quality. Built for founders who need defensible context before investor conversations.",
  keywords: [
    "startup valuation benchmarks",
    "startup valuation comparables",
    "startup valuation India benchmarks",
    "startup valuation calculator",
    "startup valuation by country",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Startup Valuation Benchmarks by Country, Stage and Industry",
    description:
      "Country-aware startup valuation benchmark context for founders preparing investor-ready valuation ranges.",
    type: "website",
    url: pageUrl,
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI startup valuation benchmarks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Valuation Benchmarks by Country, Stage and Industry",
    description: "Benchmark valuation context by country, stage, industry, growth, and traction.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

const benchmarkFactors = [
  {
    icon: <MapPin className="h-5 w-5" />,
    title: "Country context",
    text: "Local capital markets, currency, investor behavior, and available peer data change the quality of a benchmark.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Stage and industry",
    text: "A seed SaaS company should not be compared blindly with a late-stage marketplace or a public software company.",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Revenue and growth",
    text: "ARR, growth rate, margin path, and retention signals explain why one peer deserves a premium or discount.",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Data quality",
    text: "Fresh, relevant, and explainable data matters more than a large but noisy peer list.",
  },
];

const benchmarkOutputs = [
  "Valuation range context",
  "Revenue and growth comparison",
  "Margin and capital efficiency context",
  "Similar startup peer set",
  "Recent funding round context",
  "Report-ready assumptions trail",
];

const benchmarkModules = [
  {
    title: "Financial trajectory",
    text: "Compare revenue growth, margin direction, burn, and capital efficiency against similar companies instead of looking at valuation alone.",
  },
  {
    title: "Comparable companies",
    text: "Use stage, industry, country, traction, and recent market signals to narrow the peer set before it reaches the report.",
  },
  {
    title: "Funding context",
    text: "Connect valuation to round size, use of funds, expected dilution, and investor-facing assumptions when those inputs are available.",
  },
  {
    title: "Aggregated peer data",
    text: "Use anonymized and aggregated signals for benchmark context, with global fallback when a local market has sparse data.",
  },
];

const faqs = [
  {
    question: "What is a startup valuation benchmark?",
    answer:
      "A startup valuation benchmark compares your valuation range with similar companies by stage, industry, country, traction, growth, and data freshness. It is context for the valuation, not a fixed rule.",
  },
  {
    question: "Why does country matter in startup valuation?",
    answer:
      "Country affects currency, discount rates, available capital, exit expectations, comparable company relevance, regulation, and investor behavior. A global peer can help, but local context is often more useful.",
  },
  {
    question: "Are benchmarks enough to set my valuation?",
    answer:
      "No. Benchmarks should be used with valuation methods, company assumptions, risk factors, sensitivity analysis, and investor negotiation context.",
  },
  {
    question: "How does Evaldam handle sparse local data?",
    answer:
      "Evaldam prefers local peers when available and transparently falls back to broader peers when the local set is too thin.",
  },
  {
    question: "Does benchmark data replace the valuation methods?",
    answer:
      "No. Benchmarks add market context around the methods. The report still needs assumptions, risk factors, sensitivity, and company-specific evidence.",
  },
];

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${pageUrl}#benchmarks`,
  name: "Evaldam AI Startup Valuation Benchmarks",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: pageUrl,
  publisher: { "@id": "https://equidamai.com/#organization" },
  description:
    "Country-aware startup valuation benchmark context by stage, industry, ARR, growth, and data quality.",
  featureList: [
    "Country-aware benchmark context",
    "Stage and industry peer matching",
    "ARR and growth comparison",
    "Financial trajectory benchmark context",
    "Comparable startup search",
    "Investor-ready report context",
    "Aggregated peer signal handling",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://equidamai.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Startup Valuation Benchmarks",
      item: pageUrl,
    },
  ],
};

const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export default async function StartupValuationBenchmarksPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const countryParam = Array.isArray(params.country) ? params.country[0] : params.country;
  const personalization = getBenchmarkPersonalization(countryParam);
  const countryQuery = personalization.countryCode === "GLOBAL" ? "" : `?country=${personalization.countryCode}`;
  const selectedLabel = personalization.countryLabel;

  return (
    <div className="public-page min-h-screen bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(webApplicationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />
      <Navbar />

      <main>
        <section className="border-b border-gray-100 bg-white px-4 py-12 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-primary">
                Startup valuation benchmarks
              </span>
              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-gray-950 sm:text-5xl">
                Benchmark your startup valuation by country, stage, industry, and traction.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
                Build confidence in a valuation range by comparing it with relevant peers, market context, recent signals, and report-ready assumptions.
              </p>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-gray-700">
                {personalization.proofLine}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/free-valuation" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90">
                  Try startup valuation calculator <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={`/comparable-companies${countryQuery}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold text-gray-800 hover:border-primary hover:text-primary">
                  Search comparables
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500">Current context</p>
                  <p className="mt-1 text-xl font-black text-gray-950">{selectedLabel}</p>
                </div>
                <Globe2 className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm leading-relaxed text-gray-600">{personalization.headlineContext}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {BENCHMARK_COUNTRY_OPTIONS.map((item) => (
                  <Link
                    key={item.code || "global"}
                    href={item.code ? `/startup-valuation-benchmarks?country=${item.code}` : "/startup-valuation-benchmarks"}
                    className={`rounded-sm border px-3 py-1.5 text-xs font-bold ${
                      (item.code || "GLOBAL") === personalization.countryCode
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <span className="text-xs font-black uppercase tracking-widest text-primary">Benchmark logic</span>
              <h2 className="mt-3 text-2xl font-black text-gray-950 sm:text-3xl">
                The right peer set is smaller, cleaner, and easier to explain.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Evaldam benchmarks are designed to support the valuation story. They help show why the range is reasonable, where the risk sits, and which assumptions investors may challenge.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {benchmarkFactors.map((item) => (
                <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-white text-primary">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-black text-gray-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-gray-100 bg-white px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-primary">What benchmarks add</span>
              <h2 className="mt-3 text-2xl font-black text-gray-950 sm:text-3xl">
                Market context around the number, not just another chart.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                {personalization.benchmarkLine}
              </p>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                {personalization.reportLine}
              </p>
              <Link href="/methodology" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                See the valuation methodology <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-[1fr_auto] border-b border-gray-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wide text-gray-500">
                <span>Benchmark output</span>
                <span>Report-ready</span>
              </div>
              {benchmarkOutputs.map((item) => (
                <div key={item} className="grid grid-cols-[1fr_auto] items-center border-b border-gray-100 px-5 py-4 last:border-b-0">
                  <span className="text-sm font-bold text-gray-800">{item}</span>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-primary">Benchmark coverage</span>
              <h2 className="mt-3 text-2xl font-black text-gray-950 sm:text-3xl">
                The useful context sits around the valuation, not above it.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                A benchmark is most valuable when it explains the company profile, the market, the comparable set, and the funding conversation in one chain.
              </p>
              <div className="mt-6 flex items-center gap-3 border-l-2 border-primary pl-4 text-sm font-semibold text-gray-700">
                <LineChart className="h-5 w-5 text-primary" />
                Country, stage, industry, traction, and data quality stay visible.
              </div>
            </div>

            <div className="border-y border-gray-200">
              {benchmarkModules.map((item, index) => (
                <div key={item.title} className="grid gap-3 border-b border-gray-100 py-5 last:border-b-0 sm:grid-cols-[44px_1fr]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-gray-200 text-xs font-black text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base font-black text-gray-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <span className="text-xs font-black uppercase tracking-widest text-primary">FAQ</span>
              <h2 className="mt-3 text-2xl font-black text-gray-950 sm:text-3xl">
                Startup benchmark questions founders ask before fundraising
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {faqs.map((item) => (
                <div key={item.question} className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="text-base font-black text-gray-950">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/free-valuation" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90">
                Run free valuation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/comparable-companies" className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold text-gray-800 hover:border-primary hover:text-primary">
                Explore comparables
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
