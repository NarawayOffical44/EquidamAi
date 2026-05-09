/**
 * Add Professional Reviewer Roles
 * Enables separate reviewer/admin roles for quality assurance workflow.
 *
 * This migration is intentionally idempotent so production/staging reruns do
 * not fail during deployment verification.
 */

-- Add user role and reviewer metadata
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewer_specialty TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewer_status TEXT DEFAULT 'inactive';

-- Add reviewer assignment tracking
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS assigned_reviewer_id UUID REFERENCES users(id);
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS review_claimed_at TIMESTAMP;

-- Review queue indexes
CREATE INDEX IF NOT EXISTS idx_valuations_review_status ON valuations(
  (professional_review->>'status'),
  created_at
) WHERE professional_review->>'status' = 'pending_review';

CREATE INDEX IF NOT EXISTS idx_valuations_assigned_reviewer ON valuations(assigned_reviewer_id)
WHERE assigned_reviewer_id IS NOT NULL;

-- Review assignment log
CREATE TABLE IF NOT EXISTS review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,
  assigned_to_user_id UUID NOT NULL REFERENCES users(id),
  assigned_by_user_id UUID NOT NULL REFERENCES users(id),
  claimed_at TIMESTAMP,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_assignments_valuation ON review_assignments(valuation_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer ON review_assignments(assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_review_assignments_status ON review_assignments(status, created_at);

-- Comments for clarity
COMMENT ON COLUMN users.role IS 'User role: user | professional_reviewer | admin';
COMMENT ON COLUMN users.reviewer_specialty IS 'Reviewer specialty for assignment routing';
COMMENT ON COLUMN users.reviewer_status IS 'Reviewer status: active | inactive | suspended';
COMMENT ON COLUMN valuations.assigned_reviewer_id IS 'Professional reviewer assigned to this valuation';
COMMENT ON COLUMN valuations.review_claimed_at IS 'Timestamp when reviewer claimed the review task';
