import { useEffect, useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";

export type GameKind = "tree" | "space" | "cat" | "treehouse";
export type HabitKind = "daily" | "individual";

export type Frequency =
  | { type: "daily" }
  | { type: "weekly"; weekdays: number[] };

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  kind: HabitKind;
  frequency: Frequency;
  completedDates: string[];
  missedDates: string[];
  individualLogs: string[];
  individualStage: number;
  gameKind?: GameKind; // for personal activities: which game to grow
  reminderTime?: string | null; // "HH:MM" local time reminder for daily habits
  createdAt: number;
  /** ISO date -> ms timestamp of the moment a daily ritual was marked done.
   *  Only populated going forward, used to learn the user's natural rhythm. */
  completedTimes: Record<string, number>;
  /** Same idea, for personal activity logs. */
  individualLogTimes: Record<string, number>;
}

export interface DayLog {
  date: string;
  pct: number;
  banner: "great" | "ok" | "warn" | "bad";
}

export interface GameState {
  kind: GameKind;
  stage: number;
  health: number;
  lastTickDate: string | null;
}

export interface FocusSession {
  id: string;
  name: string;
  date: string;
  minutes: number;
  fruits: number;
}

export interface FocusPlan {
  workMin: number;
  restMin: number;
}

export interface ActiveFocus {
  name: string;
  startedAt: number;
  accumulatedMs: number;
  running: boolean;
  basket: number;
  mode: "infinite" | "interval";
  plan?: FocusPlan;
}

export interface JournalEntry {
  id: string;
  date: string;
  createdAt: number;
  text: string;
}

export interface NotifState {
  morning?: string; // ISO date last sent
  evening?: string;
  nightly?: string; // 11pm "mark your activities" prompt
  reminders?: Record<string, string>; // habitId -> ISO date last reminded
}

export interface AppState {
  habits: Habit[];
  game: GameState | null;
  logs: DayLog[];
  firstOpenedAt: number | null;
  firstActivityAt: number | null;
  hasAccount: boolean;
  accountEmail: string | null;
  onboarded: boolean;
  activeFocus: ActiveFocus | null;
  focusSessions: FocusSession[];
  totalFruits: number;
  journalEntries: JournalEntry[];
  progressResetAt: number | null;
  notif: NotifState;
  user: User | null; // Added Supabase User
  setUser: (user: User | null) => void;
  setCloudState: (cloudData: Partial<AppState>) => void;
}

export const MAX_STAGE_CAP = 31;
// Kept for backward-compat imports (games use it as an SVG upper bound).
export const MAX_STAGE = MAX_STAGE_CAP;
export const INDIVIDUAL_MAX_STAGE = 30;
export const PERSONAL_LIMIT_FREE = 3;

const KEY = "sprout-habits-v3";

const empty: AppState = {
  habits: [],
  game: null,
  logs: [],
  firstOpenedAt: null,
  firstActivityAt: null,
  hasAccount: false,
  accountEmail: null,
  onboarded: false,
  activeFocus: null,
  focusSessions: [],
  totalFruits: 0,
  journalEntries: [],
  progressResetAt: null,
  notif: {},
  user: null, // Initialized Supabase User state
  setUser: (user) => setState((s) => ({ ...s, user })),
  setCloudState: (cloudData) => setState((s) => ({ ...s, ...cloudData })),
};

let state: AppState = empty;
let hydrated = false;
const listeners = new Set<(nextState: AppState) => void>();

function load(): AppState {
  if (typeof window === "undefined") return empty;
  try {
    const raw =
      localStorage.getItem(KEY) ??
      localStorage.getItem("sprout-habits-v2") ??
      localStorage.getItem("sprout-habits-v1");
    if (!raw) return { ...empty, firstOpenedAt: Date.now() };
    const parsed = JSON.parse(raw);
    const habits = (parsed.habits ?? []).map((h: Partial<Habit>) => ({
  ...h,
  kind: (h.kind as HabitKind | undefined) ?? "daily",
  missedDates: h.missedDates ?? [],
  individualLogs: h.individualLogs ?? [],
  individualStage: h.individualStage ?? 0,
  completedTimes: h.completedTimes ?? {},
  individualLogTimes: h.individualLogTimes ?? {},
})) as Habit[];
    return { ...empty, ...parsed, habits, notif: parsed.notif ?? {} };
  } catch {
    return { ...empty, firstOpenedAt: Date.now() };
  }
}

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

function emit() {
  listeners.forEach((l) => l(state));
}

export function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  emit();
}

function subscribe(cb: (nextState: AppState) => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getSnapshot() { return state; }
function getServerSnapshot() { return empty; }

type AppStateSelector<T> = (state: AppState) => T;

interface AppStateHook {
  (): AppState;
  <T>(selector: AppStateSelector<T>): T;
  subscribe: typeof subscribe;
}

const appStateHook = <T = AppState>(selector?: AppStateSelector<T>): T | AppState => {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
      const loaded = load();
      if (!loaded.firstOpenedAt) loaded.firstOpenedAt = Date.now();
      state = loaded;
      persist();
      emit();
      runPendingTicks();
    }
  }, []);
  return selector ? selector(s) : s;
};

export const useAppState = Object.assign(appStateHook, { subscribe }) as AppStateHook;

// ---------- helpers ----------

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysInMonth(d = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function isDueOn(habit: Habit, date: Date): boolean {
  if (habit.kind !== "daily") return false;
  if (habit.frequency.type === "daily") return true;
  return habit.frequency.weekdays.includes(date.getDay());
}

export function dayProgress(habits: Habit[], date: Date): { pct: number; due: number; done: number } {
  const iso = todayISO(date);
  const due = habits.filter((h) => isDueOn(h, date));
  if (due.length === 0) return { pct: 0, due: 0, done: 0 };
  const done = due.filter((h) => h.completedDates.includes(iso)).length;
  return { pct: Math.round((done / due.length) * 100), due: due.length, done };
}

export function bannerFor(pct: number, due: number): DayLog["banner"] {
  if (due === 0) return "ok";
  if (pct >= 80) return "great";
  if (pct >= 51) return "ok";
  if (pct > 0) return "warn";
  return "bad";
}


/** True when the user touched at least one due habit (completed or missed) that day. */
export function hasAnyMark(habits: Habit[], date: Date): boolean {
  const iso = todayISO(date);
  return habits.some(
    (h) => h.kind === "daily" && (h.completedDates.includes(iso) || h.missedDates.includes(iso)),
  );
}

/** Consecutive due-days completed, counting back from today (today optional). */
export function habitStreak(habit: Habit, now = new Date()): number {
  let streak = 0;
  const d = new Date(now);
  for (let i = 0; i < 400; i++) {
    const iso = todayISO(d);
    if (isDueOn(habit, d)) {
      if (habit.completedDates.includes(iso)) {
        streak++;
      } else if (i === 0) {
        // today not marked yet — don't break the streak
      } else {
        break;
      }
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function bestStreak(habit: Habit): number {
  const dates = [...new Set(habit.completedDates)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    run = prev && isoAdd(prev, 1) === d ? run + 1 : 1;
    prev = d;
    if (run > best) best = run;
  }
  return best;
}

/** Longest streak of days where every due daily habit was completed. */
export function overallStreak(habits: Habit[], now = new Date()): number {
  const daily = habits.filter((h) => h.kind === "daily");
  if (daily.length === 0) return 0;
  let streak = 0;
  const d = new Date(now);
  for (let i = 0; i < 400; i++) {
    const { pct, due } = dayProgress(daily, d);
    if (due === 0) {
      d.setDate(d.getDate() - 1);
      continue;
    }
    if (pct >= 80) streak++;
    else if (i !== 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function canAddPersonal(_s: AppState): boolean {
  return true;
}

/** Ask for an account only 10 days after the very first activity was marked. */
export const SIGNUP_PROMPT_DAYS = 10;
export function shouldPromptSignup(s: AppState, now = Date.now()): boolean {
  if (s.hasAccount || !s.firstActivityAt) return false;
  return Math.floor((now - s.firstActivityAt) / 86400000) >= SIGNUP_PROMPT_DAYS;
}

// ---------- actions ----------

export function addHabit(
  input: Omit<
    Habit,
    | "id"
    | "completedDates"
    | "missedDates"
    | "individualLogs"
    | "individualStage"
    | "createdAt"
    | "completedTimes"
    | "individualLogTimes"
  >,
) {
  setState((s) => ({
    ...s,
    habits: [
      ...s.habits,
      {
        ...input,
        id: crypto.randomUUID(),
        completedDates: [],
        missedDates: [],
        individualLogs: [],
        individualStage: 0,
        createdAt: Date.now(),
        completedTimes: {},
        individualLogTimes: {},
      },
    ],
  }));
}

export function removeHabit(id: string) {
  setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
}

export function setHabitReminder(id: string, time: string | null) {
  setState((s) => ({
    ...s,
    habits: s.habits.map((h) => (h.id === id ? { ...h, reminderTime: time } : h)),
  }));
}

export function setHabitGame(id: string, kind: GameKind) {
  setState((s) => ({
    ...s,
    habits: s.habits.map((h) => (h.id === id ? { ...h, gameKind: kind } : h)),
  }));
}

export function toggleToday(id: string) {
  const iso = todayISO();
  setState((s) => ({
    ...s,
    habits: s.habits.map((h) => {
      if (h.id !== id) return h;
      const has = h.completedDates.includes(iso);
      return {
        ...h,
        completedDates: has ? h.completedDates.filter((d) => d !== iso) : [...h.completedDates, iso],
        missedDates: h.missedDates.filter((d) => d !== iso),
      };
    }),
  }));
}

export function markCompleted(id: string) {
  const iso = todayISO();
  setState((s) => {
    const habit = s.habits.find((h) => h.id === id);
    if (!habit) return s;
    const already = habit.completedDates.includes(iso);
    const habits = s.habits.map((h) =>
      h.id === id
        ? {
            ...h,
            completedDates: already ? h.completedDates : [...h.completedDates, iso],
            missedDates: h.missedDates.filter((d) => d !== iso),
            completedTimes: already ? h.completedTimes : { ...h.completedTimes, [iso]: Date.now() },
          }
        : h,
    );
    // The world only moves at the end of the day — marking never advances it now.
    return { ...s, habits, firstActivityAt: s.firstActivityAt ?? Date.now() };
  });
}

export function markMissed(id: string) {
  const iso = todayISO();
  setState((s) => {
    const habit = s.habits.find((h) => h.id === id);
    if (!habit) return s;
    const already = habit.missedDates.includes(iso);
    const habits = s.habits.map((h) =>
      h.id === id
        ? {
            ...h,
            missedDates: already ? h.missedDates : [...h.missedDates, iso],
            completedDates: h.completedDates.filter((d) => d !== iso),
            completedTimes: withoutKey(h.completedTimes, iso),
          }
        : h,
    );
    return { ...s, habits, firstActivityAt: s.firstActivityAt ?? Date.now() };
  });
}

export function clearToday(id: string) {
  const iso = todayISO();
  setState((s) => ({
    ...s,
    habits: s.habits.map((h) =>
      h.id === id
        ? {
            ...h,
            completedDates: h.completedDates.filter((d) => d !== iso),
            missedDates: h.missedDates.filter((d) => d !== iso),
            completedTimes: withoutKey(h.completedTimes, iso),
          }
        : h,
    ),
  }));
}

/** One submission per day. Stage growth is applied at the end of the day. */
export function hasLoggedToday(h: Habit, now = new Date()): boolean {
  return h.individualLogs.includes(todayISO(now));
}

export function logIndividual(id: string) {
  const iso = todayISO();
  setState((s) => ({
    ...s,
    firstActivityAt: s.firstActivityAt ?? Date.now(),
    habits: s.habits.map((h) =>
      h.id === id && !h.individualLogs.includes(iso)
        ? { ...h, individualLogs: [...h.individualLogs, iso], individualLogTimes: { ...h.individualLogTimes, [iso]: Date.now() } }
        : h,
    ),
  }));
}

export function unlogIndividual(id: string) {
  const iso = todayISO();
  setState((s) => ({
    ...s,
    habits: s.habits.map((h) =>
      h.id === id
        ? { ...h, individualLogs: h.individualLogs.filter((d) => d !== iso), individualLogTimes: withoutKey(h.individualLogTimes, iso) }
        : h,
    ),
  }));
}

export function setGame(kind: GameKind) {
  setState((s) => ({
    ...s,
    game: s.game ?? { kind, stage: 0, health: 60, lastTickDate: null },
  }));
}

export function resetGame(kind: GameKind) {
  setState((s) => ({
    ...s,
    game: { kind, stage: 0, health: 60, lastTickDate: null },
  }));
}

export function completeOnboarding() {
  setState((s) => ({ ...s, onboarded: true }));
}

export function createAccount(email: string) {
  setState((s) => ({ ...s, hasAccount: true, accountEmail: email }));
}

export function signOut() {
  setState((s) => ({ ...s, hasAccount: false, accountEmail: null }));
}

export function resetAll() {
  state = { ...empty, firstOpenedAt: Date.now() };
  persist();
  emit();
}

// Wipe game/habit progress but keep routines, journal, focus sessions.
export function resetProgressKeepRoutines() {
  setState((s) => ({
    ...s,
    habits: s.habits.map((h) => ({
      ...h,
      completedDates: [],
      missedDates: [],
      individualLogs: [],
      individualStage: 0,
      completedTimes: {},
      individualLogTimes: {},
    })),
    game: s.game ? { ...s.game, stage: 0, health: 60, lastTickDate: null } : null,
    logs: [],
    progressResetAt: Date.now(),
  }));
}

/** Kept as a no-op: progress is never wiped in the released app. */
export function maybeResetForFreeTrial() {}

// ---------- Sync Actions ----------

// Updates the global user object
export function setUser(user: User | null) {
  setState((s) => ({ ...s, user }));
}

// Merges data retrieved from Supabase into the local store
export function setCloudState(cloudData: Partial<AppState>) {
  setState((s) => ({ ...s, ...cloudData }));
}

// ---------- Journal ----------

export function addJournalEntry(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  setState((s) => ({
    ...s,
    journalEntries: [
      {
        id: crypto.randomUUID(),
        date: todayISO(),
        createdAt: Date.now(),
        text: trimmed,
      },
      ...s.journalEntries,
    ].slice(0, 500),
  }));
}

export function deleteJournalEntry(id: string) {
  setState((s) => ({
    ...s,
    journalEntries: s.journalEntries.filter((e) => e.id !== id),
  }));
}

// ---------- Focus ----------

export function startFocus(name: string, opts?: { mode?: "infinite" | "interval"; plan?: FocusPlan }) {
  setState((s) => ({
    ...s,
    activeFocus: {
      name,
      startedAt: Date.now(),
      accumulatedMs: 0,
      running: true,
      basket: 0,
      mode: opts?.mode ?? "infinite",
      plan: opts?.plan,
    },
  }));
}

export function pauseFocus() {
  setState((s) => {
    if (!s.activeFocus || !s.activeFocus.running) return s;
    const now = Date.now();
    const add = now - s.activeFocus.startedAt;
    return {
      ...s,
      activeFocus: {
        ...s.activeFocus,
        accumulatedMs: s.activeFocus.accumulatedMs + add,
        running: false,
      },
    };
  });
}

export function resumeFocus() {
  setState((s) => {
    if (!s.activeFocus || s.activeFocus.running) return s;
    return {
      ...s,
      activeFocus: { ...s.activeFocus, startedAt: Date.now(), running: true },
    };
  });
}

export function endFocus() {
  setState((s) => {
    if (!s.activeFocus) return s;
    const now = Date.now();
    const totalMs = s.activeFocus.accumulatedMs + (s.activeFocus.running ? now - s.activeFocus.startedAt : 0);
    const minutes = Math.floor(totalMs / 60000);
    const fruits = minutes;
    const session: FocusSession = {
      id: crypto.randomUUID(),
      name: s.activeFocus.name,
      date: todayISO(),
      minutes,
      fruits,
    };
    if (minutes > 0) notify("Nice focus session 🍎", `${minutes} min on ${s.activeFocus.name} · ${fruits} fruit${fruits === 1 ? "" : "s"} picked`);
    return {
      ...s,
      activeFocus: null,
      focusSessions: [...s.focusSessions, session].slice(-200),
      totalFruits: s.totalFruits + fruits,
    };
  });
}

export function focusElapsedMs(af: ActiveFocus, now = Date.now()): number {
  return af.accumulatedMs + (af.running ? now - af.startedAt : 0);
}

// ---------- tick engine ----------

// The world updates at 11 PM each night. Anything left unmarked by midnight
// simply doesn't move the world — no reward, no damage.
export const TICK_HOUR = 23;

export function applyDay(
  game: GameState,
  habits: Habit[],
  dateObj: Date,
): { game: GameState; log: DayLog } {
  const d = todayISO(dateObj);
  const { pct, due } = dayProgress(habits, dateObj);
  const cap = daysInMonth(dateObj);
  const marked = hasAnyMark(habits, dateObj);
  const next = { ...game };

  if (due === 0 || !marked) {
    // Rest day, or nothing was marked before midnight — the world holds still.
  } else if (pct >= 80) {
    next.stage = Math.min(cap, next.stage + 1);
    next.health = Math.min(100, next.health + 10);
  } else if (pct >= 51) {
    next.health = Math.min(100, next.health + 3);
  } else if (pct > 0) {
    next.health = Math.max(0, next.health - 15);
  } else {
    next.health = Math.max(0, next.health - 25);
  }
  next.lastTickDate = d;
  return {
    game: next,
    log: { date: d, pct: marked ? pct : 0, banner: marked ? bannerFor(pct, due) : "ok" },
  };
}

export function runPendingTicks(now = new Date()) {
  const cur = state;
  if (!cur.game) return;

  const lastTicked = cur.game.lastTickDate;

  const lastEligible = new Date(now);
  if (now.getHours() < TICK_HOUR) {
    lastEligible.setDate(lastEligible.getDate() - 1);
  }
  const lastEligibleISO = todayISO(lastEligible);

  const start = lastTicked ? isoAdd(lastTicked, 1) : todayISO(new Date(cur.firstOpenedAt ?? now.getTime()));
  if (start > lastEligibleISO) return;

  let game = { ...cur.game };
  const newLogs: DayLog[] = [];

  for (let d = start; d <= lastEligibleISO; d = isoAdd(d, 1)) {
    const res = applyDay(game, cur.habits, new Date(d + "T12:00:00"));
    game = res.game;
    newLogs.push(res.log);
  }

  setState((s) => ({
    ...s,
    game,
    habits: settleIndividualStages(s.habits, lastEligibleISO),
    logs: [...s.logs, ...newLogs].slice(-90),
  }));
}

/** Personal activities advance one stage per logged day, once the day is over. */
function settleIndividualStages(habits: Habit[], throughISO: string): Habit[] {
  return habits.map((h) => {
    if (h.kind !== "individual") return h;
    const days = new Set(h.individualLogs.filter((d) => d <= throughISO));
    return { ...h, individualStage: Math.min(INDIVIDUAL_MAX_STAGE, days.size) };
  });
}

/** Immutably drop one key from a timestamp record (e.g. when a day is unmarked). */
function withoutKey(rec: Record<string, number>, key: string): Record<string, number> {
  if (!(key in rec)) return rec;
  const next = { ...rec };
  delete next[key];
  return next;
}

function isoAdd(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

export function forceEndDay() {
  const s = state;
  if (!s.game) return;
  const res = applyDay(s.game, s.habits, new Date());
  setState((prev) => ({
    ...prev,
    game: res.game,
    logs: [...prev.logs, res.log].slice(-90),
  }));
}

export function daysSinceFirstOpen(now = Date.now()): number {
  if (!state.firstOpenedAt) return 0;
  return Math.floor((now - state.firstOpenedAt) / (1000 * 60 * 60 * 24));
}

export function useDaysSinceFirstOpen() {
  const s = useAppState();
  return s.firstOpenedAt ? Math.floor((Date.now() - s.firstOpenedAt) / (1000 * 60 * 60 * 24)) : 0;
}

export async function requestNotifPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

export function notify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try { new Notification(title, { body }); } catch { /* noop */ }
  }
}

// Smart notification scheduler — call from a mount effect.
export function runSmartNotifications(now = new Date()) {
  const s = state;
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const iso = todayISO(now);
  const hour = now.getHours();

  const dueToday = s.habits.filter((h) => isDueOn(h, now));
  const { pct, done, due } = dayProgress(s.habits, now);

  if (hour >= 9 && hour < 12 && s.notif.morning !== iso && dueToday.length > 0) {
    notify("Good morning 🌤️", `${dueToday.length} ritual${dueToday.length === 1 ? "" : "s"} on your list today. Small steps, big growth.`);
    setState((prev) => ({ ...prev, notif: { ...prev.notif, morning: iso } }));
  }
  if (hour >= 20 && hour < 23 && s.notif.evening !== iso && due > 0 && pct < 80) {
    const remaining = due - done;
    notify("Before the 11 PM tally ⏳", `${remaining} ritual${remaining === 1 ? "" : "s"} left. Finish strong for your world.`);
    setState((prev) => ({ ...prev, notif: { ...prev.notif, evening: iso } }));
  }

  // 11 PM — ask the user to mark everything before the world updates at midnight.
  if (hour === TICK_HOUR && s.notif.nightly !== iso && due > 0) {
    const unmarked = s.habits.filter(
      (h) =>
        isDueOn(h, now) &&
        !h.completedDates.includes(iso) &&
        !h.missedDates.includes(iso),
    ).length;
    notify(
      "The world updates at midnight 🌙",
      unmarked > 0
        ? `${unmarked} ritual${unmarked === 1 ? "" : "s"} still unmarked. Anything you leave blank won't count either way.`
        : "Everything's marked. Your world is about to grow.",
    );
    setState((prev) => ({ ...prev, notif: { ...prev.notif, nightly: iso } }));
  }

  // Per-habit reminder times.
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const h of s.habits) {
    if (h.kind !== "daily" || !h.reminderTime || !isDueOn(h, now)) continue;
    if (h.completedDates.includes(iso) || h.missedDates.includes(iso)) continue;
    const [hh, mm] = h.reminderTime.split(":").map(Number);
    const target = hh * 60 + mm;
    if (mins < target || mins > target + 30) continue;
    if (state.notif.reminders?.[h.id] === iso) continue;
    notify(`${h.emoji} ${h.name}`, "Time for this ritual. Your world is waiting.");
    setState((prev) => ({
      ...prev,
      notif: { ...prev.notif, reminders: { ...(prev.notif.reminders ?? {}), [h.id]: iso } },
    }));
  }
}