/**
 * The incident corpus — every window this project has ever been sent a screenshot of.
 *
 * A matrix corpus samples the space; this one samples the *incidents*. The
 * difference matters: 1920×820 is 120px from the nearest preset and was the window
 * in two separate reports, so a grid that stepped past it would leave both bugs
 * unguarded. Here each window carries the symptom in the words of the report, so a
 * failure reads as a sentence about the shop rather than as two numbers.
 *
 * Two things are asserted:
 *
 *  1. **Nothing moved.** Each fixture is byte-comparable with a fresh resolve, so a
 *     change to a breakpoint, a density row or a type floor shows up as a diff in a
 *     file whose `symptom` names the bug it would bring back.
 *  2. **The specific guards still hold.** The snapshot is a lot of numbers; the
 *     handful below are the ones each incident was actually about, restated as the
 *     property rather than the number, so a failure says *what* broke.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { REGRESSIONS, regressionFor, regressionRounds } from "../src/components/menu/adaptive/regressions";
import { auditOne } from "../src/components/menu/adaptive/audit";
import { violations } from "../src/components/menu/adaptive/constraints";
import { resolveAdaptive } from "../src/components/menu/adaptive/resolve";
import { boxOf } from "../src/components/menu/adaptive/viewport";

const CORPUS = join("tests", "fixtures", "regressions");

interface Fixture {
  id: string;
  round: number;
  window: string;
  width: number;
  height: number;
  symptom: string;
  guard: string;
  profile: Record<string, unknown> & {
    scene: number;
    reserve: number;
    fit: string;
    hero: string;
    minimal: boolean;
    modal: string;
  };
  chip: { band: number; reason: string; visible: boolean; text: string; box: number };
  warnings: string[];
  violations: string[];
}

const FILES = readdirSync(CORPUS).filter((f) => f.endsWith(".json"));
const FIXTURES: Fixture[] = FILES.map((f) => JSON.parse(readFileSync(join(CORPUS, f), "utf8")) as Fixture);
const byId = (id: string) => FIXTURES.find((f) => f.id === id)!;

describe("the incident list", () => {
  it("has one fixture per incident, and no orphans", () => {
    expect(FILES.length).toBe(REGRESSIONS.length);
    for (const regression of REGRESSIONS) {
      expect(FILES, regression.id).toContain(`${regression.id}.json`);
      expect(regressionFor(regression.id)).toBe(regression);
    }
  });

  it("covers eight rounds of reports", () => {
    expect(regressionRounds()).toEqual([1, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("gives every incident a symptom and a guard worth reading", () => {
    for (const r of REGRESSIONS) {
      expect(r.symptom.length, r.id).toBeGreaterThan(40);
      expect(r.guard.length, r.id).toBeGreaterThan(30);
      expect(r.symptom, r.id).not.toMatch(/TODO|fixme|unknown/i);
    }
  });

  it("names a window inside the app's supported range", () => {
    for (const r of REGRESSIONS) {
      expect(r.width, r.id).toBeGreaterThanOrEqual(320);
      expect(r.height, r.id).toBeGreaterThanOrEqual(320);
      expect(r.width, r.id).toBeLessThanOrEqual(3840);
      expect(r.height, r.id).toBeLessThanOrEqual(2160);
    }
  });
});

describe("nothing moved", () => {
  it("resolves every incident window to the snapshot on disk", () => {
    for (const fixture of FIXTURES) {
      const sample = auditOne(fixture.width, fixture.height);
      expect(sample.scene, fixture.id).toBe(fixture.profile.scene);
      expect(sample.reserve, fixture.id).toBe(fixture.profile.reserve);
      expect(sample.fit, fixture.id).toBe(fixture.profile.fit);
      expect(sample.hero, fixture.id).toBe(fixture.profile.hero);
      expect(sample.chip, fixture.id).toBe(fixture.chip.reason);
    }
  });

  it("keeps every incident window inside the contract", () => {
    for (const fixture of FIXTURES) {
      expect(fixture.violations, fixture.id).toEqual([]);
      const profile = resolveAdaptive({ box: boxOf(fixture.width, fixture.height) });
      expect(violations(profile).map((v) => v.id), fixture.id).toEqual([]);
    }
  });
});

describe("the guards each incident left behind", () => {
  it("round 1/10: a windowed 1920×820 draws the whole chip", () => {
    for (const id of ["r01-windowed-1920x820", "r10-chip-row-1920x820"]) {
      const fixture = byId(id);
      expect(fixture.chip.visible, id).toBe(true);
      expect(fixture.chip.reason, id).toBe("full");
      expect(fixture.chip.text, id).toBe("MUỐI DƯA CỔ ĐIỂN");
      // The band must actually hold the chip plus its gutters.
      expect(fixture.chip.band, id).toBeGreaterThan(246);
    }
  });

  it("round 6: the start screen's column is exactly the usable height", () => {
    const fixture = byId("r06-start-overflow-1280x720");
    // `scene + reserve` is what `column-fills-window` asserts; here it is stated
    // as the incident: nothing left over, so nothing to scroll.
    expect(fixture.profile.fit).toBe("none");
    expect(fixture.profile.scene + fixture.profile.reserve).toBeGreaterThanOrEqual(600);
    expect(fixture.profile.minimal).toBe(false);
  });

  it("round 6: the 320 phone keeps a real band", () => {
    for (const id of ["r06-scroll-320x568", "r06-tight-320x480"]) {
      const fixture = byId(id);
      expect(fixture.profile.scene, id).toBeGreaterThanOrEqual(200);
      expect(fixture.warnings, id).not.toContain("crop");
    }
  });

  it("round 7: a short window never gets the row arrangement", () => {
    const fixture = byId("r07-low-window-1920x400");
    expect(fixture.profile.hero).toBe("stack");
  });

  it("round 9: the reference window plans an uncompressed HUD", () => {
    const fixture = byId("r09-hud-compressed-1280x720");
    expect(Number(fixture.profile.hudScale)).toBeGreaterThan(0.9);
  });

  it("round 11: a name with two stacked marks keeps a full line box", () => {
    for (const id of ["r11-diacritics-390x844", "r11-diacritics-phone-360x640"]) {
      const fixture = byId(id);
      expect(fixture.chip.visible, id).toBe(true);
      // 35px = 2×3 border + 2×6 padding + 11 × 1.5 line box. A shorter box is the
      // round-11 bug: the tops of the marks fall outside it.
      expect(fixture.chip.box, id).toBe(35);
      expect(fixture.chip.text, id).toBe("MUỐI DƯA CỔ ĐIỂN");
    }
  });

  it("round 12: the floor of the space still satisfies the contract", () => {
    const fixture = byId("r12-audit-floor-320x320");
    expect(fixture.profile.scene).toBe(140);
    expect(fixture.violations).toEqual([]);
    expect(fixture.profile.minimal).toBe(true);
  });

  it("round 12: 4K stops scaling at the clamp", () => {
    const fixture = byId("r12-4k-3840x2160");
    expect(Number(fixture.profile.type && (fixture.profile.type as unknown as Record<string, number>).lockupLo)).toBeLessThanOrEqual(89.5);
    expect(fixture.profile.modal).toMatch(/^\d+×\d+×\d+$/);
    expect(splitModal(fixture.profile.modal)[0]).toBeLessThanOrEqual(3840);
  });
});

/** `columns×width×height` → numbers. */
function splitModal(value: string): number[] {
  return value.split("×").map(Number);
}
