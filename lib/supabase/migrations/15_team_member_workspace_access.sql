-- Workspace access for the two-role team model:
-- Admin = workspace owner/main account. Member = invited teammate.
-- Members can access existing workspace data, while critical mutations remain owner/admin-only in API code.

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own startups" ON public.startups;
CREATE POLICY "Users can view own startups" ON public.startups
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_public = true
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.users owner ON owner.id = tm.workspace_id
      WHERE tm.workspace_id = startups.user_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
        AND COALESCE(owner.plan_active, FALSE)
        AND owner.plan IN ('plus', 'advisor', 'agency', 'enterprise')
    )
  );

DROP POLICY IF EXISTS "Users can update own startups" ON public.startups;
CREATE POLICY "Users can update own startups" ON public.startups
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.users owner ON owner.id = tm.workspace_id
      WHERE tm.workspace_id = startups.user_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
        AND COALESCE(owner.plan_active, FALSE)
        AND owner.plan IN ('plus', 'advisor', 'agency', 'enterprise')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.users owner ON owner.id = tm.workspace_id
      WHERE tm.workspace_id = startups.user_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
        AND COALESCE(owner.plan_active, FALSE)
        AND owner.plan IN ('plus', 'advisor', 'agency', 'enterprise')
    )
  );

DROP POLICY IF EXISTS "Users can view own valuations" ON public.valuations;
CREATE POLICY "Users can view own valuations" ON public.valuations
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.users owner ON owner.id = tm.workspace_id
      WHERE tm.workspace_id = valuations.user_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
        AND COALESCE(owner.plan_active, FALSE)
        AND owner.plan IN ('plus', 'advisor', 'agency', 'enterprise')
    )
  );

DROP POLICY IF EXISTS "Users can view own valuation methods" ON public.valuation_methods;
CREATE POLICY "Users can view own valuation methods" ON public.valuation_methods
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.valuations v
      WHERE v.id = valuation_methods.valuation_id
        AND (
          v.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.team_members tm
            JOIN public.users owner ON owner.id = tm.workspace_id
            WHERE tm.workspace_id = v.user_id
              AND tm.user_id = auth.uid()
              AND tm.status = 'accepted'
              AND COALESCE(owner.plan_active, FALSE)
              AND owner.plan IN ('plus', 'advisor', 'agency', 'enterprise')
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_public = true
    OR share_token IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.users owner ON owner.id = tm.workspace_id
      WHERE tm.workspace_id = reports.user_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
        AND COALESCE(owner.plan_active, FALSE)
        AND owner.plan IN ('plus', 'advisor', 'agency', 'enterprise')
    )
  );

DROP POLICY IF EXISTS "Users can view own history" ON public.valuation_history;
CREATE POLICY "Users can view own history" ON public.valuation_history
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.users owner ON owner.id = tm.workspace_id
      WHERE tm.workspace_id = valuation_history.user_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
        AND COALESCE(owner.plan_active, FALSE)
        AND owner.plan IN ('plus', 'advisor', 'agency', 'enterprise')
    )
  );

DROP POLICY IF EXISTS "Users see own valuation evidence" ON public.valuation_evidence;
CREATE POLICY "Users see own valuation evidence"
  ON public.valuation_evidence FOR SELECT
  USING (
    valuation_id IN (
      SELECT v.id
      FROM public.valuations v
      WHERE v.user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.team_members tm
          JOIN public.users owner ON owner.id = tm.workspace_id
          WHERE tm.workspace_id = v.user_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'accepted'
            AND COALESCE(owner.plan_active, FALSE)
            AND owner.plan IN ('plus', 'advisor', 'agency', 'enterprise')
        )
    )
  );

DROP POLICY IF EXISTS "Users see own report data" ON public.report_data;
CREATE POLICY "Users see own report data"
  ON public.report_data FOR SELECT
  USING (
    valuation_id IN (
      SELECT v.id
      FROM public.valuations v
      WHERE v.user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.team_members tm
          JOIN public.users owner ON owner.id = tm.workspace_id
          WHERE tm.workspace_id = v.user_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'accepted'
            AND COALESCE(owner.plan_active, FALSE)
            AND owner.plan IN ('plus', 'advisor', 'agency', 'enterprise')
        )
    )
  );
