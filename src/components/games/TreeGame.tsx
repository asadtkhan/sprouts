// Tree game — 31 stages of growth.
import { useState } from "react";
import { GameDefs, Pedestal, Sparkles, FX_KEYFRAMES, Burst, useBurstOnIncrease } from "./fx";

interface Props {
  stage: number;
  health: number;
}

export function TreeGame({ stage, health }: Props) {
  const MAX = 31;
  const s = Math.min(MAX, Math.max(0, stage));
  const wilt = health < 50;
  const critical = health < 25;
  const leaf = wilt ? "#c9a86a" : "#4ea36b";
  const leafLight = wilt ? "#e2c98a" : "#7bc48a";
  const trunk = wilt ? "#8a6a4a" : "#8b5a3c";
  const bloom = s >= 24 ? "#ff9ec2" : null;
  // Rescale the visual 0-8 tiers across 31 stages so growth is gradual.
  const capped = Math.min(8, Math.floor((s / MAX) * 8 + 0.0001));

  const levelUp = useBurstOnIncrease(capped);
  const [poke, setPoke] = useState(0);
  const react = () => setPoke((p) => p + 1);

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none"
      role="button"
      tabIndex={0}
      aria-label={`Tree companion, stage ${s} of ${MAX}. Tap to give it a little love.`}
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
        @keyframes leafFall { 0%{ transform: translate(0,0) rotate(0); opacity:1 } 100%{ transform: translate(-40px,90px) rotate(120deg); opacity:0 } }
        @keyframes wiltFall { 0%{ transform: translate(0,0) rotate(0); opacity:1 } 100%{ transform: translate(20px,120px) rotate(200deg); opacity:0 } }
        @keyframes cloudDrift { 0%{ transform: translateX(0) } 100%{ transform: translateX(20px) } }
        @keyframes sun { 0%,100%{ transform: scale(1) } 50%{ transform: scale(1.06) } }
        ${FX_KEYFRAMES}
      `}</style>

      <svg viewBox="0 0 320 320" className="w-full h-full">
        <GameDefs id="tree" />
        <defs>
          <radialGradient id="sky" cx="50%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#fffaf0" />
            <stop offset="45%" stopColor="#f3f7e8" />
            <stop offset="100%" stopColor="#dceee6" />
          </radialGradient>
          <linearGradient id="ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d7b98d" />
            <stop offset="100%" stopColor="#8a6a4a" />
          </linearGradient>
        </defs>
        <rect width="320" height="320" rx="24" fill="url(#sky)" />
        <Sparkles count={12} tint="#ffe9a8" />
        <g style={{ animation: "sun 4s ease-in-out infinite", transformOrigin: "255px 70px" }}>
          <circle cx="255" cy="70" r="34" fill="#ffe6a8" opacity="0.45" filter="url(#tree-glow)" />
          <circle cx="255" cy="70" r="24" fill="#ffd98a" />
        </g>
        <g style={{ animation: "cloudDrift 6s ease-in-out infinite alternate" }}>
          <ellipse cx="80" cy="55" rx="22" ry="7" fill="#fff" opacity="0.85" />
          <ellipse cx="100" cy="50" rx="14" ry="5" fill="#fff" opacity="0.85" />
          <ellipse cx="64" cy="52" rx="12" ry="5" fill="#fff" opacity="0.7" />
        </g>
        <ellipse cx="160" cy="272" rx="145" ry="32" fill="url(#ground)" />
        <ellipse cx="160" cy="264" rx="126" ry="14" fill="#c49a68" opacity="0.6" />
        <Pedestal id="tree" cy={266} rx={98} />
        <rect width="320" height="320" rx="24" fill="url(#tree-vignette)" />

        {/* falling leaf */}
        {capped >= 4 && !wilt && (
          <g style={{ animation: "leafFall 5s ease-in infinite", transformOrigin: "180px 140px" }}>
            <ellipse cx="180" cy="140" rx="4" ry="2.5" fill={leafLight} />
          </g>
        )}

        {/* Whole tree group sways as one */}
        {/* Wilted leaves falling when unhealthy */}
        {wilt && capped >= 2 && (
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

        {/* Whole tree group sways as one; a nested group handles the tap bounce
            so it doesn't fight the sway animation's transform. */}
        <g
          key={`poke-${poke}`}
          style={
            poke
              ? { animation: "pokeBounce 0.5s ease-out", transformOrigin: "160px 260px" }
              : undefined
          }
        >
          <g
            filter="url(#tree-soft)"
            style={{
              animation: `${critical ? "treeDroop" : "treeSway"} 4.5s ease-in-out infinite`,
              transformOrigin: "160px 260px",
            }}
          >
            {capped === 0 && (
              <g>
                <ellipse cx="160" cy="258" rx="10" ry="6" fill="#7a4b2a" />
                <path d="M158 254 Q160 250 162 254" stroke="#4ea36b" strokeWidth="2" fill="none" />
              </g>
            )}
            {capped === 1 && (
              <g>
                <path d="M160 260 L160 235" stroke={trunk} strokeWidth="3" strokeLinecap="round" />
                <ellipse
                  cx="152"
                  cy="236"
                  rx="8"
                  ry="4"
                  fill={leaf}
                  transform="rotate(-25 152 236)"
                />
                <ellipse
                  cx="168"
                  cy="236"
                  rx="8"
                  ry="4"
                  fill={leaf}
                  transform="rotate(25 168 236)"
                />
              </g>
            )}
            {(capped === 2 || capped === 3) && (
              <g>
                <path
                  d={`M160 260 L160 ${215 - capped * 8}`}
                  stroke={trunk}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="160" cy={210 - capped * 8} r={18 + capped * 2} fill={leaf} />
                <circle cx={148} cy={215 - capped * 8} r={12} fill={leafLight} />
                <circle cx={172} cy={215 - capped * 8} r={12} fill={leafLight} />
              </g>
            )}
            {(capped === 4 || capped === 5) && (
              <g>
                <path
                  d="M160 260 L160 180"
                  stroke={trunk}
                  strokeWidth={6 + capped}
                  strokeLinecap="round"
                />
                <circle cx="160" cy="170" r={38 + capped * 2} fill={leaf} />
                <circle cx="135" cy="180" r={22} fill={leafLight} />
                <circle cx="185" cy="180" r={22} fill={leafLight} />
                <circle cx="160" cy="140" r={18} fill={leafLight} />
              </g>
            )}
            {(capped === 6 || capped === 7) && (
              <g>
                <path d="M160 260 L160 155" stroke={trunk} strokeWidth={10} strokeLinecap="round" />
                <path
                  d="M160 210 Q140 200 130 185"
                  stroke={trunk}
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M160 200 Q180 190 195 180"
                  stroke={trunk}
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx="160" cy="140" r={50} fill={leaf} />
                <circle cx="120" cy="160" r={28} fill={leafLight} />
                <circle cx="200" cy="160" r={28} fill={leafLight} />
                <circle cx="160" cy="105" r={26} fill={leafLight} />
              </g>
            )}
            {capped >= 8 && (
              <g>
                <path d="M160 260 L160 150" stroke={trunk} strokeWidth={12} strokeLinecap="round" />
                <path
                  d="M160 210 Q135 200 125 180"
                  stroke={trunk}
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M160 200 Q185 190 200 175"
                  stroke={trunk}
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx="160" cy="135" r={58} fill={leaf} />
                <circle cx="115" cy="155" r={32} fill={leafLight} />
                <circle cx="205" cy="155" r={32} fill={leafLight} />
                <circle cx="160" cy="95" r={30} fill={leafLight} />
                {[
                  [130, 130],
                  [180, 120],
                  [200, 160],
                  [140, 170],
                  [170, 155],
                  [110, 145],
                ].map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5" fill={bloom ?? "#ff9ec2"} />
                    <circle cx={x} cy={y} r="2" fill="#fff5c2" />
                  </g>
                ))}
              </g>
            )}
          </g>
        </g>

        {wilt && (
          <g style={critical ? { animation: "warnBlink 0.8s ease-in-out infinite" } : undefined}>
            <rect x="12" y="12" width="128" height="22" rx="11" fill="#000" opacity="0.4" />
            <text x="76" y="27" textAnchor="middle" fontSize="11" fill="#ffd9a0">
              {critical ? "🥀 Wilting badly" : "💧 Needs water"}
            </text>
          </g>
        )}

        {levelUp > 0 && <Burst key={levelUp} trigger={levelUp} cx={160} cy={180} />}
        {poke > 0 && (
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