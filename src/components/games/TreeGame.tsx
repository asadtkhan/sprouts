// Tree game — 31 stages of growth.
import { useState } from "react";
import { GameDefs, Sparkles, FX_KEYFRAMES, Burst, useBurstOnIncrease } from "./fx";

interface Props {
  stage: number;
  health: number;
}

export function TreeGame({ stage, health }: Props) {
  const MAX = 31;
  const s = Math.min(MAX, Math.max(0, stage));
  
  // Calculate continuous progress from 0.0 to 1.0 based on stage
  const progress = s / MAX; 
  
  // Health states
  const isDead = health <= 0;
  const critical = health > 0 && health <= 25;
  const wilt = health > 25 && health <= 50;

  const leaf = isDead ? "transparent" : (wilt || critical ? "#c9a86a" : "#4ea36b");
  const leafLight = isDead ? "transparent" : (wilt || critical ? "#e2c98a" : "#7bc48a");
  const trunk = isDead ? "#5a4a3a" : (wilt || critical ? "#8a6a4a" : "#8b5a3c");
  const bloom = s >= 24 ? "#ff9ec2" : null;
  const fullyGrown = s === MAX && !isDead;
  
  // Rescale the visual 0-8 tiers across 31 stages so growth is gradual.
  const capped = Math.min(8, Math.floor((s / MAX) * 8 + 0.0001));

  // Sun arcs across the sky based on stage progress
  const sunX = 40 + progress * 240;
  const sunY = 140 - Math.sin(progress * Math.PI) * 90;

  const levelUp = useBurstOnIncrease(capped);
  const [poke, setPoke] = useState(0);
  const react = () => setPoke((p) => p + 1);

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none overflow-hidden rounded-3xl"
      role="button"
      tabIndex={0}
      aria-label={`Tree companion, stage ${s} of ${MAX}. Tap to water it.`}
      onClick={react}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          react();
        }
      }}
    >
      <style>{`
        @keyframes treeSway { 0%,100%{ transform: rotate(-1.2deg) } 50%{ transform: rotate(1.4deg) } }
        @keyframes treeDroop { 0%,100%{ transform: rotate(3deg) } 50%{ transform: rotate(5deg) } }
        @keyframes treeHappy { 0%,100%{ transform: scale(1) translateY(0) } 50%{ transform: scale(1.02) translateY(-4px) } }
        @keyframes leafFall { 0%{ transform: translate(0,0) rotate(0); opacity:1 } 100%{ transform: translate(-40px,90px) rotate(120deg); opacity:0 } }
        @keyframes wiltFall { 0%{ transform: translate(0,0) rotate(0); opacity:1 } 100%{ transform: translate(20px,120px) rotate(200deg); opacity:0 } }
        @keyframes cloudDrift { 0%{ transform: translateX(0) } 100%{ transform: translateX(20px) } }
        @keyframes sunPulse { 0%,100%{ transform: scale(1) } 50%{ transform: scale(1.06) } }
        @keyframes birdHop { 0%,100%{ transform: translateY(0) rotate(0) } 50%{ transform: translateY(-4px) rotate(-5deg) } }
        @keyframes firefly { 0%,100%{ opacity: 0.2; transform: translateY(0) } 50%{ opacity: 1; transform: translateY(-10px) } }
        
        /* Interactive Watering Can Animation */
        @keyframes waterTip { 
          0%, 100% { transform: translate(0, 0) rotate(0); } 
          20%, 80% { transform: translate(45px, -60px) rotate(40deg); } 
        }
        @keyframes waterDrop {
          0%, 20% { opacity: 0; transform: translateY(0); }
          40% { opacity: 1; }
          80% { transform: translateY(30px); opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
        ${FX_KEYFRAMES}
      `}</style>

      <svg viewBox="0 0 320 320" className="w-full h-full">
        <GameDefs id="tree" />
        <defs>
          {/* Dynamic Sky Gradient based on progress and health */}
          <radialGradient id="sky" cx="50%" cy="28%" r="78%">
            {isDead || critical ? (
              <>
                <stop offset="0%" stopColor="#d1d5db" />
                <stop offset="100%" stopColor="#9ca3af" />
              </>
            ) : progress < 0.4 ? (
              <>
                <stop offset="0%" stopColor="#fffaf0" />
                <stop offset="100%" stopColor="#e0f2fe" />
              </>
            ) : progress < 0.8 ? (
              <>
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#bae6fd" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#fed7aa" />
              </>
            )}
          </radialGradient>
          <linearGradient id="ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={isDead ? "#a8a29e" : "#d7b98d"} />
            <stop offset="100%" stopColor={isDead ? "#4b5563" : "#8a6a4a"} />
          </linearGradient>
        </defs>

        <rect width="320" height="320" rx="24" fill="url(#sky)" />
        
        {/* Dynamic Sun */}
        {!isDead && !critical && (
          <g style={{ animation: "sunPulse 4s ease-in-out infinite" }} transform={`translate(${sunX} ${sunY})`}>
            <circle cx="0" cy="0" r="34" fill={progress >= 0.8 ? "#ffcda8" : "#ffe6a8"} opacity="0.45" filter="url(#tree-glow)" />
            <circle cx="0" cy="0" r="24" fill={progress >= 0.8 ? "#ffb58a" : "#ffd98a"} />
          </g>
        )}

        <Sparkles count={12} tint={progress >= 0.8 ? "#ffdfa8" : "#ffe9a8"} />
        
        {/* Drifting Clouds */}
        <g style={{ animation: "cloudDrift 8s ease-in-out infinite alternate" }}>
          <ellipse cx="80" cy="55" rx="22" ry="7" fill={isDead ? "#d1d5db" : "#fff"} opacity="0.85" />
          <ellipse cx="100" cy="50" rx="14" ry="5" fill={isDead ? "#d1d5db" : "#fff"} opacity="0.85" />
          <ellipse cx="64" cy="52" rx="12" ry="5" fill={isDead ? "#d1d5db" : "#fff"} opacity="0.7" />
        </g>
        <g style={{ animation: "cloudDrift 10s ease-in-out infinite alternate-reverse" }}>
          <ellipse cx="240" cy="85" rx="18" ry="6" fill={isDead ? "#9ca3af" : "#fff"} opacity="0.6" />
          <ellipse cx="260" cy="82" rx="12" ry="4" fill={isDead ? "#9ca3af" : "#fff"} opacity="0.6" />
        </g>

        {/* Garden Background (Picket Fence) */}
        <g stroke={isDead ? "#9ca3af" : "#d4a373"} strokeWidth="4" strokeLinecap="round" opacity="0.5">
          <line x1="10" y1="235" x2="310" y2="235" />
          <line x1="10" y1="250" x2="310" y2="250" />
          {Array.from({length: 11}).map((_, i) => (
             <path key={i} d={`M ${20 + i * 28} 260 L ${20 + i * 28} 225 L ${20 + i * 28} 225`} />
          ))}
        </g>

        {/* Ground */}
        <ellipse cx="160" cy="272" rx="160" ry="32" fill="url(#ground)" />
        <ellipse cx="160" cy="264" rx="130" ry="14" fill={isDead ? "#6b7280" : "#c49a68"} opacity="0.6" />
        
        {/* Patches of grass that grow with progress */}
        {!isDead && !wilt && Array.from({length: capped + 2}).map((_, i) => {
          const gx = 100 + (i * 25) % 120;
          const gy = 265 + (i * 7) % 15;
          return (
            <path key={i} d={`M ${gx} ${gy} Q ${gx-5} ${gy-10} ${gx-10} ${gy} Q ${gx} ${gy-12} ${gx+5} ${gy} Q ${gx+10} ${gy-8} ${gx+15} ${gy}`} fill="none" stroke="#7bc48a" strokeWidth="2" strokeLinecap="round" />
          );
        })}

        {/* Fireflies when fully grown */}
        {fullyGrown && Array.from({length: 6}).map((_, i) => (
          <circle 
            key={`firefly-${i}`} 
            cx={100 + Math.random() * 120} 
            cy={120 + Math.random() * 60} 
            r="2.5" 
            fill="#fef08a" 
            filter="url(#tree-glow)"
            style={{ animation: `firefly ${2 + Math.random()}s ease-in-out ${Math.random()}s infinite alternate` }} 
          />
        ))}

        {/* Healthy falling leaves */}
        {capped >= 4 && !wilt && !isDead && (
          <g style={{ animation: "leafFall 5s ease-in infinite", transformOrigin: "180px 140px" }}>
            <ellipse cx="180" cy="140" rx="4" ry="2.5" fill={leafLight} />
          </g>
        )}

        {/* Wilted leaves falling when unhealthy */}
        {wilt && capped >= 2 && !isDead && (
          <g>
            {[0, 0.6, 1.2].map((delay, i) => (
              <ellipse
                key={i}
                cx={150 + i * 15}
                cy={140 + i * 6}
                rx="3.5"
                ry="2"
                fill="#a97a3a"
                style={{ animation: `wiltFall 3.5s ease-in ${delay}s infinite` }}
              />
            ))}
          </g>
        )}

        {/* --- THE TREE --- */}
        <g
          key={`poke-${poke}`}
          style={poke && !isDead ? { animation: "treeHappy 0.6s ease-out", transformOrigin: "160px 260px" } : undefined}
        >
          <g
            filter="url(#tree-soft)"
            style={{
              animation: isDead ? "none" : `${critical ? "treeDroop" : "treeSway"} 4.5s ease-in-out infinite`,
              transformOrigin: "160px 260px",
            }}
          >
            {/* System Failure: Dead Stump */}
            {isDead ? (
              <g>
                <path d="M145 260 L150 240 L170 240 L175 260 Z" fill={trunk} />
                <ellipse cx="160" cy="240" rx="10" ry="4" fill="#3a2a1a" opacity="0.6" />
                <path d="M140 260 Q150 255 160 260 Q170 255 180 260" stroke="#3a2a1a" strokeWidth="2" fill="none" opacity="0.4" />
              </g>
            ) : (
              <>
                {/* Normal Growth Stages */}
                {capped === 0 && (
                  <g>
                    {/* Dirt mound & sprout */}
                    <path d="M145 262 Q160 252 175 262 Z" fill="#8a6a4a" />
                    <ellipse cx="160" cy="258" rx="8" ry="4" fill="#7a4b2a" />
                    <path d="M158 254 Q160 250 162 254" stroke="#4ea36b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <circle cx="163" cy="252" r="2" fill="#7bc48a" />
                  </g>
                )}
                {capped === 1 && (
                  <g>
                    <path d="M160 260 L160 235" stroke={trunk} strokeWidth="3" strokeLinecap="round" />
                    <ellipse cx="152" cy="236" rx="8" ry="4" fill={leaf} transform="rotate(-25 152 236)" />
                    <ellipse cx="168" cy="236" rx="8" ry="4" fill={leaf} transform="rotate(25 168 236)" />
                  </g>
                )}
                {(capped === 2 || capped === 3) && (
                  <g>
                    <path d={`M160 260 L160 ${215 - capped * 8}`} stroke={trunk} strokeWidth="4" strokeLinecap="round" />
                    <circle cx="160" cy={210 - capped * 8} r={18 + capped * 2} fill={leaf} />
                    <circle cx={148} cy={215 - capped * 8} r={12} fill={leafLight} />
                    <circle cx={172} cy={215 - capped * 8} r={12} fill={leafLight} />
                  </g>
                )}
                {(capped === 4 || capped === 5) && (
                  <g>
                    <path d="M160 260 L160 180" stroke={trunk} strokeWidth={6 + capped} strokeLinecap="round" />
                    <circle cx="160" cy="170" r={38 + capped * 2} fill={leaf} />
                    <circle cx="135" cy="180" r={22} fill={leafLight} />
                    <circle cx="185" cy="180" r={22} fill={leafLight} />
                    <circle cx="160" cy="140" r={18} fill={leafLight} />
                  </g>
                )}
                {(capped === 6 || capped === 7) && (
                  <g>
                    <path d="M160 260 L160 155" stroke={trunk} strokeWidth={10} strokeLinecap="round" />
                    <path d="M160 210 Q140 200 130 185" stroke={trunk} strokeWidth={5} fill="none" strokeLinecap="round" />
                    <path d="M160 200 Q180 190 195 180" stroke={trunk} strokeWidth={5} fill="none" strokeLinecap="round" />
                    <circle cx="160" cy="140" r={50} fill={leaf} />
                    <circle cx="120" cy="160" r={28} fill={leafLight} />
                    <circle cx="200" cy="160" r={28} fill={leafLight} />
                    <circle cx="160" cy="105" r={26} fill={leafLight} />
                    
                    {/* A small bird perched on the branch */}
                    <g transform="translate(130, 175)" style={{ animation: "birdHop 3s ease-in-out infinite" }}>
                      <ellipse cx="0" cy="0" rx="6" ry="5" fill="#60a5fa" />
                      <circle cx="-5" cy="-3" r="4" fill="#60a5fa" />
                      <path d="M -8 -3 L -12 -2 L -8 -1 Z" fill="#fbbf24" />
                      <path d="M 4 -2 L 10 -4 L 8 2 Z" fill="#3b82f6" />
                    </g>
                  </g>
                )}
                {capped >= 8 && (
                  <g>
                    <path d="M160 260 L160 150" stroke={trunk} strokeWidth={12} strokeLinecap="round" />
                    <path d="M160 210 Q135 200 125 180" stroke={trunk} strokeWidth={6} fill="none" strokeLinecap="round" />
                    <path d="M160 200 Q185 190 200 175" stroke={trunk} strokeWidth={6} fill="none" strokeLinecap="round" />
                    <circle cx="160" cy="135" r={58} fill={leaf} />
                    <circle cx="115" cy="155" r={32} fill={leafLight} />
                    <circle cx="205" cy="155" r={32} fill={leafLight} />
                    <circle cx="160" cy="95" r={30} fill={leafLight} />
                    
                    {/* Flowers/Fruits */}
                    {[
                      [130, 130], [180, 120], [200, 160],
                      [140, 170], [170, 155], [110, 145],
                    ].map(([x, y], i) => (
                      <g key={i}>
                        <circle cx={x} cy={y} r="5" fill={bloom ?? "#ff9ec2"} />
                        <circle cx={x} cy={y} r="2" fill="#fff5c2" />
                      </g>
                    ))}

                    {/* Bird Nest & Happy Bird */}
                    <g transform="translate(160, 172)">
                      <path d="M -12 0 Q 0 10 12 0 Z" fill="#78350f" />
                      <g style={{ animation: "birdHop 2s ease-in-out infinite alternate" }}>
                        <ellipse cx="0" cy="-6" rx="6" ry="5" fill="#60a5fa" />
                        <circle cx="-5" cy="-9" r="4" fill="#60a5fa" />
                        <path d="M -8 -9 L -12 -8 L -8 -7 Z" fill="#fbbf24" />
                      </g>
                    </g>
                  </g>
                )}
              </>
            )}
          </g>
        </g>

        {/* --- WATERING CAN INTERACTION --- */}
        <g transform="translate(70, 255)">
          <g style={{ 
            animation: poke && !isDead ? "waterTip 1s ease-in-out" : "none",
            transformOrigin: "0px -10px" 
          }}>
            {/* Can Body */}
            <rect x="-12" y="-20" width="24" height="20" rx="3" fill="#94a3b8" />
            {/* Spout */}
            <path d="M 12 -5 Q 25 -15 32 -10 L 28 -6 Q 20 -10 12 0 Z" fill="#cbd5e1" />
            {/* Handle */}
            <path d="M -12 -15 Q -25 -20 -25 -5 Q -25 5 -12 0" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            {/* Shadow line */}
            <line x1="-12" y1="-5" x2="12" y2="-5" stroke="#64748b" strokeWidth="2" opacity="0.3" />
            
            {/* Water Droplets (Only visible during pour) */}
            {poke > 0 && !isDead && (
              <g style={{ animation: "waterDrop 1s ease-in" }}>
                <circle cx="34" cy="-5" r="2" fill="#60a5fa" />
                <circle cx="30" cy="-2" r="1.5" fill="#60a5fa" />
                <circle cx="38" cy="-8" r="2.5" fill="#93c5fd" />
              </g>
            )}
          </g>
        </g>

        {/* --- UI WARNINGS --- */}
        {(wilt || isDead) && (
          <g style={(critical || isDead) ? { animation: "warnBlink 0.8s ease-in-out infinite" } : undefined}>
            <rect x="12" y="12" width="140" height="22" rx="11" fill="#000" opacity="0.6" />
            <text x="82" y="27" textAnchor="middle" fontSize="11" fill="#ffd9a0" fontWeight="bold">
              {isDead ? "☠️ TREE HAS DIED" : critical ? "🥀 WILTING BADLY" : "💧 NEEDS WATER"}
            </text>
          </g>
        )}

        {/* Burst FX on Level Up & Tap */}
        {levelUp > 0 && !isDead && <Burst key={levelUp} trigger={levelUp} cx={160} cy={180} />}
        {poke > 0 && !isDead && (
          <Burst
            key={`poke-burst-${poke}`}
            trigger={poke}
            cx={160}
            cy={200}
            colors={["#7bc48a", "#4ea36b", "#ffd76a", "#ff9ec2"]}
          />
        )}
      </svg>
    </div>
  );
}