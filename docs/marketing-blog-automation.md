# Marketing Blog Automation

See also: **[docs/evaldam-ai-content-seo-growth-strategy.md](evaldam-ai-content-seo-growth-strategy.md)** for the full Content + SEO + Demand Generation strategy that this automation powers (India-first wedge, two-layer content model, funnel integration, roadmap).

Apps Script calls one API. The app can either publish supplied blog text or generate and publish the blog itself.

The default setup is designed for low-cost unattended publishing:

- Apps Script only pings one endpoint.
- The server checks current search/news signals when no topic is supplied.
- It turns relevant current signals into a founder-facing blog angle before calling the text model.
- If no useful current signal is found, it does not publish a stale fallback post.
- The generator uses one text-model call per blog post (with JSON mode for high parse reliability).
- The prompt is heavily engineered for practical founder tone, specific scannable headings, natural SEO keyword use, and strict evergreen rules.
- Generated images are disabled by default because they cost more.

## Database

Run the single consolidated schema in Supabase SQL editor:

```sql
-- lib/supabase/evaldam_optimized_schema.sql
```

It is idempotent and safe to rerun. Existing tables/data stay in place; missing tables, columns, indexes, and policies are added.

## Environment

```env
MARKETING_JOB_SECRET=use_a_long_random_value
MARKETING_AUTOMATION_ENABLED=true
MARKETING_BLOG_AI_ENABLED=true
MARKETING_BLOG_IMAGE_ENABLED=false
MARKETING_TREND_RESEARCH_ENABLED=true
MARKETING_TREND_QUERY_LIMIT=4
```

Optional trend query override:

```env
MARKETING_TREND_QUERIES=startup valuation founder fundraising,seed funding India valuation,AI startup funding valuation
```

Optional generated image support:

```env
MARKETING_BLOG_IMAGE_ENABLED=true
OPENAI_API_KEY=your_openai_key
MARKETING_IMAGE_MODEL=gpt-image-1-mini
MARKETING_IMAGE_SIZE=1536x1024
MARKETING_IMAGE_QUALITY=low
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

## API

`POST https://equidamai.com/api/marketing/run`

Headers:

```http
Authorization: Bearer YOUR_MARKETING_JOB_SECRET
Content-Type: application/json
```

Payload:

Simple ping that generates and publishes one blog:

```json
{}
```

Ping with custom trend searches:

```json
{
  "count": 1,
  "trendQueries": [
    "startup valuation founder fundraising",
    "AI startup funding valuation",
    "seed funding India valuation"
  ]
}
```

Ping with a topic:

```json
{
  "count": 1,
  "topics": [
    {
      "topic": "How seed founders should defend valuation before investor calls",
      "category": "Fundraising Readiness",
      "keywords": ["seed valuation", "investor readiness"],
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/blog/seed-valuation.png",
      "researchNotes": "Optional notes from Apps Script research."
    }
  ]
}
```

Publish text supplied by Apps Script:

```json
{
  "source": "appscript",
  "dryRun": true,
  "posts": [
    {
      "externalId": "weekly-2026-06-08-01",
      "title": "How Seed Founders Should Defend Valuation Before Investor Calls",
      "slug": "seed-founders-defend-valuation-before-investor-calls",
      "description": "A practical founder guide to defending a seed valuation range before investor calls using traction, assumptions, market context, and comparables.",
      "category": "Fundraising Readiness",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/blog/seed-valuation.png",
      "imageAlt": "Founder reviewing startup valuation before an investor call",
      "content": "## Why the valuation story matters\n\nA seed valuation is rarely accepted because of the number alone. Investors want to see how the range connects to traction, market size, team progress, and risk.\n\n## What investors usually test\n\nInvestors often test revenue assumptions, growth, comparables, dilution, and next-round expectations."
    }
  ]
}
```

## Rules

- Maximum two published posts per week.
- Duplicate `slug` or duplicate `source + externalId` is skipped.
- Similar titles/summaries are also checked against existing generated posts and the static blog library.
- Empty pings use current search/news signals. Supplied `topics` or `posts` skip trend discovery.
- Published posts need at least 600 words.
- Each post needs title and article content. Description, category, keywords, and sections can be sent when available.
- `imageUrl` is optional but should be HTTPS when provided.
- If `MARKETING_BLOG_IMAGE_ENABLED=true` and a post has no `imageUrl`, the same API attempts to generate a wide editorial hero image and upload it to Cloudinary.
- Image generation failures do not block publishing. The API returns image warnings in the same response.

## Apps Script ping

```javascript
function pingEvaldamBlogAutomation() {
  const endpoint = "https://equidamai.com/api/marketing/run";
  const secret = "YOUR_EVALDAM_SECRET_HERE";

  const response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: {
      Authorization: "Bearer " + secret
    },
    payload: JSON.stringify({})
  });

  Logger.log(response.getResponseCode());
  Logger.log(response.getContentText());
}
```
