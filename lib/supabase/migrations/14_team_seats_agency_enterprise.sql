-- Enable team seats for Business and Enterprise plans.
-- This keeps the existing team_members/team_invitations tables intact and only updates seat entitlement logic.

CREATE OR REPLACE FUNCTION check_team_seats_limit(p_workspace_id UUID)
RETURNS TABLE(current_seats INTEGER, max_seats INTEGER, can_invite BOOLEAN) AS $$
DECLARE
  v_plan TEXT;
  v_tier TEXT;
  v_plan_active BOOLEAN;
  v_enterprise_team_seats INTEGER;
  v_current_seats INTEGER;
  v_max_seats INTEGER := 0;
BEGIN
  SELECT
    LOWER(COALESCE(u.plan, 'free')),
    LOWER(COALESCE(up.tier, 'free')),
    COALESCE(u.plan_active, FALSE),
    u.enterprise_team_seats
  INTO v_plan, v_tier, v_plan_active, v_enterprise_team_seats
  FROM public.users u
  LEFT JOIN public.user_profiles up ON up.id = u.id
  WHERE u.id = p_workspace_id;

  IF NOT COALESCE(v_plan_active, FALSE) THEN
    v_max_seats := 0;
  ELSE
    CASE COALESCE(v_plan, v_tier, 'free')
      WHEN 'plus' THEN v_max_seats := 5;
      WHEN 'business' THEN v_max_seats := 5;
      WHEN 'advisor' THEN v_max_seats := 5;
      WHEN 'agency' THEN v_max_seats := 5;
      WHEN 'enterprise' THEN v_max_seats := GREATEST(COALESCE(v_enterprise_team_seats, 999999), 999999);
      ELSE v_max_seats := 0;
    END CASE;
  END IF;

  -- Pending, non-expired invitations reserve a seat so teams cannot over-invite.
  SELECT COUNT(*) INTO v_current_seats
  FROM public.team_members
  WHERE workspace_id = p_workspace_id
    AND role != 'owner'
    AND (
      status = 'accepted'
      OR (status = 'pending' AND invitation_expires_at > NOW())
    );

  RETURN QUERY SELECT v_current_seats, v_max_seats, (v_current_seats < v_max_seats);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_team_seats_limit(UUID) IS
  'Returns used and available member seats. Business plans get 5 member seats; Enterprise gets unlimited seats. The workspace owner is the Admin and is not counted as a member seat.';

COMMENT ON COLUMN public.team_members.role IS
  'Workspace owner is displayed as Admin. Invited users are members only.';
