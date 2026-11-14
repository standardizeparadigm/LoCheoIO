/**
 * The «Cách chơi» content is data, and data drifts.
 *
 * v1.1.8 moved the six rules out of the hero accordion and into a modal, and
 * the move turned a hand-written JSX block into a table in `howto/rules.ts`.
 * A table is easier to break silently than JSX: add a seventh rule, forget the
 * i18n keys, and `t()` returns `rule.6.t` — a literal key rendered in bold —
 * because that is what it does for a key it cannot find.
 *
 * So these tests check the *content* against the real translation table, not
 * against a copy of it. `hasKey()` reads `messages.vi`, which is the source
 * every other locale is required to be in parity with (`npm run check:i18n`),
 * so a rule that exists in no locale cannot pass here.
 */
import { describe, expect, it } from "vitest";

import {
  HOW_TO_GOAL_KEY,
  HOW_TO_RULES,
  KEYBOARD_KEYS,
} from "../src/components/menu/howto/rules";
import { hasKey } from "../src/i18n/i18n";

describe("how-to rules", () => {
  it("has six rules, because the modal is sized for six", () => {
    expect(HOW_TO_RULES).toHaveLength(6);
  });

  it("numbers them 1..6 in order, with no gaps", () => {
    expect(HOW_TO_RULES.map((r) => r.n)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("gives every rule a unique id", () => {
    const ids = HOW_TO_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every title and body at a key that actually exists", () => {
    for (const rule of HOW_TO_RULES) {
      expect(hasKey(rule.titleKey), `${rule.id} title`).toBe(true);
      expect(hasKey(rule.bodyKey), `${rule.id} body`).toBe(true);
    }
  });

  it("points the goal line at a key that exists", () => {
    expect(hasKey(HOW_TO_GOAL_KEY)).toBe(true);
  });

  it("cycles the three accents so six cards do not read as a wall", () => {
    expect(HOW_TO_RULES.map((r) => r.accent)).toEqual([
      "tumeric", "brine", "chili", "tumeric", "brine", "chili",
    ]);
  });

  it("keys each rule by its own number, so a translation cannot land on the wrong card", () => {
    // rule-3 must use rule.3.*. A copy-paste that leaves rule.2.* on card 3
    // renders plausible text — the wrong rule, under the right number.
    for (const [i, rule] of HOW_TO_RULES.entries()) {
      expect(rule.id).toBe(`rule-${i}`);
      expect(rule.titleKey).toBe(`rule.${i}.t`);
      expect(rule.bodyKey).toBe(`rule.${i}.d`);
    }
  });
});

describe("keyboard legend", () => {
  it("lists the four movement keys in reading order", () => {
    expect([...KEYBOARD_KEYS]).toEqual(["W", "A", "S", "D"]);
  });
});
