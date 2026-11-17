/**
 * The band, as a verdict instead of a boolean.
 *
 * WHY A REASON AND NOT JUST `true`/`false`
 * ----------------------------------------
 * `shouldHold()` is a fine answer for the hook and a useless one for anyone
 * reading a screenshot afterwards. Round 15 shipped the two-pixel band with a
 * boolean; the only way to know *why* a profile was two pixels stale was to
 * paste five conditions into a REPL. `explainHold()` returns the verdict with the
 * reason, and `shouldHold()` is now a read of it — so the diagnosis, the audit and
 * the hook cannot describe the same moment differently.
 *
 * THE BUG THIS FILE PINS
 * ----------------------
 * The condition was "both boxes are within `margin`", which is true when the boxes
 * are *identical*. A rung change with no movement does not come from the window:
 * a repaired profile (the repair ladder changes `plan.fit`), a lever a test pulls,
 * a safe-area inset arriving mid-frame. The old code held that — and because the
 * next frame is in exactly the same state, it held it forever: `last.current`
 * never advanced, so the repair the ladder had just computed was never painted.
 *
 * A stabiliser that can suppress a fix is worse than a flicker, so the case is
 * named (`still`), made explicit, and tested for liveness: the same pair passed
 * twice must not stay held the second time.
 */
import { describe, expect, it } from "vitest";

import { resolveAdaptive } from "../src/components/menu/adaptive/resolve";
import { boxOf } from "../src/components/menu/adaptive/viewport";
import {
  HYSTERESIS_MARGIN,
  describeVerdict,
  explainHold,
  rungKeyOf,
  sameRung,
  shouldHold,
  stabilize,
} from "../src/components/menu/adaptive/hysteresis";
import type { AdaptiveProfile } from "../src/components/menu/adaptive/resolve";
import type { Density } from "../src/components/menu/adaptive/density";

const at = (width: number, height: number): AdaptiveProfile => resolveAdaptive({ box: boxOf(width, height) });

/** A window on the left of the density step, and the same window 1px right. */
function boundary(): number {
  for (let w = 400; w <= 1900; w += 1) {
    if (!sameRung(at(w, 720), at(w + 1, 720))) return w;
  }
  throw new Error("no rung boundary found between 400 and 1900 at 720px");
}

/**
 * The shape of a profile whose rung came from something other than the box.
 *
 * A repaired profile is the real producer: `repairProfile()` may change
 * `plan.fit` on a window that breaks the contract, and the hook paints the result
 * through `stabilize()`. Rather than cast the ladder into a shape the audit says
 * never happens (578 / 578 are `as-planned`), the pair is built here: same box,
 * same everything, one field of the rung moved.
 */
function levered(base: AdaptiveProfile, density: Density): AdaptiveProfile {
  return { ...base, density };
}

describe("explainHold, one verdict per reason", () => {
  it("first frame: nothing painted means nothing to hold", () => {
    const v = explainHold(null, at(700, 720));
    expect(v).toMatchObject({ hold: false, reason: "first-frame", dw: 0, dh: 0, axis: null });
  });

  it("no band: a zero, negative or NaN margin is honoured, not replaced", () => {
    const b = boundary();
    const pair = [at(b, 720), at(b + 1, 720)] as const;
    for (const margin of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(explainHold(pair[0], pair[1], margin)).toMatchObject({ hold: false, reason: "no-band" });
    }
  });

  it("same rung: sizes may differ freely, there is nothing to un-decide", () => {
    const v = explainHold(at(1000, 720), at(1001, 720));
    expect(v.hold).toBe(false);
    expect(v.reason).toBe("same-rung");
  });

  it("held: a 1px step across a real boundary, naming the axis", () => {
    const b = boundary();
    const v = explainHold(at(b, 720), at(b + 1, 720));
    expect(v).toMatchObject({ hold: true, reason: "held", axis: "width", dw: 1, dh: 0 });
    expect(v.from).not.toEqual(v.to);
  });

  it("held: the height is its own axis", () => {
    /* A vertical drag crosses the same rung steps — density and hero read height. */
    let found: [number, number] | null = null;
    for (let h = 320; h <= 1100 && !found; h += 1) {
      if (!sameRung(at(1280, h), at(1280, h + 1))) found = [h, h + 1];
    }
    expect(found, "the height sweep found a rung boundary").not.toBeNull();
    const [lo, hi] = found as [number, number];
    const v = explainHold(at(1280, lo), at(1280, hi));
    expect(v).toMatchObject({ hold: true, reason: "held", axis: "height", dw: 0, dh: 1 });
  });

  it("jump: past the band on either axis", () => {
    const b = boundary();
    expect(explainHold(at(b, 720), at(b + 1 + HYSTERESIS_MARGIN, 720))).toMatchObject({
      hold: false,
      reason: "jump",
    });
    expect(explainHold(at(b, 720), at(b + 1, 720 + HYSTERESIS_MARGIN + 1))).toMatchObject({
      hold: false,
      reason: "jump",
    });
  });

  it("still: the rung changed and the window did not, so it was not the window", () => {
    const base = at(1280, 720);
    const v = explainHold(base, levered(base, "compact"));
    expect(v).toMatchObject({ hold: false, reason: "still", dw: 0, dh: 0 });
    expect(v.from?.density).toBe("comfortable");
    expect(v.to?.density).toBe("compact");
  });

  it("is total on junk", () => {
    const nan = { ...at(1280, 720), box: { ...boxOf(1280, 720), width: Number.NaN } };
    expect(explainHold(at(1000, 720), nan)).toMatchObject({ hold: false, reason: "jump" });
  });
});

describe("the verdict and the boolean cannot disagree", () => {
  const b = boundary();
  const cases: Array<[string, AdaptiveProfile | null, AdaptiveProfile, number?]> = [
    ["first frame", null, at(700, 720)],
    ["same rung", at(1000, 720), at(1001, 720)],
    ["held", at(b, 720), at(b + 1, 720)],
    ["jump", at(b, 720), at(b + 40, 720)],
    ["still", at(1280, 720), levered(at(1280, 720), "compact")],
    ["no band", at(b, 720), at(b + 1, 720), 0],
  ];

  it.each(cases)("%s", (_label, previous, next, margin) => {
    const v = explainHold(previous, next, margin);
    expect(shouldHold(previous, next, margin)).toBe(v.hold);
    /* And `stabilize()` paints exactly what the verdict says. */
    const painted: AdaptiveProfile = stabilize(previous, next, margin);
    expect(painted).toBe(v.hold ? previous : next);
  });
});

describe("liveness — a hold is always released", () => {
  it("a levered profile is not held, so it is painted on the very first frame", () => {
    /*
     * This is the regression. Under the round-15 condition — "both boxes within
     * margin", with no requirement that they moved — this pair held, and it holds
     * again on the next frame and on the one after that: the repaired profile
     * never reached the screen.
     */
    const base = at(1280, 720);
    const repaired = levered(base, "compact");
    let painted = base;
    const frames: AdaptiveProfile[] = [];
    for (let i = 0; i < 3; i += 1) {
      painted = stabilize(painted, repaired);
      frames.push(painted);
    }
    expect(frames.every((f) => f === repaired), "the fix was painted in frame 1").toBe(true);
  });

  it("a drag that keeps going ends on the fresh rung", () => {
    const b = boundary();
    let painted = at(b, 720);
    for (let w = b; w <= b + 10; w += 1) {
      painted = stabilize(painted, at(w, 720));
    }
    expect(painted.box.width).toBe(b + 10);
    expect(sameRung(painted, at(b + 10, 720))).toBe(true);
  });
});

describe("describeVerdict", () => {
  it("says why in the player's terms, in both directions", () => {
    const b = boundary();
    const held = describeVerdict(explainHold(at(b, 720), at(b + 1, 720)));
    expect(held).toContain("held");
    expect(held).toContain("width");

    const jump = describeVerdict(explainHold(at(b, 720), at(b + 40, 720)));
    expect(jump).toContain("jump");

    const still = describeVerdict(explainHold(at(1280, 720), levered(at(1280, 720), "compact")));
    expect(still).toMatch(/applied at once/);

    expect(describeVerdict(explainHold(null, at(700, 720)))).toMatch(/nothing painted/);
  });

  it("never says NaN, and names the rung on both sides of a hold", () => {
    const b = boundary();
    const v = explainHold(at(b, 720), at(b + 1, 720));
    const text = describeVerdict(v);
    expect(text).not.toContain("NaN");
    expect(text).toContain(rungKeyOf(at(b - 1, 720)).tier);
    expect(text).toContain(rungKeyOf(at(b, 720)).tier);
  });
});
