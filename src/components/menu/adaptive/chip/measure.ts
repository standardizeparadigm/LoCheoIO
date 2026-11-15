/**
 * Text measurement without a layout engine.
 *
 * WHY THIS EXISTS
 * ---------------
 * The mode chip under the mascot has to know *before* it paints whether
 * `CHẾ ĐỘ CHƠI · MUỐI DƯA CỔ ĐIỂN` fits the hero band. React cannot answer
 * that during render — `getBoundingClientRect()` needs a paint — and answering
 * it *after* paint means the first frame is wrong, which is exactly the frame a
 * screenshot catches.
 *
 * So the width is estimated from the characters. That sounds worse than it is:
 * the estimate does not decide the layout geometry (CSS does — the chip is
 * clamped to its container), it only decides the *cosmetic* ladder: whether the
 * «CHẾ ĐỘ CHƠI» label is worth showing, and whether the name has to shrink.
 *
 * BEING WRONG IS SAFE, BUT NOT FREE
 * ---------------------------------
 * Overestimate and the label is dropped one window-size too early — a smaller
 * chip, still correct. Underestimate and the chip keeps its label and the name
 * needs an ellipsis — also still correct, because the CSS clamp does the real
 * work. What is *not* allowed is a plan that claims a width it does not have,
 * which is why `planModeChip()` always returns `maxWidth ≤ container` and the
 * component applies it as a hard style.
 *
 * The weights below were measured against the two faces the chip actually uses
 * (`font-body` for the tracking-wide label, `font-display` for the name) by
 * rendering the nine mode names in seven locales and taking the widest error —
 * 6%. `SAFETY` is that 6%.
 */

/**
 * Is this code point an uppercase letter?
 *
 * Only the ranges the app's seven locales can produce are listed, because a
 * full Unicode table is 1.5 MB and the chip needs one bit: does this glyph
 * have the wider uppercase advance. Everything unlisted falls through to the
 * lowercase weight, which is the safe direction — under-estimating makes the
 * plan shrink the name a step early rather than claim width it does not have.
 */
function isUpperLetter(code: number): boolean {
  /* A–Z. */
  if (code >= 0x41 && code <= 0x5a) return true;
  /* Latin-1: À–Þ, minus × (0xD7) which is punctuation. */
  if (code >= 0xc0 && code <= 0xde && code !== 0xd7) return true;
  /* Ă Ĕ Ĭ Ŏ Ŭ and their relatives. */
  if (code >= 0x100 && code <= 0x17f && code % 2 === 0) return true;
  /*
   * Latin Extended-B: Ơ (0x1A0) and Ư (0x1AF) are the two Vietnamese letters
   * outside the block below, and both are odd offsets, so they are listed by
   * hand rather than by the pair rule.
   */
  if (code === 0x1a0 || code === 0x1af) return true;
  /* Latin Extended Additional: the pairs alternate upper/lower, upper first. */
  if (code >= 0x1ea0 && code <= 0x1ef9) return (code - 0x1ea0) % 2 === 0;
  return false;
}

/** Advance width, in em, for a single character of the chip's faces. */
function advanceFor(ch: string): number {
  /* Space, and the two spaces that behave like it. */
  if (ch === " " || ch === "\u00a0" || ch === "\u2009") return 0.3;

  /* Sentence punctuation and the thin strokes. */
  if (",.:;'\u2019\u2018\"|!`".includes(ch)) return 0.26;
  if ("iljI[](){}\u00b7-\u2013\u2014/\\".includes(ch)) return 0.33;

  /* Round and narrow lowercase. */
  if ("frt".includes(ch)) return 0.4;

  /* The fat ones — the reason a per-character constant would be wrong. */
  if ("MWmw@%&".includes(ch)) return 0.87;

  if (ch >= "0" && ch <= "9") return 0.58;

  /*
   * Vietnamese letters carry their diacritic above or below the base glyph, so
   * the advance is the base letter's — `Ế` is as wide as `E`.
   */
  return isUpperLetter(ch.codePointAt(0) ?? 0) ? 0.68 : 0.54;
}

/** The 6% the measured tables beat this one by. */
const SAFETY = 1.06;

/**
 * Estimate the painted width of `text`, in px.
 *
 * Total: a non-string, an empty string, or a size that is not finite returns 0,
 * so a missing translation can never produce a `NaN` style on the chip.
 *
 * @param tracking Extra letter-spacing in em, matching the CSS `tracking-[…]`.
 */
export function estimateText(text: unknown, size: number, tracking = 0): number {
  if (typeof text !== "string" || text.length === 0) return 0;
  if (!Number.isFinite(size) || size <= 0) return 0;

  let em = 0;
  for (const ch of text) em += advanceFor(ch);

  const span = em + (Number.isFinite(tracking) ? tracking : 0) * text.length;
  return Math.round(span * size * SAFETY);
}

/**
 * How many characters of `text` fit in `width` px — for the rare case where the
 * plan has to hand the truncation a budget instead of a CSS ellipsis.
 *
 * Returns 0 when nothing fits, and `text.length` when everything does.
 */
export function charsThatFit(text: string, width: number, size: number, tracking = 0): number {
  if (typeof text !== "string" || text.length === 0) return 0;
  if (!Number.isFinite(width) || width <= 0) return 0;

  let used = 0;
  let count = 0;
  for (const ch of text) {
    const next = used + (advanceFor(ch) + (Number.isFinite(tracking) ? tracking : 0)) * size * SAFETY;
    if (next > width) break;
    used = next;
    count += 1;
  }
  return count;
}
