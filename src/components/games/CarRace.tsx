import { useEffect, useRef, useState } from "react";
import { RACE_LEVELS } from "@/lib/race";
import { cn } from "@/lib/utils";

interface Props {
  meName: string;
  meStep: number;
  oppName?: string | null;
  oppStep?: number | null;
  compact?: boolean;
}

const SEG = 46; // px per level

/** Side-on race track. The camera follows the player's own car (their POV). */
export function CarRace({ meName, meStep, oppName, oppStep, compact }: Props) {
  const trackW = (RACE_LEVELS + 2) * SEG;
  const meX = (meStep + 1) * SEG;
  const oppX = oppStep != null ? (oppStep + 1) * SEG : null;
  const viewW = compact ? 220 : 340;
  // keep own car around 38% of the viewport
  const camera = Math.max(0, Math.min(trackW - viewW, meX - viewW * 0.38));

  // Detect when your own car actually advances a lap (not on first mount)
  // so the car can burn some gas and drive there instead of just appearing
  // in the new spot.
  const [boosting, setBoosting] = useState(false);
  const prevStepRef = useRef(meStep);
  useEffect(() => {
    if (meStep > prevStepRef.current) {
      setBoosting(true);
      const t = setTimeout(() => setBoosting(false), 900);
      prevStepRef.current = meStep;
      return () => clearTimeout(t);
    }
    prevStepRef.current = meStep;
  }, [meStep]);

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl", compact ? "h-28" : "h-56")}>
      {/* sky */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#cfe8ff_0%,#e9f4ff_45%,#dff2e3_46%,#cfead6_100%)]" />
      <div
        className="absolute inset-0"
        style={{ transform: `translateX(${-camera}px)`, width: trackW, transition: "transform 700ms ease-out" }}
      >
        <svg width={trackW} height="100%" viewBox={`0 0 ${trackW} 200`} preserveAspectRatio="none">
          {/* hills */}
          <path d={`M0 96 Q ${trackW * 0.15} 50 ${trackW * 0.3} 96 T ${trackW * 0.6} 96 T ${trackW} 96 L ${trackW} 200 L 0 200 Z`} fill="#bfe3c6" opacity="0.7" />
          {/* road */}
          <rect x="0" y="104" width={trackW} height="72" fill="#4b4f63" />
          <rect x="0" y="104" width={trackW} height="4" fill="#ffffff" opacity="0.5" />
          <rect x="0" y="139" width={trackW} height="3" fill="#ffe9a8" opacity="0.85" />
          {/* lane dashes */}
          {Array.from({ length: RACE_LEVELS + 2 }).map((_, i) => (
            <rect key={i} x={i * SEG + 8} y={120} width={20} height="3" fill="#ffffff" opacity="0.45" />
          ))}
          {Array.from({ length: RACE_LEVELS + 2 }).map((_, i) => (
            <rect key={`b${i}`} x={i * SEG + 8} y={158} width={20} height="3" fill="#ffffff" opacity="0.45" />
          ))}
          {/* start line */}
          <rect x={SEG - 6} y="104" width="6" height="72" fill="#ffffff" opacity="0.8" />
          {/* finish line */}
          {Array.from({ length: 9 }).map((_, r) => (
            <rect
              key={`f${r}`}
              x={(RACE_LEVELS + 1) * SEG}
              y={104 + r * 8}
              width="14"
              height="8"
              fill={r % 2 === 0 ? "#1f2333" : "#ffffff"}
            />
          ))}
        </svg>

        {/* opponent car (far lane) */}
        {oppX != null && (
          <Car
            x={oppX}
            top="46%"
            color="#8b7cf6"
            label={oppName ?? "Friend"}
            scale={0.82}
          />
        )}
        {/* your car (near lane) */}
        <Car x={meX} top="66%" color="#f97362" label={meName} you scale={0.95} boosting={boosting} />
      </div>

      {/* level marker */}
      <div className="absolute bottom-1.5 right-2 text-[10px] font-medium rounded-full bg-black/35 text-white px-2 py-0.5">
        Lap {Math.min(meStep, RACE_LEVELS)}/{RACE_LEVELS}
      </div>
    </div>
  );
}

function Car({
  x,
  top,
  color,
  label,
  you,
  scale = 1,
  boosting,
}: {
  x: number;
  top: string;
  color: string;
  label: string;
  you?: boolean;
  scale?: number;
  boosting?: boolean;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top,
        transform: `translate(-50%,-50%) scale(${scale})`,
        transition: "left 700ms ease-out",
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap",
            you ? "bg-white/90 text-foreground font-semibold" : "bg-white/70 text-foreground/80",
          )}
        >
          {label}
        </span>
        <div className="relative">
          {boosting && (
            <div className="absolute left-[2px] top-[17px] pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-slate-400/70"
                  style={{
                    width: 5,
                    height: 5,
                    animation: `exhaust-puff 650ms ease-out ${i * 110}ms both`,
                  }}
                />
              ))}
            </div>
          )}
          <svg
            width="54"
            height="26"
            viewBox="0 0 54 26"
            style={{
              animation: boosting
                ? "car-bob 0.5s ease-in-out infinite"
                : "car-bob 1.6s ease-in-out infinite",
            }}
          >
            <ellipse cx="27" cy="23" rx="20" ry="3" fill="#000" opacity="0.18" />
            <path d="M6 17 L10 10 Q12 7 17 7 L31 7 Q36 7 40 11 L47 14 Q50 15 50 18 L6 18 Z" fill={color} />
            <path d="M17 8 L29 8 Q33 8 36 11 L20 11 Z" fill="#ffffff" opacity="0.8" />
            <circle cx="16" cy="19" r="4.5" fill="#22232e" />
            <circle cx="16" cy="19" r="1.8" fill="#c9ccd8" />
            <circle cx="40" cy="19" r="4.5" fill="#22232e" />
            <circle cx="40" cy="19" r="1.8" fill="#c9ccd8" />
          </svg>
        </div>
      </div>
      <style>{`@keyframes car-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
@keyframes exhaust-puff{0%{transform:translate(0,0) scale(0.6);opacity:0.6}100%{transform:translate(-16px,-9px) scale(1.9);opacity:0}}`}</style>
    </div>
  );
}