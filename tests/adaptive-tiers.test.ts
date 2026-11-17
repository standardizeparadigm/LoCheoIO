/**
 * `tiers.ts` — the shared vocabulary.
 *
 * A tier is a claim about a window. Two claims have to hold or the vocabulary is
 * worthless: **every** window gets exactly one tier, and the tiers are ordered
 * (a bigger window never gets a smaller tier). Both are asserted over a sweep,
 * not over a table of favourites.
 */
import { describe, expect, it } from "vitest";
import { TIERS, TIER_FLOORS } from "../src/components/menu/adaptive/tiers";
import {
  atLeast,
  bigger,
  describeTier,
  deviceClass,
  smaller,
  tierFor,
  tierOf,
  tierRank,
  tierScale,
} from "../src/components/menu/adaptive/tiers";
import { boxOf } from "../src/components/menu/adaptive/viewport";

describe("tierFor", () => {
  it("buckets the real devices the project is tested on", () => {
    const expected: Array<[number, number, string]> = [
      [320, 568, "xs"],
      [375, 667, "sm"],
      [414, 896, "sm"],
      [768, 1024, "lg"],
      [1024, 768, "lg"],
      [1280, 720, "lg"],
      [1440, 900, "lg"], // 900px of height is still laptop territory
      [1920, 1080, "xl"],
      [2560, 1440, "xxl"],
      [3840, 2160, "xxl"],
    ];
    for (const [w, h, tier] of expected) {
      expect(tierOf(w, h), `${w}×${h}`).toBe(tier);
    }
  });

  it("is decided by the shortest side, not the width", () => {
    // 1920×400 has a cinema's width and a phone's height: it must not be xxl.
    expect(tierOf(1920, 400)).toBe(tierOf(400, 1920));
    expect(tierOf(1920, 400)).toBe("sm");
  });

  it("assigns exactly one tier to every window in a sweep", () => {
    for (let w = 200; w <= 4200; w += 73) {
      for (let h = 200; h <= 2600; h += 97) {
        const tier = tierOf(w, h);
        expect(TIERS, `${w}×${h}`).toContain(tier);
      }
    }
  });

  it("is monotonic: a larger window never gets a smaller tier", () => {
    let previous = -1;
    for (let side = 200; side <= 3000; side += 25) {
      const rank = tierRank(tierOf(side, side));
      expect(rank).toBeGreaterThanOrEqual(previous);
      previous = rank;
    }
  });
});

describe("tier floors", () => {
  it("are inclusive at the floor and exclusive above it", () => {
    for (const tier of TIERS) {
      const floor = TIER_FLOORS[tier];
      if (floor === 0) continue;
      expect(tierFor(boxOf(floor, floor)), `exactly ${floor}`).toBe(tier);
      expect(tierFor(boxOf(floor - 1, floor - 1)), `one below ${floor}`).not.toBe(tier);
    }
  });

  it("are strictly ascending", () => {
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIER_FLOORS[TIERS[i]]).toBeGreaterThan(TIER_FLOORS[TIERS[i - 1]]);
    }
  });
});

describe("the ladder helpers", () => {
  it("rank, bigger and smaller agree", () => {
    expect(tierRank("xs")).toBe(0);
    expect(tierRank("xxl")).toBe(TIERS.length - 1);
    expect(tierRank("nope" as never)).toBe(0);
    expect(bigger("lg")).toBe("xl");
    expect(bigger("xxl")).toBe("xxl");
    expect(smaller("lg")).toBe("md");
    expect(smaller("xs")).toBe("xs");
    expect(atLeast("xl", "lg")).toBe(true);
    expect(atLeast("sm", "lg")).toBe(false);
  });

  it("scales upward with the tier and is bounded to sane multipliers", () => {
    let previous = 0;
    for (const tier of TIERS) {
      const scale = tierScale(tier);
      expect(scale).toBeGreaterThan(previous);
      expect(scale).toBeGreaterThanOrEqual(0.8);
      expect(scale).toBeLessThanOrEqual(1.35);
      previous = scale;
    }
  });

  it("explains every tier in one line", () => {
    for (const tier of TIERS) {
      const text = describeTier(tier);
      expect(text.startsWith(`${tier} —`), text).toBe(true);
    }
  });
});

describe("deviceClass", () => {
  it("names the five classes at their canonical sizes", () => {
    expect(deviceClass(boxOf(375, 667))).toBe("handset");
    expect(deviceClass(boxOf(768, 1024))).toBe("tablet");
    expect(deviceClass(boxOf(1280, 720))).toBe("laptop");
    expect(deviceClass(boxOf(1920, 1080))).toBe("desktop");
    expect(deviceClass(boxOf(3840, 2160))).toBe("cinema");
  });

  it("calls a modern phone a handset, which it did not before round 17", () => {
    /*
     * The classification was area alone with a 300 000 px² handset floor, so
     * every phone shipped since 2019 was a "tablet": 390×844 is 329 160, and
     * only a phone *smaller* than about 360×800 came out right. The shortest
     * side is the axis that actually separates a phone from a tablet.
     */
    for (const [w, h] of [[390, 844], [412, 915], [360, 800], [844, 390]] as const) {
      expect(deviceClass(boxOf(w, h)), `${w}×${h}`).toBe("handset");
    }
    // …and a tablet stays a tablet.
    expect(deviceClass(boxOf(768, 1024))).toBe("tablet");
    expect(deviceClass(boxOf(1024, 768))).toBe("tablet");
  });

  it("keeps the large classes separated by area", () => {
    // A 2560-wide ultrawide has a laptop's short side; a 2560×1440 monitor does
    // not. Both are "big", only one is a cinema.
    expect(deviceClass(boxOf(2560, 1080))).toBe("desktop");
    expect(deviceClass(boxOf(2560, 1440))).toBe("cinema");
    expect(deviceClass(boxOf(1600, 1000))).toBe("desktop");
    expect(deviceClass(boxOf(1440, 900))).toBe("laptop");
  });

  it("always returns one of the five classes, for any box at all", () => {
    for (const side of [0, 1, 100, 320, 480, 720, 1440, 4000]) {
      expect(["handset", "tablet", "laptop", "desktop", "cinema"]).toContain(deviceClass(boxOf(side, side)));
    }
  });
});
