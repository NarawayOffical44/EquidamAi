/**
 * API Route: Send team invitation
 * POST /api/team/invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/client';
import { teamInvitationEmailTemplate } from '@/lib/email/templates';
import { logger } from '@/lib/utils/logger';

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
    const { invitedEmail } = await req.json();

    if (!invitedEmail || !invitedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }

    // Check user's plan (only active Enterprise can invite)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('plan, plan_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Could not verify your plan' },
        { status: 400 }
      );
    }

    if (profile.plan !== 'enterprise' || !profile.plan_active) {
      return NextResponse.json(
        { error: 'Team invitations are available only on Enterprise plans' },
        { status: 403 }
      );
    }

    // Send invitation via RPC
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc(
      'send_team_invitation',
      {
        p_workspace_id: user.id,
        p_invited_email: invitedEmail,
        p_invited_by: user.id,
      }
    );

    if (error || !data[0]?.success) {
      return NextResponse.json(
        { error: data?.[0]?.message || 'Failed to send invitation' },
        { status: 400 }
      );
    }

    // Send email invitation with code
    const invitationCode = data[0].invitation_code;
    const inviterProfile = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const inviterName = inviterProfile.data?.full_name || 'A teammate';

    const template = teamInvitationEmailTemplate({
      inviterName,
      invitedEmail,
      invitationCode,
      expiresIn: '7 days',
    });

    sendEmail({
      recipients: { to: [invitedEmail] },
      content: {
        subject: `${inviterName} invited you to Evaldam Team`,
        htmlBody: template.html,
        textBody: template.text,
      },
    }).then((result) => {
      if (!result.success) {
        logger.warn('Failed to send team invitation email', { invitedEmail, error: result.error });
      }
    }).catch((err) => {
      logger.warn('Failed to send team invitation email', { invitedEmail, error: String(err) });
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      email: invitedEmail,
      expiresIn: '7 days',
    });
  } catch (error) {
    console.error('Team invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
