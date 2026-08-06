import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Play, Pause, Square, Apple, Infinity as InfIcon, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useAppState,
  startFocus,
  pauseFocus,
  resumeFocus,
  endFocus,
  focusElapsedMs,
} from "@/lib/store";
import { FarmerGame } from "@/components/games/FarmerGame";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/focus")({
  head: () => ({
    meta: [
      { title: "Focus session — Sprout" },
      { name: "description", content: "Focus for as long as you like — or plan work/rest intervals." },
      { property: "og:title", content: "Focus session — Sprout" },
      { property: "og:description", content: "Focus for as long as you like — or plan work/rest intervals." },
    ],
  }),
  component: FocusPage,
});

function FocusPage() {
  const s = useAppState();
  const [name, setName] = useState("Reading");
  const [mode, setMode] = useState<"infinite" | "interval">("infinite");
  const [workMin, setWorkMin] = useState(25);
  const [restMin, setRestMin] = useState(5);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!s.activeFocus?.running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [s.activeFocus?.running]);

  const active = s.activeFocus;
  const elapsed = active ? focusElapsedMs(active, now) : 0;
  const fruits = Math.floor(elapsed / 60000);

  // If interval mode, figure out current phase
  let phase: "work" | "rest" | null = null;
  let phaseRemaining = 0;
  if (active?.mode === "interval" && active.plan) {
    const cycleMs = (active.plan.workMin + active.plan.restMin) * 60000;
    const t = elapsed % cycleMs;
    const workMs = active.plan.workMin * 60000;
    if (t < workMs) {
      phase = "work";
      phaseRemaining = workMs - t;
    } else {
      phase = "rest";
      phaseRemaining = cycleMs - t;
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Focus</div>
        <h1 className="font-display text-3xl md:text-4xl">One-thing session</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a task and stay with it. Every minute you keep going, a fruit is plucked from the tree
          and dropped in the basket.
        </p>
      </div>

      {!active && (
        <div data-tour="focus-setup" className="glass-pop rounded-3xl p-4 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              What are you focusing on?
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reading, Writing, Deep work…"
              className="bg-white/60"
            />
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Mode</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("infinite")}
                className={cn(
                  "glass-soft rounded-2xl p-3 text-left transition",
                  mode === "infinite" && "ring-2 ring-primary",
                )}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <InfIcon className="w-4 h-4" /> Open-ended
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Go as long as you like. End it whenever.
                </div>
              </button>
              <button
                onClick={() => setMode("interval")}
                className={cn(
                  "glass-soft rounded-2xl p-3 text-left transition",
                  mode === "interval" && "ring-2 ring-primary",
                )}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Timer className="w-4 h-4" /> Planned intervals
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Alternating work and rest, on repeat.
                </div>
              </button>
            </div>
          </div>

          {mode === "interval" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Work minutes</div>
                <Input
                  type="number"
                  min={1}
                  value={workMin}
                  onChange={(e) => setWorkMin(Math.max(1, +e.target.value || 1))}
                  className="bg-white/60"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Rest minutes</div>
                <Input
                  type="number"
                  min={1}
                  value={restMin}
                  onChange={(e) => setRestMin(Math.max(1, +e.target.value || 1))}
                  className="bg-white/60"
                />
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              if (!name.trim()) return;
              startFocus(
                name.trim(),
                mode === "interval"
                  ? { mode, plan: { workMin, restMin } }
                  : { mode: "infinite" },
              );
            }}
            className="rounded-xl w-full"
          >
            <Play className="w-4 h-4 mr-1" /> Start focus session
          </Button>
        </div>
      )}

      {active && (
        <div className="glass-pop rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-xl">{active.name}</div>
              <div className="text-xs text-muted-foreground">
                {active.mode === "interval" && active.plan
                  ? `Intervals · ${active.plan.workMin}m work / ${active.plan.restMin}m rest`
                  : "Open-ended session"}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Apple className="w-4 h-4 text-red-500" /> {s.totalFruits}
            </div>
          </div>

          {phase && (
            <div
              className={cn(
                "rounded-2xl p-3 text-sm flex items-center justify-between",
                phase === "work" ? "bg-primary/15" : "bg-accent/40",
              )}
            >
              <span className="font-medium">
                {phase === "work" ? "🌿 Working…" : "☕️ Rest — breathe"}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatMs(phaseRemaining)} left
              </span>
            </div>
          )}

          <div className="aspect-square w-full rounded-2xl overflow-hidden glass-soft">
            <FarmerGame fruits={fruits} elapsedMs={elapsed} running={active.running} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-sm min-w-0">
              <div className="font-medium truncate">
                {active.running ? "In progress" : "Paused"}
              </div>
              <div className="text-xs text-muted-foreground">
                Elapsed {formatMs(elapsed)}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {active.running ? (
                <Button variant="secondary" onClick={pauseFocus} className="rounded-xl">
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="secondary" onClick={resumeFocus} className="rounded-xl">
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={() => {
                  endFocus();
                  toast.success(`Session ended — you picked ${fruits} fruit${fruits === 1 ? "" : "s"} 🍎`);
                }}
                className="rounded-xl"
              >
                <Square className="w-4 h-4 mr-1" /> End
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
