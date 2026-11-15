import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "../src/game/settings";
import {
  PRESETS,
  PRESET_LIST,
  applyPreset,
  matchPreset,
  type PresetId,
} from "../src/game/settingsPresets";

/*
 * Presets are applied from a click, but the id on the other end of that click
 * is typed as `PresetId` and comes from a rendered list. The guard exists for
 * the other reader: a future caller that passes an id from storage or from a
 * URL, where the type is a promise rather than a fact.
 */

const HOSTILE = ["toString", "valueOf", "constructor", "__proto__", "hasOwnProperty"];

describe("applyPreset", () => {
  it("returns the settings unchanged for an id that is not in the table", () => {
    for (const id of [...HOSTILE, "nope", ""]) {
      // Regression: this used to spread `PRESETS[id].patch`, which is
      // `undefined` for every one of these, making the call a silent no-op.
      expect(applyPreset(DEFAULT_SETTINGS, id as PresetId)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it("never changes the language, for any preset", () => {
    const current = { ...DEFAULT_SETTINGS, language: "ja" as const };
    for (const preset of PRESET_LIST) {
      expect(applyPreset(current, preset.id).language).toBe("ja");
    }
  });

  it("applies the documented patch for each preset", () => {
    for (const preset of PRESET_LIST) {
      const out = applyPreset(DEFAULT_SETTINGS, preset.id);
      for (const [key, value] of Object.entries(preset.patch)) {
        expect(out[key as keyof typeof out], `${preset.id}.${key}`).toBe(value);
      }
    }
  });

  it("is idempotent", () => {
    for (const preset of PRESET_LIST) {
      const once = applyPreset(DEFAULT_SETTINGS, preset.id);
      const twice = applyPreset(once, preset.id);
      expect(twice).toEqual(once);
    }
  });

  it("leaves every preset matching itself after application", () => {
    // The contract stated at the top of settingsPresets.ts.
    for (const preset of PRESET_LIST) {
      const applied = applyPreset(DEFAULT_SETTINGS, preset.id);
      expect(matchPreset(applied), preset.id).not.toBeNull();
    }
  });
});

describe("the preset table", () => {
  it("has four presets and a list in the documented order", () => {
    expect(PRESET_LIST).toHaveLength(4);
    expect(PRESET_LIST.map((p) => p.id)).toEqual([
      "performance",
      "balanced",
      "cinematic",
      "speedrun",
    ]);
  });

  it("keys the record by the same id the record carries", () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      expect(preset.id).toBe(key);
    }
  });

  it("never patches language", () => {
    for (const preset of PRESET_LIST) {
      expect(preset.patch).not.toHaveProperty("language");
    }
  });
});
