import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Flag, Trophy, Check, X, Mountain } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarRace } from "@/components/games/CarRace";
import { BikeTrip, tripBeat } from "@/components/games/BikeTrip";
import {
  RACE_LEVELS,
  TRIP_LEVELS,
  advanceMyCar,
  advanceTrip,
  createRace,
  idleDays,
  joinRace,
  leaveRace,
  skipToday,
  skipTripToday,
  todayDate,
  useRaces,
  type RaceEntry,
  type RaceMode,
} from "@/lib/race";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Build habits with friends — Sprout" },
      {
        name: "description",
        content:
          "Push each other in a car race or do it together on a bike ride to the mountains — shared habits that move a little world every day.",
      },
      { property: "og:title", content: "Build habits with friends — Sprout" },
      {
        property: "og:description",
        content:
          "Push each other in a car race or do it together on a bike ride to the mountains — shared habits that move a little world every day.",
      },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const [mode, setMode] = useState<RaceMode>("compete");
  const { loading, entries, patchRace, patchMe } = useRaces();

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 pb-28 max-w-2xl mx-auto">
      <div className="mb-5 flex items-center gap-3">
        <Link to="/" className="w-9 h-9 rounded-full glass-soft flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Multiplayer</div>
          <h1 className="font-display text-3xl">Build habits with friends</h1>
        </div>
      </div>

      <div className="glass-soft rounded-full p-1 grid grid-cols-2 gap-1 mb-4">
        <button
          onClick={() => setMode("compete")}
          className={`rounded-full py-2 text-sm font-semibold transition ${mode === "compete" ? "glass-pop" : "text-muted-foreground"}`}
        >
          <Flag className="w-4 h-4 inline mr-1" /> Push each other
        </button>
        <button
          onClick={() => setMode("collab")}
          className={`rounded-full py-2 text-sm font-semibold transition ${mode === "collab" ? "glass-pop" : "text-muted-foreground"}`}
        >
          <Mountain className="w-4 h-4 inline mr-1" /> Do it together
        </button>
      </div>

      <NewGame mode={mode} />

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Active games</div>
        {loading ? (
          <div className="glass-pop rounded-3xl p-6 text-sm text-muted-foreground">Loading your games…</div>
        ) : entries.length === 0 ? (
          <div className="glass-pop rounded-3xl p-6 text-sm text-muted-foreground">
            No shared games yet. Start one above or join with a friend's code.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((e) => (
              <GameCard key={e.race.id} entry={e} patchRace={patchRace} patchMe={patchMe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewGame({ mode }: { mode: RaceMode }) {
  const [name, setName] = useState("");
  const [activity, setActivity] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !activity.trim()) return toast.error("Add your name and the activity");
    setBusy(true);
    try {
      const c = await createRace(mode, activity.trim(), name.trim());
      toast.success(`Created — share code ${c}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the game");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!name.trim() || !code.trim()) return toast.error("Add your name and the code");
    setBusy(true);
    try {
      await joinRace(code, name.trim());
      toast.success("You're in!");
      setCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not join");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-pop rounded-3xl p-4">
        {mode === "compete" ? (
          <>
            <CarRace meName="You" meStep={3} oppName="Friend" oppStep={5} />
            <p className="mt-3 text-sm text-muted-foreground">
              Pick one activity you both share. Every day you keep it, your car drives a lap forward — miss it and
              your car idles while theirs pulls ahead. First to {RACE_LEVELS} laps wins, and you can both finish or
              both stall.
            </p>
          </>
        ) : (
          <>
            <BikeTrip step={6} riderA="You" riderB="Friend" />
            <p className="mt-3 text-sm text-muted-foreground">
              One bike, one road to the mountains. The ride moves forward when <em>either</em> of you keeps the
              activity, so you carry each other through the slow days. {TRIP_LEVELS} stages from packing bags to the
              summit — but if you both go quiet for days, the bike gets parked and eventually a tyre goes flat.
            </p>
          </>
        )}
      </div>

      <div className="glass-pop rounded-3xl p-4 space-y-3">
        <div className="font-display text-xl">Your name</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aditi" maxLength={24} />
      </div>

      <div className="glass-pop rounded-3xl p-4 space-y-3">
        <div className="font-display text-xl">{mode === "compete" ? "Start a new race" : "Start a new ride"}</div>
        <Input
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="Shared activity — e.g. Morning run"
          maxLength={80}
        />
        <Button disabled={busy} onClick={handleCreate} className="w-full rounded-full">
          <Flag className="w-4 h-4 mr-1" /> Create & get a code
        </Button>
      </div>

      <div className="glass-pop rounded-3xl p-4 space-y-3">
        <div className="font-display text-xl">Join a friend</div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Code — e.g. K7QM2P"
          maxLength={12}
        />
        <Button disabled={busy} variant="secondary" onClick={handleJoin} className="w-full rounded-full">
          Join game
        </Button>
      </div>
    </div>
  );
}

function GameCard({
  entry,
  patchRace,
  patchMe,
}: {
  entry: RaceEntry;
  patchRace: (id: string, p: Partial<RaceEntry["race"]>) => void;
  patchMe: (id: string, p: Partial<RaceEntry["me"]>) => void;
}) {
  const { race, me, opponent } = entry;
  const today = todayDate();
  const marked = me.last_marked === today;
  const collab = race.mode === "collab";
  const levels = collab ? TRIP_LEVELS : RACE_LEVELS;
  const idle = idleDays(race);
  const beat = tripBeat(race.team_step, idle);
  const meDone = collab ? race.team_step >= levels : me.step >= levels;
  const oppDone = !collab && (opponent?.step ?? 0) >= levels;

  async function did() {
    if (marked && (!collab || race.team_last_marked === today)) {
      toast("Already marked today — come back tomorrow");
      return;
    }
    // optimistic, no reload — the scene just glides forward
    if (collab) {
      patchMe(race.id, { step: Math.min(levels, me.step + 1), last_marked: today });
      if (race.team_last_marked !== today) {
        patchRace(race.id, { team_step: Math.min(levels, race.team_step + 1), team_last_marked: today });
      }
      try {
        await advanceTrip(race, me);
        toast.success("The ride rolls on 🏍️");
      } catch {
        toast.error("Could not sync — try again");
      }
    } else {
      patchMe(race.id, { step: Math.min(levels, me.step + 1), last_marked: today });
      try {
        await advanceMyCar(race.id, me);
        toast.success("Vroom! A lap ahead");
      } catch {
        toast.error("Could not sync — try again");
      }
    }
  }

  async function missed() {
    if (marked) return;
    patchMe(race.id, { last_marked: today });
    try {
      if (collab) await skipTripToday(race, me);
      else await skipToday(race.id, me);
      toast(collab ? "No riding today" : "No lap today — your car idles");
    } catch {
      toast.error("Could not sync — try again");
    }
  }

  return (
    <div className="glass-pop rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {collab ? "Do it together" : "Push each other"}
          </div>
          <div className="font-display text-xl truncate">{race.activity}</div>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(race.code);
            toast.success("Code copied");
          }}
          className="glass-soft rounded-full px-3 py-1.5 text-sm font-semibold flex items-center gap-1 shrink-0"
        >
          {race.code} <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {collab ? (
        <BikeTrip step={race.team_step} idle={idle} riderA={me.name} riderB={opponent?.name ?? null} />
      ) : (
        <CarRace
          meName={`${me.name} (you)`}
          meStep={me.step}
          oppName={opponent?.name ?? null}
          oppStep={opponent ? opponent.step : null}
        />
      )}

      {collab ? (
        <div className="mt-3 glass-soft rounded-2xl p-3">
          <div className="font-semibold text-sm">{beat.title}</div>
          <div className="text-xs text-muted-foreground">{beat.caption}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Stage {Math.min(race.team_step, levels)}/{levels}
            {opponent ? ` · riding with ${opponent.name}` : ` · share code ${race.code} to bring a friend`}
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="glass-soft rounded-2xl p-2">
            <div className="text-xs text-muted-foreground">You</div>
            <div className="font-semibold">
              {me.step}/{levels} laps
            </div>
          </div>
          <div className="glass-soft rounded-2xl p-2">
            <div className="text-xs text-muted-foreground">{opponent?.name ?? "Waiting for a friend"}</div>
            <div className="font-semibold">
              {opponent ? `${opponent.step}/${levels} laps` : `Share code ${race.code}`}
            </div>
          </div>
        </div>
      )}

      {(meDone || oppDone) && (
        <div className="mt-3 glass-soft rounded-2xl p-3 flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-amber-500" />
          {collab
            ? "You reached the mountains together 🏔️"
            : meDone && oppDone
              ? "You both crossed the finish line — what a race!"
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
          Today is locked in — {collab ? "the ride" : "your car"} moves again tomorrow.
        </div>
      )}

      <button
        onClick={() => leaveRace(race.code)}
        className="mt-3 text-xs text-muted-foreground underline mx-auto block"
      >
        Leave this game
      </button>
    </div>
  );
}
