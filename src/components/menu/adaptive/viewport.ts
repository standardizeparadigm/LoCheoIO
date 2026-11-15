/**
 * The window, reduced to the numbers an adaptive decision needs.
 *
 * WHY A MODULE FOR FOUR NUMBERS
 * -----------------------------
 * Every adaptive rule in this folder used to work from a bare `{ width, height }`
 * pair, and each one re-derived what it wanted from it:
 *
 *   `hero.ts`           `Math.max(1, Math.trunc(width))`
 *   `breakpoints.ts`    `w >= 1024 && h >= 300`
 *   `layout/fit.ts`     `sane()` — `Number.isFinite` then trunc then floor at 1
 *
 * Three spellings of the same clamp is how `NaN` reached `style={{ height }}`
 * once already (see the round-6 note in `layout/fit.ts`). They are the same
 * question, so they get one answer here, and every module downstream reads the
 * normalised box instead of re-clamping.
 *
 * WHAT ELSE THE BOX CARRIES
 * -------------------------
 * Adaptive layout is a function of more than the two edges:
 *
 *   shortest side   decides type size — a 1280×600 window and a 1280×1080
 *                   window are the same width and very different screens
 *   longest side    decides how much can be side by side
 *   area            decides how many controls fit without becoming a maze
 *   aspect          decides *which* of the two edges is scarce
 *
 * Those are all derived, not stored: a box is still `{width, height}` at the
 * bottom, so a caller cannot pass a `shortest` that disagrees with `width`.
 */

/** The two edges of a viewport, normalised. */
export interface Box {
  /** Usable width, integer ≥ 1. */
  width: number;
  /** Usable height, integer ≥ 1. */
  height: number;
  /** `min(width, height)` — the axis every type scale is driven by. */
  shortest: number;
  /** `max(width, height)` — the axis that decides side-by-side layouts. */
  longest: number;
  /** `width * height`, in CSS px². */
  area: number;
  /** `width / height`, rounded to three places. */
  aspect: number;
  /** Which edge is longer, with a dead zone around a square window. */
  orientation: Orientation;
}

/** Which edge is longer. */
export type Orientation = "portrait" | "square" | "landscape";

/** How extreme the aspect ratio is, in named bands. */
export type AspectClass = "tall" | "portrait" | "square" | "wide" | "ultrawide" | "panoramic";

/**
 * The largest edge this module will believe, in CSS px.
 *
 * A `visualViewport` report from a collapsing mobile URL bar can be 1 during a
 * rotation, and a corrupt persisted zoom can report thousands. 20 000 is above
 * every real display (an 8K monitor is 7 680) and low enough that `width * height`
 * stays an exact integer in a 53-bit mantissa.
 */
export const MAX_SIDE = 20_000;

/** Ratio inside which a window is treated as square (`1 ± 0.04`). */
export const SQUARE_BAND = 0.04;

/**
 * One edge, made safe.
 *
 * The order matters and it is the order that failed in round 6:
 * `Number.isFinite` **before** `Math.round`, because `Math.round(Infinity)` is
 * `Infinity` and `Math.max(1, NaN)` is `NaN`. A non-number is a bug in the
 * caller, not a viewport, so it falls back to the smallest honest screen.
 */
export function saneSide(value: unknown, fallback = 1): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(MAX_SIDE, Math.max(1, Math.round(value)));
}

/**
 * Normalise a raw `{width, height}`.
 *
 * Both arguments are `unknown` on purpose: the only two callers are
 * `readEnvironment()` and `readViewport()`, and both read browser APIs that lie.
 */
export function boxOf(width: unknown, height: unknown): Box {
  const width2 = saneSide(width);
  const height2 = saneSide(height);
  const shortest = Math.min(width2, height2);
  const longest = Math.max(width2, height2);
  return {
    width: width2,
    height: height2,
    shortest,
    longest,
    area: width2 * height2,
    aspect: Math.round((width2 / height2) * 1000) / 1000,
    orientation: orientationOf(width2, height2),
  };
}

/** Which edge is longer, with a 4% dead zone so a 1px difference is still square. */
export function orientationOf(width: unknown, height: unknown): Orientation {
  const w = saneSide(width);
  const h = saneSide(height);
  const ratio = w / h;
  if (Math.abs(ratio - 1) <= SQUARE_BAND) return "square";
  return ratio > 1 ? "landscape" : "portrait";
}

/**
 * The aspect bands, widest last.
 *
 * These are not decoration: `ultrawide` is where a single column of panels
 * starts looking like two islands in an ocean, and `tall` is where the hero has
 * height to spare and the chrome does not.
 */
export function aspectClassOf(box: Box): AspectClass {
  const a = box.aspect;
  if (!Number.isFinite(a) || a <= 0) return "square";
  if (a < 0.5) return "tall";
  if (a < 0.9) return "portrait";
  if (a <= 1.1) return "square";
  if (a <= 1.9) return "wide";
  if (a <= 2.6) return "ultrawide";
  return "panoramic";
}

/**
 * A 0..1 driver for "how much room does this window have", combining both axes.
 *
 * A layout that only looks at width gives a 1920×400 window the same type size
 * as a 1920×1080 one, which is the bug `hero.ts` was written to fix — one axis
 * is not the screen. The weighted form here is deliberately height-biased
 * (0.6): text that is too tall for its band is clipped, text that is merely
 * narrow is still readable, so height has to dominate the decision.
 *
 * `below` and `above` are the sizes where the driver is 0 and 1; between them it
 * is linear. Both are clamped sane, so a caller cannot invert the ramp.
 */
export function roomDriver(box: Box, below = 360, above = 1080): number {
  const lo = Math.max(1, Math.min(saneSide(below), saneSide(above)));
  const hi = Math.max(lo + 1, Math.max(saneSide(below), saneSide(above)));
  const ramp = (v: number) => Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
  return Math.round((ramp(box.width) * 0.4 + ramp(box.height) * 0.6) * 1000) / 1000;
}

/** True when the box is a handset in landscape — wide, short, and touch-first. */
export function isShortLandscape(box: Box, maxHeight = 500): boolean {
  return box.width > box.height && box.height <= Math.max(1, saneSide(maxHeight));
}

/** The box as one line — used by the probe, the debug overlay and the tests. */
export function describeBox(box: Box): string {
  return `${box.width}×${box.height} · ${aspectClassOf(box)} · ${box.orientation}`;
}
