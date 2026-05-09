/**
 * Add Professional Reviewer Roles
 * Enables separate reviewer/admin roles for quality assurance workflow
 */

-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
-- Values: 'user' | 'professional_reviewer' | 'admin'

-- Add reviewer metadata
ALTER TABLE users ADD COLUMN reviewer_specialty TEXT;
-- Values: 'ca' | 'investment_advisor' | 'startup_advisor' | 'general' | null

ALTER TABLE users ADD COLUMN reviewer_status TEXT DEFAULT 'inactive';
-- Values: 'active' | 'inactive' | 'suspended'

-- Add reviewer assignment tracking
ALTER TABLE valuations ADD COLUMN assigned_reviewer_id UUID REFERENCES users(id);
ALTER TABLE valuations ADD COLUMN review_claimed_at TIMESTAMP;

-- Create index for review queue queries
CREATE INDEX idx_valuations_review_status ON valuations(
  (professional_review->>'status'),
  created_at
) WHERE professional_review->>'status' = 'pending_review';

CREATE INDEX idx_valuations_assigned_reviewer ON valuations(assigned_reviewer_id)
WHERE assigned_reviewer_id IS NOT NULL;

-- Create review assignment log
CREATE TABLE review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,
  assigned_to_user_id UUID NOT NULL REFERENCES users(id),
  assigned_by_user_id UUID NOT NULL REFERENCES users(id),
  claimed_at TIMESTAMP,
  status TEXT DEFAULT 'pending', -- 'pending' | 'claimed' | 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_review_assignments_valuation ON review_assignments(valuation_id);
CREATE INDEX idx_review_assignments_reviewer ON review_assignments(assigned_to_user_id, status);
CREATE INDEX idx_review_assignments_status ON review_assignments(status, created_at);

-- Add comments for clarity
COMMENT ON COLUMN users.role IS 'User role: user | professional_reviewer | admin';
COMMENT ON COLUMN users.reviewer_specialty IS 'Reviewer specialty for assignment routing';
COMMENT ON COLUMN valuations.assigned_reviewer_id IS 'Professional reviewer assigned to this valuation';
COMMENT ON COLUMN valuations.review_claimed_at IS 'Timestamp when reviewer claimed the review task';
