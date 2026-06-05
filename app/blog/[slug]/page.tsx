import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FileText, Link2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { blogArticles, getArticleBySlug, type BlogArticle } from "@/lib/blog/articles";
import { formatBlogDate, getBlogCitations, getBlogImageAlt, getBlogImageUrl, getSectionId } from "@/lib/blog/utils";
import { getPublishedMarketingBlogPostBySlug, type MarketingBlogPost } from "@/lib/marketing/blog-posts";
import { authoritySignals, internalCitations, seoKeywordClusters } from "@/lib/seo/authority";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

type BlogPostArticle = BlogArticle | MarketingBlogPost;

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug) || await getPublishedMarketingBlogPostBySlug(slug);
  if (!article) return {};
  const imageUrl = getBlogImageUrl(article) || "https://equidamai.com/opengraph-image";

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
      authors: [authoritySignals.authorName],
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
  const imageUrl = getBlogImageUrl(article);
  const imageAlt = getBlogImageAlt(article);
  const externalCitations = getBlogCitations(article);
  const allCitationUrls = [
    ...internalCitations.map((citation) => citation.url),
    ...externalCitations.map((citation) => citation.url),
  ];

  const sectionLinks = article.sections.map((section) => ({
    heading: section.heading,
    href: `#${getSectionId(section.heading)}`,
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
      description: authoritySignals.authorBio,
    },
    reviewedBy: {
      "@type": "Organization",
      name: authoritySignals.reviewerName,
      url: authoritySignals.reviewerUrl,
      description: authoritySignals.reviewerBio,
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
    abstract: article.summary,
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
    citation: allCitationUrls,
    hasPart: article.sections.map((section, index) => ({
      "@type": "WebPageElement",
      position: index + 1,
      name: section.heading,
      text: section.paragraphs.join(" "),
    })),
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
    <div className="min-h-screen bg-white text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />

      <main>
        <article>
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6 md:py-20">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Blog
              </Link>
              <div className="mt-8 flex justify-center sm:mt-10">
                <span className="inline-flex rounded-none border border-primary px-8 py-2 text-sm font-bold uppercase tracking-wide text-gray-950">
                  {article.category}
                </span>
              </div>
              <h1 className="mx-auto mt-7 max-w-5xl text-balance text-center text-3xl font-bold leading-[1.1] tracking-tight text-gray-950 sm:mt-8 sm:text-5xl lg:text-6xl">
                {article.title}
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-balance text-center text-lg leading-8 text-gray-700 sm:mt-7 sm:text-xl sm:leading-9">
                {article.description}
              </p>
              <div className="mx-auto mt-7 flex max-w-3xl flex-col items-center justify-center gap-3 text-center text-sm font-bold text-gray-700 sm:flex-row">
                <span>{authoritySignals.authorName}</span>
                <span className="hidden text-gray-300 sm:inline">/</span>
                <span>{formatBlogDate(article.publishedAt)}</span>
                <span className="hidden text-gray-300 sm:inline">/</span>
                <span>{article.readTime}</span>
              </div>
              {imageUrl ? (
                <figure className="mx-auto mt-10 max-w-6xl">
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    className="aspect-[16/10] w-full rounded-none object-cover sm:aspect-[16/7]"
                  />
                </figure>
              ) : null}
            </div>
          </header>

          <div className="mx-auto grid max-w-6xl justify-center gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,780px)_280px]">
            <div className="min-w-0">
              <div className="border-b border-gray-200 pb-7">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">In this guide</p>
                <nav className="mt-4 flex flex-wrap gap-2">
                  {sectionLinks.map((section) => (
                    <a key={section.href} href={section.href} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-primary hover:text-primary">
                      {section.heading}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="mt-8 border-l-4 border-primary py-1 pl-5">
                <div className="flex items-center gap-2 text-primary">
                  <BookOpen className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-wide">Short answer</p>
                </div>
                <p className="mt-3 text-lg font-semibold leading-8 text-gray-900 sm:text-xl sm:leading-9">{article.summary}</p>
              </div>

              <div className="mt-10 space-y-12">
                {article.sections.map((section, sectionIndex) => (
                  <section key={section.heading} id={getSectionId(section.heading)} className="scroll-mt-28">
                    <h2 className="text-2xl font-bold leading-tight text-gray-950 sm:text-3xl">{section.heading}</h2>
                    <div className="mt-4 space-y-4">
                      {section.paragraphs.map((paragraph, paragraphIndex) => (
                        <p
                          key={paragraph}
                          className={`text-[17px] leading-8 text-gray-800 sm:text-[19px] sm:leading-9 ${
                            sectionIndex === 0 && paragraphIndex === 0
                              ? "sm:first-letter:float-left sm:first-letter:mr-3 sm:first-letter:text-7xl sm:first-letter:font-bold sm:first-letter:leading-[0.86] sm:first-letter:text-gray-950"
                              : ""
                          }`}
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {section.bullets && (
                      <ul className="mt-6 space-y-3 border-l border-gray-200 pl-5">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-base leading-7 text-gray-700">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              <div className="mt-12 border-t border-b border-gray-200 py-8">
                <h2 className="text-2xl font-bold text-gray-900">Make the valuation specific to your company</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Use Evaldam AI to turn your stage, traction, market context, and assumptions into a structured valuation range and investor-ready report.
                </p>
                <Link href={`${article.cta.href}${article.cta.href.includes('?') ? '&' : '?'}utm_source=blog&utm_medium=content&utm_campaign=valuation-readiness&utm_content=${encodeURIComponent(article.slug)}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90">
                  {article.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <section className="mt-10 border-t border-gray-200 pt-7">
                <h2 className="text-lg font-bold text-gray-900">Written and reviewed by</h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <div>
                    <Link href="/methodology" className="text-sm font-bold text-gray-950 hover:text-primary">
                      {authoritySignals.authorName}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{authoritySignals.authorBio}</p>
                  </div>
                  <div>
                    <Link href="/methodology" className="text-sm font-bold text-gray-950 hover:text-primary">
                      {authoritySignals.reviewerName}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{authoritySignals.reviewerBio}</p>
                  </div>
                </div>
                <Link href="/methodology" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80">
                  Review methodology <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section className="mt-10">
                <h2 className="text-2xl font-bold text-gray-900">Common founder questions</h2>
                <div className="mt-5 space-y-4">
                  {faqItems.map((item) => (
                    <div key={item.question} className="border-l-4 border-gray-200 pl-4">
                      <h3 className="text-sm font-bold text-gray-900">{item.question}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-10 border-t border-gray-200 pt-7">
                <div className="flex items-center gap-2 text-primary">
                  <Link2 className="h-5 w-5" />
                  <h2 className="text-lg font-bold text-gray-900">Methodology and references</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  This guide is educational and should be adapted to your company stage, geography, traction, and fundraising context.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {internalCitations.map((citation) => (
                    <Link key={citation.href} href={citation.href} className="border border-gray-200 px-3 py-2 text-sm font-bold text-gray-800 hover:border-primary hover:text-primary">
                      {citation.label}
                    </Link>
                  ))}
                  {externalCitations.map((citation) => (
                    <a
                      key={citation.url}
                      href={citation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-gray-200 px-3 py-2 text-sm font-bold text-gray-800 hover:border-primary hover:text-primary"
                    >
                      {citation.label}
                    </a>
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="border-l border-gray-200 pl-5">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-wide">More valuation guides</p>
                </div>
                <div className="mt-4 space-y-3">
                  {related.map((item) => (
                    <Link key={item.slug} href={`/blog/${item.slug}`} className="block border-b border-gray-200 pb-4 hover:text-primary">
                      <span className="block text-xs font-bold uppercase tracking-wide text-primary">{item.category}</span>
                      <span className="mt-1 block text-sm font-bold leading-snug text-gray-900">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 border border-gray-950 p-5 text-gray-950">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Need a number?</p>
                <h2 className="mt-2 text-xl font-bold leading-snug text-gray-950">Turn this into a valuation range.</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Use Evaldam AI for a free valuation preview, then build the full investor-ready report.
                </p>
                <Link href="/free-valuation?utm_source=blog&utm_medium=content&utm_campaign=valuation-readiness&utm_content=sidebar" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">
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
