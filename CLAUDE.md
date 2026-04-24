# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev       # Start dev server at http://localhost:3000 (uses 4GB Node heap)

# Build & lint
npm run build     # Production build (uses 4GB Node heap)
npm run lint      # ESLint check
```

No test runner is configured in this project.

## Important: Next.js Version

This is **Next.js 16.2.4** — a cutting-edge version with breaking API changes. Before writing any routing, middleware, or server-component code, check `node_modules/next/dist/docs/` for the current API. Do not assume APIs match your training data.

## Architecture Overview

**Evaldam AI** — AI-powered startup valuation SaaS. Generates multi-method valuations from a startup profile, with a blended result and professional PDF report.

### Route Layout

```
app/
  page.tsx                        # Landing page (public)
  (auth)/login|signup/            # Auth pages (Supabase email/password)
  (app)/
    layout.tsx                    # Auth-gated layout
    dashboard/                    # Startup grid
    pricing/                      # Plan selection
    startup/
      create/                     # Multi-step form (SSR disabled, dynamic import)
      [id]/report/                # Report viewer
  api/
    auth/                         # Supabase session handling
    extract-profile/              # PDF/URL → StartupProfile via LLM
    valuate/                      # POST: runs valuation engine, returns result + markdown
    generate-report/              # Formats valuation into full report
    startup/[id]/                 # CRUD for startup records
    stripe/                       # Webhook + checkout handlers
    pdf/                          # PDF generation endpoint
```

### Valuation Pipeline

The core flow: `StartupProfile` → `ProfessionalValuationEngine` → 6 parallel methods → blended result → report markdown.

**`lib/valuation/professional-engine.ts`** — Orchestrates everything:
1. Runs all 6 methods via `Promise.allSettled` (graceful per-method failure)
2. Detects industry, finds comparables, sets market context
3. Applies dynamic weights (stage-based: early stage = more qualitative weight)
4. Blends valuations, generates sensitivity analysis

**`lib/claude/methods/`** — One class per method, all extend `ValuationMethodBase`:
- `scorecard.ts` — Bill Payne Scorecard
- `berkus.ts` — Berkus Method
- `vcMethod.ts` — VC Method
- `dcfLTG.ts` — DCF with Long-Term Growth
- `dcfMultiples.ts` — DCF with Exit Multiples
- `evaldam-score.ts` — Proprietary 6th method (20% weight in blend)

**`lib/claude/base-method.ts`** — Template method pattern: `buildPrompt()` → LLM → `extractJSON()` → `parseResponse()`. Each method overrides `buildPrompt()` and `parseResponse()`.

**`lib/claude/providers.ts`** — Multi-provider LLM client. Tries Groq (Llama 3.3 70B) first, falls back to OpenRouter. Controlled by `PREFERRED_LLM_PROVIDER` env var. Anthropic SDK is installed but used only optionally.

### Data Model

Key types in `types/index.ts`:
- `StartupProfile` — the central entity (stage, ARR, growth, team, TAM, etc.)
- `ValuationMethodResult` — low/mid/high estimates + reasoning per method
- `ValuationResult` — all 6 method results + `BlendedValuation`
- `ProfessionalValuationResult` (in engine) — extends `ValuationResult` with executive summary, sensitivity analysis, comparables

### Database (Supabase)

Tables: `users` (links to `auth.users`), `startups`, `valuations`. All have Row-Level Security — users only see their own records. Schema in `lib/supabase/schema.sql`.

Supabase clients:
- `lib/supabase/server.ts` — for Server Components and API routes (uses `cookies()`)
- `lib/supabase/client.ts` — for Client Components
- `lib/supabase/admin.ts` — service-role client (bypasses RLS, server-only)

### LLM Integration Pattern

All AI calls go through `callLLM()` in `lib/claude/providers.ts`. JSON responses are extracted via `extractJSON()` in `lib/claude/client.ts`. Methods expect LLM to return structured JSON matching their `parseResponse()` schema.

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GROQ_API_KEY
OPENROUTER_API_KEY          # Fallback LLM
ANTHROPIC_API_KEY           # Optional premium
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
PREFERRED_LLM_PROVIDER      # Optional: 'groq' | 'openrouter' | 'anthropic'
```

## Design System

- Light theme: white/gray-50 backgrounds, brand pink `#ff006e`, violet `#7c3aed`
- `.gradient-text` CSS class for pink→violet gradient text
- Tailwind CSS 4 (PostCSS-based, no `tailwind.config.js`)
- shadcn-ui components, Lucide React icons, Inter font

## Key Utilities

- `lib/utils/logger.ts` — structured logger, use instead of `console.log`
- `lib/utils/errors.ts` — `ValidationError` and other typed errors
- `lib/utils/response.ts` — `successResponse()` / `errorResponse()` for API routes
- `lib/utils/validation.ts` — Zod-based request validators

## Notes

- `@react-pdf/renderer` is listed as `serverExternalPackages` in `next.config.ts` — keep it server-side only
- The startup create page uses `next/dynamic` with `ssr: false` to avoid hydration issues with the multi-step form
- Stage-based valuation weights: pre-revenue/seed leans qualitative (Scorecard + Berkus), Series A+ leans quantitative (DCF + VC); Evaldam Score always gets 20%
