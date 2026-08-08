import { useEffect, useRef, useState } from "react";

interface Props {
  stage: number;
}

type CatAction = "running" | "licking" | "upside_down";

export function JournalCat({ stage }: Props) {
  const [target, setTarget] = useState<{ x: number; y: number; flip: boolean; action: CatAction }>(
    () => ({ x: 40, y: 120, flip: false, action: "running" })
  );
  const prev = useRef({ x: 40, y: 120 });

  useEffect(() => {
    function pick() {
      const w = typeof window !== "undefined" ? window.innerWidth : 400;
      const h = typeof window !== "undefined" ? window.innerHeight : 700;
      
      const rand = Math.random();
      let nextAction: CatAction = "running";
      
      // 50% chance to run, 25% to stop and lick, 25% to roll upside down
      if (rand < 0.25) nextAction = "licking";
      else if (rand < 0.5) nextAction = "upside_down";

      if (nextAction === "running") {
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
        setTarget({ x, y, flip, action: nextAction });
      } else {
        // If stopping, just stay in the same spot, maybe flip around randomly
        setTarget(t => ({ ...t, flip: Math.random() > 0.5, action: nextAction }));
      }
    }
    
    pick();
    const id = setInterval(pick, 4200);
    return () => clearInterval(id);
  }, []);

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
        
        @keyframes pawLick { 0%,100%{ transform: rotate(0) } 50%{ transform: rotate(-15deg) } }
        @keyframes headLick { 0%,100%{ transform: rotate(0) } 50%{ transform: rotate(-5deg) translate(-1px, 2px) } }
        
        @keyframes tailTwitch { 0%,100%{ transform: rotate(0) } 50%{ transform: rotate(15deg) } }
        @keyframes pawBat { 0%{ transform: rotate(0) } 100%{ transform: rotate(15deg) } }
        
        @keyframes yarnRoll2 { 0%{ transform: translate(-16px, 4px) rotate(0deg) } 50%{ transform: translate(-24px, -2px) rotate(180deg) } 100%{ transform: translate(-16px, 4px) rotate(360deg) } }
        @keyframes yarnBat { 0%{ transform: translateY(0) rotate(0deg) } 100%{ transform: translateY(-8px) rotate(20deg) } }
      `}</style>
      <div
        className="relative w-full h-full"
        style={{ transform: target.flip ? "scaleX(-1)" : "none" }}
      >
        <YarnBall action={target.action} />
        <div className="absolute inset-0" style={{ animation: target.action === "running" ? "catRun 0.5s ease-in-out infinite" : "none" }}>
          {target.action === "running" && <CatRunning />}
          {target.action === "licking" && <CatLicking />}
          {target.action === "upside_down" && <CatUpsideDown />}
        </div>
      </div>
    </div>
  );
}

function YarnBall({ action }: { action: CatAction }) {
  let containerClass = "absolute w-4 h-4 ";
  let anim = "none";
  
  if (action === "running") {
    containerClass += "bottom-1 left-0";
    anim = "yarnRoll2 0.9s ease-in-out infinite";
  } else if (action === "licking") {
    containerClass += "bottom-2 left-2";
  } else if (action === "upside_down") {
    containerClass += "top-6 left-12";
    anim = "yarnBat 0.6s ease-in-out infinite alternate";
  }

  return (
    <div className={containerClass} style={{ animation: anim }}>
      <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-sm">
        <circle cx="20" cy="20" r="15" fill="#f6a5c0" />
        <path d="M6 20 Q20 6 34 20" stroke="#c76a92" strokeWidth="1.4" fill="none" />
        <path d="M6 20 Q20 34 34 20" stroke="#c76a92" strokeWidth="1.4" fill="none" />
        <path d="M8 12 Q20 20 32 28" stroke="#c76a92" strokeWidth="1.2" fill="none" />
      </svg>
    </div>
  );
}

function CatRunning() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
      <defs>
        <radialGradient id="body-shade" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffe0b3" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f6c48b" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Base Body */}
      <ellipse cx="62" cy="86" rx="30" ry="20" fill="#f6c48b" />
      <ellipse cx="62" cy="86" rx="30" ry="20" fill="url(#body-shade)" />
      
      {/* Back Stripes */}
      <path d="M 50 70 L 50 78 M 60 67 L 60 75 M 70 70 L 70 78" stroke="#e8a763" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      
      {/* Legs */}
      <ellipse cx="46" cy="103" rx="6" ry="4" fill="#e8a763" />
      <ellipse cx="78" cy="103" rx="6" ry="4" fill="#e8a763" />
      
      {/* Tail */}
      <g style={{ animation: "catTail3 0.8s ease-in-out infinite", transformOrigin: "88px 85px" }}>
        <path d="M88 85 Q108 76 100 58" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M100 58 Q104 54 100 50" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
      
      {/* Head */}
      <g style={{ transformOrigin: "62px 58px" }}>
        <ellipse cx="62" cy="58" rx="26" ry="24" fill="#f6c48b" />
        {/* Head stripes */}
        <path d="M 62 40 L 62 48 M 55 42 L 57 48 M 69 42 L 67 48" stroke="#e8a763" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        {/* Ears */}
        <path d="M40 44 L36 22 L54 38 Z" fill="#f6c48b" />
        <path d="M84 44 L88 22 L70 38 Z" fill="#f6c48b" />
        <path d="M42 40 L40 30 L48 38 Z" fill="#f2a3b5" />
        <path d="M82 40 L84 30 L76 38 Z" fill="#f2a3b5" />
        {/* Blush */}
        <circle cx="48" cy="66" r="5" fill="#ffb3c1" opacity="0.55" />
        <circle cx="76" cy="66" r="5" fill="#ffb3c1" opacity="0.55" />
        {/* Eyes */}
        <g style={{ animation: "catBlink3 4.2s ease-in-out infinite", transformOrigin: "62px 58px" }}>
          <ellipse cx="52" cy="58" rx="3.2" ry="4.6" fill="#2a1e1a" />
          <ellipse cx="72" cy="58" rx="3.2" ry="4.6" fill="#2a1e1a" />
          <circle cx="53.2" cy="56.4" r="1" fill="#fff" />
          <circle cx="73.2" cy="56.4" r="1" fill="#fff" />
        </g>
        {/* Nose/Mouth */}
        <path d="M60 66 L64 66 L62 69 Z" fill="#ff8fa3" />
        <path d="M62 69 Q58 73 55 71" stroke="#3a2a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M62 69 Q66 73 69 71" stroke="#3a2a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {/* Whiskers */}
        <line x1="36" y1="66" x2="48" y2="67" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="34" y1="70" x2="48" y2="70" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="88" y1="66" x2="76" y2="67" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="90" y1="70" x2="76" y2="70" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
      </g>
    </svg>
  );
}

function CatLicking() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
      {/* Sitting body */}
      <ellipse cx="62" cy="80" rx="28" ry="24" fill="#f6c48b" />
      <ellipse cx="62" cy="80" rx="28" ry="24" fill="#ffe0b3" opacity="0.5" />
      
      {/* Back leg tucked in */}
      <path d="M 80 95 Q 90 95 90 85 Q 90 75 75 75" stroke="#e8a763" strokeWidth="2" fill="none" opacity="0.5" />

      {/* Tail wrapped around front */}
      <path d="M 85 90 Q 100 105 70 102 Q 40 100 35 105" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 40 104 Q 35 105 32 105" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" />

      {/* Raised Paw (animates) */}
      <g style={{ animation: "pawLick 0.6s ease-in-out infinite alternate", transformOrigin: "65px 75px" }}>
        <path d="M 65 75 Q 40 65 40 55" stroke="#f6c48b" strokeWidth="9" fill="none" strokeLinecap="round" />
        <circle cx="40" cy="55" r="4.5" fill="#f6c48b" />
        {/* Toe beans */}
        <circle cx="38" cy="53" r="1.5" fill="#ffb3c1" />
        <circle cx="42" cy="52" r="1.5" fill="#ffb3c1" />
      </g>

      {/* Head tucked down and licking */}
      <g style={{ animation: "headLick 0.6s ease-in-out infinite alternate", transformOrigin: "60px 50px" }}>
        <g transform="translate(60, 50) rotate(-25)">
          <ellipse cx="0" cy="0" rx="24" ry="22" fill="#f6c48b" />
          {/* Ears */}
          <path d="M -18 -10 L -24 -28 L -4 -18 Z" fill="#f6c48b" />
          <path d="M 6 -18 L 24 -28 L 18 -10 Z" fill="#f6c48b" />
          <path d="M -16 -12 L -21 -24 L -7 -16 Z" fill="#f2a3b5" />
          <path d="M 8 -16 L 21 -24 L 16 -12 Z" fill="#f2a3b5" />
          {/* Closed happy eyes */}
          <path d="M -12 2 Q -8 6 -4 2" fill="none" stroke="#2a1e1a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 4 2 Q 8 6 12 2" fill="none" stroke="#2a1e1a" strokeWidth="1.5" strokeLinecap="round" />
          {/* Nose */}
          <path d="M -2 9 L 2 9 L 0 11 Z" fill="#ff8fa3" />
          {/* Tongue extending out */}
          <path d="M 0 11 Q -5 18 -12 18" stroke="#ff8fa3" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Whiskers */}
          <line x1="-24" y1="4" x2="-14" y2="6" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
          <line x1="-24" y1="8" x2="-14" y2="8" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
          <line x1="24" y1="4" x2="14" y2="6" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
          <line x1="24" y1="8" x2="14" y2="8" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        </g>
      </g>
    </svg>
  );
}

function CatUpsideDown() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
      {/* Tail swishing */}
      <g style={{ animation: "tailTwitch 2s ease-in-out infinite alternate", transformOrigin: "85px 85px" }}>
        <path d="M 85 85 Q 105 95 100 110" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M 101 105 Q 100 110 100 110" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>

      {/* Body on back */}
      <ellipse cx="62" cy="85" rx="32" ry="18" fill="#f6c48b" />
      <ellipse cx="62" cy="82" rx="20" ry="10" fill="#ffe0b3" opacity="0.8" />

      {/* Head on the left, rotated slightly */}
      <g transform="translate(35, 80) rotate(-70)">
        <ellipse cx="0" cy="0" rx="24" ry="22" fill="#f6c48b" />
        <path d="M -18 -10 L -24 -28 L -4 -18 Z" fill="#f6c48b" />
        <path d="M 6 -18 L 24 -28 L 18 -10 Z" fill="#f6c48b" />
        <path d="M -16 -12 L -21 -24 L -7 -16 Z" fill="#f2a3b5" />
        <path d="M 8 -16 L 21 -24 L 16 -12 Z" fill="#f2a3b5" />
        {/* Big play eyes */}
        <ellipse cx="-10" cy="0" rx="5" ry="6" fill="#2a1e1a" />
        <ellipse cx="10" cy="0" rx="5" ry="6" fill="#2a1e1a" />
        <circle cx="-11" cy="-2" r="2" fill="#fff" />
        <circle cx="9" cy="-2" r="2" fill="#fff" />
        <circle cx="-8" cy="2" r="0.8" fill="#fff" />
        <circle cx="12" cy="2" r="0.8" fill="#fff" />
        {/* Nose/mouth upside down */}
        <path d="M -2 -8 L 2 -8 L 0 -10 Z" fill="#ff8fa3" />
        <path d="M 0 -10 Q -4 -14 -6 -12" stroke="#3a2a2a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M 0 -10 Q 4 -14 6 -12" stroke="#3a2a2a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* Whiskers */}
        <line x1="-26" y1="-2" x2="-16" y2="0" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="-25" y1="4" x2="-15" y2="2" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="26" y1="-2" x2="16" y2="0" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="25" y1="4" x2="15" y2="2" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
      </g>

      {/* Hind Legs */}
      <path d="M 85 80 Q 80 65 95 55" stroke="#f6c48b" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M 70 85 Q 75 60 82 50" stroke="#f6c48b" strokeWidth="10" fill="none" strokeLinecap="round" />
      
      {/* Front Legs (Batting) */}
      <g style={{ animation: "pawBat 0.4s ease-in-out infinite alternate", transformOrigin: "50px 80px" }}>
        <path d="M 50 80 Q 45 60 55 45" stroke="#f6c48b" strokeWidth="9" fill="none" strokeLinecap="round" />
        <circle cx="53" cy="45" r="1.5" fill="#ffb3c1" />
        <circle cx="56" cy="47" r="1.5" fill="#ffb3c1" />
      </g>
      <g style={{ animation: "pawBat 0.4s 0.2s ease-in-out infinite alternate", transformOrigin: "60px 80px" }}>
        <path d="M 60 80 Q 65 60 70 42" stroke="#f6c48b" strokeWidth="9" fill="none" strokeLinecap="round" />
        <circle cx="68" cy="42" r="1.5" fill="#ffb3c1" />
        <circle cx="71" cy="44" r="1.5" fill="#ffb3c1" />
      </g>
    </svg>
