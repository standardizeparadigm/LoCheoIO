/**
 * The adaptive layer's public surface.
 *
 * Two ideas live here and they are deliberately separate:
 *
 *   `breakpoints.ts`  the *numbers* — when each layout becomes possible
 *   `hero.ts`         the *decision* — which layout a given band gets
 *
 * Everything else in the app imports from this file, never from the two
 * modules directly, so a test can mock the whole decision surface at once and a
 * refactor inside it stays inside it.
 */
export type { HeroInput, HeroLayout } from "./hero";
export {
  BADGE_ROW_WIDTH,
  CHIP_OVERHANG,
  heroContainerWidth,
  heroContentHeight,
  heroLayout,
  heroRowFits,
  lockupWidth,
  MASCOT_ROW,
  MASCOT_ROW_HALO,
  MASCOT_STACKED,
  ROW_GAP,
  STACK_GAP,
} from "./hero";
export {
  HEIGHT_FOR_BADGE_ROW,
  HEIGHT_FOR_HALO,
  HEIGHT_FOR_SIDE_BY_SIDE,
  WIDTH_FOR_SIDE_BY_SIDE,
} from "./breakpoints";
