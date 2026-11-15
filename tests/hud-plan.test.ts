/**
 * `planHud()` — the in-game HUD, planned instead of placed.
 *
 * Three halves, in this order:
 *
 *   1. **Nothing moved.** At the reference board the plan reproduces the offsets
 *      `drawHud()` computed inline since v1.0, so this is a move and not a
 *      redesign of the HUD.
 *   2. **The geometry holds.** On every board the engine can produce, the lowest
 *      band is above the touch strip and no two bands overlap.
 *   3. **The ladder works.** Under pressure rows are dropped in the documented
 *      order, and only then is the HUD compressed — tested with synthetic boards
 *      because a real canvas never gets short enough to need it, and dead code
 *      that has never run is not code.
 */
import { describe, expect, it } from "vitest";

import { planPlayfield, type PlayfieldPlan } from "../src/game/adaptive/playfield";
import {
  HUD_DROP_ORDER,
  HUD_MIN_SCALE,
  describeHud,
  planHud,
  traceHud,
  zonesOverlap,
} from "../src/game/adaptive/hud";

const FULL = { combo: true, comboSize: 24, chips: 4, cracks: true } as const;

/** A real board, with the vertical budget squeezed — the engine cannot make one. */
function squeezed(width: number, height: number, safeBottom: number): PlayfieldPlan {
  return { ...planPlayfield(width, height, 1), safeBottom };
}

describe("a move, not a redesign", () => {
  const pf = planPlayfield(1280, 720, 1);
  const hud = planHud(pf, FULL);

  it("reproduces the inline offsets at the reference board", () => {
    const s = pf.hudScale;
    const pad = Math.round(Math.min(26, Math.max(14, pf.width * 0.022)));
    expect(hud.pad).toBe(pad);
    expect(hud.scale).toBe(s);
    expect(hud.scoreY).toBe(pad + 34 * s);
    expect(hud.bestY).toBe(pad + 54 * s);
    expect(hud.staminaY).toBe(pad + 68 * s);
    expect(hud.levelY).toBe(pad + 20 * s);
    expect(hud.jarsY).toBe(pad + 38 * s);
    expect(hud.fillY).toBe(pad + 46 * s);
    expect(hud.clockY).toBe(pad + 70 * s);
    expect(hud.cracksY).toBe(pad + 78 * s);
    expect(hud.staminaWidth).toBe(118 * s);
    expect(hud.crackSize).toBe(16 * s);
    expect(hud.fillWidth).toBe(Math.max(120, Math.min(240, pf.width * 0.24)));
  });

  it("keeps the whole HUD on the reference board", () => {
    expect(hud.compressed).toBe(false);
    expect(hud.showBest).toBe(true);
    expect(hud.showJars).toBe(true);
    expect(hud.showComboBar).toBe(true);
    expect(hud.chipSlots).toBe(4);
    expect(hud.collisions).toEqual([]);
  });

  it("flows the centre column below the clock instead of jumping to 96·s", () => {
    // The engine grows the combo number with the count, so a fixed baseline
    // overlaps the jar line at combo ≥ 20. The plan puts the combo under the
    // clock at *every* size.
    for (const comboSize of [18, 24, 34]) {
      const plan = planHud(pf, { ...FULL, comboSize });
      expect(plan.comboY, `combo ${comboSize}`).toBeGreaterThan(plan.clockY);
      expect(plan.comboBarY, `combo ${comboSize}`).toBeGreaterThan(plan.comboY);
      expect(plan.multY, `combo ${comboSize}`).toBeGreaterThan(plan.comboBarY);
      expect(plan.chipsY, `combo ${comboSize}`).toBeGreaterThan(plan.multY);
      expect(plan.collisions, `combo ${comboSize}`).toEqual([]);
    }
  });
});

describe("the geometry holds", () => {
  it("never paints into the touch strip, on 1 500 boards", () => {
    for (let w = 240; w <= 3840; w += 60) {
      for (let h = 320; h <= 2160; h += 60) {
        const pf = planPlayfield(w, h, 1);
        const hud = planHud(pf, FULL);
        expect(hud.bottom, `${w}×${h}`).toBeLessThanOrEqual(pf.height - pf.safeBottom);
        expect(hud.withinSafeBottom, `${w}×${h}`).toBe(true);
      }
    }
  });

  it("keeps every band inside the canvas", () => {
    for (let w = 240; w <= 3840; w += 120) {
      for (let h = 320; h <= 2160; h += 120) {
        const pf = planPlayfield(w, h, 1);
        const hud = planHud(pf, FULL);
        for (const band of hud.bands) {
          expect(band.zone.x, `${w}×${h} ${band.name}`).toBeGreaterThanOrEqual(-1);
          expect(band.zone.y, `${w}×${h} ${band.name}`).toBeGreaterThanOrEqual(-1);
          expect(band.zone.x + band.zone.w, `${w}×${h} ${band.name}`).toBeLessThanOrEqual(pf.width + 1);
          expect(band.zone.y + band.zone.h, `${w}×${h} ${band.name}`).toBeLessThanOrEqual(pf.height + 1);
        }
      }
    }
  });

  it("leaves no two bands overlapping on any playable board", () => {
    for (let w = 360; w <= 3840; w += 60) {
      for (let h = 420; h <= 2160; h += 60) {
        const hud = planHud(planPlayfield(w, h, 1), FULL);
        expect(hud.collisions, `${w}×${h}`).toEqual([]);
      }
    }
  });

  it("reports the overlap it cannot avoid, instead of hiding it", () => {
    // A 240px-wide board is below `playable()`: the score and the centred level
    // word cannot both have the middle of the canvas.
    const hud = planHud(planPlayfield(240, 320, 1), FULL);
    expect(hud.collisions.length).toBeGreaterThan(0);
    for (const pair of hud.collisions) expect(pair).toMatch(/^[a-z-]+\/[a-z-]+$/);
  });

  it("is deterministic", () => {
    const pf = planPlayfield(1366, 768, 1);
    expect(JSON.stringify(planHud(pf, FULL))).toBe(JSON.stringify(planHud(pf, FULL)));
  });

  it("survives a non-finite canvas", () => {
    for (const [w, h] of [[NaN, NaN], [0, 0], [-1, -1], [Infinity, Infinity]] as const) {
      const hud = planHud(planPlayfield(w, h, 1), FULL);
      expect(Number.isFinite(hud.bottom)).toBe(true);
      expect(hud.bands.length).toBeGreaterThan(0);
    }
    // and a garbage input object
    const hud = planHud(planPlayfield(800, 600, 1), { chips: Number.NaN, comboSize: Number.NaN });
    expect(Number.isFinite(hud.bottom)).toBe(true);
    expect(hud.chipSlots).toBe(0);
  });
});

describe("the ladder under pressure", () => {
  it("drops the chips first, then the combo bar, then the jars, then the best line", () => {
    // 720 of height with 480 reserved for the stick: 240px of HUD budget.
    const pf = squeezed(1280, 720, 480);
    const hud = planHud(pf, FULL);
    expect(hud.withinSafeBottom).toBe(true);
    expect(hud.chipSlots).toBe(0);
    /*
     * Dropping the chips was enough: the combo bar stays, because the ladder
     * stops at the first state that fits. A ladder that always drops everything
     * would be simpler and would throw away rows the player can still read.
     */
    expect(hud.showComboBar).toBe(true);
    // The two text rows survive: clutter goes before information.
    expect(hud.showBest).toBe(true);
    expect(hud.showJars).toBe(true);
    expect(HUD_DROP_ORDER[0]).toBe("chips");
  });

  it("compresses only after every droppable row is gone", () => {
    const pf = squeezed(900, 600, 500); // 100px of budget: no state fits at 1×
    const hud = planHud(pf, FULL);
    expect(hud.compressed).toBe(true);
    expect(hud.scale).toBeLessThan(planPlayfield(900, 600, 1).hudScale);
    expect(hud.scale).toBeGreaterThanOrEqual(HUD_MIN_SCALE);
    expect(hud.chipSlots).toBe(0);
    expect(hud.showBest).toBe(false);
  });

  it("never compresses below the floor, even when nothing fits", () => {
    const hud = planHud(squeezed(720, 720, 719), FULL);
    expect(hud.scale).toBeGreaterThanOrEqual(HUD_MIN_SCALE);
    expect(Number.isFinite(hud.bottom)).toBe(true);
  });

  it("does not compress a board that already fits", () => {
    for (const [w, h] of [[1280, 720], [1920, 1080], [360, 420], [844, 390]] as const) {
      const pf = planPlayfield(w, h, 1);
      const hud = planHud(pf, FULL);
      expect(hud.compressed, `${w}×${h}`).toBe(false);
      expect(hud.scale, `${w}×${h}`).toBe(pf.hudScale);
    }
  });

  it("explains the search it ran", () => {
    const pf = squeezed(1280, 720, 480);
    const trace = traceHud(pf, FULL);
    expect(trace.length).toBeGreaterThan(1);
    expect(trace[0].fits).toBe(false);
    expect(trace.filter((t) => t.fits).length).toBeGreaterThan(0);
    for (const step of trace) {
      expect(["drop", "compress", "floor"]).toContain(step.stage);
      expect(step.bottom).toBeGreaterThan(0);
      expect(step.rows.length).toBeGreaterThan(0);
    }
  });
});

describe("the report", () => {
  it("names what was dropped", () => {
    const full = describeHud(planHud(planPlayfield(1280, 720, 1), FULL));
    expect(full).toContain("full");
    expect(full).toContain("no overlap");

    const tight = describeHud(planHud(squeezed(1280, 720, 480), FULL));
    expect(tight).toContain("dropped");
    expect(tight).toContain("chips");
  });

  it("says nothing about a combo bar that cannot exist without a combo", () => {
    const hud = planHud(planPlayfield(1280, 720, 1), { combo: false, chips: 2, cracks: true });
    expect(hud.showComboBar).toBe(false);
    expect(describeHud(hud)).not.toContain("combo-bar");
  });
});

describe("the band helper", () => {
  it("treats touching edges as separated and 2px overlap as overlap", () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    expect(zonesOverlap(a, { x: 10, y: 0, w: 5, h: 5 })).toBe(false);
    expect(zonesOverlap(a, { x: 8, y: 0, w: 5, h: 5 })).toBe(true);
    expect(zonesOverlap(a, { x: 0, y: 12, w: 5, h: 5 })).toBe(false);
  });
});
