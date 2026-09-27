ALTER TABLE public.sketches
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS video_prompt text;
