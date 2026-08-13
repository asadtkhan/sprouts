import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ListChecks, Wand2, ChevronRight, Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useAppState,
  shouldPromptSignup,
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
import { CarRace } from "@/components/games/CarRace";
import { BikeTrip } from "@/components/games/BikeTrip";
import { useRaces, idleDays } from "@/lib/race";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sprout · Grow habits, Feel gratified" },
      { name: "description", content: "A cozy habit tracker where your daily rituals, personal activities, focus sessions and journaling all shape a tiny living world." },
      { property: "og:title", content: "Grow habits, Feel gratified" },
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
  const [acctOpen, setAcctOpen] = useState(false);

  useEffect(() => {
    if (shouldPromptSignup(s)) setAcctOpen(true);
  }, [s]);

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
                <div className="text-xs text-muted-foreground">Nothing scheduled today. Rest well.</div>
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
              onClick={(e) => { e.preventDefault(); forceEndDay(); toast.success("Day ended. Your world updated."); }}
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
            <div className="flex flex-col items-center justify-center gap-1.5 text-center py-6 min-h-[92px]">
              <Wand2 className="w-5 h-5 text-muted-foreground/60" />
              <div className="text-sm text-muted-foreground">Nothing here yet. Tap to start your first one.</div>
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

        {/* Multiplayer */}
        <Link to="/friends" data-tour="home-friends" className="glass-pop rounded-3xl p-4 block group">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Flag className="w-3 h-3" /> Multiplayer
              </div>
              <div className="font-display text-xl">Build habits with friends</div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition" />
          </div>
          <RaceThumb />
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

function RaceThumb() {
    const { entries } = useRaces();
  if (entries.length === 0) {
    return (
      <div>
        <CarRace meName="You" meStep={2} oppName="Friend" oppStep={4} compact />
        <div className="mt-2 text-sm text-muted-foreground">
          Push each other in a car race, or do it together on a bike ride to the mountains.
        </div>
      </div>
    );
  }
  const { race, me, opponent } = entries[0];
  const collab = race.mode === "collab";
  return (
    <div>
      {collab ? (
        <BikeTrip
          step={race.team_step}
          idle={idleDays(race)}
          riderA={me.name}
          riderB={opponent?.name ?? null}
          compact
        />
      ) : (
        <CarRace
          meName={`${me.name} (you)`}
          meStep={me.step}
          oppName={opponent?.name ?? null}
          oppStep={opponent ? opponent.step : null}
          compact
        />
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{race.activity}</span>
        <span>
          {collab
            ? `Stage ${race.team_step}`
            : `You ${me.step} · ${opponent ? `${opponent.name} ${opponent.step}` : `Code ${race.code}`}`}
          </span>
      </div>
      {entries.length > 1 && (
        <div className="mt-1 text-xs text-muted-foreground">+{entries.length - 1} more shared game(s)</div>
      )}
    </div>
  )
}