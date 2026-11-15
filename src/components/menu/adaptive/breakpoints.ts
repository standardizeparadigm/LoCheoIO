/**
 * When each part of the hero is allowed to exist.
 *
 * WHY A SEPARATE MODULE
 * ---------------------
 * The hero's contents used to be gated by two things at once: Tailwind
 * `sm:`/`lg:` classes (width only) and `plan.minimal` (height only). Neither
 * knows about the other, so a 1920×820 window — very wide, not very tall —
 * passed every width test and failed every height test, and the result was the
 * round-6 screenshot: a hero laid out as a wide row, its lower half underneath
 * the corner panels.
 *
 * A layout decision that depends on *both* axes cannot be expressed as a
 * one-axis media query. This module turns the two axes into named booleans the
 * screen can branch on, and `heroLayout()` in `layout/adapt.ts` decides them
 * from the same plan the chrome uses.
 *
 * The thresholds are not guesses. `HEIGHT_FOR_SIDE_BY_SIDE` is derived: the
 * mascot is 192px at `lg` and the wordmark needs ~200px, so a two-column hero
 * needs ~400px of band before the shorter column starts being clipped by the
 * bottom of it. See the derivation below.
 */

/**
 * A two-column hero (lockup + mascot) needs this much band height.
 *
 *    lockup   wordmark 2 lines   ~160px at the 5.6rem cap
 *             badge row          ~37px
 *             record line        ~20px
 *             gaps               ~28px
 *                                ─────
 *                                ~245px
 *    mascot   192px jar + 24px chip = ~216px
 *
 * The taller column sets the requirement, so 245px is the floor with no
 * breathing room. 300 leaves 55px of slack, which is what stops the mascot
 * chip from touching the bottom edge at exactly the breakpoint.
 */
export const HEIGHT_FOR_SIDE_BY_SIDE = 300;

/**
 * Width below which the hero is one column no matter how tall it is.
 *
 * Below `lg` (1024px) Tailwind already stacks the hero, so this only exists to
 * keep the two decisions — width and height — in the same module and stop one
 * of them drifting back into a `lg:` class.
 */
export const WIDTH_FOR_SIDE_BY_SIDE = 1024;

/**
 * Band height below which the hero drops the halo ring.
 *
 * The ring is inset -24px around the jar, so it is 240px across on a side-by-
 * side hero; there the mascot is its own column and only the ring has to fit,
 * which is why the plan's 240px threshold is enough.
 *
 * STACKED IS THE CASE THAT BIT: when the hero is one column the ring is drawn
 * *around a jar that sits under the lockup*, so the band has to seat both. The
 * lockup is 150px and the ring 240, and they overlap by design (the ring is a
 * background). What must not happen is the ring's top edge landing on the
 * record line, so the threshold is `lockup 150 + ring 240 − overlap 90 = 300`,
 * which happens to be the side-by-side threshold. That is not a coincidence:
 * below 300 the hero stacks, and a stacked hero has no room for the ring.
 */
export const HEIGHT_FOR_HALO = 300;

/**
 * Band height below which the badge row («HŨ DƯA ĐẠI CHIẾN» + record) drops.
 *
 * DERIVED, not chosen — this is the reason the first draft of this module
 * failed its own test. With the badge row and the live badge both drawn, the
 * lockup needs
 *
 *     wordmark 150 + badge row 40 + live badge 22 = 212px
 *
 * and the first draft set the threshold at 210, so a 210px band drew a 212px
 * lockup. The band clips at its bottom edge and the record line disappears —
 * precisely the class of bug round 6 is about, introduced while fixing it.
 *
 * So the threshold is the sum, plus Slack. `tests/menu-adaptive.test.ts`
 * re-derives the sum from `heroContentHeight()` and asserts this constant is
 * never below it.
 */
export const HEIGHT_FOR_BADGE_ROW = 232;
