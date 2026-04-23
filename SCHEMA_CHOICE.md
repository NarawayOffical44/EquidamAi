# Choose Your Database Schema

You now have **2 complete, production-ready schemas**.

---

## Option 1: SIMPLE SCHEMA (MVP Testing)
**File:** `lib/supabase/schema.sql`

**What you get:**
- 3 tables: users, startups, valuations
- Basic authentication
- Simple valuation storage
- Row-level security

**Best for:**
- ✅ Quick testing
- ✅ MVP launch
- ✅ Understanding the flow
- ✅ Initial user testing

**Setup time:** 1 minute

---

## Option 2: COMPLETE SCHEMA (Production)
**File:** `lib/supabase/schema_complete.sql`

**What you get:**
- **12 tables** with complete features
- **Complete valuation history** tracking
- **AI research data** storage
- **Report generation** with sharing
- **Plan-based limits** (Pro: 3, Plus: 15, Enterprise: unlimited)
- **Market data** caching (2026 benchmarks)
- **User activity** logging
- **Audit trail** for compliance
- **Team management** for Plus/Enterprise
- **20+ performance indexes**
- **Full RLS security** on all tables

**Best for:**
- ✅ Production deployment
- ✅ Enterprise customers
- ✅ Plan-based feature limits
- ✅ Complete feature set
- ✅ User activity tracking
- ✅ Regulatory compliance

**Setup time:** 2 minutes

---

## Comparison

| Feature | Simple | Complete |
|---------|--------|----------|
| **Tables** | 3 | 12 |
| **Fields** | ~50 | 194 |
| **Valuation History** | Basic | Complete with tracking |
| **AI Research Data** | No | Yes |
| **Report Generation** | No | Full featured |
| **Plan Limits** | No | Yes (Pro/Plus/Enterprise) |
| **Team Management** | No | Yes |
| **Market Data Cache** | No | Yes |
| **Activity Logging** | No | Yes |
| **Audit Trail** | No | Yes |
| **Production Ready** | MVP | ✅ Full |

---

## Recommendation

### For Initial Testing (Today):
→ **Use SIMPLE schema** (`lib/supabase/schema.sql`)
- Quick to set up
- Perfect for testing the flow
- Can upgrade later

### For Production (Before Launch):
→ **Use COMPLETE schema** (`lib/supabase/schema_complete.sql`)
- All features included
- Plan-based limits
- Enterprise ready
- Audit & compliance

---

## How to Choose

### Use SIMPLE If You:
- [ ] Are testing the MVP
- [ ] Want to verify the flow works
- [ ] Plan to switch to COMPLETE later
- [ ] Don't need report history yet
- [ ] Don't have enterprise customers

### Use COMPLETE If You:
- [x] Are launching for production
- [x] Need plan-based feature limits
- [x] Want to track valuation history
- [x] Need report generation & sharing
- [x] Have enterprise requirements
- [x] Need compliance/audit trails

---

## Step 1: Run Your Chosen Schema

### For SIMPLE Schema:

1. Go to Supabase SQL Editor
2. Copy content from: `lib/supabase/schema.sql`
3. Paste into Supabase
4. Click **Run**

### For COMPLETE Schema:

1. Go to Supabase SQL Editor
2. Copy content from: `lib/supabase/schema_complete.sql`
3. Paste into Supabase
4. Click **Run**

---

## Step 2: Verify Success

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### SIMPLE Schema should show:
- users
- startups
- valuations

### COMPLETE Schema should show:
- ai_research_data
- audit_log
- market_data_cache
- reports
- startup_team
- subscription_plans
- user_activity_log
- valuation_history
- valuation_methods
- valuations
- users
- startups

---

## Step 3: Test the Flow

```bash
npm run dev
```

Then:
1. Go to http://localhost:3000
2. Click "Get Started"
3. Sign up
4. Create startup
5. Generate valuation
6. View report

---

## Upgrade Path

**If you started with SIMPLE:**

You can safely upgrade to COMPLETE later:

1. Add new tables one at a time
2. No data loss
3. Can do incrementally

**Or start fresh with COMPLETE** (recommended for production)

---

## Complete Schema Tables (12 Total)

```
1. users              → User accounts & subscriptions
2. startups          → Startup profiles (plan-limited)
3. ai_research_data  → Auto-extracted data
4. valuations        → Individual valuation runs
5. valuation_methods → 5 method results per valuation
6. reports           → Generated reports
7. valuation_history → Complete history tracking
8. startup_team      → Team member details
9. user_activity_log → User action tracking
10. market_data_cache → 2026 industry benchmarks
11. subscription_plans → Plan configuration
12. audit_log        → System audit trail
```

---

## What Gets Populated

### With COMPLETE Schema:

✅ **3 Subscription Plans** (auto-created):
```sql
-- Pro Plan
plan_name: 'pro'
monthly_price: $99
annual_price: $1,069 (10% discount)
max_startups: 3
features: [10 features listed]

-- Plus Plan
plan_name: 'plus'
monthly_price: $199
annual_price: $2,159 (10% discount)
max_startups: 15
features: [15 features listed]

-- Enterprise Plan
plan_name: 'enterprise'
monthly_price: Custom
annual_price: Custom
max_startups: NULL (unlimited)
features: [20 features listed]
```

---

## My Recommendation

**→ Use COMPLETE schema for production**

Reasons:
1. **Only 2 minutes longer** to set up
2. **Includes all features** you'll need
3. **Already has plan limits** built-in
4. **Production ready** from day 1
5. **No need to migrate later**
6. **Includes reporting** which is key feature

---

## Next Steps

### Decision Made? Here's What To Do:

1. **Choose schema** (Simple or Complete)
2. **Copy the SQL** from chosen file
3. **Paste into Supabase** SQL Editor
4. **Click Run** and wait for "Success"
5. **Restart dev server:** `npm run dev`
6. **Test the flow:** Sign up → Create startup → Generate valuation → View report

---

## Files Created for You

- ✅ `lib/supabase/schema.sql` - Simple schema (existing)
- ✅ `lib/supabase/schema_complete.sql` - Complete schema (new)
- ✅ `DATABASE_STRUCTURE.md` - Full documentation
- ✅ `RUN_SCHEMA.md` - Step-by-step guide
- ✅ This file - Choice guide

---

## Questions About Schema?

See `DATABASE_STRUCTURE.md` for complete field reference.

---

**Ready? Pick a schema and run it! 🚀**
