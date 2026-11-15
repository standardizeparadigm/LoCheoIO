/**
 * `planPlayfield()` — the engine's arithmetic, outside the engine.
 *
 * The move must not change how the game feels, so the first test rebuilds the
 * four expressions `resize()` used to contain and compares them to the plan at
 * every canvas size in a sweep. The rest pins the new numbers and the guards.
 */
import { describe, expect, it } from "vitest";

import {
  MIN_PLAYFIELD_H,
  MIN_PLAYFIELD_W,
  describePlayfield,
  planPlayfield,
  playable,
  saneCanvasSide,
  saneDpr,
} from "../src/game/adaptive/playfield";

/** `[a, b]` clamp exactly as `engine.ts` writes it. */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

describe("the move is a move, not a rebalance", () => {
  it("reproduces the engine's own formulas", () => {
    for (let w = 240; w <= 2600; w += 53) {
      for (let h = 320; h <= 1600; h += 47) {
        const plan = planPlayfield(w, h, 1);
        const S = clamp(h / 700, 0.62, 1.45);
        const SP = clamp((w / 1000 + h / 700) / 2, 0.6, 1.25);
        const pr = clamp(Math.min(w, h) * 0.055, 21, 38);
        const stars = clamp((w * h) / 26000, 18, 46);
        const decor = clamp((w * h) / 42000, 10, 26);
        expect(plan.itemScale).toBeCloseTo(S, 2);
        expect(plan.playerSpeed).toBeCloseTo(SP, 2);
        expect(plan.playerRadius).toBeCloseTo(pr, 0);
        expect(Math.abs(plan.stars - stars)).toBeLessThanOrEqual(1);
        expect(Math.abs(plan.decor - decor)).toBeLessThanOrEqual(1);
        expect(plan.tile).toBe(Math.round(72 * clamp(h / 700, 0.62, 1.45)));
      }
    }
  });

  it("never lets the jar leave the board", () => {
    for (let w = 240; w <= 2600; w += 41) {
      for (let h = 320; h <= 1600; h += 37) {
        const plan = planPlayfield(w, h, 1);
        expect(plan.playerRadius * 2, `${w}×${h}`).toBeLessThanOrEqual(Math.min(w, h));
      }
    }
  });
});

describe("the new numbers", () => {
  it("never grows past the old width-only rule", () => {
    /*
     * The old HUD was `clamp(w / 900, 0.78, 1.16)`. The new rule takes the min
     * of that ramp and a height ramp, so on a tall board the two agree exactly
     * and on a short one the HUD is smaller. It must never be *larger* — that
     * would be a regression dressed as an improvement.
     */
    for (const [w, h] of [[1280, 720], [1920, 820], [1920, 1080], [2560, 1440], [3840, 2160]]) {
      const legacy = Math.min(1.16, Math.max(0.78, w / 900));
      expect(planPlayfield(w, h, 1).hudScale).toBeLessThanOrEqual(legacy + 0.001);
    }
    expect(planPlayfield(1920, 1080, 1).hudScale).toBeCloseTo(1.16, 2);
    expect(planPlayfield(1280, 720, 1).hudScale).toBeGreaterThan(0.95);
  });

  it("shrinks the HUD when the board is short, which the width-only rule did not", () => {
    expect(planPlayfield(1920, 400, 1).hudScale).toBeLessThan(planPlayfield(1920, 1080, 1).hudScale);
  });

  it("scales the HUD with the shortest side", () => {
    expect(planPlayfield(320, 320, 1).hudScale).toBeLessThan(planPlayfield(1280, 720, 1).hudScale);
    expect(planPlayfield(1280, 720, 1).hudScale).toBeLessThan(planPlayfield(1920, 1080, 1).hudScale);
    for (const [w, h] of [[320, 320], [1280, 720], [3840, 2160]]) {
      const plan = planPlayfield(w, h, 1);
      expect(plan.hudScale).toBeGreaterThanOrEqual(0.72);
      expect(plan.hudScale).toBeLessThanOrEqual(1.16);
    }
  });

  it("reserves a bottom strip for the touch stick, bounded", () => {
    for (const h of [320, 400, 720, 1080, 2160]) {
      const plan = planPlayfield(1280, h, 1);
      expect(plan.safeBottom).toBeGreaterThanOrEqual(56);
      expect(plan.safeBottom).toBeLessThanOrEqual(140);
    }
  });

  it("keeps spawns away from the wall", () => {
    for (const [w, h] of [[360, 640], [1280, 720], [3840, 2160]]) {
      const plan = planPlayfield(w, h, 1);
      expect(plan.edgeMargin).toBeGreaterThanOrEqual(12);
      expect(plan.edgeMargin).toBeLessThanOrEqual(48);
    }
  });
});

describe("guards", () => {
  it("floors a zero, negative or non-finite canvas", () => {
    for (const [w, h] of [[0, 0], [-10, -10], [NaN, NaN], [Infinity, 0], [undefined, null]]) {
      const plan = planPlayfield(w, h, 1);
      expect(plan.width).toBeGreaterThanOrEqual(MIN_PLAYFIELD_W);
      expect(plan.height).toBeGreaterThanOrEqual(MIN_PLAYFIELD_H);
      for (const value of [plan.itemScale, plan.playerSpeed, plan.playerRadius, plan.hudScale, plan.stars, plan.tile]) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it("clamps the device pixel ratio to [1, 2]", () => {
    expect(saneDpr(0.5)).toBe(1);
    expect(saneDpr(3)).toBe(2);
    expect(saneDpr(Infinity)).toBe(1);
    expect(saneDpr(NaN)).toBe(1);
    expect(planPlayfield(800, 600, 3).dpr).toBe(2);
  });

  it("saneCanvasSide rounds and floors", () => {
    expect(saneCanvasSide(800.7, 240)).toBe(800);
    expect(saneCanvasSide(-1, 240)).toBe(240);
    expect(saneCanvasSide(NaN, 320)).toBe(320);
  });
});

describe("playable", () => {
  it("refuses a board too small for the jar and the produce", () => {
    expect(playable(planPlayfield(320, 320, 1))).toBe(false);
    expect(playable(planPlayfield(375, 667, 1))).toBe(true);
    expect(playable(planPlayfield(1280, 720, 1))).toBe(true);
  });

  it("describes itself in one line", () => {
    expect(describePlayfield(planPlayfield(1280, 720, 1))).toContain("1280×720");
  });
});
