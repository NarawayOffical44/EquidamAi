CREATE TABLE IF NOT EXISTS email_sequence_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  valuation_mid NUMERIC(15,2),
  day_1_sent_at TIMESTAMP WITH TIME ZONE,
  day_3_scheduled_for TIMESTAMP WITH TIME ZONE,
  day_3_sent_at TIMESTAMP WITH TIME ZONE,
  day_7_scheduled_for TIMESTAMP WITH TIME ZONE,
  day_7_sent_at TIMESTAMP WITH TIME ZONE,
  converted_to_paid_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_sequence_leads_email ON email_sequence_leads(email);
CREATE INDEX IF NOT EXISTS idx_email_sequence_leads_day3 ON email_sequence_leads(day_3_scheduled_for) WHERE day_3_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_sequence_leads_day7 ON email_sequence_leads(day_7_scheduled_for) WHERE day_7_sent_at IS NULL;
