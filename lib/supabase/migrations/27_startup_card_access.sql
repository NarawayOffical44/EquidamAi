-- Enterprise startup-card access for founders/contributors.
-- This is intentionally separate from team_members because team members have
-- workspace-wide access while startup contributors are scoped to one startup.

CREATE TABLE IF NOT EXISTS public.startup_card_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'startup_contributor',
  status TEXT NOT NULL DEFAULT 'accepted',
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT startup_card_access_email_lowercase CHECK (email = LOWER(email)),
  CONSTRAINT startup_card_access_role_check CHECK (role = 'startup_contributor'),
  CONSTRAINT startup_card_access_status_check CHECK (status IN ('accepted', 'revoked')),
  CONSTRAINT startup_card_access_one_user_per_startup UNIQUE (startup_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_startup_card_access_email_unique
  ON public.startup_card_access (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_startup_card_access_user_unique
  ON public.startup_card_access (user_id);

CREATE INDEX IF NOT EXISTS idx_startup_card_access_workspace
  ON public.startup_card_access (workspace_id);

CREATE INDEX IF NOT EXISTS idx_startup_card_access_startup
  ON public.startup_card_access (startup_id);

CREATE INDEX IF NOT EXISTS idx_startup_card_access_status
  ON public.startup_card_access (status);

CREATE OR REPLACE FUNCTION public.touch_startup_card_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_startup_card_access_on_update ON public.startup_card_access;
CREATE TRIGGER touch_startup_card_access_on_update
BEFORE UPDATE ON public.startup_card_access
FOR EACH ROW
EXECUTE FUNCTION public.touch_startup_card_access();

ALTER TABLE public.startup_card_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS startup_card_access_service_role_all ON public.startup_card_access;
CREATE POLICY startup_card_access_service_role_all
  ON public.startup_card_access
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS startup_card_access_participant_select ON public.startup_card_access;
CREATE POLICY startup_card_access_participant_select
  ON public.startup_card_access
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR workspace_id = auth.uid()
  );

DROP POLICY IF EXISTS "Startup card contributors can view assigned startup" ON public.startups;
CREATE POLICY "Startup card contributors can view assigned startup" ON public.startups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.startup_card_access sca
      JOIN public.users owner ON owner.id = sca.workspace_id
      WHERE sca.startup_id = startups.id
        AND sca.user_id = auth.uid()
        AND sca.status = 'accepted'
        AND COALESCE(owner.plan_active, FALSE)
        AND owner.plan = 'enterprise'
    )
  );

COMMENT ON TABLE public.startup_card_access IS
  'Enterprise per-startup contributor access. Contributors are free restricted users linked to exactly one startup card.';
