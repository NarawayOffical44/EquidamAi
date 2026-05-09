-- Create leads table for capturing free valuation leads and checkout inquiries
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  website_url TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  isp TEXT,
  valuation_low DECIMAL(15, 2),
  valuation_mid DECIMAL(15, 2),
  valuation_high DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads(company_name);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_country ON public.leads(country);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert (for admin operations)
CREATE POLICY "Service role can insert leads" ON public.leads
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Allow service role to read all leads
CREATE POLICY "Service role can read all leads" ON public.leads
  FOR SELECT USING (auth.role() = 'service_role' OR auth.uid()::text = current_user_id());

-- Public can insert (for free valuation form)
CREATE POLICY "Anyone can insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);
