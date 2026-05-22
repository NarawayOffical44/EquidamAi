/**
 * API Route: Accept team invitation
 * GET /api/team/accept?code=... - Check invitation details
 * POST /api/team/accept - Accept existing email-link invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { canUseTeamSeats } from '@/lib/team/seat-limits';
import { getAuthenticatedUser, getWorkspaceAccess, unauthorizedResponse } from '@/lib/team/access';
import { completeTeamMemberOnboarding } from '@/lib/team/member-onboarding';

type TeamInvitationRow = {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  invitation_expires_at: string | null;
  workspace_id: string;
  invited_by: string | null;
  user_id: string | null;
  created_at: string | null;
};

function isInvitationExpired(invitation: Pick<TeamInvitationRow, 'status' | 'invitation_expires_at'>) {
  return invitation.status === 'pending'
    && Boolean(invitation.invitation_expires_at)
    && new Date(invitation.invitation_expires_at as string) <= new Date();
}

async function findInvitation(adminClient: SupabaseClient, code: string) {
  const { data, error } = await adminClient
    .from('team_members')
    .select('id, email, status, invitation_expires_at, workspace_id, invited_by, user_id, created_at')
    .eq('invitation_token', code)
    .maybeSingle();

  if (error) throw error;
  return data as TeamInvitationRow | null;
}

export async function GET(req: NextRequest) {
  try {
    const invitationCode = String(req.nextUrl.searchParams.get('code') || '').trim();

    if (!invitationCode) {
      return NextResponse.json(
        { error: 'Invitation code required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const invitation = await findInvitation(adminClient, invitationCode);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    const [ownerResult, inviterResult] = await Promise.all([
      adminClient
        .from('users')
        .select('full_name, email')
        .eq('id', invitation.workspace_id)
        .maybeSingle(),
      invitation.invited_by
        ? adminClient
            .from('users')
            .select('full_name, email')
            .eq('id', invitation.invited_by)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.invitation_expires_at,
        expired: isInvitationExpired(invitation),
        workspaceOwnerName: ownerResult.data?.full_name || null,
        workspaceOwnerEmail: ownerResult.data?.email || null,
        inviterName: inviterResult.data?.full_name || inviterResult.data?.email || null,
      },
    });
  } catch (error) {
    console.error('Invitation lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to check invitation' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { invitationCode } = await req.json().catch(() => ({ invitationCode: '' }));
    const code = String(invitationCode || '').trim();

    if (!code) {
      return NextResponse.json(
        { error: 'Invitation code required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const adminClient = createAdminClient();
    const invitation = await findInvitation(adminClient, code);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation code' },
        { status: 400 }
      );
    }

    if (invitation.status === 'accepted' && invitation.user_id === user.id) {
      await completeTeamMemberOnboarding(adminClient, user);
      return NextResponse.json({
        success: true,
        message: 'Already joined team',
      });
    }

    if (invitation.status !== 'pending' || isInvitationExpired(invitation)) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation code' },
        { status: 400 }
      );
    }

    if (invitation.email.toLowerCase() !== (user.email || '').toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    const workspaceAccess = await getWorkspaceAccess(adminClient, invitation.workspace_id, invitation.workspace_id);
    if (!workspaceAccess || !canUseTeamSeats(workspaceAccess.plan, workspaceAccess.planActive)) {
      return NextResponse.json(
        { error: 'This team workspace is not currently accepting members' },
        { status: 403 }
      );
    }

    const { data, error } = await adminClient.rpc(
      'accept_team_invitation',
      {
        p_code: code,
        p_user_id: user.id,
      }
    );

    if (error || !data[0]?.success) {
      return NextResponse.json(
        { error: data?.[0]?.message || 'Failed to accept invitation' },
        { status: 400 }
      );
    }

    await completeTeamMemberOnboarding(adminClient, user);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined team',
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
