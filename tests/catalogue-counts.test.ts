/**
 * `9 modes · 14 ingredients · 16 achievements` is printed in the menu README,
 * in the release doc, and — once — in a hero strip that was removed for
 * repeating it. Three numbers, ten documents, and no source of truth except
 * "someone counted once".
 *
 * They are countable from the catalogues: `MODE_LIST`, `KINDS` and
 * `ACHIEVEMENTS`. This file does the counting, so a tenth mode added without
 * updating the sentence fails here instead of shipping a README that says 9.
 *
 * It also pins the *relationship* the summary panel depends on: `InfoMenu`
 * passes `KINDS.length` for ingredients and `ACHIEVEMENTS.length` for
 * achievements, which is the reason those two can never disagree with the
 * catalogue — and the reason a stale README is the only way this goes wrong.
 */
import { describe, expect, it } from "vitest";

import { ACHIEVEMENTS } from "../src/game/achievements";
import { KINDS } from "../src/game/engine";
import { MODE_LIST } from "../src/game/modes";

describe("the three catalogue counts", () => {
  it("is nine modes", () => {
    expect(MODE_LIST).toHaveLength(9);
  });

  it("is fourteen ingredients", () => {
    // `KINDS` is the weighted-spawn table, which is the ingredient catalogue:
    // every kind is something that falls into the jar.
    expect(KINDS).toHaveLength(14);
  });

  it("is sixteen achievements", () => {
    expect(ACHIEVEMENTS).toHaveLength(16);
  });

  it("has unique ids in every catalogue, so a count cannot be inflated by a duplicate", () => {
    // Two achievements with the same id would make 16 into "15 distinct things",
    // and the panel prints the array length, not the distinct count.
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    expect(new Set(MODE_LIST.map((m) => m.id)).size).toBe(MODE_LIST.length);
    expect(new Set(KINDS).size).toBe(KINDS.length);
  });
});
