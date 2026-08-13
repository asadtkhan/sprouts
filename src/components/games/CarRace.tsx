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
      <style>{`
        @keyframes car-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.5px)} }
        @keyframes car-boost { 0%,100%{transform:translateY(0) rotate(0deg)} 20%{transform:translateY(-2px) rotate(-2deg)} 80%{transform:translateY(-1px) rotate(1deg)} }
        @keyframes exhaust-puff { 0%{transform:translate(0,0) scale(0.6);opacity:0.6} 100%{transform:translate(-16px,-9px) scale(1.9);opacity:0} }
        @keyframes blimpFloat { 0%{transform:translate(0,0)} 100%{transform:translate(15px,-5px)} }
      `}</style>
      
      {/* Original Sky */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#cfe8ff_0%,#e9f4ff_45%,#dff2e3_46%,#cfead6_100%)]" />
      
      <div
        className="absolute inset-0"
        style={{ transform: `translateX(${-camera}px)`, width: trackW, transition: "transform 700ms ease-out" }}
      >
        <svg width={trackW} height="100%" viewBox={`0 0 ${trackW} 200`} preserveAspectRatio="none">
          {/* Original Hills */}
          <path d={`M0 96 Q ${trackW * 0.15} 50 ${trackW * 0.3} 96 T ${trackW * 0.6} 96 T ${trackW} 96 L ${trackW} 200 L 0 200 Z`} fill="#bfe3c6" opacity="0.7" />
          
          {/* --- SCENERY PROPS (Milestones along the track) --- */}
          
          {/* Level 5: Racing Billboard */}
          <g transform={`translate(${5 * SEG}, 69)`}>
            <rect x="0" y="0" width="40" height="20" fill="#fca5a5" rx="2" />
            <rect x="4" y="4" width="32" height="12" fill="#ffffff" opacity="0.6" />
            <rect x="10" y="20" width="3" height="15" fill="#9ca3af" />
            <rect x="27" y="20" width="3" height="15" fill="#9ca3af" />
            <path d="M8 12 L 15 6 L 22 12 Z" fill="#ef4444" opacity="0.8" />
            <circle cx="28" cy="10" r="4" fill="#3b82f6" opacity="0.8" />
          </g>

          {/* Level 10: Spectator Grandstand */}
          <g transform={`translate(${10 * SEG}, 74)`}>
            <path d="M0 30 L10 10 L50 10 L60 30 Z" fill="#9ca3af" />
            <rect x="10" y="5" width="40" height="5" fill="#ef4444" />
            <rect x="10" y="10" width="40" height="2" fill="#fca5a5" />
            {/* Cheering Fans */}
            <circle cx="15" cy="15" r="2" fill="#3b82f6" />
            <circle cx="25" cy="18" r="2" fill="#f59e0b" />
            <circle cx="35" cy="15" r="2" fill="#10b981" />
            <circle cx="45" cy="18" r="2" fill="#8b5cf6" />
            <circle cx="20" cy="22" r="2" fill="#ec4899" />
            <circle cx="30" cy="25" r="2" fill="#06b6d4" />
            <circle cx="40" cy="22" r="2" fill="#f43f5e" />
          </g>

          {/* Level 20: Tree Cluster */}
          <g transform={`translate(${20 * SEG}, 59)`}>
            <rect x="8" y="30" width="4" height="15" fill="#78350f" opacity="0.8" />
            <circle cx="10" cy="20" r="15" fill="#4ade80" opacity="0.9" />
            
            <rect x="27" y="30" width="6" height="15" fill="#78350f" opacity="0.8" />
            <circle cx="30" cy="15" r="20" fill="#22c55e" opacity="0.9" />
            
            <rect x="48" y="35" width="4" height="10" fill="#78350f" opacity="0.8" />
            <circle cx="50" cy="25" r="12" fill="#16a34a" opacity="0.9" />
          </g>

          {/* Level 25: Floating Blimp */}
          <g transform={`translate(${25 * SEG}, 20)`} style={{ animation: "blimpFloat 6s infinite alternate ease-in-out" }}>
            <ellipse cx="40" cy="20" rx="30" ry="12" fill="#f8fafc" />
            <path d="M 10 20 L -2 12 L -2 28 Z" fill="#94a3b8" />
            <rect x="30" y="32" width="20" height="6" rx="2" fill="#cbd5e1" />
            <text x="40" y="24" fontSize="8" fill="#ef4444" textAnchor="middle" fontWeight="bold">GO!</text>
          </g>

          {/* Original Road Base */}
          <rect x="0" y="104" width={trackW} height="72" fill="#4b4f63" />
          <rect x="0" y="104" width={trackW} height="4" fill="#ffffff" opacity="0.5" />
          <rect x="0" y="139" width={trackW} height="3" fill="#ffe9a8" opacity="0.85" />
          
          {/* Lane dashes */}
          {Array.from({ length: RACE_LEVELS + 2 }).map((_, i) => (
            <rect key={`t${i}`} x={i * SEG + 8} y={120} width={20} height="3" fill="#ffffff" opacity="0.45" />
          ))}
          {Array.from({ length: RACE_LEVELS + 2 }).map((_, i) => (
            <rect key={`b${i}`} x={i * SEG + 8} y={158} width={20} height="3" fill="#ffffff" opacity="0.45" />
          ))}
          
          {/* Start Line */}
          <rect x={SEG - 6} y="104" width="6" height="72" fill="#ffffff" opacity="0.8" />
          
          {/* Level 15: Racing Overpass Bridge (Drawn OVER the road) */}
          <g transform={`translate(${15 * SEG}, 40)`}>
            {/* Pillars spanning the road */}
            <rect x="10" y="15" width="8" height="136" fill="#64748b" opacity="0.95" />
            <rect x="62" y="15" width="8" height="136" fill="#64748b" opacity="0.95" />
            <rect x="12" y="151" width="4" height="25" fill="#475569" />
            <rect x="64" y="151" width="4" height="25" fill="#475569" />
            {/* Banner */}
            <rect x="0" y="0" width="80" height="20" fill="#3b82f6" rx="2" />
            <text x="40" y="14" fontSize="10" fill="#ffffff" textAnchor="middle" fontWeight="bold" letterSpacing="1">SPRINT</text>
          </g>

          {/* Original Finish Line */}
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
        <div className="relative mt-1">
          {boosting && (
            <div className="absolute left-[2px] top-[14px] pointer-events-none">
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
          
          {/* UPDATED SPORTY CAR SVG */}
          <svg
            width="58"
            height="26"
            viewBox="0 0 58 26"
            style={{
              animation: boosting
                ? "car-boost 0.6s ease-in-out infinite"
                : "car-bob 1.6s ease-in-out infinite",
            }}
          >
            {/* Shadow */}
            <ellipse cx="29" cy="24" rx="22" ry="2.5" fill="#000" opacity="0.18" />
            
            {/* Sporty Body Path */}
            <path d="M 6 18 L 8 11 C 11 7, 18 6, 25 6 L 35 6 C 44 6, 50 9, 53 13 L 56 18 Z" fill={color} />
            
            {/* Lower Trim / Side Skirt */}
            <path d="M 6 18 L 56 18 L 54 21 L 8 21 Z" fill="#1f2333" opacity="0.4" />
            
            {/* Sporty Rear Spoiler */}
            <path d="M 4 10 L 10 8 L 13 8" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <line x1="6" y1="12" x2="9" y2="9" stroke="#1f2333" strokeWidth="1.5" opacity="0.6" />

            {/* Tinted Windows */}
            <path d="M 23 7 L 34 7 C 39 7, 43 9, 46 12 L 20 12 C 18 10, 20 7, 23 7 Z" fill="#ffffff" opacity="0.9" />
            <line x1="33" y1="7" x2="35" y2="12" stroke={color} strokeWidth="2" /> {/* Pillar */}
            
            {/* Details */}
            <circle cx="54" cy="15" r="2.5" fill="#fef08a" /> {/* Headlight */}
            <rect x="5" y="14" width="2" height="3" fill="#ef4444" /> {/* Taillight */}

            {/* Sport Wheels */}
            <circle cx="16" cy="19" r="5" fill="#22232e" />
            <circle cx="16" cy="19" r="2" fill="#e2e8f0" />
            <circle cx="42" cy="19" r="5" fill="#22232e" />
            <circle cx="42" cy="19" r="2" fill="#e2e8f0" />
          </svg>
        </div>
      </div>
    </div>
  );
}