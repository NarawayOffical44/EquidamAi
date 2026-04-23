# How to Run the Complete Database Schema in Supabase

## Two Schema Options

### Option 1: ORIGINAL SCHEMA (Simple - 3 tables)
**File:** `lib/supabase/schema.sql`
- Users, Startups, Valuations
- Basic RLS policies
- Good for MVP testing
- **Recommended for initial testing**

### Option 2: COMPLETE SCHEMA (Production - 12 tables)
**File:** `lib/supabase/schema_complete.sql`
- All 12 tables with complete features
- Report history, AI research data, audit logs
- Plan-based limits
- Market data caching
- **Recommended for production**

---

## Quick Setup: Use Complete Schema

### Step 1: Copy the Schema

Open this file: `lib/supabase/schema_complete.sql`

Copy **ALL** the content (from the first `--` comment to the very end).

### Step 2: Paste into Supabase

1. Go to your Supabase dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. **Clear** any existing text
5. **Paste** the entire schema content
6. Click **Run** (or press Ctrl+Enter)

### Step 3: Wait for Success

You should see: **"Success"** message

If you see errors, check:
- Are you using the right project?
- Are all special characters copied correctly?
- Is there a syntax error? (Usually line number shown)

---

## What Gets Created

### 12 Tables:

1. **users** - Accounts & subscription data
2. **startups** - Startup profiles (plan-limited)
3. **ai_research_data** - Extracted & researched data
4. **valuations** - Individual valuation runs
5. **valuation_methods** - 5 method results per valuation
6. **reports** - Generated reports (one-pager, full, markdown)
7. **valuation_history** - Complete history tracking
8. **startup_team** - Team member details
9. **user_activity_log** - User action tracking
10. **market_data_cache** - 2026 industry benchmarks
11. **subscription_plans** - Plan configuration (pre-populated)
12. **audit_log** - System audit trail

### Initial Data:

✅ **3 Subscription Plans** automatically created:
- **Pro:** $99/month, 3 startups
- **Plus:** $199/month, 15 startups
- **Enterprise:** Custom pricing, unlimited startups

### Indexes:

✅ **Performance optimized** with indexes on:
- user_id (all tables)
- startup_id (all tables)
- created_at (all tables)
- status, stage, industry, plan
- Total: 20+ indexes

### Security:

✅ **Row-Level Security** enabled on all 12 tables:
- Users can only see their own data
- Public sharing via tokens
- Admin audit logging

---

## After Schema Creation

### 1. Verify Tables Exist

Go to **SQL Editor** and run:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see 12 tables.

### 2. Check Plans Inserted

```sql
SELECT * FROM public.subscription_plans;
```

You should see Pro, Plus, Enterprise.

### 3. Start Dev Server

```bash
cd D:\Apps\GrantsDetector\Evaldam\evaldam
npm run dev
```

### 4. Test Complete Flow

- Go to http://localhost:3000
- Sign up
- Create startup
- Generate valuation
- View report

---

## Key Features of Complete Schema

✅ **Plan-Based Limits**
```
Pro:       3 startups, 1 team seat, $99/month
Plus:     15 startups, 3 team seats, $199/month
Enterprise: Custom limits, custom pricing
```

✅ **Valuation History**
- Track all valuations for a startup
- See changes between valuations
- Regenerate valuations
- View historical trends

✅ **AI Research Data**
- Store extracted text from pitch decks
- Market research summaries
- Competitor analysis
- Risk & opportunity tracking

✅ **Report Management**
- One-page summaries
- Full 25-35 page reports
- Markdown export
- Share via tokens
- Track downloads

✅ **Market Data**
- 2026 industry benchmarks
- Comparable company data
- Stage-specific metrics
- Cached for fast operations

✅ **Audit Trail**
- Every user action logged
- Every data change tracked
- IP address & browser recorded
- For compliance & debugging

---

## Field Count & Complexity

| Table | Fields | Purpose |
|-------|--------|---------|
| users | 23 | Accounts & subscriptions |
| startups | 40 | Startup profiles |
| ai_research_data | 17 | Extracted & researched data |
| valuations | 17 | Valuation runs |
| valuation_methods | 14 | Method results |
| reports | 18 | Generated reports |
| valuation_history | 10 | History tracking |
| startup_team | 14 | Team members |
| user_activity_log | 11 | Activity tracking |
| market_data_cache | 19 | Benchmarks |
| subscription_plans | 11 | Plan config |
| audit_log | 10 | Audit trail |
| **TOTAL** | **194** | **Production ready** |

---

## Troubleshooting

### Error: "Table already exists"

**Solution:** Either:
1. Drop existing tables first, OR
2. Use the schema with `IF NOT EXISTS` clauses (which we did)

The schema includes `IF NOT EXISTS` so running it twice is safe.

### Error: "Syntax error at line X"

**Solution:**
- Check you copied the ENTIRE file
- Look at line X in the error
- Verify no special characters got corrupted

### Tables created but can't see data

**Solution:** Check Row-Level Security (RLS) is working:
1. Go to Supabase **Authentication → Users**
2. Create a test user
3. Go back to **SQL Editor**
4. Try to query as that user

### Indexes seem slow

**Solution:** Indexes are created with the schema. If slow:
1. Make sure all indexes created (run schema again)
2. Check if you're filtering on indexed columns
3. Check database isn't too large

---

## Next Steps

Once schema is created:

1. ✅ **Restart dev server** (to pick up environment changes)
2. ✅ **Test sign up** (creates user in users table)
3. ✅ **Create startup** (adds to startups table)
4. ✅ **Generate valuation** (adds to valuations & valuation_methods)
5. ✅ **Generate report** (adds to reports table)
6. ✅ **Check history** (see entries in valuation_history)

---

## Production Checklist

Before going live:

- [ ] Schema created successfully (12 tables)
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Test user can create startup
- [ ] Test valuation generates correctly
- [ ] Test report creation works
- [ ] Check market_data_cache is populated
- [ ] Verify audit logging works
- [ ] Test plan limits are enforced

---

## Schema Size

- **12 tables** with full relationships
- **194 fields** total
- **20+ performance indexes**
- **Complete RLS security**
- **Production ready**

---

## Questions?

Refer to `DATABASE_STRUCTURE.md` for complete field-by-field reference.

---

**Status:** Ready to run → Choose schema → Run → Verify → Test → Deploy
