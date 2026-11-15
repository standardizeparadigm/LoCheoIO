/**
 * The panel drew 30px the plan had already spent.
 *
 * `reserveFor()` has always subtracted `PANEL_FOOTER_HEIGHT` when `plan.footer`
 * is false — that is the trade `FOOTER_HIDE_HEIGHT` makes, and it is why a
 * 390px-tall landscape phone gets any hero at all. The panel, though, painted
 * `cornerRowHeight()` unconditionally: it knew its density but not whether it
 * was going to draw a footer.
 *
 * So on every window shorter than 470px the reserve bought 30px less than the
 * panel took. At 844×390 — a real iPhone in landscape, and the size in this
 * round's report — the panel was 234px inside a 216px band: its bottom 18px sat
 * below the window edge and the column no longer added up to the screen.
 *
 * The fix lives in `panelHeightForPlan()`. This file is what makes it stay
 * fixed, and it is deliberately phrased as an *arithmetic* assertion — panel
 * plus margin must fit the reserve — rather than as a comparison between two
 * functions that could both be wrong in the same direction.
 */
import { describe, expect, it } from "vitest";

import { resolveForSize } from "../src/components/menu/adaptive/resolve";
import { densityFor, panelHeightForPlan, reserveFor } from "../src/components/menu/adaptive/density";
import { CORNER_ROW_MARGIN, PANEL_FOOTER_HEIGHT } from "../src/components/menu/layout/metrics";

/**
 * The windows below `FOOTER_HIDE_HEIGHT` (470) — every one of them a footer-less
 * plan. 1568×677 is deliberately *not* here: it has room for the footer and is
 * covered by the footer-ful half of the invariant.
 */
const SHORT: Array<[number, number]> = [
  [844, 390],
  [667, 375],
  [896, 414],
  [1024, 320],
  [1280, 360],
  [1920, 400],
  [320, 480],
];

describe("the panel never draws more than the reserve bought", () => {
  it("fits the short windows that hide the footer", () => {
    for (const [w, h] of SHORT) {
      const profile = resolveForSize(w, h);
      const { plan } = profile;
      expect(plan.footer, `${w}×${h} should be a footer-less plan`).toBe(false);
      expect(profile.panelHeight + CORNER_ROW_MARGIN, `${w}×${h}`).toBeLessThanOrEqual(plan.reserve);
    }
  });

  it("is exactly the band, not merely inside it, on 844×390", () => {
    // No ticker at this height, so the band is panel + margin and nothing else.
    const profile = resolveForSize(844, 390);
    expect(profile.plan.ticker).toBe(false);
    expect(profile.panelHeight + CORNER_ROW_MARGIN).toBe(profile.plan.reserve);
  });

  it("shrinks the painter by exactly one footer line", () => {
    for (const [w, h] of SHORT) {
      const profile = resolveForSize(w, h);
      const density = densityFor(profile.plan);
      // The footer-less panel is the footer-ful one minus the 30px strip.
      expect(profile.panelHeight, `${w}×${h}`).toBe(
        panelHeightForPlan({ ...profile.plan, footer: true }) - PANEL_FOOTER_HEIGHT,
      );
      expect(reserveFor(density, profile.plan.ticker, false)).toBe(profile.plan.reserve);
    }
  });

  it("leaves the whole chrome inside the reserve, at every short size", () => {
    for (const [w, h] of SHORT) {
      const { plan, panelHeight } = resolveForSize(w, h);
      const ticker = plan.ticker ? plan.reserve - (panelHeight + CORNER_ROW_MARGIN) : 0;
      expect(panelHeight + CORNER_ROW_MARGIN + ticker, `${w}×${h}`).toBe(plan.reserve);
      // And the reserve itself is never taller than the window it sits in.
      expect(plan.reserve, `${w}×${h}`).toBeLessThanOrEqual(h);
    }
  });
});
