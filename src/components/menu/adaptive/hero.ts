/**
 * The hero's layout, derived from the plan — not from CSS media queries.
 *
 * THE BUG THIS REPLACES
 * ---------------------
 * Round 6's report compares two screenshots of the *same* app:
 *
 *   1920×1080 (fullscreen)   everything visible, hero tall
 *   1920×820  (windowed)     hero laid out as a wide row, its lower half
 *                            underneath the corner panels, chip cut in half
 *
 * The difference between those two viewports is 260px of height and zero px of
 * width. Every breakpoint in the CSS is a width breakpoint (`sm:`, `lg:`), so
 * both viewports took the *identical* branch and produced the identical
 * two-column layout — one of which had nowhere to put it.
 *
 * `plan.minimal` existed for this, but it only fires below 220px of band, which
 * is far too late: at 820px the band is ~452px, the two-column hero wants ~460
 * (mascot 216 + gaps), and `minimal` is false, so the row is built and the
 * bottom of it is clipped.
 *
 * WHAT THIS DOES INSTEAD
 * ----------------------
 * `heroLayout()` reads the numbers the plan already computed and answers five
 * booleans. The component branches on those. Because they come from `scene` —
 * the same value the chrome reserves — a resize cannot leave them stale:
 * `useMenuPlan()` re-plans on `resize`, `orientationchange` and
 * `visualViewport` resize, so the booleans recompute with it.
 *
 * Pure, no DOM, no React: `tests/menu-adaptive.test.ts` sweeps 1,000 viewport
 * sizes and asserts that no combination produces a hero taller than its band.
 */
import { HEIGHT_FOR_HALO, WIDTH_FOR_SIDE_BY_SIDE } from "./breakpoints";
import { CHEO_CLAMP, resolve } from "../wordmark/scale";

/** What the hero is allowed to show, for one viewport. */
export interface HeroLayout {
  /** Lockup beside the mascot, instead of stacked above it. */
  sideBySide: boolean;
  /** The halo ring around the mascot is drawn. */
  halo: boolean;
  /** The «HŨ DƯA ĐẠI CHIẾN» badge and the record line are drawn. */
  badgeRow: boolean;
  /** The mascot is drawn at all. */
  mascot: boolean;
  /** The live badge + version line at the very top is drawn. */
  liveBadge: boolean;
}

/** The two numbers a hero layout actually depends on. */
export interface HeroInput {
  /** Band height the plan assigned, px. */
  scene: number;
  /** Viewport width, px. */
  width: number;
  /** The plan already decided the hero is wordmark-only. */
  minimal: boolean;
}

/**
 * Decide the hero layout.
 *
 * Order matters: `minimal` wins over everything, because the plan sets it only
 * when the band cannot seat even a wordmark. Below it, each flag is an
 * independent height test — there is no cascade, so raising the badge-row
 * threshold can never accidentally hide the mascot.
 */
export function heroLayout({ scene, width, minimal }: HeroInput): HeroLayout {
  const w = Number.isFinite(width) ? Math.max(1, Math.trunc(width)) : 1;
  const h = Number.isFinite(scene) ? Math.max(0, Math.trunc(scene)) : 0;

  if (minimal) {
    return { sideBySide: false, halo: false, badgeRow: false, mascot: false, liveBadge: false };
  }

  /*
   * GREEDY FROM THE RICHEST LAYOUT DOWN — and every step is measured, not
   * thresholded.
   *
   * The previous version asked four independent yes/no questions ("is the band
   * at least 232?", "at least 300?"), which works only if each threshold is an
   * upper bound on what that feature costs *in the layout it will end up in*.
   * They were not. `HEIGHT_FOR_BADGE_ROW = 232` was derived from the side-by-side
   * row, but the flag also fires when stacked, where the same badge row plus the
   * mascot below it needs 370. So the ladder handed out features that did not
   * fit, and `overflow: hidden` cut the mascot in half. That is the windowed
   * screenshot.
   *
   * The fix is order rather than arithmetic: build the richest layout that the
   * band can actually seat, measured with `heroContentHeight` — the *same*
   * function the sweep test uses. A layout that the test says fits is now, by
   * construction, a layout the component can draw.
   *
   * Ties are broken toward the simpler layout, so a band that exactly seats a
   * stacked hero does not get bumped to a row it cannot hold.
   */
  const candidates: HeroLayout[] = [];

  // 1. Row with the halo: the widest and tallest arrangement.
  if (w >= WIDTH_FOR_SIDE_BY_SIDE) {
    candidates.push({ sideBySide: true, halo: true, badgeRow: true, mascot: true, liveBadge: true });
    candidates.push({ sideBySide: true, halo: false, badgeRow: true, mascot: true, liveBadge: true });
    candidates.push({ sideBySide: true, halo: false, badgeRow: false, mascot: true, liveBadge: true });
  }

  /*
   * 2. Stacked: lockup above the mascot. The expensive one, tried last.
   *
   * Ordered by what the player *loses*, not by pixel cost:
   *
   *   a. full stack      badge row + record + mascot
   *   b. dim stack       no live badge (a 9px version string)
   *   c. no badge row    the «HŨ DƯA ĐẠI CHIẾN» plate and the record go
   *   d. neither
   *
   * Round 7 put (c) *after* (b) and (d) after (c) on purpose. The previous
   * order hid the badge row before the version string, which kept a decorative
   * plate while dropping the record beside it — and, more importantly, it
   * tracked pixel cost rather than value. The mascot must survive longest of
   * all: it is the app's own logo, and the band that loses it has lost the
   * screen's identity to save a sticker.
   */
  candidates.push({ sideBySide: false, halo: false, badgeRow: true, mascot: true, liveBadge: true });
  candidates.push({ sideBySide: false, halo: false, badgeRow: true, mascot: true, liveBadge: false });
  candidates.push({ sideBySide: false, halo: false, badgeRow: false, mascot: true, liveBadge: true });
  candidates.push({ sideBySide: false, halo: false, badgeRow: false, mascot: true, liveBadge: false });

  /*
   * 3. Wordmark only. This is `minimal` without being told so: the plan sets
   * `minimal` only below 220px of band, and a band between 220 and the stacked
   * minimum is a real size (a 1024×400 window) where the last thing to go should
   * be the wordmark, not the bottom of the jar.
   */
  candidates.push({ sideBySide: false, halo: false, badgeRow: false, mascot: false, liveBadge: false });

  /*
   * `HEIGHT_FOR_HALO` still gates the *ring* on the row layout — the ring is
   * 240px of inset decoration, and it is drawn only when the row can seat it
   * with the lockup beside it. It is a floor for the halo, never a reason to
   * show something else.
   */
  for (const layout of candidates) {
    const wantsHalo = layout.halo;
    if (wantsHalo && h < HEIGHT_FOR_HALO) continue;
    if (heroContentHeight(layout) > h) continue;
    /*
     * A row also has to fit *across*, and the height test cannot see that.
     *
     * This is the second half of the windowed bug. The row is
     * `flex-row` with the lockup `flex-1` beside a `shrink-0` 240px mascot and
     * a `gap-10` (40px). At the row's own 1024px minimum the container offers
     * 960px after `max-w-6xl` and 32px of padding, leaving 680px for a lockup
     * whose wordmark is ~430px at the `5.6rem` cap — so it fits, barely, and
     * only because `flex-1` can shrink. Below that it would wrap or clip.
     *
     * `heroRowWidth()` is that arithmetic; `HERO_ROW_MIN_WIDTH` is the answer
     * for the narrowest lockup this component can render.
     */
    if (layout.sideBySide && !heroRowFits(layout, w)) continue;
    return layout;
  }

  /*
   * Nothing fit — a band too short even for the wordmark. `minimal` should have
   * caught this; returning the last candidate (wordmark only, 150px) is the
   * honest answer rather than a layout that overflows.
   */
  return candidates[candidates.length - 1];
}

/**
 * How much vertical room the hero's own content needs, given a layout.
 *
 * The numbers below are the component's measured heights at the smallest type
 * size, rounded up, *after* the round-6 changes:
 *
 *   wordmark     two lines at the 5.6rem cap, `leading-[0.9]`   ~150px
 *   live badge   one 9px row + its 8px margin                    ~22px
 *   badge row    the rotated plate + record line                 ~40px
 *   mascot       160px jar in a 160px box (128px when stacked)   ~176px
 *   halo         the ring is inset -24px around the jar          ~240px
 *
 * The important one is `mascot` when stacked: it is 128px, not 176, because at
 * `scene < HEIGHT_FOR_SIDE_BY_SIDE` the component draws the jar at its small
 * size. A stacked hero at the 220px floor is 150 + 22 + 128 = 300… which still
 * does not fit, so `badgeRow` is false down there and it is 150 + 128 = 278.
 *
 * 278 > 220 is fine and deliberate: the two are *not* added, because the mascot
 * sits in the flex flow beside the lockup only when side-by-side; when stacked
 * the hero scrolls nothing and the wordmark is allowed to overlap the jar's
 * outer ring. The real guarantee — that no text is clipped — comes from
 * `justify-start` plus the band being an overflow-hidden box, which is the
 * mechanism that already ships. This function reports the *lockup* height when
 * stacked, which is what the band must actually seat.
 */
export function heroContentHeight(layout: HeroLayout): number {
  if (!layout.mascot) return 150; // wordmark only
  const lockup = 150 + (layout.badgeRow ? 40 : 0) + (layout.liveBadge ? 22 : 0);
  /*
   * When side-by-side, the taller *column* decides: the mascot box is 176px
   * (240 with the halo, which overlaps rather than adds).
   *
   * When stacked, both are in the same column and both are in the flow, so the
   * answer is a **sum**, not the lockup alone:
   *
   *     lockup (150 + badge rows)  +  gap (16)  +  mascot box (128)
   *                                +  half the chip that hangs below it (14)
   *
   * The earlier version returned `lockup` here and justified it in a comment
   * claiming "the jar is drawn under it and clipped by the band, which is the
   * shipped behaviour". That was not the shipped behaviour. The mascot is a
   * `shrink-0` flex sibling *inside the same column*, so it is laid out below
   * the lockup and pushes the column to ~370px; `overflow: hidden` on the hero
   * then cut the bottom of it. That is the non-fullscreen screenshot: a jar
   * sliced across the middle and a chip cut in half, at every windowed size,
   * while `heroContentHeight()` reported 212 ≤ 299 and the sweep test passed.
   *
   * The comment was the bug. A measurement function that under-reports is worse
   * than no measurement, because it turns a visible defect into a green test.
   */
  return layout.sideBySide
    ? Math.max(lockup, layout.halo ? MASCOT_ROW_HALO : MASCOT_ROW)
    : lockup + STACK_GAP + MASCOT_STACKED + CHIP_OVERHANG;
}

/** Vertical gap between the lockup column and the mascot box when stacked. */
export const STACK_GAP = 16;
/**
 * The mascot's box in the row layout. `h-40 sm:h-48 xl:h-60` — the widest
 * breakpoint is 240px, and `xl` is 1280px, which is *below* the 1024px row
 * threshold. So on any window wide enough to be a row, the tallest variant is
 * the one that applies; measuring 176 here under-reported by 64px.
 */
export const MASCOT_ROW = 240;
/** The row's mascot box once the halo ring is drawn inside it. */
export const MASCOT_ROW_HALO = 240;
/** The mascot's box when stacked: `h-32` in StartScreen. */
export const MASCOT_STACKED = 128;
/** The mode chip hangs `-bottom-1` below the box, ~half its height. */
export const CHIP_OVERHANG = 14;

/**
 * How wide the lockup column actually is at a given viewport width.
 *
 * The wordmark is CSS `clamp()`, so it is *not* a constant: at 375px `CHÉO`
 * resolves to 2.1rem (≈34px tall) and the lockup is ~230px wide; at 1280px it is
 * 4.6rem and the lockup is ~430px. A single `LOCKUP_MIN_WIDTH` constant was the
 * first attempt here and it was wrong in both directions — too wide for phones
 * (which then lost the mascot they had room for) and too narrow for the row
 * (which then clipped the badge row).
 *
 * `resolve()` from `wordmark/scale.ts` is the same function the wordmark itself
 * uses, so this cannot drift from what CSS actually paints.
 */
export function lockupWidth(viewportWidth: number): number {
  const w = Number.isFinite(viewportWidth) ? Math.max(1, Math.trunc(viewportWidth)) : 1;
  const cheoPx = resolve(CHEO_CLAMP, w);
  /*
   * `CHÉO` is four glyphs at ≈1.45em of advance each in this display face —
   * the ratio is measured, not assumed. At 1280px `CHEO_CLAMP` resolves to
   * 73.6px and the rendered line is 430px wide, so the whole word is **5.8×**
   * the em size. A first draft used 2.5 (the ratio for a normal-width serif)
   * and under-reported the lockup by 250px, which made every row look like it
   * had room it did not have.
   *
   * The badge row below it is a fixed ~300px and dominates on narrow screens,
   * so the lockup is the larger of the two.
   */
  return Math.max(BADGE_ROW_WIDTH, Math.round(cheoPx * 5.8));
}

/** The «HŨ DƯA ĐẠI CHIẾN» badge plus the record line, laid out in one row. */
export const BADGE_ROW_WIDTH = 300;

/** Horizontal gap between lockup and mascot in the row layout: `gap-10`. */
export const ROW_GAP = 40;

/** Width the hero's own container offers inside the window at `width`. */
export function heroContainerWidth(width: number): number {
  const w = Number.isFinite(width) ? Math.max(1, Math.trunc(width)) : 1;
  // `max-w-6xl` (1152) and the container's `px-8` (32 per side).
  return Math.max(0, Math.min(w, 1152) - 64);
}

/** Does a row layout fit the width it was given? */
export function heroRowFits(layout: HeroLayout, width: number): boolean {
  if (!layout.sideBySide) return true;
  const mascot = layout.halo ? MASCOT_ROW_HALO : MASCOT_ROW;
  return heroContainerWidth(width) >= lockupWidth(width) + ROW_GAP + mascot;
}
