/**
 * `scale.ts` — the ramps.
 *
 * A ramp is only useful if it is *total*: every input in the app eventually
 * reaches one (a resize can report `NaN` for one frame, a persisted zoom can be
 * `Infinity`). Each function here is asserted over a hostile input list, not
 * just the happy one, and each assertion names what it protects.
 */
import { describe, expect, it } from "vitest";
import {
  fitText,
  fluid,
  half,
  legible,
  ordered,
  percent,
  quantised,
  ramp,
  scaled,
  unit,
  within,
} from "../src/components/menu/adaptive/scale";

const HOSTILE = [NaN, Infinity, -Infinity, -1, 0, 0.5, 1, 1.5, 1e9, "x", null, undefined, {}] as const;

describe("unit", () => {
  it("clamps into 0..1 and reads NaN as 0", () => {
    expect(unit(0.42)).toBe(0.42);
    expect(unit(-3)).toBe(0);
    expect(unit(9)).toBe(1);
    expect(unit(NaN)).toBe(0);
    expect(unit("0.5")).toBe(0);
  });
});

describe("ramp", () => {
  it("maps a range onto 0..1", () => {
    expect(ramp(360, 360, 1080)).toBe(0);
    expect(ramp(720, 360, 1080)).toBe(0.5);
    expect(ramp(1080, 360, 1080)).toBe(1);
    expect(ramp(2000, 360, 1080)).toBe(1);
  });

  it("follows an inverted range in the direction asked for", () => {
    // "smaller is bigger" — the natural way to write a descending ramp.
    expect(ramp(1080, 1080, 360)).toBe(0);
    expect(ramp(360, 1080, 360)).toBe(1);
    expect(ramp(720, 1080, 360)).toBeCloseTo(0.5, 5);
  });

  it("never divides by zero or returns a non-finite value", () => {
    expect(ramp(5, 100, 100)).toBe(0);
    expect(ramp(100, 100, 100)).toBe(1);
    for (const value of HOSTILE) {
      for (const [from, to] of [
        [0, 0],
        [NaN, NaN],
        [Infinity, -Infinity],
        [10, -10],
      ] as const) {
        const r = ramp(value, from, to);
        expect(Number.isFinite(r), `${String(value)} in ${from}..${to}`).toBe(true);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("spans", () => {
  it("repairs an inverted span instead of trusting it", () => {
    expect(ordered({ min: 14, max: 9 })).toEqual({ min: 9, max: 14 });
    expect(ordered({ min: NaN, max: 9 })).toEqual({ min: 0, max: 9 });
    expect(within(12, { min: 14, max: 9 })).toBe(12);
    expect(within(-5, { min: 9, max: 14 })).toBe(9);
    expect(within(NaN, { min: 9, max: 14 })).toBe(9);
  });

  it("interpolates at the ends and clamps outside them", () => {
    expect(fluid({ min: 10, max: 20 }, 0)).toBe(10);
    expect(fluid({ min: 10, max: 20 }, 1)).toBe(20);
    expect(fluid({ min: 10, max: 20 }, 0.5)).toBe(15);
    expect(fluid({ min: 10, max: 20 }, 7)).toBe(20);
    expect(fluid({ min: 10, max: 20 }, NaN)).toBe(10);
  });

  it("scales a span by a bounded multiplier", () => {
    expect(scaled({ min: 10, max: 20 }, 2)).toEqual({ min: 20, max: 40 });
    // The regression: the first version compared against 0 and let Infinity through.
    const huge = scaled({ min: 10, max: 20 }, Infinity);
    expect(huge).toEqual({ min: 40, max: 80 });
    const tiny = scaled({ min: 10, max: 20 }, 0);
    expect(tiny).toEqual({ min: 2.5, max: 5 });
    const nan = scaled({ min: 10, max: 20 }, NaN);
    expect(nan).toEqual({ min: 10, max: 20 });
  });
});

describe("rounding", () => {
  it("rounds to half a pixel", () => {
    expect(half(11.2)).toBe(11);
    expect(half(11.3)).toBe(11.5);
    expect(half(11.8)).toBe(12);
    expect(half(NaN)).toBe(0);
  });

  it("quantises to a step and never below the floor", () => {
    expect(quantised(11.2, 0.5, 9)).toBe(11);
    expect(quantised(0.1, 0.5, 9)).toBe(9);
    expect(quantised(NaN, 0.5, 9)).toBe(9);
    expect(quantised(10, 0, 9)).toBe(10);
  });
});

describe("legible", () => {
  it("keeps a size between its floor and its cap", () => {
    expect(legible(9.26, 9, 12)).toBe(9.5);
    expect(legible(2, 9, 12)).toBe(9);
    expect(legible(40, 9, 12)).toBe(12);
  });

  it("lets the floor win when floor and cap contradict", () => {
    // A cap below the floor is a bug in the caller; legibility is the requirement.
    expect(legible(11, 12, 10)).toBe(12);
  });

  it("is total", () => {
    for (const v of HOSTILE) {
      const size = legible(v, 9, 12);
      expect(Number.isFinite(size)).toBe(true);
      expect(size).toBeGreaterThanOrEqual(9);
      expect(size).toBeLessThanOrEqual(12);
    }
  });
});

describe("fitText", () => {
  it("finds the largest size that fits a declared box", () => {
    // three 1.5 line-height lines in 90px → 20px each
    expect(fitText(90, 3, 1.5)).toBe(20);
    expect(fitText(0, 2, 1.2)).toBe(1);
  });

  it("does not divide by zero when the caller passes no lines", () => {
    expect(Number.isFinite(fitText(120, 0, 1))).toBe(true);
    expect(Number.isFinite(fitText(NaN, NaN, NaN))).toBe(true);
  });
});

describe("percent", () => {
  it("emits a CSS-ready string for any input", () => {
    expect(percent(0.5)).toBe("50%");
    expect(percent(2)).toBe("100%");
    expect(percent(NaN)).toBe("0%");
    expect(percent(0.3333, 1)).toBe("33.3%");
  });
});
