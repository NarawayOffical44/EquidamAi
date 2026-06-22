import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { sendSms } from "@/lib/twilio/client";
import { config } from "@/lib/config";

export interface SalesOutreach {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  plan_interest: string | null;
  country: string | null;
  status: "active" | "converted" | "opted_out" | "completed";
  call_attempted_at: string | null;
  call_sid: string | null;
  call_outcome: string | null;
  day1_sent_at: string | null;
  day3_sent_at: string | null;
  day7_sent_at: string | null;
  converted_at: string | null;
  created_at: string;
}

export async function createSalesOutreach(params: {
  userId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  planInterest?: string | null;
  country?: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sales_outreach")
    .insert({
      user_id: params.userId,
      email: params.email,
      full_name: params.fullName,
      phone: params.phone || null,
      plan_interest: params.planInterest || null,
      country: params.country || null,
      status: "active",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function markCallAttempted(id: string, sid: string, outcome: string) {
  const admin = createAdminClient();
  await admin
    .from("sales_outreach")
    .update({ call_attempted_at: new Date().toISOString(), call_sid: sid, call_outcome: outcome })
    .eq("id", id);
}

export async function markDaySent(id: string, day: 1 | 3 | 7) {
  const admin = createAdminClient();
  const field = `day${day}_sent_at` as const;
  await admin
    .from("sales_outreach")
    .update({ [field]: new Date().toISOString() })
    .eq("id", id);
}

export async function markConverted(userId: string) {
  const admin = createAdminClient();
  await admin
    .from("sales_outreach")
    .update({ status: "converted", converted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active");
}

function appUrl(path: string) {
  return `${config.app.siteUrl}${path}`;
}

export async function sendDay1(outreach: SalesOutreach) {
  const name = outreach.full_name?.split(" ")[0] || "there";
  const dashboardUrl = appUrl("/dashboard");

  await sendEmail({
    recipients: { to: [outreach.email] },
    content: {
      subject: `${name}, your Evaldam valuation is ready to run`,
      htmlBody: `
        <p>Hi ${name},</p>
        <p>You signed up yesterday — wanted to make sure you got started.</p>
        <p>The fastest way to get value from Evaldam: add your startup and run the valuation. It takes about 3 minutes and gives you a defensible pre-money range across six methods.</p>
        <p><a href="${dashboardUrl}">Go to your dashboard →</a></p>
        <p>If you hit any questions or want to talk through your raise, reply to this email. I read every one.</p>
        <p>— Evaldam team</p>
      `,
      textBody: `Hi ${name},\n\nYou signed up yesterday — wanted to make sure you got started.\n\nAdd your startup and run the valuation. It takes about 3 minutes.\n\nDashboard: ${dashboardUrl}\n\nQuestions? Reply to this email.\n\n— Evaldam team`,
    },
  });

  if (outreach.phone) {
    await sendSms(
      outreach.phone,
      `Hi ${name}, this is Evaldam. Your free valuation is ready — takes 3 min: ${dashboardUrl}`
    );
  }

  await markDaySent(outreach.id, 1);
}

export async function sendDay3(outreach: SalesOutreach) {
  const name = outreach.full_name?.split(" ")[0] || "there";
  const pricingUrl = appUrl("/pricing");

  await sendEmail({
    recipients: { to: [outreach.email] },
    content: {
      subject: `The one thing founders wish they had before their first investor call`,
      htmlBody: `
        <p>Hi ${name},</p>
        <p>The most common thing we hear from founders after their first investor meeting: "I wish I'd had a number I could explain."</p>
        <p>That's exactly what Evaldam gives you — a low-mid-high range built on Scorecard, Berkus, VC Method, and DCF. Six methods, one defensible range, every assumption documented.</p>
        <p>If you haven't run your valuation yet, now is the right time — before your next conversation.</p>
        <p><a href="${pricingUrl}">See what's included →</a></p>
        <p>— Evaldam team</p>
      `,
      textBody: `Hi ${name},\n\nThe most common thing we hear from founders: "I wish I'd had a number I could explain."\n\nEvaldam gives you a defensible range built on six methods — every assumption documented.\n\nSee plans: ${pricingUrl}\n\n— Evaldam team`,
    },
  });

  if (outreach.phone) {
    await sendSms(
      outreach.phone,
      `Hi ${name} — Evaldam here. Have you run your valuation yet? Reply YES if you want us to walk you through it.`
    );
  }

  await markDaySent(outreach.id, 3);
}

export async function sendDay7(outreach: SalesOutreach) {
  const name = outreach.full_name?.split(" ")[0] || "there";
  const pricingUrl = appUrl("/pricing");

  await sendEmail({
    recipients: { to: [outreach.email] },
    content: {
      subject: `Last note — worth 2 minutes before your next investor conversation`,
      htmlBody: `
        <p>Hi ${name},</p>
        <p>Quick check-in — you signed up a week ago but haven't run a valuation yet.</p>
        <p>If the timing isn't right, no problem. But if you're preparing for a raise in the next 3–6 months, this is the tool that saves you from going into that first call with a number you can't defend.</p>
        <p>Evaldam generates a shareable PDF report with method breakdown, comparables, sensitivity analysis, and assumptions. Investors read it before the meeting. It changes the conversation.</p>
        <p><a href="${pricingUrl}">Start free →</a></p>
        <p>If there's a specific question about your raise or valuation, reply here. Happy to help.</p>
        <p>— Evaldam team</p>
      `,
      textBody: `Hi ${name},\n\nQuick check-in — you signed up a week ago but haven't run a valuation yet.\n\nIf you're raising in the next 3–6 months, this is the tool that stops you going in with a number you can't defend.\n\nStart free: ${pricingUrl}\n\n— Evaldam team`,
    },
  });

  if (outreach.phone) {
    await sendSms(
      outreach.phone,
      `Hi ${name} — last message from Evaldam. If you're raising soon, your valuation report could be the thing that changes the first meeting. ${pricingUrl}`
    );
  }

  await markDaySent(outreach.id, 7);
}
