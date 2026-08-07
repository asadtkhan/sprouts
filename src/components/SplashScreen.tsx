import { useEffect, useState, type ReactNode } from "react";

const SPLASH_MS = 3000;
const FADE_MS = 450;

/**
 * Wraps the app and shows the Sprout splash image for a few seconds on
 * every cold open. The real route content (Onboarding for first-time
 * users, the home hub for returning users) mounts underneath immediately,
 * so as soon as the splash fades the right screen is already there —
 * no extra flash of the wrong content, and it also quietly covers the
 * brief moment it takes app state to hydrate from localStorage.
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
          <picture>
            <source srcSet="/splash.png" type="image/png" />
            <img
              src="/splash.png"
              alt="Sprout — gamified habit building & growth"
              className="max-w-full max-h-full object-contain"
              width={1024}
              height={1024}
            />
          </picture>
        </div>
      )}
    </>
  );
}