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
import { useAppState, isDueOn, todayISO, dayProgress, daysInMonth, overallStreak } from "@/lib/store";

export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "Tracking — Sprout" },
      { name: "description", content: "Monthly calendar and weekly rhythms for your habits." },
      { property: "og:title", content: "Tracking — Sprout" },
      { property: "og:description", content: "Monthly calendar and weekly rhythms for your habits." },
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


      <div data-tour="tracking-calendar" className="glass-pop rounded-3xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Daily completion — {monthLabel}</div>
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
            <div
              key={p}
              className="w-4 h-4 rounded"
              style={{ background: cellColor(p, 1).bg }}
            />
          ))}
          <span>More</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-white/40 border border-dashed border-muted-foreground" />
            <span>rest</span>
          </div>
        </div>
      </div>

      <div className="glass-pop rounded-3xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Personal activities — last 7 days</div>
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
        <div className="text-sm font-medium mb-3">Focus minutes — last 15 days</div>
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
