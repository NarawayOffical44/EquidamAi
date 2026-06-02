export type BlogImageArticle = {
  title: string;
  imageUrl?: unknown;
  imageAlt?: unknown;
};

export type BlogCitation = {
  label: string;
  url: string;
};

export function getSectionId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatBlogDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getBlogImageUrl(article: BlogImageArticle) {
  return typeof article.imageUrl === "string" && article.imageUrl.trim().length > 0
    ? article.imageUrl.trim()
    : null;
}

export function getBlogImageAlt(article: BlogImageArticle) {
  return typeof article.imageAlt === "string" && article.imageAlt.trim().length > 0
    ? article.imageAlt.trim()
    : article.title;
}

export function getBlogCitations(article: unknown) {
  const citations = typeof article === "object" && article !== null
    ? (article as { citations?: unknown }).citations
    : undefined;

  if (!Array.isArray(citations)) return [];

  return citations.filter((citation): citation is BlogCitation => {
    if (!citation || typeof citation !== "object") return false;
    const record = citation as Record<string, unknown>;
    return typeof record.label === "string" && typeof record.url === "string";
  });
}

export function stripEmoji(value: string) {
  return value
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
