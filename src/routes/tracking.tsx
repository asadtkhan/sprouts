import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Trophy, Activity, CalendarDays, Flame, TrendingUp, TrendingDown } from "lucide-react";
import {
  useAppState,
  isDueOn,
  todayISO,
  dayProgress,
  daysInMonth,
  overallStreak,
  habitStreak,
  type Habit,
} from "@/lib/store";

export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "Tracking · Sprout" },
      { name: "description", content: "Monthly calendar and weekly rhythms for your habits." },
      { property: "og:title", content: "Tracking · Sprout" },
      {
        property: "og:description",
        content: "Monthly calendar and weekly rhythms for your habits.",
      },
    ],
  }),
  component: TrackingPage,
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
      label: new Date(date + "T12:00:00").toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
      }),
    }));
  }, [s.focusSessions, today]);

  const totalDone = s.habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const totalMissed = s.habits.reduce((acc, h) => acc + h.missedDates.length, 0);
  const streak = overallStreak(s.habits, today);

  // Best streak ever — scans forward from first open, tracking the longest
  // run of days where 80%+ of due rituals were completed.
  const bestStreakEver = useMemo(
    () => bestOverallStreak(s.habits, today, s.firstOpenedAt),
    [s.habits, today, s.firstOpenedAt],
  );

  // 30-day consistency — average completion % across days that actually had something due.
  const consistency30 = useMemo(() => consistencyPct(s.habits, today, 30), [s.habits, today]);

  // This month vs last month, month-to-date average completion.
  const monthTrend = useMemo(() => monthOverMonthTrend(s.habits, today), [s.habits, today]);

  // Per-weekday completion average over the last 4 weeks.
  const weekdayRhythm = useMemo(() => weekdayAverages(s.habits, today, 28), [s.habits, today]);
  const rhythmBest = useMemo(() => bestWorstWeekday(weekdayRhythm), [weekdayRhythm]);

  // Two habits worth calling out: the one on the best run, and the one that could use a nudge.
  const spotlight = useMemo(() => habitSpotlight(s.habits, today), [s.habits, today]);

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Progress</div>
        <h1 className="font-display text-3xl md:text-4xl">Tracking</h1>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-2">
        <StatCard label="Streak" value={streak} accent />
        <StatCard label="Completed" value={totalDone} />
        <StatCard label="Missed" value={totalMissed} />
        <StatCard label="Fruits" value={s.totalFruits} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <div className="glass-soft rounded-2xl px-3 py-2.5 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="text-sm font-medium">
              {bestStreakEver} day{bestStreakEver === 1 ? "" : "s"}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
              Best streak ever
            </div>
          </div>
        </div>
        <div className="glass-soft rounded-2xl px-3 py-2.5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="text-sm font-medium">
              {consistency30 !== null ? `${consistency30}%` : "—"}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
              30-day consistency
            </div>
          </div>
        </div>
      </div>

      <div data-tour="tracking-calendar" className="glass-pop rounded-3xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Daily completion, {monthLabel}</div>
          <div className="text-[11px] text-muted-foreground">by day of month</div>
        </div>
        {monthTrend !== null && (
          <div
            className={`mt-0.5 mb-2.5 text-[11px] font-medium ${
              monthTrend > 0 ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {monthTrend > 0
              ? `▲ ${monthTrend}% vs last month`
              : monthTrend < 0
                ? `▼ ${Math.abs(monthTrend)}% vs last month`
                : "Same pace as last month"}
          </div>
        )}
        <div
          className={`grid grid-cols-7 gap-1.5 mb-2 text-[10px] text-muted-foreground text-center ${monthTrend === null ? "mt-3" : ""}`}
        >
          {WEEKDAYS.map((d) => (
            <div key={d}>{d[0]}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {calendar.map((c, i) => {
            if (!c.date) return <div key={i} className="aspect-square" />;
            const dayNum = Number(c.date.slice(-2));
            const color = cellColor(c.pct, c.due);
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium ${
                  c.isToday ? "ring-2 ring-primary" : ""
                }`}
                style={{
                  background: color.bg,
                  color: color.fg,
                }}
                title={`${c.date} · ${c.due === 0 ? "rest day" : `${c.pct}%`}`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Less</span>
          {[0, 25, 50, 75, 100].map((p) => (
            <div key={p} className="w-4 h-4 rounded" style={{ background: cellColor(p, 1).bg }} />
          ))}
          <span>More</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-white/40 border border-dashed border-muted-foreground" />
            <span>rest</span>
          </div>
        </div>
      </div>

      <div className="glass-pop rounded-3xl p-4 mb-4">
        <div className="flex items-center gap-1.5 text-sm font-medium mb-3">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" /> Weekly rhythm
        </div>
        {rhythmBest === null ? (
          <Empty text="Mark a few rituals to see your weekday pattern." />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1.5">
              {weekdayRhythm.map((pct, i) => {
                const color = cellColor(pct ?? 0, pct === null ? 0 : 1);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-full aspect-square rounded-full flex items-center justify-center text-[10px] font-medium ${
                        i === today.getDay() ? "ring-2 ring-primary" : ""
                      }`}
                      style={{ background: color.bg, color: color.fg }}
                      title={pct === null ? "No data" : `${WEEKDAYS[i]} · ${pct}%`}
                    >
                      {pct !== null ? pct : ""}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{WEEKDAYS[i][0]}</span>
                  </div>
                );
              })}
            </div>
            {rhythmBest.best && rhythmBest.worst && rhythmBest.best.day !== rhythmBest.worst.day ? (
              <div className="mt-3 text-[11px] text-muted-foreground">
                Strongest on{" "}
                <span className="text-foreground font-medium">{rhythmBest.best.day}</span> · softest
                on <span className="text-foreground font-medium">{rhythmBest.worst.day}</span>
              </div>
            ) : rhythmBest.best ? (
              <div className="mt-3 text-[11px] text-muted-foreground">
                Steady across the week — nice and consistent.
              </div>
            ) : null}
          </>
        )}
      </div>

      {spotlight && (
        <div className="glass-pop rounded-3xl p-4 mb-4">
          <div className="text-sm font-medium mb-3">Habit spotlight</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="glass-soft rounded-2xl p-3 bg-primary/10">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary mb-1.5">
                <TrendingUp className="w-3 h-3" /> Strongest
              </div>
              <div className="text-sm font-medium truncate">
                {spotlight.strongest.habit.emoji} {spotlight.strongest.habit.name}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Flame
                  className={`w-3 h-3 ${spotlight.strongest.streak > 0 ? "text-orange-500" : ""}`}
                />
                {spotlight.strongest.streak} day{spotlight.strongest.streak === 1 ? "" : "s"} ·{" "}
                {Math.round((spotlight.strongest.rate ?? 0) * 100)}% last 2 weeks
              </div>
            </div>
            <div className="glass-soft rounded-2xl p-3 bg-accent/25">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent-foreground mb-1.5">
                <TrendingDown className="w-3 h-3" /> Needs attention
              </div>
              <div className="text-sm font-medium truncate">
                {spotlight.attention.habit.emoji} {spotlight.attention.habit.name}
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                {spotlight.attention.due - spotlight.attention.done} missed of last{" "}
                {spotlight.attention.due}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-pop rounded-3xl p-4 mb-4">
        <div className="text-sm font-medium mb-3">Personal activities, last 7 days</div>
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

function cellColor(pct: number, due: number): { bg: string; fg: string } {
  if (due === 0) return { bg: "rgba(255,255,255,0.4)", fg: "#8a8a95" };
  // 0 → 100 mapped to a warm-to-green scale
  if (pct === 0) return { bg: "rgba(255,158,194,0.4)", fg: "#7a3a4a" };
  if (pct < 40) return { bg: "rgba(255,215,106,0.55)", fg: "#7a5a1a" };
  if (pct < 70) return { bg: "rgba(178,220,140,0.75)", fg: "#2d5a2a" };
  if (pct < 90) return { bg: "rgba(123,196,138,0.9)", fg: "#1a3a1a" };
  return { bg: "rgba(78,163,107,1)", fg: "#ffffff" };
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

/** Longest historical run of days where 80%+ of due rituals were completed. */
function bestOverallStreak(habits: Habit[], today: Date, firstOpenedAt: number | null): number {
  if (habits.filter((h) => h.kind === "daily").length === 0) return 0;
  const start = firstOpenedAt ? new Date(firstOpenedAt) : new Date(today);
  if (!firstOpenedAt) start.setDate(start.getDate() - 89);
  const cappedStart = new Date(Math.max(start.getTime(), today.getTime() - 400 * 86400000));
  cappedStart.setHours(12, 0, 0, 0);
  let best = 0;
  let run = 0;
  const d = new Date(cappedStart);
  const end = new Date(today);
  end.setHours(12, 0, 0, 0);
  while (d <= end) {
    const { pct, due } = dayProgress(habits, d);
    if (due > 0) {
      if (pct >= 80) {
        run++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return best;
}

/** Average completion % over the trailing `days`, counting only days with something due. */
function consistencyPct(habits: Habit[], today: Date, days: number): number | null {
  if (habits.filter((h) => h.kind === "daily").length === 0) return null;
  let sum = 0;
  let counted = 0;
  const d = new Date(today);
  for (let i = 0; i < days; i++) {
    const { pct, due } = dayProgress(habits, d);
    if (due > 0) {
      sum += pct;
      counted++;
    }
    d.setDate(d.getDate() - 1);
  }
  return counted === 0 ? null : Math.round(sum / counted);
}

/** Month-to-date average completion vs the same measure for the full previous month. */
function monthOverMonthTrend(habits: Habit[], today: Date): number | null {
  if (habits.filter((h) => h.kind === "daily").length === 0) return null;
  const y = today.getFullYear();
  const m = today.getMonth();

  let curSum = 0;
  let curCount = 0;
  for (let day = 1; day <= today.getDate(); day++) {
    const { pct, due } = dayProgress(habits, new Date(y, m, day, 12));
    if (due > 0) {
      curSum += pct;
      curCount++;
    }
  }

  const lastMonthRef = new Date(y, m - 1, 1);
  const lastCap = daysInMonth(lastMonthRef);
  let lastSum = 0;
  let lastCount = 0;
  for (let day = 1; day <= lastCap; day++) {
    const { pct, due } = dayProgress(
      habits,
      new Date(lastMonthRef.getFullYear(), lastMonthRef.getMonth(), day, 12),
    );
    if (due > 0) {
      lastSum += pct;
      lastCount++;
    }
  }

  if (curCount === 0 || lastCount === 0) return null;
  return Math.round(curSum / curCount - lastSum / lastCount);
}

/** Per-weekday average completion % over the trailing `days`. null entries mean no data for that weekday. */
function weekdayAverages(habits: Habit[], today: Date, days: number): (number | null)[] {
  const sums = Array(7).fill(0);
  const counts = Array(7).fill(0);
  const d = new Date(today);
  for (let i = 0; i < days; i++) {
    const { pct, due } = dayProgress(habits, d);
    if (due > 0) {
      const wd = d.getDay();
      sums[wd] += pct;
      counts[wd]++;
    }
    d.setDate(d.getDate() - 1);
  }
  return sums.map((sum, i) => (counts[i] > 0 ? Math.round(sum / counts[i]) : null));
}

function bestWorstWeekday(averages: (number | null)[]): {
  best: { day: string; pct: number } | null;
  worst: { day: string; pct: number } | null;
} | null {
  const entries = averages
    .map((pct, i) => (pct === null ? null : { day: WEEKDAYS[i], pct }))
    .filter((e): e is { day: string; pct: number } => e !== null);
  if (entries.length === 0) return null;
  const best = entries.reduce((a, b) => (b.pct > a.pct ? b : a));
  const worst = entries.reduce((a, b) => (b.pct < a.pct ? b : a));
  return { best, worst };
}

interface SpotlightEntry {
  habit: Habit;
  due: number;
  done: number;
  rate: number | null;
  streak: number;
}

/** The habit on the best run, and the one that's been missed most, over the last 2 weeks. */
function habitSpotlight(
  habits: Habit[],
  today: Date,
): { strongest: SpotlightEntry; attention: SpotlightEntry } | null {
  const daily = habits.filter((h) => h.kind === "daily");
  if (daily.length < 2) return null;

  const stats: SpotlightEntry[] = daily
    .map((h) => {
      let due = 0;
      let done = 0;
      const d = new Date(today);
      for (let i = 0; i < 14; i++) {
        if (isDueOn(h, d)) {
          due++;
          if (h.completedDates.includes(todayISO(d))) done++;
        }
        d.setDate(d.getDate() - 1);
      }
      return {
        habit: h,
        due,
        done,
        rate: due > 0 ? done / due : null,
        streak: habitStreak(h, today),
      };
    })
    .filter((x) => x.due > 0);

  if (stats.length < 2) return null;

  const sorted = [...stats].sort((a, b) => b.rate! - a.rate! || b.streak - a.streak);
  const strongest = sorted[0];
  const attention = sorted[sorted.length - 1];
  if (strongest.habit.id === attention.habit.id) return null;

  return { strongest, attention };
}
