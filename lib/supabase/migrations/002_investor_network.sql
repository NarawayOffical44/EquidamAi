-- Migration: Add Investor Network Module Tables

-- Investor profiles
CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  full_name TEXT NOT NULL,
  investor_type TEXT NOT NULL CHECK (investor_type IN ('angel', 'vc', 'family-office', 'corporate', 'accelerator')),
  bio TEXT,
  profile_image_url TEXT,

  -- Investment details
  aum DECIMAL(15, 2), -- Assets under management in USD
  avg_check_size DECIMAL(15, 2), -- Average check size in USD
  total_investments INT DEFAULT 0, -- Count of investments made
  years_investing INT,

  -- Focus areas
  focus_industries TEXT[], -- Array of industries: 'saas', 'ai', 'fintech', etc
  focus_stages TEXT[], -- Array of stages: 'pre-revenue', 'seed', 'series-a', etc
  geographic_focus TEXT[], -- Array of countries/regions

  -- Investment preferences
  preferred_check_size_min DECIMAL(15, 2),
  preferred_check_size_max DECIMAL(15, 2),
  prefers_lead_round BOOLEAN DEFAULT FALSE,
  prefers_follow_on BOOLEAN DEFAULT TRUE,

  -- Social & verification
  website_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[], -- URLs to verification docs

  -- Metadata
  headline TEXT, -- e.g., "Seed investor focused on AI in India"
  location TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP,

  UNIQUE(user_id)
);

-- Investment deals/relationships
CREATE TABLE IF NOT EXISTS public.investor_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,

  -- Deal details
  deal_stage TEXT CHECK (deal_stage IN ('interested', 'in-dd', 'term-sheet', 'closed', 'passed')),
  investment_amount DECIMAL(15, 2),
  investment_date DATE,
  equity_percentage DECIMAL(5, 2),

  -- Deal type
  deal_type TEXT CHECK (deal_type IN ('seed', 'priced-round', 'convertible', 'safe', 'spv')),
  valuation_at_investment DECIMAL(15, 2),

  -- Notes
  notes TEXT,
  syndicates_with UUID[], -- Array of other investor IDs in same round

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investor's deal flow / watchlist
CREATE TABLE IF NOT EXISTS public.investor_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,

  -- Watchlist status
  status TEXT CHECK (status IN ('interested', 'tracking', 'passed', 'portfolio')) DEFAULT 'interested',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_reviewed_at TIMESTAMP,

  -- Interest level
  interest_score INT CHECK (interest_score >= 0 AND interest_score <= 100), -- 0-100 interest level
  notes TEXT,

  UNIQUE(investor_id, startup_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investor expertise/network
CREATE TABLE IF NOT EXISTS public.investor_expertise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,

  -- Expertise areas
  expertise_area TEXT NOT NULL, -- e.g., 'Product-Market Fit', 'B2B Sales', 'AI/ML', 'Fundraising Strategy'
  years_of_experience INT,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert', 'thought-leader')),

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  relevant_exits INT, -- Number of successful exits in this area
  case_studies TEXT[], -- URLs to case studies or articles

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connection requests between investors and founders
CREATE TABLE IF NOT EXISTS public.investor_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES public.investor_profiles(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,

  -- Connection state
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'pending',
  initiated_by TEXT CHECK (initiated_by IN ('investor', 'founder')),

  -- Messages
  initial_message TEXT,
  responded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id
  ON investor_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_investor_profiles_verified
  ON investor_profiles(verified);

CREATE INDEX IF NOT EXISTS idx_investor_profiles_investor_type
  ON investor_profiles(investor_type);

CREATE INDEX IF NOT EXISTS idx_investor_deals_investor_id
  ON investor_deals(investor_id);

CREATE INDEX IF NOT EXISTS idx_investor_deals_startup_id
  ON investor_deals(startup_id);

CREATE INDEX IF NOT EXISTS idx_investor_deals_deal_stage
  ON investor_deals(deal_stage);

CREATE INDEX IF NOT EXISTS idx_investor_watchlist_investor_id
  ON investor_watchlist(investor_id);

CREATE INDEX IF NOT EXISTS idx_investor_watchlist_startup_id
  ON investor_watchlist(startup_id);

CREATE INDEX IF NOT EXISTS idx_investor_watchlist_status
  ON investor_watchlist(status);

CREATE INDEX IF NOT EXISTS idx_investor_expertise_investor_id
  ON investor_expertise(investor_id);

CREATE INDEX IF NOT EXISTS idx_investor_expertise_area
  ON investor_expertise(expertise_area);

CREATE INDEX IF NOT EXISTS idx_investor_connections_investor_id
  ON investor_connections(investor_id);

CREATE INDEX IF NOT EXISTS idx_investor_connections_founder_id
  ON investor_connections(founder_id);

CREATE INDEX IF NOT EXISTS idx_investor_connections_status
  ON investor_connections(status);

-- RLS Policies
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_connections ENABLE ROW LEVEL SECURITY;

-- Investor profiles: Users can see verified profiles, own profile fully
CREATE POLICY "Users can view verified investor profiles" ON public.investor_profiles
  FOR SELECT USING (verified = true OR user_id = auth.uid());

-- Investor deals: Only investor and founder can see their deals
CREATE POLICY "Investors can view own deals" ON public.investor_deals
  FOR SELECT USING (
    investor_id IN (SELECT id FROM investor_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM startups WHERE id = startup_id AND user_id = auth.uid())
  );

-- Investor watchlist: Only investor can see own watchlist
CREATE POLICY "Investors can view own watchlist" ON public.investor_watchlist
  FOR SELECT USING (
    investor_id IN (SELECT id FROM investor_profiles WHERE user_id = auth.uid())
  );

-- Investor expertise: Public for verified expertise
CREATE POLICY "Users can view investor expertise" ON public.investor_expertise
  FOR SELECT USING (
    verified = true OR
    investor_id IN (SELECT id FROM investor_profiles WHERE user_id = auth.uid())
  );

-- Investor connections: Users can see connections involving them
CREATE POLICY "Users can view own connections" ON public.investor_connections
  FOR SELECT USING (
    investor_id IN (SELECT id FROM investor_profiles WHERE user_id = auth.uid()) OR
    founder_id = auth.uid()
  );
