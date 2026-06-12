ALTER TABLE public.recommendations ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_category_check;
ALTER TABLE public.recommendations
  ADD CONSTRAINT recommendations_category_check
  CHECK (category IN (
    'citation','content','authority','comparison','technical',
    'trust','community','outreach','distribution','reviews'
  ));