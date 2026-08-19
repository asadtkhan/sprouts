import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, RotateCcw, Sparkles, Compass, Sprout } from "lucide-react";
import {
  useAppState,
  useDaysSinceFirstOpen,
  signOut,
  resetAll,
  requestNotifPermission,
  daysInMonth,
  canPromptSignup,
} from "@/lib/store";
import { AccountDialog } from "@/components/AccountDialog";
import { startTour } from "@/components/TourGuide";
import { toast } from "sonner";


export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Sprout" },
      { name: "description", content: "Your Sprout profile, streaks, and account." },
      { property: "og:title", content: "Profile · Sprout" },
      { property: "og:description", content: "Your Sprout profile, streaks, and account." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const s = useAppState();
  const days = useDaysSinceFirstOpen();
  const [acctOpen, setAcctOpen] = useState(false);
  const cap = daysInMonth();


  const totalDone = s.habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const totalMissed = s.habits.reduce((acc, h) => acc + h.missedDates.length, 0);
  const totalHabits = s.habits.length;
  const totalSessions = s.focusSessions.length;
  const focusMinutes = s.focusSessions.reduce((a, f) => a + f.minutes, 0);

  const initials = (s.accountEmail?.[0] ?? "S").toUpperCase();
  const displayName = s.accountEmail ?? "Guest gardener";

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">You</div>
        <h1 className="font-display text-3xl md:text-4xl">Profile</h1>
      </div>

      <div className="glass-strong rounded-3xl p-6 flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-display">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground">
            {s.hasAccount ? "Progress saved to account" : "Local only, on this device"}
          </div>
        </div>
      </div>

      {canPromptSignup(s) && (
        <div className="glass rounded-3xl p-4 mb-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">You've grown your first sprout</div>
            <div className="text-xs text-muted-foreground">Create an account so it never withers</div>
          </div>
          <Button size="sm" onClick={() => setAcctOpen(true)} className="rounded-full shrink-0">
            Sign up
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Days on Sprout" value={days} />
        <Stat label="Habits" value={totalHabits} />
        <Stat label="Completions" value={totalDone} />
        <Stat label="Missed" value={totalMissed} />
        <Stat label="Focus sessions" value={totalSessions} />
        <Stat label="Focus minutes" value={focusMinutes} />
      </div>

      {s.game && (
        <div className="glass rounded-3xl p-4 mb-4 flex items-center gap-4">
          <div className="text-3xl">
            {s.game.kind === "tree" ? "🌱" : s.game.kind === "space" ? "🚀" : "🐱"}
          </div>
          <div className="flex-1">
            <div className="font-medium capitalize">{s.game.kind} game</div>
            <div className="text-xs text-muted-foreground">
              Stage {s.game.stage}/{cap} · Health {s.game.health}%
            </div>

          </div>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      )}

      <div className="glass rounded-3xl p-2 divide-y divide-white/40">
        <Row
          icon={<Compass className="w-4 h-4 text-primary" />}
          label="Take the tour"
          onClick={() => startTour()}
        />
        <Row
          icon={<Bell className="w-4 h-4" />}
          label="Enable notifications"
          onClick={async () => {
            const p = await requestNotifPermission();
            toast(p === "granted" ? "Notifications on 🔔" : "Notifications off");
          }}
        />

        {s.hasAccount && (
          <Row
            icon={<LogOut className="w-4 h-4" />}
            label="Sign out"
            onClick={() => {
              signOut();
              toast("Signed out");
            }}
          />
        )}
        <Row
          icon={<RotateCcw className="w-4 h-4 text-destructive" />}
          label="Reset everything"
          danger
          onClick={() => {
            if (confirm("Delete all habits, game progress, and sessions?")) {
              resetAll();
              toast("Everything reset");
            }
          }}
        />
      </div>

      <AccountDialog open={acctOpen} onOpenChange={setAcctOpen} />
    </div>
  );
}


function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="text-2xl font-display">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-2xl hover:bg-white/40 transition ${
        danger ? "text-destructive" : ""
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}