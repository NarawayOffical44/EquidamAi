/**
 * API Route: Get/manage team members
 * GET /api/team/members - Get all team members
 * DELETE /api/team/members - Remove team member or leave team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  adminOnlyResponse,
  getAuthenticatedUser,
  getOwnTeamAdminAccess,
  getPrimaryWorkspaceAccess,
  getWorkspaceAccess,
  unauthorizedResponse,
} from '@/lib/team/access';
import { countUsedTeamSeats, TEAM_SEAT_UPGRADE_LABEL } from '@/lib/team/seat-limits';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const adminClient = createAdminClient();
    const requestedWorkspaceId = req.nextUrl.searchParams.get('workspaceId');
    const access = requestedWorkspaceId
      ? await getWorkspaceAccess(adminClient, user.id, requestedWorkspaceId)
      : await getPrimaryWorkspaceAccess(adminClient, user.id);
    if (!access || access.seatLimit <= 0) {
      return NextResponse.json(
        { error: `Team management is available on ${TEAM_SEAT_UPGRADE_LABEL} plans` },
        { status: 403 }
      );
    }

    const { data: owner } = await adminClient
      .from('users')
      .select('id, email, full_name, created_at')
      .eq('id', access.workspaceId)
      .single();

    const { data: teamMembers, error } = await adminClient
      .from('team_members')
      .select('id, email, role, status, accepted_at, created_at, user_id, invitation_expires_at')
      .eq('workspace_id', access.workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Team members fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    const currentSeats = countUsedTeamSeats(teamMembers || []);
    const maxSeats = access.seatLimit;
    const ownerMember = owner
      ? [{
          id: `owner-${owner.id}`,
          email: owner.email,
          role: 'owner',
          status: 'accepted',
          accepted_at: owner.created_at || null,
          created_at: owner.created_at || null,
          user_id: owner.id,
        }]
      : [];

    return NextResponse.json({
      success: true,
      workspaceRole: access.role,
      members: [...ownerMember, ...(teamMembers || [])],
      seatsInfo: {
        current: currentSeats,
        max: maxSeats,
        available: Math.max(maxSeats - currentSeats, 0),
      },
    });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: 'Failed to get team members' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: member, error: fetchError } = await adminClient
      .from('team_members')
      .select('workspace_id, user_id')
      .eq('id', memberId)
      .single();

    if (fetchError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const adminAccess = await getOwnTeamAdminAccess(adminClient, user.id);
    const isWorkspaceAdmin = adminAccess?.workspaceId === member.workspace_id;
    const isLeavingOwnSeat = member.user_id === user.id;

    if (!isWorkspaceAdmin && !isLeavingOwnSeat) {
      return adminOnlyResponse('Only the workspace Admin can remove members');
    }

    const { error: updateError } = await adminClient
      .from('team_members')
      .update({ status: 'revoked' })
      .eq('id', memberId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
