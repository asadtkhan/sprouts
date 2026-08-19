import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Bell, RotateCcw, Sparkles, Compass, Cloud, Globe2, Mail } from "lucide-react";
import {
  useAppState,
  useDaysSinceFirstOpen,
  resetAll,
  requestNotifPermission,
  daysInMonth,
} from "@/lib/store";
import { supabase } from "@/integrations/supabase/clients"; // Ensure this matches your supabase client path
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
  const cap = daysInMonth();

  const totalDone = s.habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const totalMissed = s.habits.reduce((acc, h) => acc + h.missedDates.length, 0);
  const totalHabits = s.habits.length;
  const totalSessions = s.focusSessions.length;
  const focusMinutes = s.focusSessions.reduce((a, f) => a + f.minutes, 0);

  // Progressive Disclosure Logic
  const hasStartedGrowing = totalDone > 0;
  const isLoggedIn = s.user !== null;

  const initials = (s.user?.email?.[0] ?? "S").toUpperCase();
  const displayName = s.user?.email ?? "Guest gardener";

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) toast.error("Failed to connect to Google");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out successfully");
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">You</div>
        <h1 className="font-display text-3xl md:text-4xl">Profile</h1>
      </div>

      <div className="glass-strong rounded-3xl p-6 flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-display">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground">
            {isLoggedIn ? "Progress synced to cloud" : "Local only. Back up your data below."}
          </div>
        </div>
      </div>

      {/* The Progressive Auth Widget */}
      {!isLoggedIn && hasStartedGrowing && (
        <div className="glass-pop rounded-3xl p-6 mb-6 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 text-emerald-600">
              <Cloud className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-display text-foreground mb-2">Put Down Roots</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
              Your ecosystem is growing. Create a free account to back up your progress to the cloud so it's never lost.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 text-sm font-medium border border-border shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <Globe2 className="w-4 h-4" /> Continue with Google
              </button>
              
              <button 
                disabled 
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 text-sm font-medium border border-border shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors opacity-50 cursor-not-allowed"
              >
                <Mail className="w-4 h-4" /> Email & Password (Coming Soon)
              </button>
            </div>
          </div>
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

        {isLoggedIn && (
          <Row
            icon={<LogOut className="w-4 h-4" />}
            label="Sign out"
            onClick={handleSignOut}
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