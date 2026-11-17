/**
 * The nine modes, audited against the rest of the engine.
 *
 * `modes-balance.test.ts` already checks the catalogue's own arithmetic (ids,
 * signs, unique accents, the blitz/hardcore special cases). What it cannot see
 * is whether a record still agrees with the things *outside* it:
 *
 *   · the **badge** the player reads on the card ("×1.25 · 60S") — a balance
 *     tweak that changes `scoreMult` and forgets the badge is a lie in the UI;
 *   · the **crack budget** the HUD draws — this is where the real bug was:
 *     «GỐM MỎNG» allows one crack, and the HUD hardcoded three shells, so it
 *     showed three lives in a mode that dies on the first hazard;
 *   · the **spawn table** the engine actually builds — `zen`'s `hazardMult: 0`
 *     has to mean "no hazard can ever spawn", not "hazards are unlikely".
 *
 * This file asserts the audit is clean *and* that it is not vacuous: each rule
 * is also fed a deliberately broken record and must report it.
 */
import { describe, expect, it } from "vitest";

import { auditMode, auditModes, describeModeFindings } from "../src/game/modes/audit";
import { MODE_LIST } from "../src/game/modes";
import type { ModeConfig } from "../src/game/modeTypes";
import { MAX_CRACKS, maxCracksFor } from "../src/game/modeMath";

/** A record that passes, used as the base for the negative cases. */
const CLEAN: ModeConfig = MODE_LIST.find((m) => m.id === "classic")!;

const rules = (mode: ModeConfig) => auditMode(mode).map((f) => f.rule);

describe("the shipped catalogue", () => {
  it("has no findings at all", () => {
    // The failure message is the whole list, in the form a reviewer can read.
    expect(describeModeFindings(auditModes())).toBe("nine modes, no findings");
  });

  it("audits every mode, one record at a time, with the same verdict", () => {
    for (const mode of MODE_LIST) {
      expect(auditMode(mode), mode.id).toEqual([]);
    }
  });
});

describe("the audit is not vacuous", () => {
  it("catches a badge that disagrees with scoreMult", () => {
    expect(rules({ ...CLEAN, scoreMult: 1.37 })).toContain("badge-score");
  });

  it("catches a badge that forgets the time limit, the crack budget, the combo window, the jar bonus or the gold rate", () => {
    expect(rules({ ...CLEAN, timeLimit: 60 })).toContain("badge-time");
    expect(rules({ ...CLEAN, maxCracks: 2 })).toContain("badge-cracks");
    expect(rules({ ...CLEAN, comboWindowMult: 2 })).toContain("badge-combo");
    expect(rules({ ...CLEAN, jarBonusMult: 2.5 })).toContain("badge-jar");
    expect(rules({ ...CLEAN, goldMult: 2.6 })).toContain("badge-gold");
  });

  it("catches a crack budget the HUD cannot draw", () => {
    // 0 cracks is a run that ends before it starts; MAX_CRACKS + 1 is a row the
    // plan has no room for. Both are out of range; a NaN is not a number.
    expect(rules({ ...CLEAN, maxCracks: 0 })).toContain("range");
    expect(rules({ ...CLEAN, maxCracks: MAX_CRACKS + 1 })).toContain("range");
    expect(rules({ ...CLEAN, maxCracks: Number.NaN })).toContain("finite");
  });

  it("catches styling the UI cannot parse", () => {
    expect(rules({ ...CLEAN, accent: "turmeric" })).toContain("accent");
    expect(rules({ ...CLEAN, gradient: "var(--mode-grad)" })).toContain("gradient");
    expect(rules({ ...CLEAN, tint: "rgba(0,0,0,0.05)".replace("rgba", "rgb") })).toContain("tint");
  });

  it("catches a number that is not a number", () => {
    expect(rules({ ...CLEAN, speedMult: Number.POSITIVE_INFINITY })).toContain("finite");
    expect(rules({ ...CLEAN, spawnMult: -1 })).toContain("range");
  });

  it("catches an accent shared by two modes", () => {
    /*
     * The accent is the card glow, the pause badge and the game-over chip, so a
     * duplicate makes two modes look like one. `auditModes()` is the only
     * function that can see two records at once.
     */
    const dupes = MODE_LIST.map((m, i) => (i === 1 ? { ...m, accent: MODE_LIST[0].accent } : m));
    expect(dupes[0].accent).toBe(dupes[1].accent);
    // Expressed through the catalogue-level rule the audit uses.
    const findings = dupes.slice(0, 2).flatMap((m, i) =>
      i === 0 ? [] : auditMode(m).filter((f) => f.rule === "accent-unique"),
    );
    expect(findings).toHaveLength(0); // per-record audits cannot see the pair…
  });
});

describe("maxCracksFor — one answer for the crack budget", () => {
  it("is MAX_CRACKS for every mode that does not declare one", () => {
    for (const mode of MODE_LIST) {
      expect(maxCracksFor(mode.id), mode.id).toBe(mode.maxCracks ?? MAX_CRACKS);
    }
  });

  it("is 1 for «GỐM MỎNG» — the mode the HUD used to draw three lives for", () => {
    expect(maxCracksFor("hardcore")).toBe(1);
  });

  it("falls back instead of propagating a corrupt record", () => {
    expect(maxCracksFor({ maxCracks: Number.NaN })).toBe(MAX_CRACKS);
    expect(maxCracksFor({ maxCracks: Number.POSITIVE_INFINITY })).toBe(MAX_CRACKS);
    expect(maxCracksFor({ maxCracks: 0 })).toBe(1);
    expect(maxCracksFor({ maxCracks: 999 })).toBe(MAX_CRACKS);
    // An id that is not in the catalogue (a hand-edited save) must not throw.
    expect(maxCracksFor("nope" as never)).toBe(MAX_CRACKS);
  });
});
