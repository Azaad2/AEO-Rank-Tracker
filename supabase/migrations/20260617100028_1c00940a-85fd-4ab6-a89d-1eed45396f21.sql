ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS resend_contact_id text;

CREATE INDEX IF NOT EXISTS profiles_resend_contact_id_idx ON public.profiles(resend_contact_id);