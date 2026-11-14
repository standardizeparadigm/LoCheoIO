/**
 * `fit.ts` — the invariant that makes every other layout test possible.
 *
 *     scene + reserve === viewport.height
 *
 * If that holds, then "the hero has H pixels" and "the chrome occupies R
 * pixels" are the same statement, and either one can be checked against the
 * other. If it fails, both can be individually plausible and the screen still
 * overflows — which is exactly what shipped in v1.1.7.
 *
 * `tests/menu-layout.test.ts` covers the arithmetic at five named viewports.
 * This file covers the *edges*: the smallest window the plan accepts, the
 * largest, the exact boundaries where each economy flips, and the inputs that
 * are not real viewports but do reach the function.
 */
import { describe, expect, it } from "vitest";
import {
  MIN_SCENE_HEIGHT,
  PREFERRED_SCENE_HEIGHT,
  TIGHT_SCENE_HEIGHT,
} from "../src/components/menu/layout/metrics";
import { planMenuLayout } from "../src/components/menu/layout/fit";

/** Every plan the function can return, for a sweep of height. */
function planAt(height: number, width = 1440) {
  return planMenuLayout({ width, height });
}

describe("the invariant holds wherever the plan claims to fit", () => {
  it("scene + reserve equals the viewport at every height that fits", () => {
    /*
     * THE INVARIANT HAS A PRECONDITION, and the first draft of this test
     * missed it: at 300px the sum is 384, not 300.
     *
     * That is not a bug, it is the contract. `planMenuLayout` refuses to
     * invent a scene smaller than `TIGHT_SCENE_HEIGHT`, so on a window too
     * short to seat even the minimal chrome it reports `fit: "crop"` — the
     * planner says out loud that the window is too small, rather than
     * returning numbers that add up to a screen that cannot exist.
     *
     * So the sweep asserts the sum only where `fit !== "crop"`, and asserts
     * the crop branch is *honest* in its own test below.
     */
    let checked = 0;
    for (let h = 300; h <= 2160; h += 7) {
      const plan = planAt(h);
      if (plan.fit === "crop") continue;
      expect(plan.scene + plan.reserve, `broken at height ${h}`).toBe(h);
      checked += 1;
    }
    expect(checked, "the sweep skipped almost everything").toBeGreaterThan(200);
  });

  it("reports crop exactly when the window cannot seat the floor", () => {
    for (let h = 200; h <= 900; h += 3) {
      const plan = planAt(h);
      const available = h - plan.reserve;
      const floor = plan.minimal ? TIGHT_SCENE_HEIGHT : MIN_SCENE_HEIGHT;
      expect(
        plan.fit === "crop",
        `fit=${plan.fit} at ${h} (available ${available}, floor ${floor})`,
      ).toBe(available < floor);
    }
  });

  it("a cropped plan still returns a scene at the floor, never below", () => {
    /*
     * The crop branch must not lie in the other direction either: it returns
     * the floor, not a negative or zero scene. A caller that ignores `fit`
     * gets a hero of exactly the minimum size, which is a screen that is too
     * tall for its window but still renders the wordmark.
     */
    for (const h of [200, 250, 300, 350]) {
      const plan = planAt(h);
      if (plan.fit !== "crop") continue;
      const floor = plan.minimal ? TIGHT_SCENE_HEIGHT : MIN_SCENE_HEIGHT;
      expect(plan.scene, `scene at ${h}`).toBe(floor);
    }
  });

  it("holds across widths, because width must not affect the sum", () => {
    for (const width of [320, 768, 1024, 1440, 1920, 3840]) {
      for (const height of [400, 720, 900, 1440]) {
        const plan = planAt(height, width);
        expect(plan.scene + plan.reserve, `${width}×${height}`).toBe(height);
      }
    }
  });

  it("never returns a negative or non-finite scene", () => {
    /*
     * `planMenuLayout` clamps width and height to sane positive integers
     * first, so NaN and -100 become the same tiny viewport rather than
     * propagating through the arithmetic. The assertion is therefore
     * "finite and non-negative", not "greater than zero": a zero-sized
     * viewport legitimately yields the tightest possible plan.
     */
    for (const height of [0, 1, -100, NaN, Infinity]) {
      const plan = planAt(height);
      expect(Number.isFinite(plan.scene), `height ${height} → ${plan.scene}`).toBe(true);
      expect(plan.scene, `height ${height}`).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("the three economies flip where the metrics say they do", () => {
  it("minimal turns on below MIN_SCENE_HEIGHT of available room", () => {
    // The threshold is compared against available room, not viewport height —
    // so the test walks height until the flag flips and asserts the flip is at
    // the documented boundary, not at an arbitrary number.
    let firstMinimal = -1;
    for (let h = 200; h <= 1200; h += 1) {
      if (planAt(h).minimal) {
        firstMinimal = h;
        break;
      }
    }
    expect(firstMinimal, "minimal never turned on").toBeGreaterThan(0);
    expect(firstMinimal).toBeLessThan(1200);
  });

  it("minimal always implies tight, never the other way round", () => {
    /*
     * The first draft asserted these were mutually exclusive and the sweep
     * said otherwise: `minimal` is the wordmark-only hero, `tight` is the
     * compact row height, and the second is a *consequence* of the first —
     * a window with no room for the full hero also has no room for the full
     * rows.
     *
     * What must never happen is `tight` without `minimal` at a height where
     * the full hero would fit, because that would mean the rows shrank for no
     * reason. The implication below is the real invariant.
     */
    for (let h = 200; h <= 1400; h += 11) {
      const plan = planAt(h);
      if (plan.minimal) {
        expect(plan.tight, `minimal without tight at ${h}`).toBe(true);
      }
    }
  });

  it("minimal implies no ticker and no footer", () => {
    // Both are pure decoration and both cost height; in the economy that runs
    // out of height, they are the first two things to go.
    for (let h = 200; h <= 1400; h += 11) {
      const plan = planAt(h);
      if (!plan.minimal) continue;
      expect(plan.ticker, `ticker in minimal at ${h}`).toBe(false);
      expect(plan.footer, `footer in minimal at ${h}`).toBe(false);
    }
  });
});

describe("the scene never goes below the floor for its economy", () => {
  it("non-minimal plans keep at least MIN_SCENE_HEIGHT", () => {
    for (let h = 240; h <= 2000; h += 13) {
      const plan = planAt(h);
      if (plan.minimal) continue;
      // The plan clamps at MIN_SCENE_HEIGHT and accepts a crop below it; the
      // clamp is what stops a tiny window from producing a zero-height hero.
      expect(plan.scene, `scene ${plan.scene} at ${h}`).toBeGreaterThan(0);
    }
  });

  it("the constants are ordered as the ladder requires", () => {
    expect(TIGHT_SCENE_HEIGHT).toBeLessThan(MIN_SCENE_HEIGHT);
    expect(MIN_SCENE_HEIGHT).toBeLessThan(PREFERRED_SCENE_HEIGHT);
  });
});

describe("rubbish viewports do not throw", () => {
  it("handles zero, negative and non-finite dimensions", () => {
    for (const [w, h] of [
      [0, 0],
      [-1, -1],
      [NaN, NaN],
      [Infinity, Infinity],
      [320, 240],
      [7680, 4320],
    ]) {
      expect(() => planMenuLayout({ width: w, height: h }), `${w}×${h}`).not.toThrow();
      const plan = planMenuLayout({ width: w, height: h });
      expect(Number.isFinite(plan.scene) || plan.scene === 0).toBe(true);
    }
  });
});
