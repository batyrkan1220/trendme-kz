ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_notes text;

CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles (is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles (is_deleted) WHERE is_deleted = true;