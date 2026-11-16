/**
 * The repair ladder — and the promise that the app never has to use it.
 *
 * THE AWKWARD PART
 * ----------------
 * Every preset and all 578 audited windows already satisfy the contract, so
 * `repairProfile()` returns `as-planned` for all of them and the five rungs below
 * it are dead code in practice. Two things follow, and both are tested here:
 *
 *  1. **The dead code must stay safe.** Each rung's overrides are resolved on all
 *     21 presets and must themselves satisfy every invariant — a fallback that can
 *     break the contract is worse than no fallback.
 *  2. **The search must be exercised anyway.** `repairProfile()` takes a
 *     `validator`, and this file hands it a *stricter* contract so the ladder
 *     actually walks. Without that, the day a real window needs rung 4 would be
 *     the first day rung 4 ever ran.
 *
 * The remaining tests are about the levers themselves: they may only give things
 * up, they may never go below a floor, and a `NaN` override must be ignored rather
 * than propagated.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  REPAIR_LADDER,
  describeRepair,
  repairForSize,
  repairProfile,
  repairRungIds,
} from "../src/components/menu/adaptive/repair";
import { resolveAdaptive, type AdaptiveProfile } from "../src/components/menu/adaptive/resolve";
import { resolveForSize } from "../src/components/menu/adaptive/resolve";
import { boxOf } from "../src/components/menu/adaptive/viewport";
import { violations } from "../src/components/menu/adaptive/constraints";
import { PRESETS } from "../src/components/menu/adaptive/presets";
import { auditWindows } from "../src/components/menu/adaptive/audit";

/** A contract stricter than the real one, so the ladder has somewhere to walk. */
const strict =
  (maxRowLabel: number) =>
  (profile: AdaptiveProfile): string[] => {
    const broken = violations(profile).map((v) => v.id);
    if (profile.type.rowLabel > maxRowLabel) broken.push("strict:row-label");
    return broken;
  };

describe("the ladder", () => {
  it("has six rungs, richest first", () => {
    expect(repairRungIds()).toEqual([
      "as-planned",
      "ignore-inset",
      "compact-hud",
      "single-column",
      "smaller-type",
      "smallest-type",
    ]);
  });

  it("never gets cheaper as it goes down", () => {
    // Each rung is a superset of the one above it: a repair is a *stack* of
    // levers, so a later rung cannot accidentally re-enable something.
    for (let i = 1; i < REPAIR_LADDER.length; i += 1) {
      const above = REPAIR_LADDER[i - 1].overrides;
      const here = REPAIR_LADDER[i].overrides;
      for (const key of Object.keys(above) as Array<keyof typeof above>) {
        const next = here[key];
        const prev = above[key];
        /*
         * Booleans must stay on; the two factors may only *decrease* — that is what
         * makes the ladder monotone, and `smallest-type` is the one rung allowed to
         * tighten `typeScale`.
         */
        if (typeof prev === "number") expect(next as number, `${REPAIR_LADDER[i].id}.${String(key)}`).toBeLessThanOrEqual(prev);
        else expect(next, `${REPAIR_LADDER[i].id}.${String(key)}`).toEqual(prev);
      }
      expect(Object.keys(here).length).toBeGreaterThanOrEqual(Object.keys(above).length);
    }
  });

  it("puts type last", () => {
    // Readability is the floor, not a lever of convenience.
    const first = REPAIR_LADDER.findIndex((r) => r.overrides.typeScale !== undefined);
    expect(first).toBeGreaterThan(REPAIR_LADDER.findIndex((r) => r.overrides.singleColumn !== undefined));
  });

  it("explains itself in every rung", () => {
    for (const rung of REPAIR_LADDER) {
      expect(rung.why.length, rung.id).toBeGreaterThan(20);
      expect(rung.why, rung.id).not.toMatch(/TODO|fixme/i);
    }
  });

  it("is documented, id for id", () => {
    const design = readFileSync("docs/design/adaptive-v2.md", "utf8");
    for (const id of repairRungIds()) expect(design, id).toContain(`\`${id}\``);
  });
});

describe("the app never needs it", () => {
  it("leaves every preset untouched", () => {
    for (const preset of PRESETS) {
      const result = repairForSize(preset.width, preset.height);
      expect(result.rung, preset.id).toBe("as-planned");
      expect(result.ok, preset.id).toBe(true);
      expect(result.attempts.length, preset.id).toBe(1);
      expect(result.remaining, preset.id).toEqual([]);
    }
  });

  it("leaves all 578 audited windows untouched", () => {
    const repaired = auditWindows().filter((w) => repairProfile({ box: boxOf(w.width, w.height) }).rung !== "as-planned");
    expect(repaired.map((w) => `${w.width}×${w.height}`)).toEqual([]);
  });

  it("resolves exactly as before when no overrides are given", () => {
    /*
     * The round-12 change added four optional levers to the resolver. This is the
     * test that makes that change safe: an absent `overrides` and an empty one must
     * produce the same profile as each other *and* the same numbers the layout had
     * before the levers existed.
     */
    for (const preset of PRESETS) {
      const plain = resolveAdaptive({ box: boxOf(preset.width, preset.height) });
      const empty = resolveAdaptive({ box: boxOf(preset.width, preset.height), overrides: {} });
      expect(empty, preset.id).toEqual(plain);
      expect(empty.type.rowLabel, preset.id).toBe(plain.type.rowLabel);
      expect(empty.playfield.hudScale, preset.id).toBe(plain.playfield.hudScale);
      expect(empty.modal.columns, preset.id).toBe(plain.modal.columns);
    }
  });

  it("is total: hostile boxes still come back with a usable profile", () => {
    for (const [w, h] of [[0, 0], [1, 1], [NaN, NaN], [10000, 10000], [844, 390]] as Array<[number, number]>) {
      const result = repairForSize(w, h);
      expect(Number.isFinite(result.profile.plan.scene), `${w}×${h}`).toBe(true);
      expect(Number.isFinite(result.profile.plan.reserve), `${w}×${h}`).toBe(true);
      expect(result.remaining, `${w}×${h}`).toEqual([]);
    }
  });
});

describe("each rung is itself safe", () => {
  it("satisfies the real contract on every preset", () => {
    for (const rung of REPAIR_LADDER) {
      for (const preset of PRESETS) {
        const profile = resolveAdaptive({ box: boxOf(preset.width, preset.height), overrides: rung.overrides });
        expect(violations(profile).map((v) => v.id), `${rung.id} @ ${preset.id}`).toEqual([]);
      }
    }
  });

  it("keeps every type size at or above the 8px floor", () => {
    for (const rung of REPAIR_LADDER) {
      const profile = resolveForSize(320, 480, undefined) as AdaptiveProfile;
      const withRung = resolveAdaptive({ box: boxOf(320, 480), overrides: rung.overrides });
      for (const [key, size] of Object.entries(withRung.type)) {
        if (typeof size === "number") expect(size, `${rung.id}.${key}`).toBeGreaterThanOrEqual(8);
      }
      expect(profile.type.rowLabel).toBeGreaterThanOrEqual(8);
    }
  });

  it("never pushes the HUD below the plan's own floor", () => {
    for (const preset of PRESETS) {
      const profile = resolveAdaptive({ box: boxOf(preset.width, preset.height), overrides: { hudScale: 0.1 } });
      expect(profile.playfield.hudScale, preset.id).toBeGreaterThanOrEqual(0.55);
    }
  });
});

describe("the search", () => {
  it("stops on the first rung a stricter contract accepts", () => {
    // 390×844 plans an 11px row label; rung 4 (94%) brings it to 10.3px.
    const result = repairForSize(390, 844, undefined, strict(10.5));
    expect(result.ok).toBe(true);
    expect(result.rung).toBe("smaller-type");
    expect(result.attempts.map((a) => a.rung)).toEqual([
      "as-planned",
      "ignore-inset",
      "compact-hud",
      "single-column",
      "smaller-type",
    ]);
    expect(result.attempts[0].violations).toContain("strict:row-label");
  });

  it("walks to the last rung and says so when nothing is enough", () => {
    const result = repairForSize(390, 844, undefined, strict(1));
    expect(result.ok).toBe(false);
    expect(result.remaining).toContain("strict:row-label");
    expect(result.attempts.length).toBe(REPAIR_LADDER.length);
  });

  it("returns the least-broken attempt, not the most degraded", () => {
    /*
     * `strict(1)` fails everywhere, but a contract that fails *fewer* times lower
     * down must be preferred. Give the validator a violation that the type rungs
     * clear, and a second one that nothing clears: the tie-break should still be
     * "fewest remaining".
     */
    const result = repairForSize(390, 844, undefined, (profile) => {
      const broken = profile.type.rowLabel > 10.5 ? ["strict:row-label"] : [];
      if (profile.box.width > 0) broken.push("strict:always");
      return broken;
    });
    expect(result.ok).toBe(false);
    expect(result.remaining).toEqual(["strict:always"]);
    expect(result.rung).toBe("smaller-type");
  });

  it("tries the rungs in ladder order and reports what each one left", () => {
    const result = repairForSize(320, 480, undefined, () => ["strict:always"]);
    expect(result.attempts.map((a) => a.rung)).toEqual(repairRungIds());
    for (const attempt of result.attempts) expect(attempt.violations).toEqual(["strict:always"]);
  });
});

describe("the levers", () => {
  it("ignore-inset buys the chrome's height back", () => {
    const env = { dpr: 2, wasmThreads: 1, maxTouchPoints: 5, pointerCoarse: true, prefersReducedMotion: false, prefersContrast: false, orientation: "portrait", insetTop: 60, insetBottom: 60, insetLeft: 0, insetRight: 0 } as never;
    const withInset = resolveAdaptive({ box: boxOf(390, 844), env });
    const without = resolveAdaptive({ box: boxOf(390, 844), env, overrides: { ignoreInset: true } });
    expect(withInset.insetApplied).toBe(true);
    expect(without.insetApplied).toBe(false);
    /*
     * Not "the reserve gets smaller": the reserve is a floor, and a shorter window
     * clips it. What the inset actually costs is *total usable height* — the scene
     * plus the chrome — which is what the plan spends.
     */
    const spentWith = withInset.plan.scene + withInset.plan.reserve;
    const spentWithout = without.plan.scene + without.plan.reserve;
    expect(spentWithout).toBeGreaterThan(spentWith);
  });

  it("singleColumn collapses a wide dialog", () => {
    const wide = resolveAdaptive({ box: boxOf(1920, 1080), wideModal: true });
    const one = resolveAdaptive({ box: boxOf(1920, 1080), wideModal: true, overrides: { singleColumn: true } });
    expect(wide.modal.columns).toBeGreaterThan(1);
    expect(one.modal.columns).toBe(1);
  });

  it("ignores an override it cannot honour instead of propagating nonsense", () => {
    for (const bad of [0, -1, NaN, Infinity, 2]) {
      const profile = resolveAdaptive({
        box: boxOf(390, 844),
        overrides: { typeScale: bad, hudScale: bad },
      });
      const plain = resolveAdaptive({ box: boxOf(390, 844) });
      expect(profile.type, `typeScale ${bad}`).toEqual(plain.type);
      expect(profile.playfield.hudScale, `hudScale ${bad}`).toBe(plain.playfield.hudScale);
    }
  });

  it("only ever shrinks", () => {
    for (const preset of PRESETS) {
      const plain = resolveAdaptive({ box: boxOf(preset.width, preset.height) });
      const shrunk = resolveAdaptive({
        box: boxOf(preset.width, preset.height),
        overrides: { typeScale: 0.94, hudScale: 0.85 },
      });
      expect(shrunk.type.rowLabel, preset.id).toBeLessThanOrEqual(plain.type.rowLabel);
      expect(shrunk.playfield.hudScale, preset.id).toBeLessThanOrEqual(plain.playfield.hudScale);
    }
  });
});

describe("describeRepair", () => {
  it("says nothing changed when nothing did", () => {
    expect(describeRepair(repairForSize(1280, 720))).toContain("nothing");
  });

  it("names the rung and the reason when it did", () => {
    const line = describeRepair(repairForSize(390, 844, undefined, strict(10.5)));
    expect(line).toContain("smaller-type");
    expect(line.length).toBeGreaterThan(40);
    expect(line).not.toMatch(/NaN|undefined/);
  });

  it("admits failure plainly", () => {
    const line = describeRepair(repairForSize(390, 844, undefined, () => ["strict:always"]));
    expect(line).toContain("FAILED");
    expect(line).toContain("strict:always");
  });
});
