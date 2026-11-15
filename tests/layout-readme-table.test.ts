/**
 * `layout/README.md` prints a table of seven real viewports and two arithmetic
 * blocks. Both had drifted, and the drift was invisible because nothing read
 * them:
 *
 *   · the arithmetic block said `ROWS 6` and `panel(compact) = 22 + 6×34 +
 *     5×6 + 16 + 6 = 278`, a sum that is 298 and a row count that is 7;
 *   · the viewport table gave 844×390 as `reserve 244 / scene 146`, but 244 is
 *     not a total `cornerRowReserve()` can produce and 146 is below the 220
 *     minimum scene — which is right, because `minimal` lowers the floor to
 *     140, and the table had no column to say so.
 *
 * This file recomputes every number in the table from `planMenuLayout()` and
 * compares. It is the reason the table cannot drift again: an edit to a
 * threshold that changes one of these rows fails here, in the same commit.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { planMenuLayout } from "../src/components/menu/layout";
import { cornerPanelHeight, cornerRowReserve } from "../src/components/menu/layout/metrics";

const README = readFileSync("src/components/menu/layout/README.md", "utf8");

const VIEWPORTS: Array<[number, number]> = [
  [1280, 720],
  [1366, 768],
  [1920, 1080],
  [768, 1024],
  [375, 667],
  [375, 568],
  [844, 390],
];

describe("the viewport table in layout/README.md", () => {
  it("lists the seven viewports it claims to list", () => {
    for (const [w, h] of VIEWPORTS) {
      expect(README, `${w}×${h} row is missing`).toContain(`${w}×${h}`);
    }
  });

  it("prints the reserve each plan actually produces", () => {
    /*
     * Checked as a row, not as a bare number: 378 and 518 each appear several
     * times in the file, and a `toContain("378")` would pass on any of them.
     */
    for (const [w, h] of VIEWPORTS) {
      const plan = planMenuLayout({ width: w, height: h });
      const row = README.split("\n").find((line) => line.includes(`${w}×${h}`));
      expect(row, `${w}×${h} has no row`).toBeDefined();
      const cells = row!.split("|").map((c) => c.trim().replace(/\*\*/g, ""));
      expect(cells[2], `${w}×${h} reserve`).toBe(String(plan.reserve));
      expect(cells[3], `${w}×${h} scene`).toBe(String(plan.scene));
    }
  });

  it("prints the frame heights the arithmetic block claims", () => {
    // The block is prose; these two numbers are the ones a reader re-derives.
    expect(README).toContain("panel(rich)    = 22 + 7×54 + 6×6 + 16 + 6 = 458");
    expect(README).toContain("panel(compact) = 18 + 7×54 + 6×3 + 10 + 6 = 430");
    expect(cornerPanelHeight(7, true)).toBe(458);
    expect(cornerPanelHeight(7, true, false, true)).toBe(430);
  });

  it("prints reserves that cornerRowReserve() actually produces", () => {
    expect(README).toContain("reserve(rich)    = 458 + 48 (ticker) + 12 (margin) = 518");
    expect(README).toContain("reserve(compact) = 430 + 48 + 12                   = 490");
    expect(cornerRowReserve(true)).toBe(518);
    expect(cornerRowReserve(true, false, true, true)).toBe(490);
  });

  it("keeps the invariant line honest: scene + reserve === height for full layouts", () => {
    /*
     * The README's headline invariant. It holds *unless* the chrome is clipped,
     * which is why the two squeezing rows (844×390 and 375×568) are excluded
     * below 240px... they are not: 568 > 240, so 375×568 must satisfy it. Only
     * a `crop` plan may break it, and none of these seven is a crop.
     */
    for (const [w, h] of VIEWPORTS) {
      const plan = planMenuLayout({ width: w, height: h });
      if (plan.fit === "crop") continue;
      expect(plan.scene + plan.reserve, `${w}×${h}`).toBe(h);
    }
  });
});
