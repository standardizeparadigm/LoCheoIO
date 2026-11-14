/**
 * The windowed bug, tested from first principles.
 *
 * `tests/menu-adaptive.test.ts` sweeps 2,516 sizes asserting
 * `heroContentHeight(layout) <= scene`. That test passed for the whole of
 * v1.1.8 while the app drew the screenshot the user reported — because
 * `heroContentHeight` itself was wrong, and a test that asks a function whether
 * it agrees with itself cannot notice.
 *
 * This file does not call `heroContentHeight`. It rebuilds the column from the
 * *component's* numbers — the ones in `StartScreen.tsx`'s class names — and
 * compares that to the band. If the two ever disagree, one of them is wrong and
 * this fails.
 */
import { describe, expect, it } from "vitest";
import { heroContentHeight, heroLayout } from "../src/components/menu/adaptive/hero";
import { planMenuLayout } from "../src/components/menu/layout";

/*
 * Measured from `StartScreen.tsx`, not from the adaptive module:
 *
 *   wordmark     `Wordmark` at the 5.6rem cap, `leading-[0.9]`, two lines  150
 *   live badge   one 9px row + `mb-2`                                       22
 *   badge row    plate `py-1` + record line, `mt-3`                         40
 *   mascot       `h-32` when stacked, `h-40 sm:h-48 xl:h-60` when a row    128 / 240
 *   chip         `-bottom-1`, ~28px tall, half of it below the box          14
 *   gap          `gap-4` between the lockup column and the mascot box       16
 */
const WORDMARK = 150;
const LIVE_BADGE = 22;
const BADGE_ROW = 40;
const MASCOT_STACKED = 128;
const MASCOT_ROW = 240;
const CHIP_OVERHANG = 14;
const GAP = 16;

/** The height the DOM will actually be, rebuilt independently. */
function drawnHeight(l: ReturnType<typeof heroLayout>): number {
  if (!l.mascot) return WORDMARK + (l.badgeRow ? BADGE_ROW : 0) + (l.liveBadge ? LIVE_BADGE : 0);
  const lockup = WORDMARK + (l.badgeRow ? BADGE_ROW : 0) + (l.liveBadge ? LIVE_BADGE : 0);
  return l.sideBySide
    ? Math.max(lockup, MASCOT_ROW)
    : lockup + GAP + MASCOT_STACKED + CHIP_OVERHANG;
}

const WINDOWED: [number, number][] = [
  [1568, 677], [1440, 677], [1366, 650], [1280, 720], [1280, 640],
  [1920, 820], [1920, 900], [1600, 700], [1024, 600], [900, 500],
  [375, 667], [414, 896], [768, 1024], [1024, 768], [1920, 1080],
];

describe("the hero the DOM draws never exceeds its band", () => {
  it("fits at every windowed size, measured from the component's own numbers", () => {
    for (const [w, h] of WINDOWED) {
      const plan = planMenuLayout({ width: w, height: h });
      const layout = heroLayout({ scene: plan.scene, width: w, minimal: plan.minimal });
      const drawn = drawnHeight(layout);
      expect(drawn, `${w}×${h}: draws ${drawn}px in a ${plan.scene}px band`).toBeLessThanOrEqual(
        plan.scene,
      );
    }
  });

  it("agrees with heroContentHeight at every one of them", () => {
    /*
     * Two independent derivations, one assertion. If the adaptive module's
     * constants drift from the component's classes, they disagree here — which
     * is the check that was missing when the module under-reported by 158px and
     * the sweep test believed it.
     */
    for (const [w, h] of WINDOWED) {
      const plan = planMenuLayout({ width: w, height: h });
      const layout = heroLayout({ scene: plan.scene, width: w, minimal: plan.minimal });
      expect(heroContentHeight(layout), `${w}×${h}`).toBe(drawnHeight(layout));
    }
  });

  it("keeps the mascot at the size the screenshot reported", () => {
    // 1568×677 is the actual window. It has room for a row and must get one —
    // the old ladder gave it a stack with no mascot at all.
    const plan = planMenuLayout({ width: 1568, height: 677 });
    const layout = heroLayout({ scene: plan.scene, width: 1568, minimal: plan.minimal });
    expect(layout.mascot).toBe(true);
    expect(layout.sideBySide).toBe(true);
  });
});
