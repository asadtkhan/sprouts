import { useEffect, useState, type ReactNode } from "react";

const splashUrl = "/splash.png";

const SPLASH_MS = 3000;
const FADE_MS = 450;

/**
 * Shows the Sprout splash for 3 seconds on every cold open. Route content
 * (Onboarding for first-time users, the home hub for returning users) mounts
 * underneath immediately, so the right screen is already there when it fades.
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
          className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity ease-out ${
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            transitionDuration: `${FADE_MS}ms`,
            background:
              "linear-gradient(135deg, #b9c8f0 0%, #d7c3ef 30%, #f3cfe3 60%, #cdeee0 100%)",
          }}
        >
          <img
            src={splashUrl}
            alt="Sprout — gamified habit building and growth"
            className="max-w-full max-h-full object-contain"
            width={1024}
            height={1024}
          />
        </div>
      )}
    </>
  );
}
