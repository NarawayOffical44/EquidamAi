/**
 * Post-payment email lifecycle.
 * Handles all payment-related customer email communications.
 */

import { config } from "@/lib/config";
import { sendEmail } from "./client";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@equidamai.com";

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
  amount: number
) {
  const subject = `Welcome to Evaldam ${plan.toUpperCase()} - Payment Confirmed`;
  const dashboardUrl = appUrl("/dashboard");

  const htmlBody = `
    <h2>Payment Confirmed</h2>
    <p>Hi ${userName},</p>
    <p>Your payment for <strong>Evaldam ${plan}</strong> has been processed successfully.</p>
    <p><strong>Plan Details:</strong></p>
    <ul>
      <li>Plan: ${plan}</li>
      <li>Amount: $${(amount / 100).toFixed(2)}</li>
      <li>Billing Period: Monthly</li>
    </ul>
    <p><a href="${dashboardUrl}">Go to Dashboard</a></p>
    <p>Questions? <a href="${supportMailto()}">Contact Support</a></p>
  `;

  const textBody = `Payment Confirmed\n\nYour payment for Evaldam ${plan} has been processed successfully.\n\nPlan: ${plan}\nAmount: $${(amount / 100).toFixed(2)}\nBilling Period: Monthly\n\nGo to Dashboard: ${dashboardUrl}\n\nQuestions? ${SUPPORT_EMAIL}`;

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
