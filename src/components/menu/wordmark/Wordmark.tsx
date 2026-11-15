/**
 * The `LỌ / CHÉO` lockup.
 *
 * WHY IT IS ITS OWN COMPONENT
 * ---------------------------
 * It was 30 lines inline in `StartScreen`, and it carried two of the four bugs
 * this patch has fixed: the missing `nặng` (covered by the gold band of the
 * line below) and the oversized `CHÉO` (hiding `LỌ`). A component with a name
 * and a test file is easier to keep honest than a block in the middle of a
 * 300-line screen.
 *
 * The two invariants it owns:
 *
 *   1. **`CHÉO` is never larger than `LỌ`.** The sizes come from `scale.ts`,
 *      which derives the second from the first; `tests/wordmark-scale.test.ts`
 *      sweeps every width.
 *   2. **Nothing is painted behind `CHÉO`.** The gold band of round 2 was a
 *      `::before` box and read as a rectangle around the word («cái phần vuông
 *      vuông»). It is gone; the only motion left is `lc-gold-breathe`, which
 *      animates a text-shadow and therefore has no edges.
 *
 * The `nặng` under `Ọ` survives because nothing overlaps it: `wordmark-lo`
 * keeps the descender inside its own line box, and the line below starts where
 * that box ends.
 */
import { CHEO_CLAMP, LO_CLAMP, toClass } from "./scale";

export function Wordmark({
  /** The two-letter line, already localised (`LỌ`). */
  lo,
  /** The brand line, already localised (`CHÉO`). */
  cheo,
  /** The screen-reader label for the whole lockup. */
  label,
}: {
  lo: string;
  cheo: string;
  label: string;
}) {
  return (
    <h1
      /*
       * `leading-[0.9]`, not a utility invented at the call site.
       *
       * This class was LOST when the lockup moved out of `StartScreen` into this
       * component: `src/styles/wordmark.css` and `src/index.css` both describe
       * the h1 as `leading-[0.82]`, and both keep explaining the descender
       * problem in terms of it — but the h1 itself carried no line-height at
       * all. `.wordmark-lo > span` still had its own `0.92`, while
       * `.text-shimmer` inherited the browser default (~1.2em), so the lockup
       * rendered ~20px taller than every measurement in the repo assumed.
       *
       * 20px is not cosmetic here. The hero is a fixed-height band and the
       * screen is `justify-center`, so an over-tall lockup spills *equally* up
       * and down — and the top of `LỌ` is the first thing clipped. That is the
       * round-5 report: the wordmark cut in half at the top edge.
       */
      className="wordmark font-display leading-[0.9] select-none"
      aria-label={label}
    >
      {/*
        `fontSize` is an inline style, not an arbitrary Tailwind class. Tailwind
        generates classes by scanning source text, and `text-[${…}]` built from a
        variable produces a class that does not exist in the generated
        stylesheet — the element then renders at the browser default size. The
        clamp values are already data; passing them straight through is both
        correct and honest about where the size comes from.
      */}
      <span
        className="wordmark-lo text-clay-100"
        style={{ fontSize: toClass(LO_CLAMP), textShadow: "5px 5px 0 #b81f22, 10px 10px 0 rgba(6,26,26,0.55)" }}
      >
        <span>{lo}</span>
      </span>
      <span className="text-shimmer block pl-[0.06em]" style={{ fontSize: toClass(CHEO_CLAMP) }}>
        {cheo}
      </span>
    </h1>
  );
}
