import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Code2, FileText, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { blogArticles } from "@/lib/blog/articles";
import { authoritySignals, seoKeywordClusters } from "@/lib/seo/authority";

export const metadata: Metadata = {
  title: "Startup Valuation Blog",
  description:
    "Founder-friendly guides on startup valuation, fundraising benchmarks, valuation methods, GitHub repo valuation, and investor-ready reports.",
  keywords: [
    "startup valuation blog",
    ...seoKeywordClusters.core,
    ...seoKeywordClusters.methods,
    ...seoKeywordClusters.stage,
    ...seoKeywordClusters.markets,
    ...seoKeywordClusters.investorPrep,
  ],
  alternates: {
    canonical: "https://equidamai.com/blog",
  },
  openGraph: {
    title: "Startup Valuation Blog | Evaldam AI",
    description:
      "Guides for founders preparing valuation ranges, fundraising assumptions, and investor-ready reports.",
    url: "https://equidamai.com/blog",
    type: "website",
    siteName: "Evaldam AI",
    images: [
      {
        url: "https://equidamai.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Evaldam AI startup valuation blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Valuation Blog | Evaldam AI",
    description:
      "Founder guides on startup valuation, fundraising assumptions, comparables, and investor-ready reports.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Blog", "CollectionPage"],
  "@id": "https://equidamai.com/blog#blog",
  name: "Evaldam AI Startup Valuation Blog",
  url: "https://equidamai.com/blog",
  description:
    "Founder-friendly guides on startup valuation, fundraising benchmarks, valuation methods, and investor-ready reports.",
  publisher: {
    "@type": "Organization",
    name: authoritySignals.organizationName,
    url: authoritySignals.organizationUrl,
  },
  author: {
    "@type": "Organization",
    name: authoritySignals.authorName,
    url: authoritySignals.authorUrl,
  },
  blogPost: blogArticles.map((article) => ({
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    url: `https://equidamai.com/blog/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
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
      name: "Blog",
      item: "https://equidamai.com/blog",
    },
  ],
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_48%,#ffffff_100%)] text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />

      <main>
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-primary">
              Startup valuation guides
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight text-gray-900 sm:text-4xl md:text-5xl">
              Clear valuation thinking for founders preparing to raise
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              Crisp founder guides on valuation methods, pre-money ranges, India benchmarks, GitHub repo signals, and investor-ready assumptions.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <span className="rounded-full bg-gray-100 px-3 py-1">Written by valuation research team</span>
              <span className="rounded-full bg-gray-100 px-3 py-1">Methodology-backed</span>
              <span className="rounded-full bg-gray-100 px-3 py-1">Founder-focused</span>
            </div>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Get a free valuation preview",
                text: "Start with a quick range before building a full investor-ready report.",
                href: "/free-valuation",
                icon: <TrendingUp className="h-5 w-5" />,
              },
              {
                title: "Value a GitHub repo",
                text: "Turn public repo signals into an idea-stage startup valuation snapshot.",
                href: "/github-valuation",
                icon: <Code2 className="h-5 w-5" />,
              },
              {
                title: "Create the full report",
                text: "Use six methods, comparables, assumptions, and PDF output for fundraising.",
                href: "/signup",
                icon: <FileText className="h-5 w-5" />,
              },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {card.icon}
                </div>
                <h2 className="text-lg font-black text-gray-900">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{card.text}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
          <div className="grid gap-5 md:grid-cols-2">
            {blogArticles.map((article) => (
              <article key={article.slug} className="flex min-h-[280px] flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{article.category}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readTime}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-black leading-snug text-gray-900">
                  <Link href={`/blog/${article.slug}`} className="hover:text-primary">
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{article.description}</p>
                <Link href={`/blog/${article.slug}`} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-primary hover:opacity-80">
                  Read guide and next step <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-primary/20 bg-primary/5 p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <BookOpen className="h-5 w-5" />
                  <p className="text-xs font-black uppercase tracking-wide">Need the actual report?</p>
                </div>
                <h2 className="text-2xl font-black text-gray-900">Turn the reading into a defensible valuation range.</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Evaldam helps convert assumptions, comparables, and valuation methods into an investor-ready report.
                </p>
              </div>
              <Link href="/free-valuation" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90">
                Start Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
