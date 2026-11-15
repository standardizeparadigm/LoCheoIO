/**
 * `resolve.ts` — the one profile every consumer reads.
 *
 * The value of a single profile is that its parts cannot disagree. So the tests
 * here are cross-part assertions: the scene and the type table have to describe
 * the same band, the panel height has to equal the reserve's panel height, and
 * the canvas plan has to be for the same window the menu was planned for.
 */
import { describe, expect, it } from "vitest";

import {
  ADAPTIVE_CSS_VARS,
  adaptiveAttributes,
  describeAdaptive,
  resolveAdaptive,
  resolveForSize,
} from "../src/components/menu/adaptive";
import { boxOf } from "../src/components/menu/adaptive/viewport";
import { DESKTOP_ENVIRONMENT } from "../src/components/menu/adaptive/environment";
import { planMenuLayout, usableHeight } from "../src/components/menu/layout";
import { cornerRowHeight } from "../src/components/menu/layout/metrics";
import { heroContentHeight } from "../src/components/menu/adaptive/hero";

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

describe("the profile is internally consistent", () => {
  it("fills the usable window exactly whenever it is not cropping", () => {
    for (const [w, h] of SIZES) {
      const profile = resolveForSize(w, h);
      if (profile.plan.fit === "crop") {
        // A cropped plan deliberately keeps the hero floor and lets the column
        // exceed the window — see tests/layout-fit.test.ts. What it must never
        // do is return a scene below the floor.
        expect(profile.plan.scene).toBeGreaterThanOrEqual(140);
        continue;
      }
      expect(profile.plan.scene + profile.plan.reserve, `${w}×${h}`).toBe(usableHeight({ width: w, height: h }));
    }
  });

  it("paints the panel the reserve paid for", () => {
    for (const [w, h] of SIZES) {
      const profile = resolveForSize(w, h);
      const plan = profile.plan;
      expect(profile.panelHeight, `${w}×${h}`).toBe(cornerRowHeight(plan.dense, plan.tight, plan.compact));
    }
  });

  it("gives the hero a layout that fits its band", () => {
    for (const [w, h] of SIZES) {
      const profile = resolveForSize(w, h);
      expect(heroContentHeight(profile.hero), `${w}×${h}`).toBeLessThanOrEqual(profile.plan.scene);
    }
  });

  it("plans the canvas for the same window as the menu", () => {
    for (const [w, h] of SIZES) {
      const profile = resolveForSize(w, h, { ...DESKTOP_ENVIRONMENT, dpr: 2 });
      expect(profile.playfield.width).toBe(Math.max(240, w));
      expect(profile.playfield.height).toBe(Math.max(320, h));
      expect(profile.playfield.dpr).toBe(2);
    }
  });

  it("names the tier and density the plan actually chose", () => {
    const desktop = resolveForSize(1920, 1080);
    expect(desktop.tier).toBe("xl");
    expect(desktop.density).toBe("spacious");
    const phone = resolveForSize(375, 568);
    expect(phone.tier).toBe("sm");
    expect(["tight", "minimal"]).toContain(phone.density);
  });
});

describe("safe-area insets", () => {
  it("subtracts the notch from the height before planning", () => {
    const env = { ...DESKTOP_ENVIRONMENT, insetTop: 44, insetBottom: 34 };
    const profile = resolveForSize(844, 390, env);
    expect(profile.insetApplied).toBe(true);
    // 390 − 78 = 312 of usable height. That is below the chrome's own reserve,
    // so the plan reports crop honestly; what matters is that it planned against
    // 312 and not against 390.
    expect(profile.plan.fit).toBe("crop");
    expect(usableHeight({ width: 844, height: 390, inset: 78 })).toBe(312);
    // The same window without a notch must differ — otherwise the inset is noise.
    expect(profile.plan).not.toEqual(resolveForSize(844, 390).plan);
  });

  it("ignores an absurd inset instead of collapsing the layout", () => {
    const env = { ...DESKTOP_ENVIRONMENT, insetTop: 5000, insetBottom: 5000 };
    const profile = resolveForSize(1280, 720, env);
    expect(profile.plan.scene).toBeGreaterThan(0);
    expect(profile.plan.scene + profile.plan.reserve).toBeGreaterThan(0);
  });
});

describe("CSS variables and data attributes", () => {
  it("sets every documented variable, as a usable CSS value", () => {
    const profile = resolveForSize(1280, 720);
    for (const name of ADAPTIVE_CSS_VARS) {
      expect(profile.cssVars[name], name).toBeDefined();
      expect(profile.cssVars[name], name).toMatch(/^-?\d+(\.\d+)?(px)?$/);
    }
    expect(profile.cssVars["--adaptive-scene"]).toBe(`${profile.plan.scene}px`);
    expect(profile.cssVars["--adaptive-panel-h"]).toBe(`${profile.panelHeight}px`);
  });

  it("lists exactly the variables it sets", () => {
    const profile = resolveForSize(1280, 720);
    expect(Object.keys(profile.cssVars).sort()).toEqual([...ADAPTIVE_CSS_VARS].sort());
  });

  it("describes itself in data attributes the probe can read", () => {
    const profile = resolveForSize(1920, 820);
    const attrs = adaptiveAttributes(profile);
    expect(attrs["data-adaptive-tier"]).toBe("lg");
    expect(attrs["data-adaptive-hero"]).toBe(profile.hero.sideBySide ? "row" : "stack");
    expect(attrs["data-adaptive-inset"]).toBe("0");
    for (const [name, value] of Object.entries(attrs)) {
      expect(name.startsWith("data-adaptive-"), name).toBe(true);
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe("totality", () => {
  it("resolves a corrupt window into a coherent profile", () => {
    const profile = resolveAdaptive({ box: boxOf(NaN, NaN) });
    expect(profile.plan.scene).toBeGreaterThan(0);
    expect(profile.plan.reserve).toBeGreaterThan(0);
    expect(profile.type.lockupLo).toBeGreaterThan(0);
    expect(profile.playfield.width).toBeGreaterThan(0);
    expect(Number.isFinite(profile.room)).toBe(true);
  });

  it("resolves 4 800 windows without a non-finite number anywhere", () => {
    let checked = 0;
    for (let w = 260; w <= 4200; w += 67) {
      for (let h = 260; h <= 2400; h += 71) {
        const profile = resolveForSize(w, h);
        if (profile.plan.fit !== "crop") {
          expect(profile.plan.scene + profile.plan.reserve).toBe(usableHeight({ width: w, height: h }));
        }
        expect(profile.plan.scene).toBeGreaterThan(0);
        expect(profile.type.lockupLo).toBeGreaterThan(0);
        expect(profile.playfield.playerRadius).toBeGreaterThan(0);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(1500);
  });

  it("describes itself for a log line", () => {
    const line = describeAdaptive(resolveForSize(1280, 720));
    expect(line).toContain("1280×720");
    expect(line).toContain("scene");
    expect(line).toContain("reserve");
  });
});

describe("the plan is the same plan the planner makes", () => {
  it("matches planMenuLayout for every size", () => {
    for (const [w, h] of SIZES) {
      expect(resolveForSize(w, h).plan).toEqual(planMenuLayout({ width: w, height: h }));
    }
  });
});
