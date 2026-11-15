/**
 * `adaptive/README.md` prints four thresholds and five measurements. Both sets
 * were correct when written and neither is read by anything — the README says
 * so itself, in the section "The measurements are the component's, not this
 * folder's".
 *
 * That honesty is good, and it is also an incomplete defence: the README can
 * quote a threshold that the code no longer uses, and a reader will believe the
 * document rather than the constant. This file closes the gap that can be
 * closed without a browser — every number the README prints for a *constant*
 * is compared to that constant — and leaves the honest gap (class names in
 * `StartScreen.tsx`) visibly open.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  HEIGHT_FOR_BADGE_ROW,
  HEIGHT_FOR_HALO,
  HEIGHT_FOR_SIDE_BY_SIDE,
  WIDTH_FOR_SIDE_BY_SIDE,
} from "../src/components/menu/adaptive/breakpoints";
import {
  CHIP_OVERHANG,
  MASCOT_ROW,
  MASCOT_STACKED,
  STACK_GAP,
} from "../src/components/menu/adaptive/hero";

const README = readFileSync("src/components/menu/adaptive/README.md", "utf8");

describe("the thresholds the adaptive README prints", () => {
  it("quotes each one at its real value", () => {
    expect(README).toContain(`badgeRow  = h >= ${HEIGHT_FOR_BADGE_ROW}`);
    expect(README).toContain(`halo      = h >= ${HEIGHT_FOR_HALO}`);
    expect(README).toContain(`sideBySide= w >= ${WIDTH_FOR_SIDE_BY_SIDE} && h >= ${HEIGHT_FOR_SIDE_BY_SIDE}`);
  });

  it("quotes the five measurements at their real values", () => {
    // These are named constants in hero.ts, except WORDMARK which is the 150px
    // literal in heroContentHeight()'s two branches.
    expect(README).toContain(`MASCOT_STACKED = ${MASCOT_STACKED}`);
    expect(README).toContain(`CHIP_OVERHANG = ${CHIP_OVERHANG}`);
    expect(README).toContain("GAP = 16");
    expect(STACK_GAP).toBe(16);
    expect(README).toContain(`MASCOT_ROW = ${MASCOT_ROW}`);
    expect(README).toContain("WORDMARK = 150");
  });

  it("still admits that the measurements come from the component", () => {
    /*
     * The admission is the most valuable paragraph in the file: it says that
     * changing `h-32` to `h-36` in StartScreen.tsx makes this module wrong and
     * nothing will say so. If a future edit tidies that warning away, the
     * document starts claiming a guarantee it does not have.
     */
    expect(README).toContain("The measurements are the component's, not this folder's");
    expect(README).toMatch(/nothing will tell them/);
  });

  it("names the test that rebuilds the column independently", () => {
    // A claim that a test exists has to be true, which is what this checks.
    expect(README).toContain("tests/hero-stacked-fit.test.ts");
    expect(() => readFileSync("tests/hero-stacked-fit.test.ts", "utf8")).not.toThrow();
  });
});
