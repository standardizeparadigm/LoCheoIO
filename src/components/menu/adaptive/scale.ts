/**
 * The arithmetic every adaptive size is built from.
 *
 * WHY THIS EXISTS
 * ---------------
 * The adaptive folder had one shape of decision — a threshold — and thresholds
 * do not compose. `HEIGHT_FOR_BADGE_ROW = 232` is a yes/no question, so a
 * 231px band loses the badge row entirely and a 233px band gains it whole. The
 * user noticed exactly that at the boundary: the hero stepped instead of
 * breathing.
 *
 * What a screen actually wants is a *ramp*: the badge row is 90% as tall at 233
 * as at 300, and the type shrinks with it. That is a number, not a flag, and it
 * is what this module produces.
 *
 * Everything here is pure, total, and finite for every input — including `NaN`,
 * `Infinity`, a negative range and an inverted one. The release's most repeated
 * bug is a clamp that only clamps the case the author thought of, so each
 * function below names the case that used to leak.
 */

/** A closed interval. Values that arrive inverted are repaired, not trusted. */
export interface Span {
  min: number;
  max: number;
}

/** A 0..1 position, clamped, with `NaN` read as the floor. */
export function unit(t: unknown): number {
  if (typeof t !== "number" || Number.isNaN(t)) return 0;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t;
}

/**
 * `t` mapped from `[from, to]` into `[0, 1]`.
 *
 * The inverted case is real: `ramp(box.height, 1080, 320)` is a perfectly
 * natural reading of "smaller is bigger", and the first draft of this module
 * returned `0` for every input because `(v - 1080) / (320 - 1080)` is positive
 * and the clamp is at 0. Inverting is handled by swapping the ends rather than
 * by returning a negative, so `ramp` is monotonic in the direction asked for.
 */
export function ramp(value: unknown, from: number, to: number): number {
  const v = typeof value === "number" && Number.isFinite(value) ? value : from;
  const a = Number.isFinite(from) ? from : 0;
  const b = Number.isFinite(to) ? to : a + 1;
  if (a === b) return v >= b ? 1 : 0;
  return unit((v - a) / (b - a));
}

/** Linear interpolation between the ends of `span`, at `t` in 0..1. */
export function fluid(span: Span, t: unknown): number {
  const lo = Number.isFinite(span.min) ? span.min : 0;
  const hi = Number.isFinite(span.max) ? span.max : lo;
  return lo + (hi - lo) * unit(t);
}

/**
 * The ends repaired, so `min <= max` always.
 *
 * A `Span` literal typed by hand is the easiest place in the codebase to write
 * `{ min: 14, max: 9 }` and get a size that is 9 at both ends with no error
 * anywhere.
 */
export function ordered(span: Span): Span {
  const a = Number.isFinite(span.min) ? span.min : 0;
  const b = Number.isFinite(span.max) ? span.max : a;
  return a <= b ? { min: a, max: b } : { min: b, max: a };
}

/** `value` clamped into `span` (ends repaired first). */
export function within(value: unknown, span: Span): number {
  const { min, max } = ordered(span);
  const v = typeof value === "number" && Number.isFinite(value) ? value : min;
  return v < min ? min : v > max ? max : v;
}

/**
 * `span` multiplied by `factor`, clamped to a sane multiplier.
 *
 * The first draft of this helper read `Math.max(floor > 0 ? 0 : -Infinity, factor)`,
 * which is a comparison against 0 dressed up as a floor: every factor, including
 * a sane 1.2, was accepted, and `Infinity` sailed through to produce
 * `font-size: Infinitypx`. The multiplier is now bounded to `[0.25, 4]` — four
 * times any size this UI has ever used — so a bad factor shrinks or grows a size
 * rather than destroying the declaration.
 */
export function scaled(span: Span, factor: unknown): Span {
  const f =
    typeof factor === "number" && Number.isFinite(factor)
      ? Math.min(4, Math.max(0.25, factor))
      : 1;
  const { min, max } = ordered(span);
  return { min: Math.abs(min) * f, max: Math.abs(max) * f };
}

/** Half-pixel rounding — the only rounding a CSS size needs. */
export function half(px: unknown): number {
  const v = typeof px === "number" && Number.isFinite(px) ? px : 0;
  return Math.round(v * 2) / 2;
}

/**
 * Round to a step, never below `floor`.
 *
 * Used for type sizes: a font size that wobbles by 0.1px every resize event
 * repaints the whole screen for no visible reason. Quantising to 0.5px means a
 * drag produces a handful of distinct layouts instead of hundreds.
 */
export function quantised(px: unknown, step = 0.5, floor = 0): number {
  const v = typeof px === "number" && Number.isFinite(px) ? px : floor;
  const s = Number.isFinite(step) && step > 0 ? step : 0.5;
  return Math.max(floor, Math.round(v / s) * s);
}

/**
 * A size that never drops below a legibility floor and never exceeds a cap.
 *
 * `floor` is not decoration. 8px is the smallest label this project paints
 * (the panel stat strip), and a layout that scales a label to 6px to save 2px
 * of band has made the screen worse, not better. The floor wins over the cap:
 * if they contradict, legibility is the requirement.
 */
export function legible(px: unknown, floor = 9, cap = Number.POSITIVE_INFINITY): number {
  const lo = Number.isFinite(floor) ? floor : 9;
  const hi = Number.isFinite(cap) ? Math.max(lo, cap) : lo;
  const v = typeof px === "number" && Number.isFinite(px) ? px : lo;
  return half(Math.min(hi, Math.max(lo, v)));
}

/**
 * The size of a block of text when it has to fit a declared height.
 *
 * `lineHeight` is the CSS line box as a multiple of the font size; `lines` is
 * how many lines the block is allowed. The answer is the largest font size that
 * fits, capped by `cap`.
 *
 * This is the function the wordmark uses to shrink instead of being clipped: a
 * 150px lockup in a 120px band is a clipped `LỌ`, while three 40px lines in the
 * same band are a smaller logo that reads.
 */
export function fitText(height: unknown, lines: number, lineHeight = 1, cap = Number.POSITIVE_INFINITY): number {
  const h = typeof height === "number" && Number.isFinite(height) ? Math.max(0, height) : 0;
  const n = Number.isFinite(lines) && lines > 0 ? lines : 1;
  const lh = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 1;
  return legible(h / (n * lh), 1, cap);
}

/** A percentage, 0..100, as a CSS-ready string. */
export function percent(t: unknown, digits = 0): string {
  const v = unit(t) * 100;
  return `${v.toFixed(Math.max(0, Math.min(3, Math.trunc(digits))))}%`;
}
