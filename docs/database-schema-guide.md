# Database Schema Guide

Use this guide before changing Supabase schema.

## Main Rule

Do not create a new table until you have checked the existing consolidated schema and confirmed the data is truly relational, high-volume, or audit/history data.

Check these files first:

- `lib/supabase/evaldam_optimized_schema.sql` - the single consolidated setup script for fresh or incomplete databases.
- `DATABASE_STRUCTURE.md` - human-readable reference.
- `lib/supabase/migrations/` - targeted patch history.

## How To Add Schema

1. Prefer existing tables and existing JSONB metadata columns.
2. Append columns to existing core tables when the data belongs to that entity.
3. Keep migrations idempotent with `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and guarded `DO $$ ... $$` blocks.
4. Update `lib/supabase/evaldam_optimized_schema.sql` whenever a migration adds a column that fresh databases also need.
5. Keep user-facing error messages nontechnical. Do not expose schema-cache or metadata errors in the UI.

## Current Places To Store Compact State

- `public.users.billing_metadata`: account-level billing metadata such as invoice email state.
- `public.leads.metadata`: guest checkout and lead metadata before signup.
- `public.user_profiles`: startup quota and monthly profile counters.
- `public.ai_usage_counters`: AI, report download, and valuation preview usage counters.

## When A New Table Is Allowed

A new table is reasonable only when one of these is true:

- The data has many rows per account and needs filtering, joins, or independent retention.
- The data is an immutable audit/event history.
- The data needs row-level permissions that differ from its parent record.
- Storing it in JSONB would make normal product queries slow or unreliable.

If the data is single-row account state, idempotency state, or compact provider metadata, use an existing table/JSONB field.

## Copy-Paste SQL Policy

For a fresh or uncertain database, run:

```sql
-- Full schema setup and repair script.
-- File: lib/supabase/evaldam_optimized_schema.sql
```

For the latest self-serve billing/cancellation/invoice metadata patch, run:

```sql
-- Safe to rerun after the full schema exists.
-- File: lib/supabase/migrations/31_subscription_cancel_state.sql
```

Do not add separate one-off scripts for the same feature area. Extend the existing patch when the change belongs to the same account billing surface.
