import { useEffect, useRef, useState } from "react";

interface Props {
  stage: number;
}

type CatAction = "running" | "idle" | "licking" | "upside_down" | "tapped";

export function JournalCat({ stage }: Props) {
  const [target, setTarget] = useState<{ x: number; y: number; flip: boolean; action: CatAction }>(
    () => ({ x: 40, y: 120, flip: false, action: "running" })
  );
  const prev = useRef({ x: 40, y: 120 });
  const isTapped = useRef(false);

  useEffect(() => {
    function pick() {
      // Don't interrupt if the user is interacting with the cat
      if (isTapped.current) return;

      const w = typeof window !== "undefined" ? window.innerWidth : 400;
      const h = typeof window !== "undefined" ? window.innerHeight : 700;
      
      const rand = Math.random();
      let nextAction: CatAction = "running";
      
      // 40% chance to run, 20% idle, 20% lick, 20% upside down
      if (rand < 0.2) nextAction = "licking";
      else if (rand < 0.4) nextAction = "upside_down";
      else if (rand < 0.6) nextAction = "idle";

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

        // Exactly when the 2-second travel transition finishes, drop into the "idle" sit
        setTimeout(() => {
          if (!isTapped.current) {
            setTarget(t => t.action === "running" ? { ...t, action: "idle" } : t);
          }
        }, 2000);

      } else {
        // If picking a stationary action, just flip randomly and stay put
        setTarget(t => ({ ...t, flip: Math.random() > 0.5, action: nextAction }));
      }
    }
    
    pick();
    const id = setInterval(pick, 5000); // Make a new decision every 5 seconds
    return () => clearInterval(id);
  }, []);

  const handleTap = () => {
    if (isTapped.current) return;
    
    isTapped.current = true;
    setTarget(t => ({ ...t, action: "tapped" }));
    
    // Return to idle after the reaction animation finishes
    setTimeout(() => {
      isTapped.current = false;
      setTarget(t => t.action === "tapped" ? { ...t, action: "idle" } : t);
    }, 2000);
  };

  const size = 68 + Math.min(5, Math.floor(stage / 2)) * 3;

  return (
    <div
      className="pointer-events-none fixed z-30 top-0 left-0"
      style={{
        width: size,
        height: size,
        transform: `translate3d(${target.x}px, ${target.y}px, 0)`,
        // Fast 2-second dash to the new location
        transition: target.action === "running" ? "transform 2s ease-in-out" : "none",
      }}
    >
      <style>{`
        /* Bouncing body while running */
        @keyframes catRun { 0%,100%{ transform: translateY(0) rotate(-2deg) } 50%{ transform: translateY(-4px) rotate(2deg) } }
        
        /* Fast scrambling legs */
        @keyframes scurryFront { 0%,100%{ transform: translateX(-6px) } 50%{ transform: translateX(6px) } }
        @keyframes scurryBack { 0%,100%{ transform: translateX(6px) } 50%{ transform: translateX(-6px) } }
        
        @keyframes catTail3 { 0%,100%{ transform: rotate(-8deg) } 50%{ transform: rotate(22deg) } }
        @keyframes catBlink3 { 0%,92%,100%{ transform: scaleY(1) } 95%{ transform: scaleY(0.1) } }
        
        @keyframes pawLick { 0%,100%{ transform: rotate(0) } 50%{ transform: rotate(-15deg) } }
        @keyframes headLick { 0%,100%{ transform: rotate(0) } 50%{ transform: rotate(-5deg) translate(-1px, 2px) } }
        
        @keyframes tailTwitch { 0%,100%{ transform: rotate(0) } 50%{ transform: rotate(15deg) } }
        @keyframes pawBat { 0%{ transform: rotate(0) } 100%{ transform: rotate(15deg) } }
        
        @keyframes yarnRollFast { 0%{ transform: translate(-24px, 4px) rotate(0deg) } 50%{ transform: translate(-24px, 0px) rotate(-180deg) } 100%{ transform: translate(-24px, 4px) rotate(-360deg) } }
        @keyframes yarnBat { 0%{ transform: translateY(0) rotate(0deg) } 100%{ transform: translateY(-8px) rotate(20deg) } }
        
        /* Interactive Tap Animations */
        @keyframes catJump { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes floatUp { 0% { transform: translateY(10px); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(-20px); opacity: 0; } }
      `}</style>
      
      <div
        className="relative w-full h-full pointer-events-auto cursor-pointer"
        style={{ transform: target.flip ? "scaleX(-1)" : "none" }}
        onClick={handleTap}
        role="button"
        tabIndex={0}
        aria-label="Pet the cat"
      >
        <YarnBall action={target.action} />
        <div className="absolute inset-0" style={{ animation: target.action === "running" ? "catRun 0.25s ease-in-out infinite" : "none" }}>
          {target.action === "running" && <CatRunning />}
          {target.action === "idle" && <CatIdle />}
          {target.action === "licking" && <CatLicking />}
          {target.action === "upside_down" && <CatUpsideDown />}
          {target.action === "tapped" && <CatTapped />}
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
    anim = "yarnRollFast 0.4s linear infinite";
  } else if (action === "idle" || action === "tapped") {
    containerClass += "bottom-1 left-2";
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

      {/* Back Legs (Darker to show depth, animated) */}
      <ellipse cx="46" cy="100" rx="5" ry="4" fill="#d49352" style={{ animation: "scurryFront 0.2s linear infinite" }} />
      <ellipse cx="78" cy="100" rx="5" ry="4" fill="#d49352" style={{ animation: "scurryBack 0.2s linear infinite" }} />

      {/* Base Body */}
      <ellipse cx="62" cy="86" rx="30" ry="20" fill="#f6c48b" />
      <ellipse cx="62" cy="86" rx="30" ry="20" fill="url(#body-shade)" />
      
      {/* Back Stripes */}
      <path d="M 50 70 L 50 78 M 60 67 L 60 75 M 70 70 L 70 78" stroke="#e8a763" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      
      {/* Front Legs (Lighter, animated opposite to back legs) */}
      <ellipse cx="46" cy="104" rx="6" ry="4" fill="#e8a763" style={{ animation: "scurryBack 0.2s linear infinite" }} />
      <ellipse cx="78" cy="104" rx="6" ry="4" fill="#e8a763" style={{ animation: "scurryFront 0.2s linear infinite" }} />
      
      {/* Tail */}
      <g style={{ animation: "catTail3 0.8s ease-in-out infinite", transformOrigin: "88px 85px" }}>
        <path d="M88 85 Q108 76 100 58" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M100 58 Q104 54 100 50" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
      
      {/* Head */}
      <g style={{ transformOrigin: "62px 58px" }}>
        <ellipse cx="62" cy="58" rx="26" ry="24" fill="#f6c48b" />
        <path d="M 62 40 L 62 48 M 55 42 L 57 48 M 69 42 L 67 48" stroke="#e8a763" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
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
        <line x1="36" y1="66" x2="48" y2="67" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="34" y1="70" x2="48" y2="70" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="88" y1="66" x2="76" y2="67" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="90" y1="70" x2="76" y2="70" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
      </g>
    </svg>
  );
}

function CatIdle() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
      {/* Sitting body */}
      <ellipse cx="62" cy="80" rx="28" ry="24" fill="#f6c48b" />
      <ellipse cx="62" cy="80" rx="28" ry="24" fill="#ffe0b3" opacity="0.5" />
      
      {/* Tail wrapping around front */}
      <path d="M 85 90 Q 100 105 70 102 Q 40 100 35 105" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 40 104 Q 35 105 32 105" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" />
      
      {/* Front legs planted */}
      <path d="M 54 80 L 54 102" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 70 80 L 70 102" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="54" cy="102" r="4" fill="#f6c48b" />
      <circle cx="70" cy="102" r="4" fill="#f6c48b" />

      {/* Head looking forward */}
      <g style={{ transformOrigin: "62px 55px" }}>
        <ellipse cx="62" cy="55" rx="25" ry="23" fill="#f6c48b" />
        <path d="M40 41 L36 19 L54 35 Z" fill="#f6c48b" />
        <path d="M84 41 L88 19 L70 35 Z" fill="#f6c48b" />
        <g style={{ animation: "catBlink3 4.2s ease-in-out infinite", transformOrigin: "62px 55px" }}>
          <ellipse cx="52" cy="55" rx="3.2" ry="4.6" fill="#2a1e1a" />
          <ellipse cx="72" cy="55" rx="3.2" ry="4.6" fill="#2a1e1a" />
          <circle cx="53.2" cy="53.4" r="1" fill="#fff" />
          <circle cx="73.2" cy="53.4" r="1" fill="#fff" />
        </g>
        <path d="M60 63 L64 63 L62 66 Z" fill="#ff8fa3" />
        <path d="M62 66 Q58 70 55 68" stroke="#3a2a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M62 66 Q66 70 69 68" stroke="#3a2a2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <line x1="36" y1="63" x2="48" y2="64" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="34" y1="67" x2="48" y2="67" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="88" y1="63" x2="76" y2="64" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="90" y1="67" x2="76" y2="67" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
      </g>
    </svg>
  );
}

function CatLicking() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
      <ellipse cx="62" cy="80" rx="28" ry="24" fill="#f6c48b" />
      <ellipse cx="62" cy="80" rx="28" ry="24" fill="#ffe0b3" opacity="0.5" />
      <path d="M 80 95 Q 90 95 90 85 Q 90 75 75 75" stroke="#e8a763" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M 85 90 Q 100 105 70 102 Q 40 100 35 105" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 40 104 Q 35 105 32 105" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" />
      <g style={{ animation: "pawLick 0.6s ease-in-out infinite alternate", transformOrigin: "65px 75px" }}>
        <path d="M 65 75 Q 40 65 40 55" stroke="#f6c48b" strokeWidth="9" fill="none" strokeLinecap="round" />
        <circle cx="40" cy="55" r="4.5" fill="#f6c48b" />
        <circle cx="38" cy="53" r="1.5" fill="#ffb3c1" />
        <circle cx="42" cy="52" r="1.5" fill="#ffb3c1" />
      </g>
      <g style={{ animation: "headLick 0.6s ease-in-out infinite alternate", transformOrigin: "60px 50px" }}>
        <g transform="translate(60, 50) rotate(-25)">
          <ellipse cx="0" cy="0" rx="24" ry="22" fill="#f6c48b" />
          <path d="M -18 -10 L -24 -28 L -4 -18 Z" fill="#f6c48b" />
          <path d="M 6 -18 L 24 -28 L 18 -10 Z" fill="#f6c48b" />
          <path d="M -16 -12 L -21 -24 L -7 -16 Z" fill="#f2a3b5" />
          <path d="M 8 -16 L 21 -24 L 16 -12 Z" fill="#f2a3b5" />
          <path d="M -12 2 Q -8 6 -4 2" fill="none" stroke="#2a1e1a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 4 2 Q 8 6 12 2" fill="none" stroke="#2a1e1a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M -2 9 L 2 9 L 0 11 Z" fill="#ff8fa3" />
          <path d="M 0 11 Q -5 18 -12 18" stroke="#ff8fa3" strokeWidth="3" fill="none" strokeLinecap="round" />
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
      <g style={{ animation: "tailTwitch 2s ease-in-out infinite alternate", transformOrigin: "85px 85px" }}>
        <path d="M 85 85 Q 105 95 100 110" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M 101 105 Q 100 110 100 110" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx="62" cy="85" rx="32" ry="18" fill="#f6c48b" />
      <ellipse cx="62" cy="82" rx="20" ry="10" fill="#ffe0b3" opacity="0.8" />
      <g transform="translate(35, 80) rotate(-70)">
        <ellipse cx="0" cy="0" rx="24" ry="22" fill="#f6c48b" />
        <path d="M -18 -10 L -24 -28 L -4 -18 Z" fill="#f6c48b" />
        <path d="M 6 -18 L 24 -28 L 18 -10 Z" fill="#f6c48b" />
        <path d="M -16 -12 L -21 -24 L -7 -16 Z" fill="#f2a3b5" />
        <path d="M 8 -16 L 21 -24 L 16 -12 Z" fill="#f2a3b5" />
        <ellipse cx="-10" cy="0" rx="5" ry="6" fill="#2a1e1a" />
        <ellipse cx="10" cy="0" rx="5" ry="6" fill="#2a1e1a" />
        <circle cx="-11" cy="-2" r="2" fill="#fff" />
        <circle cx="9" cy="-2" r="2" fill="#fff" />
        <circle cx="-8" cy="2" r="0.8" fill="#fff" />
        <circle cx="12" cy="2" r="0.8" fill="#fff" />
        <path d="M -2 -8 L 2 -8 L 0 -10 Z" fill="#ff8fa3" />
        <path d="M 0 -10 Q -4 -14 -6 -12" stroke="#3a2a2a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M 0 -10 Q 4 -14 6 -12" stroke="#3a2a2a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <line x1="-26" y1="-2" x2="-16" y2="0" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="-25" y1="4" x2="-15" y2="2" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="26" y1="-2" x2="16" y2="0" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        <line x1="25" y1="4" x2="15" y2="2" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
      </g>
      <path d="M 85 80 Q 80 65 95 55" stroke="#f6c48b" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M 70 85 Q 75 60 82 50" stroke="#f6c48b" strokeWidth="10" fill="none" strokeLinecap="round" />
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
  );
}

function CatTapped() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
      {/* Floating Heart */}
      <text x="45" y="30" fontSize="24" style={{ animation: "floatUp 1.5s ease-out forwards", opacity: 0 }}>❤️</text>

      <g style={{ animation: "catJump 0.4s ease-out" }}>
        {/* Sitting body */}
        <ellipse cx="62" cy="80" rx="28" ry="24" fill="#f6c48b" />
        <ellipse cx="62" cy="80" rx="28" ry="24" fill="#ffe0b3" opacity="0.5" />

        {/* Happy Tail straight up */}
        <g style={{ animation: "tailTwitch 0.2s infinite alternate", transformOrigin: "85px 85px" }}>
          <path d="M 85 85 Q 95 60 90 40" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 91 45 Q 90 40 90 40" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>

        {/* Raised Front Legs */}
        <path d="M 54 80 Q 45 75 45 65" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M 70 80 Q 79 75 79 65" stroke="#f6c48b" strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="45" cy="65" r="4" fill="#f6c48b" />
        <circle cx="79" cy="65" r="4" fill="#f6c48b" />
        <circle cx="45" cy="65" r="1.5" fill="#ffb3c1" />
        <circle cx="79" cy="65" r="1.5" fill="#ffb3c1" />

        {/* Head looking forward */}
        <g style={{ transformOrigin: "62px 55px" }}>
          <ellipse cx="62" cy="55" rx="25" ry="23" fill="#f6c48b" />
          {/* Ears */}
          <path d="M40 41 L36 19 L54 35 Z" fill="#f6c48b" />
          <path d="M84 41 L88 19 L70 35 Z" fill="#f6c48b" />
          <path d="M42 40 L40 30 L48 38 Z" fill="#f2a3b5" />
          <path d="M82 40 L84 30 L76 38 Z" fill="#f2a3b5" />

          {/* Wide Eyes */}
          <circle cx="52" cy="55" r="4.5" fill="#2a1e1a" />
          <circle cx="72" cy="55" r="4.5" fill="#2a1e1a" />
          <circle cx="53" cy="53.5" r="1.5" fill="#fff" />
          <circle cx="73" cy="53.5" r="1.5" fill="#fff" />

          {/* Open Mouth */}
          <path d="M 58 63 Q 62 70 66 63 Z" fill="#ff8fa3" />

          {/* Blush */}
          <circle cx="46" cy="63" r="5" fill="#ffb3c1" opacity="0.8" />
          <circle cx="78" cy="63" r="5" fill="#ffb3c1" opacity="0.8" />

          {/* Whiskers */}
          <line x1="36" y1="63" x2="44" y2="64" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
          <line x1="34" y1="67" x2="44" y2="67" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
          <line x1="88" y1="63" x2="80" y2="64" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
          <line x1="90" y1="67" x2="80" y2="67" stroke="#7a5b3a" strokeWidth="1" opacity="0.6" />
        </g>
      </g>
    </svg>
  );
}