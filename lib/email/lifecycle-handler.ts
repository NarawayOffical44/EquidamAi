/**
 * Post-payment email lifecycle.
 * Handles all payment-related customer email communications.
 */

import { config } from "@/lib/config";
import { CUSTOMER_CONTACT_EMAIL, sendEmail } from "./client";

const SUPPORT_EMAIL = CUSTOMER_CONTACT_EMAIL;

function appUrl(path: string) {
  return `${config.app.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function supportMailto() {
  return `mailto:${SUPPORT_EMAIL}`;
}

async function sendLifecycleEmail(params: Parameters<typeof sendEmail>[0]) {
  const result = await sendEmail(params);
  if (!result.success) {
    throw new Error(result.error || "Email send failed");
  }
  return result;
}

export async function sendPaymentSuccessEmail(
  email: string,
  userName: string,
  plan: string,
  amount: number,
  currency = "USD",
  billingPeriod = "Monthly"
) {
  const subject = `Welcome to Evaldam ${plan.toUpperCase()} - Payment Confirmed`;
  const dashboardUrl = appUrl("/dashboard");
  const formattedAmount = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);

  const htmlBody = `
    <h2>Payment Confirmed</h2>
    <p>Hi ${userName},</p>
    <p>Your payment for <strong>Evaldam ${plan}</strong> has been processed successfully.</p>
    <p><strong>Plan Details:</strong></p>
    <ul>
      <li>Plan: ${plan}</li>
      <li>Amount: ${formattedAmount}</li>
      <li>Billing Period: ${billingPeriod}</li>
    </ul>
    <p><a href="${dashboardUrl}">Go to Dashboard</a></p>
    <p>Questions? <a href="${supportMailto()}">Contact Support</a></p>
  `;

  const textBody = `Payment Confirmed\n\nYour payment for Evaldam ${plan} has been processed successfully.\n\nPlan: ${plan}\nAmount: ${formattedAmount}\nBilling Period: ${billingPeriod}\n\nGo to Dashboard: ${dashboardUrl}\n\nQuestions? ${SUPPORT_EMAIL}`;

  await sendLifecycleEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody },
  });
}

export async function sendSubscriptionActivatedEmail(
  email: string,
  userName: string,
  plan: string
) {
  const subject = `Your Evaldam ${plan} Subscription is Active`;
  const startupUrl = appUrl("/startup/new");

  const features = {
    pro: ["1 startup", "Investor-ready reports", "Professional PDFs", "Email support"],
    startup: ["1 startup", "Investor-ready reports", "Professional PDFs", "Email support"],
    plus: ["10 startups", "5 team members", "Advanced analytics", "Agency / investor workflows", "Priority support"],
    agency: ["10 startups", "5 team members", "Advanced analytics", "Agency / investor workflows", "Priority support"],
    enterprise: ["Unlimited startups", "Unlimited team members", "White-label options", "Dedicated support"],
  };

  const planFeatures = features[plan as keyof typeof features] || [];
  const htmlBody = `
    <h2>Subscription Activated</h2>
    <p>Welcome to Evaldam ${plan.toUpperCase()}, ${userName}.</p>
    <p><strong>You now have access to:</strong></p>
    <ul>
      ${planFeatures.map((feature) => `<li>${feature}</li>`).join("")}
    </ul>
    <p><a href="${startupUrl}">Create Your First Valuation</a></p>
  `;

  const textBody = `Subscription Activated\n\nWelcome to Evaldam ${plan}, ${userName}.\n\nYou now have access to:\n${planFeatures.join("\n")}\n\nCreate Your First Valuation: ${startupUrl}`;

  await sendLifecycleEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody },
  });
}

export async function sendRenewalReminderEmail(
  email: string,
  userName: string,
  plan: string,
  renewalDate: string
) {
  const subject = `Your Evaldam ${plan} subscription renews in 7 days`;
  const dashboardUrl = appUrl("/dashboard");

  const htmlBody = `
    <h2>Subscription Renewal Reminder</h2>
    <p>Hi ${userName},</p>
    <p>Your <strong>${plan.toUpperCase()}</strong> subscription will renew on ${renewalDate}.</p>
    <p>If you need to manage your subscription, <a href="${dashboardUrl}">visit your account settings</a>.</p>
  `;

  const textBody = `Subscription Renewal Reminder\n\nYour ${plan} subscription will renew on ${renewalDate}.\n\nManage subscription: ${dashboardUrl}`;

  await sendLifecycleEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody },
  });
}

export async function sendFailedPaymentEmail(
  email: string,
  userName: string,
  plan: string,
  retryUrl: string
) {
  const subject = `Action Required: Payment Failed for Your Evaldam ${plan} Subscription`;

  const htmlBody = `
    <h2>Payment Failed</h2>
    <p>Hi ${userName},</p>
    <p>We tried to charge your ${plan} subscription but the payment failed.</p>
    <p><strong>Please update your payment method:</strong></p>
    <p><a href="${retryUrl}">Retry Payment</a></p>
    <p>Questions? <a href="${supportMailto()}">Contact Support</a></p>
  `;

  const textBody = `Payment Failed\n\nWe tried to charge your ${plan} subscription but the payment failed.\n\nPlease update your payment method: ${retryUrl}\n\nQuestions? ${SUPPORT_EMAIL}`;

  await sendLifecycleEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody },
  });
}

export async function sendPlanUpgradeEmail(
  email: string,
  userName: string,
  oldPlan: string,
  newPlan: string
) {
  const subject = `You've Upgraded to Evaldam ${newPlan.toUpperCase()}!`;
  const dashboardUrl = appUrl("/dashboard");

  const htmlBody = `
    <h2>Welcome to ${newPlan.toUpperCase()}</h2>
    <p>Hi ${userName},</p>
    <p>Your plan has been upgraded from <strong>${oldPlan}</strong> to <strong>${newPlan}</strong>.</p>
    <p>All new features are available immediately.</p>
    <p><a href="${dashboardUrl}">Back to Dashboard</a></p>
  `;

  const textBody = `Plan Upgrade Confirmation\n\nYour plan has been upgraded from ${oldPlan} to ${newPlan}.\n\nAll new features are available immediately.\n\nBack to Dashboard: ${dashboardUrl}`;

  await sendLifecycleEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody },
  });
}

export async function sendSubscriptionCancellationEmail(
  email: string,
  userName: string,
  plan: string,
  options: {
    mode: "period_end" | "immediate";
    accessEndsAt?: string | null;
    dataDeleted?: boolean;
  }
) {
  const isPeriodEnd = options.mode === "period_end";
  const subject = isPeriodEnd
    ? "Your Evaldam AI auto-renewal is cancelled"
    : "Your Evaldam AI subscription has been cancelled";
  const subscriptionUrl = appUrl("/subscription");
  const accessEndLabel = formatDateLabel(options.accessEndsAt);
  const headline = isPeriodEnd ? "Auto-renewal cancelled" : "Subscription cancelled";
  const accessLine = isPeriodEnd
    ? `Your ${plan} plan remains active until ${accessEndLabel || "the end of the current billing period"}.`
    : "Your account is now on the Free plan.";
  const dataLine = options.dataDeleted
    ? "Your workspace data deletion request has also been processed."
    : "Your saved workspace data is still available while your paid access remains active.";

  const htmlBody = `
    <h2>${headline}</h2>
    <p>Hi ${userName || "there"},</p>
    <p>This confirms that your Evaldam AI ${plan} subscription cancellation was processed.</p>
    <p>${accessLine}</p>
    <p>${dataLine}</p>
    <p>You can review your billing status here: <a href="${subscriptionUrl}">Manage subscription</a>.</p>
    <p>Questions? Reply to this email or write to <a href="${supportMailto()}">${SUPPORT_EMAIL}</a>.</p>
  `;

  const textBody = `${headline}

Hi ${userName || "there"},

This confirms that your Evaldam AI ${plan} subscription cancellation was processed.

${accessLine}
${dataLine}

Manage subscription: ${subscriptionUrl}

Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`;

  await sendLifecycleEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody },
  });
}

export async function sendReviewRequestEmail(
  email: string,
  userName: string,
  companyName: string,
  reportUrl?: string
) {
  const subject = "Your Evaldam report - quick question";
  const trustpilotUrl = "https://www.trustpilot.com/review/equidamai.com";
  const safeName = userName || "there";
  const safeCompany = companyName || "startup";
  const reportLine = reportUrl
    ? `<p>You can reopen the report here: <a href="${reportUrl}">View report</a>.</p>`
    : "";
  const reportTextLine = reportUrl ? `\nView report: ${reportUrl}\n` : "";

  const htmlBody = `
    <h2>Quick question</h2>
    <p>Hi ${safeName},</p>
    <p>You downloaded the valuation report for <strong>${safeCompany}</strong>.</p>
    <p>Did it help you prepare for investor conversations?</p>
    <p>If yes, a short review helps other founders find Evaldam AI.</p>
    <p><a href="${trustpilotUrl}">Leave a review</a></p>
    ${reportLine}
    <p>If not, reply and tell us what was missing. We read every response.</p>
  `;

  const textBody = `Quick question

Hi ${safeName},

You downloaded the valuation report for ${safeCompany}.

Did it help you prepare for investor conversations?

If yes, a short review helps other founders find Evaldam AI:
${trustpilotUrl}
${reportTextLine}
If not, reply and tell us what was missing. We read every response.`;

  await sendLifecycleEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody },
  });
}

function formatDateLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
