// Space game — 31 stages from launchpad to planet impact.
import { GameDefs, Pedestal, Sparkles, FX_KEYFRAMES } from "./fx";


interface Props {
  stage: number;
  health: number;
}

export function SpaceGame({ stage, health }: Props) {
  const MAX = 31;
  const s = Math.min(MAX, Math.max(0, stage));
  const capped = Math.min(8, Math.floor((s / MAX) * 8 + 0.0001));
  const lowFuel = health < 50;
  const critical = health < 25;
  const rocketY = 260 - capped * 26;
  const planetR = 20 + capped * 3;
  const takingOff = capped === 0;

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes rocketBob { 0%,100%{ transform: translate(0,0) } 50%{ transform: translate(0,-4px) } }
        @keyframes rocketWobble { 0%,100%{ transform: translate(-3px,0) rotate(-4deg) } 50%{ transform: translate(3px,-2px) rotate(4deg) } }
        @keyframes flameFlicker { 0%,100%{ transform: scaleY(1) } 50%{ transform: scaleY(1.25) } }
        @keyframes flameSputter { 0%,100%{ transform: scaleY(0.4); opacity: 0.4 } 30%{ transform: scaleY(0.9); opacity: 1 } 60%{ transform: scaleY(0.2); opacity: 0.2 } }
        @keyframes smokePuff { 0%{ opacity:0.8; transform: translate(0,0) scale(0.8) } 100%{ opacity:0; transform: translate(-14px,18px) scale(1.6) } }
        @keyframes starTwinkle { 0%,100%{ opacity:0.4 } 50%{ opacity:1 } }
        @keyframes warnBlink { 0%,100%{ opacity: 1 } 50%{ opacity: 0.4 } }
        ${FX_KEYFRAMES}
      `}</style>

      <svg viewBox="0 0 320 320" className="w-full h-full">
        <GameDefs id="space" />
        <defs>
          <linearGradient id="space" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0d0b2b" />
            <stop offset="38%" stopColor="#3b2f78" />
            <stop offset="70%" stopColor="#8a6bb0" />
            <stop offset="100%" stopColor="#f7cfae" />
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
        <rect width="320" height="320" rx="24" fill="url(#space)" />
        <rect width="320" height="320" rx="24" fill="url(#nebula)" />
        {Array.from({ length: 30 }).map((_, i) => {
          const x = (i * 53) % 300 + 10;
          const y = (i * 37) % 240 + 10;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i % 4 === 0 ? 1.5 : 0.8}
              fill="#fff"
              style={{ animation: `starTwinkle 3s ease-in-out ${i * 0.15}s infinite` }}
            />
          );
        })}
        <Sparkles count={8} tint="#dff0ff" />
        <g>
          <circle cx="240" cy="70" r={planetR + 10} fill="#ffb98a" opacity="0.25" filter="url(#space-glow)" />
          <circle cx="240" cy="70" r={planetR} fill="url(#planetG)" />
          <ellipse cx="240" cy="70" rx={planetR + 14} ry={5} fill="#e8d3b0" opacity="0.75" />
          <ellipse cx={232} cy={62} rx={planetR * 0.4} ry={planetR * 0.28} fill="#fff" opacity="0.18" />
          {capped >= 8 && (
            <g>
              <circle cx="240" cy="70" r={planetR + 8} fill="#ff6b6b" opacity="0.4" />
              <text x="240" y="76" textAnchor="middle" fontSize="18">💥</text>
            </g>
          )}
        </g>
        {capped === 0 && (
          <g>
            <Pedestal id="space" cy={286} rx={112} />
          </g>
        )}
        <line x1="0" y1="220" x2="320" y2="220" stroke="#fff" strokeDasharray="3 6" opacity="0.15" />
        <line x1="0" y1="160" x2="320" y2="160" stroke="#fff" strokeDasharray="3 6" opacity="0.15" />
        <line x1="0" y1="100" x2="320" y2="100" stroke="#fff" strokeDasharray="3 6" opacity="0.15" />

        {/* rocket bobbing (wobbles when critical) */}
        <g style={{ animation: `${critical ? "rocketWobble" : "rocketBob"} 2.2s ease-in-out infinite` }}>

          <g filter="url(#space-soft)" transform={`translate(${100 + capped * 12}, ${rocketY})`}>
            {/* combustion smoke on the ground before takeoff */}
            {takingOff && (
              <g>
                <circle cx="-14" cy="70" r="8" fill="#dcdce6" style={{ animation: "smokePuff 1.4s ease-out infinite" }} />
                <circle cx="6" cy="72" r="6" fill="#e8e8f0" style={{ animation: "smokePuff 1.4s ease-out 0.5s infinite" }} />
                <circle cx="18" cy="70" r="7" fill="#d0d0dc" style={{ animation: "smokePuff 1.4s ease-out 0.9s infinite" }} />
              </g>
            )}
            {(capped > 0 || takingOff) && (
              <g style={{ animation: `${critical ? "flameSputter" : "flameFlicker"} ${critical ? "0.6s" : "0.25s"} ease-in-out infinite`, transformOrigin: "0px 40px" }}>
                <path d="M0 38 Q-10 58 0 78 Q10 58 0 38 Z" fill={lowFuel ? "#ffb08a" : "#ff8a3a"} opacity="0.55" />
                <path d="M0 40 Q-6 55 0 70 Q6 55 0 40 Z" fill={lowFuel ? "#ffc9a8" : "#ffab55"} />
                <path d="M0 40 Q-3 50 0 60 Q3 50 0 40 Z" fill={lowFuel ? "#ffe0b8" : "#ffd54a"} />
              </g>
            )}

            <path d="M-12 -30 Q0 -50 12 -30 L12 30 L-12 30 Z" fill="url(#hull)" />
            <path d="M-12 -30 Q0 -50 12 -30 L12 -10 L-12 -10 Z" fill="#eef1fb" />
            <path d="M-12 -30 Q0 -50 12 -30 L12 30 L-12 30 Z" fill="url(#space-sheen)" opacity="0.5" />
            <circle cx="0" cy="0" r="8" fill="#5fa4dd" />
            <circle cx="0" cy="0" r="8" fill="none" stroke="#cfeaff" strokeWidth="2" />
            <circle cx="-2.5" cy="-2.5" r="2.4" fill="#fff" opacity="0.8" />
            <path d="M-12 20 L-24 42 L-12 40 Z" fill="#ff7b7b" />
            <path d="M12 20 L24 42 L12 40 Z" fill="#ff7b7b" />
            <rect x="-12" y="8" width="24" height="4" fill="#ff6b6b" />
          </g>
        </g>


        {lowFuel && (
          <g style={critical ? { animation: "warnBlink 0.8s ease-in-out infinite" } : undefined}>
            <rect x="12" y="12" width="90" height="22" rx="11" fill="#000" opacity="0.4" />
            <text x="57" y="27" textAnchor="middle" fontSize="11" fill="#ffb08a">
              {critical ? "⚠ CRITICAL" : "⚠ LOW FUEL"}
            </text>
          </g>
        )}

      </svg>
    </div>
  );
}
