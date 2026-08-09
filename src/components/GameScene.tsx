import type { GameKind } from "@/lib/store";
import { daysInMonth } from "@/lib/store";
import { TreeGame } from "./games/TreeGame";
import { SpaceGame } from "./games/SpaceGame";
import { CatGame } from "./games/CatGame";
import { TreehouseGame } from "./games/TreehouseGame";

interface Props {
  kind: GameKind;
  stage: number;
  health: number;
  pct: number;
}

export function GameScene({ kind, stage, health, pct }: Props) {
  const banner = getBanner(kind, pct, health);
  const cap = daysInMonth();
  return (
    <div className="relative w-full">
      <div className="glass-strong rounded-3xl overflow-hidden p-4">
        <div className="aspect-square w-full">
          {kind === "tree" && <TreeGame stage={stage} health={health} />}
          {kind === "space" && <SpaceGame stage={stage} health={health} />}
          {kind === "cat" && <CatGame stage={stage} health={health} />}
          {kind === "treehouse" && <TreehouseGame stage={stage} health={health} />}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Stage</span>
            <span className="font-semibold text-foreground">
              {stage} / {cap}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Health</span>
            <div className="w-24 h-2 rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${health}%`,
                  background:
                    health > 70
                      ? "linear-gradient(90deg, #7bc48a, #4ea36b)"
                      : health > 40
                        ? "linear-gradient(90deg, #ffd76a, #ff9c3a)"
                        : "linear-gradient(90deg, #ff8a8a, #d94a4a)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {banner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap max-w-[90%] text-center">
          {banner}
        </div>
      )}
    </div>
  );
}

function getBanner(kind: GameKind, pct: number, health: number): string | null {
  if (pct >= 80) {
    if (kind === "tree") return "🌸 Your plant feels greener today!";
    if (kind === "space") return "🚀 Boosters engaged, planet in sight!";
    if (kind === "cat") return "🐾 Kitty is purring happily!";
    return "🔨 Another plank in place, looking cozy!";
  }
  if (pct >= 51) {
    if (kind === "tree") return "🌿 A little more today and your plant will thrive";
    if (kind === "space") return "⏳ Keep going and you'll reach the planet in time";
    if (kind === "cat") return "🥣 Kitty could use a little more love";
    return "🪵 Keep at it, the treehouse could use more wood";
  }
  if (health < 50) {
    if (kind === "tree") return "🥀 Your plant is wilting…";
    if (kind === "space") return "⛽ Fuel is running low for the mission";
    if (kind === "cat") return "🤒 Kitty is feeling under the weather…";
    return "⛈️ A storm is wearing down the treehouse…";
  }
  return null;
}
