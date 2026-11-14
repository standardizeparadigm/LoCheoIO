/**
 * Every number the start screen is allowed to use, in one place.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * v1.1.7 sized the menu with padding and hope. The corner panels sized
 * themselves from their contents, the ticker sized itself from its text, and
 * the hero got whatever height was left over. Nothing declared a height, so
 * nothing could be checked, and the two failures in the report followed:
 *
 *   - the hero was pushed *out of the top* of the window, cutting the `LỌ`
 *     glyph in half
 *   - the corner panels overflowed the bottom, cutting `CÀI ĐẶT` and the
 *     copyright row
 *
 * v1.1.8 declares the heights instead. Every value here is consumed by
 * `planMenuLayout()` and pinned by `tests/menu-layout.test.ts`, so a future
 * change that re-introduces the overflow fails a test before it reaches a
 * screenshot.
 *
 * Units are CSS pixels at 1× — no vh, no %, nothing that depends on how long
 * a translation happens to be. That is the whole point: six rows must be
 * 268px in Vietnamese and 268px in Thai.
 */

/** One-line menu row: label only (34px tall content box). */
export const MENU_ROW_HEIGHT = 34;

/**
 * Row height in landscape-phone territory.
 *
 * A 390px-tall window has to seat seven rows, a header, the ticker and a hero.
 * At 34px the rows alone cost 238. At 26px they cost 182, which is the
 * difference between "crop the wordmark" and "show it". The labels stay
 * legible: 26px is one 11px line with 7px of padding, which is still a
 * comfortable tap target once the row is full-width — and in landscape it is.
 */
export const MENU_ROW_TIGHT_HEIGHT = 26;

/** Rich row: label plus a hint line underneath. */
export const MENU_ROW_RICH_HEIGHT = 54;

/** Gap between two rows in a corner panel. */
export const MENU_ROW_GAP = 6;

/** The `GAME` / `THÔNG TIN` header strip. */
export const PANEL_HEADER_HEIGHT = 22;

/** Inner padding of a corner panel (top and bottom, 8px each). */
export const PANEL_PADDING = 16;

/** Two corner ticks, each 3px of border overhang on top and bottom. */
export const PANEL_BORDER = 6;

/** Gap between rows in the compact economy — half the normal gap. */
export const MENU_ROW_GAP_COMPACT = 3;

/**
 * Inner padding in the compact economy, **summed over both sides**.
 *
 * `PANEL_PADDING` is 16 because `.corner-panel-body` carries Tailwind `p-2` —
 * 8px top and 8px bottom. Compact uses 5px a side, so the total is 10. Writing
 * "10 per side" here would make the plan reserve 20px more than the panel
 * paints, and the two numbers are the whole reason this module exists.
 */
export const PANEL_PADDING_COMPACT = 10;

/** Header strip in the compact economy. */
export const PANEL_HEADER_HEIGHT_COMPACT = 18;

/**
 * How many rows the GAME panel holds.
 *
 * v1.1.8 added «Cách chơi» here — the how-to accordion used to live in the
 * hero, where opening it pushed the wordmark off the top of the screen. The
 * patch release moves it to the GAME menu, which makes this seven:
 *
 *   play · continue · modes · leaderboard · achievements · how-to · settings
 *
 * INFO has four (about · changelog · shortcuts · quit), so GAME sets the row
 * height and the panel height for both. (This comment said three until round 7;
 * the fourth row is «Phím tắt», added in 1.1.8 and never reflected here.)
 */
export const CORNER_MAX_ROWS = 7;

/**
 * Height a panel adds when it renders its stat footer.
 *
 *  +  + the 8px font's line box, rounded.
 * Kept here rather than in the CSS so the plan can subtract it and the CSS can
 * consume it — one number, two readers.
 */
export const PANEL_FOOTER_HEIGHT = 30;

/** Width of one corner panel. Two of them plus margins must fit side by side. */
export const CORNER_PANEL_WIDTH = 224;

/** Horizontal gap between the two panels when side by side. */
export const CORNER_ROW_GAP = 8;

/** Outer margin around the whole corner row. */
export const CORNER_ROW_MARGIN = 12;

/** The scrolling ingredient strip, one line plus its rule. */
export const TICKER_HEIGHT = 48;

/**
 * Below this viewport height the ticker is not rendered at all.
 *
 * The 375×568 class of phone (iPhone SE 1, older Android) has 568px of height.
 * A full chrome band costs 378 of them; the smallest hero worth showing costs
 * 220; that leaves 30px short. Something has to give, and the ticker is the
 * right thing: it is decoration — a scrolling list of ingredient point values
 * that is also readable in the how-to modal — while the hero holds the
 * wordmark and the panels hold every button the player needs.
 *
 * Compared against `MIN_SCENE_HEIGHT + cornerRowReserve(false)`, not a magic
 * number, so raising either of those keeps the two in step.
 */
export const TICKER_HIDE_HEIGHT = 570;

/**
 * Below this viewport height the panels drop their stat footer as well.
 *
 * A landscape phone (844×390) is wide enough for the side-by-side row but has
 * almost no height. Without the footer the GAME panel is 22 + 7×34 + 6×6 + 16
 * + 6 = 334; with it, 364. That 30px is the difference between a 78px hero and
 * a 48px one, and 78 is still enough to show the wordmark's top half.
 *
 * The footer is the right thing to sacrifice: it repeats the achievement
 * count that the panel's own row already prints (`✓7/16` vs. the hint line on
 * «THÀNH TỰU»). Nothing is lost but density.
 */
export const FOOTER_HIDE_HEIGHT = 470;

/** The single footer line under the marquee (version · licence · author). */
export const TICKER_FOOTER_HEIGHT = 16;

/**
 * Below this viewport width the two corner panels cannot sit side by side
 * (224 × 2 + gaps = 472), so they stack into one column instead of
 * overlapping each other.
 */
export const STACK_BREAKPOINT = 520;

/**
 * At or above this viewport height a row may show its hint line.
 *
 * The threshold is not cosmetic. Rich rows raise the reserve from 378 to 518
 * (twenty extra pixels on seven rows), so the hero only keeps
 * MIN_SCENE_HEIGHT from
 *
 *     518 + 320 = 838px
 *
 * upward. 840 is the next round number that clears it, with 2px to spare. A
 * 768px-tall laptop therefore stays on compact rows — which is why the
 * screenshot in the report, taken at 720, showed the compact layout.
 */
export const RICH_ROW_BREAKPOINT = 840;

/**
 * The height at which the hero is *comfortable* — wordmark, mascot, tagline,
 * deck and breathing room, at compact row density.
 *
 * This used to be a hard floor (`MIN_SCENE_HEIGHT`, clamped with `Math.max`)
 * and the clamp was the bug: on any viewport shorter than floor + reserve the
 * column came out taller than the window, and the overflow shipped as a
 * scrollbar. Round 3 says the menu must not scroll at all, so this is now a
 * *preference* rather than a floor — `planMenuLayout()` shrinks the hero
 * toward `MIN_SCENE_HEIGHT` when the window cannot seat the preference.
 */
export const PREFERRED_SCENE_HEIGHT = 320;

/**
 * The height below which the hero stops being shrunk and starts being
 * cropped.
 *
 * At 220px the lockup (wordmark ≈ 150px at its smallest clamp + badge row)
 * still reads; below that the wordmark itself would have to shrink, which is
 * a bigger decision than a layout plan should make silently.
 *
 * Consequence, and it is deliberate: a 375×568 phone *does* crop the bottom
 * of the hero instead of scrolling to it. The chrome is fully visible, which
 * is the part that matters — a menu whose buttons are off-screen is a broken
 * menu, a menu whose decorative tagline is clipped is a tight one.
 */
export const MIN_SCENE_HEIGHT = 220;

/**
 * The smallest hero that is still a hero: the `LỌ CHÉO` wordmark alone.
 *
 * Below `MIN_SCENE_HEIGHT` the tagline, the deck and the mascot are dropped and
 * the plan aims for this instead. A landscape phone has ~390px of height and
 * the chrome needs 244 of them even after every economy — leaving 146, which
 * is a wordmark with room to breathe.
 *
 * The order of sacrifice, from cheapest to most expensive:
 *
 *   rows   34 → 26px               keeps every button
 *   ticker removed                 decoration, repeated in the modal
 *   footer removed                 one line, repeated in a row
 *   hero   tagline + deck + mascot only the wordmark stays
 *   none   the plan reports crop   only below ~190px of height
 */
export const TIGHT_SCENE_HEIGHT = 140;

/** Height of one row at a given density. */
export function rowHeight(rich: boolean, tight = false): number {
  if (rich) return MENU_ROW_RICH_HEIGHT;
  return tight ? MENU_ROW_TIGHT_HEIGHT : MENU_ROW_HEIGHT;
}

/**
 * Height of a corner panel holding `rows` rows.
 *
 * header + rows + gaps between them + padding + border. Exported because the
 * scene has to reserve exactly this much, and the two numbers drifting apart
 * is precisely what cut the artwork in 1.1.7.
 */
export function cornerPanelHeight(
  rows: number,
  rich: boolean,
  tight = false,
  compact = false,
): number {
  /*
   * `Math.max(1, rows)` floors a negative and passes `NaN` and `Infinity`
   * through — the tenth instance of this shape in the release, and here the
   * consequence is a *declared panel height* of `NaN`, which React silently
   * drops and the panel then sizes to its content. That is the v1.1.7 bug
   * (`CornerPanel` "tự cao bằng nội dung") coming back through a different door.
   *
   * `Math.trunc` is not cosmetic either: `rows = 2.7` produced 200px, an odd
   * height that no row sum can produce and that `plan.scene + plan.reserve`
   * cannot account for.
   */
  const n = Number.isFinite(rows) ? Math.max(1, Math.trunc(rows)) : 1;
  /*
   * The compact economy (round 7) shrinks the *chrome* rather than dropping
   * rows. Rows are the one thing that must never be sacrificed — every button
   * stays on screen — but the 6px gaps, 16px padding and 22px header are all
   * air, and on a 677px-tall window they are 6×6 + 16 + 22 = 74px of the 378px
   * the chrome was claiming from a 299px hero.
   *
   * Measured at the 7-row GAME panel, rich rows (54px):
   *
   *   normal   22 + 7×54 + 6×6  + 16 + 6 = 458
   *   compact  18 + 7×54 + 6×3  + 10 + 6 = 430   (−28)
   *
   * 28px is not the whole story — the ticker and margin are on top — but it is
   * real, and it is bought without hiding a single button.
   */
  if (compact) {
    return (
      PANEL_HEADER_HEIGHT_COMPACT +
      n * rowHeight(rich, tight) +
      (n - 1) * MENU_ROW_GAP_COMPACT +
      PANEL_PADDING_COMPACT +
      PANEL_BORDER
    );
  }
  return (
    PANEL_HEADER_HEIGHT +
    n * rowHeight(rich, tight) +
    (n - 1) * MENU_ROW_GAP +
    PANEL_PADDING +
    PANEL_BORDER
  );
}

/** The GAME panel's height — it is the taller of the two, so it sets the row. */
export function cornerRowHeight(rich: boolean, tight = false, compact = false): number {
  return cornerPanelHeight(CORNER_MAX_ROWS, rich, tight, compact);
}

/** Total vertical space the floating chrome occupies at the bottom. */
export function cornerRowReserve(
  rich: boolean,
  tight = false,
  ticker = true,
  compact = false,
): number {
  return cornerRowHeight(rich, tight, compact) + (ticker ? TICKER_HEIGHT : 0) + CORNER_ROW_MARGIN;
}
