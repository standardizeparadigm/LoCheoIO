/**
 * Which how-to rule to show as the day's tip.
 *
 * The start screen already owns six rule texts (`rule.N.t` / `rule.N.d`) for
 * the how-to modal. Rather than author a parallel set of "tips" and keep the
 * two in sync forever, the deck re-surfaces one existing rule per day. One
 * catalogue, two surfaces — the same reasoning as `changelogHint()` reusing
 * `tierFor()`.
 */

/** How many how-to rules exist. Kept next to the selector that uses it. */
export const RULE_COUNT = 6;

/**
 * Index of the day's tip.
 *
 * Deliberately *not* the same hash as the challenge: if both rotated on the
 * same schedule, the mode and the tip would move together every day and
 * players would learn one pairing instead of six rules. This one walks the
 * rule list with a stride coprime to 6 (5), so all six appear before any
 * repeats.
 */
export function tipIndexFor(day: number, count = RULE_COUNT): number {
  /*
   * `count <= 0` is not enough. Two values get past it and both break the
   * caller, which does `rule.${idx}.t`:
   *
   *   · `count = NaN`   → `NaN <= 0` is false, so it is accepted; the modulo
   *                       yields NaN and the key becomes `rule.NaN.t`, which
   *                       the table does not have — the tip renders empty;
   *   · `count = 5.5`   → accepted, `%` is a float remainder, and the result
   *                       is 0.5 — an index, in the sense that it is a number,
   *                       and a missing key in every other sense.
   *
   * Both are reachable: `count` defaults to RULE_COUNT but is a parameter, and
   * the test suite calls it with a computed value. Guard the *integer* case,
   * not the positive case.
   */
  if (!Number.isFinite(day) || !Number.isInteger(count) || count <= 0) return 0;
  // Stride 5 over 6 slots is coprime with 6 → a full cycle of 6 days.
  const stride = 5;
  const n = Math.trunc(day);
  const idx = ((n * stride) % count + count) % count;
  return idx;
}
