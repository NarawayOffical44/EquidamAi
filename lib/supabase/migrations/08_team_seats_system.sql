-- Team seats and invitations system for Enterprise plan
-- Allows Enterprise users to invite team members.

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked')),
  invitation_token TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);

-- Team invitations table (for tracking sent invites)
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, invited_email)
);

-- Function to check team seat limit
CREATE OR REPLACE FUNCTION check_team_seats_limit(p_workspace_id UUID)
RETURNS TABLE(current_seats INTEGER, max_seats INTEGER, can_invite BOOLEAN) AS $$
DECLARE
  v_tier TEXT;
  v_current_seats INTEGER;
  v_max_seats INTEGER := 0;
BEGIN
  -- Get user's tier
  SELECT tier INTO v_tier FROM public.user_profiles WHERE id = p_workspace_id;

  -- Determine max seats by tier
  CASE v_tier
    WHEN 'enterprise' THEN v_max_seats := 50;
    ELSE v_max_seats := 0;
  END CASE;

  -- Count accepted team members (excluding owner)
  SELECT COUNT(*) INTO v_current_seats
  FROM public.team_members
  WHERE workspace_id = p_workspace_id
    AND status = 'accepted'
    AND role != 'owner';

  RETURN QUERY SELECT v_current_seats, v_max_seats, (v_current_seats < v_max_seats);
END;
$$ LANGUAGE plpgsql;

-- Function to send team invitation
CREATE OR REPLACE FUNCTION send_team_invitation(
  p_workspace_id UUID,
  p_invited_email TEXT,
  p_invited_by UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, invitation_code TEXT) AS $$
DECLARE
  v_seats_info RECORD;
  v_member_id UUID;
  v_code TEXT;
BEGIN
  -- Check seats limit
  SELECT * INTO v_seats_info FROM check_team_seats_limit(p_workspace_id);

  IF NOT v_seats_info.can_invite THEN
    RETURN QUERY SELECT FALSE, 'Team seats limit reached', NULL::TEXT;
    RETURN;
  END IF;

  -- Generate invitation code
  v_code := substr(md5(random()::text || now()::text), 1, 32);

  -- Create team member record
  INSERT INTO public.team_members (workspace_id, email, invited_by, invitation_token)
  VALUES (p_workspace_id, p_invited_email, p_invited_by, v_code)
  ON CONFLICT (workspace_id, email) DO UPDATE SET
    status = 'pending',
    invitation_token = EXCLUDED.invitation_token,
    invitation_expires_at = NOW() + INTERVAL '7 days'
  RETURNING id INTO v_member_id;

  -- Create invitation record
  INSERT INTO public.team_invitations (
    workspace_id, team_member_id, invited_email, invitation_code, expires_at
  )
  VALUES (p_workspace_id, v_member_id, p_invited_email, v_code, NOW() + INTERVAL '7 days')
  ON CONFLICT (workspace_id, invited_email) DO UPDATE SET
    invitation_code = EXCLUDED.invitation_code,
    expires_at = NOW() + INTERVAL '7 days',
    status = 'sent';

  RETURN QUERY SELECT TRUE, 'Invitation sent successfully', v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to accept invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(p_code TEXT, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_workspace_id UUID;
  v_member_id UUID;
BEGIN
  -- Find member by invitation code
  SELECT workspace_id, id INTO v_workspace_id, v_member_id
  FROM public.team_members
  WHERE invitation_token = p_code
    AND status = 'pending'
    AND invitation_expires_at > NOW();

  IF v_member_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired invitation code';
    RETURN;
  END IF;

  -- Update team member with user
  UPDATE public.team_members
  SET
    user_id = p_user_id,
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = v_member_id;

  -- Update invitation
  UPDATE public.team_invitations
  SET
    status = 'accepted',
    accepted_at = NOW()
  WHERE team_member_id = v_member_id;

  RETURN QUERY SELECT TRUE, 'Invitation accepted successfully';
END;
$$ LANGUAGE plpgsql;

-- RLS Policy: Users can see team members in their workspace
CREATE POLICY "View team members" ON public.team_members
  FOR SELECT USING (
    workspace_id = auth.uid() OR
    user_id = auth.uid()
  );

-- RLS Policy: Only workspace owner can manage team
CREATE POLICY "Manage team members" ON public.team_members
  FOR INSERT WITH CHECK (invited_by = auth.uid());

-- RLS Policy: Can revoke own membership
CREATE POLICY "Revoke team membership" ON public.team_members
  FOR UPDATE USING (
    workspace_id = auth.uid() OR
    user_id = auth.uid()
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_workspace ON public.team_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_workspace ON public.team_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_code ON public.team_invitations(invitation_code);
