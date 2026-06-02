# Marketing Blog Automation

Apps Script writes the finished article and sends it to one API. The app stores it in one table and renders it inside the existing `/blog` pages.

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
```

## API

`POST https://equidamai.com/api/marketing/run`

Headers:

```http
Authorization: Bearer YOUR_MARKETING_JOB_SECRET
Content-Type: application/json
```

Payload:

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
- Published posts need at least 600 words.
- Each post needs title and article content. Description, category, keywords, and sections can be sent when available.
- `imageUrl` is optional but should be HTTPS when provided.
