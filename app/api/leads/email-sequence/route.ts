import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import {
  nurtureDayOneEmailTemplate,
  nurtureDayThreeEmailTemplate,
  nurtureDaySevenEmailTemplate,
} from '@/lib/email/templates';
import { logger } from '@/lib/utils/logger';

type SequenceLead = {
  id: string;
  email: string;
  company_name: string;
  valuation_mid: number | null;
};

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';

  const authHeader = req.headers.get('authorization');
  const headerSecret = req.headers.get('x-cron-secret');
  return authHeader === `Bearer ${secret}` || headerSecret === secret;
}

export async function POST(req: NextRequest) {
  try {
    const { email, companyName, valuationMid } = await req.json();

    if (!email || !companyName) {
      return NextResponse.json(
        { error: 'Email and company name required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Store lead in database with sequence tracking
    const now = new Date();
    const dayThreeDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const daySevenDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { error: leadError } = await adminClient
      .from('email_sequence_leads')
      .insert({
        email,
        company_name: companyName,
        valuation_mid: valuationMid || 0,
        day_1_sent_at: now.toISOString(),
        day_3_scheduled_for: dayThreeDate.toISOString(),
        day_7_scheduled_for: daySevenDate.toISOString(),
        day_3_sent_at: null,
        day_7_sent_at: null,
        created_at: now.toISOString(),
      });

    if (leadError) {
      logger.warn('Failed to store lead in database', { email, error: leadError });
      // Continue anyway - send emails even if database fails
    }

    // Send Day 1 email immediately
    const dayOneTemplate = nurtureDayOneEmailTemplate({ companyName });

    sendEmail({
      recipients: { to: [email] },
      content: {
        subject: `${companyName} is valued — but there's more to know`,
        htmlBody: dayOneTemplate.html,
        textBody: dayOneTemplate.text,
      },
    }).catch((err) => {
      logger.warn('Failed to send Day 1 nurture email', { email, error: String(err) });
    });

    // Schedule Day 3 email (send after 3 days)
    // This uses setTimeout for demo - in production use a job queue
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const dayThreeTemplate = nurtureDayThreeEmailTemplate({
          companyName,
          valuationMid: valuationMid || 0,
        });

        sendEmail({
          recipients: { to: [email] },
          content: {
            subject: `How other founders are using ${companyName}'s valuation`,
            htmlBody: dayThreeTemplate.html,
            textBody: dayThreeTemplate.text,
          },
        }).catch((err) => {
          logger.warn('Failed to send Day 3 nurture email', { email, error: String(err) });
        });

        // Update database
        void adminClient
          .from('email_sequence_leads')
          .update({ day_3_sent_at: new Date().toISOString() })
          .eq('email', email)
          .then(({ error }) => {
            if (error) logger.warn('Failed to update lead record', { error });
          });
      }, 3 * 24 * 60 * 60 * 1000); // 3 days

      // Schedule Day 7 email (send after 7 days)
      setTimeout(() => {
        const daySevenTemplate = nurtureDaySevenEmailTemplate({ companyName });

        sendEmail({
          recipients: { to: [email] },
          content: {
            subject: `Special offer for ${companyName} (expires soon)`,
            htmlBody: daySevenTemplate.html,
            textBody: daySevenTemplate.text,
          },
        }).catch((err) => {
          logger.warn('Failed to send Day 7 nurture email', { email, error: String(err) });
        });

        // Update database
        void adminClient
          .from('email_sequence_leads')
          .update({ day_7_sent_at: new Date().toISOString() })
          .eq('email', email)
          .then(({ error }) => {
            if (error) logger.warn('Failed to update lead record', { error });
          });
      }, 7 * 24 * 60 * 60 * 1000); // 7 days
    } else {
      logger.info('Day 3 and Day 7 emails stored for scheduled processing', {
        email,
        day3Date: dayThreeDate.toISOString(),
        day7Date: daySevenDate.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead enrolled in email sequence',
      email,
      sequenceStarted: now.toISOString(),
    });
  } catch (error) {
    logger.error('Email sequence enrollment error', error);
    return NextResponse.json(
      { error: 'Failed to enroll in email sequence', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedCron(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    const [dayThreeResult, daySevenResult] = await Promise.all([
      adminClient
        .from('email_sequence_leads')
        .select('id, email, company_name, valuation_mid')
        .is('day_3_sent_at', null)
        .lte('day_3_scheduled_for', now)
        .eq('converted_to_paid_user', false)
        .limit(50),
      adminClient
        .from('email_sequence_leads')
        .select('id, email, company_name, valuation_mid')
        .is('day_7_sent_at', null)
        .lte('day_7_scheduled_for', now)
        .not('day_3_sent_at', 'is', null)
        .eq('converted_to_paid_user', false)
        .limit(50),
    ]);

    if (dayThreeResult.error) {
      logger.warn('Failed to fetch Day 3 nurture leads', { error: dayThreeResult.error });
    }
    if (daySevenResult.error) {
      logger.warn('Failed to fetch Day 7 nurture leads', { error: daySevenResult.error });
    }

    const dayThreeSent = await sendDayThreeEmails(
      adminClient,
      (dayThreeResult.data || []) as SequenceLead[]
    );
    const daySevenSent = await sendDaySevenEmails(
      adminClient,
      (daySevenResult.data || []) as SequenceLead[]
    );

    return NextResponse.json({
      success: true,
      processed: {
        day3: dayThreeSent,
        day7: daySevenSent,
      },
    });
  } catch (error) {
    logger.error('Email sequence processing error', error);
    return NextResponse.json(
      { error: 'Failed to process email sequence', details: String(error) },
      { status: 500 }
    );
  }
}

async function sendDayThreeEmails(adminClient: ReturnType<typeof createAdminClient>, leads: SequenceLead[]) {
  let sent = 0;

  for (const lead of leads) {
    const template = nurtureDayThreeEmailTemplate({
      companyName: lead.company_name,
      valuationMid: lead.valuation_mid || 0,
    });

    try {
      await sendEmail({
        recipients: { to: [lead.email] },
        content: {
          subject: `How other founders are using ${lead.company_name}'s valuation`,
          htmlBody: template.html,
          textBody: template.text,
        },
      });

      const { error } = await adminClient
        .from('email_sequence_leads')
        .update({ day_3_sent_at: new Date().toISOString() })
        .eq('id', lead.id)
        .is('day_3_sent_at', null);

      if (error) {
        logger.warn('Failed to mark Day 3 nurture email sent', { leadId: lead.id, error });
      } else {
        sent += 1;
      }
    } catch (error) {
      logger.warn('Failed to send Day 3 nurture email', { email: lead.email, error: String(error) });
    }
  }

  return sent;
}

async function sendDaySevenEmails(adminClient: ReturnType<typeof createAdminClient>, leads: SequenceLead[]) {
  let sent = 0;

  for (const lead of leads) {
    const template = nurtureDaySevenEmailTemplate({
      companyName: lead.company_name,
    });

    try {
      await sendEmail({
        recipients: { to: [lead.email] },
        content: {
          subject: `Special offer for ${lead.company_name} (expires soon)`,
          htmlBody: template.html,
          textBody: template.text,
        },
      });

      const { error } = await adminClient
        .from('email_sequence_leads')
        .update({ day_7_sent_at: new Date().toISOString() })
        .eq('id', lead.id)
        .is('day_7_sent_at', null);

      if (error) {
        logger.warn('Failed to mark Day 7 nurture email sent', { leadId: lead.id, error });
      } else {
        sent += 1;
      }
    } catch (error) {
      logger.warn('Failed to send Day 7 nurture email', { email: lead.email, error: String(error) });
    }
  }

  return sent;
}
