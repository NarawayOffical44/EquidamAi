# Evaldam AI: Content, SEO & Demand Generation Strategy

**Version:** June 2026  
**Status:** Draft for discussion  
**Owner:** Growth + Product  
**Related Docs:** `docs/marketing-blog-automation.md`, `Evaldam_AI_Strategic_Overview.docx`, `lib/seo/authority.ts`, `lib/marketing/blog-trends.ts`

---

## 1. Executive Summary

Evaldam AI's primary growth engine is a high-conversion **free valuation → paid SaaS** funnel. The #2 prioritized GTM lever (after free valuation optimization) is **"India-first content + SEO"**.

We now have a production-grade, low-cost, signal-driven content system that:

- Monitors public Google News RSS (India-centric) + Google Trends (IN/US).
- Filters and scores for founder-relevant signals (valuation, funding, AI/SaaS/India, etc.).
- Classifies into angles (AI Startup Valuation, Startup Valuation India, Fundraising Readiness, SaaS Valuation, etc.).
- Dedupes against existing static + published posts.
- Produces a structured "generation brief" (topic + category + keywords + research notes + sources).
- Uses Groq (default) + heavily engineered prompt to write **evergreen founder guides**, not news recaps.
- Publishes with citations, methodology links, and strong CTAs to the free valuation tool.
- Enforces strict limits (max 2 published posts/week, 600+ words, quality gates).

**Goal of this strategy:** Turn the research flow from "working automation" into a durable, measurable **content moat and demand generation flywheel** that compounds the India wedge, improves free-to-paid conversion, and supports the Agency/Enterprise motions.

---

## 2. Strategic Context (Ladders to Business Strategy)

From the Strategic Overview:

- **Positioning**: Defensible, methodology-backed valuations (6 methods + proprietary Evaldam Score). Not black-box AI. Full evidence trail, comparables, investor-ready PDFs. India-optimized (RBI rates, local comps, INR).
- **Unit economics superpower**: 92-97% gross margins (deterministic core + low-cost LLM), best-in-class LTV:CAC (8-15x Startup, 25x+ Agency), organic CAC $15-60 via free funnel.
- **GTM priorities** (in order):
  1. Free valuation → paid conversion optimization (highest near-term leverage).
  2. **India-first content + SEO** (massive untapped demand).
  3. Developer API distribution partnerships.
  4. Agency / accelerator / incubator partnerships.
  5. Enterprise portfolio deals.

Content/SEO directly serves #1 and #2, and indirectly powers #4 and #5 (thought leadership + credibility for advisors and platforms).

**Why content works here**:
- The problem (gut-feel valuations, expensive consultants, weak India data) is **high-intent and recurring**.
- Founders actively search while preparing rounds.
- "Methodology + evidence" positioning requires proof in public (E-E-A-T).
- The research engine gives us **timely relevance at near-zero marginal cost** while the generator prompt forces evergreen, non-hype, practical tone.

## 2.5 Competitive Landscape: Equidam (equidam.com)

**Primary direct competitor**: Equidam is the established global player (founded ~2013, 140k+ valuations, 90 countries, $5B+ raised with their reports). They offer a 5-method blend (Scorecard, Checklist [Berkus-like], VC Method, DCF LTG, DCF Exit Multiples) + strong "Valuation Delta™" benchmarking (internal data + Crunchbase). Transparent public methodology PDF, adjustable params, country/industry tailoring via macro data (Damodaran risk premiums etc.), investor-ready 30+ page PDFs.

**Pricing model**: Freemium limited (free on-screen only, no report/benchmarks). Paid one-time "access days" (~$447 for 3 months full Advanced report + benchmarks; higher for expert review or 409A yearly sub). Team/API licenses custom. Accelerator discounts. Not primarily recurring SaaS for core users.

**Positioning**: "Quicker and more cost-effective than consultants or spreadsheets. Transparent, not black-box LLM." They emphasize methodology openness, benchmarks, and recently "Helpful, Powerful AI" for comparables/industry.

**India / localization reality** (key wedge opportunity):
- India is in their "supported countries" list (macro data, risk-free rates, currency handling, default settings per Damodaran-style country risk premium ~7.46% for India).
- Global public multiples database + recent Crunchbase rounds (country-filtered).
- Some emerging markets content (country risk article).
- However: No evidence of deep India-native data moat (e.g. MCA company filings, RBI-specific rate curves for local DCF, dense local private comps database, INR-first UX/pricing). Data is aggregated/global with country risk overlay. Their content, benchmarks, and case studies skew more global/EU/US. Testimonials include some Indian founders but platform is not "India-first".

**Evaldam AI differentiation (use relentlessly in content, product, and positioning)**:
- **India depth as core architecture, not add-on**: RBI rates, MCA Indian filings enrichment, local comparables/benchmarks, INR-native from day one. Built for the highest-density early-stage market (angels, family offices, seed) where global tools feel generic.
- **6-method engine + proprietary Evaldam Score**: Their 5 + our extra consistency/sanity layer (stage + industry + growth + moat + timing signals). Always 20% weight in blend per our engine.
- **Deterministic + AI hybrid, not pure LLM or pure rules**: Core calculations professional and repeatable (high 95%+ margins, near-zero marginal cost per valuation). LLM used for profile extraction/prefill + research, not the valuation itself. Explicitly "not black-box AI".
- **Business model advantage**: Powerful free valuation funnel (unlimited previews, watermarked reports) → low-friction recurring SaaS (Startup $44/mo unlimited, Agency $250/mo for portfolios/dashboards). Equidam is mostly transactional "buy the report this round".
- **Data enrichment & confidence**: Parallel fetchers (Crunchbase, LinkedIn, news, MCA for India), confidence scoring, full assumptions trail + sensitivity.
- **Developer/API + Agency motion**: Embeddable intelligence for platforms/fintech/cap table tools (high-margin). Portfolio tools for advisors/micro-VCs.
- **Evidence + speed**: Minutes, auditable, 50-100x cheaper than consultants for serious work. Our research flow keeps content fresher on India signals.

**Content/SEO implications**:
- Equidam actively blogs comparisons (they position against others). We must counter with India-specific, signal-driven evergreen guides that own "startup valuation India", "seed funding valuation India", "founder dilution India", "local benchmarks vs global tools".
- Our research automation (India-biased News RSS + Trends) is a weapon here — generate posts that surface current local funding/valuation signals and explain what they mean for founders using proper local context.
- Avoid direct "Equidam sucks" attacks. Frame as: "Global tools provide a starting point with country-risk adjustments. Indian founders raising from local capital need valuation grounded in Indian data, RBI realities, and local comps."

**Tactics**:
- Create/let automation produce "India vs global valuation platform" style pieces framed around founder outcomes.
- On /methodology, /free-valuation, and landing: Strong "India-optimized" claims with proof points (data sources, RBI, MCA).
- Target long-tail where they are weakest: pre-seed/seed India, angel/family office contexts, specific sectors common in India (fintech, SaaS, consumer).
- Monitor their pricing/content moves via the same research queries.

This competitor validates the market but highlights our wedge. Owning "professional valuation for Indian founders" + superior economics lets us win share even if they have more historical volume globally.

---

## 3. North Star Goal & Success Metrics

**North Star**: Number of **qualified free valuation starts** (and subsequent paid conversions) that can be attributed to (or assisted by) blog content.

**Primary Metrics (monthly)**:
- Blog sessions → free valuation starts (attributed via referrer/UTM/landing page in `lib/leads/client-attribution.ts`).
- Blog-assisted signups / free checks that convert to Startup or Agency plans.
- Organic non-brand search impressions + clicks for target clusters (esp. India + valuation + funding long-tails).
- % of new published marketing posts that rank in top 20 for at least one target keyword within 60-90 days.

**Leading Indicators**:
- Research flow "hit rate": % of `/api/marketing/run` (no-topic) calls that produce 1-2 usable requests (vs "no relevant current trend signals").
- Average relevance score of discovered signals.
- Post quality pass rate (word count, sections ≥2, no duplicate rejection).
- Internal link clicks and "related guides" CTR on blog posts.

**Lagging / Business**:
- Revenue influenced (Startup + Agency plans) from blog cohort.
- Time-to-first-paid for blog-referred users vs direct.

**Target (illustrative, to be baselined)**:
- Within 6 months: 25-35% of free valuation traffic has blog in the journey.
- Blog contributes to 15-20% of new Agency plan trials (high LTV:CAC segment).

---

## 4. Audience Segments (Prioritized)

1. **India early-stage founders raising angel/seed/pre-Series A** (primary wedge)
   - Pain: Need credible numbers for family offices, angels, and first institutional checks. Weak local benchmarks.
   - Content need: "What current signals mean for my valuation conversation", practical checklists, India-specific dilution/term examples.

2. **Micro-VCs, angels, accelerators, incubators, and advisors** (Agency plan targets)
   - Pain: Rebuilding spreadsheets for every deal; want portfolio consistency and faster diligence.
   - Content need: Investor lens articles, "what good evidence looks like", benchmarks by sector/stage.

3. **Global English-speaking pre-seed/seed founders** (especially AI, SaaS, fintech verticals)
   - Secondary but high-intent on methodology depth.

4. **Platform/developer users** (future API distribution)
   - Content that shows embeddable, auditable valuation intelligence.

Content must speak in **calm authority, practical, short sentences, concrete founder situations** (no hype, no "leverage the power of").

---

## 5. Content Architecture: Two-Layer Model

### Layer A — Authority Core (Static, High-Trust Evergreen)
- Location: `lib/blog/articles.ts` (~45 articles as of June 2026).
- Structure: Every article has 4 fixed sections:
  - What founders should know
  - Why investors care
  - Where valuation risk appears
  - Why founders use Evaldam AI
- Strong internal linking to `/methodology`, `/comparable-companies`, `/free-valuation`.
- Categories: Funding Terms, Cap Table / Dilution, Investor Prep, Sectors, etc.
- Purpose: Build long-term authority and E-E-A-T. These are the "reference" pieces.
- Update cadence: Quarterly reviews + additions for new mechanics (e.g. new SAFE variants, RBI changes).

**Current strength**: Excellent coverage of term sheet economics, dilution, pre/post money, liquidation prefs, etc.

### Layer B — Signal-Driven Layer (Dynamic, Research-Powered)
- Generated via `discoverTrendingMarketingBlogRequests` → `generateMarketingBlogPosts` → publish.
- Triggered when `/api/marketing/run` receives no explicit `posts` or `requests`.
- Uses `DEFAULT_SEARCH_QUERIES` + optional `MARKETING_TREND_QUERIES`.
- Sources: Google News RSS (IN) + Trends RSS (IN/US).
- Filtering/scoring/classification/deduping in `lib/marketing/blog-trends.ts`.
- Output: Structured brief → LLM writes 950-1250 word evergreen guide framed as "what these current signals mean for founders preparing valuation/fundraising".
- Published to `marketing_blog_posts` table (separate from static).
- Rendered identically in `/blog` and `/blog/[slug]`, with external `citations` shown in "Methodology and references".

**Key design choices already in place (and correct)**:
- Strict "evergreen, not news recap" instruction in the generator prompt.
- Research notes injected as context only.
- No inventing numbers, quotes, or case studies.
- Duplicate protection at discovery time + publish time (exact + fuzzy token overlap).
- 2 posts / week hard cap.
- Groq-first for cost/speed.

**Categories produced by current `CATEGORY_RULES`**:
- AI Startup Valuation
- SaaS Valuation
- Fintech Valuation
- Startup Valuation India (strong wedge play)
- Fundraising Terms
- Investor Readiness
- Revenue Quality
- Fundraising Readiness (default)

These map beautifully to both the static clusters in `seoKeywordClusters` and real user intent.

---

## 6. The Research Engine — Our Content Moat

**What it actually does** (verified against code in `blog-trends.ts` and route):

1. Builds query list (the exact list you described + more small-business variants).
2. Fetches Google News RSS (India params) + public Trends RSS.
3. Filters via `DOMAIN_KEYWORDS` (startup/founder/valuation/funding/seed/investor/saas/ai/india/revenue/dilution/cap table/term sheet/safe etc.).
4. Scores = keyword hits + recency (≤3 days = 5, ≤10 days = 4, etc.). Keeps ≥4.
5. Classifies angle via `CATEGORY_RULES` keyword matching.
6. Dedupes (title slug + existing published + static articles).
7. Builds rich brief (`topic`, `category`, `keywords`, `researchNotes` with dated sources, `sources`).
8. Generator prompt turns brief into article using Groq.

**Strengths**:
- Real-time relevance without manual research.
- India tilt (news hl/gl/ceid + Trends IN).
- Low cost (one LLM call per post + cheap RSS).
- Built-in quality rails (evergreen mandate, no hallucinated stats, citations preserved).
- Avoids "fixed topic list" staleness.

**Current limits / opportunities** (to address in roadmap):
- Limited to English RSS/Trends (no Hindi/regional yet).
- News signals can be noisy or India-light on some days → sometimes falls back or produces zero.
- No backlink acquisition strategy yet (the sources are cited but we don't outreach).
- Image generation off by default (cost control); hero images would help CTR.
- No explicit performance feedback loop into query weighting or classification yet.
- Attribution from blog to free valuation exists at referrer/UTM level but not deeply instrumented for cohort analysis.
- Static articles are "frozen" at 2026-05-12 dates; marketing posts have real `published_at`.

**Recommended enhancements** (see roadmap):
- Expand query seeds with more verticals and "India founder" phrasing.
- Add lightweight additional public signals (e.g. specific Indian startup media RSS if stable).
- Optional human-in-loop dry-run + approve flow for high-visibility posts.
- Track which categories and source queries produce the best downstream conversions.
- Surface "based on signals from [date]" subtly for freshness without newsjacking.
- Consider syndication (LinkedIn long-form, newsletters) of the best performing pieces.

---

## 7. Keyword & Topic Framework

**Base clusters** (already in `lib/seo/authority.ts`):
- core, methods, stage, markets (heavy India + verticals), investorPrep.

**Dynamic expansion** comes from the research flow + classification.

**Tactics**:
- Every generated post must naturally include 2-5 of the supplied `keywords` + core valuation/fundraising terms.
- Title strategy: Benefit-oriented, <70 chars, founder situation specific (per generator prompt).
- Internal linking: From signal posts back to the best authority articles on the same mechanic (pre/post, dilution, etc.).
- Pillar pages: Consider creating 1-2 true pillar pages (e.g. "Startup Valuation India 2026 Guide") that aggregate or link heavily to both layers.

**India-specific long tails to lean into** (via queries + classification):
- "startup valuation India", "seed funding India valuation", "AI startup funding valuation", "founder dilution India", RBI-related rate impacts on DCF, local comps, etc.

---

## 8. Funnel Integration & Attribution

**Current state**:
- Strong CTAs in every article (static + generated) to `/free-valuation` (or `/signup`).
- `AttributionCapture` + `captureLeadAttribution` records `referrer`, `landingPage`, UTMs on any visit.
- Blog posts include internal citations to methodology + comparables + free tool.

**Gaps & Recommendations**:
- Add UTM parameters to all blog CTAs: `?utm_source=blog&utm_medium=content&utm_campaign=valuation-readiness&utm_content=${slug}`.
- On the free valuation page/widget, surface "How did you hear about us?" or auto-detect referrer containing `/blog/`.
- In the leads table / dashboard, expose blog-assisted vs direct cohorts.
- On published marketing posts, optionally include a small "Context from recent market signals (as of [date])" line that links to the sources (already partially supported via citations).
- Experiment with "valuation readiness" lead magnet (e.g. checklist PDF generated from the same signals) gated behind email → higher intent than pure free valuation.

**CTA hierarchy on blog**:
1. Primary: "Get your company-specific valuation range" → /free-valuation (with UTM).
2. Secondary: "See the full methodology" → /methodology.
3. Tertiary: Related guides in sidebar.

---

## 9. Publishing Operations & Governance

Already excellent foundations in `marketing-blog-automation.md`:

- Secret-protected endpoint.
- Dry-run support.
- Max 2/week + weekly cap enforcement in publish logic.
- Duplicate protection (multiple layers).
- Source tagging (`server-trends-ai` vs `appscript`).
- Image attachment step (optional, Cloudinary).

**Ops recommendations**:
- Run via Apps Script cron (example already documented) or GitHub Action / Vercel Cron if preferred.
- Weekly review: Look at the last 1-2 generated posts for tone/accuracy. Use dry-run first.
- Maintain a private "content calendar" Notion/Google Sheet with:
  - Discovered signals summary
  - Chosen brief
  - Published URL
  - 30/60/90 day organic performance (impressions, clicks, downstream free vals)
- Version the generator system prompt carefully (it is the real product).
- Keep `MARKETING_BLOG_IMAGE_ENABLED=false` until we have clear ROI data or switch to cheaper image model.

---

## 10. Amplification & Distribution (Beyond Organic)

Content alone is not enough. Layer on:

- **Owned**: Consistent posting on LinkedIn / X from @EvaldamAI or founder accounts with "new guide" + key takeaway + link. Repurpose the research notes into threads.
- **Partnerships**: Offer co-branded or white-labeled versions of the best "Fundraising Readiness" or sector pieces to accelerators/incubators (ties to Agency motion).
- **Syndication**: Selected posts to India startup newsletters (e.g. YourStory, Inc42 partners, or founder communities) with canonical link back.
- **Developer angle**: When we have strong API stories, turn valuation methodology posts into "how to embed credible valuation in your cap table / fintech product" content for the API motion.
- **Backlinks**: The citations go outward; we should occasionally reach out to the original sources ("we referenced your coverage in our founder guide...") for possible reciprocal or mention.
- **Email**: If we build a light "valuation signals" newsletter, the research flow can feed it (different from full blog post).

---

## 11. Risks & Quality Controls

- **AI content perception / Google helpful content**: Mitigated by: heavy methodology grounding, citations, organization as author ("Evaldam AI Valuation Research Team"), strict evergreen rule, real data trail in the product itself. Never publish thin or repetitive output.
- **Quality variance**: The JSON mode + normalization + word count / section minimums + human spot checks are the controls. Consider adding a lightweight LLM-as-judge step (or keyword density / heading quality heuristics) before publish in future.
- **Over-indexing on trends**: The `buildRequest` always reframes as "what this means for founders..." + research notes instruct "use as market context... evergreen founder guide". Good.
- **India data sparsity on some days**: The fallback classification + broad DEFAULT queries + Trends filter help. If zero good signals, the API correctly returns 503 "no relevant... retry later".
- **Duplicate / cannibalization**: Multiple layers of protection already exist.

---

## 12. Phased Roadmap (2026-2027)

### Phase 0 — Foundation (Now – July 2026)
- Verify & harden the research flow (you just did the audit).
- Instrument basic attribution (UTMs on all blog CTAs, simple dashboard or Supabase query for blog-referred leads).
- Enable images on a small % of posts or A/B test (with cost tracking).
- Expand `DEFAULT_SEARCH_QUERIES` with 5-8 more India-founder and vertical phrases (already partially done; add more competitive/India-local like "India vs global valuation tool", "local comps startup valuation").
- Add India-specific + competitive differentiation language to key pages: /methodology (highlight 6th method + India data sources vs global macro overlays), /free-valuation widget copy, homepage hero/subhead.
- Baseline current metrics (organic traffic, top keywords, blog → free-val conversion rate) + competitive keyword gap (tools like Ahrefs or manual on "startup valuation India").
- Update seoKeywordClusters in lib/seo/authority.ts with stronger India wedge terms.

### Phase 1 — Flywheel Activation (Aug – Oct 2026)
- Run 6-8 weeks of consistent automated publishing (target 1-2 high-quality posts/week).
- Weekly ops review + performance tracking of generated vs static posts.
- Add "valuation signals" context line + improved source presentation on generated posts.
- Launch 2-3 pillar refreshes or new static authority pieces that the signal posts can link to. Prioritize one "India founders vs global valuation platforms" evergreen guide (use research flow + human polish).
- Experiment: Topic override via Apps Script using human-curated hot angles when signals are weak. Explicitly test one India-local angle (e.g. recent Bengaluru/Mumbai funding signals + local comps implications).
- Measure: 30-day organic lift on target keywords (esp. India valuation terms). Track rankings vs Equidam-owned or generic global content on India queries.
- Product quick win: Surface "India data sources used" (RBI, MCA, local comps) in the valuation output / report for relevant profiles.

### Phase 2 — Distribution & Optimization (Nov 2026 – Jan 2027)
- Build simple content performance view (published posts + downstream free vals + estimated revenue influence).
- Launch amplification plays: LinkedIn series, 1-2 newsletter syndications, accelerator co-marketing.
- Dynamic query tuning: Weight queries or categories by downstream conversion (if we log the brief used).
- Test gated assets (e.g. "India Seed Valuation Benchmarks Checklist" PDF) derived from research notes.
- Explore one additional public signal source (e.g. stable Indian startup media RSS).

### Phase 3 — Moat & Scale (Feb 2027+)
- Content → Product loops (e.g. surface trending angles inside the valuation tool as "current market context" for the user profile).
- API content program: "How platforms can offer valuation intelligence" guides targeted at potential embed partners.
- Regional/language expansion (if demand justifies).
- Formal E-E-A-T program (case studies from real (anonymized) users, methodology updates tied to content).
- Potential: Turn the research engine into a small public "market signals" widget or API for partners.

---

## 13. Immediate Recommendations (Next 2-4 Weeks)

1. **Ship attribution instrumentation**:
   - Update blog CTAs (in generator prompt instructions + static article CTAs + the post page component) to include UTM params.
   - Add a small "Came from our guide on [topic]?" note or better tracking on `/free-valuation`.

2. **Strengthen the research queries & classification**:
   - Add more "founder India", "angel round India", "pre-seed valuation", "revenue quality signals" queries.
   - Consider adding one more rule for "Early Stage Benchmarks" or "Cap Table Readiness".

3. **Ops hygiene**:
   - Set up a recurring (weekly) dry-run call from Apps Script or a simple script that logs what would be generated.
   - Create a shared sheet / Slack channel for "this week's discovered signals" so the team sees what the system is seeing.

4. **Quality & E-E-A-T**:
   - Review the last 4-6 generated posts for tone match and link the best ones from the homepage or methodology page.
   - Ensure the author/reviewer schema ("Evaldam AI Valuation Research Team") is consistent.

5. **Quick win experiment**:
   - Force one high-quality post with a hand-crafted brief (via the `topics` payload) on a burning India-specific angle and promote it manually on LinkedIn to measure lift.

6. **Docs update**:
   - Link this strategy from `docs/marketing-blog-automation.md`.
   - Update `lib/seo/authority.ts` keyword clusters with any new long-tails that perform well.

---

## 14. Appendix: Current Implementation Health (as of audit)

- Research flow (`/api/marketing/run` without posts/requests) → `discoverTrendingMarketingBlogRequests` → full 7-step process described by user: **True and accurately implemented**.
- Deduping, scoring, classification, brief creation, evergreen guardrails: solid.
- Generator prompt: excellent (tone, structure, no hallucination rules, JSON reliability).
- Publishing guardrails (caps, duplicates, word count, sections): good.
- Images: intentionally off for cost.
- The system correctly refuses to publish when no good signals exist (instead of forcing stale content).

This is one of the better "AI content" systems I've seen because the research is grounded in real public signals and the output constraints are extremely tight.

---

**Next step for the team**: Review this doc, baseline current numbers, agree on Phase 0 priorities, and decide ownership (Growth owns the flywheel; Product owns prompt + research logic quality; Eng owns reliability/attribution).

We can then move into implementation tickets (UTM rollout, query expansion, performance dashboard, etc.).

---

*This strategy is designed to be living. Update quarterly as the research engine learns what actually moves the free → paid needle.*