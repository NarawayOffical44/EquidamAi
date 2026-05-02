-- Create exchange_rates table for automated rate caching
CREATE TABLE IF NOT EXISTS exchange_rates (
  currency TEXT PRIMARY KEY,
  rate DECIMAL(10, 4) NOT NULL,
  best_rate DECIMAL(10, 4) NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pricing_cache table for pre-calculated pricing
CREATE TABLE IF NOT EXISTS pricing_cache (
  id TEXT PRIMARY KEY,
  pricing JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_exchange_rates_updated_at ON exchange_rates(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_cache_updated_at ON pricing_cache(updated_at DESC);

-- Initial rates (will be auto-updated)
INSERT INTO exchange_rates (currency, rate, best_rate, last_updated)
VALUES
  ('INR', 83.5, 83.5, NOW()),
  ('EUR', 0.92, 0.92, NOW()),
  ('USD', 1, 1, NOW())
ON CONFLICT (currency) DO UPDATE SET
  updated_at = NOW();

-- Insert initial pricing cache
INSERT INTO pricing_cache (id, pricing)
VALUES (
  'latest',
  '{"INR": {"founder": 5000, "advisor": 10000}, "EUR": {"founder": 55, "advisor": 110}, "USD": {"founder": 60, "advisor": 120}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  pricing = EXCLUDED.pricing,
  updated_at = NOW();
