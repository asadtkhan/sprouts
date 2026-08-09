import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/clients";

export const RACE_LEVELS = 31;

const LS_KEY = "sprout-race-v1";

export type RaceIdentity = { code: string; playerKey: string };

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
  created_at: string;
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

export function loadIdentity(): RaceIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as RaceIdentity) : null;
  } catch {
    return null;
  }
}

export function saveIdentity(id: RaceIdentity | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(LS_KEY, JSON.stringify(id));
  else window.localStorage.removeItem(LS_KEY);
  window.dispatchEvent(new Event("sprout-race-identity"));
}

export function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function createRace(activity: string, name: string) {
  const code = makeCode();
  const { data: race, error } = await supabase
    .from("races")
    .insert({ code, activity })
    .select()
    .single();
  if (error) throw error;
  const playerKey = uuid();
  const { error: pErr } = await supabase
    .from("race_players")
    .insert({ race_id: race.id, player_key: playerKey, name, step: 0 });
  if (pErr) throw pErr;
  saveIdentity({ code, playerKey });
  return code;
}

export async function joinRace(code: string, name: string) {
  const clean = code.trim().toUpperCase();
  const { data: race, error } = await supabase
    .from("races")
    .select()
    .eq("code", clean)
    .maybeSingle();
  if (error) throw error;
  if (!race) throw new Error("No race found with that code");
  const { data: players } = await supabase.from("race_players").select().eq("race_id", race.id);
  if ((players?.length ?? 0) >= 2) throw new Error("This race already has two racers");
  const playerKey = uuid();
  const { error: pErr } = await supabase
    .from("race_players")
    .insert({ race_id: race.id, player_key: playerKey, name, step: 0 });
  if (pErr) throw pErr;
  saveIdentity({ code: clean, playerKey });
  return clean;
}

export async function advanceMyCar(raceId: string, me: RacePlayer) {
  const today = todayDate();
  if (me.last_marked === today) return { ok: false, reason: "already" as const };
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

export function leaveRace() {
  saveIdentity(null);
}

export type RaceState = {
  loading: boolean;
  identity: RaceIdentity | null;
  race: Race | null;
  me: RacePlayer | null;
  opponent: RacePlayer | null;
  refresh: () => void;
};

export function useRace(): RaceState {
  const [identity, setIdentity] = useState<RaceIdentity | null>(null);
  const [race, setRace] = useState<Race | null>(null);
  const [players, setPlayers] = useState<RacePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setIdentity(loadIdentity());
    const onChange = () => setIdentity(loadIdentity());
    window.addEventListener("sprout-race-identity", onChange);
    return () => window.removeEventListener("sprout-race-identity", onChange);
  }, []);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (!identity) {
      setRace(null);
      setPlayers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data: r } = await supabase
        .from("races")
        .select()
        .eq("code", identity.code)
        .maybeSingle();
      if (cancelled) return;
      setRace(r ?? null);
      if (r) {
        const { data: ps } = await supabase.from("race_players").select().eq("race_id", r.id);
        if (!cancelled) setPlayers(ps ?? []);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [identity, nonce]);

  useEffect(() => {
    if (!race) return;
    const channel = supabase
      .channel(`race-${race.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "race_players", filter: `race_id=eq.${race.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [race, refresh]);

  const me = players.find((p) => p.player_key === identity?.playerKey) ?? null;
  const opponent = players.find((p) => p.player_key !== identity?.playerKey) ?? null;

  return { loading, identity, race, me, opponent, refresh };
}