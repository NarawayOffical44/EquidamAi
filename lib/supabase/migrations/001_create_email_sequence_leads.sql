-- Create email sequence leads table for tracking free valuation nurture emails
CREATE TABLE IF NOT EXISTS public.email_sequence_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  valuation_mid DECIMAL(15, 2),
  day_1_sent_at TIMESTAMP WITH TIME ZONE,
  day_3_scheduled_for TIMESTAMP WITH TIME ZONE,
  day_3_sent_at TIMESTAMP WITH TIME ZONE,
  day_7_scheduled_for TIMESTAMP WITH TIME ZONE,
  day_7_sent_at TIMESTAMP WITH TIME ZONE,
  converted_to_paid_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for quick lookups
CREATE INDEX idx_email_sequence_leads_email ON public.email_sequence_leads(email);

-- Create index on day 3 scheduled for to find emails that need sending
CREATE INDEX idx_email_sequence_leads_day3 ON public.email_sequence_leads(day_3_scheduled_for)
WHERE day_3_sent_at IS NULL;

-- Create index on day 7 scheduled for to find emails that need sending
CREATE INDEX idx_email_sequence_leads_day7 ON public.email_sequence_leads(day_7_scheduled_for)
WHERE day_7_sent_at IS NULL;

-- Add helpful comment
COMMENT ON TABLE public.email_sequence_leads IS 'Tracks free valuation leads and their email nurture sequence (Day 1, Day 3, Day 7)';
