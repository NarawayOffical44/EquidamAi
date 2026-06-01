import { sendEmail } from "@/lib/email/client";
import { renderInvoicePdf, type InvoicePdfData } from "@/lib/billing/invoice-pdf";

export async function sendInvoiceEmail(data: InvoicePdfData) {
  const pdfBuffer = await renderInvoicePdf(data);
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: data.currency,
    maximumFractionDigits: 2,
  }).format(data.amountSubunits / 100);

  return sendEmail({
    recipients: { to: [data.customerEmail] },
    content: {
      subject: `Evaldam AI invoice ${data.invoiceNumber}`,
      htmlBody: `
        <h2>Invoice attached</h2>
        <p>Hi ${escapeHtml(data.customerName || "there")},</p>
        <p>Your payment of <strong>${amount}</strong> for <strong>${escapeHtml(data.planName)}</strong> has been confirmed.</p>
        <p>The PDF invoice is attached to this email.</p>
      `,
      textBody: `Invoice attached\n\nYour payment of ${amount} for ${data.planName} has been confirmed.\n\nInvoice: ${data.invoiceNumber}`,
    },
    attachments: [
      {
        filename: `${data.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
