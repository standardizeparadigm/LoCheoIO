/**
 * Every text size on the start screen, derived from the window.
 *
 * WHAT THIS REPLACES
 * ------------------
 * Type was sized in three unrelated ways:
 *
 *   the wordmark   two CSS `clamp()` values driven by **width only**
 *   panel rows     Tailwind `text-[11px]` and `text-[9px]` — constants
 *   badges, HUD    more `text-[9px]`, plus a `sm:` variant here and there
 *
 * So a 1920×820 window drew 89.6px of `LỌ` in a 452px band (fine) and a
 * 1280×500 window drew the same 89.6px in a 300px band (not fine), because width
 * was the only input. The wordmark's own scale module fixed the *ratio* between
 * the two lines; this file adds the missing axis.
 *
 * RULES, IN ORDER OF PRIORITY
 * ---------------------------
 *  1. **Legibility floor.** No label is ever smaller than it was yesterday. A
 *     layout that buys 2px of hero by shrinking a hint to 7px has made the
 *     screen worse.
 *  2. **The band wins over the width.** The lockup is capped by the height the
 *     plan actually gave the hero (`scene / 1.68`, the two-line lockup's real
 *     box), so short windows shrink the logo instead of clipping it.
 *  3. **Ratios are preserved.** `CHÉO` is always `LO * CHEO_RATIO_MAX`, at every
 *     size, including the ones the cap produces.
 *  4. **Ramps, not steps.** Sizes move continuously with `roomDriver()`, so a
 *     resize drag produces a smooth change instead of a jump at 840px.
 *
 * The whole table is a pure function of `{ box, plan }`, so `tests/adaptive-type
 * .test.ts` can sweep two thousand viewports and assert floor, ceiling, order
 * and finiteness for all of them.
 */

import {
  CHEO_RATIO_MAX,
  LOCKUP_BOX_RATIO,
  MAX_LOCKUP_PX,
  MIN_LOCKUP_PX,
  lockupMaxForBand,
  resolve,
  LO_CLAMP,
} from "../wordmark/scale";
import type { MenuPlan } from "../layout/fit";
import { fluid, legible } from "./scale";
import { tierFor, tierScale, type SizeTier } from "./tiers";
import { roomDriver, type Box } from "./viewport";

/** Every size the start screen, the HUD and the modals paint, in px. */
export interface TypeScale {
  /** «ARCADE · v1.1.8» line above the lockup. */
  eyebrow: number;
  /** The blinking «LIVE» chip. */
  liveBadge: number;
  /** `LỌ`. */
  lockupLo: number;
  /** `CHÉO`. */
  lockupCheo: number;
  /** The rotated «HŨ DƯA ĐẠI CHIẾN» plate. */
  badgePlate: number;
  /** «KỶ LỤC 12 345». */
  record: number;
  /** `GAME` / `THÔNG TIN` header strip. */
  panelHeader: number;
  /** A row's label. */
  rowLabel: number;
  /** A row's hint line. */
  rowHint: number;
  /** A panel's one-line stat footer. */
  statFooter: number;
  /** The scrolling ingredient strip. */
  ticker: number;
  /** The copyright line under the marquee. */
  tickerFooter: number;
  /** A modal's title. */
  modalTitle: number;
  /** A modal's body copy. */
  modalBody: number;
  /** The HUD score during play. */
  hudScore: number;
  /** The HUD's labels. */
  hudLabel: number;
  /** The score on the game-over screen. */
  overScore: number;
  /** Which tier produced this table — for the debug overlay. */
  tier: SizeTier;
}

/** The two inputs a type table honestly depends on. */
export interface TypeInput {
  box: Box;
  plan: MenuPlan;
}

/*
 * `LOCKUP_BOX_RATIO`, `MIN_LOCKUP_PX`, `MAX_LOCKUP_PX` and `lockupMaxForBand()`
 * are re-exported from `wordmark/scale.ts` — the module that owns the clamp the
 * cap belongs to. They are imported above and exported below so the adaptive
 * barrel keeps one import path for consumers.
 */
export { LOCKUP_BOX_RATIO, MAX_LOCKUP_PX, MIN_LOCKUP_PX, lockupMaxForBand };

/**
 * Build the table.
 *
 * `driver` is the 0..1 "how much room do I have" signal; `inflation` is the
 * tier multiplier, applied only above 1 so a phone never gets desktop type.
 */
export function typeScaleFor({ box, plan }: TypeInput): TypeScale {
  const tier = tierFor(box);
  const drive = roomDriver(box, 360, 1200);
  const inflation = Math.max(1, tierScale(tier));

  /*
   * The lockup is the one size that can be capped from *below* by the band, so
   * it is not part of the `fluid()` family: it is the smaller of what the width
   * allows and what the band allows. `scene` is the band; `plan.minimal` means
   * the band is already wordmark-only, so the full band is available.
   */
  const widthCap = resolve(LO_CLAMP, box.width) * inflation;
  const bandCap = lockupMaxForBand(plan.scene);
  /*
   * The band wins, and it wins **last**.
   *
   * The first version multiplied the tier inflation into the result of
   * `Math.min(widthCap, bandCap)` — so a 3840px window at the 140px minimal band
   * got `min(89.6, 83.3) × 1.3 = 108px`, and 108 × 1.68 = 181px of lockup in a
   * 140px band. That is the round-5 screenshot with a new cause. The inflation
   * now belongs to the width side, where it cannot outvote the height.
   *
   * The band cap is floored to half a pixel for the same reason: rounding 83.3
   * *up* to 83.5 gives a 140.28px lockup in a 140px band.
   */
  const lo = legible(Math.min(widthCap, Math.floor(bandCap * 2) / 2), MIN_LOCKUP_PX, MAX_LOCKUP_PX);
  const cheo = legible(lo * CHEO_RATIO_MAX, 1, lo);

  return {
    eyebrow: legible(fluid({ min: 8, max: 10.5 }, drive) * inflation, 8, 12),
    liveBadge: legible(fluid({ min: 8, max: 9.5 }, drive), 8, 10),
    lockupLo: lo,
    lockupCheo: cheo,
    badgePlate: legible(fluid({ min: 9.5, max: 12 }, drive), 9.5, 13),
    record: legible(fluid({ min: 10.5, max: 13 }, drive), 10.5, 14),
    panelHeader: legible(fluid({ min: 9, max: 11 }, drive), 9, 12),
    rowLabel: legible(fluid({ min: 10, max: 12.5 }, drive), 10, 13),
    /*
     * The hint line is the only text allowed to *disappear* rather than shrink:
     * `metrics.rowGap`/`density` already drops it below 840px of height, and a
     * second line at 8px in a 26px row is not a hint, it is noise. The floor is
     * therefore 8 and the band gate lives in `layout/metrics.ts`.
     */
    rowHint: legible(fluid({ min: 8, max: 10 }, drive), 8, 11),
    statFooter: legible(fluid({ min: 8, max: 9 }, drive), 8, 9.5),
    ticker: legible(fluid({ min: 9.5, max: 12 }, drive), 9.5, 13),
    tickerFooter: legible(fluid({ min: 8, max: 9.5 }, drive), 8, 10),
    modalTitle: legible(fluid({ min: 11, max: 14 }, drive), 11, 15),
    modalBody: legible(fluid({ min: 12, max: 15 }, drive), 12, 16),
    hudScore: legible(fluid({ min: 20, max: 34 }, drive), 20, 36),
    hudLabel: legible(fluid({ min: 9, max: 11 }, drive), 9, 12),
    overScore: legible(fluid({ min: 28, max: 56 }, drive), 28, 60),
    tier,
  };
}

/**
 * The table as CSS custom properties.
 *
 * The point of emitting variables rather than passing numbers into every
 * component is the ones this release did *not* rewrite. `panel-head` and
 * `.menu-row-label` are styled in `index.css`; a variable lets the adaptive
 * profile reach them without editing twenty JSX call sites, and it means a
 * component added next year inherits the scaling for free.
 *
 * Names are `--type-*` and `--adaptive-*`; nothing else in the stylesheet uses
 * those prefixes, so a grep is a complete answer to "who reads this".
 */
export function typeVars(scale: TypeScale): Record<string, string> {
  return {
    "--type-eyebrow": `${scale.eyebrow}px`,
    "--type-live": `${scale.liveBadge}px`,
    "--type-lockup-lo": `${scale.lockupLo}px`,
    "--type-lockup-cheo": `${scale.lockupCheo}px`,
    "--type-badge": `${scale.badgePlate}px`,
    "--type-record": `${scale.record}px`,
    "--type-panel-head": `${scale.panelHeader}px`,
    "--type-row-label": `${scale.rowLabel}px`,
    "--type-row-hint": `${scale.rowHint}px`,
    "--type-stat": `${scale.statFooter}px`,
    "--type-ticker": `${scale.ticker}px`,
    "--type-ticker-foot": `${scale.tickerFooter}px`,
    "--type-modal-title": `${scale.modalTitle}px`,
    "--type-modal-body": `${scale.modalBody}px`,
    "--type-hud-score": `${scale.hudScore}px`,
    "--type-hud-label": `${scale.hudLabel}px`,
    "--type-over-score": `${scale.overScore}px`,
  };
}
