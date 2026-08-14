import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

const STAGE_CLASSES: Record<GrowthStage, string> = {
  rest: "bg-muted/30 border border-dashed border-muted-foreground/30 text-muted-foreground/40",
  bare: "bg-amber-500/15 text-amber-700/60 dark:text-amber-400/60",
  sprout: "bg-emerald-500/20 text-emerald-800/70 dark:text-emerald-200/70",
  sapling: "bg-emerald-500/40 text-emerald-900/80 dark:text-emerald-100/80",
  leafy: "bg-emerald-500/70 text-emerald-950 dark:text-emerald-50",
  bloom: "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]",
};

function GrowthCell({ pct, due, isToday, title, dayNum }: { pct: number; due: number; isToday: boolean; title: string; dayNum?: number }) {
  const stage = growthStage(pct, due);
  
  return (
    <div
      className={`relative aspect-square rounded-xl flex items-center justify-center font-medium text-xs sm:text-sm transition-all ${STAGE_CLASSES[stage]} ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
      title={title}
    >
      {dayNum}
      {stage === "bloom" && (
        <Sparkles className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
      )}
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

  const calendar = useMemo(() => {
    const y = today.getFullYear();
    const m = today.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay(); 
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

  const individualHabits = s.habits.filter((h) => h.kind === "individual");
  const weeklyIndividual = useMemo(() => {
    const cutoffs: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      cutoffs.push(todayISO(d));
    }
    return individualHabits.map((h) => ({
      id: h.id,
      emoji: h.emoji,
      name: h.name,
      count: h.individualLogs.filter((d) => cutoffs.includes(d)).length,
    })).sort((a, b) => b.count - a.count);
  }, [individualHabits, today]);

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
            <Leaf className="w-4 h-4 text-emerald-500" /> Your ecosystem, {monthLabel}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-[10px] uppercase font-semibold text-muted-foreground/60 text-center">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d[0]}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
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
                dayNum={dayNum}
              />
            );
          })}
        </div>
        
        <div className="mt-5 flex items-center justify-between text-[11px] font-medium text-muted-foreground px-1">
          <div className="flex items-center gap-1.5">
            <span>Rest</span>
            <div className={`w-5 h-5 rounded-md ${STAGE_CLASSES.rest}`} />
          </div>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            {(["bare", "sprout", "sapling", "leafy", "bloom"] as const).map((stage) => (
              <div key={stage} className={`w-5 h-5 rounded-md flex items-center justify-center ${STAGE_CLASSES[stage]}`}>
                 {stage === "bloom" && <Sparkles className="w-2.5 h-2.5 text-white fill-white" />}
              </div>
            ))}
            <span>More</span>
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
        <div className="flex items-center justify-between mb-4">
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
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyIndividual} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
              {/* Uses only the emoji for the bottom axis label to keep it ultra-clean */}
              <XAxis 
                dataKey="emoji" 
                fontSize={18} 
                tickLine={false} 
                axisLine={false} 
                dy={8} 
              />
              <YAxis 
                allowDecimals={false} 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'currentColor', opacity: 0.8 }} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                formatter={(v: number) => [`${v} log${v === 1 ? "" : "s"}`, "Total"]} 
              />
              <Bar dataKey="count" fill="hsl(160 55% 45%)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass-pop rounded-3xl p-4 mb-4">
        <div className="text-sm font-medium mb-4">Focus minutes, last 15 days</div>
        {s.focusSessions.length === 0 ? (
          <Empty text="Start a focus session to see it here." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={focusData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(20 80% 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(20 80% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.8 }} dy={10} minTickGap={20} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.8 }} />
              <Tooltip cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v: number) => `${v} min`} />
              <Area type="monotone" dataKey="minutes" stroke="hsl(20 80% 60%)" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
            </AreaChart>
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