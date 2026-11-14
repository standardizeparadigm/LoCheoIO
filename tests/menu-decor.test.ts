/**
 * The hero decoration, checked for the two things that make decoration go
 * wrong: it lands on the title, or it turns into a pile.
 *
 * Both are geometric, so both can be checked. The third thing — whether it
 * looks good — cannot, and is a matter of taste; but "does not cover a glyph"
 * and "does not collide with its neighbour" are what make the difference
 * between a decorated menu and a messy one.
 */
import { describe, expect, it } from "vitest";
import {
  HERO_DECOR,
  WORDMARK_ZONE,
  decorCounts,
  decorOverlap,
  insideWordmark,
} from "../src/components/menu/scene/decor";

describe("the decoration set", () => {
  it("has fourteen items — enough to fill the hero, few enough to stay calm", () => {
    expect(HERO_DECOR).toHaveLength(14);
  });

  it("uses at least six different glyph kinds", () => {
    const kinds = new Set(HERO_DECOR.map((d) => d.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(6);
  });

  it("ids are unique", () => {
    const ids = HERO_DECOR.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("decorCounts totals the set", () => {
    const counts = decorCounts();
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(HERO_DECOR.length);
  });

  it("every kind in the union is actually used at least once", () => {
    for (const [kind, n] of Object.entries(decorCounts())) {
      expect(n, `${kind} is declared but never used`).toBeGreaterThan(0);
    }
  });
});

describe("nothing lands on the wordmark", () => {
  it("no decoration is inside the wordmark rectangle", () => {
    const offenders = HERO_DECOR.filter(insideWordmark).map((d) => d.id);
    expect(offenders).toEqual([]);
  });

  it("the wordmark zone is in the left-centre, where the glyphs are", () => {
    expect(WORDMARK_ZONE.x).toBe(0);
    expect(WORDMARK_ZONE.w).toBeGreaterThan(50);
  });
});

describe("nothing collides with its neighbour", () => {
  it("no pair of decorations overlaps", () => {
    const pairs: string[] = [];
    for (let i = 0; i < HERO_DECOR.length; i++) {
      for (let j = i + 1; j < HERO_DECOR.length; j++) {
        if (decorOverlap(HERO_DECOR[i], HERO_DECOR[j])) {
          pairs.push(`${HERO_DECOR[i].id}+${HERO_DECOR[j].id}`);
        }
      }
    }
    expect(pairs).toEqual([]);
  });
});

describe("the motion is varied, not synchronised", () => {
  it("durations are not all the same", () => {
    const durs = new Set(HERO_DECOR.map((d) => d.dur));
    expect(durs.size).toBeGreaterThanOrEqual(8);
  });

  it("delays spread the set out", () => {
    const delays = HERO_DECOR.map((d) => d.delay);
    expect(Math.max(...delays) - Math.min(...delays)).toBeGreaterThan(2);
  });

  it("no decoration is fully opaque — nothing competes with the title", () => {
    for (const d of HERO_DECOR) {
      expect(d.opacity).toBeLessThanOrEqual(0.75);
      expect(d.opacity).toBeGreaterThan(0);
    }
  });

  it("sizes stay in a band that reads as decoration", () => {
    for (const d of HERO_DECOR) {
      expect(d.size).toBeGreaterThanOrEqual(8);
      expect(d.size).toBeLessThanOrEqual(32);
    }
  });
});
