import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Flag, Trophy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarRace } from "@/components/games/CarRace";
import {
  RACE_LEVELS,
  advanceMyCar,
  createRace,
  joinRace,
  leaveRace,
  skipToday,
  todayDate,
  useRace,
} from "@/lib/race";

export const Route = createFileRoute("/race")({
  head: () => ({
    meta: [
      { title: "Friend race · Sprout" },
      { name: "description", content: "Race a friend car-by-car: every day you both keep your shared activity, your cars move one lap closer to the finish line." },
      { property: "og:title", content: "Friend race · Sprout" },
      { property: "og:description", content: "Race a friend car-by-car: every day you both keep your shared activity, your cars move one lap closer to the finish line." },
    ],
  }),
  component: RacePage,
});

function RacePage() {
  const { loading, race, me, opponent, refresh } = useRace();

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="w-9 h-9 rounded-full glass-soft flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Multiplayer</div>
          <h1 className="font-display text-3xl">Friend race</h1>
        </div>
      </div>

      {loading ? (
        <div className="glass-pop rounded-3xl p-6 text-sm text-muted-foreground">Loading your race…</div>
      ) : race && me ? (
        <RaceBoard race={race} me={me} opponent={opponent} refresh={refresh} />
      ) : (
        <RaceSetup onDone={refresh} />
      )}
    </div>
  );
}

function RaceSetup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [activity, setActivity] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !activity.trim()) return toast.error("Add your name and the activity");
    setBusy(true);
    try {
      const c = await createRace("compete", activity.trim(), name.trim());
      toast.success(`Race created. Share code ${c}`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the race");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!name.trim() || !code.trim()) return toast.error("Add your name and the race code");
    setBusy(true);
    try {
      await joinRace(code, name.trim());
      toast.success("You're in the race!");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not join the race");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-pop rounded-3xl p-4">
        <CarRace meName="You" meStep={3} oppName="Friend" oppStep={5} />
        <p className="mt-3 text-sm text-muted-foreground">
          Pick one activity to share with a friend. Every day you keep it, your car drives one lap
          forward. Miss it and your car idles while theirs pulls ahead. First to {RACE_LEVELS} laps
          crosses the finish line. You can both make it, or you can both stall.
        </p>
      </div>

      <div className="glass-pop rounded-3xl p-4 space-y-3">
        <div className="font-display text-xl">Your racer name</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aditi" maxLength={24} />
      </div>

      <div className="glass-pop rounded-3xl p-4 space-y-3">
        <div className="font-display text-xl">Start a new race</div>
        <Input
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="Shared activity (e.g. Morning run)"
          maxLength={80}
        />
        <Button disabled={busy} onClick={handleCreate} className="w-full rounded-full">
          <Flag className="w-4 h-4 mr-1" /> Create race & get a code
        </Button>
      </div>

      <div className="glass-pop rounded-3xl p-4 space-y-3">
        <div className="font-display text-xl">Join a friend</div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Race code (e.g. K7QM2P)"
          maxLength={12}
        />
        <Button disabled={busy} variant="secondary" onClick={handleJoin} className="w-full rounded-full">
          Join race
        </Button>
      </div>
    </div>
  );
}

function RaceBoard({
  race,
  me,
  opponent,
  refresh,
}: {
  race: { id: string; code: string; activity: string };
  me: import("@/lib/race").RacePlayer;
  opponent: import("@/lib/race").RacePlayer | null;
  refresh: () => void;
}) {
  const marked = me.last_marked === todayDate();
  const meDone = me.step >= RACE_LEVELS;
  const oppDone = (opponent?.step ?? 0) >= RACE_LEVELS;

  async function did() {
    const r = await advanceMyCar(race.id, me);
    if (!r.ok) toast("You already raced today. Come back tomorrow");
    else toast.success("Vroom! Your car moved a lap ahead");
    refresh();
  }
  async function missed() {
    await skipToday(race.id, me);
    toast("No lap today. Your car idles");
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="glass-pop rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Shared activity</div>
            <div className="font-display text-xl">{race.activity}</div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(race.code);
              toast.success("Code copied");
            }}
            className="glass-soft rounded-full px-3 py-1.5 text-sm font-semibold flex items-center gap-1"
          >
            {race.code} <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        <CarRace
          meName={`${me.name} (you)`}
          meStep={me.step}
          oppName={opponent?.name ?? null}
          oppStep={opponent ? opponent.step : null}
        />

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="glass-soft rounded-2xl p-2">
            <div className="text-xs text-muted-foreground">You</div>
            <div className="font-semibold">{me.step}/{RACE_LEVELS} laps</div>
          </div>
          <div className="glass-soft rounded-2xl p-2">
            <div className="text-xs text-muted-foreground">{opponent?.name ?? "Waiting for a friend"}</div>
            <div className="font-semibold">
              {opponent ? `${opponent.step}/${RACE_LEVELS} laps` : `Share code ${race.code}`}
            </div>
          </div>
        </div>

        {(meDone || oppDone) && (
          <div className="mt-3 glass-soft rounded-2xl p-3 flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-amber-500" />
            {meDone && oppDone
              ? "You both crossed the finish line. What a race!"
              : meDone
                ? "You crossed the finish line first. Winner!"
                : `${opponent?.name} crossed the finish line first.`}
          </div>
        )}

        {!meDone && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button disabled={marked} onClick={did} className="rounded-full">
              <Check className="w-4 h-4 mr-1" /> I did it
            </Button>
            <Button disabled={marked} variant="secondary" onClick={missed} className="rounded-full">
              <X className="w-4 h-4 mr-1" /> Missed today
            </Button>
          </div>
        )}
        {marked && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Today is locked in. Your car moves again tomorrow.
          </div>
        )}
      </div>

      <button
        onClick={() => {
          leaveRace(race.code);
          refresh();
        }}
        className="text-xs text-muted-foreground underline mx-auto block"
      >
        Leave this race
      </button>
    </div>
  );
}