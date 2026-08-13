import { TRIP_LEVELS } from "@/lib/race";
import { cn } from "@/lib/utils";

interface Props {
  step: number;
  idle?: number; // days since the ride last moved
  riderA: string;
  riderB?: string | null;
  compact?: boolean;
}

export type TripBeat = {
  title: string;
  caption: string;
};

/** Story beats across the 30 levels. */
export function tripBeat(step: number, idle = 0): TripBeat {
  if (idle >= 2)
    return {
      title: idle >= 4 ? "Flat tyre" : "Parked for a break",
      caption:
        idle >= 4
          ? "The back tyre gave up while the bike sat still. One 'I did it' patches it up."
          : "The bike is parked by the roadside and you're both resting. Mark a day to roll again.",
    };
  if (step <= 0) return { title: "Packing the bags", caption: "Bedrolls, snacks, a map. The mountains are waiting." };
  if (step <= 2) return { title: "Hopping on", caption: "Helmets on, engine warm, kickstand up." };
  if (step <= 6) return { title: "Out of the city", caption: "Streetlights thin out and the road opens up." };
  if (step <= 10) return { title: "Village tea stop", caption: "You meet a chai seller who insists on a second cup." };
  if (step <= 14) return { title: "Racing the horses", caption: "A pair of wild horses gallop alongside you for a mile." };
  if (step <= 18) return { title: "River crossing", caption: "Cold spray, a wooden bridge and a very loud cheer." };
  if (step <= 22) return { title: "First switchbacks", caption: "The road starts climbing. The air turns thinner and sweeter." };
  if (step <= 26) return { title: "Cloud line", caption: "You ride straight through a cloud. Everything glows." };
  if (step < TRIP_LEVELS) return { title: "Final pass", caption: "The summit road is right there. Keep the throttle steady." };
  return { title: "You made it", caption: "Bike parked at the top, mountains all around. Together." };
}

const SEG = 46;

export function BikeTrip({ step, idle = 0, riderA, riderB, compact }: Props) {
  const trackW = (TRIP_LEVELS + 2) * SEG;
  const x = (Math.min(step, TRIP_LEVELS) + 1) * SEG;
  const viewW = compact ? 220 : 340;
  const camera = Math.max(0, Math.min(trackW - viewW, x - viewW * 0.42));
  const resting = idle >= 2;
  const punctured = idle >= 4;
  const arrived = step >= TRIP_LEVELS;
  const climbing = step > 18;

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl", compact ? "h-28" : "h-56")}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffe7c9_0%,#ffd9df_28%,#dbe9ff_60%,#cfe7d6_61%,#bfdcc7_100%)]" />
      {/* far mountains drift slowly with the camera */}
      <div className="absolute inset-0" style={{ transform: `translateX(${-camera * 0.25}px)` }}>
        <svg width={trackW} height="100%" viewBox={`0 0 ${trackW} 200`} preserveAspectRatio="none">
          {Array.from({ length: 14 }).map((_, i) => {
            const bx = i * (trackW / 14);
            const h = 40 + ((i * 37) % 46);
            return (
              <g key={i}>
                <path d={`M${bx} 120 L${bx + 70} ${120 - h} L${bx + 140} 120 Z`} fill="#9db6d8" opacity="0.75" />
                <path d={`M${bx + 55} ${120 - h + 18} L${bx + 70} ${120 - h} L${bx + 85} ${120 - h + 18} Z`} fill="#ffffff" opacity="0.9" />
              </g>
            );
          })}
        </svg>
      </div>

      <div
        className="absolute inset-0"
        style={{ transform: `translateX(${-camera}px)`, width: trackW, transition: "transform 900ms ease-out" }}
      >
        <svg width={trackW} height="100%" viewBox={`0 0 ${trackW} 200`} preserveAspectRatio="none">
          {/* hills */}
          <path
            d={`M0 128 Q ${trackW * 0.12} 96 ${trackW * 0.25} 128 T ${trackW * 0.5} 128 T ${trackW * 0.75} 128 T ${trackW} 128 L ${trackW} 200 L 0 200 Z`}
            fill="#a9d3b2"
            opacity="0.85"
          />
          {/* road */}
          <rect x="0" y="140" width={trackW} height="46" fill="#5a5f74" />
          <rect x="0" y="140" width={trackW} height="3" fill="#ffffff" opacity="0.45" />
          {Array.from({ length: TRIP_LEVELS + 2 }).map((_, i) => (
            <rect key={i} x={i * SEG + 10} y={162} width={22} height="3" fill="#ffe9a8" opacity="0.8" />
          ))}
          {/* scenery props at story beats */}
          <g>
            {/* tea stall */}
            <rect x={9 * SEG} y="118" width="26" height="22" rx="3" fill="#e8b06a" />
            <path d={`M${9 * SEG - 4} 118 L${9 * SEG + 13} 106 L${9 * SEG + 30} 118 Z`} fill="#c2703f" />
            {/* horses */}
            <g opacity="0.95">
              <path d={`M${13 * SEG} 132 q6 -10 16 -8 l6 -6 3 7 q7 3 5 12 l-4 8 -3 -7 -6 1 -2 7 -4 -7 -6 2 z`} fill="#8a5a3b" />
            </g>
            {/* bridge rails */}
            <rect x={17 * SEG} y="132" width={SEG * 1.6} height="4" fill="#c9a37a" />
            {/* summit flag */}
            <rect x={(TRIP_LEVELS + 1) * SEG} y="96" width="3" height="44" fill="#4b4f63" />
            <path d={`M${(TRIP_LEVELS + 1) * SEG + 3} 96 l20 7 -20 7 z`} fill="#f97362" />
          </g>
        </svg>

        {/* the bike */}
        <div
          className="absolute"
          style={{
            left: x,
            top: climbing ? "62%" : "68%",
            transform: "translate(-50%,-50%)",
            transition: "left 900ms ease-out, top 900ms ease-out",
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/90 text-foreground font-semibold whitespace-nowrap">
              {riderB ? `${riderA} + ${riderB}` : riderA}
            </span>
            <svg
              width="72"
              height="40"
              viewBox="0 0 72 40"
              style={{ animation: resting ? "none" : "bike-bob 1.1s ease-in-out infinite" }}
            >
              <ellipse cx="36" cy="35" rx="24" ry="3" fill="#000" opacity="0.16" />
              {/* wheels */}
              <circle cx="16" cy="29" r="8" fill="none" stroke="#22232e" strokeWidth="3" />
              <circle
                cx="56"
                cy={punctured ? 31 : 29}
                r={punctured ? 6.5 : 8}
                fill="none"
                stroke="#22232e"
                strokeWidth={punctured ? 4 : 3}
              />
              {/* frame */}
              <path d="M16 29 L30 18 L44 18 L56 29" stroke="#f97362" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M30 18 L26 12" stroke="#4b4f63" strokeWidth="3" strokeLinecap="round" />
              {/* riders */}
              <g>
                <circle cx="34" cy="8" r="4.5" fill="#f6c89a" />
                <path d="M30 18 q4 -7 8 -6 l3 6 z" fill="#5b7cf9" />
              </g>
              {riderB && (
                <g>
                  <circle cx="46" cy="9" r="4.2" fill="#e6b184" />
                  <path d="M42 18 q4 -6 8 -5 l3 5 z" fill="#8b7cf6" />
                </g>
              )}
              {/* exhaust puffs while moving */}
              {!resting && (
                <g opacity="0.55">
                  <circle cx="6" cy="26" r="3" fill="#ffffff" style={{ animation: "puff 1.4s ease-out infinite" }} />
                  <circle cx="2" cy="24" r="2.2" fill="#ffffff" style={{ animation: "puff 1.4s ease-out .5s infinite" }} />
                </g>
              )}
              {punctured && (
                <text x="56" y="16" fontSize="9" textAnchor="middle" fill="#c2413b">
                  !
                </text>
              )}
            </svg>
          </div>
        </div>
      </div>

      <div className="absolute bottom-1.5 right-2 text-[10px] font-medium rounded-full bg-black/35 text-white px-2 py-0.5">
        {arrived ? "Summit reached" : `Stage ${Math.min(step, TRIP_LEVELS)}/${TRIP_LEVELS}`}
      </div>

      <style>{`
        @keyframes bike-bob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-2px) rotate(-1deg)}}
        @keyframes puff{0%{opacity:.6;transform:translate(0,0) scale(.6)}100%{opacity:0;transform:translate(-10px,-6px) scale(1.4)}}
      `}</style>
    </div>
  );
}
