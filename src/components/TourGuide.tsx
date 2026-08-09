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
    body: "Every ritual you keep grows a tiny living world. I'll point at each part of the app — use the arrows to move along.",
  },
  {
    route: "/",
    target: "home-daily",
    icon: ListChecks,
    label: "Daily",
    title: "Daily rituals card",
    body: "Your scheduled habits live here, with today's completion and a peek at your world. Tap it to open the full Daily screen.",
  },
  {
    route: "/",
    target: "home-personal",
    icon: Wand2,
    label: "Personal",
    title: "Personal activities",
    body: "Free-form things you do at your own pace. Log one with the +1 button — each activity grows its own little world.",
  },
  {
    route: "/",
    target: "home-race",
    icon: Flag,
    label: "Race",
    title: "Race a friend",
    body: "Pick one activity to share with a friend, swap a race code, and every day you both keep it your cars drive a lap closer to the finish line.",
  },

  {
    route: "/daily",
    target: "daily-card",
    icon: ListChecks,
    label: "Rituals",
    title: "Everything in one card",
    body: "Your world, your streak, today's completion bar and every ritual for the day. Mark each one completed or missed — the world updates at 11 PM.",
  },
  {
    route: "/personal",
    target: "personal-list",
    icon: Wand2,
    label: "Activities",
    title: "Your ongoing activities",
    body: "Each card has its own game and history. Tap \"I did it\" to take a step — there are no penalties for slow days here.",
  },
  {
    route: "/focus",
    target: "focus-setup",
    icon: Timer,
    label: "Session",
    title: "Open-ended or planned",
    body: "Reach this any time from the Focus tab. Run a session with no end time, or plan work and rest intervals before you begin.",
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
    body: "A calendar of daily completion, your most-performed activities each week, and focus minutes over the last 15 days.",
  },
  {
    route: "/tracking",
    target: "nav",
    icon: Compass,
    label: "Navigate",
    title: "Move around from here",
    body: "This bar is always with you: Home, Focus, Journal, Tracking and Profile. Daily rituals, personal activities and the friend race live on the Home screen. Replay this tour any time from Profile.",
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
  const spot = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
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
      {/* dimmer + spotlight ring */}
      {spot ? (
        <div
          className="absolute rounded-3xl transition-all duration-300 ease-out ring-2 ring-primary/80"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            boxShadow: "0 0 0 9999px rgba(24,20,45,0.45)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(24,20,45,0.45)]" />
      )}

      {/* pointing arrow */}
      {showArrow && (
        <div
          className="absolute text-primary drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-all duration-300"
          style={{ top: arrowTop, left: arrowLeft, animation: "tour-bounce 1.1s ease-in-out infinite" }}
        >
          <div
            className="rounded-full bg-card border border-border flex items-center justify-center"
            style={{ width: arrowSize, height: arrowSize }}
          >
            {below ? (
              <ArrowUp className={compact ? "w-4 h-4" : "w-5 h-5"} />
            ) : (
              <ArrowDown className={compact ? "w-4 h-4" : "w-5 h-5"} />
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes tour-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(${
        below ? "6px" : "-6px"
      })}}`}</style>

      {/* coach card */}
      <div
        ref={cardRef}
        className="pointer-events-auto absolute inset-x-2.5 sm:inset-x-4 mx-auto w-auto max-w-md rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-[0_12px_40px_-12px_rgba(60,50,120,0.45)] transition-all duration-300 flex flex-col overflow-y-auto"
        style={{ top: cardTop, maxHeight: maxCardH }}
      >
        <div className="px-4 pt-3.5 shrink-0">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <span>
              Step {i + 1} of {STEPS.length}
            </span>
            <button onClick={finish} className="flex items-center gap-1 hover:text-foreground transition">
              Skip <X className="w-3 h-3" />
            </button>
          </div>
          <div className="relative h-1.5 rounded-full bg-foreground/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="px-4 pt-3 pb-3 flex gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
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
            className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-background border border-border flex items-center justify-center transition disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => (last ? finish() : setI(i + 1))}
            className="flex-1 min-w-0 h-10 sm:h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 px-3 transition hover:opacity-90"
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