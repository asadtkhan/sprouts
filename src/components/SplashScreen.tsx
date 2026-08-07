import { useEffect, useState, type ReactNode } from "react";

const SPLASH_MS = 3000;
const FADE_MS = 450;

/**
 * Animated splash: a seed sprouts into a leafy plant inside a glass pot while
 * the wordmark fades in. Shown for 3 seconds on every cold open. Route content
 * mounts underneath immediately, so the right screen is already there when it
 * fades away.
 */
export function SplashScreen({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), SPLASH_MS);
    return () => clearTimeout(hide);
  }, []);

  useEffect(() => {
    if (!visible) {
      const unmount = setTimeout(() => setMounted(false), FADE_MS);
      return () => clearTimeout(unmount);
    }
  }, [visible]);

  return (
    <>
      {children}
      {mounted && (
        <div
          aria-hidden={!visible}
          role="img"
          aria-label="Sprout — gamified habit building and growth"
          className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-opacity ease-out ${
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            transitionDuration: `${FADE_MS}ms`,
            background:
              "linear-gradient(135deg, #b9c8f0 0%, #d7c3ef 30%, #f3cfe3 60%, #cdeee0 100%)",
          }}
        >
          <style>{`
            @keyframes splashRise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
            @keyframes splashGrow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
            @keyframes splashPop { 0% { opacity: 0; transform: scale(0.2) } 60% { opacity: 1; transform: scale(1.12) } 100% { opacity: 1; transform: scale(1) } }
            @keyframes splashSway { 0%,100% { transform: rotate(-1.6deg) } 50% { transform: rotate(1.6deg) } }
            @keyframes splashHalo { 0%,100% { opacity: .35; transform: scale(1) } 50% { opacity: .6; transform: scale(1.06) } }
            @keyframes splashFloat { 0% { opacity: 0; transform: translateY(10px) } 40% { opacity: .8 } 100% { opacity: 0; transform: translateY(-38px) } }
            @media (prefers-reduced-motion: reduce) {
              .splash-anim * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
            }
          `}</style>

          <div className="splash-anim flex w-full max-w-[520px] flex-col items-center px-8">
            <svg
              viewBox="0 0 300 300"
              className="w-[62vw] max-w-[320px] min-w-[180px] aspect-square"
            >
              <defs>
                <radialGradient id="splashHalo" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="splashLeaf" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8fd6a4" />
                  <stop offset="100%" stopColor="#3e9a68" />
                </linearGradient>
                <linearGradient id="splashPot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              <circle
                cx="150"
                cy="140"
                r="98"
                fill="url(#splashHalo)"
                style={{ animation: "splashHalo 3s ease-in-out infinite", transformOrigin: "150px 140px" }}
              />

              {/* plant */}
              <g style={{ animation: "splashSway 3.2s ease-in-out .9s infinite", transformOrigin: "150px 230px" }}>
                <path
                  d="M150 232 L150 132"
                  stroke="#4a9a6a"
                  strokeWidth="7"
                  strokeLinecap="round"
                  style={{ animation: "splashGrow 1s cubic-bezier(.2,.8,.3,1) forwards", transformOrigin: "150px 232px" }}
                />
                {[
                  { d: "M150 196 C120 190 106 168 108 148 C136 148 150 168 150 196 Z", delay: ".75s" },
                  { d: "M150 176 C180 170 194 148 192 128 C164 128 150 148 150 176 Z", delay: "1s" },
                  { d: "M150 152 C124 146 112 126 114 108 C140 108 150 126 150 152 Z", delay: "1.25s" },
                ].map((l, i) => (
                  <path
                    key={i}
                    d={l.d}
                    fill="url(#splashLeaf)"
                    opacity="0"
                    style={{
                      animation: `splashPop .6s cubic-bezier(.2,.9,.3,1.2) ${l.delay} forwards`,
                      transformOrigin: "150px 160px",
                    }}
                  />
                ))}
                <g
                  opacity="0"
                  style={{ animation: "splashPop .7s cubic-bezier(.2,.9,.3,1.3) 1.5s forwards", transformOrigin: "150px 124px" }}
                >
                  {[0, 72, 144, 216, 288].map((a) => (
                    <ellipse key={a} cx="150" cy="110" rx="9" ry="15" fill="#ffb3d1" transform={`rotate(${a} 150 124)`} />
                  ))}
                  <circle cx="150" cy="124" r="8" fill="#fff2b8" />
                </g>
              </g>

              {/* pot */}
              <g>
                <ellipse cx="150" cy="236" rx="62" ry="10" fill="#2a2050" opacity="0.12" />
                <path d="M104 226 L196 226 L184 274 Q150 282 116 274 Z" fill="url(#splashPot)" />
                <path d="M104 226 L196 226 L192 240 L108 240 Z" fill="#ffffff" opacity="0.55" />
                <path
                  d="M104 226 L196 226 L184 274 Q150 282 116 274 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity="0.8"
                />
              </g>

              {/* floating sparkles */}
              {[
                { x: 92, y: 200, d: "0s" },
                { x: 214, y: 186, d: ".8s" },
                { x: 118, y: 96, d: "1.4s" },
                { x: 202, y: 108, d: "2s" },
              ].map((s, i) => (
                <circle
                  key={i}
                  cx={s.x}
                  cy={s.y}
                  r="3.5"
                  fill="#ffffff"
                  opacity="0"
                  style={{ animation: `splashFloat 2.6s ease-out ${s.d} infinite` }}
                />
              ))}
            </svg>

            <h1
              className="mt-6 text-center text-4xl font-bold tracking-tight text-[#3b3161] sm:text-5xl"
              style={{ opacity: 0, animation: "splashRise .7s ease-out 1.5s forwards" }}
            >
              Sprout
            </h1>
            <p
              className="mt-2 text-center text-sm text-[#3b3161]/70 sm:text-base"
              style={{ opacity: 0, animation: "splashRise .7s ease-out 1.8s forwards" }}
            >
              Grow habits, grow a world
            </p>
          </div>
        </div>
      )}
    </>
  );
}
