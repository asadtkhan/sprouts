// Treehouse builds up plank by plank across 31 stages.
// 0-1 = resources, 2-6 = platform, 7-14 = walls growing, 15-20 = roof,
// 21-24 = window + door, 25-28 = ladder, 29-31 = flag and lanterns.
import { useState } from "react";
import { GameDefs, Sparkles, FX_KEYFRAMES, Burst, useBurstOnIncrease } from "./fx";

interface Props {
  stage: number;
  health: number;
}

export function TreehouseGame({ stage, health }: Props) {
  const MAX = 31;
  const s = Math.min(MAX, Math.max(0, stage));
  const progress = s / MAX;

  const damaged = health < 50;
  const critical = health < 25;
  
  const platform = s >= 2;
  const walls = s >= 7;
  const wallH = walls ? Math.min(38, 8 + (s - 7) * 4) : 0;
  const roof = s >= 15;
  const windowOn = s >= 21;
  const door = s >= 23;
  const ladder = s >= 25;
  const flag = s >= 29;
  const lantern = s >= 31;
  const showResources = s < 3;

  // Environmental states based on progress
  const isNight = progress >= 0.85 && !damaged;
  
  // Sun or Moon arcs across the sky as the user levels up
  const celestialX = 40 + progress * 240;
  const celestialY = 120 - Math.sin(progress * Math.PI) * 70;

  const levelUp = useBurstOnIncrease(s);
  const [poke, setPoke] = useState(0);
  const react = () => setPoke((p) => p + 1);

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none overflow-hidden rounded-3xl"
      role="button"
      tabIndex={0}
      aria-label={`Treehouse companion, stage ${s} of ${MAX}. Tap to interact.`}
      onClick={react}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          react();
        }
      }}
    >
      <style>{`
        @keyframes leafSway3 { 0%,100%{ transform: rotate(-1.2deg) } 50%{ transform: rotate(1.5deg) } }
        @keyframes stormSway { 0%,100%{ transform: rotate(-3deg) } 50%{ transform: rotate(4deg) } }
        @keyframes leafToss { 0%,100%{ transform: rotate(-4deg) } 50%{ transform: rotate(5deg) } }
        @keyframes flagWave { 0%,100%{ transform: skewX(0) } 50%{ transform: skewX(-15deg) } }
        @keyframes rainDrop { 0%{ transform: translateY(-6px) translateX(0); opacity: 0 } 30%{ opacity: 0.9 } 100%{ transform: translateY(100px) translateX(-20px); opacity: 0 } }
        @keyframes cloudDrift { 0%,100%{ transform: translateX(0) } 50%{ transform: translateX(6px) } }
        @keyframes lanternGlow { 0%,100%{ opacity: 0.7; transform: scale(1) } 50%{ opacity: 1; transform: scale(1.1) } }
        @keyframes lanternSwing { 0%,100%{ transform: rotate(-5deg) } 50%{ transform: rotate(5deg) } }
        @keyframes lightning { 0%, 9%, 11%, 100%{ opacity: 0 } 10%{ opacity: 0.8 } }
        @keyframes bucketPull { 0%, 100%{ transform: translateY(0) } 50%{ transform: translateY(-56px) } }
        @keyframes residentPeek { 0%, 100%{ transform: translateY(14px) } 20%, 80%{ transform: translateY(0) } }
        @keyframes starTwinkle { 0%,100%{ opacity:0.2 } 50%{ opacity:1 } }
        @keyframes celestialPulse { 0%,100%{ transform: scale(1) } 50%{ transform: scale(1.05) } }
        ${FX_KEYFRAMES}
      `}</style>

      <svg viewBox="0 0 320 320" className="w-full h-full">
        <GameDefs id="th" />
        <defs>
          <clipPath id="window-clip">
            <rect x="124" y="152" width="18" height="18" />
          </clipPath>
          {/* Dynamic Sky Gradient based on progress & health */}
          <linearGradient id="th-sky" x1="0" x2="0" y1="0" y2="1">
            {damaged ? (
              <>
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#9ca3af" />
              </>
            ) : progress < 0.4 ? (
              <>
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#bae6fd" />
              </>
            ) : progress < 0.7 ? (
              <>
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#fde047" />
              </>
            ) : progress < 0.85 ? (
              <>
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#f43f5e" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#312e81" />
              </>
            )}
          </linearGradient>
          <linearGradient id="th-ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={damaged || isNight ? "#4b5563" : "#65a30d"} />
            <stop offset="100%" stopColor={damaged || isNight ? "#1f2937" : "#166534"} />
          </linearGradient>
          <linearGradient id="th-wood" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={isNight || damaged ? "#a16207" : "#d99c60"} />
            <stop offset="100%" stopColor={isNight || damaged ? "#422006" : "#8b5a30"} />
          </linearGradient>
        </defs>

        {/* --- DYNAMIC BACKGROUND --- */}
        <rect width="320" height="320" fill="url(#th-sky)" />
        
        {/* Stars (Visible at night) */}
        {!damaged && progress >= 0.8 && Array.from({ length: 25 }).map((_, i) => (
          <circle
            key={`star-${i}`}
            cx={((i * 41) % 300) + 10}
            cy={((i * 29) % 200) + 10}
            r={i % 3 === 0 ? 1.5 : 0.8}
            fill="#fff"
            style={{ animation: `starTwinkle 3s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}

        {/* The Sun or Moon */}
        {!damaged && (
          <g style={{ animation: "celestialPulse 4s ease-in-out infinite" }} transform={`translate(${celestialX} ${celestialY})`}>
            <circle cx="0" cy="0" r="26" fill={isNight ? "#f8fafc" : "#ffe6a8"} opacity="0.45" filter="url(#th-glow)" />
            <circle cx="0" cy="0" r="18" fill={isNight ? "#e2e8f0" : "#ffd98a"} />
            {isNight && (
              <g fill="#cbd5e1" opacity="0.5">
                <circle cx="-6" cy="-4" r="3" />
                <circle cx="4" cy="2" r="4" />
                <circle cx="-2" cy="8" r="2" />
              </g>
            )}
          </g>
        )}

        {!damaged && !isNight && <Sparkles count={9} tint="#fff2c4" />}

        {/* Rain clouds when damaged */}
        {damaged && (
          <g>
            <ellipse cx="90" cy="30" rx="60" ry="20" fill={critical ? "#334155" : "#64748b"} />
            <ellipse cx="230" cy="20" rx="80" ry="25" fill={critical ? "#334155" : "#64748b"} />
            <ellipse cx="160" cy="40" rx="70" ry="20" fill={critical ? "#475569" : "#94a3b8"} />
            {Array.from({ length: critical ? 24 : 12 }).map((_, i) => (
              <line
                key={i}
                x1={40 + i * 12}
                y1={50 + (i % 3) * 10}
                x2={30 + i * 12}
                y2={critical ? 120 + (i % 3) * 10 : 90 + (i % 3) * 10}
                stroke={critical ? "#94a3b8" : "#bae6fd"}
                strokeWidth={critical ? 1.5 : 1}
                strokeLinecap="round"
                style={{
                  animation: `rainDrop ${critical ? 0.5 : 0.8}s linear ${i * 0.1}s infinite`,
                }}
              />
            ))}
            {/* Lightning flashes */}
            {critical && (
              <rect width="320" height="320" fill="#fff" style={{ animation: "lightning 3s infinite", pointerEvents: "none" }} opacity="0" />
            )}
          </g>
        )}

        {/* --- ENVIRONMENT --- */}
        <ellipse cx="160" cy="270" rx="200" ry="40" fill="url(#th-ground)" />
        <ellipse cx="160" cy="265" rx="140" ry="15" fill={damaged ? "#334155" : "#86efac"} opacity="0.3" />

        {/* Fireflies when fully built and healthy at night */}
        {isNight && lantern && Array.from({ length: 8 }).map((_, i) => (
          <circle 
            key={`ff-${i}`} 
            cx={100 + Math.random() * 120} 
            cy={220 + Math.random() * 50} 
            r="1.5" 
            fill="#fef08a" 
            filter="url(#th-glow)"
            style={{ animation: `starTwinkle ${1.5 + Math.random()}s ease-in-out ${Math.random()}s infinite alternate` }} 
          />
        ))}

        {/* --- MAIN STRUCTURE --- */}
        {/* The whole structure gives a happy little bounce on tap. */}
        <g
          key={`poke-${poke}`}
          style={poke && !damaged ? { animation: "pokeBounce 0.5s ease-out", transformOrigin: "160px 250px" } : undefined}
        >
          {/* Base Tree */}
          <g style={{
              animation: `${critical ? "stormSway" : "none"} 3s ease-in-out infinite`,
              transformOrigin: "160px 250px",
            }}
          >
            {/* trunk */}
            <path d="M150 250 L150 130 Q152 120 158 118 Q168 120 170 130 L170 250 Z" fill={damaged ? "#4a2d13" : "#7a4a20"} />
            <path d="M154 245 L154 140" stroke="#3a1e0a" strokeWidth="2" opacity="0.5" />
            
            {/* branches */}
            <path d="M160 170 Q120 160 96 150" stroke={damaged ? "#4a2d13" : "#7a4a20"} strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M160 160 Q210 150 236 138" stroke={damaged ? "#4a2d13" : "#7a4a20"} strokeWidth="7" fill="none" strokeLinecap="round" />
            
            {/* Interactive Pulley & Bucket (Hangs behind platform) */}
            {platform && (
              <g>
                <circle cx="102" cy="184" r="2.5" fill="#475569" />
                <g style={{ animation: poke && !damaged ? "bucketPull 1.5s ease-in-out" : "none" }}>
                  <line x1="102" y1="186" x2="102" y2="246" stroke="#94a3b8" strokeWidth="1" />
                  <path d="M98 246 L106 246 L105 254 L99 254 Z" fill="#64748b" />
                  <path d="M98 246 Q102 242 106 246" fill="none" stroke="#475569" strokeWidth="1.5" />
                </g>
              </g>
            )}

            {/* canopy */}
            <g
              style={{
                animation: `${critical ? "leafToss" : "leafSway3"} ${critical ? "1.4s" : "3.6s"} ease-in-out infinite`,
                transformOrigin: "160px 100px",
              }}
            >
              <circle cx="160" cy="100" r="60" fill={damaged ? "#4d7c5b" : "#4ea36b"} />
              <circle cx="112" cy="120" r="34" fill={damaged ? "#60966d" : "#7bc48a"} />
              <circle cx="210" cy="120" r="34" fill={damaged ? "#60966d" : "#7bc48a"} />
              <circle cx="160" cy="66" r="30" fill={damaged ? "#60966d" : "#7bc48a"} />
            </g>

            {/* Platform */}
            {platform && (
              <g>
                <rect x="96" y="176" width="132" height="10" fill="url(#th-wood)" />
                <rect x="96" y="176" width="132" height="10" fill="none" stroke="#5c3818" strokeWidth="1" />
                {/* railing/supports */}
                <line x1="104" y1="186" x2="100" y2="200" stroke={damaged ? "#4a2d13" : "#7a4a20"} strokeWidth="3" />
                <line x1="220" y1="186" x2="224" y2="200" stroke={damaged ? "#4a2d13" : "#7a4a20"} strokeWidth="3" />
              </g>
            )}

            {/* Walls */}
            {walls && (
              <g>
                <rect x="108" y={176 - wallH} width="112" height={wallH} fill={isNight ? "#b47a46" : "#d29a63"} />
                {/* plank lines */}
                {Array.from({ length: Math.floor(wallH / 6) }).map((_, i) => (
                  <line
                    key={i}
                    x1="108"
                    y1={176 - i * 6}
                    x2="220"
                    y2={176 - i * 6}
                    stroke="#8b5a30"
                    strokeWidth="0.8"
                    opacity="0.5"
                  />
                ))}
                {/* damaged plank */}
                {damaged && (
                  <g>
                    <path d="M118 170 L128 176 L138 168 L146 176" stroke="#5c3818" strokeWidth="2" fill="none" />
                    <line x1="118" y1="170" x2="146" y2="176" stroke="#8b5a30" strokeWidth="6" opacity="0.4" />
                  </g>
                )}
              </g>
            )}

            {/* Roof */}
            {roof && (
              <g>
                <path d="M100 138 L164 108 L228 138 L108 138 Z" fill={isNight ? "#823223" : "#a44a3a"} />
                <path d="M100 138 L164 108 L228 138" stroke="#5a2418" strokeWidth="1.5" fill="none" />
                <rect x="108" y="138" width="112" height="6" fill={isNight ? "#5c2016" : "#7a2d20"} />
              </g>
            )}

            {/* Window & Interactive Resident */}
            {windowOn && (
              <g>
                <rect x="124" y="152" width="18" height="18" fill={isNight && !damaged ? "#fef08a" : "#1e293b"} />
                
                {/* Animal popping up to say hello on tap */}
                <g clipPath="url(#window-clip)">
                  <g transform="translate(0, 14)" style={{ animation: poke && !damaged ? "residentPeek 1.5s ease-in-out" : "none" }}>
                    <circle cx="133" cy="166" r="6" fill="#8b5a30" />
                    <circle cx="129" cy="162" r="2.5" fill="#8b5a30" />
                    <circle cx="137" cy="162" r="2.5" fill="#8b5a30" />
                    <circle cx="133" cy="168" r="3" fill="#d99c60" />
                    <circle cx="133" cy="167" r="1" fill="#3a1e0a" />
                    <circle cx="130.5" cy="165" r="1.5" fill="#1e293b" />
                    <circle cx="135.5" cy="165" r="1.5" fill="#1e293b" />
                    <circle cx="130.5" cy="164.5" r="0.5" fill="#fff" />
                    <circle cx="135.5" cy="164.5" r="0.5" fill="#fff" />
                  </g>
                </g>

                <rect x="124" y="152" width="18" height="18" fill="none" stroke="#5c3818" strokeWidth="1.5" />
                <line x1="133" y1="152" x2="133" y2="170" stroke="#5c3818" strokeWidth="1" />
                <line x1="124" y1="161" x2="142" y2="161" stroke="#5c3818" strokeWidth="1" />
              </g>
            )}

            {/* Door */}
            {door && (
              <g>
                <rect x="182" y="150" width="20" height="26" fill={isNight ? "#4a2610" : "#6a3a1a"} />
                <rect x="182" y="150" width="20" height="26" fill="none" stroke="#3a1e0a" strokeWidth="1" />
                <circle cx="198" cy="164" r="1.4" fill="#f7d97a" />
              </g>
            )}

            {/* Ladder */}
            {ladder && (
              <g stroke={damaged ? "#4a2d13" : "#7a4a20"} strokeWidth="2.5" strokeLinecap="round">
                <line x1="196" y1="250" x2="196" y2="186" />
                <line x1="210" y1="250" x2="210" y2="186" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <line key={i} x1="196" y1={244 - i * 11} x2="210" y2={244 - i * 11} />
                ))}
              </g>
            )}

            {/* Flag */}
            {flag && (
              <g>
                <line x1="164" y1="108" x2="164" y2="86" stroke="#3a2416" strokeWidth="2" />
                <g style={{ animation: "flagWave 1.6s ease-in-out infinite", transformOrigin: "164px 90px" }}>
                  <path d="M164 88 L184 92 L164 98 Z" fill={damaged ? "#a03535" : "#e04b4b"} />
                </g>
              </g>
            )}

            {/* Lanterns */}
            {lantern && (
              <g style={{ animation: "lanternSwing 3s ease-in-out infinite", transformOrigin: "220px 140px" }}>
                <line x1="220" y1="140" x2="220" y2="152" stroke="#3a2416" strokeWidth="1.5" />
                <g style={{ animation: !damaged ? "lanternGlow 2.2s ease-in-out infinite" : "none" }}>
                  <rect x="214" y="152" width="12" height="14" rx="2" fill={damaged ? "#64748b" : "#f7d97a"} />
                  {!damaged && <circle cx="220" cy="159" r="4" fill="#fff5c2" filter="url(#th-glow)" />}
                </g>
              </g>
            )}
          </g>
        </g>

        {/* --- RESOURCES ON GROUND (Early Stages) --- */}
        {showResources && (
          <g>
            <rect x="40" y="238" width="46" height="6" fill="url(#th-wood)" transform="rotate(-8 40 238)" />
            <rect x="46" y="230" width="42" height="6" fill="url(#th-wood)" transform="rotate(4 46 230)" />
            <rect x="42" y="222" width="38" height="6" fill="url(#th-wood)" transform="rotate(-3 42 222)" />
            {/* saw */}
            <path d="M96 240 L120 240 L118 234 L98 234 Z" fill="#c9c9d4" />
            <rect x="118" y="234" width="10" height="8" rx="2" fill="#7a4a20" />
            {/* nails */}
            <circle cx="132" cy="242" r="1.5" fill="#6b6b78" />
            <circle cx="138" cy="242" r="1.5" fill="#6b6b78" />
            <circle cx="144" cy="242" r="1.5" fill="#6b6b78" />
          </g>
        )}

        {/* --- UI WARNINGS --- */}
        {damaged && (
          <g style={critical ? { animation: "warnBlink 0.8s ease-in-out infinite" } : undefined}>
            <rect x="70" y="12" width="180" height="22" rx="11" fill="#000" opacity="0.6" />
            <text x="160" y="27" textAnchor="middle" fontSize="11" fill="#ffb3a0" fontWeight="bold">
              {critical ? "Heavy storm warning" : "Taking storm damage"}
            </text>
          </g>
        )}

        {/* Burst FX on Level Up */}
        {levelUp > 0 && !damaged && (
          <Burst
            key={levelUp}
            trigger={levelUp}
            cx={164}
            cy={150}
            colors={["#d99c60", "#ffd76a", "#7bc48a", "#fff5c2"]}
          />
        )}
        {poke > 0 && !damaged && <Burst key={`poke-burst-${poke}`} trigger={poke} cx={198} cy={163} />}
      </svg>
    </div>
  );
}