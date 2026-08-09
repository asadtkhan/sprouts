CREATE TABLE public.races (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  activity TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.race_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  player_key UUID NOT NULL,
  name TEXT NOT NULL,
  step INTEGER NOT NULL DEFAULT 0,
  last_marked DATE,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (race_id, player_key)
);

CREATE INDEX race_players_race_id_idx ON public.race_players(race_id);

GRANT SELECT, INSERT ON public.races TO anon, authenticated;
GRANT ALL ON public.races TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.race_players TO anon, authenticated;
GRANT ALL ON public.race_players TO service_role;

ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view races" ON public.races FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create races" ON public.races FOR INSERT TO anon, authenticated WITH CHECK (char_length(code) BETWEEN 4 AND 12 AND char_length(activity) BETWEEN 1 AND 80);

CREATE POLICY "Anyone can view racers" ON public.race_players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can join a race" ON public.race_players FOR INSERT TO anon, authenticated WITH CHECK (char_length(name) BETWEEN 1 AND 24 AND step = 0);
CREATE POLICY "Racers can move their own car" ON public.race_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (step >= 0 AND step <= 31);

ALTER PUBLICATION supabase_realtime ADD TABLE public.races;
ALTER PUBLICATION supabase_realtime ADD TABLE public.race_players;
