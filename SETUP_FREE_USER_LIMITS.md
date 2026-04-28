# Free User Limits & Watermarking Setup Guide

## Summary
This implements tier-based startup limits and watermarking for free users:

**Tiers (from pricing page):**
- **Free**: 1 startup, 3 reports/month, watermarked reports
- **Pro**: 3 startups, unlimited reports, no watermark ($99/month)
- **Plus**: 15 startups, unlimited reports, no watermark ($199/month)
- **Enterprise**: Unlimited startups, custom features

---

## Step 1: Apply Database Migration

Run this SQL in **Supabase SQL Editor** (Functions > SQL Editor > New Query):

```sql
-- Create user_profiles table to track tiers and startup limits
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  startup_count INTEGER NOT NULL DEFAULT 0,
  max_startups INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_startup_count ON user_profiles(startup_count);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, tier, startup_count, max_startups)
  VALUES (new.id, 'free', 0, 1);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add tier tracking to valuations table
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS generated_on_tier TEXT DEFAULT 'free';
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS should_watermark BOOLEAN DEFAULT true;

-- RPC function to safely increment startup count
CREATE OR REPLACE FUNCTION increment_startup_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  SELECT startup_count, max_startups INTO current_count, max_count
  FROM user_profiles
  WHERE id = user_id;

  IF current_count >= max_count AND max_count != -1 THEN
    RAISE EXCEPTION 'Startup limit reached for user %', user_id;
  END IF;

  UPDATE user_profiles
  SET startup_count = startup_count + 1,
      updated_at = now()
  WHERE id = user_id;

  RETURN current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Step 2: Update Signup Route

The signup API should mark new users as 'free' tier (already defaults to 'free' via trigger).

---

## Step 3: Files Created

### Core Utilities:
- `lib/utils/startup-limits.ts` - Check limits, get tier info
- `lib/utils/watermark.ts` - Watermark generation for reports

### Database:
- `lib/supabase/migrations/add_user_tiers_and_limits.sql` - Full migration

---

## Step 4: Key Functions to Use

### Check if user can create startup:
```typescript
import { checkStartupCreationLimit } from '@/lib/utils/startup-limits';

const result = await checkStartupCreationLimit(userId, adminClient);
if (!result.allowed) {
  return NextResponse.json({ error: result.message }, { status: 403 });
}
```

### Increment startup count after creation:
```typescript
import { incrementStartupCount } from '@/lib/utils/startup-limits';

await incrementStartupCount(userId, adminClient);
```

### Add watermark to reports:
```typescript
import { WatermarkOverlay } from '@/components/WatermarkOverlay';
import { shouldWatermarkReports, addWatermarkToPDF } from '@/lib/utils/watermark';

// In React component:
{shouldWatermarkReports(userTier) && <WatermarkOverlay />}

// For PDF reports:
addWatermarkToPDF(pdfDoc); // Before saving
```

---

## Step 5: Integration Points

### Startup Creation API:
1. Get user's tier from `user_profiles`
2. Call `checkStartupCreationLimit()`
3. If allowed, create startup + call `incrementStartupCount()`
4. If not allowed, return 403 with upgrade CTA

### Report Generation:
1. Check user's tier
2. If free, apply watermark overlay
3. For PDF: use `addWatermarkToPDF()` before export

### Dashboard:
1. Show startup count vs. max (e.g., "1/1 startups used")
2. Show upgrade CTA when limit reached

---

## Tier Limits Reference

| Feature | Free | Pro | Plus | Enterprise |
|---------|------|-----|------|------------|
| Startups | 1 | 3 | 15 | ∞ |
| Reports/Month | 3 | ∞ | ∞ | ∞ |
| Watermark | Yes | No | No | No |
| Price | Free | $99/mo | $199/mo | Custom (Contact Sales) |

---

## Testing Checklist

- [ ] Apply SQL migration
- [ ] Create test user → check `user_profiles` auto-created
- [ ] User creates 1st startup → succeeds
- [ ] User tries 2nd startup → blocked with "upgrade" message
- [ ] Free user report → shows watermark
- [ ] Pro user report → no watermark
- [ ] Update user tier to 'pro' → can create 3 startups

---

## Enterprise Plan Contact

**WhatsApp:** +91 6398924106

Enterprise inquiry button should send WhatsApp message:
```
"I want enterprise plan for Evaldam AI"
```

Create button:
```tsx
const whatsappNumber = "+916398924106";
const message = encodeURIComponent("I want enterprise plan for Evaldam AI");
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

<a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
  Request Enterprise Plan
</a>
```

---

## Notes

- Watermark: "DRAFT - FOR EVALUATION ONLY" (opacity 15%, red, -45° angle)
- Can be customized in `lib/utils/watermark.ts`
- Free tier enforced at API level (not just UI)
- Tier changes auto-update `max_startups` limit
- Enterprise inquiries: WhatsApp +91 6398924106
