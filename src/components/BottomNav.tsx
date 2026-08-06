import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ListChecks, LineChart, User, BookHeart } from "lucide-react";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/daily", label: "Daily", icon: ListChecks },
  { to: "/journal", label: "Journal", icon: BookHeart },
  { to: "/tracking", label: "Tracking", icon: LineChart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const s = useAppState();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (!s.onboarded) return null;

  return (
    <>
      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div className="h-20" aria-hidden />
      <nav
        data-tour="nav"
        className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]
                   bg-white/85 backdrop-blur-xl border-t border-white/60
                   shadow-[0_-6px_24px_-8px_rgba(60,50,120,0.18)]"
      >
        <div className="mx-auto max-w-md flex items-stretch justify-around px-1 py-1.5">
          {items.map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition min-w-[58px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("w-5 h-5 transition", active && "scale-110")} />
                <span className="text-[10px] font-medium">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
