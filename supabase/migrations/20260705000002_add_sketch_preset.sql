-- Persist the chosen transformation preset so retry can resubmit correctly
ALTER TABLE public.sketches ADD COLUMN IF NOT EXISTS preset text;
