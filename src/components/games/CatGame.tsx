// Cat game — 31 stages from kitten to full-grown cat. Every stage keeps
// the features that actually read as "cat" (triangle ears, a curled tail,
// whiskers, open eyes) — only their proportions change, from a round,
// big-eyed kitten to a sleek adult. Poor health droops those same features
// and dulls the fur rather than hiding them, so it always still looks like
// a cat, just an unhappy one — and blends proportions partway back toward
// the previous stage as a genuine "negative progress" cue, without ever
// erasing the size it's actually earned.
import { useState } from "react";
import { GameDefs, Pedestal, Sparkles, FX_KEYFRAMES, Burst, useBurstOnIncrease } from "./fx";

interface Props {
  stage: number;
  health: number;
  compact?: boolean;
}

type Accessory = "none" | "collar" | "bow" | "hat";
type Condition = "normal" | "sick" | "critical";

interface CatTier {
  label: string;
  scale: number;
  bodyRX: number;
  bodyRY: number;
  headRX: number;
  headRY: number;
  earLen: number;
  eyeR: number;
  tailLen: number;
  whiskerLen: number;
  furTuft: boolean;
  accessory: Accessory;
  squint: boolean;
}

// Nine hand-tuned growth stages. Head:body ratio, eye size, ear length,
// tail length and whisker length all shrink or grow smoothly from a round
// kitten toward a balanced adult; fur tufts, a collar, a bow and finally a
// party hat unlock along the way.
const CAT_TIERS: CatTier[] = [
  { label: "Newborn", scale: 0.5, bodyRX: 34, bodyRY: 27, headRX: 38, headRY: 35, earLen: 14, eyeR: 8.5, tailLen: 14, whiskerLen: 10, furTuft: false, accessory: "none", squint: false },
  { label: "Baby", scale: 0.6, bodyRX: 39, bodyRY: 31, headRX: 41, headRY: 37, earLen: 18, eyeR: 8.2, tailLen: 22, whiskerLen: 13, furTuft: false, accessory: "none", squint: false },
  { label: "Toddler", scale: 0.69, bodyRX: 44, bodyRY: 34, headRX: 44, headRY: 39, earLen: 22, eyeR: 7.6, tailLen: 32, whiskerLen: 16, furTuft: false, accessory: "none", squint: false },
  { label: "Young cat", scale: 0.78, bodyRX: 48, bodyRY: 37, headRX: 46, headRY: 41, earLen: 26, eyeR: 6.9, tailLen: 42, whiskerLen: 19, furTuft: false, accessory: "none", squint: false },
  { label: "Adolescent", scale: 0.87, bodyRX: 52, bodyRY: 40, headRX: 48, headRY: 43, earLen: 29, eyeR: 6.2, tailLen: 52, whiskerLen: 22, furTuft: true, accessory: "none", squint: false },
  { label: "Junior", scale: 0.94, bodyRX: 55, bodyRY: 43, headRX: 49, headRY: 44, earLen: 31, eyeR: 5.6, tailLen: 58, whiskerLen: 24, furTuft: true, accessory: "collar", squint: false },
  { label: "Adult", scale: 1.0, bodyRX: 60, bodyRY: 46, headRX: 52, headRY: 46, earLen: 33, eyeR: 5.0, tailLen: 64, whiskerLen: 26, furTuft: true, accessory: "collar", squint: true },
  { label: "Mature", scale: 1.06, bodyRX: 62, bodyRY: 48, headRX: 53, headRY: 47, earLen: 34, eyeR: 4.8, tailLen: 70, whiskerLen: 27, furTuft: true, accessory: "bow", squint: true },
  { label: "Grown", scale: 1.12, bodyRX: 64, bodyRY: 49, headRX: 54, headRY: 47, earLen: 35, eyeR: 4.6, tailLen: 76, whiskerLen: 28, furTuft: true, accessory: "hat", squint: true },
];

const FUR: Record<Condition, { a: string; b: string; cheek: string; outline: string }> = {
  normal: { a: "#f6c78e", b: "#dd9c53", cheek: "#ffb3b3", outline: "#c9863f" },
  sick: { a: "#c9b199", b: "#a89680", cheek: "#e0a89a", outline: "#94816a" },
  critical: { a: "#ab9a89", b: "#8a7a6a", cheek: "#c79f96", outline: "#7a6a5a" },
};

// How far each condition pulls the cat's proportions back toward the
// previous tier. 0 = fully at its earned stage, higher = more regressed.
const REGRESSION: Record<Condition, number> = { normal: 0, sick: 0.28, critical: 0.58 };

/**
 * Blends a tier's proportions toward the previous tier's by `regression`.
 * This is how neglect reads on screen: the cat keeps its earned size and
 * shape language (it never stops looking like a cat), but visibly droops
 * back toward how it looked a stage ago and loses its fur fluff/accessory
 * — then un-droops the moment health recovers.
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
    eyeR: lerp(cur.eyeR, prev.eyeR),
    tailLen: lerp(cur.tailLen, prev.tailLen),
    whiskerLen: lerp(cur.whiskerLen, prev.whiskerLen),
    furTuft: cur.furTuft && regression < 0.45,
    accessory: regression < 0.3 ? cur.accessory : "none",
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
  const bodyCY = 224;
  // Head sits mostly above the body with only a small overlap, so the
  // silhouette reads as two clearly stacked forms — a sitting cat, not
  // one fused blob.
  const overlap = Math.min(tier.bodyRY, tier.headRY) * 0.22;
  const headCX = 160;
  const headCY = bodyCY - tier.bodyRY - tier.headRY + overlap;

  const levelUp = useBurstOnIncrease(capped);
  const [poke, setPoke] = useState(0);
  const react = () => setPoke((p) => p + 1);

  // Tail: always visible. Curls up happily when well, droops down when
  // unwell — never fully hidden, since a tail is one of the strongest
  // "this is a cat" cues.
  const tailBaseX = bodyCX + tier.bodyRX * 0.82;
  const tailBaseY = bodyCY + tier.bodyRY * 0.35;
  const tailWidth = Math.max(7, 7 + capped * 0.9);
  let tailTipX: number;
  let tailTipY: number;
  let tailPath: string;
  if (condition === "normal") {
    tailTipX = tailBaseX + tier.tailLen * 0.75;
    tailTipY = tailBaseY - tier.tailLen * 0.95;
    tailPath = `M${tailBaseX} ${tailBaseY} Q${tailBaseX + tier.tailLen * 0.6} ${tailBaseY - tier.tailLen * 0.55} ${tailTipX} ${tailTipY}`;
  } else {
    const droop = critical ? 1 : 0.6;
    tailTipX = tailBaseX + tier.tailLen * 0.55 * droop;
    tailTipY = tailBaseY + tier.tailLen * 0.5 * droop;
    tailPath = `M${tailBaseX} ${tailBaseY} Q${tailBaseX + tier.tailLen * 0.35} ${tailBaseY + tier.tailLen * 0.1} ${tailTipX} ${tailTipY}`;
  }

  const earDroop = critical ? 10 : sick ? 4 : 0;
  const earBaseHalf = Math.max(9, tier.earLen * 0.62);
  const earLX = headCX - tier.headRX * 0.66;
  const earLY = headCY - tier.headRY * 0.62;
  const earRX = headCX + tier.headRX * 0.66;

  const eyeDX = tier.headRX * 0.36;

  const mouthPath =
    condition === "critical"
      ? `M${headCX - 8} ${headCY + tier.headRY * 0.44} Q${headCX} ${headCY + tier.headRY * 0.36} ${headCX + 8} ${headCY + tier.headRY * 0.44}`
      : condition === "sick"
        ? `M${headCX - 9} ${headCY + tier.headRY * 0.42} Q${headCX} ${headCY + tier.headRY * 0.34} ${headCX + 9} ${headCY + tier.headRY * 0.42}`
        : `M${headCX - 8} ${headCY + tier.headRY * 0.42} Q${headCX} ${headCY + tier.headRY * 0.54} ${headCX + 8} ${headCY + tier.headRY * 0.42}`;

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
                {capped >= 5 && condition === "normal" && (
                  <circle cx={tailTipX} cy={tailTipY} r={tailWidth * 0.5} fill={fur.a} />
                )}
              </g>

              {/* haunches — a soft double bump gives the sitting silhouette weight */}
              <ellipse
                cx={bodyCX - tier.bodyRX * 0.72}
                cy={bodyCY + tier.bodyRY * 0.55}
                rx={tier.bodyRX * 0.3}
                ry={tier.bodyRY * 0.4}
                fill={fur.a}
              />
              <ellipse
                cx={bodyCX + tier.bodyRX * 0.72}
                cy={bodyCY + tier.bodyRY * 0.55}
                rx={tier.bodyRX * 0.3}
                ry={tier.bodyRY * 0.4}
                fill={fur.a}
              />

              <ellipse
                cx={bodyCX}
                cy={bodyCY}
                rx={tier.bodyRX}
                ry={tier.bodyRY}
                fill={fur.a}
                stroke={fur.outline}
                strokeWidth="1.5"
                strokeOpacity="0.35"
              />

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

              {/* front paws — always visible */}
              <ellipse
                cx={bodyCX - tier.bodyRX * 0.42}
                cy={bodyCY + tier.bodyRY * 0.82}
                rx={Math.max(6.5, tier.bodyRX * 0.19)}
                ry={Math.max(6.5, tier.bodyRX * 0.19) * 0.75}
                fill={fur.b}
              />
              <ellipse
                cx={bodyCX + tier.bodyRX * 0.42}
                cy={bodyCY + tier.bodyRY * 0.82}
                rx={Math.max(6.5, tier.bodyRX * 0.19)}
                ry={Math.max(6.5, tier.bodyRX * 0.19) * 0.75}
                fill={fur.b}
              />

              {/* head tilt — a cheerful sway when well, a low slump when critical */}
              <g
                style={{
                  animation: `${critical ? "catSlump" : "catHead"} 3.6s ease-in-out infinite`,
                  transformOrigin: `${headCX}px ${headCY}px`,
                }}
              >
                {/* ears — always proper triangles with a pink inner ear */}
                <path
                  d={`M${earLX - earBaseHalf * 0.5} ${earLY + earBaseHalf * 0.3} L${earLX - earBaseHalf * 0.15} ${earLY - tier.earLen + earDroop} L${earLX + earBaseHalf * 0.75} ${earLY + earBaseHalf * 0.15} Z`}
                  fill={fur.a}
                  stroke={fur.outline}
                  strokeWidth="1.3"
                  strokeOpacity="0.3"
                />
                <path
                  d={`M${earRX + earBaseHalf * 0.5} ${earLY + earBaseHalf * 0.3} L${earRX + earBaseHalf * 0.15} ${earLY - tier.earLen + earDroop} L${earRX - earBaseHalf * 0.75} ${earLY + earBaseHalf * 0.15} Z`}
                  fill={fur.a}
                  stroke={fur.outline}
                  strokeWidth="1.3"
                  strokeOpacity="0.3"
                />
                <path
                  d={`M${earLX - earBaseHalf * 0.28} ${earLY + earBaseHalf * 0.1} L${earLX - earBaseHalf * 0.08} ${earLY - tier.earLen * 0.68 + earDroop} L${earLX + earBaseHalf * 0.45} ${earLY - earBaseHalf * 0.02} Z`}
                  fill="#ffb3c1"
                />
                <path
                  d={`M${earRX + earBaseHalf * 0.28} ${earLY + earBaseHalf * 0.1} L${earRX + earBaseHalf * 0.08} ${earLY - tier.earLen * 0.68 + earDroop} L${earRX - earBaseHalf * 0.45} ${earLY - earBaseHalf * 0.02} Z`}
                  fill="#ffb3c1"
                />

                <ellipse
                  cx={headCX}
                  cy={headCY}
                  rx={tier.headRX}
                  ry={tier.headRY}
                  fill={fur.a}
                  stroke={fur.outline}
                  strokeWidth="1.5"
                  strokeOpacity="0.35"
                />

                <circle
                  cx={headCX - tier.headRX * 0.6}
                  cy={headCY + tier.headRY * 0.34}
                  r={tier.headRX * 0.17}
                  fill={fur.cheek}
                  opacity="0.65"
                />
                <circle
                  cx={headCX + tier.headRX * 0.6}
                  cy={headCY + tier.headRY * 0.34}
                  r={tier.headRX * 0.17}
                  fill={fur.cheek}
                  opacity="0.65"
                />

                {tier.furTuft && (
                  <>
                    <path
                      d={`M${headCX - tier.headRX * 0.96} ${headCY + tier.headRY * 0.12} q-7 9 0 18`}
                      stroke={fur.a}
                      strokeWidth="4.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + tier.headRX * 0.96} ${headCY + tier.headRY * 0.12} q7 9 0 18`}
                      stroke={fur.a}
                      strokeWidth="4.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* eyes — always open, sized and shaped by tier + condition */}
                {critical ? (
                  <>
                    <path
                      d={`M${headCX - eyeDX - tier.eyeR} ${headCY} Q${headCX - eyeDX} ${headCY + tier.eyeR * 0.7} ${headCX - eyeDX + tier.eyeR} ${headCY}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.4"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + eyeDX - tier.eyeR} ${headCY} Q${headCX + eyeDX} ${headCY + tier.eyeR * 0.7} ${headCX + eyeDX + tier.eyeR} ${headCY}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </>
                ) : condition === "sick" ? (
                  <>
                    <path
                      d={`M${headCX - eyeDX - 5} ${headCY - 4} L${headCX - eyeDX + 5} ${headCY + 4}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX - eyeDX + 5} ${headCY - 4} L${headCX - eyeDX - 5} ${headCY + 4}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + eyeDX - 5} ${headCY - 4} L${headCX + eyeDX + 5} ${headCY + 4}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + eyeDX + 5} ${headCY - 4} L${headCX + eyeDX - 5} ${headCY + 4}`}
                      stroke="#3a2a2a"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                  </>
                ) : tier.squint ? (
                  <>
                    <path
                      d={`M${headCX - eyeDX - 6} ${headCY} Q${headCX - eyeDX} ${headCY - 7} ${headCX - eyeDX + 6} ${headCY}`}
                      stroke="#3a2a2a"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${headCX + eyeDX - 6} ${headCY} Q${headCX + eyeDX} ${headCY - 7} ${headCX + eyeDX + 6} ${headCY}`}
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
                      cx={headCX - eyeDX}
                      cy={headCY}
                      rx={tier.eyeR}
                      ry={tier.eyeR * 1.12}
                      fill="#3a2a2a"
                    />
                    <ellipse
                      cx={headCX + eyeDX}
                      cy={headCY}
                      rx={tier.eyeR}
                      ry={tier.eyeR * 1.12}
                      fill="#3a2a2a"
                    />
                    <circle
                      cx={headCX - eyeDX - tier.eyeR * 0.32}
                      cy={headCY - tier.eyeR * 0.4}
                      r={Math.max(1.2, tier.eyeR * 0.26)}
                      fill="#fff"
                    />
                    <circle
                      cx={headCX + eyeDX - tier.eyeR * 0.32}
                      cy={headCY - tier.eyeR * 0.4}
                      r={Math.max(1.2, tier.eyeR * 0.26)}
                      fill="#fff"
                    />
                  </g>
                )}

                <path
                  d={`M${headCX - 4} ${headCY + tier.headRY * 0.26} L${headCX + 4} ${headCY + tier.headRY * 0.26} L${headCX} ${headCY + tier.headRY * 0.26 + 5} Z`}
                  fill="#ff8fa3"
                />
                <path
                  d={mouthPath}
                  stroke="#3a2a2a"
                  strokeWidth="2.4"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* whiskers — always present, short for babies, long for adults */}
                {[-4, 3, 10].map((dy, i) => (
                  <g key={i}>
                    <line
                      x1={headCX - tier.headRX * 0.62}
                      y1={headCY + tier.headRY * 0.22 + dy * 0.4}
                      x2={headCX - tier.headRX * 0.62 - tier.whiskerLen}
                      y2={headCY + tier.headRY * 0.22 + dy}
                      stroke="#3a2a2a"
                      strokeWidth="1"
                    />
                    <line
                      x1={headCX + tier.headRX * 0.62}
                      y1={headCY + tier.headRY * 0.22 + dy * 0.4}
                      x2={headCX + tier.headRX * 0.62 + tier.whiskerLen}
                      y2={headCY + tier.headRY * 0.22 + dy}
                      stroke="#3a2a2a"
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {(tier.accessory === "collar" || tier.accessory === "bow") && (
                  <path
                    d={`M${headCX - tier.headRX * 0.68} ${headCY + tier.headRY * 0.64} Q${headCX} ${headCY + tier.headRY * 0.8} ${headCX + tier.headRX * 0.68} ${headCY + tier.headRY * 0.64}`}
                    stroke="#ff9ec2"
                    strokeWidth="6"
                    fill="none"
                  />
                )}
                {tier.accessory === "bow" && (
                  <>
                    <circle cx={headCX} cy={headCY + tier.headRY * 0.74} r="4" fill="#e0507a" />
                    <path
                      d={`M${headCX} ${headCY + tier.headRY * 0.74} l-10 -6 l2 8 Z`}
                      fill="#ff8fb0"
                    />
                    <path
                      d={`M${headCX} ${headCY + tier.headRY * 0.74} l10 -6 l-2 8 Z`}
                      fill="#ff8fb0"
                    />
                  </>
                )}
                {tier.accessory === "hat" && (
                  <>
                    <path
                      d={`M${headCX - 18} ${headCY - tier.headRY * 0.92 + 4} L${headCX - 9} ${headCY - tier.headRY * 0.92 - 17} L${headCX} ${headCY - tier.headRY * 0.92} L${headCX + 9} ${headCY - tier.headRY * 0.92 - 17} L${headCX + 18} ${headCY - tier.headRY * 0.92 + 4} Z`}
                      fill="#ffd76a"
                      stroke="#c99a2a"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={headCX}
                      cy={headCY - tier.headRY * 0.92 - 10}
                      r="3"
                      fill="#ff6b6b"
                    />
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