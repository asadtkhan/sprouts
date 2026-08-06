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
    target: "home-focus",
    icon: Timer,
    label: "Focus",
    title: "Focus session",
    body: "Start a session here. A farmer plucks one fruit for every minute you stay focused, and your fruit count sits on the right.",
  },
  {
    route: "/",
    target: "home-journal",
    icon: BookHeart,
    label: "Journal",
    title: "Journal",
    body: "A quiet space with no game to win — just your thoughts and a kitten chasing its yarn ball.",
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
    body: "Run a session with no end time, or plan work and rest intervals before you begin.",
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
    body: "This bar is always with you: Home, Daily, Journal, Tracking and Profile. You can replay this tour any time from Profile.",
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

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
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
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;

  const pad = 8;
  const spot = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Place the card below the target when there's room, otherwise above.
  const gap = 44; // room for the arrow
  const below = spot ? spot.top + spot.height + gap + cardH < vh - 8 : false;
  const cardTop = spot
    ? below
      ? spot.top + spot.height + gap
      : Math.max(8, spot.top - gap - cardH)
    : Math.max(8, vh - cardH - 88);

  const arrowTop = spot ? (below ? spot.top + spot.height + 6 : spot.top - 38) : 0;
  const arrowLeft = spot ? Math.min(Math.max(spot.left + spot.width / 2 - 18, 16), (typeof window === "undefined" ? 380 : window.innerWidth) - 52) : 0;

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
      {spot && (
        <div
          className="absolute text-primary drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-all duration-300"
          style={{ top: arrowTop, left: arrowLeft, animation: "tour-bounce 1.1s ease-in-out infinite" }}
        >
          <div className="w-9 h-9 rounded-full bg-white/95 border border-white flex items-center justify-center">
            {below ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
          </div>
        </div>
      )}

      <style>{`@keyframes tour-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(${
        below ? "6px" : "-6px"
      })}}`}</style>

      {/* coach card */}
      <div
        ref={cardRef}
        className="pointer-events-auto absolute inset-x-3 mx-auto max-w-md rounded-3xl bg-white/95 backdrop-blur-xl border border-white/70 shadow-[0_12px_40px_-12px_rgba(60,50,120,0.45)] transition-all duration-300"
        style={{ top: cardTop }}
      >
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            <span>
              Step {i + 1} of {STEPS.length}
            </span>
            <button onClick={finish} className="flex items-center gap-1 hover:text-foreground transition">
              Skip <X className="w-3 h-3" />
            </button>
          </div>
          <div className="relative h-1.5 rounded-full bg-black/5 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="px-4 pt-3 pb-3 flex gap-3">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{step.label}</div>
            <div className="font-display text-lg leading-tight">{step.title}</div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">{step.body}</p>
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center gap-3">
          <button
            onClick={() => setI((v) => Math.max(0, v - 1))}
            disabled={i === 0}
            aria-label="Previous step"
            className="w-11 h-11 rounded-full bg-white border border-black/5 flex items-center justify-center transition disabled:opacity-30 hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => (last ? finish() : setI(i + 1))}
            className="flex-1 h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 transition hover:opacity-90"
          >
            {last ? "Finish tour" : `Next · ${STEPS[i + 1]?.label ?? ""}`}
            {last ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
