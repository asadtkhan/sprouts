// Space game — 31 stages from launchpad to planet impact.
import { useState } from "react";
import { GameDefs, Sparkles, FX_KEYFRAMES, Burst, useBurstOnIncrease } from "./fx";

interface Props {
  stage: number;
  health: number;
}

export function SpaceGame({ stage, health }: Props) {
  const MAX = 31;
  const s = Math.min(MAX, Math.max(0, stage));
  
  // Calculate continuous progress from 0.0 to 1.0 based on stage
  const progress = s / MAX; 
  
  // Health states
  const isFailed = health <= 0;
  const critical = health > 0 && health <= 25;
  const lowFuel = health > 25 && health <= 50;
  
  // Flight path calculations
  const takingOff = s === 0;
  const isBoosting = s > 0 && !isFailed;
  const missionAccomplished = s === MAX && !isFailed;
  
  // Rocket stays perfectly centered horizontally (X=160).
  // It lifts up slightly into frame during flight.
  const rocketX = 160;
  const flightY = 220 - Math.min(progress * 150, 40);
  // If failed on the pad, it tips over. If failed in space, it crashes off-screen.
  const rocketY = isFailed ? (takingOff ? 220 : 400) : flightY;
  const rocketRot = isFailed ? (takingOff ? 15 : 110) : 0;
  
  // Earth starts with its surface exactly at the rocket's landing gear.
  // Rocket Y is 220, fins reach down to +42 = Screen Y 262.
  // Earth Radius is 280. So Earth center Y needs to be 542 (542 - 280 = 262).
  const earthY = 542 + progress * 1200; 

  // Alien Planet starts hidden above the screen, lowers into view at the end
  const alienX = 160;
  const alienY = -150 + progress * 250; // Ends exactly at Y=100
  const planetR = 25 + progress * 10;

  const levelUp = useBurstOnIncrease(s);
  const [poke, setPoke] = useState(0);
  const react = () => setPoke((p) => p + 1);

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none overflow-hidden rounded-3xl"
      role="button"
      tabIndex={0}
      aria-label={`Space mission, stage ${s} of ${MAX}.`}
      onClick={react}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          react();
        }
      }}
    >
      <style>{`
        @keyframes rocketBob { 0%,100%{ transform: translate(0,0) } 50%{ transform: translate(0,-4px) } }
        @keyframes rocketWobble { 0%,100%{ transform: translate(-3px,0) rotate(-4deg) } 50%{ transform: translate(3px,-2px) rotate(4deg) } }
        @keyframes rocketBoost { 0%{ transform: translateY(0) } 40%{ transform: translateY(-14px) } 100%{ transform: translateY(0) } }
        @keyframes flameFlicker { 0%,100%{ transform: scaleY(1) } 50%{ transform: scaleY(1.25) } }
        @keyframes flameSputter { 0%,100%{ transform: scaleY(0.4); opacity: 0.4 } 30%{ transform: scaleY(0.9); opacity: 1 } 60%{ transform: scaleY(0.2); opacity: 0.2 } }
        @keyframes smokePuff { 0%{ opacity:0.8; transform: translate(0,0) scale(0.8) } 100%{ opacity:0; transform: translate(-14px,18px) scale(1.6) } }
        @keyframes starTwinkle { 0%,100%{ opacity:0.4 } 50%{ opacity:1 } }
        @keyframes laserFire { 0%,100%{ opacity: 1; stroke-width: 5px; } 50%{ opacity: 0.6; stroke-width: 2px; } }
        @keyframes planetShake { 0%,100%{ transform: translate(0,0) } 25%{ transform: translate(-2px,2px) } 75%{ transform: translate(2px,-2px) } }
        
        /* Astronaut walks from the left facility to the rocket elevator */
        @keyframes boardShip {
          0% { transform: translateX(-90px); opacity: 0; }
          10% { opacity: 1; transform: translateX(-90px); }
          60% { transform: translateX(-15px); opacity: 1; }
          70% { opacity: 0; transform: translateX(-15px); }
          100% { opacity: 0; transform: translateX(-15px); }
        }
        @keyframes astronautWalk { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-2px) } }
        
        ${FX_KEYFRAMES}
      `}</style>

      <svg viewBox="0 0 320 320" className="w-full h-full">
        <GameDefs id="space" />
        <defs>
          <linearGradient id="spaceBg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#08071c" />
            <stop offset="40%" stopColor="#1a1543" />
            <stop offset="80%" stopColor="#4a3768" />
            <stop offset="100%" stopColor="#2d1f44" />
          </linearGradient>
          <linearGradient id="daySky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4ea5d9" />
            <stop offset="60%" stopColor="#8fb1e0" />
            <stop offset="100%" stopColor="#dff0ff" />
          </linearGradient>
          <radialGradient id="nebula" cx="30%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#ff9ec2" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff9ec2" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="planetG" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffc39a" />
            <stop offset="60%" stopColor="#e08a5a" />
            <stop offset="100%" stopColor="#a4522f" />
          </radialGradient>
          <linearGradient id="hull" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#cfd4e8" />
            <stop offset="45%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#b8bfd8" />
          </linearGradient>
        </defs>

        {/* --- DEEP SPACE BACKGROUND --- */}
        <rect width="320" height="320" fill="url(#spaceBg)" />
        <rect width="320" height="320" fill="url(#nebula)" opacity={0.5 + progress * 0.5} />
        
        {/* Parallax Scrolling Stars (Fade in as we leave Earth) */}
        <g opacity={Math.min(1, progress * 4)}>
          {Array.from({ length: 40 }).map((_, i) => {
            const x = ((i * 53) % 300) + 10;
            const y = ((i * 37) % 320);
            const movingY = (y + progress * 800 * ((i % 3) + 1)) % 320;
            return (
              <circle
                key={i}
                cx={x}
                cy={movingY}
                r={i % 4 === 0 ? 1.5 : 0.8}
                fill="#fff"
                style={{ animation: `starTwinkle 3s ease-in-out ${i * 0.15}s infinite` }}
              />
            );
          })}
        </g>
        <Sparkles count={8} tint="#dff0ff" />

        {/* --- DAYLIGHT ATMOSPHERE (Fades away as you launch) --- */}
        <g opacity={Math.max(0, 1 - progress * 6)}>
          <rect width="320" height="320" fill="url(#daySky)" />
          {/* Sun */}
          <circle cx="260" cy="70" r="30" fill="#ffdf70" />
          {/* Clouds */}
          <path d="M 40 120 Q 60 100 80 120 Q 100 110 120 120 Z" fill="#ffffff" opacity="0.8" />
          <path d="M 200 150 Q 220 130 240 150 Q 270 140 290 150 Z" fill="#ffffff" opacity="0.6" />
        </g>

        {/* --- PASSING CELESTIAL BODIES --- */}
        <g style={{ transform: `translate(60px, ${-200 + progress * 1000}px)` }}>
          <circle cx="0" cy="0" r="40" fill="#a5a5ba" />
          <circle cx="-15" cy="-10" r="8" fill="#88889d" opacity="0.5" />
          <circle cx="15" cy="20" r="12" fill="#88889d" opacity="0.5" />
        </g>

        {/* --- EARTH & SPACE STATION --- */}
        <g style={{ transform: `translate(160px, ${earthY}px)` }}>
          {/* Earth Body */}
          <circle cx="0" cy="0" r="280" fill="#4ea5d9" />
          {/* Simple Continents */}
          <path d="M -150 -230 Q -80 -180 0 -250 Q 100 -200 160 -230 Z" fill="#6bc26b" />
          <path d="M -250 -80 Q -180 -120 -100 -40 Q -200 60 -270 40 Z" fill="#6bc26b" />
          {/* Atmosphere line */}
          <circle cx="0" cy="0" r="284" fill="none" stroke="#a3d5ff" strokeWidth="8" opacity="0.4" />
          
          {/* Space Station Launchpad (Sits perfectly at Y=-280) */}
          <path d="M -120 -280 L 120 -280 L 140 -200 L -140 -200 Z" fill="#cbd5e1" opacity="0.2" />
          <rect x="-80" y="-280" width="160" height="15" rx="4" fill="#4a5568" />
          <rect x="-90" y="-265" width="180" height="20" rx="6" fill="#2d3748" />
          
          {/* Launch Tower (Left) */}
          <rect x="-35" y="-370" width="10" height="90" fill="#718096" />
          <rect x="-25" y="-350" width="15" height="4" fill="#a0aec0" />
          <rect x="-25" y="-310" width="15" height="4" fill="#a0aec0" />
          
          {/* Umbilical Tower (Right) */}
          <rect x="25" y="-320" width="6" height="40" fill="#718096" />
          <rect x="15" y="-315" width="10" height="3" fill="#a0aec0" />

          {/* Boarding Astronaut */}
          {takingOff && !isFailed && (
            <g style={{ animation: "boardShip 4s infinite" }}>
              <g style={{ animation: "astronautWalk 0.4s infinite" }}>
                {/* Y=-292 sits the astronaut exactly on the launchpad surface */}
                <rect x="-4" y="-292" width="8" height="12" rx="3" fill="#ffffff" />
                <circle cx="0" cy="-296" r="5" fill="#ffffff" />
                <rect x="-3" y="-298" width="6" height="4" rx="2" fill="#2d1f44" />
              </g>
            </g>
          )}
        </g>

        {/* --- ALIEN PLANET --- */}
        <g style={{ transform: `translate(${alienX}px, ${alienY}px)` }}>
          <g style={{ animation: missionAccomplished ? "planetShake 0.4s infinite" : "none" }}>
            <circle cx="0" cy="0" r={planetR + 10} fill="#ffb98a" opacity="0.25" filter="url(#space-glow)" />
            
            {/* If destroyed, split the planet into pieces */}
            {missionAccomplished ? (
              <g>
                <path d={`M -${planetR} 0 A ${planetR} ${planetR} 0 0 1 ${planetR} 0 Z`} fill="url(#planetG)" transform="translate(-5, -10) rotate(-10)" />
                <path d={`M -${planetR} 0 A ${planetR} ${planetR} 0 0 0 ${planetR} 0 Z`} fill="url(#planetG)" transform="translate(5, 10) rotate(10)" />
                <circle cx="0" cy="0" r={planetR + 15} fill="#ff6b6b" opacity="0.6" />
                <text x="0" y="8" textAnchor="middle" fontSize={planetR}>💥</text>
              </g>
            ) : (
              <g>
                <circle cx="0" cy="0" r={planetR} fill="url(#planetG)" />
                <ellipse cx="0" cy="0" rx={planetR + 14} ry={5} fill="#e8d3b0" opacity="0.75" />
                <ellipse cx="-8" cy="-8" rx={planetR * 0.4} ry={planetR * 0.28} fill="#fff" opacity="0.18" />
              </g>
            )}
          </g>
        </g>

        {/* --- DESTRUCTIVE LASER BEAM --- */}
        {missionAccomplished && (
          <line
            x1={rocketX}
            y1={rocketY - 30}
            x2={alienX}
            y2={alienY + planetR}
            stroke="#54f890"
            style={{ animation: "laserFire 0.15s infinite" }}
          />
        )}

        {/* --- THE ROCKET --- */}
        <g
          style={{
            transform: `translate(${rocketX}px, ${rocketY}px) rotate(${rocketRot}deg)`,
            transition: "transform 1s ease-in-out",
          }}
        >
          {/* Boost poke animation */}
          <g key={`poke-${poke}`} style={poke && !isFailed ? { animation: "rocketBoost 0.55s ease-out" } : undefined}>
            {/* Flight bobbing/wobbling animation */}
            <g style={{ animation: isFailed || takingOff ? "none" : `${critical ? "rocketWobble" : "rocketBob"} 2.2s ease-in-out infinite` }}>
              <g filter="url(#space-soft)">
                
                {/* Black smoke on failure, or pad smoke before takeoff */}
                {(takingOff || isFailed) && (
                  <g>
                    <circle cx="-14" cy="45" r="8" fill={isFailed ? "#333" : "#dcdce6"} style={{ animation: "smokePuff 1.4s ease-out infinite" }} />
                    <circle cx="6" cy="47" r="6" fill={isFailed ? "#222" : "#e8e8f0"} style={{ animation: "smokePuff 1.4s ease-out 0.5s infinite" }} />
                    <circle cx="18" cy="45" r="7" fill={isFailed ? "#444" : "#d0d0dc"} style={{ animation: "smokePuff 1.4s ease-out 0.9s infinite" }} />
                  </g>
                )}

                {/* Rocket Flames (Active in flight, or when poked on the pad) */}
                {(isBoosting || poke > 0) && !isFailed && (
                  <g style={{
                    animation: `${critical ? "flameSputter" : "flameFlicker"} ${critical ? "0.6s" : "0.25s"} ease-in-out infinite`,
                    transformOrigin: "0px 40px",
                  }}>
                    <path d="M0 38 Q-10 58 0 78 Q10 58 0 38 Z" fill={lowFuel ? "#ffb08a" : "#ff8a3a"} opacity="0.55" />
                    <path d="M0 40 Q-6 55 0 70 Q6 55 0 40 Z" fill={lowFuel ? "#ffc9a8" : "#ffab55"} />
                    <path d="M0 40 Q-3 50 0 60 Q3 50 0 40 Z" fill={lowFuel ? "#ffe0b8" : "#ffd54a"} />
                  </g>
                )}

                {/* Rocket Body */}
                <path d="M-12 -30 Q0 -50 12 -30 L12 30 L-12 30 Z" fill={isFailed ? "#888" : "url(#hull)"} />
                <path d="M-12 -30 Q0 -50 12 -30 L12 -10 L-12 -10 Z" fill={isFailed ? "#a0a5b5" : "#eef1fb"} />
                <path d="M-12 -30 Q0 -50 12 -30 L12 30 L-12 30 Z" fill="url(#space-sheen)" opacity="0.5" />
                
                {/* Cockpit Window & Astronaut inside */}
                <circle cx="0" cy="0" r="8" fill="#2d1f44" />
                {(!takingOff && !isFailed) && (
                  <circle cx="2" cy="2" r="4" fill="#fff" opacity="0.9" /> // Helmet visible once boarded
                )}
                <circle cx="0" cy="0" r="8" fill="none" stroke={isFailed ? "#555" : "#cfeaff"} strokeWidth="2" />
                <circle cx="-2.5" cy="-2.5" r="2.4" fill="#fff" opacity={isFailed ? 0.2 : 0.8} />
                
                {/* Fins */}
                <path d="M-12 20 L-24 42 L-12 40 Z" fill={isFailed ? "#aa4b4b" : "#ff7b7b"} />
                <path d="M12 20 L24 42 L12 40 Z" fill={isFailed ? "#aa4b4b" : "#ff7b7b"} />
                <rect x="-12" y="8" width="24" height="4" fill={isFailed ? "#883b3b" : "#ff6b6b"} />
              </g>
            </g>
          </g>
        </g>

        {/* --- UI WARNINGS --- */}
        {(lowFuel || isFailed) && (
          <g style={(critical || isFailed) ? { animation: "warnBlink 0.8s ease-in-out infinite" } : undefined}>
            <rect x="100" y="12" width="120" height="22" rx="11" fill="#000" opacity="0.6" />
            <text x="160" y="27" textAnchor="middle" fontSize="11" fill="#ffb08a" fontWeight="bold">
              {isFailed ? "❌ SYSTEM FAILURE" : critical ? "⚠ CRITICAL HULL" : "⚠ LOW FUEL"}
            </text>
          </g>
        )}

        {/* Burst FX on Level Up */}
        {levelUp > 0 && !isFailed && (
          <Burst
            key={levelUp}
            trigger={levelUp}
            cx={alienX}
            cy={alienY}
            colors={["#ffc39a", "#ffd76a", "#ffffff", "#8ab4ff"]}
          />
        )}
      </svg>
    </div>
  );
}