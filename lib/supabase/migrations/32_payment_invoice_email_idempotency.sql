-- Avoid sending the same payment invoice email more than once.

CREATE TABLE IF NOT EXISTS public.payment_invoice_emails (
  payment_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'sent', 'failed')),
  invoice_number TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_invoice_emails_email
  ON public.payment_invoice_emails(email);
