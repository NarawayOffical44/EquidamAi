import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock, FileText, Link2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { blogArticles, getArticleBySlug, type BlogArticle } from "@/lib/blog/articles";
import { getPublishedMarketingBlogPostBySlug, type MarketingBlogPost } from "@/lib/marketing/blog-posts";
import { authoritySignals, internalCitations, seoKeywordClusters } from "@/lib/seo/authority";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

type BlogPostArticle = BlogArticle | MarketingBlogPost;

function getPostImageUrl(article: BlogPostArticle) {
  if ("imageUrl" in article && typeof article.imageUrl === "string" && article.imageUrl.length > 0) {
    return article.imageUrl;
  }

  return null;
}

function getPostImageAlt(article: BlogPostArticle) {
  if ("imageAlt" in article && typeof article.imageAlt === "string" && article.imageAlt.length > 0) {
    return article.imageAlt;
  }

  return article.title;
}

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug) || await getPublishedMarketingBlogPostBySlug(slug);
  if (!article) return {};
  const imageUrl = getPostImageUrl(article) || "https://equidamai.com/opengraph-image";

  return {
    title: article.title,
    description: article.description,
    keywords: [
      ...article.keywords,
      ...seoKeywordClusters.core,
      ...seoKeywordClusters.methods,
      ...seoKeywordClusters.stage,
      ...seoKeywordClusters.markets,
      ...seoKeywordClusters.investorPrep,
    ],
    alternates: {
      canonical: `https://equidamai.com/blog/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://equidamai.com/blog/${article.slug}`,
      type: "article",
      siteName: "Evaldam AI",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: ["Evaldam AI"],
      tags: article.keywords,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug) || await getPublishedMarketingBlogPostBySlug(slug);
  if (!article) notFound();
  const imageUrl = getPostImageUrl(article);
  const imageAlt = getPostImageAlt(article);

  const sectionLinks = article.sections.map((section) => ({
    heading: section.heading,
    href: `#${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  }));
  const related = [
    ...blogArticles.filter((item) => item.slug !== article.slug && item.category === article.category),
    ...blogArticles.filter((item) => item.slug !== article.slug && item.category !== article.category),
  ].slice(0, 3);
  const faqItems = [
    {
      question: `What is the key takeaway from "${article.title}"?`,
      answer: article.summary,
    },
    {
      question: "What is the next Evaldam AI step?",
      answer: `Founders can use Evaldam AI for a company-specific valuation range and investor-ready report. The relevant next step is: ${article.cta.label}.`,
    },
    {
      question: "Where does Evaldam AI fit for this topic?",
      answer:
        "Evaldam AI helps founders organize valuation methods, assumptions, comparables, sensitivity analysis, and investor-ready reporting so the valuation can be discussed clearly.",
    },
  ];
  const wordCount = [
    article.title,
    article.description,
    article.summary,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets || []),
    ]),
  ].join(" ").split(/\s+/).filter(Boolean).length;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `https://equidamai.com/blog/${article.slug}#article`,
    headline: article.title,
    description: article.description,
    url: `https://equidamai.com/blog/${article.slug}`,
    inLanguage: "en-IN",
    articleSection: article.category,
    wordCount,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: authoritySignals.authorName,
      url: authoritySignals.authorUrl,
    },
    reviewedBy: {
      "@type": "Organization",
      name: authoritySignals.reviewerName,
      url: authoritySignals.reviewerUrl,
    },
    publisher: {
      "@type": "Organization",
      name: authoritySignals.organizationName,
      logo: {
        "@type": "ImageObject",
        url: "https://equidamai.com/logo.png",
      },
    },
    image: imageUrl || "https://equidamai.com/opengraph-image",
    mainEntityOfPage: `https://equidamai.com/blog/${article.slug}`,
    keywords: article.keywords.join(", "),
    isPartOf: {
      "@type": "Blog",
      "@id": "https://equidamai.com/blog#blog",
      name: "Evaldam AI Startup Valuation Blog",
    },
    about: article.keywords.slice(0, 6).map((keyword) => ({
      "@type": "Thing",
      name: keyword,
    })),
    citation: internalCitations.map((citation) => citation.url),
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
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
        name: "Blog",
        item: "https://equidamai.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `https://equidamai.com/blog/${article.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#fbfcfd] text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />

      <main>
        <article>
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
                <div>
                  <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary">
                    <ArrowLeft className="h-4 w-4" />
                    Blog
                  </Link>
                  <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{article.category}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(article.publishedAt).toLocaleDateString("en-IN", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                      <Clock className="h-3.5 w-3.5" />
                      {article.readTime}
                    </span>
                  </div>
                  <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-gray-950 sm:text-5xl">
                    {article.title}
                  </h1>
                  <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">{article.description}</p>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={imageAlt}
                      className="mt-8 max-h-[420px] w-full rounded-lg object-cover"
                    />
                  ) : null}
                </div>

                <div className="border-l-4 border-primary bg-gray-50 p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500">Article details</p>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
                    <div className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>Written by {authoritySignals.authorName}</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>Reviewed by methodology desk</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>Updated {new Date(article.updatedAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>Built for founder and investor-readiness</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-xs font-black uppercase tracking-wide text-gray-500">In this guide</p>
                <nav className="mt-4 grid gap-1">
                  {sectionLinks.map((section) => (
                    <a key={section.href} href={section.href} className="rounded-md px-3 py-2 text-sm font-bold leading-snug text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm">
                      {section.heading}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="rounded-lg border border-primary/20 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                  <BookOpen className="h-5 w-5" />
                  <p className="text-xs font-black uppercase tracking-wide">Short answer</p>
                </div>
                <p className="mt-3 text-lg font-semibold leading-8 text-gray-800">{article.summary}</p>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  ["Founder value", "Clarifies the decision behind the valuation topic."],
                  ["Investor lens", "Shows why the issue can affect pricing or confidence."],
                  ["Evaldam AI CTA", "Moves readers toward a company-specific valuation report."],
                ].map(([label, text]) => (
                  <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wide text-primary">{label}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:hidden">
                {sectionLinks.map((section) => (
                  <a key={section.href} href={section.href} className="rounded-md bg-gray-50 px-3 py-2 text-sm font-bold leading-snug text-gray-800 hover:text-primary">
                    {section.heading}
                  </a>
                ))}
              </div>

              <div className="mt-10 space-y-12">
                {article.sections.map((section) => (
                  <section key={section.heading} id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}>
                    <h2 className="border-l-4 border-primary pl-4 text-3xl font-black text-gray-950">{section.heading}</h2>
                    <div className="mt-4 space-y-4">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-base leading-8 text-gray-700">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {section.bullets && (
                      <ul className="mt-5 space-y-3">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-base leading-6 text-gray-700 shadow-sm">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              <div className="mt-12 rounded-lg border border-primary/20 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-gray-900">Make the valuation specific to your company</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Use Evaldam AI to turn your stage, traction, market context, and assumptions into a structured valuation range and investor-ready report.
                </p>
                <Link href={article.cta.href} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90">
                  {article.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <section className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-gray-900">Common founder questions</h2>
                <div className="mt-5 space-y-4">
                  {faqItems.map((item) => (
                    <div key={item.question} className="border-l-4 border-gray-200 bg-gray-50 p-4">
                      <h3 className="text-sm font-black text-gray-900">{item.question}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                  <Link2 className="h-5 w-5" />
                  <h2 className="text-lg font-black text-gray-900">Methodology and references</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  This guide is educational and should be adapted to your company stage, geography, traction, and fundraising context.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {internalCitations.map((citation) => (
                    <Link key={citation.href} href={citation.href} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-gray-800 shadow-sm hover:text-primary">
                      {citation.label}
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <p className="text-xs font-black uppercase tracking-wide">More valuation guides</p>
                </div>
                <div className="mt-4 space-y-3">
                  {related.map((item) => (
                    <Link key={item.slug} href={`/blog/${item.slug}`} className="block rounded-lg border border-gray-100 bg-gray-50 p-4 hover:border-primary/30 hover:bg-white hover:text-primary">
                      <span className="block text-xs font-black uppercase tracking-wide text-primary">{item.category}</span>
                      <span className="mt-1 block text-sm font-bold leading-snug text-gray-900">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-gray-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-wide text-teal-200">Need a number?</p>
                <h2 className="mt-2 text-xl font-black leading-snug text-white">Turn this into a valuation range.</h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  Use Evaldam AI for a free valuation preview, then build the full investor-ready report.
                </p>
                <Link href="/free-valuation" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
