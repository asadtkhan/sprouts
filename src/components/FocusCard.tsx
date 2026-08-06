import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, Apple } from "lucide-react";
import {
  useAppState,
  startFocus,
  pauseFocus,
  resumeFocus,
  endFocus,
  focusElapsedMs,
} from "@/lib/store";
import { FarmerGame } from "./games/FarmerGame";
import { toast } from "sonner";

export function FocusCard() {
  const s = useAppState();
  const [name, setName] = useState("Reading");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!s.activeFocus?.running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [s.activeFocus?.running]);

  const active = s.activeFocus;
  const elapsed = active ? focusElapsedMs(active, now) : 0;
  const fruits = Math.floor(elapsed / 60000);

  return (
    <div className="glass rounded-3xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-xl">Focus session</div>
          <div className="text-xs text-muted-foreground">
            A one-time task — a fruit is plucked every minute you keep going.
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Apple className="w-4 h-4 text-red-500" /> {s.totalFruits}
        </div>
      </div>

      {!active && (
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Reading, Deep work…"
            className="bg-white/60"
          />
          <Button
            onClick={() => {
              if (!name.trim()) return;
              startFocus(name.trim());
            }}
            className="rounded-xl shrink-0"
          >
            <Play className="w-4 h-4 mr-1" /> Start
          </Button>
        </div>
      )}

      {active && (
        <>
          <div className="aspect-square w-full rounded-2xl overflow-hidden glass-soft">
            <FarmerGame fruits={fruits} elapsedMs={elapsed} running={active.running} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm min-w-0">
              <div className="font-medium truncate">{active.name}</div>
              <div className="text-xs text-muted-foreground">
                {active.running ? "In progress" : "Paused"}
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
        </>
      )}
    </div>
  );
}
