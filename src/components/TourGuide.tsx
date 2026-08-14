import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  ListChecks,
  Wand2,
  Timer,
  BookHeart,
  LineChart,
  Sparkles,
  Flag,
  Trophy,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  Compass,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/store";

const KEY = "sprout-tour-done-v2";
const EVT = "sprout-start-tour";

export function startTour() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

type Step = {
  route: string;
  target?: string; // data-tour value of the element to point at
  icon: typeof Home;
  label: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    route: "/",
    icon: Sparkles,
    label: "Welcome",
    title: "Welcome to Sprout",
    body: "Every ritual you keep grows a tiny living world. I'll show you around, just follow the arrows.",
  },
  {
    route: "/",
    target: "home-daily",
    icon: ListChecks,
    label: "Daily",
    title: "Daily rituals card",
    body: "Your scheduled habits live here, along with today's progress and a peek at your world. Tap the card to open the full Daily screen.",
  },
  {
    route: "/daily",
    target: "daily-card",
    icon: ListChecks,
    label: "Rituals",
    title: "Everything in one card",
    body: "Your world, your streak, today's progress bar, and every ritual for the day, all in one place. Mark each one done or missed, and your world updates at 11 PM.",
  },
  {
    route: "/",
    target: "home-personal",
    icon: Wand2,
    label: "Personal",
    title: "Personal activities",
    body: "Things you do in your own time, not on a schedule. Log one with the plus button, and each activity grows its own little world.",
  },
  {
    route: "/personal",
    target: "personal-list",
    icon: Wand2,
    label: "Activities",
    title: "Your ongoing activities",
    body: "Each card has its own game and its own history. Tap \"I did it\" to take a step forward. There's no penalty for a slow day.",
  },
  {
    route: "/",
    target: "home-friends",
    icon: Flag,
    label: "Multiplayer",
    title: "Multiplayer card",
    body: "Team up with a friend here, racing each other forward or riding together toward the mountains. Tap the card to open the full Multiplayer screen.",
  },
  {
    route: "/friends",
    target: "friends-modes",
    icon: Flag,
    label: "Modes",
    title: "Push each other, or ride together",
    body: "Push each other is a car race, best for a friendly bit of competition. Do it together is one shared bike ride that moves forward on either of your good days. Add your name, pick a shared activity, then create a code or join a friend's.",
  },
  {
    route: "/friends",
    target: "friends-games",
    icon: Trophy,
    label: "Games",
    title: "Every shared game lives here",
    body: "Each race or ride gets its own little scene. Mark it done once a day, and check back tomorrow to see how far you have moved.",
  },
  {
    route: "/focus",
    target: "focus-setup",
    icon: Timer,
    label: "Session",
    title: "However you like to focus",
    body: "Find this anytime from the Focus tab. Run a session with no end time, or plan work and rest intervals before you begin.",
  },
  {
    route: "/journal",
    target: "journal-editor",
    icon: BookHeart,
    label: "Write",
    title: "Write about your day",
    body: "Even one line counts. Saved entries stack below, and the kitten keeps playing while you write.",
  },
  {
    route: "/tracking",
    target: "tracking-calendar",
    icon: LineChart,
    label: "Tracking",
    title: "Your month at a glance",
    body: "A calendar of daily completion, your most frequent activities each week, and focus minutes over the last 15 days.",
  },
  {
    route: "/tracking",
    target: "nav",
    icon: Compass,
    label: "Navigate",
    title: "Move around from here",
    body: "This bar is always with you: Home, Focus, Journal, Tracking and Profile. Daily rituals, personal activities and multiplayer all live on the Home screen. Replay this tour anytime from Profile.",
  },

];

type Rect = { top: number; left: number; width: number; height: number };

export function TourGuide() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(220);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const appState = useAppState();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStart = () => {
      setI(0);
      setOpen(true);
    };
    window.addEventListener(EVT, onStart);
    if (!localStorage.getItem(KEY)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => {
        clearTimeout(t);
        window.removeEventListener(EVT, onStart);
      };
    }
    return () => window.removeEventListener(EVT, onStart);
  }, []);

  const step = STEPS[i];

  useEffect(() => {
    if (!open) return;
    if (pathname !== step.route) navigate({ to: step.route });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  const measure = useCallback(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.target]);

  // Bring the target into view, then track it while it settles / scrolls / resizes.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    let stop = false;
    const el = step.target
      ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      : null;
    if (el && step.target !== "nav") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const loop = () => {
      if (stop) return;
      measure();
      raf = requestAnimationFrame(loop);
    };
    loop();
    const t = setTimeout(() => {
      stop = true;
      cancelAnimationFrame(raf);
    }, 1200);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      stop = true;
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i, pathname, measure]);

  // Measure the card's natural height (ignoring the clamp) so placement decisions
  // don't feed back on themselves and clip the copy.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const prev = el.style.maxHeight;
    el.style.maxHeight = "none";
    const h = el.offsetHeight;
    el.style.maxHeight = prev;
    setCardH((v) => (Math.abs(v - h) > 1 ? h : v));
  }, [i, open, rect]);


  if (!open || !appState.onboarded) return null;

  function finish() {
    if (typeof window !== "undefined") localStorage.setItem(KEY, "1");
    setOpen(false);
    setI(0);
  }

  const Icon = step.icon;
  const last = i === STEPS.length - 1;
  const pct = ((i + 1) / STEPS.length) * 100;
  const vw = typeof window === "undefined" ? 390 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const compact = vw < 640;

  // The fixed bottom nav must stay clear of the coach card.
  const navSpace = 88;
  const edge = 10;
  const bottomLimit = vh - navSpace;

  const pad = compact ? 6 : 8;
  const rawSpot = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;
  // Some targets (a long activity list, a stack of active games) can grow
  // taller than the screen. Clamp the glow to the viewport so it always
  // reads as a crisp highlight instead of a ring that runs off the edge.
  const spot = rawSpot
    ? (() => {
        const top = Math.max(edge, rawSpot.top);
        const left = Math.max(edge, rawSpot.left);
        const bottom = Math.min(vh - edge, rawSpot.top + rawSpot.height);
        const right = Math.min(vw - edge, rawSpot.left + rawSpot.width);
        return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
      })()
    : null;

  // Pick the side with the most usable room, then clamp everything on-screen.
  const gap = compact ? 34 : 44; // room for the arrow
  const roomBelow = spot ? bottomLimit - (spot.top + spot.height + gap) : 0;
  const roomAbove = spot ? spot.top - gap - edge : 0;
  const below = spot ? (roomBelow >= cardH ? true : roomBelow > roomAbove) : false;
  // Target taller than the screen (common on phones): dock the card instead.
  const docked = !!spot && Math.max(roomBelow, roomAbove) < cardH;
  // The card keeps its natural height; only the viewport itself clamps it.
  const maxCardH = vh - navSpace - edge;

  const rawTop = docked
    ? bottomLimit - Math.min(cardH, maxCardH)
    : spot
      ? below
        ? spot.top + spot.height + gap
        : spot.top - gap - Math.min(cardH, maxCardH)
      : (vh - navSpace - Math.min(cardH, maxCardH)) / 2;
  const cardTop = Math.max(edge, Math.min(rawTop, bottomLimit - Math.min(cardH, maxCardH)));

  const arrowSize = compact ? 30 : 36;
  const showArrow = !!spot && !docked;
  const arrowTop = spot ? (below ? spot.top + spot.height + 4 : spot.top - arrowSize - 4) : 0;
  const arrowLeft = spot
    ? Math.min(Math.max(spot.left + spot.width / 2 - arrowSize / 2, edge), vw - arrowSize - edge)
    : 0;


  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* dimmer + crisp spotlight ring */}
      {spot ? (
        <div
          className="absolute rounded-3xl transition-all duration-300 ease-out"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            boxShadow: "0 0 0 2.5px oklch(0.58 0.14 165), 0 0 0 9999px rgba(20,16,38,0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(20,16,38,0.55)]" />
      )}
      {/* soft breathing glow around the spotlight */}
      {spot && (
        <div
          className="absolute rounded-3xl pointer-events-none transition-all duration-300 ease-out tour-glow-pulse"
          style={{
            top: spot.top - 3,
            left: spot.left - 3,
            width: spot.width + 6,
            height: spot.height + 6,
            boxShadow: "0 0 26px 4px oklch(0.58 0.14 165 / 0.45)",
          }}
        />
      )}

      {/* pointing arrow */}
      {showArrow && (
        <div className="absolute tour-bounce" style={{ top: arrowTop, left: arrowLeft }}>
          <div className="relative flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full blur-md tour-glow-pulse"
              style={{ background: "oklch(0.58 0.14 165 / 0.55)" }}
            />
            <div
              className="relative rounded-full flex items-center justify-center text-white"
              style={{
                width: arrowSize,
                height: arrowSize,
                background: "linear-gradient(150deg, oklch(0.66 0.13 165), oklch(0.5 0.15 165))",
                boxShadow: "0 8px 18px -6px oklch(0.5 0.15 165 / 0.7), inset 0 1px 0 0 oklch(1 0 0 / 0.35)",
              }}
            >
              {below ? (
                <ArrowUp className={compact ? "w-4 h-4" : "w-5 h-5"} strokeWidth={2.5} />
              ) : (
                <ArrowDown className={compact ? "w-4 h-4" : "w-5 h-5"} strokeWidth={2.5} />
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tour-bounce-y{0%,100%{transform:translateY(0)}50%{transform:translateY(${below ? "6px" : "-6px"})}}
        .tour-bounce{animation:tour-bounce-y 1.3s cubic-bezier(0.45,0,0.55,1) infinite}
        @keyframes tour-pulse{0%,100%{opacity:0.55;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
        .tour-glow-pulse{animation:tour-pulse 2.2s ease-in-out infinite}
        @keyframes tour-shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(220%)}}
        .tour-shimmer{animation:tour-shimmer 2.4s ease-in-out infinite}
        @keyframes tour-step-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .tour-step-in{animation:tour-step-in 320ms cubic-bezier(0.16,1,0.3,1) both}
        @media (prefers-reduced-motion: reduce){
          .tour-bounce,.tour-glow-pulse,.tour-shimmer,.tour-step-in{animation:none !important}
        }
      `}</style>

      {/* coach card */}
      <div
        ref={cardRef}
        className="glass-strong pointer-events-auto absolute inset-x-2.5 sm:inset-x-4 mx-auto w-auto max-w-md rounded-3xl transition-all duration-300 flex flex-col overflow-y-auto"
        style={{ top: cardTop, maxHeight: maxCardH, boxShadow: "var(--glass-shadow)" }}
      >
        <div
          className="h-[3px] w-full shrink-0"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.58 0.14 165), oklch(0.86 0.08 235), oklch(0.58 0.14 165 / 0.15))",
          }}
        />
        <div className="px-4 pt-3.5 shrink-0">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <span>
              Step {i + 1} of {STEPS.length}
            </span>
            <button onClick={finish} className="flex items-center gap-1 hover:text-primary transition">
              Skip <X className="w-3 h-3" />
            </button>
          </div>
          <div className="relative h-1.5 rounded-full bg-foreground/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 overflow-hidden"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, oklch(0.58 0.14 165 / 0.75), oklch(0.58 0.14 165))",
              }}
            >
              <div
                className="absolute inset-y-0 w-8 tour-shimmer"
                style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.55), transparent)" }}
              />
            </div>
          </div>
        </div>

        <div key={i} className="px-4 pt-3 pb-3 flex gap-3 tour-step-in">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl flex items-center justify-center text-white"
            style={{
              background: "linear-gradient(150deg, oklch(0.66 0.13 165), oklch(0.5 0.15 165))",
              boxShadow: "0 6px 14px -6px oklch(0.5 0.15 165 / 0.65)",
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{step.label}</div>
            <div className="font-display text-base sm:text-lg leading-tight">{step.title}</div>
            <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed mt-1">{step.body}</p>
          </div>
        </div>

        <div className="px-4 pb-3.5 flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setI((v) => Math.max(0, v - 1))}
            disabled={i === 0}
            aria-label="Previous step"
            className="glass-soft w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full flex items-center justify-center transition disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => (last ? finish() : setI(i + 1))}
            className="flex-1 min-w-0 h-10 sm:h-11 rounded-full text-white text-sm font-medium flex items-center justify-center gap-2 px-3 transition hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(150deg, oklch(0.62 0.13 165), oklch(0.48 0.15 165))",
              boxShadow: "0 10px 22px -8px oklch(0.5 0.15 165 / 0.6)",
            }}
          >
            <span className="truncate">
              {last ? "Finish tour" : `Next · ${STEPS[i + 1]?.label ?? ""}`}
            </span>
            {last ? <Check className="w-4 h-4 shrink-0" /> : <ArrowRight className="w-4 h-4 shrink-0" />}
          </button>
        </div>
      </div>
    </div>
  );
}