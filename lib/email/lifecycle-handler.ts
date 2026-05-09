/**
 * Post-Payment Email Lifecycle
 * Handles all payment-related email communications
 */

import { sendEmail } from "./client";

export async function sendPaymentSuccessEmail(
  email: string,
  userName: string,
  plan: string,
  amount: number
) {
  const subject = `Welcome to Evaldam ${plan.toUpperCase()} - Payment Confirmed`;

  const htmlBody = `
    <h2>Payment Confirmed!</h2>
    <p>Hi ${userName},</p>
    <p>Your payment for <strong>Evaldam ${plan}</strong> has been processed successfully.</p>
    <p><strong>Plan Details:</strong></p>
    <ul>
      <li>Plan: ${plan}</li>
      <li>Amount: $${(amount / 100).toFixed(2)}</li>
      <li>Billing Period: Monthly</li>
    </ul>
    <p><a href="https://equidamai.com/app/dashboard">Go to Dashboard →</a></p>
    <p>Questions? <a href="mailto:support@equidamai.com">Contact Support</a></p>
  `;

  const textBody = `Payment Confirmed!\n\nYour payment for Evaldam ${plan} has been processed successfully.\n\nPlan: ${plan}\nAmount: $${(amount / 100).toFixed(2)}\nBilling Period: Monthly\n\nGo to Dashboard: https://equidamai.com/app/dashboard`;

  await sendEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody }
  });
}

export async function sendSubscriptionActivatedEmail(
  email: string,
  userName: string,
  plan: string
) {
  const subject = `Your Evaldam ${plan} Subscription is Active`;

  const features = {
    pro: ["3 startups", "Unlimited reports", "Professional PDFs", "Email support"],
    plus: ["15 startups", "Advanced analytics", "Team collaboration", "Priority support"],
    enterprise: ["Unlimited startups", "Custom features", "Dedicated support"]
  };

  const htmlBody = `
    <h2>Subscription Activated</h2>
    <p>Welcome to Evaldam ${plan.toUpperCase()}, ${userName}!</p>
    <p><strong>You now have access to:</strong></p>
    <ul>
      ${(features[plan as keyof typeof features] || []).map(f => `<li>${f}</li>`).join('')}
    </ul>
    <p><a href="https://equidamai.com/app/startup/new">Create Your First Valuation →</a></p>
  `;

  const textBody = `Subscription Activated\n\nWelcome to Evaldam ${plan}, ${userName}!\n\nYou now have access to:\n${(features[plan as keyof typeof features] || []).join('\n')}\n\nCreate Your First Valuation: https://equidamai.com/app/startup/new`;

  await sendEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody }
  });
}

export async function sendRenewalReminderEmail(
  email: string,
  userName: string,
  plan: string,
  renewalDate: string
) {
  const subject = `Your Evaldam ${plan} subscription renews in 7 days`;

  const htmlBody = `
    <h2>Subscription Renewal Reminder</h2>
    <p>Hi ${userName},</p>
    <p>Your <strong>${plan.toUpperCase()}</strong> subscription will renew on ${renewalDate}.</p>
    <p>If you need to manage your subscription, <a href="https://equidamai.com/app/dashboard/settings">visit your account settings →</a></p>
  `;

  const textBody = `Subscription Renewal Reminder\n\nYour ${plan} subscription will renew on ${renewalDate}.\n\nManage subscription: https://equidamai.com/app/dashboard/settings`;

  await sendEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody }
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
    <p><a href="${retryUrl}">Retry Payment →</a></p>
    <p>Questions? <a href="mailto:support@equidamai.com">Contact Support</a></p>
  `;

  const textBody = `Payment Failed\n\nWe tried to charge your ${plan} subscription but the payment failed.\n\nPlease update your payment method: ${retryUrl}\n\nQuestions? support@equidamai.com`;

  await sendEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody }
  });
}

export async function sendPlanUpgradeEmail(
  email: string,
  userName: string,
  oldPlan: string,
  newPlan: string
) {
  const subject = `You've Upgraded to Evaldam ${newPlan.toUpperCase()}!`;

  const htmlBody = `
    <h2>Welcome to ${newPlan.toUpperCase()}</h2>
    <p>Hi ${userName},</p>
    <p>Your plan has been upgraded from <strong>${oldPlan}</strong> to <strong>${newPlan}</strong>.</p>
    <p>All new features are available immediately.</p>
    <p><a href="https://equidamai.com/app/dashboard">Back to Dashboard →</a></p>
  `;

  const textBody = `Plan Upgrade Confirmation\n\nYour plan has been upgraded from ${oldPlan} to ${newPlan}.\n\nAll new features are available immediately.\n\nBack to Dashboard: https://equidamai.com/app/dashboard`;

  await sendEmail({
    recipients: { to: [email] },
    content: { subject, htmlBody, textBody }
  });
}
