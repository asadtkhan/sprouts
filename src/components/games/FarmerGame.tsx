import { useState } from "react";
import { Burst } from "./fx";

interface Props {
  fruits: number;
  elapsedMs: number;
  running: boolean;
}

// Farmer stands on a ladder under a tree, plucks a fruit, drops it in the basket.
export function FarmerGame({ fruits, elapsedMs, running }: Props) {
  const [poke, setPoke] = useState(0);
  const cheer = () => setPoke((p) => p + 1);

  const treePositions: [number, number][] = [
    [110, 90],
    [140, 80],
    [170, 85],
    [200, 95],
    [225, 110],
    [95, 115],
    [125, 105],
    [155, 115],
    [185, 110],
    [215, 130],
    [140, 135],
    [175, 130],
  ];
  const remaining = Math.max(0, treePositions.length - fruits);
  const visibleOnTree = treePositions.slice(0, remaining);
  const basketFruits = Math.min(fruits, 24);

  const secs = Math.floor((elapsedMs / 1000) % 60);
  const mins = Math.floor(elapsedMs / 60000);
  const nextFruitIn = 60 - secs;

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none"
      role="button"
      tabIndex={0}
      aria-label="Farmer companion. Tap to cheer them on."
      onClick={cheer}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cheer();
        }
      }}
    >
      <style>{`
        @keyframes farmerReach { 0%,100%{ transform: translateY(0) } 25%{ transform: translateY(-2px) } 50%{ transform: translateY(0) } }
        @keyframes armPluck { 0%,55%,100%{ transform: rotate(-30deg) } 65%{ transform: rotate(-70deg) } 80%{ transform: rotate(30deg) } }
        @keyframes fruitDrop {
          0%,55%{ transform: translate(0,0); opacity: 0 }
          60%{ opacity: 1; transform: translate(0,0) }
          85%{ transform: translate(24px, 60px); opacity: 1 }
          100%{ transform: translate(24px, 60px); opacity: 0 }
        }
        @keyframes leafSway { 0%,100%{ transform: rotate(-1deg) } 50%{ transform: rotate(1.5deg) } }
        @keyframes farmerCheer { 0%,100%{ transform: rotate(0) } 25%{ transform: rotate(-8deg) } 75%{ transform: rotate(8deg) } }
      `}</style>
      <svg viewBox="0 0 320 320" className="w-full h-full">
        <defs>
          <linearGradient id="farmSky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fef1c7" />
            <stop offset="100%" stopColor="#c7ebc4" />
          </linearGradient>
          <linearGradient id="farmGround" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8bbd6a" />
            <stop offset="100%" stopColor="#5c8f42" />
          </linearGradient>
        </defs>

        <rect width="320" height="320" rx="24" fill="url(#farmSky)" />
        <circle cx="60" cy="60" r="22" fill="#ffd98a" />
        <ellipse cx="230" cy="50" rx="26" ry="9" fill="#fff" opacity="0.85" />
        <ellipse cx="255" cy="45" rx="18" ry="7" fill="#fff" opacity="0.85" />

        <rect x="0" y="240" width="320" height="80" fill="url(#farmGround)" />
        <path d="M0 245 Q80 240 160 246 T320 244 L320 250 L0 250 Z" fill="#a4d982" opacity="0.6" />

        {/* Tree (leaves sway) */}
        <g>
          <path d="M170 240 L170 160" stroke="#8b5a3c" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M170 200 Q150 190 138 175"
            stroke="#8b5a3c"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M170 210 Q195 200 208 185"
            stroke="#8b5a3c"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <g
            style={{
              animation: "leafSway 3.4s ease-in-out infinite",
              transformOrigin: "170px 130px",
            }}
          >
            <circle cx="160" cy="120" r="52" fill="#4ea36b" />
            <circle cx="125" cy="135" r="30" fill="#7bc48a" />
            <circle cx="205" cy="135" r="30" fill="#7bc48a" />
            <circle cx="160" cy="85" r="26" fill="#7bc48a" />
            {visibleOnTree.map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="#e04b4b" />
                <circle cx={x - 1.5} cy={y - 1.5} r="1.5" fill="#ff9a9a" />
                <path d={`M${x} ${y - 5} l1 -3`} stroke="#3a5c2b" strokeWidth="1.2" />
              </g>
            ))}
          </g>
        </g>

        {/* Ladder */}
        <g stroke="#7a4a20" strokeWidth="3" strokeLinecap="round">
          <line x1="212" y1="240" x2="222" y2="160" />
          <line x1="240" y1="240" x2="250" y2="160" />
          <line x1="215" y1="220" x2="245" y2="220" />
          <line x1="217" y1="200" x2="247" y2="220" fill="none" />
          <line x1="217" y1="200" x2="247" y2="200" />
          <line x1="219" y1="180" x2="249" y2="180" />
        </g>

        {/* Farmer standing on the ladder */}
        <g
          key={`poke-${poke}`}
          style={
            poke
              ? { animation: "farmerCheer 0.6s ease-out", transformOrigin: "228px 188px" }
              : undefined
          }
        >
          {/* 1. Static Positioning Wrapper: This keeps the farmer on the ladder */}
          <g transform="translate(228 188) scale(1.1)">
            {/* 2. Animation Wrapper: This handles the bounce without overriding position */}
            <g style={{ animation: running ? "farmerReach 1.4s ease-in-out infinite" : "none" }}>
              {/* legs on ladder rung */}
              <rect x="-6" y="24" width="5" height="18" fill="#2a4373" />
              <rect x="1" y="24" width="5" height="18" fill="#2a4373" />
              <rect x="-7" y="40" width="7" height="4" rx="1.5" fill="#3a2a1a" />
              <rect x="1" y="40" width="7" height="4" rx="1.5" fill="#3a2a1a" />
              {/* body */}
              <rect x="-10" y="-2" width="20" height="28" rx="5" fill="#3a6cbf" />
              <rect x="-10" y="-2" width="20" height="6" rx="3" fill="#5789d8" />
              {/* free arm holding ladder */}
              <path
                d="M9 4 Q20 10 18 24"
                stroke="#f3c290"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              {/* head */}
              <circle cx="0" cy="-12" r="8" fill="#f3c290" />
              <ellipse cx="0" cy="-18" rx="15" ry="3.5" fill="#e2b970" />
              <ellipse cx="0" cy="-20" rx="7" ry="3.5" fill="#c9a256" />
              <circle cx="-2.5" cy="-13" r="0.9" fill="#3a2a1a" />
              <circle cx="2.5" cy="-13" r="0.9" fill="#3a2a1a" />
              <path
                d="M-2.5 -10 Q0 -8 2.5 -10"
                stroke="#5a3a1a"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
              {/* plucking arm — reaches up into the tree */}
              <g
                style={{
                  animation: running ? "armPluck 3s ease-in-out infinite" : "none",
                  transformOrigin: "-9px 4px",
                }}
              >
                <path
                  d="M-9 4 Q-22 -12 -28 -30"
                  stroke="#f3c290"
                  strokeWidth="4.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx="-28" cy="-30" r="4" fill="#f3c290" />
              </g>
              {/* falling fruit toward basket */}
              {running && (
                <circle
                  cx="-6"
                  cy="-8"
                  r="3.5"
                  fill="#e04b4b"
                  style={{ animation: "fruitDrop 3s ease-in infinite" }}
                />
              )}
            </g>
          </g>
        </g>

        {/* Basket */}
        <g transform="translate(258 232)">
          <path d="M-22 0 L22 0 L18 20 L-18 20 Z" fill="#a06a3a" />
          <path d="M-22 0 L22 0 L18 20 L-18 20 Z" fill="none" stroke="#6b421f" strokeWidth="1.5" />
          <line x1="-16" y1="4" x2="-13" y2="18" stroke="#6b421f" strokeWidth="1" />
          <line x1="-6" y1="4" x2="-4" y2="18" stroke="#6b421f" strokeWidth="1" />
          <line x1="4" y1="4" x2="4" y2="18" stroke="#6b421f" strokeWidth="1" />
          <line x1="14" y1="4" x2="12" y2="18" stroke="#6b421f" strokeWidth="1" />
          <ellipse cx="0" cy="0" rx="22" ry="3.5" fill="#c98a5a" />
          {Array.from({ length: basketFruits }).map((_, i) => {
            const col = i % 6;
            const row = Math.floor(i / 6);
            const x = -16 + col * 6;
            const y = -2 - row * 5;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3" fill="#e04b4b" />
                <circle cx={x - 0.8} cy={y - 0.8} r="1" fill="#ff9a9a" />
              </g>
            );
          })}
        </g>

        {/* Fruit count badge */}
        <g>
          <rect x="12" y="12" width="86" height="26" rx="13" fill="#000" opacity="0.35" />
          <text x="24" y="30" fontSize="14" fill="#fff">
            🍎
          </text>
          <text x="44" y="30" fontSize="13" fill="#fff" fontWeight="600">
            {fruits} picked
          </text>
        </g>

        {/* Timer */}
        <g>
          <rect x="210" y="12" width="98" height="26" rx="13" fill="#000" opacity="0.35" />
          <text x="259" y="30" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="600">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            {running ? ` · +1 in ${nextFruitIn}s` : " · paused"}
          </text>
        </g>

        {poke > 0 && (
          <Burst
            key={poke}
            trigger={poke}
            cx={228}
            cy={168}
            colors={["#e04b4b", "#ffd76a", "#7bc48a", "#fff5c2"]}
          />
        )}
      </svg>
    </div>
  );
}