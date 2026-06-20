import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Code2, FileText, Layers3, Search, Sparkles, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BlogArticleCard } from "@/components/blog/BlogArticleCard";
import { blogArticles, type BlogArticle } from "@/lib/blog/articles";
import { getBlogImageAlt, getBlogImageUrl } from "@/lib/blog/utils";
import { getPublishedMarketingBlogPosts, type MarketingBlogPost } from "@/lib/marketing/blog-posts";
import { authoritySignals, seoKeywordClusters } from "@/lib/seo/authority";

type BlogListArticle = BlogArticle | MarketingBlogPost;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Startup Valuation & Fundraising Guides for Founders",
  description:
    "Founder-friendly guides on startup valuation, fundraising terms, dilution, cap tables, equity, industry benchmarks, location-specific fundraising, and investor-ready reports.",
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
    title: "Startup Valuation & Fundraising Guides for Founders | Evaldam AI",
    description:
      "Guides for founders preparing valuation ranges, fundraising terms, dilution, cap tables, industry benchmarks, and investor-ready reports.",
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
    title: "Startup Valuation & Fundraising Guides for Founders | Evaldam AI",
    description:
      "Founder guides on startup valuation, fundraising terms, dilution, cap tables, comparables, and investor-ready reports.",
    images: ["https://equidamai.com/opengraph-image"],
  },
};

const blogJsonLdBase = {
  "@context": "https://schema.org",
  "@type": ["Blog", "CollectionPage"],
  "@id": "https://equidamai.com/blog#blog",
  name: "Evaldam AI Startup Valuation Blog",
  url: "https://equidamai.com/blog",
  description:
    "Founder-friendly guides on startup valuation, fundraising terms, dilution, cap tables, industry benchmarks, location-specific fundraising, and investor-ready reports.",
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

function sortByPublishedAt(first: BlogListArticle, second: BlogListArticle) {
  return new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime();
}

export default async function BlogPage() {
  const automatedArticles = await getPublishedMarketingBlogPosts(24);
  const featuredArticle = blogArticles[0];
  const allArticles: BlogListArticle[] = [...automatedArticles, ...blogArticles].sort(sortByPublishedAt);
  const articles = allArticles.filter((article) => article.slug !== featuredArticle.slug);
  const findArticle = (slug: string) => allArticles.find((article) => article.slug === slug);
  const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const categoryCounts = allArticles.reduce<Record<string, number>>((counts, article) => {
    counts[article.category] = (counts[article.category] || 0) + 1;
    return counts;
  }, {});
  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const categoryGroups = Object.entries(
    allArticles.reduce<Record<string, BlogListArticle[]>>((groups, article) => {
      groups[article.category] = groups[article.category] || [];
      groups[article.category].push(article);
      return groups;
    }, {})
  ).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const categoryDirectory = categoryGroups.slice(0, 18);
  const readingPaths = [
    {
      label: "Raising soon",
      title: "Fundraising terms and valuation pressure",
      text: "Pre-money, post-money, SAFE terms, bridge rounds, and investor economics.",
      slugs: [
        "pre-money-vs-post-money-valuation-founders",
        "term-sheet-valuation-founder-economics",
        "bridge-round-valuation-extension-funding",
      ],
    },
    {
      label: "Ownership",
      title: "Cap table, dilution, and equity decisions",
      text: "Founder ownership, option pools, advisor equity, vesting, and employee options.",
      slugs: [
        "cap-table-basics-founder-ownership",
        "option-pool-shuffle-founder-dilution",
        "founder-dilution-seed-to-series-a",
      ],
    },
    {
      label: "Sectors",
      title: "Industry and location valuation signals",
      text: "SaaS, e-commerce, EdTech, PropTech, logistics, FoodTech, US, and India-US contexts.",
      slugs: [
        "saas-valuation-benchmarks-arr-growth-retention",
        "ecommerce-startup-valuation-margins-inventory-cac",
        "india-vs-us-startup-valuation",
      ],
    },
  ].map((path) => ({
    ...path,
    articles: path.slugs.map(findArticle).filter((article): article is BlogListArticle => Boolean(article)),
  }));
  const intentCollections = [
    {
      label: "Fundraising terms",
      title: "Investor terms and ownership economics",
      text: "For founders reviewing valuation language, investor rights, SAFEs, bridge rounds, or term sheets.",
      slugs: [
        "pre-money-vs-post-money-valuation-founders",
        "term-sheet-valuation-founder-economics",
        "liquidation-preference-startup-founder-valuation",
        "convertible-note-vs-safe-valuation-terms",
      ],
    },
    {
      label: "Cap table",
      title: "Founder ownership and dilution",
      text: "For teams preparing option pool, advisor equity, vesting, employee equity, and dilution conversations.",
      slugs: [
        "cap-table-red-flags-investors-notice",
        "option-pool-shuffle-founder-dilution",
        "startup-option-pool-size-seed-round",
        "co-founder-equity-split-investor-signal",
      ],
    },
    {
      label: "Investor prep",
      title: "Fundraising readiness",
      text: "For founders who need the valuation story, data room, runway, use of funds, and diligence narrative to line up.",
      slugs: [
        "startup-valuation-range-before-investors",
        "seed-round-valuation-benchmarks-founder-context",
        "investor-due-diligence-startup-valuation",
        "seed-fundraising-data-room-valuation",
        "spacex-ipo-valuation-founder-lessons",
      ],
    },
    {
      label: "Sectors",
      title: "Industry valuation signals",
      text: "For founders in SaaS, e-commerce, EdTech, PropTech, logistics, FoodTech, and other business models.",
      slugs: [
        "saas-valuation-benchmarks-arr-growth-retention",
        "b2b-saas-valuation-nrr-cac-payback-acv",
        "ecommerce-startup-valuation-margins-inventory-cac",
        "edtech-startup-valuation-adoption-retention-sales",
      ],
    },
  ].map((collection) => ({
    ...collection,
    articles: collection.slugs.map(findArticle).filter((article): article is BlogListArticle => Boolean(article)),
  }));
  const latestArticles = allArticles.slice(0, 12);
  const blogJsonLd = {
    ...blogJsonLdBase,
    blogPost: allArticles.slice(0, 100).map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.description,
      url: `https://equidamai.com/blog/${article.slug}`,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      image: getBlogImageUrl(article) || "https://equidamai.com/opengraph-image",
    })),
  };

  return (
    <div className="public-page min-h-screen bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />

      <main>
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Startup valuation library
                </span>
                <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-gray-950 sm:text-5xl">
                  Better valuation answers before investors ask harder questions.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-gray-600 md:text-lg">
                  Practical guides for founders preparing valuation ranges, fundraising terms, dilution context, cap table decisions, sector benchmarks, location narratives, and investor-ready reports.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="#topic-directory" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90">
                    Find by topic <Search className="h-4 w-4" />
                  </Link>
                  <Link href="#recommended-paths" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:border-primary hover:text-primary">
                    Choose a reading path
                  </Link>
                </div>
                <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                  <span className="rounded-full bg-gray-100 px-3 py-1.5">{blogArticles.length} guides</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">Founder-focused</span>
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">Investor-ready</span>
                  <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-700">Clear by topic</span>
                </div>
              </div>

              <div className="border-l-4 border-primary bg-gray-50 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Start here</p>
                <h2 className="mt-2 text-2xl font-bold leading-snug text-gray-950">{featuredArticle.title}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">{featuredArticle.description}</p>
                <Link href={`/blog/${featuredArticle.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">
                  Read featured guide <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-10 grid gap-3 border-t border-gray-200 pt-6 sm:grid-cols-3">
              {[
                ["Experience", "Built around real founder fundraising decisions."],
                ["Expertise", "Organized by valuation, ownership, terms, sectors, and markets."],
                ["Trust", "Built to help founders move from reading to a defensible Evaldam AI valuation report."],
              ].map(([label, text]) => (
                <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="topic-directory" className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Search className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-wide">Searchable directory</p>
                </div>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">Find the right guide faster</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Jump by founder problem, topic cluster, or recent article without scanning every card.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categoryDirectory.map(([category, group]) => (
                  <Link key={category} href={`#category-${slugify(category)}`} className="group rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-primary/40 hover:bg-white hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-950 group-hover:text-primary">{category}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-500">{group.length} guides</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-600">{group[0]?.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Get a free valuation preview",
                text: "Start with a quick range before building a full investor-ready report.",
                href: "/free-valuation",
                icon: <TrendingUp className="h-5 w-5" />,
              },
              {
                title: "Get an idea-stage valuation — no pitch deck needed",
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
              <Link key={card.href} href={card.href} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white transition group-hover:bg-primary">
                  {card.icon}
                </div>
                <h2 className="text-lg font-bold text-gray-900">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{card.text}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Browse by intent</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-950">The most searched founder problems</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-gray-600">
              These groups map the library to the questions founders usually bring into fundraising, equity, and valuation decisions.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {intentCollections.map((collection) => (
              <div key={collection.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">{collection.label}</span>
                    <h3 className="mt-3 text-xl font-bold text-gray-950">{collection.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{collection.text}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2">
                  {collection.articles.map((article) => (
                    <Link key={article.slug} href={`/blog/${article.slug}`} className="group flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-primary/30 hover:bg-white">
                      <span>
                        <span className="block text-sm font-bold leading-5 text-gray-900 group-hover:text-primary">{article.title}</span>
                        <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{article.category} · {article.readTime}</span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="recommended-paths" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Recommended paths</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-950">Choose the next best guide for your situation</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-gray-600">
              These paths reduce choice overload and lead founders from first principles to investor-ready preparation.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {readingPaths.map((path) => (
              <div key={path.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-600">{path.label}</span>
                <h3 className="mt-4 text-xl font-bold text-gray-950">{path.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{path.text}</p>
                <div className="mt-5 grid gap-2">
                  {path.articles.map((article, index) => (
                    <Link key={article.slug} href={`/blog/${article.slug}`} className="group flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-primary/30 hover:bg-white">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary shadow-sm">{index + 1}</span>
                      <span className="text-sm font-bold leading-5 text-gray-800 group-hover:text-primary">{article.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Layers3 className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-wide">Topic clusters</p>
                </div>
                <h2 className="mt-1 text-2xl font-bold text-gray-950">Browse by founder problem</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {topCategories.map(([category, count]) => (
                  <span key={category} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700">
                    {category} <span className="text-gray-400">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="all-guides" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
          <div className="mb-4">
            <input
              type="text"
              id="blog-search"
              placeholder="Search blogs by title, description, keywords or companies..."
              className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder-gray-400 focus:border-primary focus:outline-none"
              onInput={() => { if (typeof window !== 'undefined') (window as any).filterBlogs?.(); }}
            />
          </div>
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">All guides</p>
              <h2 className="mt-1 text-3xl font-bold text-gray-950">Valuation topics for every stage</h2>
            </div>
          </div>

          <div id="main-blog-grid" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => {
              const imageUrl = getBlogImageUrl(article);

              return (
                <BlogArticleCard
                  key={article.slug}
                  article={article}
                  imageUrl={imageUrl}
                  imageAlt={getBlogImageAlt(article)}
                />
              );
            })}
          </div>

          <script dangerouslySetInnerHTML={{ __html: `
            function filterBlogs() {
              const input = document.getElementById('blog-search');
              if (!input) return;
              const query = input.value.toLowerCase().trim();
              const grid = document.getElementById('main-blog-grid');
              if (!grid) return;
              const cards = grid.children;
              for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const text = card.textContent.toLowerCase();
                card.style.display = (query === '' || text.includes(query)) ? '' : 'none';
              }
            }
          ` }} />

          <div id="guides-by-topic" className="mt-14 space-y-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Guides by topic</p>
              <h2 className="mt-1 text-3xl font-bold text-gray-950">Every article grouped by search intent</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Use these sections when you know the category and want the shortest path to a relevant guide.
              </p>
            </div>

            {categoryGroups.map(([category, group]) => (
              <section key={category} id={`category-${slugify(category)}`} className="scroll-mt-28 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">{group.length} guides</p>
                    <h3 className="mt-1 text-2xl font-bold text-gray-950">{category}</h3>
                  </div>
                  <Link href="#topic-directory" className="text-sm font-bold text-primary hover:opacity-80">
                    Back to directory
                  </Link>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.map((article) => (
                    <Link key={article.slug} href={`/blog/${article.slug}`} className="group rounded-xl border border-gray-100 bg-gray-50 p-4 hover:border-primary/30 hover:bg-white">
                      <span className="block text-base font-bold leading-snug text-gray-950 group-hover:text-primary">{article.title}</span>
                      <span className="mt-2 line-clamp-2 block text-sm leading-6 text-gray-600">{article.description}</span>
                      <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {article.readTime}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <BookOpen className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-wide">Need the actual report?</p>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Turn the reading into a defensible valuation range.</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Evaldam helps convert assumptions, comparables, and valuation methods into an investor-ready report.
                </p>
              </div>
              <Link href="/free-valuation" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-[#005f5f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30">
                View Plans
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
