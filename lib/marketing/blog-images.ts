import { sanitizeCloudinaryPublicId, uploadCloudinaryImage } from "@/lib/cloudinary";
import type { MarketingBlogPostInput } from "@/lib/marketing/blog-posts";

type BlogImageResult = {
  uploaded: number;
  skipped: number;
  warnings: string[];
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 90);
}

function hasImage(post: MarketingBlogPostInput) {
  return Boolean(readString(post.imageUrl ?? post.image_url ?? post.image));
}

function buildImagePrompt(post: MarketingBlogPostInput) {
  const title = readString(post.title);
  const category = readString(post.category) || "Startup Valuation";
  const description = readString(post.description ?? post.summary);

  return [
    "Create a premium editorial hero image for a startup finance publication.",
    "Style: clean, modern, realistic-but-polished, professional business editorial, no text, no logos, no watermark, no UI screenshots.",
    "Composition: wide landscape image suitable for a blog hero, high contrast focal point, enough negative space for cropping.",
    `Topic: ${title}`,
    `Category: ${category}`,
    description ? `Context: ${description}` : "",
    "Avoid cartoons, clipart, generic stock-photo cliches, currency piles, handshake cliches, and exaggerated AI robot imagery.",
  ].filter(Boolean).join("\n");
}

async function generateOpenAiImage(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MARKETING_IMAGE_MODEL || "gpt-image-1-mini",
      prompt,
      n: 1,
      size: process.env.MARKETING_IMAGE_SIZE || "1536x1024",
      quality: process.env.MARKETING_IMAGE_QUALITY || "low",
    }),
  });

  const data = await response.json().catch(() => ({})) as {
    data?: { b64_json?: string; url?: string }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || `Image generation failed with status ${response.status}.`);
  }

  const image = data.data?.[0];
  if (image?.b64_json) return Buffer.from(image.b64_json, "base64");

  if (image?.url) {
    const imageResponse = await fetch(image.url);
    if (!imageResponse.ok) throw new Error("Generated image URL could not be downloaded.");
    return Buffer.from(await imageResponse.arrayBuffer());
  }

  throw new Error("Image generation did not return an image.");
}

export async function attachGeneratedBlogImages(posts: MarketingBlogPostInput[]) {
  const result: BlogImageResult = {
    uploaded: 0,
    skipped: 0,
    warnings: [],
  };

  if (process.env.MARKETING_BLOG_IMAGE_ENABLED !== "true") {
    result.skipped = posts.length;
    return { posts, result };
  }

  const nextPosts: MarketingBlogPostInput[] = [];

  for (const post of posts) {
    if (hasImage(post)) {
      result.skipped += 1;
      nextPosts.push(post);
      continue;
    }

    const title = readString(post.title);
    const slug = slugify(readString(post.slug) || title);

    try {
      const buffer = await generateOpenAiImage(buildImagePrompt(post));
      const uploaded = await uploadCloudinaryImage({
        buffer,
        folder: "evaldam/blog",
        publicId: sanitizeCloudinaryPublicId(slug || `blog-${Date.now()}`),
        width: 1600,
        height: 900,
        crop: "fill",
        gravity: "auto",
      });

      result.uploaded += 1;
      nextPosts.push({
        ...post,
        imageUrl: uploaded.secureUrl,
        imageAlt: readString(post.imageAlt ?? post.image_alt) || title,
      });
    } catch (error) {
      result.skipped += 1;
      result.warnings.push(`${title || "Untitled post"}: ${error instanceof Error ? error.message : "Image generation failed."}`);
      nextPosts.push(post);
    }
  }

  return { posts: nextPosts, result };
}
