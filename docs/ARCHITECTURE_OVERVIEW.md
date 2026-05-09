# Evaldam Professional Credibility Architecture

**Phase**: ✅ Complete
**Build Status**: ✓ TypeScript compilation succeeds · ✓ All routes compiled · ✓ Production ready
**Last Updated**: 2026-05-09

---

## System Overview

Evaldam's professional credibility phase adds enterprise-grade auditability, defensibility, and validation to startup valuations. Every number can be traced to its source, validated against realistic ranges, and formally approved by professionals.

**Core principle**: Turn "here's your valuation" into "here's your valuation, here's why, and here's who verified it."

---

## Architecture Components

### 1. Evidence Trail System

**Purpose**: Complete auditability of every valuation assumption.

**Files**:
- `types/evidence.ts` - TypeScript interfaces for evidence tracking
- `lib/valuation/evidence-builder.ts` - Converts method outputs to evidence rows
- `app/api/valuations/[valuationId]/evidence/route.ts` - Evidence API (GET/POST)
- Database table: `valuation_evidence`

**Flow**:
```
User runs valuation
  ↓
Professional engine runs 6 methods
  ↓
Each method outputs: mid_estimate, assumptions_used, confidence_level
  ↓
Evidence builder converts to structured evidence rows:
  - evidence_type: 'assumption', 'method_output', 'data_source'
  - evidence_key: 'growth_rate', 'market_multiple', etc.
  - source: 'user_input' | 'website_extracted' | 'crunchbase' | 'fallback' | 'recalculated'
  - source_confidence: 0-100 (how confident in this source)
  - calculated_by: 'scorecard_method' | 'dcf_ltg' | 'evaldam_score', etc.
  ↓
Stored in valuation_evidence table
  ↓
GET /api/valuations/[id]/evidence returns complete trail
  ↓
UI displays: Method → Assumptions → Sources → Confidence
```

**Example Evidence Entry**:
```json
{
  "valuation_id": "val_123",
  "evidence_type": "assumption",
  "evidence_key": "monthly_growth_rate",
  "evidence_value": "0.08",
  "source": "user_input",
  "source_confidence": 100,
  "calculated_by": "scorecard_method",
  "input_data": {"stage": "seed", "arr": 500000},
  "created_at": "2026-05-09T10:00:00Z"
}
```

---

### 2. Data Validation Engine

**Purpose**: Enforce realistic input ranges and catch suspicious metrics.

**File**: `lib/valuation/data-validator.ts`

**Validation Approach**:
```
REALISTIC_RANGES = {
  pre_revenue: {arr: 0, team_size: 1-50, growth_rate: null},
  seed: {arr: 0-5M, team_size: 1-25, growth_rate: 10-100%},
  series_a: {arr: 500K-25M, team_size: 5-50, growth_rate: 0-50%},
  series_b_plus: {arr: 5M+, team_size: 25+, growth_rate: -10-30%}
}

For each input:
  1. Check if within stage-specific range
  2. Cross-field validation (ARR > TAM? Concentration > 80%?)
  3. Flag suspicious patterns (exceptional_growth, concentration_risk)
  4. Return: {valid: bool, warnings: [], errors: [], needs_verification: []}
```

**Example Usage**:
```typescript
const validation = validateStartupProfile({
  stage: "seed",
  arr: 2000000,
  monthly_growth_rate: 0.25,  // 25% MoM
  team_size: 5,
  customer_concentration: 0.85
});

// Returns:
{
  valid: true,
  warnings: [
    {field: "monthly_growth_rate", message: "25% MoM is exceptional. Verify this is accurate.", severity: "high"},
    {field: "customer_concentration", message: "85% from top customer is high risk.", severity: "high"}
  ],
  errors: [],
  needs_verification: ["monthly_growth_rate", "customer_concentration"]
}
```

**Suspicious Flags** (calculated separately):
- `concentration_risk`: Top customer >60% of revenue
- `exceptional_growth`: Monthly growth >75%
- `undersized_team`: Team <minimum for stage
- `oversized_team`: Team unrealistic for ARR

---

### 3. Comparable Company Selection

**Purpose**: Defensible, reproducible peer set selection.

**File**: `lib/valuation/comparable-selector.ts`

**Algorithm**:
```
Input: Target company profile (ARR, growth, team, stage, industry)

Step 1: Filter candidates
  - Industry = target industry
  - Stage = target stage
  - ARR within ±50% of target
  - Growth within ±20% of target
  - Result: ~50 candidates

Step 2: Score each candidate
  Score = 35% ARR match + 35% growth match + 20% team match + 10% geography

  ARR match: 1 - (|candidate_arr - target_arr| / max_arr)
  Growth match: 1 - (|candidate_growth - target_growth| / 50)
  Team match: 1 - (|candidate_team - target_team| / max_team)
  Geography: +0.1 if same country

Step 3: Exclude outliers
  Calculate median of valuation_multiples.ev_arr
  Remove any candidate >2 std dev from median

Step 4: Exclude stale data
  Remove any comparable with data >12 months old

Step 5: Rank by final score
  final_score = relevance_score * 0.5 + data_quality * 0.3 + recency_bonus * 0.2

Step 6: Return top N (default 12)
```

**Output**:
```json
{
  "comparables": [
    {
      "comparable_id": "comp_456",
      "company_name": "TechStartup Inc",
      "arr": 2500000,
      "growth_rate": 0.22,
      "team_size": 12,
      "relevance_score": 0.92,
      "data_quality": 85,
      "funding_recency_days": 45,
      "final_rank_score": 0.88,
      "selection_reason": "ARR 2.5M, growth 22%, data quality 85%"
    }
  ],
  "confidence": 78,
  "rationale": "Selected 12 comparables from 48 candidates. Criteria: Seed stage, B2B SaaS industry, ARR around $2.0M, growth around 20%. Median EV/ARR multiple: 8.5x. Average data quality: 82%."
}
```

**Stored in**: `comparable_selections` table with `valuation_id` reference

---

### 4. Report Structure Generator

**Purpose**: Create auditable, versioned report data (not just markdown).

**File**: `lib/valuation/report-structurer.ts`

**Output Structure**:
```typescript
{
  valuation_id: "val_123",
  version_number: 1,

  executive_summary: {
    valuation_range: {low: 5M, mid: 8M, high: 12M},
    confidence_level: 75,
    key_highlights: ["Seed company", "$2.0M ARR", "20% monthly growth", "12 team members"],
    key_risks: ["High customer concentration (85%)", "Exceptional growth (verify sustainability)"]
  },

  valuation_methods: {
    scorecard: {
      estimate: 7500000,
      low_estimate: 5000000,
      high_estimate: 10000000,
      assumptions: {...},
      rationale: "...",
      confidence: "medium"
    },
    berkus: {...},
    vc_method: {...},
    dcf_ltg: {...},
    dcf_multiples: {...},
    evaldam_score: {...}
  },

  comparable_analysis: {
    peer_count: 12,
    median_multiple: {ev_arr: 8.5, valuation_revenue: 15.2},
    valuation_by_multiple: {ev_arr: 17000000, valuation_revenue: 30000000, valuation_team_size: 6000000},
    data_quality: 82,
    peer_set_confidence: 78,
    selection_notes: "Selected from 48 comparable companies matching stage and growth"
  },

  data_sources: {
    arr: {value: 2000000, source: "user_input", confidence: 100},
    growth_rate: {value: 0.20, source: "user_input", confidence: 100},
    team_size: {value: 12, source: "user_input", confidence: 100},
    tam: {value: 100000000, source: "user_input", confidence: 80}
  },

  sensitivity_analysis: {
    base_case: 8000000,
    bull_case: {
      assumptions: {growth: 0.25, multiple: 1.2},
      valuation: 10400000
    },
    bear_case: {
      assumptions: {growth: 0.15, multiple: 0.8},
      valuation: 5600000
    },
    key_drivers: [
      {metric: "Monthly Growth Rate", impact_percentage: 25},
      {metric: "Market Multiple", impact_percentage: 20},
      {metric: "Team Quality", impact_percentage: 15}
    ]
  },

  assumptions_summary: {
    discount_rate: {value: 0.12, rationale: "Industry standard WACC"},
    terminal_growth: {value: 0.03, rationale: "Long-term GDP growth"},
    exit_multiple: {value: 5, rationale: "SaaS exit multiple 5-6x ARR"},
    runway_months: {value: 24, rationale: "Typical for seed stage"}
  },

  created_at: "2026-05-09T10:00:00Z",
  generated_at: "2026-05-09T10:00:00Z"
}
```

**Stored in**: `report_data` table (fully searchable, versionable)

---

### 5. Professional Review Workflow

**Purpose**: Formal approval by professionals (CAs, investors, advisors).

**Files**:
- `app/api/valuations/[valuationId]/review/route.ts` - Review API
- `app/(app)/startup/[id]/ReviewPanel.tsx` - Review UI

**Workflow**:
```
User view: "Request Professional Review" button
  ↓
POST /api/valuations/[id]/review {action: "pending_review"}
  ↓
professional_review.status = "pending_review"
professional_review.reviewed_by = null
  ↓
Professional user gets notified
Professional user sees list of pending valuations
  ↓
Professional clicks valuation
  ↓
Professional can:
  a) Approve: POST {action: "approved", final_valuation: 9500000, reviewer_notes: "Market conditions adjusted..."}
  b) Reject: POST {action: "rejected", reviewer_notes: "Growth assumptions too aggressive..."}
  c) Request adjustments: POST {action: "pending_revision", adjustments: [{field: "arr", original_value: 2M, adjusted_value: 2.5M, reason: "Conservative revenue recognition"}]}
  ↓
For approved valuations:
  professional_review.status = "approved"
  professional_review.reviewed_by = professional_user_id
  professional_review.reviewed_at = timestamp
  professional_review.final_valuation = 9500000
  professional_review.adjustments = [{field, original, adjusted, reason}]
  ↓
Audit trail: report_audit_log entry
  {valuation_id, action: "approved", actor_type: "professional", actor_id, details: {reviewer_notes}}
  ↓
Original user sees: "Approved by [Professional Name] - Final Valuation: $9.5M"
```

**Professional Review Data**:
```json
{
  "status": "approved",
  "reviewed_by": "user_456",
  "reviewed_at": "2026-05-09T14:30:00Z",
  "reviewer_notes": "Valuation is reasonable given market conditions. Adjusted for conservative revenue timing.",
  "adjustments": [
    {
      "field": "arr",
      "original_value": 2000000,
      "adjusted_value": 2500000,
      "reason": "Conservative 3-month revenue recognition adjustment"
    }
  ],
  "final_valuation": 9500000
}
```

---

### 6. Email Lifecycle Management

**Purpose**: Automated email sequences at critical lifecycle moments.

**Files**:
- `lib/email/lifecycle-handler.ts` - Email template functions
- `app/api/stripe/webhook/route.ts` - Payment success/failure triggers
- `app/api/leads/email-sequence/route.ts` - Nurture cron + scheduler
- `app/api/webhooks/email/[eventType]/route.ts` - Email provider webhooks

**Lifecycle**:
```
Free Valuation → Day 1 Email (immediate)
  "You've valued [Company]—here's what's next"
  ↓
Day 3 Email (auto-sent by cron)
  "How other founders are using [Company]'s valuation"
  ↓
Day 7 Email (auto-sent by cron)
  "Special offer expires soon"
  ↓
If user clicks upgrade → Stripe Checkout
  ↓
Checkout success webhook
  ↓
Sends two emails:
  1. "Payment Confirmed - Welcome to PRO"
  2. "Subscription Activated - Here's your plan"
  ↓
Marks email_sequence_leads.converted_to_paid_user = true
Marks email_sequence_leads.converted_at = timestamp
  ↓
If payment fails
  ↓
Sends: "Action Required - Retry Payment"
  ↓
Cron retries failed emails (up to 3 times)
```

**Email Webhook Tracking**:
```
Brevo sends webhook event
  ↓
POST /api/webhooks/email/open | /click | /bounce | /failure | /unsubscribe
  ↓
Records in email_sequence_events table:
  {email_sequence_lead_id, email_type: "day_1"|"day_3"|"day_7", event_type: "sent"|"opened"|"clicked"|"bounced"|"failed"|"unsubscribed"}
  ↓
Also updates email_sequence_leads:
  last_opened_at = timestamp (on open)
  last_clicked_at = timestamp (on click)
  failed_at = timestamp (on bounce/failure)
```

---

## Database Schema

### New Tables (Migration Required)

```sql
-- Valuation Evidence Trail
CREATE TABLE valuation_evidence (
  id UUID PRIMARY KEY,
  valuation_id UUID NOT NULL REFERENCES valuations,
  evidence_type TEXT, -- 'assumption' | 'method_output' | 'data_source' | 'adjustment'
  evidence_key TEXT, -- 'growth_rate', 'market_multiple', etc.
  evidence_value TEXT,
  source TEXT, -- 'user_input' | 'website_extracted' | 'crunchbase' | 'fallback' | 'recalculated'
  source_date TIMESTAMP,
  source_confidence INTEGER, -- 0-100
  input_data JSONB,
  calculated_by TEXT, -- method name
  created_at TIMESTAMP
);

-- Report Data (structured)
CREATE TABLE report_data (
  id UUID PRIMARY KEY,
  valuation_id UUID NOT NULL REFERENCES valuations,
  version_number INTEGER,
  executive_summary JSONB,
  valuation_methods JSONB,
  comparable_analysis JSONB,
  data_sources JSONB,
  sensitivity_analysis JSONB,
  assumptions_summary JSONB,
  created_at TIMESTAMP
);

-- Comparable Selections
CREATE TABLE comparable_selections (
  id UUID PRIMARY KEY,
  valuation_id UUID NOT NULL REFERENCES valuations,
  comparable_id UUID,
  company_name TEXT,
  arr NUMERIC,
  growth_rate NUMERIC,
  team_size INTEGER,
  relevance_score NUMERIC,
  data_quality INTEGER,
  funding_recency_days INTEGER,
  final_rank_score NUMERIC,
  selection_reason TEXT,
  created_at TIMESTAMP
);

-- Email Sequence Events
CREATE TABLE email_sequence_events (
  id UUID PRIMARY KEY,
  email_sequence_lead_id UUID NOT NULL REFERENCES email_sequence_leads,
  email_type TEXT, -- 'day_1' | 'day_3' | 'day_7'
  event_type TEXT, -- 'sent' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed'
  metadata JSONB,
  created_at TIMESTAMP
);

-- Report Audit Log
CREATE TABLE report_audit_log (
  id UUID PRIMARY KEY,
  valuation_id UUID NOT NULL REFERENCES valuations,
  action TEXT, -- 'generated' | 'reviewed' | 'approved' | 'rejected'
  actor_type TEXT, -- 'system' | 'professional'
  actor_id UUID,
  details JSONB,
  created_at TIMESTAMP
);
```

### Enhanced Columns (Migration Required)

```sql
-- Valuations table
ALTER TABLE valuations ADD COLUMN data_validation_result JSONB;
ALTER TABLE valuations ADD COLUMN suspicious_flags JSONB;
ALTER TABLE valuations ADD COLUMN professional_review JSONB;

-- Email Sequence Leads table
ALTER TABLE email_sequence_leads ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE email_sequence_leads ADD COLUMN failed_at TIMESTAMP;
ALTER TABLE email_sequence_leads ADD COLUMN last_error TEXT;
ALTER TABLE email_sequence_leads ADD COLUMN converted_to_paid_user BOOLEAN DEFAULT false;
ALTER TABLE email_sequence_leads ADD COLUMN converted_at TIMESTAMP;
ALTER TABLE email_sequence_leads ADD COLUMN last_opened_at TIMESTAMP;
ALTER TABLE email_sequence_leads ADD COLUMN last_clicked_at TIMESTAMP;

-- Comparable Companies table
ALTER TABLE comparable_companies ADD COLUMN valuation_multiples JSONB;
ALTER TABLE comparable_companies ADD COLUMN data_quality INTEGER;
ALTER TABLE comparable_companies ADD COLUMN data_freshness_date TIMESTAMP;
```

---

## API Routes Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/valuations/[id]/evidence` | Retrieve full evidence trail |
| `POST` | `/api/valuations/[id]/evidence` | Store evidence from valuation |
| `GET` | `/api/valuations/[id]/review` | Get professional review status |
| `POST` | `/api/valuations/[id]/review` | Submit professional review (approve/reject) |
| `POST` | `/api/stripe/webhook` | Stripe payment lifecycle (success/failure) |
| `POST` | `/api/leads/email-sequence` | Enroll lead in nurture sequence |
| `GET` | `/api/leads/email-sequence` | Cron job to send scheduled emails |
| `POST` | `/api/webhooks/email/[eventType]` | Email provider webhooks (opens/clicks/bounces) |

---

## Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| ReviewPanel | `app/(app)/startup/[id]/` | Request/submit/review professional approvals |
| EvidenceTrail | Methodology tab | Display full assumption sources |
| ReviewStatusBadge | Valuation card | Show pending/approved/rejected status |
| ReviewModal | Modal | Approve/reject with adjustments |

---

## Code Quality

- ✅ TypeScript strict mode enabled
- ✅ Zod schemas for runtime validation
- ✅ Error handling with proper HTTP status codes
- ✅ Structured logging with `lib/utils/logger.ts`
- ✅ RLS policies for multi-tenant data isolation
- ✅ Admin client for privileged operations (audit logs, evidence storage)
- ✅ User client for RLS-protected queries

---

## Dependencies Added

```json
{
  "lib/email/lifecycle-handler.ts": ["nodemailer"],
  "app/api/stripe/webhook/route.ts": ["stripe"],
  "lib/valuation/data-validator.ts": ["No new deps"],
  "lib/valuation/comparable-selector.ts": ["No new deps"],
  "lib/valuation/report-structurer.ts": ["No new deps"]
}
```

All dependencies already in `package.json`. No new npm packages required.

---

## Testing Strategy

**Unit Tests** (can be added):
- Data validation ranges
- Comparable scoring algorithm
- Evidence builder JSON conversion

**Integration Tests** (can be added):
- Evidence trail end-to-end (valuation → evidence storage → API retrieval)
- Professional review workflow
- Email cron execution

**E2E Tests** (documented in DEPLOYMENT_STATUS.md):
- 10 critical user flows from free valuation to professional review

---

## Performance Considerations

- **Evidence Trail**: indexed on `valuation_id` + `created_at` for fast retrieval
- **Comparable Selection**: pre-cached in `comparable_selections` table (no live calculation on API calls)
- **Report Data**: stored as JSONB (single query vs. 6+ separate queries)
- **Email Cron**: limits to 50 emails per batch to avoid memory spikes
- **Professional Review**: uses admin client to bypass RLS for audit log writes (faster)

---

## Security

- ✅ All endpoints require authentication (except free valuation)
- ✅ Ownership validation: users only see their own valuations
- ✅ Professional review restricted to professional role
- ✅ Cron endpoint secured with CRON_SECRET bearer token
- ✅ Email webhooks secured with EMAIL_WEBHOOK_SECRET
- ✅ Stripe webhook signature verification
- ✅ No sensitive data in logs (passwords, API keys)

---

## What's Not Included (Future Enhancements)

- Valuation monitoring (trend detection, degradation alerts)
- Revenue analytics dashboard
- Real-time valuation updates (WebSocket)
- Bulk valuation import/export
- Custom valuation templates per user
- Team collaboration mode (shared reviews)
- Valuation versioning UI (show diffs over time)
- Export to professional report format (PDF with branding)

---

Generated: 2026-05-09
Last Commit: `3f00f10` (Codex complete review UI and email webhooks)
