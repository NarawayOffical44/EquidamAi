import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { logger } from "@/lib/utils/logger";

/**
 * Test email endpoint
 * GET /api/test-email?to=email@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const internalToken = process.env.INTERNAL_TEST_EMAIL_TOKEN;
    const providedToken =
      request.headers.get("x-test-email-token") ||
      request.nextUrl.searchParams.get("token");

    if (!internalToken) {
      return NextResponse.json(
        { success: false, message: "Test email endpoint disabled" },
        { status: 403 }
      );
    }

    if (providedToken !== internalToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const toEmail = searchParams.get("to");
    if (!toEmail) {
      return NextResponse.json(
        { success: false, message: "Missing required query parameter: to" },
        { status: 400 }
      );
    }

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
                    Port: ${process.env.BREVO_SMTP_PORT || "2525"}<br/>
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
          - Port: ${process.env.BREVO_SMTP_PORT || "2525"}
          - Status: Connected & Working

          ---
          Sent via Brevo SMTP integration
          Timestamp: ${new Date().toISOString()}
        `,
      },
      replyTo: "support@equidamai.com",
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
            smtp_port: process.env.BREVO_SMTP_PORT || "2525",
            from: process.env.BREVO_FROM_EMAIL || "noreply@equidamai.com",
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
