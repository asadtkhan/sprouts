import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { RotateCcw, Sunrise, Sun, Sunset, Moon, Sparkles, Leaf } from "lucide-react";
import {
  useAppState,
  todayISO,
  dayProgress,
  daysInMonth,
  overallStreak,
  hasAnyMark,
  type GameKind,
} from "@/lib/store";
import { useRaces } from "@/lib/race";
import { GAMES } from "@/lib/presets";

export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "Tracking · Sprout" },
      { name: "description", content: "Monthly calendar and weekly rhythms for your habits." },
      { property: "og:title", content: "Tracking · Sprout" },
      { property: "og:description", content: "Monthly calendar and weekly rhythms for your habits." },
    ],
  }),
  component: TrackingPage,
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type GrowthStage = "rest" | "bare" | "sprout" | "sapling" | "leafy" | "bloom";

function growthStage(pct: number, due: number): GrowthStage {
  if (due === 0) return "rest";
  if (pct === 0) return "bare";
  if (pct < 40) return "sprout";
  if (pct < 70) return "sapling";
  if (pct < 90) return "leafy";
  return "bloom";
}

const STAGE_BG: Record<GrowthStage, string> = {
  rest: "rgba(255,255,255,0.4)",
  bare: "rgba(255,214,179,0.35)",
  sprout: "rgba(255,232,168,0.45)",
  sapling: "rgba(198,230,169,0.6)",
  leafy: "rgba(163,214,140,0.78)",
  bloom: "rgba(110,182,132,0.92)",
};

const STAGE_STEM_TOP: Record<Exclude<GrowthStage, "rest" | "bare">, number> = {
  sprout: 12.6,
  sapling: 10.4,
  leafy: 8.6,
  bloom: 7,
};

const STAGE_LEAVES: Record<Exclude<GrowthStage, "rest" | "bare">, { x: number; y: number; rx: number; ry: number; rot: number }[]> = {
  sprout: [{ x: 11.5, y: 12.9, rx: 1.7, ry: 0.9, rot: -25 }],
  sapling: [
    { x: 8.1, y: 12.1, rx: 1.9, ry: 1, rot: 25 },
    { x: 11.9, y: 11, rx: 1.9, ry: 1, rot: -22 },
  ],
  leafy: [
    { x: 7.7, y: 11.6, rx: 2.1, ry: 1.1, rot: 28 },
    { x: 12.3, y: 10.5, rx: 2.1, ry: 1.1, rot: -26 },
    { x: 8.6, y: 9.2, rx: 1.8, ry: 1, rot: 18 },
  ],
  bloom: [
    { x: 7.7, y: 11.6, rx: 2.1, ry: 1.1, rot: 28 },
    { x: 12.3, y: 10.5, rx: 2.1, ry: 1.1, rot: -26 },
  ],
};

/** A single day cell in the ecosystem heatmap: soil, if nothing was due that
 * day, or a little plant that grows fuller the more of the day's rituals
 * got done. Same completion bands the app already uses elsewhere, just
 * drawn as a garden instead of a flat color. */
function GrowthCell({ pct, due, isToday, title }: { pct: number; due: number; isToday: boolean; title: string }) {
  const stage = growthStage(pct, due);
  return (
    <div
      className={`aspect-square rounded-lg flex items-center justify-center ${isToday ? "ring-2 ring-primary" : ""}`}
      style={{ background: STAGE_BG[stage] }}
      title={title}
    >
      <svg viewBox="0 0 20 20" width="76%" height="76%">
        {stage === "rest" && (
          <circle cx="10" cy="10" r="6" fill="none" stroke="#c7c7cf" strokeWidth="1.3" strokeDasharray="2.3 2.1" />
        )}
        {stage !== "rest" && (
          <>
            <ellipse cx="10" cy="16.3" rx="6.4" ry="1.9" fill="#caa273" opacity={stage === "bare" ? 0.9 : 0.85} />
            {stage === "bare" && <circle cx="10" cy="14.7" r="0.9" fill="#8a6a3a" opacity="0.7" />}
            {stage !== "bare" && (
              <>
                <line
                  x1="10"
                  y1="16"
                  x2="10"
                  y2={STAGE_STEM_TOP[stage as Exclude<GrowthStage, "rest" | "bare">]}
                  stroke="#3f7d4f"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {STAGE_LEAVES[stage as Exclude<GrowthStage, "rest" | "bare">].map((leaf, i) => (
                  <ellipse
                    key={i}
                    cx={leaf.x}
                    cy={leaf.y}
                    rx={leaf.rx}
                    ry={leaf.ry}
                    fill="#4ade80"
                    transform={`rotate(${leaf.rot} ${leaf.x} ${leaf.y})`}
                  />
                ))}
                {stage === "bloom" && (
                  <>
                    {[0, 72, 144, 216, 288].map((deg) => (
                      <ellipse key={deg} cx="10" cy="6.2" rx="1.6" ry="2.3" fill="#f97362" transform={`rotate(${deg} 10 6.2)`} />
                    ))}
                    <circle cx="10" cy="6.2" r="1.1" fill="#ffd76a" />
                  </>
                )}
              </>
            )}
          </>
        )}
      </svg>
    </div>
  );
}

const RHYTHM_COPY: Record<
  "morning" | "afternoon" | "evening" | "night",
  { label: string; icon: typeof Sunrise; body: (pct: number) => string }
> = {
  morning: { label: "Morning person", icon: Sunrise, body: (pct) => `${pct}% of what you mark happens before noon.` },
  afternoon: { label: "Afternoon momentum", icon: Sun, body: (pct) => `${pct}% of your habits land between lunch and evening.` },
  evening: { label: "Evening wind down", icon: Sunset, body: (pct) => `${pct}% of your habits happen in the evening.` },
  night: { label: "Night owl", icon: Moon, body: (pct) => `${pct}% of your habits happen after 9 PM.` },
};

const IMPACT_COPY: Record<GameKind, (n: number) => string> = {
  tree: (n) => `You've watered your tree ${n} time${n === 1 ? "" : "s"}.`,
  space: (n) => `You've fueled ${n} rocket launch${n === 1 ? "" : "es"}.`,
  cat: (n) => `You've petted your kitten ${n} time${n === 1 ? "" : "s"}.`,
  treehouse: (n) => `You've added ${n} plank${n === 1 ? "" : "s"} to your treehouse.`,
};

function TrackingPage() {
  const s = useAppState();
  const today = new Date();
  const iso = todayISO(today);
  const monthLabel = today.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const cap = daysInMonth(today);

  // Calendar: current month, per day daily completion %
  const calendar = useMemo(() => {
    const y = today.getFullYear();
    const m = today.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay(); // Sun = 0
    const cells: { date: string | null; pct: number; due: number; isToday: boolean }[] = [];
    for (let i = 0; i < startPad; i++) cells.push({ date: null, pct: 0, due: 0, isToday: false });
    for (let d = 1; d <= cap; d++) {
      const dateObj = new Date(y, m, d);
      const dISO = todayISO(dateObj);
      const { pct, due } = dayProgress(s.habits, dateObj);
      cells.push({ date: dISO, pct, due, isToday: dISO === iso });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, pct: 0, due: 0, isToday: false });
    return cells;
  }, [s.habits, iso, cap, today]);

  // Weekly individual activities — last 7 days counts per activity
  const individualHabits = s.habits.filter((h) => h.kind === "individual");
  const weeklyIndividual = useMemo(() => {
    const cutoffs: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      cutoffs.push(todayISO(d));
    }
    return individualHabits.map((h) => ({
      name: `${h.emoji} ${h.name.length > 14 ? h.name.slice(0, 12) + "…" : h.name}`,
      count: h.individualLogs.filter((d) => cutoffs.includes(d)).length,
    }));
  }, [individualHabits, today]);

  // Top weekday for individual + daily completions combined
  const topWeekday = useMemo(() => {
    const counts = Array(7).fill(0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 6);
    for (const h of s.habits) {
      const dates = [...h.completedDates, ...h.individualLogs];
      for (const d of dates) {
        const dt = new Date(d + "T12:00:00");
        if (dt >= cutoff && dt <= today) counts[dt.getDay()]++;
      }
    }
    const max = Math.max(...counts);
    if (max === 0) return null;
    return { day: WEEKDAYS[counts.indexOf(max)], count: max };
  }, [s.habits, today]);

  // Focus minutes last 15 days
  const focusData = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      map.set(todayISO(d), 0);
    }
    for (const f of s.focusSessions) {
      if (map.has(f.date)) map.set(f.date, (map.get(f.date) ?? 0) + f.minutes);
    }
    return Array.from(map.entries()).map(([date, minutes]) => ({
      date,
      minutes,
      label: new Date(date + "T12:00:00").toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
    }));
  }, [s.focusSessions, today]);

  const totalDone = s.habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const totalMissed = s.habits.reduce((acc, h) => acc + h.missedDates.length, 0);
  const streak = overallStreak(s.habits, today);
  const monthWord = today.toLocaleDateString(undefined, { month: "long" });

  // Bounce-Back Rate: count days this month where an off day (rituals were
  // due, at least one was marked, but the day fell short of 80%) was
  // immediately followed by a day that hit 80% or more. Celebrates getting
  // back on track rather than only ever counting a perfect streak.
  const bounceBack = useMemo(() => {
    const daily = s.habits.filter((h) => h.kind === "daily");
    if (daily.length === 0) return { count: 0, hasDaily: false };
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    let count = 0;
    let prevWasOffDay = false;
    for (const d = new Date(first); d <= today; d.setDate(d.getDate() + 1)) {
      const { pct, due } = dayProgress(daily, d);
      if (prevWasOffDay && due > 0 && pct >= 80) count++;
      prevWasOffDay = due > 0 && pct < 80 && hasAnyMark(daily, d);
    }
    return { count, hasDaily: true };
  }, [s.habits, today]);

  // Habit Rhythms: the dominant time of day habits and activities actually
  // get marked. Only real, going forward — completedTimes/individualLogTimes
  // start empty for habits created before this shipped, so there's nothing
  // to fabricate for older data. We wait for a small sample before guessing.
  const rhythm = useMemo(() => {
    const hours: number[] = [];
    for (const h of s.habits) {
      for (const t of Object.values(h.completedTimes ?? {})) hours.push(new Date(t).getHours());
      for (const t of Object.values(h.individualLogTimes ?? {})) hours.push(new Date(t).getHours());
    }
    if (hours.length < 5) return null;
    const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const hr of hours) {
      if (hr >= 5 && hr < 12) buckets.morning++;
      else if (hr >= 12 && hr < 17) buckets.afternoon++;
      else if (hr >= 17 && hr < 21) buckets.evening++;
      else buckets.night++;
    }
    const top = (Object.entries(buckets) as [keyof typeof buckets, number][]).sort((a, b) => b[1] - a[1])[0];
    return { bucket: top[0], pct: Math.round((top[1] / hours.length) * 100) };
  }, [s.habits]);

  // Narrative Impact Stats: tie real numbers back to the companions and
  // multiplayer games, grounding the abstract counts in the emotional hook
  // of the app.
  const gameImpact = useMemo(() => {
    const totals: Record<GameKind, number> = { tree: 0, space: 0, cat: 0, treehouse: 0 };
    for (const h of s.habits) {
      if (h.kind === "individual") totals[h.gameKind ?? "tree"] += h.individualLogs.length;
    }
    return totals;
  }, [s.habits]);

  const { entries: raceEntries } = useRaces();

  const impactChips = useMemo(() => {
    const chips: { emoji: string; text: string }[] = [];
    for (const g of GAMES) {
      const n = gameImpact[g.kind];
      if (n > 0) chips.push({ emoji: g.emoji, text: IMPACT_COPY[g.kind](n) });
    }
    for (const e of raceEntries) {
      if (e.race.mode === "collab") {
        const miles = e.race.team_step;
        chips.push({ emoji: "🚵", text: `You've ridden your shared bike ${miles} mile${miles === 1 ? "" : "s"} toward the mountains.` });
      } else {
        const laps = e.me.step;
        chips.push({ emoji: "🏎️", text: `You've raced ${laps} lap${laps === 1 ? "" : "s"} against ${e.opponent?.name ?? "a friend"}.` });
      }
    }
    return chips;
  }, [gameImpact, raceEntries]);

  const RhythmIcon = rhythm ? RHYTHM_COPY[rhythm.bucket].icon : Sun;

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Progress</div>
        <h1 className="font-display text-3xl md:text-4xl">Tracking</h1>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        <StatCard label="Streak" value={streak} accent />
        <StatCard label="Completed" value={totalDone} />
        <StatCard label="Missed" value={totalMissed} />
        <StatCard label="Fruits" value={s.totalFruits} />
      </div>


      <div data-tour="tracking-calendar" className="glass-pop rounded-3xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-primary" /> Your ecosystem, {monthLabel}
          </div>
          <div className="text-[11px] text-muted-foreground">by day of month</div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-[10px] text-muted-foreground text-center">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d[0]}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {calendar.map((c, i) => {
            if (!c.date) return <div key={i} className="aspect-square" />;
            const dayNum = Number(c.date.slice(-2));
            return (
              <GrowthCell
                key={i}
                pct={c.pct}
                due={c.due}
                isToday={c.isToday}
                title={`${dayNum} ${monthLabel} · ${c.due === 0 ? "rest day" : `${c.pct}%`}`}
              />
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Barren</span>
          {(["bare", "sprout", "sapling", "leafy", "bloom"] as const).map((stage) => (
            <div key={stage} className="w-5 h-5 rounded" style={{ background: STAGE_BG[stage] }}>
              <svg viewBox="0 0 20 20" width="100%" height="100%">
                {stage === "bare" ? (
                  <>
                    <ellipse cx="10" cy="16.3" rx="6.4" ry="1.9" fill="#caa273" opacity="0.9" />
                    <circle cx="10" cy="14.7" r="0.9" fill="#8a6a3a" opacity="0.7" />
                  </>
                ) : (
                  <>
                    <ellipse cx="10" cy="16.3" rx="6.4" ry="1.9" fill="#caa273" opacity="0.85" />
                    <line x1="10" y1="16" x2="10" y2={STAGE_STEM_TOP[stage]} stroke="#3f7d4f" strokeWidth="1.5" strokeLinecap="round" />
                    {STAGE_LEAVES[stage].map((leaf, i) => (
                      <ellipse key={i} cx={leaf.x} cy={leaf.y} rx={leaf.rx} ry={leaf.ry} fill="#4ade80" transform={`rotate(${leaf.rot} ${leaf.x} ${leaf.y})`} />
                    ))}
                    {stage === "bloom" &&
                      [0, 72, 144, 216, 288].map((deg) => (
                        <ellipse key={deg} cx="10" cy="6.2" rx="1.6" ry="2.3" fill="#f97362" transform={`rotate(${deg} 10 6.2)`} />
                      ))}
                  </>
                )}
              </svg>
            </div>
          ))}
          <span>Blooming</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-white/40 border border-dashed border-muted-foreground" />
            <span>rest</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="glass-pop rounded-3xl p-4 flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> Bounce back
          </div>
          {bounceBack.hasDaily ? (
            <>
              <div className="font-display text-4xl mt-2 text-primary">{bounceBack.count}</div>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">
                {bounceBack.count === 0
                  ? `Nothing to bounce back from yet in ${monthWord}. Miss a day, then come back strong the next, and it'll show up here.`
                  : `You've bounced back ${bounceBack.count} time${bounceBack.count === 1 ? "" : "s"} in ${monthWord}. Way to keep showing up.`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Add a daily ritual to start tracking your comebacks.</p>
          )}
        </div>

        <div className="glass-pop rounded-3xl p-4 flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <RhythmIcon className="w-3.5 h-3.5" /> Sweet spot
          </div>
          {rhythm ? (
            <>
              <div className="font-display text-xl mt-2 leading-tight">{RHYTHM_COPY[rhythm.bucket].label}</div>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">{RHYTHM_COPY[rhythm.bucket].body(rhythm.pct)}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Keep marking your habits and we'll learn your natural rhythm soon.</p>
          )}
        </div>
      </div>

      <div className="glass-pop rounded-3xl p-4 mb-4">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Real world impact
        </div>
        {impactChips.length === 0 ? (
          <Empty text="Log a personal activity or join a multiplayer game to see your impact here." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {impactChips.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5 glass-soft rounded-2xl px-3 py-2.5">
                <span className="text-xl leading-none shrink-0">{c.emoji}</span>
                <span className="text-sm leading-snug">{c.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-pop rounded-3xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Personal activities, last 7 days</div>
          {topWeekday && (
            <div className="text-[11px] text-muted-foreground">
              Most active: <span className="text-foreground font-medium">{topWeekday.day}</span>
            </div>
          )}
        </div>
        {weeklyIndividual.length === 0 ? (
          <Empty text="Add a personal activity to see your weekly rhythm." />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(140, weeklyIndividual.length * 38)}>
            <BarChart data={weeklyIndividual} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" allowDecimals={false} fontSize={11} />
              <YAxis type="category" dataKey="name" width={130} fontSize={11} />
              <Tooltip formatter={(v: number) => `${v} log${v === 1 ? "" : "s"}`} />
              <Bar dataKey="count" fill="hsl(160 55% 45%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass-pop rounded-3xl p-4 mb-4">
        <div className="text-sm font-medium mb-3">Focus minutes, last 15 days</div>
        {s.focusSessions.length === 0 ? (
          <Empty text="Start a focus session to see it here." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={focusData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: number) => `${v} min`} />
              <Bar dataKey="minutes" fill="hsl(20 80% 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-3 text-center ${accent ? "ring-2 ring-primary/40" : ""}`}>
      <div className={`text-2xl font-display ${accent ? "text-primary" : ""}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground py-8 text-center">{text}</div>;
}