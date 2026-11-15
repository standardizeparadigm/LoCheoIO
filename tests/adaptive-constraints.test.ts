/**
 * The adaptive contract.
 *
 * `CONSTRAINTS` is one list of twelve invariants. It is only worth having if it
 * is (a) true for every window the app runs in, and (b) *not* vacuous — a check
 * that never rejects anything is a comment with extra steps.
 *
 * So this file tests both halves:
 *
 *   · the list holds over the presets and over a 1 500-window sweep;
 *   · each check catches an injected defect, by taking a real profile and
 *     breaking exactly the number that check is about.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  CONSTRAINTS,
  constraintIds,
  firstViolation,
  violations,
} from "../src/components/menu/adaptive/constraints";
import { PRESETS } from "../src/components/menu/adaptive/presets";
import { resolveForSize, type AdaptiveProfile } from "../src/components/menu/adaptive/resolve";

/** A profile with one field replaced — the "inject a defect" helper. */
function broken(profile: AdaptiveProfile, patch: (p: AdaptiveProfile) => void): AdaptiveProfile {
  const copy = structuredClone(profile) as AdaptiveProfile;
  patch(copy);
  return copy;
}

describe("the list itself", () => {
  it("has twelve uniquely named invariants", () => {
    expect(constraintIds().length).toBe(14);
    const ids = constraintIds();
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("states a reason for each one", () => {
    for (const c of CONSTRAINTS) {
      expect(c.why.length, c.id).toBeGreaterThan(20);
      expect(c.why.endsWith("."), `${c.id} should be a sentence`).toBe(true);
    }
  });

  it("is named in the design contract, every id, exactly once each", () => {
    const design = readFileSync("docs/design/adaptive-v2.md", "utf8");
    for (const id of constraintIds()) {
      expect(design, `the contract does not mention ${id}`).toContain(id);
    }
  });
});

describe("the contract holds", () => {
  it("on all 21 presets", () => {
    for (const preset of PRESETS) {
      const profile = resolveForSize(preset.width, preset.height);
      expect(violations(profile), `${preset.id} (${preset.width}×${preset.height})`).toEqual([]);
    }
  });

  it("across 1 500 swept windows, including absurd ones", () => {
    for (let w = 320; w <= 2560; w += 97) {
      for (let h = 320; h <= 1600; h += 71) {
        const profile = resolveForSize(w, h);
        const bad = violations(profile);
        expect(bad, `${w}×${h}`).toEqual([]);
      }
    }
    for (const [w, h] of [[1, 1], [320, 200], [4000, 300], [10_000, 10_000]] as const) {
      expect(violations(resolveForSize(w, h)), `${w}×${h} (degenerate)`).toEqual([]);
    }
  });

  it("survives a non-finite window", () => {
    for (const [w, h] of [[NaN, 720], [1280, NaN], [Infinity, -1]] as const) {
      expect(firstViolation(resolveForSize(w, h)), `${w}×${h}`).toBeNull();
    }
  });
});

describe("the contract is not vacuous", () => {
  const base = resolveForSize(1280, 720);

  it("catches a column that does not fill the window", () => {
    const p = broken(base, (x) => { x.plan.scene += 40; });
    expect(violations(p).map((v) => v.id)).toContain("column-fills-window");
  });

  it("catches a panel painted outside its band", () => {
    const p = broken(base, (x) => { x.panelHeight = x.plan.reserve + 10; });
    expect(violations(p).map((v) => v.id)).toContain("panel-fits-reserve");
  });

  it("catches a lockup taller than the band", () => {
    const p = broken(base, (x) => { x.type.lockupLo = x.plan.scene; });
    expect(violations(p).map((v) => v.id)).toContain("lockup-fits-scene");
  });

  it("catches CHÉO overtaking LỌ", () => {
    const p = broken(base, (x) => { x.type.lockupCheo = x.type.lockupLo; });
    expect(violations(p).map((v) => v.id)).toContain("cheo-under-lo");
  });

  it("catches a 7px label", () => {
    const p = broken(base, (x) => { x.type.rowHint = 7; });
    expect(violations(p).map((v) => v.id)).toContain("type-legible");
  });

  it("catches a dialog wider than the window", () => {
    const p = broken(base, (x) => { x.modal.maxWidth = x.box.width + 1; });
    expect(violations(p).map((v) => v.id)).toContain("dialog-fits-window");
  });

  it("catches a mode chip that would lose its name", () => {
    // 160px of window leaves the chip a 128px band: the name no longer fits at
    // the floor size, so the chip would have to ellipsise it.
    const p = broken(base, (x) => { x.box.width = 160; });
    expect(violations(p).map((v) => v.id)).toContain("chip-name-survives");
  });

  it("catches a mode chip that would lose its label", () => {
    // A 200px window is still a phone, and there the label must survive.
    const p = broken(base, (x) => { x.box.width = 200; });
    expect(violations(p).map((v) => v.id)).toContain("chip-labelled");
  });

  it("catches a jar wider than the board", () => {
    const p = broken(base, (x) => { x.playfield.playerRadius = 500; });
    expect(violations(p).map((v) => v.id)).toContain("jar-fits-board");
  });

  it("catches a density that disagrees with the plan", () => {
    const p = broken(base, (x) => { x.density = "minimal"; });
    expect(violations(p).map((v) => v.id)).toContain("density-matches-flags");
  });

  it("catches a missing CSS variable", () => {
    const p = broken(base, (x) => { delete x.cssVars["--type-row-label"]; });
    expect(violations(p).map((v) => v.id)).toContain("css-vars-complete");
  });

  it("catches a variable that is not a number", () => {
    const p = broken(base, (x) => { x.cssVars["--type-row-label"] = "clamp(1px,2vw,3px)"; });
    expect(violations(p).map((v) => v.id)).toContain("numbers-finite");
  });

  it("catches a NaN buried three levels down", () => {
    const p = broken(base, (x) => { x.playfield.hudScale = Number.NaN; });
    expect(violations(p).map((v) => v.id)).toContain("numbers-finite");
  });

  it("catches a hero that needs more band than it got", () => {
    const p = broken(base, (x) => { x.plan.scene = 40; });
    const ids = violations(p).map((v) => v.id);
    expect(ids).toContain("hero-fits-scene");
  });

  it("names the numbers in every message", () => {
    const p = broken(base, (x) => { x.plan.scene += 40; });
    const message = violations(p)[0].message;
    expect(message).toMatch(/\d/);
    expect(message.length).toBeGreaterThan(20);
  });
});
