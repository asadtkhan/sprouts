// Cat game — the kitten grows in size and character over 31 stages.
import { useState } from "react";
import { GameDefs, Sparkles, FX_KEYFRAMES, Burst, useBurstOnIncrease } from "./fx";

interface Props {
  stage: number;
  health: number;
}

export function CatGame({ stage, health }: Props) {
  const MAX = 31;
  const s = Math.min(MAX, Math.max(0, stage));
  const progress = s / MAX;

  // The original growth math: base size 68, grows by 3px every 2 stages up to 15px extra.
  // We use this to calculate a scale multiplier for the SVG group.
  const size = 68 + Math.min(5, Math.floor(s / 2)) * 3;
  const growthScale = size / 68;

  const isHiding = health <= 0;
  const critical = health > 0 && health <= 25;
  const lonely = health > 25 && health <= 50;

  // Environment transitions to night as you progress through stages
  const isNight = progress >= 0.8;

  const levelUp = useBurstOnIncrease(s);
  const [poke, setPoke] = useState(0);
  const react = () => setPoke((p) => p + 1);

  // When poked, the cat wakes up briefly
  const awake = poke > 0;

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none overflow-hidden rounded-3xl"
      role="button"
      tabIndex={0}
      aria-label={`Feline companion, stage ${s} of ${MAX}. Tap to pet.`}
      onClick={react}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          react();
        }
      }}
    >
      <style>{`
        @keyframes catBreathe { 0%,100%{ transform: scaleY(1) translateY(0) } 50%{ transform: scaleY(1.04) translateY(-1px) } }
        @keyframes tailSwish { 0%,100%{ transform: rotate(0deg) } 50%{ transform: rotate(18deg) } }
        @keyframes earTwitch { 0%, 92%, 100%{ transform: rotate(0deg) } 95%{ transform: rotate(-12deg) } 98%{ transform: rotate(5deg) } }
        @keyframes purrVibrate { 0%,100%{ transform: translate(0,0) } 25%{ transform: translate(-0.5px, 0.5px) } 75%{ transform: translate(0.5px, -0.5px) } }
        @keyframes boxPeek { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-8px) } }
        @keyframes starTwinkle { 0%,100%{ opacity: 0.3 } 50%{ opacity: 1 } }
        @keyframes zzzFloat { 
          0% { opacity: 0; transform: translate(0, 0) scale(0.5); } 
          20% { opacity: 1; transform: translate(10px, -15px) scale(0.8); }
          80% { opacity: 1; transform: translate(-5px, -40px) scale(1.1); }
          100% { opacity: 0; transform: translate(5px, -50px) scale(1.2); }
        }
        ${FX_KEYFRAMES}
      `}</style>

      <svg viewBox="0 0 320 320" className="w-full h-full">
        <GameDefs id="cat" />
        <defs>
          <linearGradient id="wallGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={isNight ? "#1e293b" : "#f1f5f9"} />
            <stop offset="100%" stopColor={isNight ? "#0f172a" : "#cbd5e1"} />
          </linearGradient>
          <linearGradient id="floorGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={isNight ? "#33211c" : "#d9b38c"} />
            <stop offset="100%" stopColor={isNight ? "#1a100e" : "#a67b5b"} />
          </linearGradient>
          <linearGradient id="windowSky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={isNight ? "#1e1b4b" : "#60a5fa"} />
            <stop offset="100%" stopColor={isNight ? "#312e81" : "#bae6fd"} />
          </linearGradient>
          <radialGradient id="rugGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isNight ? "#701a75" : "#fbcfe8"} />
            <stop offset="100%" stopColor={isNight ? "#4a044e" : "#f472b6"} />
          </radialGradient>
        </defs>

        {/* --- ROOM ENVIRONMENT --- */}
        <rect width="320" height="200" fill="url(#wallGradient)" />
        <rect x="0" y="200" width="320" height="120" fill="url(#floorGradient)" />
        
        {/* Baseboard */}
        <rect x="0" y="195" width="320" height="8" fill={isNight ? "#0f172a" : "#94a3b8"} />

        {/* Window */}
        <g transform="translate(90, 40)">
          {/* Frame Outer */}
          <rect x="-4" y="-4" width="148" height="118" rx="8" fill={isNight ? "#334155" : "#ffffff"} />
          {/* Glass / Sky */}
          <rect x="0" y="0" width="140" height="110" rx="4" fill="url(#windowSky)" />
          
          {/* Celestial Bodies */}
          {isNight ? (
            <g>
              <circle cx="110" cy="30" r="12" fill="#fef08a" />
              <circle cx="106" cy="26" r="12" fill="url(#windowSky)" /> {/* Crescent moon cutout */}
              {Array.from({ length: 8 }).map((_, i) => (
                <circle 
                  key={i} 
                  cx={10 + Math.random() * 120} 
                  cy={10 + Math.random() * 90} 
                  r="1" 
                  fill="#fff" 
                  style={{ animation: `starTwinkle ${2 + Math.random()}s infinite ${Math.random()}s` }} 
                />
              ))}
            </g>
          ) : (
            <circle cx="110" cy="40" r="16" fill="#fde047" opacity="0.9" />
          )}

          {/* Window Panes */}
          <line x1="70" y1="0" x2="70" y2="110" stroke={isNight ? "#334155" : "#ffffff"} strokeWidth="4" />
          <line x1="0" y1="55" x2="140" y2="55" stroke={isNight ? "#334155" : "#ffffff"} strokeWidth="4" />
        </g>

        {/* Cozy Rug */}
        <ellipse cx="160" cy="245" rx="100" ry="35" fill="url(#rugGradient)" opacity="0.85" />
        {/* Rug Fringe */}
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={i} x1={60 + i * 6.8} y1="245" x2={60 + i * 6.8} y2="282" stroke={isNight ? "#831843" : "#fbcfe8"} strokeWidth="1.5" opacity="0.3" />
        ))}

        {!isHiding && !isNight && <Sparkles count={5} tint="#ffffff" />}

        {/* --- THE CAT --- */}
        {isHiding ? (
          // Hiding in a Cardboard Box if Health == 0
          <g transform="translate(160, 240)">
            <g style={{ animation: "boxPeek 4s ease-in-out infinite" }}>
              {/* Glowing Eyes inside the dark box */}
              <circle cx="-10" cy="-10" r="3" fill="#fde047" />
              <circle cx="10" cy="-10" r="3" fill="#fde047" />
            </g>
            {/* The Box */}
            <path d="M -40 -15 L 40 -15 L 50 25 L -50 25 Z" fill="#b45309" />
            <path d="M -40 -15 L -55 -30 L -15 -30 L 0 -15 Z" fill="#d97706" />
            <path d="M 40 -15 L 55 -30 L 15 -30 L 0 -15 Z" fill="#d97706" />
            <path d="M -40 -15 L 0 -15 L -10 10 L -50 10 Z" fill="#92400e" opacity="0.4" />
            <text x="0" y="10" textAnchor="middle" fontSize="10" fill="#78350f" opacity="0.6" fontWeight="bold">FRAGILE</text>
          </g>
        ) : (
          <g
            key={`poke-${poke}`}
            style={awake ? { animation: "purrVibrate 0.2s infinite" } : undefined}
          >
            {/* The Growth Scale applies directly here */}
            <g transform={`translate(160, 240) scale(${growthScale})`}>
              
              {/* Sleeping Zzzs */}
              {!awake && !critical && (
                <g>
                  <text x="30" y="-30" fontSize="14" fill="#64748b" style={{ animation: "zzzFloat 3s linear infinite" }}>z</text>
                  <text x="30" y="-30" fontSize="10" fill="#94a3b8" style={{ animation: "zzzFloat 3s linear 1.5s infinite" }}>z</text>
                </g>
              )}

              {/* Tail Swish Animation */}
              <g style={{ animation: awake ? "tailSwish 0.5s ease-in-out infinite alternate" : "tailSwish 4s ease-in-out infinite alternate", transformOrigin: "35px 0px" }}>
                <path d="M 35 0 C 60 10, 75 -15, 60 -25" fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
                <path d="M 35 0 C 60 10, 75 -15, 60 -25" fill="none" stroke="#d97706" strokeWidth="10" strokeLinecap="round" strokeDasharray="4 8" opacity="0.4" />
              </g>

              {/* Breathing Body Animation */}
              <g style={{ animation: "catBreathe 3s ease-in-out infinite", transformOrigin: "0px 10px" }}>
                
                {/* Main Loaf Body */}
                <path d="M -30 15 C -45 15, -40 -25, 0 -25 C 40 -25, 45 15, 30 15 Z" fill="#f59e0b" />
                
                {/* Back Stripes */}
                <path d="M -15 -24 L -10 -10 M 0 -25 L 0 -8 M 15 -24 L 10 -10" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6" />

                {/* Front Paw with Pink Toe Beans! */}
                <g transform="translate(-10, 15)">
                  <ellipse cx="0" cy="0" rx="12" ry="7" fill="#fbbf24" />
                  {/* Beans */}
                  <circle cx="-5" cy="2" r="1.5" fill="#fca5a5" />
                  <circle cx="0" cy="3" r="1.5" fill="#fca5a5" />
                  <circle cx="5" cy="2" r="1.5" fill="#fca5a5" />
                  <ellipse cx="0" cy="-1" rx="4" ry="2.5" fill="#fca5a5" />
                </g>
              </g>

              {/* Head & Ear Twitch Animation */}
              <g transform="translate(-25, -10)" style={{ animation: awake ? "none" : "earTwitch 6s infinite", transformOrigin: "0px 0px" }}>
                {/* Ears */}
                <g>
                  {/* Left Ear */}
                  <polygon points="-16,-12 -10,-28 0,-15" fill="#f59e0b" />
                  <polygon points="-13,-14 -10,-24 -3,-16" fill="#fca5a5" />
                  {/* Right Ear */}
                  <polygon points="4,-16 12,-26 15,-10" fill="#f59e0b" />
                  <polygon points="6,-16 11,-22 13,-12" fill="#fca5a5" />
                </g>

                {/* Face Circle */}
                <circle cx="0" cy="0" r="18" fill="#f59e0b" />
                
                {/* Head Stripes */}
                <path d="M -5 -18 L -3 -10 M 0 -18 L 0 -9 M 5 -18 L 3 -10" stroke="#d97706" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />

                {/* Eyes */}
                {awake ? (
                  // Wide awake eyes when poked
                  <g>
                    <circle cx="-7" cy="-2" r="3" fill="#1e293b" />
                    <circle cx="-8" cy="-3" r="1" fill="#fff" />
                    <circle cx="7" cy="-2" r="3" fill="#1e293b" />
                    <circle cx="6" cy="-3" r="1" fill="#fff" />
                  </g>
                ) : (
                  // Closed sleeping eyes
                  <g stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round">
                    <path d="M -10 -2 Q -7 2 -4 -2" />
                    <path d="M 4 -2 Q 7 2 10 -2" />
                  </g>
                )}

                {/* Nose & Mouth */}
                <polygon points="-2,4 0,7 2,4" fill="#fca5a5" />
                <path d="M -3 9 Q 0 7 0 7 Q 0 7 3 9" stroke="#78350f" strokeWidth="1" fill="none" />

                {/* Whiskers */}
                <g stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
                  <line x1="-12" y1="5" x2="-22" y2="3" />
                  <line x1="-12" y1="7" x2="-22" y2="8" />
                  <line x1="12" y1="5" x2="22" y2="3" />
                  <line x1="12" y1="7" x2="22" y2="8" />
                </g>
              </g>

            </g>
          </g>
        )}

        {/* --- UI WARNINGS --- */}
        {(lonely || isHiding) && (
          <g style={(critical || isHiding) ? { animation: "warnBlink 0.8s ease-in-out infinite" } : undefined}>
            <rect x="60" y="12" width="200" height="24" rx="12" fill="#000" opacity="0.6" />
            <text x="160" y="28" textAnchor="middle" fontSize="12" fill="#ffb3a0" fontWeight="bold">
              {isHiding ? "Kitten is hiding under the bed" : critical ? "Kitten really misses you" : "Kitten is feeling lonely"}
            </text>
          </g>
        )}

        {/* Burst FX on Level Up */}
        {levelUp > 0 && !isHiding && (
          <Burst
            key={levelUp}
            trigger={levelUp}
            cx={160}
            cy={180}
            colors={["#f59e0b", "#fca5a5", "#ffffff", "#fde047"]}
          />
        )}
        
        {/* Happy Hearts when poked */}
        {poke > 0 && !isHiding && (
          <Burst 
            key={`poke-burst-${poke}`} 
            trigger={poke} 
            cx={130} 
            cy={190} 
            colors={["#fca5a5", "#ef4444"]}
          />
        )}
      </svg>
    </div>
  );
}