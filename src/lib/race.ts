import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/clients";

export const RACE_LEVELS = 31;
export const TRIP_LEVELS = 30;

export type RaceMode = "compete" | "collab";

const LS_KEY = "sprout-race-v2";
const LEGACY_KEY = "sprout-race-v1";

export type Membership = { code: string; playerKey: string };

export type RacePlayer = {
  id: string;
  race_id: string;
  player_key: string;
  name: string;
  step: number;
  last_marked: string | null;
  finished_at: string | null;
  created_at: string;
};

export type Race = {
  id: string;
  code: string;
  activity: string;
  mode: RaceMode;
  team_step: number;
  team_last_marked: string | null;
  created_at: string;
};

export type RaceEntry = {
  race: Race;
  me: RacePlayer;
  opponent: RacePlayer | null;
};

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function loadMemberships(): Membership[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Membership[];
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const one = JSON.parse(legacy) as Membership;
      if (one?.code && one?.playerKey) {
        window.localStorage.setItem(LS_KEY, JSON.stringify([one]));
        return [one];
      }
    }
    return [];
  } catch {
    return [];
  }
}

function saveMemberships(list: Membership[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("sprout-race-identity"));
}

export function addMembership(m: Membership) {
  const list = loadMemberships().filter((x) => x.code !== m.code);
  saveMemberships([...list, m]);
}

export function leaveRace(code: string) {
  saveMemberships(loadMemberships().filter((x) => x.code !== code));
}

export function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function levelsFor(mode: RaceMode) {
  return mode === "collab" ? TRIP_LEVELS : RACE_LEVELS;
}

export async function createRace(mode: RaceMode, activity: string, name: string) {
  const code = makeCode();
  const { data: race, error } = await supabase
    .from("races")
    .insert({ code, activity, mode } as any)
    .select()
    .single();
  if (error) throw error;
  const playerKey = uuid();
  const { error: pErr } = await supabase
    .from("race_players")
    .insert({ race_id: race.id, player_key: playerKey, name, step: 0 });
  if (pErr) throw pErr;
  addMembership({ code, playerKey });
  return code;
}

export async function joinRace(code: string, name: string) {
  const clean = code.trim().toUpperCase();
  const { data: race, error } = await supabase.from("races").select().eq("code", clean).maybeSingle();
  if (error) throw error;
  if (!race) throw new Error("No game found with that code");
  const { data: players } = await supabase.from("race_players").select().eq("race_id", race.id);
  if ((players?.length ?? 0) >= 2) throw new Error("This game already has two players");
  const playerKey = uuid();
  const { error: pErr } = await supabase
    .from("race_players")
    .insert({ race_id: race.id, player_key: playerKey, name, step: 0 });
  if (pErr) throw pErr;
  addMembership({ code: clean, playerKey });
  return { code: clean, mode: (race as Race).mode ?? "compete" };
}

/** Compete: move only my own car. */
export async function advanceMyCar(raceId: string, me: RacePlayer) {
  const today = todayDate();
  if (me.last_marked === today) return { ok: false as const };
  const step = Math.min(RACE_LEVELS, me.step + 1);
  const { error } = await supabase
    .from("race_players")
    .update({
      step,
      last_marked: today,
      finished_at: step >= RACE_LEVELS ? new Date().toISOString() : me.finished_at,
    })
    .eq("race_id", raceId)
    .eq("player_key", me.player_key);
  if (error) throw error;
  return { ok: true as const, step };
}

export async function skipToday(raceId: string, me: RacePlayer) {
  const today = todayDate();
  if (me.last_marked === today) return;
  const { error } = await supabase
    .from("race_players")
    .update({ last_marked: today })
    .eq("race_id", raceId)
    .eq("player_key", me.player_key);
  if (error) throw error;
}

/** Collaborate: the shared ride moves forward when either rider marks the day. */
export async function advanceTrip(race: Race, me: RacePlayer) {
  const today = todayDate();
  const myFirst = me.last_marked !== today;
  if (myFirst) {
    await supabase
      .from("race_players")
      .update({ step: Math.min(TRIP_LEVELS, me.step + 1), last_marked: today })
      .eq("race_id", race.id)
      .eq("player_key", me.player_key);
  }
  if (race.team_last_marked === today) return { ok: myFirst, teamStep: race.team_step };
  const teamStep = Math.min(TRIP_LEVELS, race.team_step + 1);
  const { error } = await supabase
    .from("races")
    .update({ team_step: teamStep, team_last_marked: today } as any)
    .eq("id", race.id);
  if (error) throw error;
  return { ok: true, teamStep };
}

export async function skipTripToday(race: Race, me: RacePlayer) {
  const today = todayDate();
  if (me.last_marked === today) return;
  await supabase
    .from("race_players")
    .update({ last_marked: today })
    .eq("race_id", race.id)
    .eq("player_key", me.player_key);
}

/** Days since the shared ride last moved — used for the resting / puncture states. */
export function idleDays(race: Race) {
  if (!race.team_last_marked) return 0;
  const last = new Date(`${race.team_last_marked}T00:00:00`);
  const now = new Date(`${todayDate()}T00:00:00`);
  return Math.max(0, Math.round((now.getTime() - last.getTime()) / 86400000));
}

export type RacesState = {
  loading: boolean;
  entries: RaceEntry[];
  refresh: () => void;
  /** Optimistic, no-flicker local updates. */
  patchRace: (raceId: string, patch: Partial<Race>) => void;
  patchMe: (raceId: string, patch: Partial<RacePlayer>) => void;
};

export function useRaces(): RacesState {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [players, setPlayers] = useState<RacePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    setMemberships(loadMemberships());
    const onChange = () => setMemberships(loadMemberships());
    window.addEventListener("sprout-race-identity", onChange);
    return () => window.removeEventListener("sprout-race-identity", onChange);
  }, []);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  const codes = memberships.map((m) => m.code).join(",");

  useEffect(() => {
    let cancelled = false;
    const list = codes ? codes.split(",") : [];
    if (list.length === 0) {
      setRaces([]);
      setPlayers([]);
      setLoading(false);
      return;
    }
    if (!loadedOnce.current) setLoading(true);
    (async () => {
      const { data: rs } = await supabase.from("races").select().in("code", list);
      if (cancelled) return;
      const rows = (rs ?? []) as Race[];
      setRaces(rows);
      if (rows.length) {
        const { data: ps } = await supabase
          .from("race_players")
          .select()
          .in(
            "race_id",
            rows.map((r) => r.id),
          );
        if (!cancelled) setPlayers((ps ?? []) as RacePlayer[]);
      } else {
        setPlayers([]);
      }
      if (!cancelled) {
        loadedOnce.current = true;
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [codes, nonce]);

  // Live sync — merge rows in place so the scene never remounts.
  useEffect(() => {
    if (!races.length) return;
    const ids = races.map((r) => r.id);
    const channel = supabase
      .channel(`races-${ids.join("-").slice(0, 40)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "race_players" },
        (payload: { new?: Partial<RacePlayer> | null }) => {
          const row = payload.new as RacePlayer | null;
          if (!row?.race_id || !ids.includes(row.race_id)) return;
          setPlayers((prev) => {
            const i = prev.findIndex((p) => p.id === row.id);
            if (i === -1) return [...prev, row as RacePlayer];
            const next = [...prev];
            next[i] = { ...next[i], ...row };
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "races" },
        (payload: { new?: Partial<Race> | null }) => {
          const row = payload.new as Race | null;
          if (!row?.id || !ids.includes(row.id)) return;
          setRaces((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...row } : r)));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [races.length, races.map((r) => r.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchRace = useCallback((raceId: string, patch: Partial<Race>) => {
    setRaces((prev) => prev.map((r) => (r.id === raceId ? { ...r, ...patch } : r)));
  }, []);

  const keyByRace = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of races) {
      const m = memberships.find((x) => x.code === r.code);
      if (m) map.set(r.id, m.playerKey);
    }
    return map;
  }, [races, memberships]);

  const patchMe = useCallback(
    (raceId: string, patch: Partial<RacePlayer>) => {
      const key = keyByRace.get(raceId);
      if (!key) return;
      setPlayers((prev) =>
        prev.map((p) => (p.race_id === raceId && p.player_key === key ? { ...p, ...patch } : p)),
      );
    },
    [keyByRace],
  );

  const entries: RaceEntry[] = races
    .map((race) => {
      const key = keyByRace.get(race.id);
      const mine = players.filter((p) => p.race_id === race.id);
      const me = mine.find((p) => p.player_key === key) ?? null;
      if (!me) return null;
      return { race, me, opponent: mine.find((p) => p.player_key !== key) ?? null };
    })
    .filter(Boolean) as RaceEntry[];

  return { loading, entries, refresh, patchRace, patchMe };
}

/** Back-compat single-race view (used by the home preview). */
export function useRace() {
  const { loading, entries, refresh } = useRaces();
  const first = entries[0] ?? null;
  return { loading, race: first?.race ?? null, me: first?.me ?? null, opponent: first?.opponent ?? null, refresh };
}
