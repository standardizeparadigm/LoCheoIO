/**
 * Named size tiers — the vocabulary every adaptive decision shares.
 *
 * WHY NAMES INSTEAD OF NUMBERS
 * ----------------------------
 * `planMenuLayout()` already answers "is this window short enough to lose the
 * ticker", but nothing answers "what *kind* of screen is this". Without that
 * vocabulary each new adaptive rule invents its own thresholds: `hero.ts` has
 * `1024`, `breakpoints.ts` has `300`, `layout/metrics.ts` has `840` and `520`.
 * Four modules, four opinions about a 900×600 window, and no single place that
 * can say what the window is.
 *
 * A tier is that place. It is *derived* from the normalised box, never passed
 * in, so it cannot disagree with the size it describes.
 *
 * THE AXES
 * --------
 * Tiers are decided by the **shortest side**, not the width. A 1280×600 window
 * is not "large": it has a laptop's width and a phone's height, and treating it
 * by width is the exact mistake `hero.ts` exists to prevent. The shortest side
 * is the one that runs out first.
 *
 * `area` breaks the tie at the top: a 1920×1080 monitor and a 3000×1080
 * super-wide are both "xl" by their short side, but only the second has room
 * for a wider hero band.
 */

import { boxOf, type Box } from "./viewport";

/** The six sizes this UI is designed for. */
export type SizeTier = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/** Ordered smallest to largest — the order every fallback walks. */
export const TIERS: readonly SizeTier[] = ["xs", "sm", "md", "lg", "xl", "xxl"];

/** Lower bound of each tier, on the **shortest** side, in CSS px. */
export const TIER_FLOORS: Readonly<Record<SizeTier, number>> = {
  xs: 0,
  sm: 360,
  md: 480,
  lg: 720,
  xl: 1024,
  xxl: 1440,
};

/**
 * The tier for a box.
 *
 * Every edge is inclusive at its floor and exclusive at the next one, so a
 * 720px-tall window is `lg` and 719 is `md`. One rule, one direction — the
 * opposite convention in two places is how a sweep finds a window with no tier
 * at all.
 */
export function tierFor(box: Box): SizeTier {
  const s = box.shortest;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const tier = TIERS[i];
    if (s >= TIER_FLOORS[tier]) return tier;
  }
  return "xs";
}

/** Convenience: the tier for a raw width/height pair. */
export function tierOf(width: unknown, height: unknown): SizeTier {
  return tierFor(boxOf(width, height));
}

/** How far up the ladder a tier is, 0 (xs) to 5 (xxl). */
export function tierRank(tier: SizeTier): number {
  const i = TIERS.indexOf(tier);
  return i < 0 ? 0 : i;
}

/** The next tier up, or the same one at the top. */
export function bigger(tier: SizeTier): SizeTier {
  return TIERS[Math.min(TIERS.length - 1, tierRank(tier) + 1)];
}

/** The next tier down, or the same one at the bottom. */
export function smaller(tier: SizeTier): SizeTier {
  return TIERS[Math.max(0, tierRank(tier) - 1)];
}

/** True when `a` is at least as large as `b`. */
export function atLeast(a: SizeTier, b: SizeTier): boolean {
  return tierRank(a) >= tierRank(b);
}

/** A multiplier that grows with the tier — 0.82 at `xs`, 1.3 at `xxl`. */
export function tierScale(tier: SizeTier): number {
  return Math.round((0.82 + tierRank(tier) * 0.096) * 1000) / 1000;
}

/**
 * What kind of screen this is, for documentation and the debug overlay.
 *
 * Deliberately separate from the tier: a 375×812 phone and a 812×375 phone are
 * both `sm`, and only the second is a `handheld` in landscape — the case where
 * rows must grow to 44px and the ticker has to go.
 */
export type DeviceClass = "handset" | "tablet" | "laptop" | "desktop" | "cinema";

/** Classify a box by area and aspect, for docs and the HUD. */
export function deviceClass(box: Box): DeviceClass {
  if (box.area >= 3_500_000) return "cinema"; // ≥ ~2560×1440
  if (box.area >= 1_600_000) return "desktop"; // ≥ ~1600×1000
  if (box.area >= 800_000) return "laptop"; // ≥ ~1280×720
  if (box.area >= 300_000) return "tablet";
  return "handset";
}

/** One-line summary used by `describeAdaptive()` and the tests. */
export function describeTier(tier: SizeTier): string {
  switch (tier) {
    case "xs":
      return "xs — wordmark-first, every economy on";
    case "sm":
      return "sm — phone, tight rows, no rich hints";
    case "md":
      return "md — small tablet, compact chrome";
    case "lg":
      return "lg — laptop, the reference layout";
    case "xl":
      return "xl — desktop, side-by-side hero";
    case "xxl":
      return "xxl — cinema, capped scale with more air";
  }
}
