/**
 * The crest behind the mascot on the author card — three rotating orbits.
 *
 * THE BUG THIS FILE EXISTS TO END
 * -------------------------------
 * v1.1.6 drew the ring as a `<span>` with a conic gradient, masked down to a
 * 7px band, and rotated it with `animation: lc-ring-rotate 9s linear infinite`.
 * Three separate things were wrong with that, and only the third one is a
 * matter of taste:
 *
 *  1. **The motion lived in exactly one place** — a single `transform`
 *     animation on an element whose centring came from Tailwind's `translate`
 *     utilities. Any rule that touched `transform` (a future hover lift, a
 *     layout animation, a browser that resolves `translate` differently)
 *     silently took the rotation with it, and there was no second cue.
 *
 *  2. **Its resting state was broken-looking, not designed.** The conic
 *     gradient is three sparse translucent arcs. With motion on, that reads as
 *     a sweep. With motion off — `prefers-reduced-motion`, or the player's own
 *     «Giảm chuyển động» switch, which the app *seeds from the OS on first
 *     run* — it reads as a half-drawn circle someone forgot to finish. That is
 *     precisely the screenshot that was reported: a ring frozen mid-sweep
 *     around the jar.
 *
 *  3. It was one ring at one speed, which is the same mistake the hero halo
 *     fixed in v1.1.8 (`JarHalo`): one ring at one speed reads as a spinner.
 *
 * SO: SVG, THREE ORBITS, AND A REST STATE THAT STANDS UP
 * ------------------------------------------------------
 *   · every orbit is an SVG `<circle>` with a `stroke-dasharray`, so its
 *     *static* appearance is a balanced set of dashes and comet tails rather
 *     than a washed-out arc — reduce motion and you get an ornament, not a
 *     stall;
 *   · rotation is applied to a `<g>` with `transform-box: view-box` and
 *     `transform-origin: 50% 50%`, so it cannot be cancelled by anything that
 *     styles the surrounding layout;
 *   · three orbits at 9s / 14s / 22s, two clockwise and one counter-clockwise,
 *     so the crest never looks like a loading spinner;
 *   · the keyframes are the existing `lc-halo-cw` / `lc-halo-ccw` /
 *     `lc-halo-breathe` / `lc-twinkle` — no new animation names, because a
 *     duplicated `@keyframes` name is silent (see `styles/animations.css`).
 *
 * Everything is `aria-hidden`: it is decoration behind decoration.
 */
import { useId } from "react";

/** The drawing box, in user units. Exported so the CSS can state its centre. */
export const CREST_VIEW = 176;

/** Centre of the crest, in user units — the value `index.css` rotates around. */
export const CREST_CENTRE = CREST_VIEW / 2;

/** The radius of each orbit, from the inside out. */
export const CREST_ORBITS = {
  /** Fast comet, clockwise — the one you notice first. */
  inner: 58,
  /** The bright gold arc the mascot sits inside. */
  main: 68,
  /** Slow dotted orbit, counter-clockwise — the one that keeps it alive. */
  dotted: 79,
} as const;

/** Circumference helper: a dash pattern is only readable against it. */
const circumference = (r: number) => 2 * Math.PI * r;

/**
 * A dash pattern whose gaps sum to exactly one circumference.
 *
 * This is the detail that makes the frozen state look intentional: a dash
 * array that does not divide the circle leaves a ragged seam where the pattern
 * restarts, and that seam is the thing that reads as "broken" at rest.
 */
function orbit(r: number, dash: number, gap = 0): string {
  const c = circumference(r);
  const d = Math.max(1, dash);
  const g = gap > 0 ? gap : Math.max(1, c - d);
  return `${d.toFixed(2)} ${g.toFixed(2)}`;
}

export function AboutCrest({ className = "" }: { className?: string }) {
  /*
   * `useId` per instance, not a module constant. `JarLogo` had the same bug in
   * a different form (two jars, one `<clipPath id="lc-body">`), and a gradient
   * id that appears twice in one document resolves to the first definition —
   * which renders correctly exactly until it does not.
   */
  const uid = useId().replace(/[:]/g, "");
  const gold = `crest-gold-${uid}`;
  const chili = `crest-chili-${uid}`;
  const jade = `crest-jade-${uid}`;
  const glow = `crest-glow-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${CREST_VIEW} ${CREST_VIEW}`}
      className={`about-crest ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="55%" stopColor="#f5a81c" />
          <stop offset="100%" stopColor="#d4850a" />
        </linearGradient>
        <linearGradient id={chili} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a6a" />
          <stop offset="100%" stopColor="#e63b2e" />
        </linearGradient>
        <linearGradient id={jade} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b6e07a" />
          <stop offset="100%" stopColor="#2bb48c" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="rgba(245,168,28,0.22)" />
          <stop offset="100%" stopColor="rgba(245,168,28,0)" />
        </radialGradient>
      </defs>

      {/* the wash behind everything — breathing, never spinning */}
      <circle className="about-crest-glow" cx={CREST_CENTRE} cy={CREST_CENTRE} r={CREST_ORBITS.main + 12} fill={`url(#${glow})`} />

      {/* slow dotted orbit — counter-clockwise, the calmest layer */}
      <g className="about-crest-orbit-dotted">
        <circle
          cx={CREST_CENTRE}
          cy={CREST_CENTRE}
          r={CREST_ORBITS.dotted}
          fill="none"
          stroke={`url(#${jade})`}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeDasharray={orbit(CREST_ORBITS.dotted, 3, 12)}
          opacity={0.55}
        />
      </g>

      {/* the main gold arc — coarse dashes, clockwise, 14s */}
      <g className="about-crest-orbit-main">
        <circle
          cx={CREST_CENTRE}
          cy={CREST_CENTRE}
          r={CREST_ORBITS.main}
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={orbit(CREST_ORBITS.main, 104)}
          opacity={0.9}
        />
        <circle
          cx={CREST_CENTRE}
          cy={CREST_CENTRE}
          r={CREST_ORBITS.main}
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeDasharray={orbit(CREST_ORBITS.main, 20, 16)}
          opacity={0.4}
        />
      </g>

      {/* fast chili comet — inner, clockwise, 9s */}
      <g className="about-crest-orbit-inner">
        <circle
          cx={CREST_CENTRE}
          cy={CREST_CENTRE}
          r={CREST_ORBITS.inner}
          fill="none"
          stroke={`url(#${chili})`}
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeDasharray={orbit(CREST_ORBITS.inner, 44)}
          opacity={0.8}
        />
      </g>

      {/*
        Four fixed sparkles. They twinkle in place rather than orbiting, which
        is what stops the composition from reading as a single rotating disc —
        and they are the layer that still breathes when motion is reduced to
        "no rotation" but not to "no opacity".
      */}
      {[
        { x: CREST_CENTRE + 52, y: CREST_CENTRE - 52, r: 3.4, d: "0s" },
        { x: CREST_CENTRE - 58, y: CREST_CENTRE - 34, r: 2.6, d: "0.9s" },
        { x: CREST_CENTRE - 44, y: CREST_CENTRE + 58, r: 3, d: "1.7s" },
        { x: CREST_CENTRE + 60, y: CREST_CENTRE + 40, r: 2.2, d: "2.4s" },
      ].map((s) => (
        <path
          key={`${s.x}-${s.y}`}
          className="about-crest-spark"
          style={{ ["--spark-delay" as string]: s.d }}
          d={`M${s.x} ${s.y - s.r * 2.2}L${s.x + s.r * 0.62} ${s.y - s.r * 0.62}L${s.x + s.r * 2.2} ${s.y}L${s.x + s.r * 0.62} ${s.y + s.r * 0.62}L${s.x} ${s.y + s.r * 2.2}L${s.x - s.r * 0.62} ${s.y + s.r * 0.62}L${s.x - s.r * 2.2} ${s.y}L${s.x - s.r * 0.62} ${s.y - s.r * 0.62}Z`}
          fill="#fff6d8"
          opacity={0.75}
        />
      ))}
    </svg>
  );
}

export default AboutCrest;
