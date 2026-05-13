import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import { welcomeEmailTemplate } from '@/lib/email/templates';
import { logger } from '@/lib/utils/logger';
import { withLeadAttribution } from '@/lib/leads/attribution';
import { insertLead } from '@/lib/leads/store';

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, planInterest, billingCycle, currency, attribution } = await req.json();

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

    const userId = data.user?.id;
    if (userId) {
      await admin.from('users').upsert({
        id: userId,
        email,
        full_name,
        plan: planInterest === 'plus' ? 'plus' : 'pro',
        plan_active: false,
        billing_cycle: billingCycle === 'monthly' ? 'monthly' : 'annual',
      });

      await admin.from('user_profiles').upsert({
        id: userId,
        tier: 'free',
        startup_count: 0,
        max_startups: 0,
        updated_at: new Date().toISOString(),
      });

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
        email,
        phone: null,
        company_name: full_name,
        website_url: JSON.stringify(leadMetadata),
        metadata: leadMetadata,
        ip_address: req.headers.get('x-forwarded-for') || null,
        country: null,
        city: null,
        isp: null,
        valuation_low: null,
        valuation_mid: null,
        valuation_high: null,
      });
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
    }).then((result) => {
      if (!result.success) {
        logger.warn("Failed to send welcome email", { email, error: result.error });
      }
    }).catch((err) => {
      logger.warn("Failed to send welcome email", { email, error: String(err) });
    });

    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
