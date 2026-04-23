# Evaldam AI - Complete Database Structure Documentation

## Overview

This database is designed to support a comprehensive AI-powered startup valuation platform with:
- Multi-user authentication & plan management
- Startup profile management with plan-based limits
- Complete valuation history tracking
- AI research data storage
- Report generation & distribution
- User activity auditing
- Market data caching

---

## Complete Table Reference

### 1. **USERS** - User Accounts & Subscription Management

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key, linked to Supabase auth | PK, FK auth.users |
| `email` | TEXT | User email | UNIQUE, NOT NULL |
| `full_name` | TEXT | Display name | |
| `company_name` | TEXT | User's company | |
| `plan` | TEXT | Current plan | DEFAULT 'pro', IN ('pro', 'plus', 'enterprise') |
| `plan_active` | BOOLEAN | Is plan active? | DEFAULT true |
| `subscription_id` | TEXT | Stripe subscription ID | |
| `subscription_start_date` | TIMESTAMP | When subscription started | |
| `subscription_end_date` | TIMESTAMP | When subscription ends | |
| `billing_cycle` | TEXT | Monthly or annual | IN ('monthly', 'annual') |
| `enterprise_startup_limit` | INTEGER | Custom limit for enterprise | DEFAULT 3 |
| `enterprise_team_seats` | INTEGER | Custom team seats | DEFAULT 1 |
| `avatar_url` | TEXT | Profile picture | |
| `bio` | TEXT | User bio | |
| `website` | TEXT | User's website | |
| `phone` | TEXT | Contact number | |
| `country` | TEXT | Country of residence | |
| `timezone` | TEXT | User's timezone | |
| `language` | TEXT | Preferred language | DEFAULT 'en' |
| `notifications_enabled` | BOOLEAN | Email notifications on? | DEFAULT true |
| `email_digest` | BOOLEAN | Weekly digest? | DEFAULT true |
| `is_verified` | BOOLEAN | Email verified? | DEFAULT false |
| `is_active` | BOOLEAN | Account active? | DEFAULT true |
| `verification_token` | TEXT | Email verification token | |
| `created_at` | TIMESTAMP | Account creation | DEFAULT CURRENT_TIMESTAMP |
| `last_login` | TIMESTAMP | Last login time | |

**Indexes:** email, plan, created_at

---

### 2. **STARTUPS** - Startup Profiles

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, DEFAULT uuid_generate_v4() |
| `user_id` | UUID | Owner user | FK users, NOT NULL |
| `company_name` | TEXT | Company name | NOT NULL |
| `slug` | TEXT | URL slug | UNIQUE |
| `description` | TEXT | Company description | |
| `logo_url` | TEXT | Company logo | |
| `website_url` | TEXT | Company website | |
| `stage` | TEXT | Company stage | NOT NULL, IN (7 stage options) |
| `founded_year` | INTEGER | Year founded | |
| `headquarters_country` | TEXT | Country of HQ | |
| `headquarters_city` | TEXT | City of HQ | |
| `arr` | DECIMAL(15,2) | Annual Recurring Revenue | |
| `mrr` | DECIMAL(15,2) | Monthly Recurring Revenue | |
| `total_revenue` | DECIMAL(15,2) | Total revenue | |
| `burn_rate` | DECIMAL(15,2) | Monthly burn | |
| `runway_months` | INTEGER | Months of runway | |
| `monthly_growth_rate` | DECIMAL(5,2) | Growth percentage | |
| `yoy_growth_rate` | DECIMAL(5,2) | Year-over-year growth | |
| `customer_count` | INTEGER | Number of customers | |
| `avg_contract_value` | DECIMAL(15,2) | Average ACV | |
| `product_type` | TEXT | SaaS, Marketplace, AI, etc. | |
| `industry` | TEXT | Industry category | |
| `sub_industry` | TEXT | Sub-category | |
| `target_market` | TEXT | Target market description | |
| `total_addressable_market_usd` | DECIMAL(15,2) | TAM | |
| `serviceable_addressable_market_usd` | DECIMAL(15,2) | SAM | |
| `team_size` | INTEGER | Total team members | |
| `founder_count` | INTEGER | Number of founders | |
| `ceo_name` | TEXT | CEO name | |
| `cto_name` | TEXT | CTO name | |
| `total_funding_raised` | DECIMAL(15,2) | Total funding | |
| `latest_funding_round` | TEXT | Latest round (Seed, A, B, etc.) | |
| `latest_funding_amount` | DECIMAL(15,2) | Latest round amount | |
| `investors` | TEXT[] | Array of investor names | |
| `problem_statement` | TEXT | Problem description | |
| `solution_description` | TEXT | Solution description | |
| `competitive_advantage` | TEXT | Competitive advantage | |
| `key_partnerships` | TEXT[] | Array of partnerships | |
| `status` | TEXT | active, archived, inactive | DEFAULT 'active' |
| `is_public` | BOOLEAN | Publicly shareable? | DEFAULT false |
| `share_token` | TEXT | Public sharing token | UNIQUE |
| `created_at` | TIMESTAMP | Creation time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:** user_id, status, stage, industry, created_at, slug

**Limits by Plan:**
- **Pro:** 3 startups per user
- **Plus:** 15 startups per user
- **Enterprise:** Custom limit (variable)

---

### 3. **AI_RESEARCH_DATA** - Extracted & Researched Data

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, DEFAULT uuid_generate_v4() |
| `startup_id` | UUID | Associated startup | FK startups, NOT NULL |
| `source_type` | TEXT | Data source | IN ('pitch_deck', 'website', 'user_input', 'manual_research') |
| `source_url` | TEXT | URL of source | |
| `source_document_name` | TEXT | Document filename | |
| `extraction_full_text` | TEXT | Extracted text from source | |
| `key_claims` | TEXT[] | Array of key claims | |
| `market_size_claims` | TEXT | Market size claims | |
| `growth_claims` | TEXT | Growth rate claims | |
| `team_highlights` | TEXT[] | Array of team highlights | |
| `market_research_summary` | TEXT | AI researched market data | |
| `competitor_analysis` | JSONB | Competitor data structure | |
| `industry_benchmarks` | JSONB | Industry benchmark data | |
| `risk_analysis` | TEXT[] | Array of risks | |
| `opportunities` | TEXT[] | Array of opportunities | |
| `extraction_confidence` | DECIMAL(3,2) | Confidence 0.0-1.0 | |
| `data_completeness` | INTEGER | Completeness 0-100% | |
| `created_at` | TIMESTAMP | Creation time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:** startup_id, created_at

**Use Case:** Store all AI-extracted and researched data for each startup's valuation

---

### 4. **VALUATIONS** - Individual Valuation Runs

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK, DEFAULT uuid_generate_v4() |
| `startup_id` | UUID | Associated startup | FK startups, NOT NULL |
| `user_id` | UUID | Creator user | FK users, NOT NULL |
| `blended_low_range` | DECIMAL(15,2) | Low valuation | |
| `blended_high_range` | DECIMAL(15,2) | High valuation | |
| `blended_weighted_average` | DECIMAL(15,2) | Average valuation | |
| `blended_median` | DECIMAL(15,2) | Median valuation | |
| `confidence_level` | TEXT | low, medium, high | IN ('low', 'medium', 'high') |
| `data_completeness` | INTEGER | 0-100% | |
| `methodology_version` | TEXT | Version of methodology | DEFAULT '1.0' |
| `market_conditions_snapshot` | JSONB | Market state at valuation | |
| `comparable_companies` | JSONB | Comps used | |
| `processing_time_seconds` | INTEGER | Time to generate | |
| `ai_model_used` | TEXT | Model name | DEFAULT 'llama-3.3-70b' |
| `llm_provider` | TEXT | Provider (groq, openrouter) | DEFAULT 'groq' |
| `status` | TEXT | pending, processing, completed, failed | DEFAULT 'completed' |
| `error_message` | TEXT | Error if failed | |
| `created_at` | TIMESTAMP | Valuation time | DEFAULT CURRENT_TIMESTAMP |
| `is_latest` | BOOLEAN | Is this the latest? | DEFAULT true |
| `regenerated_from_valuation_id` | UUID | If regeneration | FK valuations |

**Indexes:** startup_id, user_id, is_latest, created_at, status

**Key Features:**
- Complete valuation history per startup
- Tracks regenerations and changes
- Stores market conditions at time of valuation
- Comparable companies used in valuation

---

### 5. **VALUATION_METHODS** - Individual Method Results

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK |
| `valuation_id` | UUID | Parent valuation | FK valuations, NOT NULL |
| `startup_id` | UUID | Associated startup | FK startups, NOT NULL |
| `method_name` | TEXT | Method code | IN (5 method names) |
| `method_display_name` | TEXT | Display name | |
| `low_estimate` | DECIMAL(15,2) | Low range | |
| `mid_estimate` | DECIMAL(15,2) | Mid range | |
| `high_estimate` | DECIMAL(15,2) | High range | |
| `confidence` | TEXT | low, medium, high | |
| `method_inputs` | JSONB | Input values used | |
| `calculation_steps` | JSONB | Step-by-step calc | |
| `assumptions` | JSONB | Assumptions made | |
| `benchmarks_used` | JSONB | Benchmarks used | |
| `methodology_explanation` | TEXT | How method works | |
| `key_factors_explanation` | TEXT | What drove result | |
| `limitations` | TEXT | Method limitations | |
| `created_at` | TIMESTAMP | Creation time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:** valuation_id, method_name

**5 Methods Supported:**
1. Scorecard (Bill Payne)
2. Berkus Checklist
3. VC Method
4. DCF Long-Term Growth
5. DCF with Exit Multiples

---

### 6. **REPORTS** - Generated Reports

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK |
| `valuation_id` | UUID | Associated valuation | FK valuations, NOT NULL |
| `startup_id` | UUID | Associated startup | FK startups, NOT NULL |
| `user_id` | UUID | Creator | FK users, NOT NULL |
| `report_type` | TEXT | one_pager, full_report, markdown, exec_summary | NOT NULL |
| `title` | TEXT | Report title | |
| `markdown_content` | TEXT | Full markdown | |
| `html_content` | TEXT | Rendered HTML | |
| `pdf_url` | TEXT | Generated PDF URL | |
| `sections_included` | TEXT[] | Array of sections | |
| `word_count` | INTEGER | Word count | |
| `page_count` | INTEGER | Page count (full reports) | |
| `generated_by_model` | TEXT | Model used | DEFAULT 'llama-3.3-70b' |
| `generation_time_seconds` | INTEGER | Time to generate | |
| `template_version` | TEXT | Template version | DEFAULT '1.0' |
| `is_downloadable` | BOOLEAN | Can download? | DEFAULT true |
| `download_count` | INTEGER | Times downloaded | DEFAULT 0 |
| `is_public` | BOOLEAN | Public sharing? | DEFAULT false |
| `share_token` | TEXT | Share token | UNIQUE |
| `shared_with_count` | INTEGER | Times shared | DEFAULT 0 |
| `created_at` | TIMESTAMP | Creation time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:** valuation_id, user_id, report_type, created_at, share_token

**Report Types:**
- **One-Pager:** Single page executive summary
- **Full Report:** 25-35 pages with charts & analysis
- **Markdown:** For content export
- **Executive Summary:** Key highlights only

---

### 7. **VALUATION_HISTORY** - Complete History Tracking

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK |
| `startup_id` | UUID | Associated startup | FK startups, NOT NULL |
| `user_id` | UUID | Owner | FK users, NOT NULL |
| `valuation_id` | UUID | Valuation run | FK valuations, NOT NULL |
| `sequence_number` | INTEGER | 1st, 2nd, 3rd valuation | |
| `previous_valuation_id` | UUID | Link to previous | FK valuations |
| `valuation_change_amount` | DECIMAL(15,2) | $ change | |
| `valuation_change_percentage` | DECIMAL(5,2) | % change | |
| `key_changes` | TEXT[] | What changed | |
| `created_at` | TIMESTAMP | Time of valuation | DEFAULT CURRENT_TIMESTAMP |
| `reason_for_generation` | TEXT | Why regenerated | |

**Indexes:** startup_id, created_at

**Use Case:** Track all valuations over time, show valuation trends and changes

---

### 8. **STARTUP_TEAM** - Team Member Details

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK |
| `startup_id` | UUID | Associated startup | FK startups, NOT NULL |
| `name` | TEXT | Full name | NOT NULL |
| `email` | TEXT | Email address | |
| `title` | TEXT | Job title | |
| `role` | TEXT | Role type | IN (7 role types) |
| `bio` | TEXT | Bio/background | |
| `linkedin_url` | TEXT | LinkedIn | |
| `twitter_url` | TEXT | Twitter | |
| `prev_companies` | TEXT[] | Previous companies | |
| `education` | TEXT | Education background | |
| `is_primary` | BOOLEAN | Primary contact? | DEFAULT false |
| `created_at` | TIMESTAMP | Added time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:** startup_id

**Roles:** founder, ceo, cto, cfo, vp_sales, vp_product, other

---

### 9. **USER_ACTIVITY_LOG** - User Action Tracking

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK |
| `user_id` | UUID | User who acted | FK users, NOT NULL |
| `action_type` | TEXT | Action type | 11 action types |
| `startup_id` | UUID | Related startup | FK startups |
| `valuation_id` | UUID | Related valuation | FK valuations |
| `report_id` | UUID | Related report | FK reports |
| `description` | TEXT | Action description | |
| `ip_address` | TEXT | IP address | |
| `user_agent` | TEXT | Browser info | |
| `metadata` | JSONB | Extra data | |
| `created_at` | TIMESTAMP | Action time | DEFAULT CURRENT_TIMESTAMP |

**Indexes:** user_id, action_type, created_at

**Actions Tracked:**
- login, logout, signup
- valuation_generated, report_downloaded
- startup_created, startup_updated
- report_viewed, report_shared
- settings_updated
- plan_upgraded, plan_downgraded

---

### 10. **MARKET_DATA_CACHE** - Benchmark Data (2026)

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK |
| `industry` | TEXT | Industry | NOT NULL |
| `sub_industry` | TEXT | Sub-category | |
| `stage` | TEXT | Company stage | IN (7 stages) |
| `avg_arr_multiple_exit` | DECIMAL(5,2) | ARR multiple at exit | |
| `avg_revenue_multiple_exit` | DECIMAL(5,2) | Revenue multiple | |
| `avg_ebitda_multiple_exit` | DECIMAL(5,2) | EBITDA multiple | |
| `avg_monthly_growth_rate` | DECIMAL(5,2) | Avg growth % | |
| `median_series_a_valuation` | DECIMAL(15,2) | Median Series A | |
| `median_series_b_valuation` | DECIMAL(15,2) | Median Series B | |
| `total_addressable_market` | DECIMAL(15,2) | TAM | |
| `market_growth_rate` | DECIMAL(5,2) | Market growth % | |
| `market_cagr` | DECIMAL(5,2) | Compound growth | |
| `comparable_public_companies` | TEXT[] | Public comps | |
| `public_company_avg_multiples` | JSONB | Comp multiples | |
| `data_source` | TEXT | Source of data | |
| `confidence_score` | DECIMAL(3,2) | 0.0-1.0 confidence | |
| `created_at` | TIMESTAMP | Created | DEFAULT CURRENT_TIMESTAMP |
| `last_updated` | TIMESTAMP | Last update | |
| `data_as_of_date` | DATE | Data date | |

**Indexes:** industry, stage

**Use Case:** Store 2026 market benchmarks used in valuations

---

### 11. **SUBSCRIPTION_PLANS** - Plan Configuration

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK |
| `plan_name` | TEXT | Code name | UNIQUE, IN ('pro', 'plus', 'enterprise') |
| `display_name` | TEXT | Display name | |
| `description` | TEXT | Plan description | |
| `monthly_price` | DECIMAL(10,2) | Monthly price | |
| `annual_price` | DECIMAL(10,2) | Annual price | |
| `annual_discount_percentage` | DECIMAL(5,2) | Discount % | |
| `max_startups` | INTEGER | Max startups | NULL for enterprise |
| `max_valuations_per_month` | INTEGER | Monthly limit | |
| `max_reports_per_valuation` | INTEGER | Report limit | |
| `max_team_seats` | INTEGER | Team size | |
| `features` | TEXT[] | Feature array | |
| `is_active` | BOOLEAN | Is active? | DEFAULT true |
| `created_at` | TIMESTAMP | Created | DEFAULT CURRENT_TIMESTAMP |
| `last_updated` | TIMESTAMP | Last updated | |

**Plans:**

| Plan | Monthly | Annual | Startups | Team | Key Features |
|------|---------|--------|----------|------|--------------|
| **Pro** | $99 | $1,069 | 3 | 1 | Basic analytics, PDF reports |
| **Plus** | $199 | $2,159 | 15 | 3 | Advanced analytics, API access |
| **Enterprise** | Custom | Custom | Unlimited | Custom | White-label, SLA support |

---

### 12. **AUDIT_LOG** - System Audit Trail

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | PK |
| `action` | TEXT | Action performed | NOT NULL |
| `table_name` | TEXT | Table modified | |
| `record_id` | UUID | Record affected | |
| `user_id` | UUID | User who did it | FK users |
| `old_values` | JSONB | Previous values | |
| `new_values` | JSONB | New values | |
| `ip_address` | TEXT | IP address | |
| `user_agent` | TEXT | Browser info | |
| `timestamp` | TIMESTAMP | When | DEFAULT CURRENT_TIMESTAMP |

**Indexes:** user_id, table_name, timestamp

---

## Key Features of This Schema

✅ **Plan-Based Limits**
- Pro: 3 startups
- Plus: 15 startups
- Enterprise: Variable/unlimited

✅ **Complete History**
- All valuations tracked
- Regeneration tracking
- Valuation change analysis
- User activity logging

✅ **AI Research Data**
- Extracted from pitch decks
- Market research summary
- Competitor analysis
- Risk & opportunity tracking

✅ **Report Management**
- Multiple report types (one-pager, full, markdown)
- Share tokens for public sharing
- Download tracking
- Generation metadata

✅ **Security**
- Row-Level Security (RLS) enabled
- User data isolation
- Audit logging
- Activity tracking

✅ **Performance**
- Optimized indexes on all frequently-queried fields
- JSONB for flexible data storage
- Proper foreign keys and relationships

✅ **Market Data**
- 2026 industry benchmarks cached
- Comparable company data
- Stage-specific metrics

---

## Data Relationships

```
users (1) ---> (many) startups
           ---> (many) valuations
           ---> (many) reports
           ---> (many) user_activity_log

startups (1) ---> (many) valuations
          ---> (many) valuation_history
          ---> (many) ai_research_data
          ---> (many) startup_team

valuations (1) ---> (many) valuation_methods
           ---> (many) reports
           ---> (many) valuation_history

reports (1) ---> (many) (shared via share_token)

market_data_cache = standalone reference data
subscription_plans = reference data
audit_log = system-wide audit trail
```

---

## How to Use This Schema

### 1. Run in Supabase SQL Editor

Copy the entire content of `schema_complete.sql` and paste into Supabase SQL Editor, then click **Run**.

### 2. Key Operations

**Create a startup:**
```sql
INSERT INTO startups (user_id, company_name, stage, ...)
VALUES (auth.uid(), 'My Startup', 'seed', ...);
```

**Generate a valuation:**
```sql
INSERT INTO valuations (startup_id, user_id, blended_low_range, blended_high_range, ...)
VALUES (...);
```

**Track valuation history:**
```sql
INSERT INTO valuation_history (startup_id, user_id, valuation_id, ...)
VALUES (...);
```

**Generate a report:**
```sql
INSERT INTO reports (valuation_id, startup_id, user_id, report_type, markdown_content, ...)
VALUES (...);
```

---

## Summary

This schema supports:

- ✅ Multi-tenant SaaS with plan-based feature limits
- ✅ Complete valuation history & regeneration tracking
- ✅ AI research data storage & retrieval
- ✅ Professional report generation & sharing
- ✅ Market data caching for fast operations
- ✅ User activity auditing
- ✅ Enterprise customization
- ✅ Secure data isolation via RLS

**Total Tables: 12**
**Total Fields: 200+**
**Status: Production Ready** ✅
