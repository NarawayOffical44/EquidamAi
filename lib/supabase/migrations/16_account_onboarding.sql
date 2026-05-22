-- Account onboarding stores lightweight role segmentation and sales qualification.
-- Dashboard access should require onboarding completion, while paid features remain plan-gated.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_role TEXT CHECK (onboarding_role IN ('founder', 'investor_agency')),
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sales_qualification JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
  ON public.users(onboarding_completed);

CREATE INDEX IF NOT EXISTS idx_users_onboarding_role
  ON public.users(onboarding_role);

COMMENT ON COLUMN public.users.onboarding_role IS
'Account onboarding segment. Separate from workspace roles, which remain Admin and Member only.';

COMMENT ON COLUMN public.users.onboarding_data IS
'Raw account onboarding answers used for dashboard personalization and future product flows.';

COMMENT ON COLUMN public.users.sales_qualification IS
'Derived sales/product qualification such as segment, scale band, lead priority, and recommended plan.';
