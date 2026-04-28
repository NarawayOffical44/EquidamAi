import { logger } from "@/lib/utils/logger";

interface EmailRecipient {
  to: string[];
  cc?: string[];
  bcc?: string[];
}

interface EmailContent {
  subject: string;
  htmlBody: string;
  textBody: string;
}

interface SendEmailParams {
  recipients: EmailRecipient;
  content: EmailContent;
  replyTo?: string;
}

export async function sendEmail({
  recipients,
  content,
  replyTo = "support@evaldam.ai",
}: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const apiKey = process.env.ELASTIC_EMAIL_API_KEY;
    const fromEmail = process.env.ELASTIC_EMAIL_FROM;
    const fromName = process.env.ELASTIC_EMAIL_FROM_NAME;

    if (!apiKey || !fromEmail || !fromName) {
      logger.warn("Elastic Email credentials not configured", {
        hasApiKey: !!apiKey,
        hasFromEmail: !!fromEmail,
        hasFromName: !!fromName,
      });
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    const payload = {
      Recipients: {
        To: recipients.to,
        ...(recipients.cc && { Cc: recipients.cc }),
        ...(recipients.bcc && { Bcc: recipients.bcc }),
      },
      Content: {
        From: fromEmail,
        FromName: fromName,
        ReplyTo: replyTo,
        Subject: content.subject,
        Body: [
          {
            ContentType: "HTML",
            Content: content.htmlBody,
          },
          {
            ContentType: "PlainText",
            Content: content.textBody,
          },
        ],
      },
    };

    logger.debug("Sending email via Elastic Email", {
      to: recipients.to,
      subject: content.subject,
    });

    const response = await fetch(
      "https://api.elasticemail.com/v4/emails/transactional",
      {
        method: "POST",
        headers: {
          "X-ElasticEmail-ApiKey": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("Elastic Email API error", errorData, {
        status: response.status,
        to: recipients.to,
      });
      return {
        success: false,
        error: `Email sending failed: ${response.status}`,
      };
    }

    const data = await response.json();
    logger.info("Email sent successfully", {
      to: recipients.to,
      messageId: data.MessageId,
    });

    return {
      success: true,
      messageId: data.MessageId,
    };
  } catch (error) {
    logger.error("Failed to send email", error, {
      recipients: recipients.to,
    });
    return {
      success: false,
      error: String(error),
    };
  }
}
