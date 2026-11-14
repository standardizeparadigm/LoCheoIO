/**
 * A daily challenge, derived rather than stored.
 *
 * WHY DERIVED
 * -----------
 * A player's "challenge of the day" has to be (a) the same all day, (b)
 * different tomorrow, and (c) identical for every player in the same day —
 * without a server, without a save file, and without a fetch. A pure function
 * of the date gives all three for free, and gives them offline.
 *
 * The day is measured in **local** time on purpose: a challenge that flips at
 * 07:00 local would be a bug report. `new Date(y, m, d)` builds local
 * midnight, and the integer below is a stable day number in that frame.
 *
 * Not cryptographic. Nobody is defending a prize here; the goal is that the
 * pick is not obviously the same every day, which a 32-bit mix achieves.
 */

/** One playable challenge for the current local day. */
export interface DailyChallenge {
  /** The mode the challenge is played in. */
  mode: string;
  /** Target score to reach. */
  target: number;
  /** Day number (days since the epoch, local) — stable within a day. */
  day: number;
}

/**
 * Local day number. 1970-01-01 in the *local* frame is day 0.
 *
 * `Date.UTC` is deliberately avoided: using UTC day boundaries means the
 * challenge changes at 07:00 in Vietnam, which players read as "it changed
 * twice today".
 */
export function localDayNumber(date: Date): number {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Round, not floor: a DST shift makes the local midnight differ by an hour
  // from the UTC-framed epoch, and floor() would then drop a whole day.
  return Math.round(local.getTime() / 86_400_000);
}

/**
 * A small integer mixer (xorshift-style). Returns an unsigned 32-bit value.
 *
 * `Math.abs(seed) % n` is not good enough: consecutive day numbers produce
 * consecutive outputs, so the "random" mode would walk through the mode list
 * in order and a player would see the same ramp every week.
 */
export function mix(n: number): number {
  let x = (n | 0) + 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  x ^= x >>> 15;
  return x >>> 0;
}

/**
 * The challenge for a given day.
 *
 * `modeIds` is passed in, never imported: the caller owns the mode catalogue,
 * so adding a tenth mode widens the rotation automatically and no test has to
 * be edited. An empty catalogue is not a valid game state, but returning a
 * well-formed challenge for it beats throwing inside a render.
 */
export function challengeFor(date: Date, modeIds: readonly string[]): DailyChallenge {
  const day = localDayNumber(date);
  const hashed = mix(day);
  const mode = modeIds.length ? modeIds[hashed % modeIds.length] : "classic";
  // 1 200 → 3 600, in steps of 100: a round number a player can aim at, and a
  // spread wide enough that yesterday's target is not today's.
  const target = 1_200 + (Math.trunc(hashed / 7) % 25) * 100;
  return { mode, target, day };
}

/**
 * Whole days between the challenge day and today — used to word the caption
 * ("hôm nay" vs. nothing at all).
 *
 * Kept here rather than in the component so the comparison is tested: a
 * challenge that says "today" while showing yesterday's is worse than no
 * label at all.
 */
export function isToday(challengeDay: number, date: Date): boolean {
  return challengeDay === localDayNumber(date);
}
