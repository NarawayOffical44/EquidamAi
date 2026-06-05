# Platform Drawbacks Audit

## Critical (Do First)
- Fallback valuation method too conservative — `getDefaultValuation()` loses all company context
- Concurrent form save conflicts — last-write-wins, no optimistic locking
- Email not sent on cancellation — no trigger on subscription.deleted
- No retry for valuation timeout at 100s mark — must restart from scratch
- Plan limit race condition — downgrade mid-flow still persists data

## Dashboard (DashboardPageClient.tsx)
- No request deduplication — race conditions on rapid navigation
- Memory leak risk — analyticsComparisonSeries recomputes on every state change, no useMemo
- No retry mechanism on dashboard errors — user stuck until manual refresh
- No pagination — 100+ startups causes DOM bloat
- Chart colors not WCAG AA compliant

## New Startup Form (NewStartupPageClient.tsx)
- Prefill cache cleared on error — user loses data
- No max validation on TAM/ARR fields — potential backend overflow
- Duplicate submission possible — multiple rapid clicks trigger multiple API calls
- No unsaved-changes warning on back navigation
- Free plan permission check happens async — shows full form before blocking

## Startup Dashboard (StartupDashboardClient.tsx)
- Concurrent edit conflicts — parallel saves with no merge handling
- AI chat has no exponential backoff on repeated failures
- Proof document upload status not persisted to backend
- Team member details lost on reload — not stored in profile_data
- Duplicate valuation requests possible — no deduplication on "Run Valuation"
- Heavy use of `any` type throughout — hides schema evolution bugs

## Report Viewer (ReportPageClient.tsx)
- Share link copy race condition — can copy before shareToken loads
- PDF download failures silent — only logged to console
- Watermark overlay not responsive on mobile
- Social share buttons disabled with no tooltip explanation
- Scenario sliders reset on page refresh — no state persistence

## Valuation Engine (professional-engine.ts)
- Default fallback is stage-only — could undervalue 100x
- Outlier clamping asymmetric — skews mid estimate
- `isIndianStartup()` uses fragile keyword list
- Dynamic weights ignore data quality confidence
- No sensitivity to founder prior exit history
- `methodSpread` divides by near-zero — can crash

## LLM Provider (providers.ts)
- Single fallback only: Groq → OpenRouter → fail
- Temperature and token limits hardcoded globally
- JSON mode handled differently per provider
- Model names hardcoded — breaks if renamed
- No circuit breaker pattern
- Error extraction tries 8 JSON paths — brittle

## Valuation API (api/valuate/route.ts)
- Input validated after auth check — inconsistent error order
- No idempotency key — retries create duplicate valuations
- `hashStableValue()` uses XOR — collision risk
- Error messages leak internal method names
- Plan limits not re-checked before save

## Email Client (lib/email/client.ts)
- No retry on SMTP timeout — permanent failure
- Connection pool never closed — resource leak
- Email subject not sanitized — XSS risk
- Attachment size not validated
- Reply-To always hardcoded

## Auth Pages
- Email resend flow may call non-existent method on user object
- `getSafeNextPath()` allows `/admin`, `/internal`
- No login rate limiting — unlimited attempts
- Email normalized to lowercase but DB queries may be case-sensitive

## Cross-Cutting
- Heavy `any` typing throughout
- No request deduplication pattern
- Timeouts inconsistent across API calls
- Zero offline support
- No idle session timeout
- No structured error tracking (Sentry/Datadog)
- No API versioning
- No resume on mid-flow failures
