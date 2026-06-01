<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Database Schema Discipline

Before creating migrations or DB tables, read `docs/database-schema-guide.md`. Prefer existing tables and append columns/JSONB metadata where appropriate. Keep `lib/supabase/evaldam_optimized_schema.sql` as the consolidated fresh/incomplete database script, and avoid adding new one-off tables unless the guide's criteria are met.
