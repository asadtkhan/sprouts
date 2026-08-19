CREATE TABLE public.user_ecosystems (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state_blob JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_ecosystems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ecosystem"
  ON public.user_ecosystems FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ecosystem"
  ON public.user_ecosystems FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ecosystem"
  ON public.user_ecosystems FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_ecosystems TO authenticated;
GRANT ALL ON public.user_ecosystems TO service_role;