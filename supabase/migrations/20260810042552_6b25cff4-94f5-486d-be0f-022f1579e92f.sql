ALTER TABLE public.races ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'compete';
ALTER TABLE public.races ADD COLUMN IF NOT EXISTS team_step integer NOT NULL DEFAULT 0;
ALTER TABLE public.races ADD COLUMN IF NOT EXISTS team_last_marked date;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'races_mode_check') THEN
    ALTER TABLE public.races ADD CONSTRAINT races_mode_check CHECK (mode IN ('compete','collab'));
  END IF;
END $$;

CREATE POLICY "Anyone can advance a shared journey"
  ON public.races FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (team_step >= 0 AND team_step <= 30);

GRANT SELECT, INSERT, UPDATE ON public.races TO anon, authenticated;
GRANT ALL ON public.races TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'races'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.races;
  END IF;
END $$;