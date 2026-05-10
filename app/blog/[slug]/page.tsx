import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { blogArticles, getArticleBySlug } from "@/lib/blog/articles";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
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
          url: "https://equidamai.com/opengraph-image",
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
      images: ["https://equidamai.com/opengraph-image"],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = blogArticles.filter((item) => item.slug !== article.slug).slice(0, 3);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    url: `https://equidamai.com/blog/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: "Evaldam AI",
      url: "https://equidamai.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Evaldam AI",
      logo: {
        "@type": "ImageObject",
        url: "https://equidamai.com/logo.png",
      },
    },
    image: "https://equidamai.com/opengraph-image",
    mainEntityOfPage: `https://equidamai.com/blog/${article.slug}`,
    keywords: article.keywords.join(", "),
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
      <Navbar />

      <main>
        <article>
          <header className="border-b border-gray-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Blog
              </Link>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{article.category}</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(article.publishedAt).toLocaleDateString("en-IN", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {article.readTime}
                </span>
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                {article.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-gray-600">{article.description}</p>
            </div>
          </header>

          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="max-w-3xl">
              <p className="border-l-4 border-primary bg-primary/5 px-5 py-4 text-base font-semibold leading-relaxed text-gray-800">
                {article.summary}
              </p>

              <div className="mt-10 space-y-10">
                {article.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="text-2xl font-black text-gray-900">{section.heading}</h2>
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
                          <li key={bullet} className="flex gap-3 text-base leading-relaxed text-gray-700">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>

              <div className="mt-12 rounded-lg border border-primary/20 bg-primary/5 p-6">
                <h2 className="text-2xl font-black text-gray-900">Make the valuation specific to your company</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Use Evaldam to turn your assumptions, stage, traction, and market context into a structured valuation range.
                </p>
                <Link href={article.cta.href} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90">
                  {article.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-gray-500">More valuation guides</p>
                <div className="mt-4 space-y-4">
                  {related.map((item) => (
                    <Link key={item.slug} href={`/blog/${item.slug}`} className="block rounded-lg bg-white p-4 text-sm font-bold leading-snug text-gray-900 shadow-sm hover:text-primary">
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
