import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ListChecks, BookHeart, Wand2, Timer, ChevronRight, Apple } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useAppState,
  useDaysSinceFirstOpen,
  requestNotifPermission,
  forceEndDay,
  logIndividual,
  dayProgress,
  todayISO,
  isDueOn,
  MAX_STAGE,
} from "@/lib/store";
import { AccountDialog } from "@/components/AccountDialog";
import { Onboarding } from "@/components/Onboarding";
import { TreeGame } from "@/components/games/TreeGame";
import { SpaceGame } from "@/components/games/SpaceGame";
import { CatGame } from "@/components/games/CatGame";
import { TreehouseGame } from "@/components/games/TreehouseGame";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sprout — Grow habits, grow a world" },
      { name: "description", content: "A cozy habit tracker where your daily rituals, personal activities, focus sessions and journaling all shape a tiny living world." },
      { property: "og:title", content: "Sprout — Grow habits, grow a world" },
      { property: "og:description", content: "A cozy habit tracker where your daily rituals, personal activities, focus sessions and journaling all shape a tiny living world." },
    ],
  }),
  component: Index,
});

function Index() {
  const s = useAppState();
  if (!s.onboarded || !s.game) return <Onboarding />;
  return <Hub />;
}

function Hub() {
  const s = useAppState();
  const days = useDaysSinceFirstOpen();
  const [acctOpen, setAcctOpen] = useState(false);

  useEffect(() => {
    if (days >= 7 && !s.hasAccount) setAcctOpen(true);
  }, [days, s.hasAccount]);

  const today = new Date();
  const { pct, done, due } = dayProgress(s.habits, today);
  const dueToday = s.habits.filter((h) => isDueOn(h, today)).slice(0, 3);
  const dailyTotal = s.habits.filter((h) => h.kind === "daily").length;
  const individual = s.habits.filter((h) => h.kind === "individual");

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="font-display text-3xl md:text-4xl">Your world</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              const p = await requestNotifPermission();
              toast(p === "granted" ? "Notifications on 🔔" : "Notifications off");
            }}
            className="rounded-full glass-soft"
          >
            <Bell className="w-4 h-4" />
          </Button>
          {!s.hasAccount && (
            <Button onClick={() => setAcctOpen(true)} variant="ghost" className="glass-soft rounded-full text-xs">
              Save progress
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Daily section — with game snapshot and preview of 3 tasks */}
        <Link to="/daily" data-tour="home-daily" className="glass-pop rounded-3xl p-4 block group">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ListChecks className="w-3 h-3" /> Daily rituals
              </div>
              <div className="font-display text-xl">Today's rituals</div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition" />
          </div>

          <div className="grid grid-cols-[112px_1fr] gap-3">
            <div className="aspect-square rounded-2xl overflow-hidden glass-soft">
              <GameThumb />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{done}/{due} done today</span>
                <span>{dailyTotal} scheduled</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/50 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background:
                      pct >= 80
                        ? "linear-gradient(90deg, #7bc48a, #4ea36b)"
                        : pct >= 51
                          ? "linear-gradient(90deg, #ffd76a, #ff9c3a)"
                          : "linear-gradient(90deg, #ff9ec2, #ff6b6b)",
                  }}
                />
              </div>
              {dueToday.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nothing scheduled today — rest well.</div>
              ) : (
                <div className="space-y-1">
                  {dueToday.map((h) => {
                    const iso = todayISO();
                    const done = h.completedDates.includes(iso);
                    const missed = h.missedDates.includes(iso);
                    return (
                      <div key={h.id} className="flex items-center gap-2 text-sm">
                        <span>{h.emoji}</span>
                        <span className={`truncate ${done ? "line-through text-muted-foreground" : missed ? "text-destructive" : ""}`}>
                          {h.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Tap to open Daily</span>
            <button
              onClick={(e) => { e.preventDefault(); forceEndDay(); toast.success("Day ended — world updated"); }}
              className="underline hover:text-foreground"
            >
              End day now
            </button>
          </div>
        </Link>

        {/* Personal activities — preview + history glance */}
        <Link to="/personal" data-tour="home-personal" className="glass-pop rounded-3xl p-4 block group">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Personal activities
              </div>
              <div className="font-display text-xl">At your own pace</div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition" />
          </div>
          {individual.length === 0 ? (
            <div className="text-sm text-muted-foreground py-3">
              No personal activities yet — tap to add one.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {individual.slice(0, 4).map((h) => {
                const last = h.individualLogs[h.individualLogs.length - 1];
                return (
                  <div key={h.id} className="glass-soft rounded-2xl p-2 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/60 shrink-0">
                      {h.gameKind === "space" ? <SpaceGame stage={h.individualStage} health={80} />
                        : h.gameKind === "cat" ? <CatGame stage={h.individualStage} health={80} />
                        : h.gameKind === "treehouse" ? <TreehouseGame stage={h.individualStage} health={80} />
                        : <TreeGame stage={Math.min(MAX_STAGE, h.individualStage)} health={80} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {h.emoji} {h.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {h.individualLogs.length} logs · last {last ? (last === todayISO() ? "today" : last.slice(5)) : "—"}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); logIndividual(h.id); toast.success(`+1 for ${h.name}`); }}
                      className="text-xs rounded-full px-2 py-1 bg-primary text-primary-foreground"
                    >
                      +1
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Link>

        {/* Focus session hub card */}
        <Link to="/focus" data-tour="home-focus" className="glass-pop rounded-3xl p-4 flex items-center gap-4 group">
          <div className="w-11 h-11 rounded-full bg-accent/60 text-accent-foreground flex items-center justify-center">
            <Timer className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg">Focus session</div>
            <div className="text-xs text-muted-foreground">
              {s.activeFocus
                ? `In progress: ${s.activeFocus.name}`
                : "Open-ended, or plan work/rest intervals"}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Apple className="w-3.5 h-3.5 text-red-500" /> {s.totalFruits}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition" />
        </Link>

        {/* Journal */}
        <Link to="/journal" data-tour="home-journal" className="glass-pop rounded-3xl p-4 flex items-center gap-4 group">
          <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <BookHeart className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg">Journal</div>
            <div className="text-xs text-muted-foreground">
              Reflect on your day · a kitten will keep you company
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition" />
        </Link>

      </div>

      <AccountDialog open={acctOpen} onOpenChange={setAcctOpen} />

    </div>
  );
}

function GameThumb() {
  const s = useAppState();
  if (!s.game) return null;
  const { kind, stage, health } = s.game;
  return (
    <div className="w-full h-full">
      {kind === "tree" && <TreeGame stage={stage} health={health} />}
      {kind === "space" && <SpaceGame stage={stage} health={health} />}
      {kind === "cat" && <CatGame stage={stage} health={health} />}
      {kind === "treehouse" && <TreehouseGame stage={stage} health={health} />}
    </div>
  );
}

