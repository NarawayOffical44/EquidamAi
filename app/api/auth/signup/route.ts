import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import { welcomeEmailTemplate } from '@/lib/email/templates';
import { logger } from '@/lib/utils/logger';
import { withLeadAttribution } from '@/lib/leads/attribution';
import { insertLead } from '@/lib/leads/store';
import { toLegacyBillingPlan } from '@/lib/plans/plan-limits';
import { trackServerEvent } from '@/lib/analytics/server-ga4';

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, planInterest, billingCycle, currency, attribution } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = createAdminClient();
    const billingPlan = toLegacyBillingPlan(planInterest) || 'pro';

    // Create user with email already confirmed — no confirmation email sent
    const { data, error } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
    }

    if (userId) {
      const { error: accountError } = await admin.from('users').upsert({
        id: userId,
        email: normalizedEmail,
        full_name,
        plan: billingPlan,
        plan_active: false,
        billing_cycle: billingCycle === 'monthly' ? 'monthly' : 'annual',
        onboarding_completed: false,
        onboarding_data: {},
        sales_qualification: {},
      });

      if (accountError) {
        await rollbackCreatedUser(admin, userId, normalizedEmail, accountError);
        return NextResponse.json({ error: 'Could not create account profile' }, { status: 500 });
      }

      const { error: profileError } = await admin.from('user_profiles').upsert({
        id: userId,
        tier: 'free',
        startup_count: 0,
        max_startups: 1,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        await rollbackCreatedUser(admin, userId, normalizedEmail, profileError);
        return NextResponse.json({ error: 'Could not create account profile' }, { status: 500 });
      }

      const leadMetadata = withLeadAttribution(req, {
        fullName: full_name,
        source: 'account_signup',
        type: 'account_signup',
        plan: planInterest || null,
        billingCycle: billingCycle || null,
        currency: currency || null,
        useCase: 'Account created before subscription activation',
      }, attribution);

      await insertLead(admin, {
        email: normalizedEmail,
        phone: null,
        company_name: full_name,
        website_url: null,
        metadata: leadMetadata,
        ip_address: req.headers.get('x-forwarded-for') || null,
        country: null,
        city: null,
        isp: null,
        valuation_low: null,
        valuation_mid: null,
        valuation_high: null,
      });

      trackServerEvent('sign_up', {
        method: 'email',
        plan: billingPlan,
        billing_cycle: billingCycle === 'monthly' ? 'monthly' : 'annual',
        currency: currency || null,
      }, userId).catch((err) => {
        logger.warn('Failed to track signup server event', { email: normalizedEmail, error: String(err) });
      });
    }

    // Send welcome email (non-blocking)
    const template = welcomeEmailTemplate({
      fullName: full_name,
      email: normalizedEmail,
    });

    sendEmail({
      recipients: { to: [normalizedEmail] },
      content: {
        subject: "Welcome to Evaldam AI — Let's Value Your Startup",
        htmlBody: template.html,
        textBody: template.text,
      },
    }).then((result) => {
      if (!result.success) {
        logger.warn("Failed to send welcome email", { email: normalizedEmail, error: result.error });
      }
    }).catch((err) => {
      logger.warn("Failed to send welcome email", { email: normalizedEmail, error: String(err) });
    });

    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}

async function rollbackCreatedUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  reason: unknown
) {
  logger.error('Signup profile creation failed; rolling back auth user', { email, userId, reason });
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    logger.warn('Failed to roll back auth user after signup profile failure', { email, userId, error });
  }
}
