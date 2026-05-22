/**
 * API Route: Add team member
 * POST /api/team/invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/client';
import { teamMemberAccountEmailTemplate } from '@/lib/email/templates';
import { logger } from '@/lib/utils/logger';
import {
  getAuthenticatedUser,
  getOwnTeamAdminAccess,
  unauthorizedResponse,
} from '@/lib/team/access';
import { countUsedTeamSeats, isReservedTeamSeat, TEAM_SEAT_UPGRADE_LABEL } from '@/lib/team/seat-limits';
import { completeTeamMemberOnboarding, type TeamMemberUser } from '@/lib/team/member-onboarding';
import { isWorkEmail, WORK_EMAIL_ERROR } from '@/lib/utils/work-email';

type ExistingTeamMember = {
  id: string;
  role?: 'owner' | 'member' | null;
  status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  invitation_expires_at: string | null;
};

function displayNameFromEmail(email: string) {
  const localPart = email.split('@')[0] || 'Team member';
  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export async function POST(req: NextRequest) {
  try {
    const { invitedEmail, password } = await req.json().catch(() => ({ invitedEmail: '', password: '' }));
    const email = String(invitedEmail || '').trim().toLowerCase();
    const initialPassword = String(password || '');

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }

    if (!isWorkEmail(email)) {
      return NextResponse.json(
        { error: WORK_EMAIL_ERROR },
        { status: 400 }
      );
    }

    if (initialPassword.length < 8) {
      return NextResponse.json(
        { error: 'Initial password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return unauthorizedResponse();

    if (email === (user.email || '').toLowerCase()) {
      return NextResponse.json(
        { error: 'You are already the workspace Admin' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const access = await getOwnTeamAdminAccess(adminClient, user.id);
    if (!access) {
      return NextResponse.json(
        { error: `Team members are available only on ${TEAM_SEAT_UPGRADE_LABEL} plans` },
        { status: 403 }
      );
    }

    const { data: existingMemberData } = await adminClient
      .from('team_members')
      .select('id, role, status, invitation_expires_at')
      .eq('workspace_id', user.id)
      .eq('email', email)
      .maybeSingle();
    const existingMember = existingMemberData as ExistingTeamMember | null;

    if (existingMember?.status === 'accepted') {
      return NextResponse.json(
        { error: 'This email is already a member of your workspace' },
        { status: 400 }
      );
    }

    const { data: seatRows, error: seatRowsError } = await adminClient
      .from('team_members')
      .select('role, status, invitation_expires_at')
      .eq('workspace_id', user.id);

    if (seatRowsError) {
      return NextResponse.json(
        { error: 'Failed to verify team seat usage' },
        { status: 500 }
      );
    }

    const usedSeats = countUsedTeamSeats(seatRows || []);
    const maxSeats = access.seatLimit;

    if (maxSeats <= 0 || (usedSeats >= maxSeats && !isReservedTeamSeat(existingMember))) {
      return NextResponse.json(
        { error: 'Team seats limit reached' },
        { status: 400 }
      );
    }

    const { data: existingAccount } = await adminClient
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .maybeSingle();

    let memberUser: TeamMemberUser | null = existingAccount
      ? {
          id: existingAccount.id,
          email,
          user_metadata: { full_name: existingAccount.full_name || displayNameFromEmail(email) },
        }
      : null;
    const createdNewAccount = !memberUser;

    if (!memberUser) {
      const fullName = displayNameFromEmail(email);
      const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: initialPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, source: 'team_member' },
      });

      if (createError || !createdUser.user) {
        return NextResponse.json(
          { error: createError?.message || 'Failed to create member login' },
          { status: 400 }
        );
      }

      memberUser = createdUser.user;

      await adminClient.from('user_profiles').upsert({
        id: memberUser.id,
        tier: 'free',
        startup_count: 0,
        max_startups: 1,
        updated_at: new Date().toISOString(),
      });
    }

    await completeTeamMemberOnboarding(adminClient, memberUser);

    const now = new Date().toISOString();
    const memberPayload = {
      workspace_id: user.id,
      user_id: memberUser.id,
      email,
      role: 'member',
      invited_by: user.id,
      status: 'accepted',
      accepted_at: now,
      invitation_token: null,
      invitation_expires_at: null,
      updated_at: now,
    };

    const memberWrite = existingMember
      ? await adminClient
          .from('team_members')
          .update(memberPayload)
          .eq('id', existingMember.id)
      : await adminClient
          .from('team_members')
          .insert(memberPayload);

    if (memberWrite.error) {
      return NextResponse.json(
        { error: 'Failed to add team member' },
        { status: 500 }
      );
    }

    await adminClient
      .from('team_invitations')
      .update({ status: 'accepted', accepted_at: now })
      .eq('workspace_id', user.id)
      .eq('invited_email', email);

    const inviterProfile = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const inviterName = inviterProfile.data?.full_name || 'A teammate';
    const template = teamMemberAccountEmailTemplate({
      inviterName,
      invitedEmail: email,
      isNewAccount: createdNewAccount,
    });

    sendEmail({
      recipients: { to: [email] },
      content: {
        subject: `${inviterName} added you to Evaldam Team`,
        htmlBody: template.html,
        textBody: template.text,
      },
    }).then((result) => {
      if (!result.success) {
        logger.warn('Failed to send team member account email', { invitedEmail: email, error: result.error });
      }
    }).catch((err) => {
      logger.warn('Failed to send team member account email', { invitedEmail: email, error: String(err) });
    });

    return NextResponse.json({
      success: true,
      message: createdNewAccount
        ? 'Team member added. They can sign in with the password you set.'
        : 'Team member added. They can sign in with their existing password.',
      email,
      createdNewAccount,
    });
  } catch (error) {
    console.error('Team member add error:', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}
