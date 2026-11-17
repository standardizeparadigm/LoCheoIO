/**
 * `modeConfigFor()` — the guarded lookup behind every `MODES[id]` the engine used
 * to do blind.
 *
 * The typed `ModeId` made the compiler believe `MODES[mode]` was always a
 * record; a hand-edited save reaches the same expression at runtime. This file
 * pins the fallback (classic), the prototype-safety, and that the nine real
 * records come back by identity.
 */
import { describe, expect, it } from "vitest";

import { MODES, MODE_LIST, modeConfigFor } from "../src/game/modes";

describe("modeConfigFor", () => {
  it("returns each of the nine real records by identity", () => {
    for (const mode of MODE_LIST) {
      expect(modeConfigFor(mode.id), mode.id).toBe(MODES[mode.id]);
    }
  });

  it("falls back to classic for garbage, including prototype keys", () => {
    for (const bad of [undefined, null, 0, NaN, Infinity, "", "CLASSIC", "classic ", "modes", "__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"]) {
      const cfg = modeConfigFor(bad);
      expect(cfg.id, String(bad)).toBe("classic");
    }
  });

  it("the fallback record is fully usable — every field the engine reads exists", () => {
    const cfg = modeConfigFor("bogus");
    for (const key of ["scoreMult", "speedMult", "hazardMult", "spawnMult"] as const) {
      expect(Number.isFinite(cfg[key]), key).toBe(true);
    }
    expect(typeof cfg.name).toBe("string");
    expect(cfg.name.length).toBeGreaterThan(0);
    expect(typeof cfg.accent).toBe("string");
    expect(typeof cfg.gradient).toBe("string");
  });

  it("validates the string, not the carrier", () => {
    // However the id arrived — a JSON save, an object property, a query param —
    // what decides is the value, and only exact own-keys of MODES pass.
    const carrier = { mode: "inferno" };
    expect(modeConfigFor(carrier.mode).id).toBe("inferno");
    expect(modeConfigFor(Object.create({ mode: "inferno" }).mode).id).toBe("inferno");
  });
});
