/**
 * `PRESETS` — the windows every table in the project agrees on.
 *
 * The list exists because it used to exist three times: in the probe, in the
 * release notes and in the design contract. Three copies of a table drift in one
 * direction only — the copy nobody runs gets stale — and the one nobody runs is
 * the one a reviewer reads.
 *
 * So this file checks three things: the list is well formed, the derived tables
 * really come from it, and the documents that print it print *it* and not a
 * memory of it.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  PRESETS,
  presetFor,
  presetSize,
  presetTuples,
  presetsIn,
  presetsTallEnough,
} from "../src/components/menu/adaptive/presets";
import { resolveForSize } from "../src/components/menu/adaptive/resolve";
import { boxOf } from "../src/components/menu/adaptive/viewport";

const GROUPS = ["phone", "tablet", "laptop", "desktop", "report", "stress"];

describe("the preset list", () => {
  it("is a list of real windows with unique ids", () => {
    expect(PRESETS.length).toBe(21);
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const preset of PRESETS) {
      expect(preset.id, `${preset.id} must be kebab-case`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(Number.isInteger(preset.width) && preset.width > 0, preset.id).toBe(true);
      expect(Number.isInteger(preset.height) && preset.height > 0, preset.id).toBe(true);
      expect(GROUPS, preset.id).toContain(preset.group);
      expect(preset.note.length, preset.id).toBeGreaterThan(8);
    }
  });

  it("is ordered by the shortest side, the axis every rule uses", () => {
    const shortest = PRESETS.map((p) => Math.min(p.width, p.height));
    for (let i = 1; i < shortest.length; i++) {
      expect(shortest[i], `${PRESETS[i].id} is out of order`).toBeGreaterThanOrEqual(shortest[i - 1]);
    }
  });

  it("covers every group, including the three windows from the reports", () => {
    for (const group of GROUPS) expect(presetsIn(group as never).length, group).toBeGreaterThan(0);
    for (const id of ["window-1568", "window-1920", "phone-landscape"]) {
      expect(presetFor(id), id).toBeTruthy();
    }
  });

  it("answers misses with undefined rather than inventing a window", () => {
    expect(presetFor("nope")).toBeUndefined();
    expect(presetFor("")).toBeUndefined();
  });

  it("prints its size as WxH", () => {
    expect(presetSize(presetFor("720p")!)).toBe("1280×720");
  });

  it("filters by the shortest side, not by width", () => {
    // A 1920-wide window with 820px of height is not a tall window.
    expect(presetsTallEnough(1000).map((p) => p.id)).toContain("1080p");
    expect(presetsTallEnough(1000).map((p) => p.id)).not.toContain("window-1920");
  });

  it("keeps the tuple form in the same order, so the probe cannot drift", () => {
    const tuples = presetTuples();
    expect(tuples.length).toBe(PRESETS.length);
    tuples.forEach(([w, h, note], i) => {
      expect([w, h]).toEqual([PRESETS[i].width, PRESETS[i].height]);
      expect(note).toBe(PRESETS[i].note);
    });
  });

  it("gives every preset a real profile", () => {
    for (const preset of PRESETS) {
      const profile = resolveForSize(preset.width, preset.height);
      expect(profile.box.width, preset.id).toBe(preset.width);
      expect(profile.box.height, preset.id).toBe(preset.height);
      expect(boxOf(preset.width, preset.height).shortest, preset.id).toBe(Math.min(preset.width, preset.height));
    }
  });
});

describe("the documents that print the table", () => {
  const design = readFileSync("docs/design/adaptive-v2.md", "utf8");

  it("name every preset id in the design contract", () => {
    // A preset missing from the contract is a window nothing documents.
    const missing = PRESETS.filter((p) => !design.includes(p.id)).map((p) => p.id);
    expect(missing).toEqual([]);
  });

  it("print the same size for every named window", () => {
    for (const preset of PRESETS) {
      if (!design.includes(preset.id)) continue;
      expect(design, `${preset.id} must print ${presetSize(preset)}`).toContain(presetSize(preset));
    }
  });
});
