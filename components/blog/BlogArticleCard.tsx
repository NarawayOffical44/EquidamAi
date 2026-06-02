import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogMeta } from "@/components/blog/BlogMeta";

export type BlogCardArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  keywords: string[];
};

type BlogArticleCardProps = {
  article: BlogCardArticle;
  imageUrl?: string | null;
  imageAlt?: string;
};

export function BlogArticleCard({ article, imageUrl, imageAlt }: BlogArticleCardProps) {
  return (
    <article className="group flex min-h-[340px] flex-col border-b border-gray-200 bg-white pb-6">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={imageAlt || article.title}
          className="aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-1 w-full bg-primary" />
      )}
      <div className="flex flex-1 flex-col pt-5">
        <BlogMeta category={article.category} readTime={article.readTime} />
        <h3 className="mt-4 text-xl font-black leading-snug text-gray-950">
          <Link href={`/blog/${article.slug}`} className="hover:text-primary">
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{article.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {article.keywords.slice(0, 3).map((keyword) => (
            <span key={keyword} className="rounded-md bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-500">
              {keyword}
            </span>
          ))}
        </div>
        <Link href={`/blog/${article.slug}`} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-primary hover:opacity-80">
          Read guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
