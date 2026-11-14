/**
 * The size ratio between the two lines of the wordmark.
 *
 * WHY THIS IS A MODULE AND NOT TWO TAILWIND CLASSES
 * -------------------------------------------------
 * The report's round-4 note is «chữ chéo thì quá to, che chữ lọ luôn rồi» —
 * CHÉO was hiding LỌ. The cause was not one bad number; it was that the two
 * lines were sized *independently*, so nothing enforced a relationship between
 * them. At 1280px the old pair was 89.6px against 128px: `CHÉO` was 1.43× the
 * size of `LỌ`, and because it has six glyphs instead of two its cap height
 * reached straight up into the line above.
 *
 * Two `clamp()` strings can drift back apart the moment someone edits one and
 * not the other. A pair of numbers with a test is harder to drift: the ratio is
 * asserted at every viewport width a player can have, so the failure mode this
 * round is about cannot come back silently.
 *
 * The numbers are still CSS `clamp(min, slope vw, max)` values — they are just
 * derived here, from one declared intent: `CHÉO` must always be the *smaller*
 * line, while staying large enough to carry the brand.
 */

/** One `clamp()` triple, in CSS units. */
export interface Clamp {
  /** Lower bound, rem. */
  min: number;
  /** Viewport-proportional slope, vw. */
  slope: number;
  /** Upper bound, rem. */
  max: number;
}

/**
 * `LỌ` — the two-letter line, and the one that sets the size of the lockup.
 *
 * These are the values the project has used since v1.0; they are the anchor, so
 * the second line is specified *relative* to them rather than independently.
 */
export const LO_CLAMP: Clamp = { min: 2.6, slope: 9.5, max: 5.6 };

/**
 * How large `CHÉO` may be, as a fraction of `LỌ`.
 *
 * 0.82 is chosen so the six-letter word still reads as the dominant brand line
 * — it is the word people say — without its cap height climbing into `LỌ`'s
 * descender well. Below ~0.75 the lockup looks accidental, as if `CHÉO` were a
 * subtitle.
 */
export const CHEO_RATIO_MAX = 0.82;

/**
 * `CHÉO`, derived from `LỌ` and the ratio.
 *
 * `slope` is scaled by the same ratio: a smaller ceiling with a *larger* slope
 * still lets the short word overtake the long one in the middle of the range.
 * That is not hypothetical — the first attempt at this fix used a 0.82 ceiling
 * with a 1.09× slope and `CHÉO` was bigger than `LỌ` from 375px to 768px.
 */
export const CHEO_CLAMP: Clamp = {
  /*
   * The floor is a little *above* LỌ's 0.82× (2.13rem → 2.9rem) because on a
   * 320px phone a 2.13rem `CHÉO` under a 2.6rem `LỌ` reads as a caption. The
   * brand line has to stay legible at the narrowest width; the ceiling is
   * where the ratio actually has to hold, because that is where the old bug
   * appeared.
   */
  /*
   * 2.1rem is LỌ's floor (2.6) × 0.81, *below* the ceiling ratio on purpose: at
   * the narrowest widths the slope has not taken over yet, so the floor is
   * what decides, and a floor of 2.9rem made `CHÉO` 12% larger than `LỌ` on
   * every phone — the exact bug this module exists to prevent, in the one place
   * the ratio test was not looking. (Caught by sweeping down to 320px.)
   */
  min: 2.1,
  /*
   * 8.4vw: slow enough that `CHÉO` never overtakes `LỌ`'s 9.5vw slope, fast
   * enough that it climbs off its floor early instead of looking pinched.
   */
  slope: 8.4,
  /* 5.6 × 0.82 = 4.59 → 4.6rem. This is the ratio the test checks. */
  max: round1(LO_CLAMP.max * CHEO_RATIO_MAX),
};

/**
 * The size a clamp resolves to at a given viewport width, in rem.
 *
 * Exported because the tests assert the *ratio between resolved sizes*, not
 * the three numbers. Asserting numbers would let a rewrite pass while breaking
 * the thing the numbers exist for.
 */
export function resolve(clamp: Clamp, viewportWidth: number): number {
  /*
   * UNITS: this returns **pixels**, and a first draft got that wrong.
   *
   * `slope` is vw — a percentage of the viewport in px. `min` and `max` are
   * rem. The first version computed `slope/100 * width` (px) and compared it
   * straight against the rem bounds, which is comparing 72.96 with 5.6; the
   * function then reported the ceiling at *every* width above ~60px and the
   * ratio test passed for the wrong reason.
   *
   * Converting the bounds to px first makes the comparison meaningful. The
   * 16px root is the same assumption CSS makes; it is not configurable here
   * because a browser's root size can be changed by the *player*, and a
   * layout that silently depends on it is a different bug.
   */
  if (Number.isNaN(viewportWidth)) return clamp.min * ROOT_PX;
  const minPx = clamp.min * ROOT_PX;
  const maxPx = clamp.max * ROOT_PX;
  const sloping = (clamp.slope / 100) * viewportWidth;
  return Math.min(maxPx, Math.max(minPx, sloping));
}

/** The CSS root font size the clamp() bounds are written against. */
export const ROOT_PX = 16;

/**
 * The two lines resolved at one width, with the ratio between them.
 *
 * `safe` is false when `CHÉO` is at or above `LỌ` — the exact condition the
 * report complains about. `tests/wordmark-scale.test.ts` asserts `safe` is true
 * for every width from 320 to 3840.
 */
export function lockupAt(viewportWidth: number): {
  /** Resolved font size of `LỌ`, px. */
  lo: number;
  /** Resolved font size of `CHÉO`, px. */
  cheo: number;
  /** `cheo / lo` — below 1 is the invariant. */
  ratio: number;
  /** True when `CHÉO` is strictly smaller than `LỌ`. */
  safe: boolean;
} {
  const lo = resolve(LO_CLAMP, viewportWidth);
  const cheo = resolve(CHEO_CLAMP, viewportWidth);
  return { lo, cheo, ratio: lo === 0 ? 0 : cheo / lo, safe: cheo < lo };
}

/** Render a `Clamp` as the Tailwind class fragment the markup uses. */
export function toClass(clamp: Clamp): string {
  return `clamp(${clamp.min}rem, ${clamp.slope}vw, ${clamp.max}rem)`;
}

/** One decimal place, without the floating-point dust `0.1 + 0.2` leaves. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
