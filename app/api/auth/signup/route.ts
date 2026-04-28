import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import { welcomeEmailTemplate } from '@/lib/email/templates';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Create user with email already confirmed — no confirmation email sent
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Send welcome email (non-blocking)
    const template = welcomeEmailTemplate({
      fullName: full_name,
      email,
    });

    sendEmail({
      recipients: { to: [email] },
      content: {
        subject: "Welcome to Evaldam AI — Let's Value Your Startup",
        htmlBody: template.html,
        textBody: template.text,
      },
    }).catch((err) => {
      logger.warn("Failed to send welcome email", { email, error: String(err) });
    });

    return NextResponse.json({ user: data.user });
  } catch (err) {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
