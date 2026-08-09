import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2, Sparkles, Check, X, Flame, Bell, BellOff, Moon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAppState,
  markCompleted,
  markMissed,
  clearToday,
  removeHabit,
  todayISO,
  isDueOn,
  dayProgress,
  daysInMonth,
  habitStreak,
  overallStreak,
  setHabitReminder,
} from "@/lib/store";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { GameScene } from "@/components/GameScene";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily rituals · Sprout" },
      { name: "description", content: "Your daily rituals that grow the main world." },
      { property: "og:title", content: "Daily rituals · Sprout" },
      { property: "og:description", content: "Your daily rituals that grow the main world." },
    ],
  }),
  component: DailyPage,
});

function DailyPage() {
  const s = useAppState();
  const [addOpen, setAddOpen] = useState(false);
  const today = new Date();
  const iso = todayISO(today);
  const cap = daysInMonth(today);

  const dueToday = useMemo(
    () => s.habits.filter((h) => h.kind === "daily" && isDueOn(h, today)),
    [s.habits],
  );
  const otherDaily = s.habits.filter((h) => h.kind === "daily" && !isDueOn(h, today));
  const { pct, done, due } = dayProgress(s.habits, today);
  const streak = overallStreak(s.habits, today);
  const unmarked = dueToday.filter(
    (h) => !h.completedDates.includes(iso) && !h.missedDates.includes(iso),
  ).length;


  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-2xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div className="flex items-end gap-3">
          <Link to="/" className="w-9 h-9 mb-1 rounded-full glass-soft flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h1 className="font-display text-3xl md:text-4xl">Daily rituals</h1>
          </div>
        </div>

        <Button onClick={() => setAddOpen(true)} size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {/* Unified card: game + today's progress + rituals list */}
      <div data-tour="daily-card" className="glass-pop rounded-3xl p-4 mb-4">
        {s.game && (
          <>
            <GameScene kind={s.game.kind} stage={s.game.stage} health={s.game.health} pct={pct} />
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Last step: <span className="text-foreground font-medium">Stage {Math.max(0, s.game.stage - 1)}</span>
              </span>
              <span>
                Next: <span className="text-foreground font-medium">Stage {Math.min(cap, s.game.stage + 1)}</span>
              </span>
            </div>
          </>
        )}

        <div className="mt-4 pt-4 border-t border-white/40">
          <div className="flex items-center gap-2 mb-3">
            <div className="glass-soft rounded-2xl px-3 py-2 flex items-center gap-2 flex-1">
              <Flame className={cn("w-4 h-4", streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
              <div className="leading-tight">
                <div className="text-sm font-medium">{streak} day{streak === 1 ? "" : "s"}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current streak</div>
              </div>
            </div>
            <div className="glass-soft rounded-2xl px-3 py-2 flex items-center gap-2 flex-1">
              <Moon className="w-4 h-4 text-primary" />
              <div className="leading-tight">
                <div className="text-sm font-medium">11:00 PM</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">World updates</div>
              </div>
            </div>
          </div>
          {unmarked > 0 && (
            <div className="text-[11px] text-muted-foreground mb-2">
              {unmarked} still unmarked. Anything left blank by midnight won't move your world either way.
            </div>
          )}
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-sm font-medium">Today's progress</div>
              <div className="text-[11px] text-muted-foreground">
                {done} of {due} ritual{due === 1 ? "" : "s"} completed
              </div>
            </div>
            <div className="text-right leading-none">
              <span className="font-display text-3xl">{pct}</span>
              <span className="text-sm text-muted-foreground">%</span>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                Completion rate
              </div>
            </div>
          </div>
          <div className="h-3 rounded-full bg-white/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(pct, pct > 0 ? 6 : 3)}%`,
                background:
                  pct >= 80
                    ? "linear-gradient(90deg, #7bc48a, #4ea36b)"
                    : pct >= 51
                      ? "linear-gradient(90deg, #ffd76a, #ff9c3a)"
                      : "linear-gradient(90deg, #ff9ec2, #ff6b6b)",
                opacity: pct === 0 ? 0.35 : 1,
              }}
            />
          </div>


          <div className="mt-4 space-y-2">
            {dueToday.length === 0 && s.habits.filter((h) => h.kind === "daily").length > 0 && (
              <div className="glass-soft rounded-2xl p-4 text-center">
                <Sparkles className="w-5 h-5 mx-auto mb-1 text-primary" />
                <div className="font-medium text-sm">Rest day</div>
                <div className="text-xs text-muted-foreground">
                  No rituals scheduled for today.
                </div>
              </div>
            )}

            {s.habits.filter((h) => h.kind === "daily").length === 0 && (
              <div className="glass-soft rounded-2xl p-4 text-center">
                <div className="font-medium text-sm">No daily rituals yet</div>
                <div className="text-xs text-muted-foreground">
                  Add one to start growing your world.
                </div>
              </div>
            )}

            {dueToday.map((h) => {
              const isDone = h.completedDates.includes(iso);
              const isMissed = h.missedDates.includes(iso);
              const hStreak = habitStreak(h, today);
              return (
                <div
                  key={h.id}
                  className={cn(
                    "glass-soft rounded-2xl p-3 transition",
                    isDone && "bg-primary/10",
                    isMissed && "bg-destructive/10",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full glass flex items-center justify-center text-lg shrink-0">
                      {h.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "font-medium truncate text-sm",
                          isDone && "line-through text-muted-foreground",
                          isMissed && "text-destructive",
                        )}
                      >
                        {h.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {isDone ? "Completed today" : isMissed ? "Missed today" : "Pending"} · {h.completedDates.length} done
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => (isDone ? clearToday(h.id) : markCompleted(h.id))}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition",
                          isDone ? "bg-primary text-primary-foreground" : "glass hover:bg-primary/20",
                        )}
                        title="Completed"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => (isMissed ? clearToday(h.id) : markMissed(h.id))}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition",
                          isMissed
                            ? "bg-destructive text-destructive-foreground"
                            : "glass hover:bg-destructive/20",
                        )}
                        title="Missed"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeHabit(h.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-white/40 flex items-center gap-2">
                    <div
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium flex items-center gap-1",
                        hStreak > 0 ? "bg-orange-500/15 text-orange-600" : "bg-white/50 text-muted-foreground",
                      )}
                      title="Current streak"
                    >
                      <Flame className="w-3 h-3" />
                      {hStreak} day{hStreak === 1 ? "" : "s"}
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={() => setHabitReminder(h.id, h.reminderTime ? null : "08:00")}
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition",
                          h.reminderTime ? "bg-primary/15 text-primary" : "glass text-muted-foreground",
                        )}
                        title={h.reminderTime ? "Turn reminder off" : "Turn reminder on"}
                      >
                        {h.reminderTime ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                      </button>
                      <input
                        type="time"
                        value={h.reminderTime ?? ""}
                        disabled={!h.reminderTime}
                        onChange={(e) => setHabitReminder(h.id, e.target.value || null)}
                        aria-label={`Reminder time for ${h.name}`}
                        className="h-7 px-2 rounded-full bg-white/60 border border-white/60 text-[11px] focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 w-[92px]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {otherDaily.length > 0 && (
        <>
          <div className="mt-6 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Not scheduled today
          </div>
          <div className="space-y-2">
            {otherDaily.map((h) => (
              <div key={h.id} className="glass-soft rounded-2xl p-3 flex items-center gap-3 opacity-70">
                <div className="w-8 h-8 rounded-full glass flex items-center justify-center">{h.emoji}</div>
                <div className="flex-1 text-sm">{h.name}</div>
                <button
                  onClick={() => removeHabit(h.id)}
                  className="text-muted-foreground hover:text-destructive p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <AddHabitDialog open={addOpen} onOpenChange={setAddOpen} defaultKind="daily" />
    </div>
  );
}