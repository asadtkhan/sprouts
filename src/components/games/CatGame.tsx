// Cat game — 31 stages from kitten to full-grown cat. Growth is shown
// through genuinely different proportions at each tier (not just a uniform
// scale-up of one adult shape), and poor health makes the cat visibly
// droop and regress toward how it looked a stage ago — a real "negative
// progress" look — without ever losing the size it's actually earned.
import { useState } from "react";
import { GameDefs, Pedestal, Sparkles, FX_KEYFRAMES, Burst, useBurstOnIncrease } from "./fx";

interface Props {
  stage: number;
  health: number;
  compact?: boolean;
}

type Accessory = "none" | "collar" | "bow" | "hat";
type Posture = "curled" | "sit" | "tall";
type Condition = "normal" | "sick" | "critical";

interface CatTier {
  label: string;
  scale: number;
  bodyRX: number;
  bodyRY: number;
  headRX: number;
  headRY: number;
  earLen: number;
  eyeRX: number;
  eyeRY: number;
  tailLen: number;
  whiskers: boolean;
  furTuft: boolean;
  accessory: Accessory;
  posture: Posture;
  squint: boolean;
  earFold: boolean;
  eyesClosed: boolean;
}

// Nine hand-tuned growth stages: a newborn's oversized head, huge eyes,
// folded ears and stub tail gradually resolve into a full-grown cat with
// balanced proportions, a long plush tail, whiskers and accessories.
const CAT_TIERS: CatTier[] = [
  {
    label: "Newborn",
    scale: 0.44,
    bodyRX: 32,
    bodyRY: 26,
    headRX: 40,
    headRY: 36,
    earLen: 10,
    eyeRX: 7.5,
    eyeRY: 8.5,
    tailLen: 6,
    whiskers: false,
    furTuft: false,
    accessory: "none",
    posture: "curled",
    squint: false,
    earFold: true,
    eyesClosed: true,
  },
  {
    label: "Baby",
    scale: 0.54,
    bodyRX: 38,
    bodyRY: 30,
    headRX: 43,
    headRY: 38,
    earLen: 16,
    eyeRX: 8.0,
    eyeRY: 8.5,
    tailLen: 16,
    whiskers: false,
    furTuft: false,
    accessory: "none",
    posture: "sit",
    squint: false,
    earFold: false,
    eyesClosed: false,
  },
  {
    label: "Toddler",
    scale: 0.63,
    bodyRX: 43,
    bodyRY: 33,
    headRX: 45,
    headRY: 40,
    earLen: 22,
    eyeRX: 7.2,
    eyeRY: 8.0,
    tailLen: 28,
    whiskers: true,
    furTuft: false,
    accessory: "none",
    posture: "sit",
    squint: false,
    earFold: false,
    eyesClosed: false,
  },
  {
    label: "Young cat",
    scale: 0.72,
    bodyRX: 48,
    bodyRY: 36,
    headRX: 47,
    headRY: 42,
    earLen: 26,
    eyeRX: 6.4,
    eyeRY: 7.3,
    tailLen: 40,
    whiskers: true,
    furTuft: false,
    accessory: "none",
    posture: "sit",
    squint: false,
    earFold: false,
    eyesClosed: false,
  },
  {
    label: "Adolescent",
    scale: 0.81,
    bodyRX: 52,
    bodyRY: 39,
    headRX: 48,
    headRY: 43,
    earLen: 29,
    eyeRX: 5.8,
    eyeRY: 6.8,
    tailLen: 50,
    whiskers: true,
    furTuft: true,
    accessory: "none",
    posture: "sit",
    squint: false,
    earFold: false,
    eyesClosed: false,
  },
  {
    label: "Junior",
    scale: 0.9,
    bodyRX: 55,
    bodyRY: 42,
    headRX: 49,
    headRY: 44,
    earLen: 31,
    eyeRX: 5.2,
    eyeRY: 6.3,
    tailLen: 58,
    whiskers: true,
    furTuft: true,
    accessory: "collar",
    posture: "tall",
    squint: false,
    earFold: false,
    eyesClosed: false,
  },
  {
    label: "Adult",
    scale: 0.98,
    bodyRX: 58,
    bodyRY: 45,
    headRX: 51,
    headRY: 45,
    earLen: 33,
    eyeRX: 5.0,
    eyeRY: 6.0,
    tailLen: 64,
    whiskers: true,
    furTuft: true,
    accessory: "collar",
    posture: "tall",
    squint: true,
    earFold: false,
    eyesClosed: false,
  },
  {
    label: "Mature",
    scale: 1.05,
    bodyRX: 61,
    bodyRY: 47,
    headRX: 52,
    headRY: 46,
    earLen: 34,
    eyeRX: 4.8,
    eyeRY: 5.8,
    tailLen: 70,
    whiskers: true,
    furTuft: true,
    accessory: "bow",
    posture: "tall",
    squint: true,
    earFold: false,
    eyesClosed: false,
  },
  {
    label: "Grown",
    scale: 1.12,
    bodyRX: 64,
    bodyRY: 49,
    headRX: 54,
    headRY: 47,
    earLen: 35,
    eyeRX: 4.6,
    eyeRY: 5.6,
    tailLen: 76,
    whiskers: true,
    furTuft: true,
    accessory: "hat",
    posture: "tall",
    squint: true,
    earFold: false,
    eyesClosed: false,
  },
];

const FUR: Record<Condition, { a: string; b: string; cheek: string }> = {
  normal: { a: "#f4c186", b: "#d99a52", cheek: "#ffb3b3" },
  sick: { a: "#c9b199", b: "#a89680", cheek: "#e0a89a" },
  critical: { a: "#ab9a89", b: "#8a7a6a", cheek: "#c79f96" },
};

// How far each condition pulls the cat's proportions back toward the
// previous tier. 0 = fully at its earned stage, higher = more regressed.
const REGRESSION: Record<Condition, number> = { normal: 0, sick: 0.28, critical: 0.58 };

/**
 * Blends a tier's proportions toward the previous tier's by `regression`.
 * This is how neglect reads on screen: the cat doesn't lose its earned
 * size outright, but it visibly droops back toward how it looked a stage
 * ago, sheds its whiskers/fur fluff/accessory, and curls up small once
 * things get bad enough — then un-droops the moment health recovers.
 */
function blendTier(tierIndex: number, regression: number): CatTier {
  const cur = CAT_TIERS[tierIndex];
  const prev = CAT_TIERS[Math.max(0, tierIndex - 1)];
  const lerp = (a: number, b: number) => a + (b - a) * regression;
  return {
    ...cur,
    scale: lerp(cur.scale, prev.scale),
    bodyRX: lerp(cur.bodyRX, prev.bodyRX),
    bodyRY: lerp(cur.bodyRY, prev.bodyRY),
    headRX: lerp(cur.headRX, prev.headRX),
    headRY: lerp(cur.headRY, prev.headRY),
    earLen: lerp(cur.earLen, prev.earLen),
    eyeRX: lerp(cur.eyeRX, prev.eyeRX),
    eyeRY: lerp(cur.eyeRY, prev.eyeRY),
    tailLen: lerp(cur.tailLen, prev.tailLen),
    whiskers: cur.whiskers && regression < 0.45,
    furTuft: cur.furTuft && regression < 0.45,
    accessory: regression < 0.3 ? cur.accessory : "none",
    posture: regression > 0.55 ? "curled" : cur.posture,
    earFold: cur.earFold || regression > 0.5,
    squint: cur.squint && regression < 0.4,
  };
}

export function CatGame({ stage, health }: Props) {
  const MAX = 31;
  const s = Math.min(MAX, Math.max(0, stage));
  const capped = Math.min(8, Math.floor((s / MAX) * 8 + 0.0001));
  const condition: Condition = health < 25 ? "critical" : health < 50 ? "sick" : "normal";
  const sick = condition !== "normal";
  const critical = condition === "critical";

  const tier = blendTier(capped, REGRESSION[condition]);
  const fur = FUR[condition];

  const bodyCX = 160;
  const bodyCY = 220;
  const overlap = Math.min(tier.bodyRY, tier.headRY) * 0.42;
  const headCX = 160;
  const headCY = bodyCY - tier.bodyRY - tier.headRY + overlap;

  const levelUp = useBurstOnIncrease(capped);
  const [poke, setPoke] = useState(0);
  const react = () => setPoke((p) => p + 1);

  // Tail: curls up happily when well, droops down when unwell, tucked
  // away entirely once the cat is curled up small.
  const tailBaseX = bodyCX + tier.bodyRX * 0.85;
  const tailBaseY = bodyCY + tier.bodyRY * 0.1;
  const tailWidth = Math.max(6, 8 + capped * 0.8);
  let tailPath: string | null = null;
  let tailTipX = tailBaseX;
  let tailTipY = tailBaseY;
  if (tier.tailLen > 4 && tier.posture !== "curled") {
    if (condition === "normal") {
      tailTipX = tailBaseX + tier.tailLen * 0.7;
      tailTipY = tailBaseY - tier.tailLen;
      tailPath = `M${tailBaseX} ${tailBaseY} Q${tailBaseX + tier.tailLen * 0.55} ${tailBaseY - tier.tailLen * 0.6} ${tailTipX} ${tailTipY}`;
    } else {
      const droop = critical ? 1 : 0.55;
      tailTipX = tailBaseX + tier.tailLen * 0.55 * droop;
      tailTipY = tailBaseY + tier.tailLen * 0.55 * droop;
      tailPath = `M${tailBaseX} ${tailBaseY} Q${tailBaseX + tier.tailLen * 0.3} ${tailBaseY + tier.tailLen * 0.15} ${tailTipX} ${tailTipY}`;
    }
  }

  const earBaseW = Math.max(8, tier.earLen * 0.85);
  const earDroop = critical ? 12 : sick ? 5 : 0;
  const earLX = headCX - tier.headRX * 0.58;
  const earLY = headCY - tier.headRY * 0.68;
  const earRX = headCX + tier.headRX * 0.58;

  const mouthPath =
    condition === "critical"
      ? `M${headCX - 8} ${headCY + tier.headRY * 0.42} Q${headCX} ${headCY + tier.headRY * 0.34} ${headCX + 8} ${headCY + tier.headRY * 0.42}`
      : condition === "sick"
        ? `M${headCX - 10} ${headCY + tier.headRY * 0.4} Q${headCX} ${headCY + tier.headRY * 0.32} ${headCX + 10} ${headCY + tier.headRY * 0.4}`
        : `M${headCX - 8} ${headCY + tier.headRY * 0.42} Q${headCX} ${headCY + tier.headRY * 0.52} ${headCX + 8} ${headCY + tier.headRY * 0.42}`;

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none"
      role="button"
      tabIndex={0}
      aria-label={`Cat companion (${tier.label}), stage ${s} of ${MAX}. Tap to give it some scratches.`}
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
        @keyframes catSlump { 0%,100%{ transform: rotate(-6deg) translateY(1px) } 50%{ transform: rotate(-2deg) translateY(3px) } }
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
            style={{
              animation: `catBreath ${critical ? "4.5s" : "3s"} ease-in-out infinite`,
              transformOrigin: "160px 220px",
            }}
          >
            <g
              transform={`translate(${bodyCX} ${bodyCY}) scale(${tier.scale}) translate(-${bodyCX} -${bodyCY})`}
            >
              {/* tail, drawn behind the body */}
              {tailPath && (
                <g
                  style={
                    condition === "normal"
                      ? {
                          animation: `${poke ? "catTailHappy 0.6s" : "catTail 2.4s"} ease-in-out infinite`,
                          transformOrigin: `${tailBaseX}px ${tailBaseY}px`,
                        }
                      : undefined
                  }
                >
                  <path
                    d={tailPath}
                    stroke={fur.a}
                    strokeWidth={tailWidth}
                    fill="none"
                    strokeLinecap="round"
                  />
                  {capped >= 6 && condition === "normal" && (
                    <circle cx={tailTipX} cy={tailTipY} r={tailWidth * 0.55} fill={fur.a} />
                  )}
                </g>
              )}

              <ellipse cx={bodyCX} cy={bodyCY} rx={tier.bodyRX} ry={tier.bodyRY} fill={fur.a} />

              {/* fur patches — the matted, uncared-for look at critical health */}
              {critical && (
                <>
                  <ellipse
                    cx={bodyCX - tier.bodyRX * 0.4}
                    cy={bodyCY + tier.bodyRY * 0.15}
                    rx="7"
                    ry="5"
                    fill={fur.b}
                    opacity="0.55"
                  />
                  <ellipse
                    cx={bodyCX + tier.bodyRX * 0.5}
                    cy={bodyCY - tier.bodyRY * 0.1}
                    rx="5"
                    ry="4"
                    fill={fur.b}
                    opacity="0.5"
                  />
                </>
              )}

              {/* tiny paws — hidden once curled up small */}
              {tier.posture !== "curled" && (
                <>
                  <ellipse
                    cx={bodyCX - tier.bodyRX * 0.5}
                    cy={bodyCY + tier.bodyRY * 0.78}
                    rx={Math.max(6, tier.bodyRX * 0.2)}
                    ry={Math.max(6, tier.bodyRX * 0.2) * 0.8}
                    fill={fur.b}
                  />
                  <ellipse
                    cx={bodyCX + tier.bodyRX * 0.5}
                    cy={bodyCY + tier.bodyRY * 0.78}
                    rx={Math.max(6, tier.bodyRX * 0.2)}
                    ry={Math.max(6, tier.bodyRX * 0.2) * 0.8}
                    fill={fur.b}
                  />
                </>
              )}

              {/* head tilt — a cheerful sway when well, a low slump when critical */}
              <g
                style={{
                  animation: `${critical ? "catSlump" : "catHead"} 3.6s ease-in-out infinite`,
                  transformOrigin: `${headCX}px ${headCY}px`,
                }}
              >
                {tier.earFold ? (
                  <>
                    <path
                      d={`M${headCX - tier.headRX * 0.62} ${headCY - tier.headRY * 0.72} q-6 -2 -8 4 q3 5 9 3 Z`}
                      fill={fur.a}
                    />
                    <path
                      d={`M${headCX + tier.headRX * 0.62} ${headCY - tier.headRY * 0.72} q6 -2 8 4 q-3 5 -9 3 Z`}
                      fill={fur.a}
                    />
                  </>
                ) : (
                  <>
                    <path
                      d={`M${earLX} ${earLY} L${earLX - earBaseW * 0.35} ${earLY - tier.earLen + earDroop} L${earLX + earBaseW * 0.55} ${earLY - tier.earLen * 0.35 + earDroop * 0.5} Z`}
                      fill={fur.a}
                    />
                    <path
                      d={`M${earRX} ${earLY} L${earRX + earBaseW * 0.35} ${earLY - tier.earLen + earDroop} L${earRX - earBaseW * 0.55} ${earLY - tier.earLen * 0.35 + earDroop * 0.5} Z`}
                      fill={fur.a}
                    />
                    <path
                      d={`M${earLX - 3} ${earLY - 4} L${earLX - earBaseW * 0.28} ${earLY - tier.earLen * 0.7 + earDroop} L${earLX + earBaseW * 0.35} ${earLY - tier.earLen * 0.25 + earDroop * 0.5} Z`}
                      fill="#ffb3c1"
                    />
                    <path
                      d={`M${earRX + 3} ${earLY - 4} L${earRX + earBaseW * 0.28} ${earLY - tier.earLen * 0.7 + earDroop} L${earRX - earBaseW * 0.35} ${earLY - tier.earLen * 0.25 + earDroop * 0.5} Z`}
                      fill="#ffb3c1"
                    />
                  </>
                )}

                <ellipse cx={headCX} cy={headCY} rx={tier.headRX} ry={tier.headRY} fill={fur.a} />

                <circle
                  cx={headCX - tier.headRX * 0.62}
                  cy={headCY + tier.headRY * 0.32}
                  r={tier.headRX * 0.16}
                  fill={fur.cheek}
                  opacity="0.7"
                />
                <circle
                  cx={headCX + tier.headRX * 0.62}
                  cy={headCY + tier.headRY * 0.32}
                  r={tier.headRX * 0.16}
                  fill={fur.cheek}
                  opacity="0.7"
                />

                {tier.furTuft && (
                  <>
                    <path
                      d={`M${headCX - tier.headRX * 0.95} ${headCY + tier.headRY * 0.1} q-6 8 0 16`}
                      stroke={fur.a}
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + tier.headRX * 0.95} ${headCY + tier.headRY * 0.1} q6 8 0 16`}
                      stroke={fur.a}
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {tier.eyesClosed ? (
                  <>
                    <path
                      d={`M${headCX - 14} ${headCY} q6 4 12 0`}
                      stroke="#3a2a2a"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + 2} ${headCY} q6 4 12 0`}
                      stroke="#3a2a2a"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </>
                ) : critical ? (
                  <>
                    <path
                      d={`M${headCX - tier.headRX * 0.34 - tier.eyeRX} ${headCY} Q${headCX - tier.headRX * 0.34} ${headCY + tier.eyeRX * 0.6} ${headCX - tier.headRX * 0.34 + tier.eyeRX} ${headCY}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.4"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + tier.headRX * 0.34 - tier.eyeRX} ${headCY} Q${headCX + tier.headRX * 0.34} ${headCY + tier.eyeRX * 0.6} ${headCX + tier.headRX * 0.34 + tier.eyeRX} ${headCY}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </>
                ) : condition === "sick" ? (
                  <>
                    <path
                      d={`M${headCX - tier.headRX * 0.34 - 5} ${headCY - 4} L${headCX - tier.headRX * 0.34 + 5} ${headCY + 4}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX - tier.headRX * 0.34 + 5} ${headCY - 4} L${headCX - tier.headRX * 0.34 - 5} ${headCY + 4}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + tier.headRX * 0.34 - 5} ${headCY - 4} L${headCX + tier.headRX * 0.34 + 5} ${headCY + 4}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + tier.headRX * 0.34 + 5} ${headCY - 4} L${headCX + tier.headRX * 0.34 - 5} ${headCY + 4}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                  </>
                ) : tier.squint ? (
                  <>
                    <path
                      d={`M${headCX - tier.headRX * 0.34 - 6} ${headCY} Q${headCX - tier.headRX * 0.34} ${headCY - 7} ${headCX - tier.headRX * 0.34 + 6} ${headCY}`}
                      stroke="#3a2a2a"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + tier.headRX * 0.34 - 6} ${headCY} Q${headCX + tier.headRX * 0.34} ${headCY - 7} ${headCX + tier.headRX * 0.34 + 6} ${headCY}`}
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
                      transformOrigin: `${headCX}px ${headCY}px`,
                    }}
                  >
                    <ellipse
                      cx={headCX - tier.headRX * 0.34}
                      cy={headCY}
                      rx={tier.eyeRX}
                      ry={tier.eyeRY}
                      fill="#3a2a2a"
                    />
                    <ellipse
                      cx={headCX + tier.headRX * 0.34}
                      cy={headCY}
                      rx={tier.eyeRX}
                      ry={tier.eyeRY}
                      fill="#3a2a2a"
                    />
                    <circle
                      cx={headCX - tier.headRX * 0.34 - tier.eyeRX * 0.3}
                      cy={headCY - tier.eyeRY * 0.35}
                      r={Math.max(1, tier.eyeRX * 0.22)}
                      fill="#fff"
                    />
                    <circle
                      cx={headCX + tier.headRX * 0.34 - tier.eyeRX * 0.3}
                      cy={headCY - tier.eyeRY * 0.35}
                      r={Math.max(1, tier.eyeRX * 0.22)}
                      fill="#fff"
                    />
                  </g>
                )}

                <path
                  d={`M${headCX - 4} ${headCY + tier.headRY * 0.24} L${headCX + 4} ${headCY + tier.headRY * 0.24} L${headCX} ${headCY + tier.headRY * 0.24 + 5} Z`}
                  fill="#ff8fa3"
                />
                <path
                  d={mouthPath}
                  stroke="#3a2a2a"
                  strokeWidth="2.4"
                  fill="none"
                  strokeLinecap="round"
                />

                {tier.whiskers && (
                  <>
                    <line
                      x1={headCX - tier.headRX * 0.55}
                      y1={headCY + tier.headRY * 0.24}
                      x2={headCX - tier.headRX * 1.25}
                      y2={headCY + tier.headRY * 0.2}
                      stroke="#3a2a2a"
                      strokeWidth="1"
                    />
                    <line
                      x1={headCX - tier.headRX * 0.55}
                      y1={headCY + tier.headRY * 0.32}
                      x2={headCX - tier.headRX * 1.25}
                      y2={headCY + tier.headRY * 0.34}
                      stroke="#3a2a2a"
                      strokeWidth="1"
                    />
                    <line
                      x1={headCX - tier.headRX * 0.55}
                      y1={headCY + tier.headRY * 0.4}
                      x2={headCX - tier.headRX * 1.25}
                      y2={headCY + tier.headRY * 0.48}
                      stroke="#3a2a2a"
                      strokeWidth="1"
                    />
                    <line
                      x1={headCX + tier.headRX * 0.55}
                      y1={headCY + tier.headRY * 0.24}
                      x2={headCX + tier.headRX * 1.25}
                      y2={headCY + tier.headRY * 0.2}
                      stroke="#3a2a2a"
                      strokeWidth="1"
                    />
                    <line
                      x1={headCX + tier.headRX * 0.55}
                      y1={headCY + tier.headRY * 0.32}
                      x2={headCX + tier.headRX * 1.25}
                      y2={headCY + tier.headRY * 0.34}
                      stroke="#3a2a2a"
                      strokeWidth="1"
                    />
                    <line
                      x1={headCX + tier.headRX * 0.55}
                      y1={headCY + tier.headRY * 0.4}
                      x2={headCX + tier.headRX * 1.25}
                      y2={headCY + tier.headRY * 0.48}
                      stroke="#3a2a2a"
                      strokeWidth="1"
                    />
                  </>
                )}

                {tier.accessory === "collar" && (
                  <path
                    d={`M${headCX - tier.headRX * 0.7} ${headCY + tier.headRY * 0.62} Q${headCX} ${headCY + tier.headRY * 0.78} ${headCX + tier.headRX * 0.7} ${headCY + tier.headRY * 0.62}`}
                    stroke="#ff9ec2"
                    strokeWidth="6"
                    fill="none"
                  />
                )}
                {tier.accessory === "bow" && (
                  <>
                    <path
                      d={`M${headCX - tier.headRX * 0.7} ${headCY + tier.headRY * 0.62} Q${headCX} ${headCY + tier.headRY * 0.78} ${headCX + tier.headRX * 0.7} ${headCY + tier.headRY * 0.62}`}
                      stroke="#ff9ec2"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle cx={headCX} cy={headCY + tier.headRY * 0.72} r="4" fill="#e0507a" />
                    <path
                      d={`M${headCX} ${headCY + tier.headRY * 0.72} l-10 -6 l2 8 Z`}
                      fill="#ff8fb0"
                    />
                    <path
                      d={`M${headCX} ${headCY + tier.headRY * 0.72} l10 -6 l-2 8 Z`}
                      fill="#ff8fb0"
                    />
                  </>
                )}
                {tier.accessory === "hat" && (
                  <>
                    <path
                      d={`M${headCX - 18} ${headCY - tier.headRY * 0.9 + 4} L${headCX - 9} ${headCY - tier.headRY * 0.9 - 17} L${headCX} ${headCY - tier.headRY * 0.9} L${headCX + 9} ${headCY - tier.headRY * 0.9 - 17} L${headCX + 18} ${headCY - tier.headRY * 0.9 + 4} Z`}
                      fill="#ffd76a"
                      stroke="#c99a2a"
                      strokeWidth="1.5"
                    />
                    <circle cx={headCX} cy={headCY - tier.headRY * 0.9 - 10} r="3" fill="#ff6b6b" />
                  </>
                )}
              </g>
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