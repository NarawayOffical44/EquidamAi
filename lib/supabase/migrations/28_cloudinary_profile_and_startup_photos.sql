ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.users.avatar_url IS 'Cloudinary delivery URL for the account profile photo.';
COMMENT ON COLUMN public.startups.logo_url IS 'Cloudinary delivery URL for the startup photo or logo.';
