/**
 * Safe-area insets in the plan, and one known limitation that is now pinned.
 *
 * `planMenuLayout()` subtracts `viewport.inset` before deciding anything, so
 * every economy reasons about *usable* pixels. Two properties have to hold:
 *
 *   1. `scene + reserve` equals the **usable** height when the plan fits;
 *   2. a rubbish inset (NaN, negative, absurdly large) cannot collapse or grow
 *      the layout.
 *
 * The third property — "a smaller window never produces a taller hero" — does
 * **not** hold, and the last block in this file says so with the numbers. It was
 * already false before insets existed; sweeping an inset at one-pixel steps is
 * simply the first time anything walked that axis finely enough to see it.
 */
import { describe, expect, it } from "vitest";
import {
  MAX_INSET,
  occupiesExactly,
  planFits,
  planMenuLayout,
  usableHeight,
} from "../src/components/menu/layout";

describe("usableHeight", () => {
  it("subtracts the inset", () => {
    expect(usableHeight({ width: 844, height: 390, inset: 78 })).toBe(312);
  });

  it("is the raw height when there is no inset", () => {
    expect(usableHeight({ width: 1280, height: 720 })).toBe(720);
    expect(usableHeight({ width: 1280, height: 720, inset: 0 })).toBe(720);
  });

  it("ignores a non-finite inset rather than poisoning the height", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(usableHeight({ width: 1280, height: 720, inset: bad }), String(bad)).toBe(720);
    }
  });

  it("ignores a negative inset — nothing means 'grow the viewport'", () => {
    expect(usableHeight({ width: 1280, height: 720, inset: -100 })).toBe(720);
  });

  it("clamps an absurd inset", () => {
    expect(usableHeight({ width: 1280, height: 720, inset: 9999 })).toBe(720 - MAX_INSET);
  });

  it("never returns less than 1", () => {
    expect(usableHeight({ width: 100, height: 50, inset: 200 })).toBe(1);
    expect(usableHeight({ width: 0, height: 0 })).toBe(1);
  });
});

describe("the plan under an inset", () => {
  it("lays out against the usable height, not the raw one", () => {
    // 1280×720 with a 78px notch inset leaves 642 usable and the plan fills it.
    const vp = { width: 1280, height: 720, inset: 78 };
    const plan = planMenuLayout(vp);
    expect(occupiesExactly(plan, vp)).toBe(true);
    expect(plan.scene + plan.reserve).toBe(642);
    expect(plan.scene + plan.reserve).not.toBe(720);
  });

  it("still equals the raw height when there is no inset", () => {
    // The regression that matters: every existing call passes no inset at all.
    const vp = { width: 1280, height: 720 };
    const plan = planMenuLayout(vp);
    expect(plan.scene + plan.reserve).toBe(720);
    expect(occupiesExactly(plan, vp)).toBe(true);
  });

  it("reports crop rather than silently drawing a negative hero", () => {
    /*
     * 390 - 78 = 312 usable, which is below MIN_SCENE_HEIGHT + the smallest
     * reserve, so `fit` says so. When cropped the column is deliberately
     * *taller* than the usable height: the hero keeps its 140px floor and the
     * **chrome** is what gets clipped. That is round 3's rule and it must not
     * invert.
     */
    const vp = { width: 844, height: 390, inset: 78 };
    const plan = planMenuLayout(vp);
    expect(plan.fit).toBe("crop");
    expect(plan.scene).toBe(140);
    expect(occupiesExactly(plan, vp)).toBe(false);
  });

  it("does not change a desktop plan that has room to spare", () => {
    const vp = { width: 1920, height: 1080, inset: 78 };
    const plan = planMenuLayout(vp);
    expect(planFits(plan, vp)).toBe(true);
    expect(plan.scene).toBe(1080 - 78 - plan.reserve);
  });

  it("balances the two helpers against each other", () => {
    for (const [w, h, i] of [[1280, 720, 0], [1920, 1080, 78], [844, 390, 78], [375, 667, 44]]) {
      const vp = { width: w, height: h, inset: i };
      const plan = planMenuLayout(vp);
      expect(planFits(plan, vp), `${w}×${h} inset ${i}`).toBe(
        plan.fit !== "crop" && occupiesExactly(plan, vp),
      );
    }
  });

  it("accepts a zero inset without changing the plan", () => {
    // `sane()` floors at 1 and must not be used for the inset; a 0 here is fine.
    const plain = planMenuLayout({ width: 1280, height: 720 });
    const zero = planMenuLayout({ width: 1280, height: 720, inset: 0 });
    expect(zero).toEqual(plain);
  });
});

describe("KNOWN LIMITATION: the hero is not monotonic in the window height", () => {
  /*
   * This block asserts a *defect*, on purpose, so that it is recorded rather
   * than forgotten — and so that fixing it fails here first and reads this
   * comment.
   *
   * Each economy hands the hero back a fixed number of pixels. When the trigger
   * for one fires, the hero jumps *up* by more than the window shrank:
   *
   *     844×600, inset  0    reserve 378 (rich rows)   scene 222
   *     844×600, inset 10    reserve 322 (tight rows)  scene 240   ← +18
   *
   * The jump is real but small, and it was already present before insets —
   * 844×600 and 844×610 differ by 46px of hero for 10px of window. It is not a
   * user-visible bug (both layouts fit; the hero simply gets a little more room
   * at a slightly smaller window) which is why it is recorded rather than fixed
   * in a patch release.
   *
   * The fix would be an economy *search* — enumerate the eight combinations and
   * take the one that maximises the hero, which makes the function monotone by
   * construction. That was attempted in this round and rejected: it also
   * maximises the hero everywhere, so it strips the ticker and the tall rows off
   * a 1920×1080 screen, and 12 existing tests caught it. Doing it properly needs
   * a two-part objective (seat the floor first, then maximise) and that is a
   * layout redesign, not a fix.
   */
  it("jumps upward at the tight-rows boundary, and this is the measurement", () => {
    const big = planMenuLayout({ width: 844, height: 600 }).scene;
    const small = planMenuLayout({ width: 844, height: 600, inset: 10 }).scene;
    expect(small, "the 10px-shorter window has the taller hero").toBeGreaterThan(big);
    // 46px of hero bought by removing 10px of window, because taking the tight
    // rows returns 56px of row height in one step.
    expect(small - big).toBe(46);
  });

  it("is exactly `height - reserve` inside one economy", () => {
    /*
     * This is the guarantee the plan actually rests on: while the economy does
     * not change, the hero is the leftover. Asserting the *relation* rather than
     * monotonicity, because monotonicity is what fails at the boundaries and the
     * relation is what holds everywhere.
     */
    for (const w of [844, 1280, 1920]) {
      for (const inset of [0, 40, 120]) {
        for (let h = 320; h <= 900; h += 7) {
          const vp = { width: w, height: h, inset };
          const plan = planMenuLayout(vp);
          if (plan.fit === "crop") continue; // the floor takes over; different rule
          expect(plan.scene + plan.reserve, `${w}×${h} inset ${inset}`).toBe(usableHeight(vp));
        }
      }
    }
  });
});
