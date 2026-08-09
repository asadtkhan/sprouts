import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Wand2, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useAppState,
  logIndividual,
  removeHabit,
  INDIVIDUAL_MAX_STAGE,
  todayISO,
  hasLoggedToday,
  unlogIndividual,
  type GameKind,
} from "@/lib/store";
import { TreeGame } from "@/components/games/TreeGame";
import { SpaceGame } from "@/components/games/SpaceGame";
import { CatGame } from "@/components/games/CatGame";
import { TreehouseGame } from "@/components/games/TreehouseGame";
import { AddHabitDialog } from "@/components/AddHabitDialog";

export const Route = createFileRoute("/personal")({
  head: () => ({
    meta: [
      { title: "Personal activities · Sprout" },
      { name: "description", content: "Personal activities, each with its own little world to grow." },
      { property: "og:title", content: "Personal activities · Sprout" },
      { property: "og:description", content: "Personal activities, each with its own little world to grow." },
    ],
  }),
  component: PersonalPage,
});

function GameFor({ kind, stage }: { kind: GameKind; stage: number }) {
  const health = 80;
  if (kind === "space") return <SpaceGame stage={stage} health={health} />;
  if (kind === "cat") return <CatGame stage={stage} health={health} />;
  if (kind === "treehouse") return <TreehouseGame stage={stage} health={health} />;
  return <TreeGame stage={stage} health={health} />;
}

function PersonalPage() {
  const s = useAppState();
  const [addOpen, setAddOpen] = useState(false);
  const items = useMemo(() => s.habits.filter((h) => h.kind === "individual"), [s.habits]);

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-2xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Wand2 className="w-3 h-3" /> Your own pace
          </div>
          <h1 className="font-display text-3xl md:text-4xl">Personal activities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Anything you do in your own time. Every log grows its own little world.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {items.length === 0 ? (
        <div data-tour="personal-list">
          <Link to="/" className="glass-pop rounded-2xl p-6 text-center block">
            <div className="font-medium">Nothing here yet</div>
            <div className="text-sm text-muted-foreground mt-1">
              Tap Add to start one, like "Play guitar" or "Sketch"
            </div>
          </Link>
        </div>
      ) : (
        <div data-tour="personal-list" className="space-y-4">
        {items.map((h) => {
          const kind: GameKind = h.gameKind ?? "tree";
          const lastDate = h.individualLogs[h.individualLogs.length - 1];
          const recent = h.individualLogs.slice(-10).reverse();
          const pct = Math.round((h.individualStage / INDIVIDUAL_MAX_STAGE) * 100);
          const loggedToday = hasLoggedToday(h);
          return (
            <div key={h.id} className="glass-pop rounded-3xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{h.emoji}</span>
                  <div className="font-display text-lg truncate">{h.name}</div>
                </div>
                <button
                  onClick={() => removeHabit(h.id)}
                  className="text-muted-foreground hover:text-destructive p-2"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="aspect-square w-full rounded-2xl overflow-hidden glass-soft mb-3">
                <GameFor kind={kind} stage={Math.min(INDIVIDUAL_MAX_STAGE, h.individualStage)} />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>
                  Stage {h.individualStage} / {INDIVIDUAL_MAX_STAGE}
                </span>
                <span>{loggedToday ? "Counted today · " : ""}{h.individualLogs.length} total logs {lastDate ? `· last ${lastDate === todayISO() ? "today" : lastDate.slice(5)}` : ""}</span>
              </div>
              <div className="h-2 rounded-full bg-white/50 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    logIndividual(h.id);
                    toast.success(`Marked done for today. ${h.name} grows tonight.`);
                  }}
                >
                  <Check className="w-4 h-4 mr-1" /> {loggedToday ? "Done today" : "I did it"}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    unlogIndividual(h.id);
                    toast("Marked as not done for today.");
                  }}
                >
                  <X className="w-4 h-4 mr-1" /> Didn't
                </Button>
              </div>

              {recent.length > 0 && (
                <div className="mt-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                    Recent history
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((d, i) => (
                      <span
                        key={i}
                        className="glass-soft rounded-full px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {d === todayISO() ? "Today" : d.slice(5)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}

      <AddHabitDialog open={addOpen} onOpenChange={setAddOpen} defaultKind="individual" />
    </div>
  );
}
