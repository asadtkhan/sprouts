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
  
  // Keep own car around 38% of the viewport
  const camera = Math.max(0, Math.min(trackW - viewW, meX - viewW * 0.38));
  
  // Progress (0.0 to 1.0) dictates the time of day and scenery
  const progress = Math.min(1, meStep / RACE_LEVELS);
  const isSunset = progress > 0.4;
  const isNight = progress > 0.75;

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
        @keyframes wheelSpin { 100%{transform:rotate(360deg)} }
        @keyframes car-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
        @keyframes car-boost { 0%,100%{transform:translateY(0) rotate(0deg)} 20%{transform:translateY(-2px) rotate(-2deg)} }
        @keyframes exhaust-flame { 0%{transform:scale(0.8); opacity:0.8} 100%{transform:scale(1.5) translate(-10px, 0); opacity:0} }
        @keyframes dashScroll { 0%{stroke-dashoffset: 24} 100%{stroke-dashoffset: 0} }
        @keyframes starTwinkle { 0%,100%{opacity:0.2} 50%{opacity:1} }
        @keyframes lightPulse { 0%,100%{opacity:0.8; filter:brightness(1)} 50%{opacity:1; filter:brightness(1.3)} }
      `}</style>

      {/* Dynamic Sky Background */}
      <div 
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: isNight
            ? "linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)" // Night
            : isSunset
            ? "linear-gradient(180deg, #ea580c 0%, #f97316 40%, #fcd34d 100%)" // Sunset
            : "linear-gradient(180deg, #38bdf8 0%, #7dd3fc 50%, #e0f2fe 100%)" // Day
        }}
      />

      {/* Stars (Visible only at night) */}
      <div className="absolute inset-0" style={{ opacity: isNight ? 1 : 0, transition: "opacity 2s" }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 40}%`,
              width: i % 3 === 0 ? 2 : 1,
              height: i % 3 === 0 ? 2 : 1,
              animation: `starTwinkle ${2 + (i % 3)}s infinite ${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Parallax Cityscape (Layer 1 - Slow) */}
      <div className="absolute inset-0" style={{ transform: `translateX(${-camera * 0.15}px)` }}>
        <svg width={trackW} height="100%" viewBox={`0 0 ${trackW} 200`} preserveAspectRatio="none">
          {Array.from({ length: 24 }).map((_, i) => {
            const bx = i * (trackW / 24);
            const w = 40 + (i * 17) % 50;
            const h = 30 + (i * 43) % 80;
            // Buildings darken as night falls
            const bColor = isNight ? "#0f172a" : isSunset ? "#9a3412" : "#bae6fd";
            const wColor = isNight ? "#fef08a" : "transparent"; // Windows turn on at night
            return (
              <g key={`city-${i}`}>
                <rect x={bx} y={115 - h} width={w} height={h} fill={bColor} opacity={isNight ? 0.8 : 0.6} />
                {/* Glowing Windows */}
                {isNight && i % 2 === 0 && (
                  <g fill={wColor} opacity="0.7">
                    <rect x={bx + 5} y={115 - h + 10} width="4" height="6" />
                    <rect x={bx + 15} y={115 - h + 10} width="4" height="6" />
                    <rect x={bx + 15} y={115 - h + 30} width="4" height="6" />
                    <rect x={bx + 25} y={115 - h + 20} width="4" height="6" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Parallax Mountains/Trees (Layer 2 - Medium) */}
      <div className="absolute inset-0" style={{ transform: `translateX(${-camera * 0.4}px)` }}>
        <svg width={trackW} height="100%" viewBox={`0 0 ${trackW} 200`} preserveAspectRatio="none">
          <path d={`M0 115 Q ${trackW * 0.2} 90 ${trackW * 0.4} 115 T ${trackW * 0.8} 115 T ${trackW} 115 L ${trackW} 200 L 0 200 Z`} fill={isNight ? "#020617" : isSunset ? "#7c2d12" : "#94a3b8"} opacity="0.7" />
          {/* Silhouetted Trees */}
          {Array.from({ length: 30 }).map((_, i) => {
            const tx = i * 60 + (i * 29) % 30;
            if (tx > trackW) return null;
            return (
              <path key={`tree-${i}`} d={`M${tx} 115 L${tx+8} 95 L${tx+16} 115 Z`} fill={isNight ? "#000000" : isSunset ? "#431407" : "#475569"} opacity="0.8" />
            );
          })}
        </svg>
      </div>

      {/* The Track and Foreground (Layer 3 - Realtime) */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateX(${-camera}px)`, width: trackW, transition: "transform 700ms ease-out" }}
      >
        <svg width={trackW} height="100%" viewBox={`0 0 ${trackW} 200`} preserveAspectRatio="none">
          {/* Track Asphalt */}
          <rect x="0" y="115" width={trackW} height="85" fill={isNight ? "#1e293b" : "#334155"} />
          
          {/* Racing Kerbs (Red & White strips at the top and bottom of the track) */}
          <line x1="0" y1="117" x2={trackW} y2="117" stroke="#ef4444" strokeWidth="4" strokeDasharray="16 16" />
          <line x1="16" y1="117" x2={trackW} y2="117" stroke="#ffffff" strokeWidth="4" strokeDasharray="16 16" />
          
          <line x1="0" y1="198" x2={trackW} y2="198" stroke="#ef4444" strokeWidth="4" strokeDasharray="20 20" />
          <line x1="20" y1="198" x2={trackW} y2="198" stroke="#ffffff" strokeWidth="4" strokeDasharray="20 20" />

          {/* Lane Divider (Moving Dashes) */}
          <line 
            x1="0" y1="157" x2={trackW} y2="157" 
            stroke="#ffffff" strokeWidth="3" strokeDasharray="24 24" opacity="0.4"
            style={{ animation: (boosting || oppStep != null) ? "dashScroll 0.4s linear infinite" : "none" }}
          />

          {/* Starting Gantry */}
          <g transform={`translate(${SEG - 10}, 60)`}>
            <rect x="0" y="0" width="10" height="140" fill="#1f2937" />
            <rect x="-5" y="0" width="30" height="15" fill="#111827" />
            <circle cx="2" cy="7.5" r="4" fill="#22c55e" style={{ animation: "lightPulse 1s infinite" }} />
            <circle cx="10" cy="7.5" r="4" fill="#22c55e" style={{ animation: "lightPulse 1s infinite 0.2s" }} />
            <circle cx="18" cy="7.5" r="4" fill="#22c55e" style={{ animation: "lightPulse 1s infinite 0.4s" }} />
            {/* Start Line */}
            <rect x="2" y="55" width="6" height="85" fill="#ffffff" opacity="0.9" />
          </g>

          {/* Finish Line Arch */}
          <g transform={`translate(${(RACE_LEVELS + 1) * SEG}, 40)`}>
            {/* Pillars */}
            <rect x="-5" y="0" width="10" height="160" fill="#1f2937" />
            <rect x="20" y="0" width="10" height="160" fill="#1f2937" />
            {/* Checkered Banner */}
            <rect x="-10" y="20" width="45" height="20" fill="#ffffff" />
            {Array.from({ length: 4 }).map((_, r) =>
              Array.from({ length: 9 }).map((_, c) => (
                (r + c) % 2 === 0 && <rect key={`${r}-${c}`} x={-10 + c * 5} y={20 + r * 5} width="5" height="5" fill="#000000" />
              ))
            )}
            <text x="12" y="15" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold" style={{ animation: "lightPulse 1s infinite" }}>FINISH</text>
            {/* Finish Line on Track */}
            {Array.from({ length: 11 }).map((_, r) => (
              <rect key={`f1${r}`} x="0" y={115 + r * 8} width="12" height="8" fill={r % 2 === 0 ? "#000" : "#fff"} />
            ))}
            {Array.from({ length: 11 }).map((_, r) => (
              <rect key={`f2${r}`} x="12" y={115 + r * 8} width="12" height="8" fill={r % 2 === 0 ? "#fff" : "#000"} />
            ))}
          </g>
        </svg>

        {/* Opponent Car (Far Lane) */}
        {oppX != null && (
          <Car
            x={oppX}
            top="135px"
            color="#8b7cf6"
            label={oppName ?? "Opponent"}
            scale={0.85}
            isNight={isNight}
          />
        )}
        
        {/* Your Car (Near Lane) */}
        <Car 
          x={meX} 
          top="175px" 
          color="#f43f5e" 
          label={meName} 
          you 
          scale={1} 
          boosting={boosting} 
          isNight={isNight}
        />
      </div>

      {/* Level Marker */}
      <div className="absolute bottom-2 right-3 text-[10px] font-medium rounded-full bg-black/50 text-white px-2.5 py-1 shadow-sm backdrop-blur-sm border border-white/10">
        Lap {Math.min(meStep, RACE_LEVELS)} / {RACE_LEVELS}
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
  isNight,
}: {
  x: number;
  top: string;
  color: string;
  label: string;
  you?: boolean;
  scale?: number;
  boosting?: boolean;
  isNight?: boolean;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top,
        transform: `translate(-50%,-50%) scale(${scale})`,
        transition: "left 700ms cubic-bezier(0.34, 1.56, 0.64, 1)", // Springy elastic movement
        zIndex: you ? 20 : 10,
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        {/* Name Tag */}
        <span
          className={cn(
            "text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm border",
            you 
              ? "bg-white/95 text-foreground font-bold border-slate-200" 
              : "bg-slate-800/80 text-white font-medium border-slate-700/50",
          )}
        >
          {label}
        </span>
        
        <div className="relative mt-1">
          {/* Boost Flames */}
          {boosting && (
            <div className="absolute left-[-15px] top-[14px] pointer-events-none z-0">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 12,
                    height: 4,
                    background: "linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)", // Blue nitrous flame
                    animation: `exhaust-flame 400ms ease-out ${i * 150}ms infinite alternate`,
                    filter: "blur(1px)",
                  }}
                />
              ))}
            </div>
          )}

          {/* GT Sports Car SVG */}
          <svg
            width="64"
            height="28"
            viewBox="0 0 64 28"
            style={{
              animation: boosting
                ? "car-boost 0.6s ease-in-out infinite"
                : "car-bob 1.6s ease-in-out infinite",
              filter: isNight ? "drop-shadow(0 10px 8px rgba(0,0,0,0.5))" : "drop-shadow(0 6px 4px rgba(0,0,0,0.3))",
            }}
            className="relative z-10"
          >
            {/* Chassis */}
            <path d="M 6 22 L 8 13 C 10 9, 15 8, 20 8 L 32 6 C 40 4, 48 8, 54 13 C 58 16, 60 18, 60 22 L 6 22 Z" fill={color} />
            <path d="M 6 22 L 60 22 L 58 25 L 8 25 Z" fill="#1e293b" /> {/* Side skirt */}
            
            {/* Windows */}
            <path d="M 22 8 L 31 7 C 36 6, 42 8, 47 12 L 20 12 C 18 10, 20 8, 22 8 Z" fill="#0f172a" opacity="0.85" />
            <path d="M 33 7 L 35 12" stroke={color} strokeWidth="2" /> {/* Window divider */}

            {/* Rear Spoiler */}
            <path d="M 4 11 L 10 9 L 14 9" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <line x1="6" y1="13" x2="10" y2="10" stroke="#0f172a" strokeWidth="2" />
            
            {/* Headlights & Taillights */}
            <path d="M 54 15 L 59 17 L 59 19 L 55 19 Z" fill={isNight ? "#fef08a" : "#f8fafc"} />
            <rect x="5" y="14" width="3" height="4" fill={isNight ? "#ef4444" : "#991b1b"} />
            
            {/* Glow Effects (Active at Night) */}
            {isNight && (
              <g style={{ animation: "lightPulse 1.5s infinite alternate" }}>
                {/* Headlight Beam */}
                <path d="M 59 17 L 90 5 L 90 28 L 59 19 Z" fill="url(#headlight-glow)" opacity="0.6" />
                {/* Taillight Glow */}
                <circle cx="6" cy="16" r="6" fill="#ef4444" opacity="0.5" filter="blur(2px)" />
              </g>
            )}

            {/* Wheels */}
            <g transform="translate(16, 22)">
              <circle cx="0" cy="0" r="5.5" fill="#0f172a" />
              {/* Spinning Alloy */}
              <g style={{ animation: (boosting || oppStep != null) ? "wheelSpin 0.25s linear infinite" : "none", transformOrigin: "0px 0px" }}>
                <circle cx="0" cy="0" r="3.5" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" />
                <circle cx="0" cy="0" r="1.5" fill="#f8fafc" />
              </g>
            </g>
            <g transform="translate(48, 22)">
              <circle cx="0" cy="0" r="5.5" fill="#0f172a" />
              <g style={{ animation: (boosting || oppStep != null) ? "wheelSpin 0.25s linear infinite" : "none", transformOrigin: "0px 0px" }}>
                <circle cx="0" cy="0" r="3.5" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" />
                <circle cx="0" cy="0" r="1.5" fill="#f8fafc" />
              </g>
            </g>

            <defs>
              <linearGradient id="headlight-glow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}