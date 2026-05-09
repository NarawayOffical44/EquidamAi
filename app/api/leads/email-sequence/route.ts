import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import {
  nurtureDayOneEmailTemplate,
  nurtureDayThreeEmailTemplate,
  nurtureDaySevenEmailTemplate,
} from '@/lib/email/templates';
import { logger } from '@/lib/utils/logger';

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

    const { data: leadData, error: leadError } = await adminClient
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
      // In production, you should use a job queue like Bull, RabbitMQ, or AWS SQS
      // For now, we'll just log that these should be scheduled
      logger.info('Day 3 and Day 7 emails scheduled (use job queue in production)', {
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
