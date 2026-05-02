/**
 * API Route: Get/manage team members
 * GET /api/team/members - Get all team members
 * DELETE /api/team/members - Remove team member or leave team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get team members (user is either owner or member)
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('id, email, role, status, accepted_at, created_at')
      .or(`workspace_id.eq.${user.id},user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Team members fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Get team seats info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const maxSeats = profile?.tier === 'plus' ? 3 : profile?.tier === 'enterprise' ? 50 : 0;
    const currentSeats = teamMembers?.filter(m => m.status === 'accepted' && m.role !== 'owner').length || 0;

    return NextResponse.json({
      success: true,
      members: teamMembers || [],
      seatsInfo: {
        current: currentSeats,
        max: maxSeats,
        available: maxSeats - currentSeats,
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID required' },
        { status: 400 }
      );
    }

    // Get member to check permissions
    const { data: member, error: fetchError } = await supabase
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

    // Check if user is owner or the member themselves
    if (member.workspace_id !== user.id && member.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Revoke/remove member
    const { error: updateError } = await supabase
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
