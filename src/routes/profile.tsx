import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Bell, RotateCcw, Sparkles, Compass, ShieldCheck } from "lucide-react";
import {
  useAppState,
  useDaysSinceFirstOpen,
  resetAll,
  requestNotifPermission,
  daysInMonth,
} from "@/lib/store";
import { useCloudBackup } from "@/lib/cloud";
import { BackupDialog } from "@/components/BackupDialog";
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
  const { hasBackup } = useCloudBackup();
  const [acctOpen, setAcctOpen] = useState(false);
  const cap = daysInMonth();


  const totalDone = s.habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const totalMissed = s.habits.reduce((acc, h) => acc + h.missedDates.length, 0);
  const totalHabits = s.habits.length;
  const totalSessions = s.focusSessions.length;
  const focusMinutes = s.focusSessions.reduce((a, f) => a + f.minutes, 0);

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">You</div>
        <h1 className="font-display text-3xl md:text-4xl">Profile</h1>
      </div>

      <div className="glass-strong rounded-3xl p-6 flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-display">
          S
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">Guest gardener</div>
          <div className="text-xs text-muted-foreground">
            {hasBackup ? "Backed up. Restore anytime with your recovery code." : "Local only. Back it up so you don't lose it."}
          </div>
        </div>
        {!hasBackup && (
          <Button size="sm" onClick={() => setAcctOpen(true)} className="rounded-full">
            Back up
          </Button>
        )}
      </div>

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
        <Row
          icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          label={hasBackup ? "Get a new recovery code" : "Back up your progress"}
          onClick={() => setAcctOpen(true)}
        />
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

      <BackupDialog open={acctOpen} onOpenChange={setAcctOpen} />
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