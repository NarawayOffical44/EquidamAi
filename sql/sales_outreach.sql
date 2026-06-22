-- Run this in Supabase SQL editor
create table if not exists public.sales_outreach (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  plan_interest text,
  country text,
  status text not null default 'active' check (status in ('active', 'converted', 'opted_out', 'completed')),
  call_attempted_at timestamptz,
  call_sid text,
  call_outcome text,
  day1_sent_at timestamptz,
  day3_sent_at timestamptz,
  day7_sent_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sales_outreach_status_idx on public.sales_outreach(status);
create index if not exists sales_outreach_user_id_idx on public.sales_outreach(user_id);

-- RLS: only service role can read/write (used by admin client only)
alter table public.sales_outreach enable row level security;
