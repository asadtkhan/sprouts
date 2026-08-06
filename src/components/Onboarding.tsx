import { useState } from "react";
import { AddHabitDialog } from "./AddHabitDialog";
import { GAMES } from "@/lib/presets";
import { setGame, completeOnboarding, useAppState, type GameKind } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Onboarding() {
  const state = useAppState();
  const [step, setStep] = useState<1 | 2 | 3>(state.habits.length === 0 ? 1 : 2);
  const [addOpen, setAddOpen] = useState(false);
  const [pickedGame, setPickedGame] = useState<GameKind | null>(null);

  // if habits exist and no game yet, jump to game step
  if (state.habits.length > 0 && step === 1) setStep(2);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-strong rounded-3xl max-w-xl w-full p-8">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Step {step} of 3
          </div>
          <h1 className="font-display text-3xl mt-1 text-balance">
            {step === 1 && "Welcome to Sprout"}
            {step === 2 && "Pick a game to grow"}
            {step === 3 && "You're all set"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-balance">
            {step === 1 && "Build habits that quietly grow something adorable each day."}
            {step === 2 && "Your daily habits fuel this world. One habit or many — they all feed the same game."}
            {step === 3 && "Complete your habits today. At 10 PM your world updates."}
          </p>
        </div>

        {step === 1 && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Start with one habit — you can add more later.
            </p>
            <Button className="rounded-xl w-full" onClick={() => setAddOpen(true)}>
              + Add your first habit
            </Button>
            {state.habits.length > 0 && (
              <div className="mt-4 space-y-2">
                {state.habits.map((h) => (
                  <div key={h.id} className="glass-soft rounded-xl px-4 py-2 text-sm flex items-center gap-2">
                    <span>{h.emoji}</span>
                    <span>{h.name}</span>
                  </div>
                ))}
                <Button
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl mt-2"
                  variant="default"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {GAMES.map((g) => (
              <button
                key={g.kind}
                onClick={() => setPickedGame(g.kind)}
                className={cn(
                  "w-full glass-soft rounded-2xl p-4 text-left flex items-center gap-4 transition hover:scale-[1.01]",
                  pickedGame === g.kind && "ring-2 ring-primary",
                )}
              >
                <div className="text-3xl">{g.emoji}</div>
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-muted-foreground">{g.tagline}</div>
                </div>
              </button>
            ))}
            <Button
              onClick={() => {
                if (pickedGame) {
                  setGame(pickedGame);
                  setStep(3);
                }
              }}
              disabled={!pickedGame}
              className="w-full rounded-xl mt-2"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="glass-soft rounded-2xl p-4 text-sm">
              <div className="font-medium mb-1">How your world grows</div>
              <ul className="text-muted-foreground space-y-1.5 list-disc pl-5">
                <li>Finish most of your rituals for the day and your world takes a happy step forward — the plant looks greener, the rocket edges closer, the kitty gets a little bigger.</li>
                <li>Get through about half of them and things hold steady — a gentle nudge to push a little more.</li>
                <li>Slip and miss most of your rituals and your world starts to droop — the plant wilts, the fuel runs low, the kitten looks a bit under the weather.</li>
                <li>Miss a whole day and your world takes a real hit. It's never over though — one good day starts turning it around.</li>
              </ul>
            </div>
            <Button onClick={() => completeOnboarding()} className="w-full rounded-xl">
              Enter my world
            </Button>
          </div>
        )}

      </div>

      <AddHabitDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
