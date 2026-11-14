import { describe, expect, it } from "vitest";
import { clamp, clamp01, damp, lerp } from "../src/utils/math";

describe("clamp", () => {
  it("bounds on both sides and passes through in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("maps NaN to the lower bound (NaN comparisons are false)", () => {
    expect(clamp(NaN, 2, 8)).toBe(2);
  });

  it("clamp01 is the 0..1 case", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(7)).toBe(1);
  });
});

describe("lerp", () => {
  it("interpolates and does not clamp t", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 2)).toBe(30);
  });
});

describe("damp", () => {
  it("moves towards the target without overshooting", () => {
    const mid = damp(0, 1, 6, 1 / 60);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it("is frame-rate independent: 2 × 1/120s lands where 1 × 1/60s does", () => {
    let a = 0;
    a = damp(a, 1, 6, 1 / 60);
    let b = 0;
    b = damp(b, 1, 6, 1 / 120);
    b = damp(b, 1, 6, 1 / 120);
    expect(b).toBeCloseTo(a, 10);
  });

  it("never overshoots on a very long frame (the old Math.min clamp did less)", () => {
    expect(damp(0, 1, 6, 100)).toBeCloseTo(1, 10);
  });

  it("is inert for zero/negative rate or dt, and for junk", () => {
    expect(damp(0.3, 1, 0, 1 / 60)).toBe(0.3);
    expect(damp(0.3, 1, -2, 1 / 60)).toBe(0.3);
    expect(damp(0.3, 1, 6, 0)).toBe(0.3);
    expect(damp(0.3, 1, 6, -1)).toBe(0.3);
  });
});

describe("damp — a non-finite target must not become a non-finite value", () => {
  /*
   * `damp()` guarded `rate`, guarded `dt`, and clamped `k` to 0..1 — but not
   * the multiplication. `lerp(0, Infinity, 0.5)` is Infinity, so the very
   * first frame returned Infinity.
   *
   * The failure is invisible in code review and visible on screen as a shape
   * that stops being drawn: a canvas ignores a path with a non-finite
   * coordinate rather than throwing. Reachable from a corrupted save, because
   * `restoreRun()` ran `Math.max(0, Infinity)` on px/py/shield/combo, and
   * `Math.max` passes Infinity through.
   */
  it("holds the current value when the target is infinite", () => {
    expect(damp(12, Infinity, 8, 0.016)).toBe(12);
    expect(damp(12, -Infinity, 8, 0.016)).toBe(12);
    expect(damp(0, Infinity, 1, 0.016)).toBe(0);
  });

  it("holds the current value when the target is NaN", () => {
    expect(damp(12, NaN, 8, 0.016)).toBe(12);
  });

  it("still converges for real input", () => {
    // One second of a rate-8 damp covers 1 − e⁻⁸ ≈ 99.97% of the distance.
    const out = damp(0, 100, 8, 1);
    expect(out).toBeGreaterThan(99.9);
    expect(out).toBeLessThanOrEqual(100);
  });

  it("never returns a non-finite value for any finite input pair", () => {
    for (const current of [0, -50, 1e6]) {
      for (const target of [0, 100, -1e6]) {
        for (const dt of [0.001, 0.016, 0.25, 2]) {
          const out = damp(current, target, 60, dt);
          expect(Number.isFinite(out), `damp(${current},${target},60,${dt})`).toBe(true);
        }
      }
    }
  });
});
