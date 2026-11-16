/**
 * Two pixels of memory, and why they are worth having.
 *
 * `resolveAdaptive()` is a step function of the window, which is right for *what*
 * to paint and wrong for *when*: dragging an edge across a breakpoint re-lays-out
 * the screen on every mouse move, and a pointer resting on the boundary oscillates.
 * `stabilize()` keeps the previous rung until the window is more than `margin` away.
 *
 * The tests below are the two halves of that claim: the hold happens on jitter, and
 * the hold never survives a real move.
 */
import { describe, expect, it } from "vitest";

import { PRESETS } from "../src/components/menu/adaptive/presets";
import { boxOf } from "../src/components/menu/adaptive/viewport";
import { resolveAdaptive, type AdaptiveProfile } from "../src/components/menu/adaptive/resolve";
import {
  HYSTERESIS_MARGIN,
  rungKeyOf,
  sameRung,
  shouldHold,
  stabilize,
} from "../src/components/menu/adaptive/hysteresis";
import { repairProfile } from "../src/components/menu/adaptive/repair";

const at = (w: number, h: number): AdaptiveProfile => resolveAdaptive({ box: boxOf(w, h) });

/** Drive a sequence of sizes through the stabiliser, the way a drag would. */
function drag(sizes: Array<[number, number]>, margin = HYSTERESIS_MARGIN): AdaptiveProfile[] {
  let previous: AdaptiveProfile | null = null;
  const painted: AdaptiveProfile[] = [];
  for (const [w, h] of sizes) {
    const next = stabilize(previous, at(w, h), margin);
    previous = next;
    painted.push(next);
  }
  return painted;
}

/** Sizes from `from` to `to` inclusive, 1px at a time. */
function sweep(from: number, to: number, height: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const step = from <= to ? 1 : -1;
  for (let w = from; step > 0 ? w <= to : w >= to; w += step) out.push([w, height]);
  return out;
}

describe("the margin", () => {
  it("is two pixels, and that is a decision", () => {
    /*
     * Chosen against the grid, not by taste: the planner's thresholds are integer
     * pixels and the smallest visible step in the chrome (the panel header, 22 vs
     * 14px) is 8px, so a 2px hold can never straddle two states that differ by less
     * than the band it holds.
     */
    expect(HYSTERESIS_MARGIN).toBe(2);
  });

  it("is off for a zero, negative or non-finite margin", () => {
    const a = at(700, 720);
    const b = at(701, 720);
    for (const margin of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(shouldHold(a, b, margin), String(margin)).toBe(false);
    }
  });
});

describe("rungKeyOf", () => {
  it("names the things a player can see change in one frame", () => {
    const key = rungKeyOf(at(1280, 720));
    expect(Object.keys(key).sort()).toEqual(["density", "fit", "hero", "panelHeight", "tier"]);
    for (const value of Object.values(key)) expect(value).toBeDefined();
  });

  it("is equal for two sizes inside one rung, even though the numbers differ", () => {
    expect(sameRung(at(1280, 720), at(1281, 721))).toBe(true);
    expect(rungKeyOf(at(1280, 720)).panelHeight).toBe(rungKeyOf(at(1281, 721)).panelHeight);
  });
});

describe("shouldHold", () => {
  it("never holds the first frame", () => {
    // Holding nothing is how a profile would get stuck at the SSR reference size.
    expect(shouldHold(null, at(320, 480))).toBe(false);
  });

  it("does not hold when the rung is unchanged", () => {
    expect(shouldHold(at(1280, 720), at(1281, 720))).toBe(false);
  });

  it("holds a one-pixel step across a rung change", () => {
    const boundary = findBoundary();
    const before = at(boundary - 1, 720);
    const after = at(boundary, 720);
    expect(sameRung(before, after)).toBe(false);
    expect(shouldHold(before, after)).toBe(true);
  });

  it("refuses a jump larger than the margin", () => {
    const boundary = findBoundary();
    expect(shouldHold(at(boundary - 1, 720), at(boundary + 40, 720))).toBe(false);
  });

  it("refuses when either side of the box moved too far", () => {
    const a = at(700, 720);
    const b = at(701, 780);
    expect(shouldHold(a, b)).toBe(false);
  });
});

describe("a drag across a breakpoint", () => {
  /*
   * The bug: 1px steps across the boundary change the rung on *every* frame from
   * the boundary onwards, because each new size resolves a different plan. With the
   * stabiliser, the painted rung changes at most twice over the whole 60px sweep:
   * once when the pointer leaves the old rung by more than 2px, and once more if the
   * window comes back.
   */
  const boundary = findBoundary();

  it("changes the painted rung at most twice in a 60px sweep", () => {
    const painted = drag(sweep(boundary - 30, boundary + 30, 720));
    let changes = 0;
    for (let i = 1; i < painted.length; i += 1) {
      if (rungKeyOf(painted[i]).density !== rungKeyOf(painted[i - 1]).density) changes += 1;
    }
    // Without the hold this is ~30 changes; with it, 1 or 2.
    expect(changes).toBeLessThanOrEqual(2);
  });

  it("does not latch: the sweep ends on the rung the final size belongs to", () => {
    const painted = drag(sweep(boundary - 30, boundary + 30, 720));
    const last = painted[painted.length - 1];
    expect(sameRung(last, at(boundary + 30, 720))).toBe(true);
    expect(last.plan.scene).toBe(at(boundary + 30, 720).plan.scene);
  });

  it("never stays on a rung more than `margin` pixels away", () => {
    const painted = drag(sweep(boundary - 30, boundary + 30, 720));
    for (const [i, profile] of painted.entries()) {
      const w = boundary - 30 + i;
      expect(Math.abs(profile.box.width - w), `step ${i}`).toBeLessThanOrEqual(HYSTERESIS_MARGIN);
    }
  });

  it("applies a rotation-sized jump immediately", () => {
    const portrait = at(720, 1280);
    const landscape = at(1280, 720);
    expect(stabilize(portrait, landscape)).toBe(landscape);
  });
});

describe("stabilize", () => {
  it("is total: junk margins and a null previous never throw", () => {
    const next = at(1280, 720);
    expect(stabilize(null, next, Number.NaN)).toBe(next);
    expect(stabilize(null, next)).toBe(next);
    expect(stabilize(next, next, -5)).toBe(next);
  });

  it("returns one of its two arguments, never a new profile", () => {
    // Identity matters: the caller stores this in a ref, and a fresh object every
    // frame would defeat the memo and the ref comparison.
    const previous = at(699, 720);
    const next = at(700, 720);
    const result = stabilize(previous, next);
    expect(result === previous || result === next).toBe(true);
  });

  it("holds a repaired profile without losing its rung report", () => {
    // Every profile the hook paints carries the rung that produced it; a hold must
    // return that profile *whole*, or `data-adaptive-repair` would blink out for the
    // two pixels the rung is being held.
    const boundary = findBoundary();
    const repaired = {
      ...repairProfile({ box: boxOf(boundary - 1, 720) }).profile,
      repair: { rung: "as-planned", ok: true },
    };
    const held = stabilize(repaired, at(boundary, 720));
    expect(held).toBe(repaired);
    expect(held.repair?.rung).toBe("as-planned");
  });
});

describe("no preset is affected", () => {
  it("every preset keeps its own rung when resolved alone", () => {
    for (const preset of PRESETS) {
      const profile = at(preset.width, preset.height);
      // A preset arriving from another preset's size is a jump, never a hold.
      expect(stabilize(at(preset.width + 100, preset.height + 100), profile)).toBe(profile);
    }
  });
});

/**
 * The first width, at 720px tall, where the chrome's arrangement changes.
 *
 * Found by scanning rather than hardcoded: a hardcoded boundary is a test that
 * passes for the wrong reason the day a threshold moves.
 */
function findBoundary(): number {
  for (let w = 400; w < 2000; w += 1) {
    if (!sameRung(at(w, 720), at(w + 1, 720))) return w + 1;
  }
  throw new Error("no rung boundary between 400 and 2000px — the chrome never changes shape?");
}
