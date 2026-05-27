-- Allow Agency / Investor workspaces to share one startup card with a restricted startup contact.

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
        AND LOWER(COALESCE(owner.plan, '')) IN ('agency', 'investor', 'plus', 'business', 'advisor', 'enterprise')
    )
  );

COMMENT ON TABLE public.startup_card_access IS
  'Agency / Investor and Enterprise per-startup contributor access. Contributors are restricted users linked to exactly one startup card.';
