import { useEffect, useRef, useState } from "react";

interface Props {
  stage: number;
}

// Small cat that runs around the screen chasing a yarn ball.
export function JournalCat({ stage }: Props) {
  const [target, setTarget] = useState<{ x: number; y: number; flip: boolean }>(
    () => ({ x: 40, y: 120, flip: false }),
  );
  const prev = useRef({ x: 40, y: 120 });

  useEffect(() => {
    function pick() {
      const w = typeof window !== "undefined" ? window.innerWidth : 400;
      const h = typeof window !== "undefined" ? window.innerHeight : 700;
      let x = 0;
      let y = 0;
      for (let i = 0; i < 20; i++) {
        x = 20 + Math.random() * (w - 100);
        y = 60 + Math.random() * (h - 180);
        const cx = w / 2;
        const cy = h / 2;
        const inCenter = Math.abs(x - cx) < w * 0.22 && Math.abs(y - cy) < h * 0.2;
        if (!inCenter) break;
      }
      const flip = x < prev.current.x;
      prev.current = { x, y };
      setTarget({ x, y, flip });
    }
    pick();
    const id = setInterval(pick, 4200);
    return () => clearInterval(id);
  }, []);

  // Base size shrunk ~25% from prior (92 -> 68), + light growth with stage.
  const size = 68 + Math.min(5, Math.floor(stage / 2)) * 3;

  return (
    <div
      className="pointer-events-none fixed z-30 top-0 left-0"
      style={{
        width: size,
        height: size,
        transform: `translate3d(${target.x}px, ${target.y}px, 0)`,
        transition: "transform 4s cubic-bezier(0.45, 0.05, 0.55, 0.95)",
      }}
    >
      <style>{`
        @keyframes catRun { 0%,100%{ transform: translateY(0) } 25%{ transform: translateY(-3px) rotate(-2deg) } 75%{ transform: translateY(-3px) rotate(2deg) } }
        @keyframes catTail3 { 0%,100%{ transform: rotate(-8deg) } 50%{ transform: rotate(22deg) } }
        @keyframes catBlink3 { 0%,92%,100%{ transform: scaleY(1) } 95%{ transform: scaleY(0.1) } }
        @keyframes yarnRoll2 { 0%{ transform: translate(-16px, 4px) rotate(0deg) } 50%{ transform: translate(-24px, -2px) rotate(180deg) } 100%{ transform: translate(-16px, 4px) rotate(360deg) } }
      `}</style>
      <div
        className="relative w-full h-full"
        style={{ transform: target.flip ? "scaleX(-1)" : "none" }}
      >
        {/* yarn ball rolls ahead */}
        <div
          className="absolute bottom-1 left-0 w-4 h-4"
          style={{ animation: "yarnRoll2 0.9s ease-in-out infinite" }}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-sm">
            <circle cx="20" cy="20" r="15" fill="#f6a5c0" />
            <path d="M6 20 Q20 6 34 20" stroke="#c76a92" strokeWidth="1.4" fill="none" />
            <path d="M6 20 Q20 34 34 20" stroke="#c76a92" strokeWidth="1.4" fill="none" />
            <path d="M8 12 Q20 20 32 28" stroke="#c76a92" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
        <div className="absolute inset-0" style={{ animation: "catRun 0.5s ease-in-out infinite" }}>
          <CuteCat />
        </div>
      </div>
    </div>
  );
}

function CuteCat() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
      <ellipse cx="62" cy="86" rx="30" ry="20" fill="#f6c48b" />
      <ellipse cx="62" cy="86" rx="30" ry="20" fill="url(#body-shade)" />
      <defs>
        <radialGradient id="body-shade" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffe0b3" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f6c48b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="46" cy="103" rx="6" ry="4" fill="#e8a763" />
      <ellipse cx="78" cy="103" rx="6" ry="4" fill="#e8a763" />
      <g style={{ animation: "catTail3 0.8s ease-in-out infinite", transformOrigin: "88px 85px" }}>
        <path d="M88 85 Q108 76 100 58" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M100 58 Q104 54 100 50" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
      <g style={{ transformOrigin: "62px 58px" }}>
        <ellipse cx="62" cy="58" rx="26" ry="24" fill="#f6c48b" />
        <path d="M40 44 L36 22 L54 38 Z" fill="#f6c48b" />
        <path d="M84 44 L88 22 L70 38 Z" fill="#f6c48b" />
        <path d="M42 40 L40 30 L48 38 Z" fill="#f2a3b5" />
        <path d="M82 40 L84 30 L76 38 Z" fill="#f2a3b5" />
        <circle cx="48" cy="66" r="5" fill="#ffb3c1" opacity="0.55" />
        <circle cx="76" cy="66" r="5" fill="#ffb3c1" opacity="0.55" />
        <g style={{ animation: "catBlink3 4.2s ease-in-out infinite", transformOrigin: "62px 58px" }}>
          <ellipse cx="52" cy="58" rx="3.2" ry="4.6" fill="#2a1e1a" />
          <ellipse cx="72" cy="58" rx="3.2" ry="4.6" fill="#2a1e1a" />
          <circle cx="53.2" cy="56.4" r="1" fill="#fff" />
          <circle cx="73.2" cy="56.4" r="1" fill="#fff" />
        </g>
        <path d="M60 66 L64 66 L62 69 Z" fill="#ff8fa3" />
        <path d="M62 69 Q58 73 55 71" stroke="#3a2a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M62 69 Q66 73 69 71" stroke="#3a2a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <line x1="36" y1="66" x2="48" y2="67" stroke="#7a5b3a" strokeWidth="1" />
        <line x1="36" y1="70" x2="48" y2="70" stroke="#7a5b3a" strokeWidth="1" />
        <line x1="88" y1="66" x2="76" y2="67" stroke="#7a5b3a" strokeWidth="1" />
        <line x1="88" y1="70" x2="76" y2="70" stroke="#7a5b3a" strokeWidth="1" />
      </g>
    </svg>
  );
}
