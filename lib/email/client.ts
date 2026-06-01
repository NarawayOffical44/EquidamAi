import nodemailer from "nodemailer";
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

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface SendEmailParams {
  recipients: EmailRecipient;
  content: EmailContent;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

// Create SMTP transporter (cached for efficiency)
let transporter: nodemailer.Transporter | null = null;
let transporterKey = "";

function getTransporter() {
  const smtpHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || "2525", 10);
  const smtpUser = process.env.BREVO_SMTP_USER;
  const smtpPass = process.env.BREVO_SMTP_PASSWORD;
  const nextTransporterKey = `${smtpHost}:${smtpPort}:${smtpUser || ""}`;

  if (transporter && transporterKey === nextTransporterKey) return transporter;

  if (!smtpUser || !smtpPass) {
    logger.warn("Brevo SMTP credentials not configured", {
      hasUser: !!smtpUser,
      hasPass: !!smtpPass,
    });
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      servername: smtpHost,
    },
  });
  transporterKey = nextTransporterKey;

  logger.info("Brevo SMTP transporter initialized", {
    host: smtpHost,
    port: smtpPort,
  });

  return transporter;
}

export async function sendEmail({
  recipients,
  content,
  attachments,
  replyTo = "support@equidamai.com",
}: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      logger.warn("Brevo SMTP not configured");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    const fromEmail = process.env.BREVO_FROM_EMAIL || "noreply@equidamai.com";
    const fromName = process.env.BREVO_FROM_NAME || "Evaldam AI";

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: recipients.to.join(","),
      cc: recipients.cc?.join(","),
      bcc: recipients.bcc?.join(","),
      subject: content.subject,
      html: content.htmlBody,
      text: content.textBody,
      attachments,
      replyTo,
    };

    logger.debug("Sending email via Brevo SMTP", {
      to: recipients.to,
      subject: content.subject,
    });

    const info = await transporter.sendMail(mailOptions);

    logger.info("Email sent successfully via Brevo", {
      to: recipients.to,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.error("Failed to send email via Brevo", error, {
      recipients: recipients.to,
    });
    return {
      success: false,
      error: String(error),
    };
  }
}
