/**
 * Test SMTP email sending
 * Run with: npx ts-node lib/email/test-smtp.ts
 */

import { sendEmail } from "./client";

async function testEmail() {
  console.log("🧪 Testing Brevo SMTP email sending...\n");

  const result = await sendEmail({
    recipients: {
      to: ["aajmarketa@gmail.com"],
    },
    content: {
      subject: "✅ Evaldam SMTP Test - Email is Working!",
      htmlBody: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #ff006e;">Evaldam SMTP Test</h2>
            <p>Hi there! 👋</p>
            <p>This is a test email from Evaldam's Brevo SMTP integration.</p>
            <p><strong>If you received this, email sending is working correctly! ✅</strong></p>
            <hr />
            <p style="font-size: 12px; color: #999;">
              Sent via Brevo SMTP (smtp-relay.brevo.com:587)<br/>
              This is an automated test email.
            </p>
          </body>
        </html>
      `,
      textBody: `
        Evaldam SMTP Test

        Hi there!

        This is a test email from Evaldam's Brevo SMTP integration.

        If you received this, email sending is working correctly! ✅

        ---
        Sent via Brevo SMTP (smtp-relay.brevo.com:587)
        This is an automated test email.
      `,
    },
    replyTo: "support@evaldam.ai",
  });

  if (result.success) {
    console.log("✅ Email sent successfully!");
    console.log(`Message ID: ${result.messageId}`);
  } else {
    console.log("❌ Email sending failed!");
    console.log(`Error: ${result.error}`);
  }
}

testEmail();
