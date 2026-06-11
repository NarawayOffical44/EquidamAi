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

export const CUSTOMER_CONTACT_EMAIL = "hello@equidamai.com";
const LEGACY_NARAWAY_EMAIL = "info@naraway.com";

function getSenderEmail() {
  const configuredEmail = process.env.EVALDAM_FROM_EMAIL || process.env.BREVO_FROM_EMAIL;
  if (!configuredEmail || configuredEmail.toLowerCase() === LEGACY_NARAWAY_EMAIL) {
    return CUSTOMER_CONTACT_EMAIL;
  }
  return configuredEmail;
}

function sanitizeEmailSubject(subject: string) {
  return subject.replace(/[\r\n]+/g, " ").replace(/[<>]/g, "").trim().slice(0, 180);
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
  if (transporter && transporterKey !== nextTransporterKey) {
    transporter.close();
    transporter = null;
  }

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
  replyTo = CUSTOMER_CONTACT_EMAIL,
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

    const fromEmail = getSenderEmail();
    const fromName = process.env.BREVO_FROM_NAME || "Evaldam AI";

    const safeSubject = sanitizeEmailSubject(content.subject);
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: recipients.to.join(","),
      cc: recipients.cc?.join(","),
      bcc: recipients.bcc?.join(","),
      subject: safeSubject,
      html: content.htmlBody,
      text: content.textBody,
      attachments,
      replyTo,
    };

    logger.debug("Sending email via Brevo SMTP", {
      to: recipients.to,
      subject: safeSubject,
    });

    let info: Awaited<ReturnType<typeof transporter.sendMail>> | null = null;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        info = await transporter.sendMail(mailOptions);
        break;
      } catch (error) {
        lastError = error;
        logger.warn("Email send attempt failed", {
          to: recipients.to,
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
        if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }

    if (!info) throw lastError || new Error("Email send failed");

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
