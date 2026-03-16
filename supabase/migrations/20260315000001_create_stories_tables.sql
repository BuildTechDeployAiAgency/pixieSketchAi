-- stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sketch_id UUID NOT NULL REFERENCES public.sketches(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  page_count INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- story_pages table
CREATE TABLE IF NOT EXISTS public.story_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL CHECK (page_number BETWEEN 1 AND 8),
  text TEXT NOT NULL,
  illustration_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_sketch_id ON public.stories(sketch_id);
CREATE INDEX IF NOT EXISTS idx_story_pages_story_id ON public.story_pages(story_id);
CREATE INDEX IF NOT EXISTS idx_story_pages_order ON public.story_pages(story_id, page_number);

-- RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_pages ENABLE ROW LEVEL SECURITY;

-- stories RLS: users can only see/modify their own stories
CREATE POLICY "Users can view their own stories"
  ON public.stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);

-- story_pages RLS: access through parent story ownership
CREATE POLICY "Users can view pages of their own stories"
  ON public.story_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id = story_pages.story_id
        AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert story pages"
  ON public.story_pages FOR INSERT
  WITH CHECK (true);  -- edge functions use service role key

CREATE POLICY "Service role can update story pages"
  ON public.story_pages FOR UPDATE
  USING (true);  -- edge functions use service role key
