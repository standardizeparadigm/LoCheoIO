/**
 * The mode multiplier helpers: `comboWindowFor` and `jarBonusFor`.
 *
 * `mode-math.test.ts` covers the arithmetic these were built on (`saneInt`,
 * `multiplierForCombo`, `levelForCatches`, `jarBonus`). It does not cover the
 * *lookup* — and the lookup was the broken part:
 *
 *     MODES[mode].comboWindowMult ?? 1
 *
 * with no check that `MODES[mode]` exists, and `??` as the numeric guard.
 *
 * These cases exist because `mode` crosses a trust boundary. It arrives from
 * `locheo.run.v1` and from the mode selector, and it is the kind of value a
 * player edits in DevTools when they want nine lives.
 */
import { describe, expect, it } from "vitest";
import { COMBO_WINDOW, comboWindowFor, jarBonus, jarBonusFor } from "../src/game/modeMath";
import { MODE_LIST, MODES } from "../src/game/modesIndex";

/** The nine ids, in catalogue order — `MODES` is the record, `MODE_LIST` the order. */
const MODE_IDS = MODE_LIST.map((m) => m.id);

describe("an unknown mode id falls back instead of throwing", () => {
  const bogus = ["nope", "", "toString", "__proto__", "constructor"];

  it("comboWindowFor returns the base window", () => {
    // Before the fix: TypeError: Cannot read properties of undefined.
    for (const id of bogus) {
      expect(() => comboWindowFor(id as never), `${id} threw`).not.toThrow();
      expect(comboWindowFor(id as never), `${id} is ${comboWindowFor(id as never)}`).toBe(COMBO_WINDOW);
    }
  });

  it("jarBonusFor returns the unmultiplied bonus", () => {
    for (const id of bogus) {
      expect(() => jarBonusFor(3, id as never), `${id} threw`).not.toThrow();
      expect(jarBonusFor(3, id as never)).toBe(jarBonus(3));
    }
  });

  it("does not pick up a prototype property", () => {
    /*
     * `"toString" in MODES` is true and `MODES["toString"]` is a function, so a
     * naive `in` guard passes and the field read is `undefined` on a function.
     * `multOf` requires the result to be a non-finite number, so a function
     * becomes 1.
     */
    expect(typeof (MODES as Record<string, unknown>).toString).toBe("function");
    expect(comboWindowFor("toString" as never)).toBe(COMBO_WINDOW);
    expect(jarBonusFor(3, "toString" as never)).toBe(jarBonus(3));
  });
});

describe("a corrupt multiplier falls back instead of poisoning the value", () => {
  const bad = [Number.NaN, Infinity, -Infinity, -1, -0.5];

  it("comboWindowFor ignores a non-finite or negative multiplier", () => {
    for (const mult of bad) {
      const v = comboWindowFor({ comboWindowMult: mult });
      expect(Number.isFinite(v), `comboWindowMult=${mult} → ${v}`).toBe(true);
      expect(v).toBe(COMBO_WINDOW);
    }
  });

  it("jarBonusFor ignores a non-finite or negative multiplier", () => {
    for (const mult of bad) {
      const v = jarBonusFor(3, { jarBonusMult: mult });
      expect(Number.isFinite(v), `jarBonusMult=${mult} → ${v}`).toBe(true);
      expect(v).toBe(jarBonus(3));
    }
  });

  it("ignores a multiplier that is not a number at all", () => {
    for (const mult of ["2", null, undefined, {}, []]) {
      expect(comboWindowFor({ comboWindowMult: mult } as never)).toBe(COMBO_WINDOW);
    }
  });
});

describe("zero is a legitimate multiplier and must survive", () => {
  it("comboWindowFor returns 0, not the base window", () => {
    // `?? 1` promoted 0 to 1 — wrong, and silent.
    expect(comboWindowFor({ comboWindowMult: 0 })).toBe(0);
  });

  it("jarBonusFor returns 0, not the base bonus", () => {
    expect(jarBonusFor(3, { jarBonusMult: 0 })).toBe(0);
  });

  it("a mode with a zero multiplier is honoured", () => {
    // Whatever the catalogue says, the helper follows.
    const zero = MODE_IDS.find((id) => MODES[id].comboWindowMult === 0);
    if (zero) expect(comboWindowFor(zero)).toBe(0);
    else expect(comboWindowFor({ comboWindowMult: 0 })).toBe(0);
  });
});

describe("real modes are still read correctly", () => {
  it("every catalogue multiplier produces a finite, non-negative result", () => {
    for (const id of MODE_IDS) {
      const w = comboWindowFor(id);
      const b = jarBonusFor(5, id);
      expect(Number.isFinite(w) && w >= 0, `${id} window ${w}`).toBe(true);
      expect(Number.isFinite(b) && b >= 0, `${id} bonus ${b}`).toBe(true);
    }
  });

  it("a mode with a multiplier gets exactly that multiple", () => {
    for (const id of MODE_IDS) {
      const mult = MODES[id].comboWindowMult;
      if (typeof mult !== "number") continue;
      expect(comboWindowFor(id)).toBeCloseTo(COMBO_WINDOW * mult, 10);
    }
  });

  it("a mode object and a mode id agree", () => {
    // Both call shapes exist in the codebase; they must not diverge.
    for (const id of MODE_IDS) {
      expect(comboWindowFor(MODES[id])).toBe(comboWindowFor(id));
      expect(jarBonusFor(4, MODES[id])).toBe(jarBonusFor(4, id));
    }
  });
});
