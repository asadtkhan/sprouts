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

/** Story beats across the levels. */
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
const VIEW_H = 200; // native design height, matches every layer's SVG viewBox 1:1

export function BikeTrip({ step, idle = 0, riderA, riderB, compact }: Props) {
  const trackW = (TRIP_LEVELS + 2) * SEG;
  const x = (Math.min(step, TRIP_LEVELS) + 1) * SEG;
  const viewW = compact ? 220 : 340;
  const camera = Math.max(0, Math.min(trackW - viewW, x - viewW * 0.42));
  // Render every parallax layer at native size and scale the whole scene
  // down uniformly for the compact homepage preview, instead of stretching
  // each layer's height to fill the panel (which flattened the tea stall
  // sign, the summit flag and everything else drawn in the scene).
  const panelH = compact ? 112 : 224;
  const scale = panelH / VIEW_H;
  
  const resting = idle >= 2;
  const punctured = idle >= 4;
  const moving = !resting;
  const arrived = step >= TRIP_LEVELS;
  
  // Progress determines environmental changes (0.0 to 1.0)
  const progress = Math.min(1, step / TRIP_LEVELS);
  const climbing = progress > 0.6;
  const highAltitude = progress > 0.8;

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl", compact ? "h-28" : "h-56")}>
      <style>{`
        @keyframes bikeBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.5px)} }
        @keyframes wheelSpin { 100%{transform:rotate(360deg)} }
        @keyframes puff { 0%{opacity:0.6;transform:translate(0,0) scale(0.6)} 100%{opacity:0;transform:translate(-15px,-8px) scale(1.6)} }
        @keyframes dashScroll { 0%{stroke-dashoffset: 24} 100%{stroke-dashoffset: 0} }
        @keyframes horseGallop { 
          0%, 100% { transform: translateY(0) rotate(-2deg); } 
          25% { transform: translateY(-4px) rotate(4deg); } 
          75% { transform: translateY(-2px) rotate(-4deg); } 
        }
        @keyframes cloudDrift { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-15px); } }
        @keyframes waterFlow { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
      `}</style>

      {/* Dynamic Sky Gradient (Transitions from plains to high mountains) */}
      <div 
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: highAltitude 
            ? "linear-gradient(180deg, #a7cbf2 0%, #d6e8fa 50%, #f0f6fc 100%)" // Snowy mountain sky
            : climbing 
            ? "linear-gradient(180deg, #93c5fd 0%, #bfdbfe 50%, #e0f2fe 100%)" // Hill sky
            : "linear-gradient(180deg, #ffe7c9 0%, #ffd9df 28%, #dbe9ff 60%, #cfe7d6 100%)" // Warm plains sky
        }} 
      />

      {/* World wrapper: every layer below is laid out at native size, then this
          single scale keeps them all in proportion at any panel size. */}
      <div
        className="absolute top-0 left-0"
        style={{ width: trackW, height: VIEW_H, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
      {/* Layer 1: Far Mountains (Parallax moving slowest) */}
      <div className="absolute inset-0" style={{ transform: `translateX(${-camera * 0.15}px)` }}>
        <svg width={trackW} height={VIEW_H} viewBox={`0 0 ${trackW} 200`}>
          {Array.from({ length: 18 }).map((_, i) => {
            const bx = i * (trackW / 18);
            const h = 50 + ((i * 41) % 60);
            const isSnowy = i > 12; // Far mountains become snowy towards the end of the track
            return (
              <g key={i}>
                <path d={`M${bx} 120 L${bx + 80} ${120 - h} L${bx + 160} 120 Z`} fill={isSnowy ? "#8ba8c9" : "#9db6d8"} opacity="0.6" />
                {(isSnowy || h > 80) && (
                  <path d={`M${bx + 60} ${120 - h + 25} L${bx + 80} ${120 - h} L${bx + 100} ${120 - h + 25} Z`} fill="#ffffff" opacity="0.8" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Layer 2: Midground Hills (Parallax medium) */}
      <div className="absolute inset-0" style={{ transform: `translateX(${-camera * 0.4}px)` }}>
        <svg width={trackW} height={VIEW_H} viewBox={`0 0 ${trackW} 200`}>
          <path
            d={`M0 135 Q ${trackW * 0.15} 100 ${trackW * 0.3} 135 T ${trackW * 0.6} 135 T ${trackW * 0.9} 135 T ${trackW} 135 L ${trackW} 200 L 0 200 Z`}
            fill={highAltitude ? "#cadbea" : "#8ab597"}
            opacity="0.8"
          />
          {/* Pine trees appearing towards the climb */}
          {Array.from({ length: 15 }).map((_, i) => {
            const tx = (trackW * 0.4) + i * 80 + ((i * 13) % 40);
            if (tx > trackW) return null;
            return (
              <path key={`tree-${i}`} d={`M${tx} 135 L${tx+10} 105 L${tx+20} 135 Z`} fill={highAltitude ? "#5a7a6b" : "#4a7a58"} opacity="0.7" />
            );
          })}
        </svg>
      </div>

      {/* Layer 3: The Road, Scenery Props, and Foreground (Moves 1:1 with camera) */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateX(${-camera}px)`, width: trackW, transition: "transform 900ms ease-out" }}
      >
        <svg width={trackW} height={VIEW_H} viewBox={`0 0 ${trackW} 200`}>
          
          {/* Road Surface */}
          <rect x="0" y="145" width={trackW} height="40" fill={highAltitude ? "#69727d" : "#5a5f74"} />
          
          {/* Scrolling Road Dashes */}
          <line 
            x1="0" y1="165" x2={trackW} y2="165" 
            stroke="#ffffff" strokeWidth="3" strokeDasharray="12 12" opacity="0.5"
            style={{ animation: moving ? "dashScroll 0.5s linear infinite" : "none" }}
          />
          
          {/* Foreground Grass/Snow */}
          <rect x="0" y="185" width={trackW} height="15" fill={highAltitude ? "#e2e8f0" : "#a4d982"} opacity="0.9" />

          {/* --- STORY BEATS / PROPS --- */}
          <g>
            {/* Village Tea Stall (Stage 10 ~ 460px) */}
            <g transform={`translate(${10 * SEG}, 115)`}>
              <rect x="0" y="0" width="40" height="30" rx="2" fill="#d2a679" />
              <path d="M-5 0 L20 -15 L45 0 Z" fill="#b06240" />
              <rect x="5" y="15" width="30" height="15" fill="#8c6239" />
              <circle cx="20" cy="12" r="3" fill="#cbd5e1" /> {/* Teapot */}
              {/* Smoke from tea */}
              <path d="M19 6 Q17 2 21 -2 T20 -6" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.6" style={{ animation: "puff 2s infinite" }} />
              {/* Seller */}
              <circle cx="10" cy="8" r="4" fill="#f6c89a" />
              <rect x="6" y="12" width="8" height="18" fill="#4a5568" />
            </g>

            {/* Galloping Horses (Stage 14 ~ 644px) */}
            <g transform={`translate(${14 * SEG}, 130)`}>
              {/* Horse 1 (Background) */}
              <g fill="#5c3a21" opacity="0.8" transform="scale(0.8) translate(30, -5)" style={{ animation: moving ? "horseGallop 0.6s ease-in-out infinite 0.1s" : "none", transformOrigin: "15px 15px" }}>
                <path d="M10 20 Q15 5 25 5 L35 15 L40 10 L45 20 Q35 25 35 35 L30 40 L25 35 L15 40 L10 30 Z" />
                <path d="M35 15 L32 5 L38 8 Z" /> {/* Ear */}
                <path d="M10 20 Q0 25 5 35" stroke="#5c3a21" strokeWidth="3" fill="none" /> {/* Tail */}
              </g>
              {/* Horse 2 (Foreground) */}
              <g fill="#8a5a3b" style={{ animation: moving ? "horseGallop 0.6s ease-in-out infinite" : "none", transformOrigin: "15px 15px" }}>
                <path d="M10 20 Q15 5 25 5 L35 15 L40 10 L45 20 Q35 25 35 35 L30 40 L25 35 L15 40 L10 30 Z" />
                <path d="M35 15 L32 5 L38 8 Z" /> {/* Ear */}
                <path d="M10 20 Q0 25 5 35" stroke="#8a5a3b" strokeWidth="3" fill="none" /> {/* Tail */}
              </g>
            </g>

            {/* River Crossing & Wooden Bridge (Stage 18 ~ 828px) */}
            <g transform={`translate(${17.5 * SEG}, 145)`}>
              {/* River water */}
              <path d="M10 -15 L30 -15 L15 40 L-5 40 Z" fill="#60a5fa" opacity="0.8" />
              <path d="M15 -10 L25 -10 L10 35 L0 35 Z" fill="#93c5fd" opacity="0.6" style={{ animation: "waterFlow 2s infinite" }} />
              {/* Wooden Bridge Planks */}
              {Array.from({ length: 7 }).map((_, i) => (
                <rect key={i} x={-20 + i * 8} y="0" width="6" height="40" fill="#8b5a2b" rx="1" />
              ))}
              {/* Bridge Rails */}
              <rect x="-25" y="-10" width="60" height="4" fill="#5c3a21" rx="2" />
              <rect x="-25" y="42" width="60" height="4" fill="#5c3a21" rx="2" />
            </g>

            {/* Cloud Line / High Altitude (Stage 26 ~ 1196px) */}
            <g transform={`translate(${25 * SEG}, 110)`} opacity="0.8" style={{ animation: "cloudDrift 8s ease-in-out infinite alternate" }}>
              <circle cx="20" cy="30" r="25" fill="#ffffff" />
              <circle cx="50" cy="15" r="35" fill="#ffffff" />
              <circle cx="80" cy="35" r="20" fill="#ffffff" />
              <circle cx="110" cy="20" r="30" fill="#ffffff" />
            </g>

            {/* Final Summit Pass (End of track) */}
            <g transform={`translate(${(TRIP_LEVELS + 1) * SEG}, 100)`}>
              {/* Summit Marker Flag */}
              <rect x="0" y="0" width="4" height="45" fill="#4b4f63" />
              <path d="M4 2 L25 10 L4 18 Z" fill="#ef4444" style={{ animation: "horseGallop 1s infinite" }} /> {/* Wind flutter */}
              {/* Snow pile around base */}
              <ellipse cx="2" cy="45" rx="15" ry="5" fill="#ffffff" />
            </g>
          </g>
        </svg>

        {/* --- THE BIKE & RIDERS --- */}
        <div
          className="absolute"
          style={{
            left: x,
            // Adjust bike height based on terrain and puncture status
            top: punctured ? "71%" : (climbing ? "62%" : "68%"),
            transform: "translate(-50%,-50%)",
            transition: "left 900ms ease-out, top 900ms ease-out",
            zIndex: 10,
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/95 text-foreground font-semibold whitespace-nowrap shadow-sm border border-slate-200">
              {riderB ? `${riderA} + ${riderB}` : riderA}
            </span>
            
            <svg
              width="90"
              height="55"
              viewBox="0 0 90 55"
              style={{ animation: moving ? "bikeBob 0.8s ease-in-out infinite" : "none" }}
            >
              {/* Drop shadow */}
              <ellipse cx="45" cy="50" rx="30" ry="4" fill="#000" opacity="0.2" />

              {/* Luggage (Packed bags on the back) */}
              <g transform="translate(10, 18)">
                <rect x="0" y="0" width="16" height="12" rx="3" fill="#6b7280" /> {/* Duffel */}
                <rect x="2" y="-4" width="12" height="6" rx="2" fill="#d97706" /> {/* Sleeping bag */}
                <line x1="4" y1="-5" x2="4" y2="12" stroke="#1f2937" strokeWidth="1.5" /> {/* Straps */}
                <line x1="12" y1="-5" x2="12" y2="12" stroke="#1f2937" strokeWidth="1.5" />
              </g>

              {/* The Bike Frame */}
              <g transform="translate(10, 20)">
                {/* Wheels */}
                {/* Rear Wheel (flattens if punctured) */}
                <g transform="translate(10, 20)">
                  {punctured ? (
                    <ellipse cx="0" cy="5" rx="11" ry="6" fill="none" stroke="#1e293b" strokeWidth="4" />
                  ) : (
                    <circle cx="0" cy="0" r="10" fill="none" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 4" style={{ animation: moving ? "wheelSpin 0.4s linear infinite" : "none", transformOrigin: "0px 0px" }} />
                  )}
                  <circle cx="0" cy="0" r="3" fill="#94a3b8" />
                </g>
                
                {/* Front Wheel */}
                <g transform="translate(56, 20)">
                  <circle cx="0" cy="0" r="10" fill="none" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 4" style={{ animation: moving ? "wheelSpin 0.4s linear infinite" : "none", transformOrigin: "0px 0px" }} />
                  <circle cx="0" cy="0" r="3" fill="#94a3b8" />
                </g>

                {/* Engine & Chassis */}
                <path d="M 10 20 L 25 10 L 45 10 L 56 20" stroke="#f43f5e" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 25 10 L 20 -2" stroke="#475569" strokeWidth="4" strokeLinecap="round" /> {/* Seat post */}
                <path d="M 45 10 L 52 -5" stroke="#475569" strokeWidth="3" strokeLinecap="round" /> {/* Handlebar post */}
                <path d="M 48 -5 Q 52 -10 58 -5" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" /> {/* Handlebars */}
                
                {/* Exhaust */}
                <line x1="25" y1="18" x2="5" y2="18" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                
                {/* Kickstand (Deployed when resting) */}
                {resting && <line x1="30" y1="20" x2="26" y2="28" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />}
              </g>

              {/* Exhaust Puffs */}
              {moving && (
                <g opacity="0.6">
                  <circle cx="10" cy="38" r="4" fill="#ffffff" style={{ animation: "puff 1.2s ease-out infinite" }} />
                  <circle cx="5" cy="36" r="3" fill="#ffffff" style={{ animation: "puff 1.2s ease-out 0.4s infinite" }} />
                </g>
              )}

              {/* Puncture Warning */}
              {punctured && (
                <g transform="translate(15, 10)">
                  <circle cx="0" cy="0" r="8" fill="#ef4444" />
                  <text x="0" y="3" fontSize="10" textAnchor="middle" fill="#ffffff" fontWeight="bold">!</text>
                </g>
              )}

              {/* --- RIDERS --- */}
              {resting ? (
                // Riders dismounted and sitting next to the bike
                <g transform="translate(0, 35)">
                  {/* Rider A Sitting */}
                  <circle cx="15" cy="-8" r="5" fill="#f6c89a" /> {/* Head without helmet for break */}
                  <path d="M 15 -3 Q 10 5 10 15 L 20 15 Q 20 5 15 -3 Z" fill="#3b82f6" /> {/* Body */}
                  
                  {/* Rider B Sitting */}
                  {riderB && (
                    <g transform="translate(15, 0)">
                      <circle cx="15" cy="-7" r="4.5" fill="#e6b184" />
                      <path d="M 15 -3 Q 10 5 10 15 L 20 15 Q 20 5 15 -3 Z" fill="#8b5cf6" />
                    </g>
                  )}
                </g>
              ) : (
                // Riders on the bike, leaning into the ride
                <g transform="translate(10, 20)">
                  {/* Rider A (Driver) */}
                  <g transform="translate(34, 0)">
                    {/* Helmet */}
                    <path d="M-6 -10 A 6 6 0 1 1 6 -10 L 6 -6 A 6 6 0 0 1 -6 -6 Z" fill="#e2e8f0" />
                    <rect x="0" y="-12" width="6" height="5" rx="1" fill="#1e293b" /> {/* Visor */}
                    {/* Leaning Body */}
                    <path d="M -2 -5 C 5 -5, 15 -5, 18 -10 L 12 0 C 8 5, -2 10, -5 5 Z" fill="#3b82f6" />
                    {/* Arm holding handlebars */}
                    <path d="M 5 -2 L 18 -5" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                  </g>
                  
                  {/* Rider B (Passenger) */}
                  {riderB && (
                    <g transform="translate(20, -2)">
                      {/* Helmet */}
                      <path d="M-5 -9 A 5 5 0 1 1 5 -9 L 5 -5 A 5 5 0 0 1 -5 -5 Z" fill="#f87171" />
                      <rect x="1" y="-11" width="4" height="4" rx="1" fill="#1e293b" />
                      {/* Body leaning into driver */}
                      <path d="M -1 -4 C 4 -4, 12 0, 10 8 C 5 10, -3 8, -4 2 Z" fill="#8b5cf6" />
                      {/* Arm holding driver */}
                      <path d="M 3 -1 L 12 2" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              )}

            </svg>
          </div>
        </div>
      </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-2 right-3 text-[10px] font-medium rounded-full bg-black/40 text-white px-2.5 py-1 shadow-sm backdrop-blur-sm">
        {arrived ? "Summit reached 🏔️" : `Stage ${Math.min(step, TRIP_LEVELS)} / ${TRIP_LEVELS}`}
      </div>
    </div>
  );
}