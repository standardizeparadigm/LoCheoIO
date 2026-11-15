/**
 * The hero's decoration, as data.
 *
 * v1.1.7's hero was the wordmark, the jar, and a lot of empty space. The
 * report asked for something to look at: "chớ có mỗi chữ Lọ Chéo và chiếc lọ
 * gốm thì ít quá" — don't leave it as just the name and a jar.
 *
 * Everything decorative on the hero is declared here rather than spelled out
 * in JSX, for one reason: it has to be *positionable without overlapping the
 * wordmark*. A file of `{x, y, size, delay}` records can be laid out on a
 * grid, checked for collisions, and reordered by eye. A file of nested divs
 * cannot.
 *
 * Coordinates are percentages of the hero box, so the same set works at
 * 1280×720 and 1920×1080 without a second table.
 */

/** What a decoration is drawn as. */
export type DecorKind =
  | "star"
  | "spark"
  | "ring"
  | "bubble"
  | "chili"
  | "leaf"
  | "fly"
  | "fish-sauce";

/** One floating decoration. */
export interface Decor {
  /** Stable id — React key and test id. */
  id: string;
  kind: DecorKind;
  /** Left edge, percent of hero width. */
  x: number;
  /** Top edge, percent of hero height. */
  y: number;
  /** Rendered size, px at 1×. */
  size: number;
  /** Animation start offset, seconds — keeps them out of phase. */
  delay: number;
  /** Float duration, seconds. */
  dur: number;
  /** Base opacity 0–1. Kept low: decoration must never compete with the title. */
  opacity: number;
}

/**
 * The hero decoration set.
 *
 * Laid out in two bands — above and below the wordmark — plus the far right
 * edge, because the middle-left is where `LỌ CHÉO` sits and the centre-right
 * is where the jar sits. Anything inside those two rectangles would land on
 * top of a glyph.
 *
 * Deliberately 14 items, not 40: past about twenty the hero reads as busy,
 * and the reduced-motion fallback becomes a confetti problem.
 */
export const HERO_DECOR: readonly Decor[] = [
  // ---- upper band, clear of the wordmark's cap height ----
  { id: "d01", kind: "star", x: 6, y: 6, size: 14, delay: 0.0, dur: 6.5, opacity: 0.55 },
  { id: "d02", kind: "spark", x: 22, y: 3, size: 10, delay: 1.4, dur: 5.2, opacity: 0.7 },
  { id: "d03", kind: "ring", x: 52, y: 2, size: 26, delay: 0.6, dur: 9.0, opacity: 0.28 },
  { id: "d04", kind: "star", x: 64, y: 4, size: 11, delay: 2.2, dur: 7.1, opacity: 0.6 },
  { id: "d05", kind: "spark", x: 88, y: 8, size: 13, delay: 0.9, dur: 5.8, opacity: 0.62 },

  // ---- far right edge, vertical scatter ----
  { id: "d06", kind: "bubble", x: 94, y: 26, size: 12, delay: 1.8, dur: 8.4, opacity: 0.4 },
  { id: "d07", kind: "chili", x: 92, y: 48, size: 18, delay: 0.3, dur: 7.6, opacity: 0.5 },
  { id: "d08", kind: "leaf", x: 95, y: 66, size: 16, delay: 2.6, dur: 6.9, opacity: 0.45 },

  // ---- lower band, below the tagline ----
  { id: "d09", kind: "fly", x: 10, y: 78, size: 15, delay: 1.1, dur: 5.5, opacity: 0.5 },
  { id: "d10", kind: "bubble", x: 27, y: 88, size: 9, delay: 0.4, dur: 7.9, opacity: 0.35 },
  { id: "d11", kind: "star", x: 44, y: 82, size: 12, delay: 3.0, dur: 6.2, opacity: 0.5 },
  { id: "d12", kind: "fish-sauce", x: 57, y: 90, size: 14, delay: 1.6, dur: 8.1, opacity: 0.42 },
  { id: "d13", kind: "spark", x: 72, y: 80, size: 10, delay: 2.4, dur: 5.9, opacity: 0.6 },
  { id: "d14", kind: "ring", x: 80, y: 92, size: 22, delay: 0.8, dur: 10.0, opacity: 0.22 },
];

/** How many of each kind — used by the test to prove the set is varied. */
export function decorCounts(): Record<DecorKind, number> {
  const out = {
    star: 0,
    spark: 0,
    ring: 0,
    bubble: 0,
    chili: 0,
    leaf: 0,
    fly: 0,
    "fish-sauce": 0,
  } satisfies Record<DecorKind, number>;
  for (const d of HERO_DECOR) out[d.kind] += 1;
  return out;
}

/**
 * Two decorations overlap if their boxes intersect by more than a couple of
 * pixels. Used by the test to keep the set from turning into a pile, and by
 * anyone adding a fifteenth item.
 */
export function decorOverlap(a: Decor, b: Decor, boxW = 1200, boxH = 400): boolean {
  const ax = (a.x / 100) * boxW;
  const ay = (a.y / 100) * boxH;
  const bx = (b.x / 100) * boxW;
  const by = (b.y / 100) * boxH;
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  const needX = (a.size + b.size) / 2 - 2;
  const needY = (a.size + b.size) / 2 - 2;
  return dx < needX && dy < needY;
}

/**
 * The rectangle the wordmark occupies, in the same percentage space. Decor
 * inside it would sit on a glyph, which is the one thing decoration must not
 * do. Kept generous: the display face is wide.
 */
export const WORDMARK_ZONE = { x: 0, y: 10, w: 62, h: 62 } as const;

/** Is a decoration inside the wordmark's rectangle? */
export function insideWordmark(d: Decor): boolean {
  return (
    d.x + d.size / 12 > WORDMARK_ZONE.x &&
    d.x < WORDMARK_ZONE.x + WORDMARK_ZONE.w &&
    d.y + d.size / 4 > WORDMARK_ZONE.y &&
    d.y < WORDMARK_ZONE.y + WORDMARK_ZONE.h
  );
}
