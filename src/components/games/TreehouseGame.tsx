import { useState } from "react";
import { GameDefs, Pedestal, Sparkles, FX_KEYFRAMES, Burst, useBurstOnIncrease } from "./fx";

interface Props {
  stage: number;
  health: number;
}

// Treehouse builds up plank by plank across 31 stages.
// 0-1 = resources, 2-6 = platform, 7-14 = walls growing, 15-20 = roof,
// 21-24 = window + door, 25-28 = ladder, 29-31 = flag and lanterns.
export function TreehouseGame({ stage, health }: Props) {
  const MAX = 31;
  const s = Math.min(MAX, Math.max(0, stage));
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

  const levelUp = useBurstOnIncrease(s);
  const [poke, setPoke] = useState(0);
  const react = () => setPoke((p) => p + 1);

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none"
      role="button"
      tabIndex={0}
      aria-label={`Treehouse companion, stage ${s} of ${MAX}. Tap to give it a knock.`}
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
        @keyframes leafToss { 0%,100%{ transform: rotate(-4deg) } 50%{ transform: rotate(5deg) } }
        @keyframes flagWave { 0%,100%{ transform: skewX(0) } 50%{ transform: skewX(-10deg) } }
        @keyframes rainDrop { 0%{ transform: translateY(-6px); opacity: 0 } 30%{ opacity: 0.9 } 100%{ transform: translateY(40px); opacity: 0 } }
        @keyframes cloudDrift { 0%,100%{ transform: translateX(0) } 50%{ transform: translateX(6px) } }
        @keyframes lanternGlow { 0%,100%{ opacity: 0.8 } 50%{ opacity: 1 } }
        ${FX_KEYFRAMES}
      `}</style>

      <svg viewBox="0 0 320 320" className="w-full h-full">
        <GameDefs id="th" />
        <defs>
          <linearGradient id="th-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={damaged ? "#8fa3b8" : "#bfe3f7"} />
            <stop offset="55%" stopColor={damaged ? "#b3bfcc" : "#e4f2f0"} />
            <stop offset="100%" stopColor={damaged ? "#c6cfda" : "#f9ecd0"} />
          </linearGradient>
          <linearGradient id="th-ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#9ccb77" />
            <stop offset="100%" stopColor="#54893c" />
          </linearGradient>
          <linearGradient id="th-wood" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d99c60" />
            <stop offset="100%" stopColor="#8b5a30" />
          </linearGradient>
        </defs>

        <rect width="320" height="320" rx="24" fill="url(#th-sky)" />
        {!damaged && <Sparkles count={9} tint="#fff2c4" />}

        {/* sun */}
        {!damaged && (
          <g>
            <circle cx="52" cy="52" r="26" fill="#ffe6a8" opacity="0.45" filter="url(#th-glow)" />
            <circle cx="52" cy="52" r="18" fill="#ffd98a" />
          </g>
        )}

        {/* rain clouds when damaged */}
        {damaged && (
          <g style={{ animation: "cloudDrift 4s ease-in-out infinite" }}>
            <ellipse cx="90" cy="50" rx="34" ry="12" fill={critical ? "#8e9aa8" : "#e6ecf2"} />
            <ellipse cx="210" cy="42" rx="40" ry="13" fill={critical ? "#8e9aa8" : "#e6ecf2"} />
            {Array.from({ length: critical ? 14 : 8 }).map((_, i) => (
              <line
                key={i}
                x1={60 + i * 16}
                y1={70}
                x2={58 + i * 16}
                y2={critical ? 110 : 90}
                stroke={critical ? "#4a7ba8" : "#6ea9d8"}
                strokeWidth={critical ? 2 : 1.6}
                strokeLinecap="round"
                style={{
                  animation: `rainDrop ${critical ? 0.7 : 1.2}s ease-in ${i * 0.1}s infinite`,
                }}
              />
            ))}
          </g>
        )}

        {/* ground */}
        <rect x="0" y="250" width="320" height="70" fill="url(#th-ground)" />
        <Pedestal id="th" cy={276} rx={104} />
        <rect width="320" height="320" rx="24" fill="url(#th-vignette)" />

        <path d="M0 255 Q80 250 160 255 T320 254 L320 260 L0 260 Z" fill="#a4d982" opacity="0.6" />

        {/* The whole structure gives a happy little bounce on tap. */}
        <g
          key={`poke-${poke}`}
          style={
            poke
              ? { animation: "pokeBounce 0.5s ease-out", transformOrigin: "160px 250px" }
              : undefined
          }
        >
          {/* Big tree */}
          <g>
            {/* trunk */}
            <path
              d="M150 250 L150 130 Q152 120 158 118 Q168 120 170 130 L170 250 Z"
              fill="#7a4a20"
            />
            <path d="M154 245 L154 140" stroke="#4a2d13" strokeWidth="2" opacity="0.5" />
            {/* branches */}
            <path
              d="M160 170 Q120 160 96 150"
              stroke="#7a4a20"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M160 160 Q210 150 236 138"
              stroke="#7a4a20"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            {/* canopy */}
            <g
              style={{
                animation: `${critical ? "leafToss" : "leafSway3"} ${critical ? "1.4s" : "3.6s"} ease-in-out infinite`,
                transformOrigin: "160px 100px",
              }}
            >
              <circle cx="160" cy="100" r="60" fill="#4ea36b" />
              <circle cx="112" cy="120" r="34" fill="#7bc48a" />
              <circle cx="210" cy="120" r="34" fill="#7bc48a" />
              <circle cx="160" cy="66" r="30" fill="#7bc48a" />
            </g>
          </g>

          {/* Platform (sits on the two branches) */}
          {platform && (
            <g>
              <rect x="96" y="176" width="132" height="10" fill="url(#th-wood)" />
              <rect
                x="96"
                y="176"
                width="132"
                height="10"
                fill="none"
                stroke="#5c3818"
                strokeWidth="1"
              />
              {/* railing/supports */}
              <line x1="104" y1="186" x2="100" y2="200" stroke="#7a4a20" strokeWidth="3" />
              <line x1="220" y1="186" x2="224" y2="200" stroke="#7a4a20" strokeWidth="3" />
            </g>
          )}

          {/* Walls grow up */}
          {walls && (
            <g>
              <rect x="108" y={176 - wallH} width="112" height={wallH} fill="#d29a63" />
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
                  <path
                    d="M118 170 L128 176 L138 168 L146 176"
                    stroke="#5c3818"
                    strokeWidth="2"
                    fill="none"
                  />
                  <line
                    x1="118"
                    y1="170"
                    x2="146"
                    y2="176"
                    stroke="#8b5a30"
                    strokeWidth="6"
                    opacity="0.4"
                  />
                </g>
              )}
            </g>
          )}

          {/* Roof */}
          {roof && (
            <g>
              <path d="M100 138 L164 108 L228 138 L108 138 Z" fill="#a44a3a" />
              <path d="M100 138 L164 108 L228 138" stroke="#5a2418" strokeWidth="1.5" fill="none" />
              <rect x="108" y="138" width="112" height="6" fill="#7a2d20" />
            </g>
          )}

          {/* Window */}
          {windowOn && (
            <g>
              <rect x="124" y="152" width="18" height="18" fill="#f7d97a" />
              <rect
                x="124"
                y="152"
                width="18"
                height="18"
                fill="none"
                stroke="#5c3818"
                strokeWidth="1.5"
              />
              <line x1="133" y1="152" x2="133" y2="170" stroke="#5c3818" strokeWidth="1" />
              <line x1="124" y1="161" x2="142" y2="161" stroke="#5c3818" strokeWidth="1" />
            </g>
          )}

          {/* Door */}
          {door && (
            <g>
              <rect x="182" y="150" width="20" height="26" fill="#6a3a1a" />
              <rect
                x="182"
                y="150"
                width="20"
                height="26"
                fill="none"
                stroke="#3a1e0a"
                strokeWidth="1"
              />
              <circle cx="198" cy="164" r="1.4" fill="#f7d97a" />
            </g>
          )}

          {/* Ladder from ground to platform */}
          {ladder && (
            <g stroke="#7a4a20" strokeWidth="2.5" strokeLinecap="round">
              <line x1="196" y1="250" x2="196" y2="186" />
              <line x1="210" y1="250" x2="210" y2="186" />
              {Array.from({ length: 6 }).map((_, i) => (
                <line key={i} x1="196" y1={244 - i * 11} x2="210" y2={244 - i * 11} />
              ))}
            </g>
          )}

          {/* Flag on top */}
          {flag && (
            <g>
              <line x1="164" y1="108" x2="164" y2="86" stroke="#3a2416" strokeWidth="2" />
              <g
                style={{
                  animation: "flagWave 1.6s ease-in-out infinite",
                  transformOrigin: "164px 90px",
                }}
              >
                <path d="M164 88 L184 92 L164 98 Z" fill="#e04b4b" />
              </g>
            </g>
          )}

          {/* Lantern at final stage */}
          {lantern && (
            <g style={{ animation: "lanternGlow 2.2s ease-in-out infinite" }}>
              <line x1="220" y1="140" x2="220" y2="152" stroke="#3a2416" strokeWidth="1.5" />
              <rect x="214" y="152" width="12" height="14" rx="2" fill="#f7d97a" />
              <circle cx="220" cy="159" r="3" fill="#fff5c2" />
            </g>
          )}

          {/* Resources pile on the ground (early stages) */}
          {showResources && (
            <g>
              <rect
                x="40"
                y="238"
                width="46"
                height="6"
                fill="url(#th-wood)"
                transform="rotate(-8 40 238)"
              />
              <rect
                x="46"
                y="230"
                width="42"
                height="6"
                fill="url(#th-wood)"
                transform="rotate(4 46 230)"
              />
              <rect
                x="42"
                y="222"
                width="38"
                height="6"
                fill="url(#th-wood)"
                transform="rotate(-3 42 222)"
              />
              {/* saw */}
              <path d="M96 240 L120 240 L118 234 L98 234 Z" fill="#c9c9d4" />
              <rect x="118" y="234" width="10" height="8" rx="2" fill="#7a4a20" />
              {/* nails */}
              <circle cx="132" cy="242" r="1.5" fill="#6b6b78" />
              <circle cx="138" cy="242" r="1.5" fill="#6b6b78" />
              <circle cx="144" cy="242" r="1.5" fill="#6b6b78" />
            </g>
          )}
        </g>

        {damaged && (
          <g style={critical ? { animation: "warnBlink 0.8s ease-in-out infinite" } : undefined}>
            <rect x="12" y="12" width="128" height="22" rx="11" fill="#000" opacity="0.4" />
            <text x="76" y="27" textAnchor="middle" fontSize="11" fill="#ffb3a0">
              {critical ? "⚠ Heavy storm" : "⚠ Storm damage"}
            </text>
          </g>
        )}

        {levelUp > 0 && (
          <Burst
            key={levelUp}
            trigger={levelUp}
            cx={164}
            cy={150}
            colors={["#d99c60", "#ffd76a", "#7bc48a", "#fff5c2"]}
          />
        )}
        {poke > 0 && <Burst key={`poke-burst-${poke}`} trigger={poke} cx={198} cy={163} />}
      </svg>
    </div>
  );
}