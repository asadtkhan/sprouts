// Shared visual flourishes for the game scenes: soft glows, iridescent
// pedestals and floating sparkles — keeps every world in the same
// glassy, pastel key.

export function GameDefs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#3a2a5a" floodOpacity="0.18" />
      </filter>
      <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="7" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id={`${id}-holo`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#bde7ff" />
        <stop offset="35%" stopColor="#e3d0ff" />
        <stop offset="70%" stopColor="#ffd6e8" />
        <stop offset="100%" stopColor="#d3f5e3" />
      </linearGradient>
      <radialGradient id={`${id}-vignette`} cx="50%" cy="45%" r="75%">
        <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="100%" stopColor="#2a2050" stopOpacity="0.16" />
      </radialGradient>
      <linearGradient id={`${id}-sheen`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  );
}

/** Iridescent isometric plate the subject stands on. */
export function Pedestal({ id, cx = 160, cy = 268, rx = 104 }: { id: string; cx?: number; cy?: number; rx?: number }) {
  return (
    <g opacity="0.9">
      <ellipse cx={cx} cy={cy + 8} rx={rx} ry={rx * 0.2} fill="#2a2050" opacity="0.12" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.22} fill={`url(#${id}-holo)`} />
      <ellipse cx={cx} cy={cy - 4} rx={rx * 0.88} ry={rx * 0.17} fill="#ffffff" opacity="0.45" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.22} fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
    </g>
  );
}

/** Drifting sparkles/bokeh. Deterministic so SSR and client agree. */
export function Sparkles({ count = 10, tint = "#ffffff" }: { count?: number; tint?: string }) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = ((i * 71) % 280) + 20;
        const y = ((i * 47) % 200) + 20;
        const r = i % 3 === 0 ? 2.6 : 1.5;
        return (
          <g key={i} style={{ animation: `fxTwinkle ${2.4 + (i % 4) * 0.6}s ease-in-out ${i * 0.23}s infinite` }}>
            <circle cx={x} cy={y} r={r} fill={tint} opacity="0.75" />
            {i % 4 === 0 && (
              <path
                d={`M${x} ${y - r * 3} L${x + r} ${y} L${x} ${y + r * 3} L${x - r} ${y} Z`}
                fill={tint}
                opacity="0.5"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

export const FX_KEYFRAMES = `
  @keyframes fxTwinkle { 0%,100%{ opacity: 0.25; transform: scale(0.85) } 50%{ opacity: 1; transform: scale(1.15) } }
  @keyframes fxFloat { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-5px) } }
`;
