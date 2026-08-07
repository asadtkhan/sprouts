// Cat game — 31 stages from kitten to grown cat.
import { useState } from "react";
import { GameDefs, Pedestal, Sparkles, FX_KEYFRAMES, Burst, useBurstOnIncrease } from "./fx";

interface Props {
  stage: number;
  health: number;
  compact?: boolean;
}

export function CatGame({ stage, health }: Props) {
  const MAX = 31;
  const s = Math.min(MAX, Math.max(0, stage));
  const capped = Math.min(8, Math.floor((s / MAX) * 8 + 0.0001));
  const sick = health < 50;
  const critical = health < 25;
  const scale = 0.55 + (capped / 8) * 0.55;
  const furA = sick ? "#c9b199" : "#f4c186";
  const furB = sick ? "#a89680" : "#d99a52";
  const cheek = sick ? "#e0a89a" : "#ffb3b3";
  const mouth = sick
    ? "M144 172 Q160 165 176 172"
    : capped >= 6
      ? "M144 168 Q160 182 176 168"
      : "M150 170 Q160 176 170 170";

  const levelUp = useBurstOnIncrease(capped);
  const [poke, setPoke] = useState(0);
  const react = () => setPoke((p) => p + 1);

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none"
      role="button"
      tabIndex={0}
      aria-label={`Cat companion, stage ${s} of ${MAX}. Tap to give it some scratches.`}
      onClick={react}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          react();
        }
      }}
    >
      <style>{`
        @keyframes catHead { 0%,100%{ transform: rotate(-3deg) } 50%{ transform: rotate(3deg) } }
        @keyframes catSlump { 0%,100%{ transform: rotate(-8deg) translateY(2px) } 50%{ transform: rotate(-4deg) translateY(4px) } }
        @keyframes catTail { 0%,100%{ transform: rotate(-8deg) } 50%{ transform: rotate(14deg) } }
        @keyframes catTailHappy { 0%,100%{ transform: rotate(-14deg) } 50%{ transform: rotate(24deg) } }
        @keyframes catBlink { 0%,92%,100%{ transform: scaleY(1) } 95%{ transform: scaleY(0.1) } }
        @keyframes catBreath { 0%,100%{ transform: scale(1) } 50%{ transform: scale(1.02) } }
        @keyframes zFloat { 0%{ transform: translate(0,0); opacity: 0 } 20%{ opacity: 0.9 } 100%{ transform: translate(14px,-24px); opacity: 0 } }
        @keyframes heartFloat { 0%{ transform: translate(0,0) scale(0.6); opacity: 0 } 25%{ opacity: 1; transform: translate(0,-6px) scale(1) } 100%{ transform: translate(0,-46px) scale(1.1); opacity: 0 } }
        ${FX_KEYFRAMES}
      `}</style>

      <svg viewBox="0 0 320 320" className="w-full h-full">
        <GameDefs id="cat" />
        <defs>
          <radialGradient id="room" cx="50%" cy="36%" r="82%">
            <stop offset="0%" stopColor="#fff6f9" />
            <stop offset="55%" stopColor="#ffeef4" />
            <stop offset="100%" stopColor="#efe0ee" />
          </radialGradient>
          <radialGradient id="cushion" cx="45%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#ffd8e2" />
            <stop offset="100%" stopColor="#ff9fb4" />
          </radialGradient>
        </defs>
        <rect width="320" height="320" rx="24" fill="url(#room)" />
        <Sparkles count={10} tint="#ffd6e8" />
        <Pedestal id="cat" cy={272} rx={106} />
        <ellipse cx="160" cy="266" rx="92" ry="20" fill="url(#cushion)" />
        <ellipse cx="160" cy="261" rx="80" ry="15" fill="#ffdbe4" />
        <ellipse cx="160" cy="256" rx="60" ry="9" fill="#fff" opacity="0.45" />
        <rect width="320" height="320" rx="24" fill="url(#cat-vignette)" />

        <g
          key={`poke-${poke}`}
          style={
            poke
              ? { animation: "pokeBounce 0.5s ease-out", transformOrigin: "160px 220px" }
              : undefined
          }
        >
          <g
            filter="url(#cat-soft)"
            transform={`translate(160 220) scale(${scale}) translate(-160 -180)`}
            style={{
              animation: "catBreath 3s ease-in-out infinite",
              transformOrigin: "160px 220px",
            }}
          >
            <ellipse cx="160" cy="220" rx="60" ry="46" fill={furA} />
            {/* tail sway — wags faster and happier right after a tap */}
            <g
              style={{
                animation: `${poke ? "catTailHappy 0.6s" : "catTail 2.4s"} ease-in-out infinite`,
                transformOrigin: "215px 220px",
              }}
            >
              <path
                d="M215 220 Q245 210 240 180"
                stroke={furA}
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
              />
            </g>
            <ellipse cx="130" cy="258" rx="12" ry="10" fill={furB} />
            <ellipse cx="190" cy="258" rx="12" ry="10" fill={furB} />
            {/* head tilt */}
            <g
              style={{
                animation: "catHead 3.6s ease-in-out infinite",
                transformOrigin: "160px 175px",
              }}
            >
              <ellipse cx="160" cy="160" rx="52" ry="46" fill={furA} />
              <path d="M118 130 L110 90 L145 120 Z" fill={furA} />
              <path d="M202 130 L210 90 L175 120 Z" fill={furA} />
              <path d="M124 122 L120 100 L138 118 Z" fill="#ffb3c1" />
              <path d="M196 122 L200 100 L182 118 Z" fill="#ffb3c1" />
              <circle cx="132" cy="170" r="8" fill={cheek} opacity="0.7" />
              <circle cx="188" cy="170" r="8" fill={cheek} opacity="0.7" />
              {sick ? (
                <>
                  <path
                    d="M138 152 L150 158"
                    stroke="#3a2a2a"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M150 152 L138 158"
                    stroke="#3a2a2a"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M170 152 L182 158"
                    stroke="#3a2a2a"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M182 152 L170 158"
                    stroke="#3a2a2a"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </>
              ) : capped >= 6 ? (
                <>
                  <path
                    d="M138 155 Q144 148 150 155"
                    stroke="#3a2a2a"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M170 155 Q176 148 182 155"
                    stroke="#3a2a2a"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <g
                  style={{
                    animation: "catBlink 4s ease-in-out infinite",
                    transformOrigin: "160px 155px",
                  }}
                >
                  <ellipse cx="144" cy="155" rx="4" ry="6" fill="#3a2a2a" />
                  <ellipse cx="176" cy="155" rx="4" ry="6" fill="#3a2a2a" />
                  <circle cx="145" cy="153" r="1.2" fill="#fff" />
                  <circle cx="177" cy="153" r="1.2" fill="#fff" />
                </g>
              )}
              <path d="M156 165 L164 165 L160 170 Z" fill="#ff8fa3" />
              <path
                d={mouth}
                stroke="#3a2a2a"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <line x1="110" y1="168" x2="130" y2="170" stroke="#3a2a2a" strokeWidth="1.2" />
              <line x1="110" y1="175" x2="130" y2="174" stroke="#3a2a2a" strokeWidth="1.2" />
              <line x1="210" y1="168" x2="190" y2="170" stroke="#3a2a2a" strokeWidth="1.2" />
              <line x1="210" y1="175" x2="190" y2="174" stroke="#3a2a2a" strokeWidth="1.2" />
              {capped >= 8 && (
                <g>
                  <path
                    d="M132 92 L145 105 L160 88 L175 105 L188 92 L184 118 L136 118 Z"
                    fill="#ffd76a"
                    stroke="#c99a2a"
                    strokeWidth="1.5"
                  />
                  <circle cx="160" cy="98" r="3" fill="#ff6b6b" />
                </g>
              )}
            </g>
          </g>
        </g>

        {poke > 0 && (
          <g key={`hearts-${poke}`}>
            {[0, 0.15, 0.3].map((delay, i) => (
              <text
                key={i}
                x={130 + i * 30}
                y={130}
                fontSize="16"
                style={{ animation: `heartFloat 1.1s ease-out ${delay}s forwards` }}
              >
                💛
              </text>
            ))}
          </g>
        )}

        {sick && (
          <g>
            <rect x="12" y="12" width="76" height="22" rx="11" fill="#000" opacity="0.35" />
            <text x="50" y="27" textAnchor="middle" fontSize="11" fill="#ffd1d1">
              {critical ? "🤒 Very sick" : "🤒 Sick"}
            </text>
          </g>
        )}
        {critical && (
          <g>
            {[0, 0.7, 1.4].map((d, i) => (
              <text
                key={i}
                x={210 + i * 6}
                y={130}
                fontSize="14"
                fill="#8a8a95"
                style={{ animation: `zFloat 2.4s ease-out ${d}s infinite` }}
              >
                z
              </text>
            ))}
          </g>
        )}

        {levelUp > 0 && (
          <Burst
            key={levelUp}
            trigger={levelUp}
            cx={160}
            cy={200}
            colors={["#ffd76a", "#ff9ec2", "#ffb3b3", "#fff5c2"]}
          />
        )}
      </svg>
    </div>
  );
}

// A tiny cat body (no room background) used in the journal roamer.
export function LittleCat({ stage }: { stage: number }) {
  const capped = Math.min(8, Math.max(0, stage));
  const scale = 0.5 + (capped / 8) * 0.5;
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <style>{`
        @keyframes lcTail { 0%,100%{ transform: rotate(-8deg) } 50%{ transform: rotate(20deg) } }
        @keyframes lcHead { 0%,100%{ transform: rotate(-4deg) } 50%{ transform: rotate(6deg) } }
      `}</style>
      <g transform={`translate(60 65) scale(${scale}) translate(-60 -60)`}>
        <ellipse cx="60" cy="80" rx="28" ry="20" fill="#f4c186" />
        <g style={{ animation: "lcTail 1.2s ease-in-out infinite", transformOrigin: "85px 80px" }}>
          <path
            d="M85 80 Q108 70 102 50"
            stroke="#f4c186"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <g style={{ animation: "lcHead 1.6s ease-in-out infinite", transformOrigin: "60px 55px" }}>
          <ellipse cx="60" cy="55" rx="22" ry="20" fill="#f4c186" />
          <path d="M42 40 L38 22 L54 36 Z" fill="#f4c186" />
          <path d="M78 40 L82 22 L66 36 Z" fill="#f4c186" />
          <ellipse cx="52" cy="55" rx="2" ry="3" fill="#3a2a2a" />
          <ellipse cx="68" cy="55" rx="2" ry="3" fill="#3a2a2a" />
          <path d="M57 62 L63 62 L60 66 Z" fill="#ff8fa3" />
          <path
            d="M55 68 Q60 72 65 68"
            stroke="#3a2a2a"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}