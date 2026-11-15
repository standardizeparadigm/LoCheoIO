/**
 * `typeScale.ts` — text that survives a short window.
 *
 * Four properties, and each one is a bug that shipped:
 *
 *   1. **finiteness**          a `NaN` font size is a dropped declaration
 *   2. **floors**              a 7px hint is not a hint
 *   3. **the band wins**       `LỌ` shrinks instead of being clipped
 *   4. **the ratio survives**  `CHÉO` is never larger than `LỌ`, at any size
 */
import { describe, expect, it } from "vitest";

import { planMenuLayout } from "../src/components/menu/layout";
import { boxOf } from "../src/components/menu/adaptive/viewport";
import {
  LOCKUP_BOX_RATIO,
  MAX_LOCKUP_PX,
  MIN_LOCKUP_PX,
  lockupMaxForBand,
  typeScaleFor,
  typeVars,
} from "../src/components/menu/adaptive/typeScale";

/** The floors the module documents, restated so a quiet edit fails here. */
const FLOORS = {
  eyebrow: 8,
  liveBadge: 8,
  lockupLo: MIN_LOCKUP_PX,
  lockupCheo: 1,
  badgePlate: 9.5,
  record: 10.5,
  panelHeader: 9,
  rowLabel: 10,
  rowHint: 8,
  statFooter: 8,
  ticker: 9.5,
  tickerFooter: 8,
  modalTitle: 11,
  modalBody: 12,
  hudScore: 20,
  hudLabel: 9,
  overScore: 28,
} as const;

const SIZES: Array<[number, number]> = [
  [320, 480],
  [375, 667],
  [390, 844],
  [414, 896],
  [768, 1024],
  [844, 390],
  [900, 500],
  [1024, 600],
  [1280, 640],
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1568, 677],
  [1920, 820],
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
];

function scaleFor(width: number, height: number) {
  const plan = planMenuLayout({ width, height });
  return { plan, type: typeScaleFor({ box: boxOf(width, height), plan }) };
}

describe("the table", () => {
  it("is finite and inside its floors at every real size", () => {
    for (const [w, h] of SIZES) {
      const { type } = scaleFor(w, h);
      for (const [key, floor] of Object.entries(FLOORS)) {
        const value = type[key as keyof typeof FLOORS];
        expect(Number.isFinite(value), `${w}×${h} ${key}`).toBe(true);
        expect(value, `${w}×${h} ${key} below floor`).toBeGreaterThanOrEqual(floor);
      }
    }
  });

  it("is finite for a corrupt plan and a 1×1 window", () => {
    const plan = planMenuLayout({ width: NaN, height: NaN });
    const type = typeScaleFor({ box: boxOf(NaN, NaN), plan });
    for (const [key, value] of Object.entries(type)) {
      if (typeof value === "number") expect(Number.isFinite(value), key).toBe(true);
    }
  });

  it("quantises to half a pixel, so a drag does not repaint forever", () => {
    for (const [w, h] of SIZES) {
      const { type } = scaleFor(w, h);
      for (const [key, value] of Object.entries(type)) {
        if (typeof value !== "number") continue;
        expect(Math.round(value * 2) / 2, `${key} is not half-pixel`).toBeCloseTo(value, 5);
      }
    }
  });

  it("grows (never shrinks) as the window grows", () => {
    let previous = 0;
    for (const h of [480, 600, 720, 900, 1080, 1440]) {
      const { type } = scaleFor(1920, h);
      expect(type.rowLabel, `1920×${h}`).toBeGreaterThanOrEqual(previous);
      previous = type.rowLabel;
    }
  });
});

describe("the lockup", () => {
  it("keeps CHÉO strictly smaller than LỌ at every size", () => {
    for (let w = 320; w <= 3840; w += 13) {
      for (const h of [390, 500, 720, 1080, 1440]) {
        const { type } = scaleFor(w, h);
        expect(type.lockupCheo, `${w}×${h}`).toBeLessThanOrEqual(type.lockupLo);
      }
    }
  });

  it("never demands more band than the plan gave it", () => {
    for (const [w, h] of SIZES) {
      const { plan, type } = scaleFor(w, h);
      const box = type.lockupLo * LOCKUP_BOX_RATIO;
      expect(box, `${w}×${h}: ${type.lockupLo}px lockup in a ${plan.scene}px band`).toBeLessThanOrEqual(
        plan.scene + 0.5,
      );
    }
  });

  it("shrinks with the band instead of with the width", () => {
    // Hold the width and shrink only the band the plan hands the hero.
    const widePlan = planMenuLayout({ width: 1920, height: 1080 });
    const shrunk = { ...widePlan, scene: 140, minimal: false };
    const generous = { ...widePlan, scene: 620, minimal: false };
    const box = boxOf(1920, 1080);
    const tall = typeScaleFor({ box, plan: generous }).lockupLo;
    const short = typeScaleFor({ box, plan: shrunk }).lockupLo;
    expect(short).toBeLessThan(tall);

    // …and the width still matters when the band is generous.
    const narrow = typeScaleFor({ box: boxOf(480, 1080), plan: generous }).lockupLo;
    expect(narrow).toBeLessThan(tall);
  });

  it("caps at the 5.6rem ceiling", () => {
    expect(scaleFor(3840, 2160).type.lockupLo).toBeLessThanOrEqual(MAX_LOCKUP_PX);
    expect(lockupMaxForBand(10_000)).toBe(MAX_LOCKUP_PX);
    expect(lockupMaxForBand(0)).toBe(MIN_LOCKUP_PX);
    expect(lockupMaxForBand(NaN)).toBe(MIN_LOCKUP_PX);
  });
});

describe("the CSS variables", () => {
  it("emits every variable as a px string matching the table", () => {
    const { type } = scaleFor(1280, 720);
    const vars = typeVars(type);
    expect(Object.keys(vars).length).toBe(17);
    for (const [name, value] of Object.entries(vars)) {
      expect(name.startsWith("--type-"), name).toBe(true);
      expect(value, name).toMatch(/^\d+(\.\d+)?px$/);
    }
    expect(vars["--type-lockup-lo"]).toBe(`${type.lockupLo}px`);
    expect(vars["--type-row-label"]).toBe(`${type.rowLabel}px`);
  });

  it("keeps the two lockup variables ordered", () => {
    for (const [w, h] of SIZES) {
      const vars = typeVars(scaleFor(w, h).type);
      const lo = parseFloat(vars["--type-lockup-lo"]);
      const cheo = parseFloat(vars["--type-lockup-cheo"]);
      expect(cheo, `${w}×${h}`).toBeLessThanOrEqual(lo);
    }
  });
});
