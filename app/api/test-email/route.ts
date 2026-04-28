import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { logger } from "@/lib/utils/logger";

/**
 * Test email endpoint
 * GET /api/test-email?to=email@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const toEmail = searchParams.get("to") || "aajmarketa@gmail.com";

    logger.info("Testing Brevo SMTP email", { to: toEmail });

    const result = await sendEmail({
      recipients: {
        to: [toEmail],
      },
      content: {
        subject: "✅ Evaldam SMTP Test - Email is Working!",
        htmlBody: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff006e;">✅ Evaldam SMTP Test</h2>
                <p>Hi there! 👋</p>
                <p>This is a test email from Evaldam's Brevo SMTP integration.</p>
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>If you received this, email sending is working correctly! ✅</strong></p>
                  <p style="margin: 10px 0; font-size: 12px; color: #666;">
                    <strong>SMTP Details:</strong><br/>
                    Host: smtp-relay.brevo.com<br/>
                    Port: 587<br/>
                    Status: ✅ Connected & Working
                  </p>
                </div>
                <p style="color: #666; font-size: 12px;">
                  Sent via Brevo SMTP integration<br/>
                  Timestamp: ${new Date().toISOString()}
                </p>
              </div>
            </body>
          </html>
        `,
        textBody: `
          Evaldam SMTP Test - Email is Working!

          Hi there!

          This is a test email from Evaldam's Brevo SMTP integration.

          If you received this, email sending is working correctly! ✅

          SMTP Details:
          - Host: smtp-relay.brevo.com
          - Port: 587
          - Status: Connected & Working

          ---
          Sent via Brevo SMTP integration
          Timestamp: ${new Date().toISOString()}
        `,
      },
      replyTo: "support@evaldam.ai",
    });

    if (result.success) {
      logger.info("Test email sent successfully", {
        to: toEmail,
        messageId: result.messageId,
      });

      return NextResponse.json(
        {
          success: true,
          message: "✅ Test email sent successfully!",
          to: toEmail,
          messageId: result.messageId,
          details: {
            smtp_host: "smtp-relay.brevo.com",
            smtp_port: 587,
            from: "noreply@evaldam.ai",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    } else {
      logger.error("Test email failed", {
        to: toEmail,
        error: result.error,
      });

      return NextResponse.json(
        {
          success: false,
          message: "❌ Failed to send test email",
          error: result.error,
          to: toEmail,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Test email endpoint error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error testing email",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
