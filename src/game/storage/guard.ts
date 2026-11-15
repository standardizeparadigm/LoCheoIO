/**
 * The two guards every persisted field goes through.
 *
 * They are here rather than in `scores.ts` because all three record kinds use
 * them, and because the difference between them is the whole point:
 *
 *   · `num()` rejects the numbers JavaScript lets you *write* but cannot
 *     render — `NaN` and `±Infinity`. It accepts any finite number.
 *   · `saneDate()` rejects finite numbers that a `Date` cannot render. A
 *     timestamp is not "any finite number": `1e308` is finite and produces
 *     «Invalid Date», `-1e15` is finite and produces a year negative thirty-one
 *     million. Both are reachable from a hand-edited save.
 *
 * Using `num()` for a timestamp is the bug this module exists to prevent, so
 * the two are kept together where the difference can be read in one place.
 */

/** A finite number, or `fallback`. Does not bound the range. */
export function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** 2100-01-01, the far edge of what a human can read on a leaderboard. */
const MAX_DATE = 4_102_444_800_000;

/**
 * A timestamp a `Date` can render, or now.
 *
 * Anything outside 1970 → 2100 becomes "now", which is what an unparseable
 * date meant before the field existed. Negative is rejected explicitly rather
 * than by the range check alone, because `-0` and small negatives are the
 * values a broken diff produces.
 */
export function saneDate(v: unknown, now = Date.now()): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return now;
  if (v < 0 || v > MAX_DATE) return now;
  return Math.round(v);
}
