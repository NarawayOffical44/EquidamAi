import { CalendarDays, Clock } from "lucide-react";
import { formatBlogDate } from "@/lib/blog/utils";

type BlogMetaProps = {
  category: string;
  readTime: string;
  publishedAt?: string;
  compact?: boolean;
};

export function BlogMeta({ category, readTime, publishedAt, compact = false }: BlogMetaProps) {
  const chipClass = compact
    ? "rounded-full bg-gray-100 px-2.5 py-1"
    : "rounded-full bg-primary/10 px-2.5 py-1 text-primary";

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
      <span className={chipClass}>{category}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
        <Clock className="h-3.5 w-3.5" />
        {readTime}
      </span>
      {publishedAt ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatBlogDate(publishedAt)}
        </span>
      ) : null}
    </div>
  );
}
