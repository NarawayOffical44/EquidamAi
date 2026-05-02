/**
 * API Route: Accept team invitation
 * POST /api/team/accept
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
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

    // Parse request
    const { invitationCode } = await req.json();

    if (!invitationCode) {
      return NextResponse.json(
        { error: 'Invitation code required' },
        { status: 400 }
      );
    }

    // Accept invitation via RPC
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc(
      'accept_team_invitation',
      {
        p_code: invitationCode,
        p_user_id: user.id,
      }
    );

    if (error || !data[0]?.success) {
      return NextResponse.json(
        { error: data?.[0]?.message || 'Failed to accept invitation' },
        { status: 400 }
      );
    }

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
