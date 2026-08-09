import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Timer, LineChart, User, BookHeart } from "lucide-react";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/focus", label: "Focus", icon: Timer },
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
      {/* Spacer so page content isn't hidden behind the floating bar */}
      <div className="h-16" aria-hidden />
      <nav
        data-tour="nav"
        className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
      >
        <div className="glass-pop flex items-center gap-1 rounded-full p-2">
          {items.map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                aria-label={it.label}
                className="relative flex items-center justify-center w-12 h-12 rounded-full transition active:scale-90"
              >
                {active && (
                  <span
                    className="absolute inset-0 rounded-full transition-opacity duration-200"
                    style={{
                      background:
                        "linear-gradient(150deg, oklch(0.58 0.14 165 / 0.22), oklch(0.58 0.14 165 / 0.1))",
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative w-5 h-5 transition-all duration-200",
                    active ? "text-primary scale-110" : "text-muted-foreground/70",
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                {active && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}