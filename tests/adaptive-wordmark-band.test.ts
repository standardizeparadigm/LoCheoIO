/**
 * The lockup, fitted to a band.
 *
 * `wordmark/scale.ts` has always derived `CHÉO` from `LỌ`; what it could not do
 * was shrink both to a *height*. This file pins the band half: the wordmark is
 * capped by the hero band the plan assigns, and `limitedBy` says which cap won
 * so a small logo can be explained.
 */
import { describe, expect, it } from "vitest";

import {
  LOCKUP_BOX_RATIO,
  MAX_LOCKUP_PX,
  MIN_LOCKUP_PX,
  lockupAtBand,
  lockupMaxForBand,
} from "../src/components/menu/wordmark/scale";
import { planMenuLayout } from "../src/components/menu/layout";
import { typeScaleFor } from "../src/components/menu/adaptive/typeScale";
import { boxOf } from "../src/components/menu/adaptive/viewport";

describe("lockupMaxForBand", () => {
  it("keeps two lines of the lockup inside the band", () => {
    for (const band of [120, 140, 200, 260, 320, 480, 620]) {
      const size = lockupMaxForBand(band);
      expect(size * LOCKUP_BOX_RATIO, `${band}px band`).toBeLessThanOrEqual(band + 0.01);
      expect(size).toBeGreaterThanOrEqual(MIN_LOCKUP_PX);
    }
  });

  it("caps at the 5.6rem ceiling and floors at the legibility floor", () => {
    expect(lockupMaxForBand(10_000)).toBe(MAX_LOCKUP_PX);
    expect(lockupMaxForBand(0)).toBe(MIN_LOCKUP_PX);
    expect(lockupMaxForBand(NaN)).toBe(MIN_LOCKUP_PX);
    expect(lockupMaxForBand(-500)).toBe(MIN_LOCKUP_PX);
  });

  it("rounds down to half a pixel", () => {
    const size = lockupMaxForBand(141);
    expect(size * 2).toBe(Math.floor(size * 2));
  });
});

describe("lockupAtBand", () => {
  it("says which cap won", () => {
    // A phone: the width wins (the clamp is already at its floor).
    expect(lockupAtBand(360, 900).limitedBy).toBe("width");
    // A short wide window: the band wins.
    expect(lockupAtBand(1920, 140).limitedBy).toBe("band");
  });

  it("keeps CHÉO under LỌ at every width and band", () => {
    for (let w = 320; w <= 3840; w += 61) {
      for (const band of [140, 200, 320, 620, 1000]) {
        const { lo, cheo, safe } = lockupAtBand(w, band);
        expect(safe, `${w}×${band}`).toBe(true);
        expect(cheo).toBeLessThan(lo);
      }
    }
  });

  it("is total for a corrupt band", () => {
    for (const band of [NaN, Infinity, -1, 0]) {
      const { lo, cheo } = lockupAtBand(1280, band);
      expect(Number.isFinite(lo)).toBe(true);
      expect(Number.isFinite(cheo)).toBe(true);
    }
  });
});

describe("the component and the profile agree", () => {
  it("gives the wordmark the same size the type table does", () => {
    for (const [w, h] of [[1280, 720], [1920, 820], [1920, 1080], [375, 667], [3840, 2160]]) {
      const plan = planMenuLayout({ width: w, height: h });
      const type = typeScaleFor({ box: boxOf(w, h), plan });
      // The table applies a tier inflation on top for large screens; the band
      // cap is the part both agree on, and it is never exceeded.
      expect(type.lockupLo, `${w}×${h}`).toBeLessThanOrEqual(lockupMaxForBand(plan.scene));
      expect(type.lockupCheo).toBeLessThan(type.lockupLo);
    }
  });
});
