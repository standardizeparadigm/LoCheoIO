/**
 * Motion grading — how loud the decoration should be on this device.
 *
 * Round 15 made "reduce motion" a real switch. This round adds the missing
 * middle: a phone runs the same seventeen animated layers as a desktop, with a
 * fifth of the GPU and a hero band too short to read a 34-second rotation. The
 * grade slows those layers on small devices and leaves the *stop* to the
 * accessibility preference, so the two are never confused for each other.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  MOTION_FACTORS,
  MOTION_GRADES,
  describeMotion,
  motionFactorVar,
  multipliesSafely,
  planMotion,
} from "../src/components/menu/adaptive/motion";
import { resolveForSize, ADAPTIVE_CSS_VARS, adaptiveAttributes } from "../src/components/menu/adaptive/resolve";
import { DEFAULT_PREFERENCES } from "../src/components/menu/adaptive/preferences";
import { DESKTOP_ENVIRONMENT, type Environment } from "../src/components/menu/adaptive/environment";

const full = { ...DEFAULT_PREFERENCES };
const reduced = { motion: "reduced" as const, contrast: "normal" as const };

describe("planMotion", () => {
  it("grades a desktop vivid", () => {
    const plan = planMotion({ prefs: full, device: "desktop" });
    expect(plan.grade).toBe("vivid");
    expect(plan.factor).toBe(1);
  });

  it("grades a handset steady — slower, not stopped", () => {
    const plan = planMotion({ prefs: full, device: "handset" });
    expect(plan.grade).toBe("steady");
    expect(plan.factor).toBeGreaterThan(1);
  });

  it("grades a coarse pointer steady even on a large window", () => {
    expect(planMotion({ prefs: full, device: "laptop", coarse: true }).grade).toBe("steady");
  });

  it("does not slow a tablet, which has the GPU and the band for it", () => {
    expect(planMotion({ prefs: full, device: "tablet" }).grade).toBe("vivid");
  });

  it("stops entirely when the player or the OS asked for less motion", () => {
    for (const device of ["handset", "tablet", "desktop", "cinema"] as const) {
      expect(planMotion({ prefs: reduced, device }).grade, device).toBe("still");
    }
  });

  it("never multiplies a duration by zero", () => {
    /*
     * `calc(14s * 0)` is a zero-duration *infinite* animation, which engines
     * disagree about. `still` is stopped by the reduced-motion hooks; the factor
     * only ever scales.
     */
    for (const grade of MOTION_GRADES) {
      expect(multipliesSafely(MOTION_FACTORS[grade]), grade).toBe(true);
    }
    expect(MOTION_FACTORS.still).toBe(1);
  });

  it("writes a decimal-point number, not a locale one", () => {
    // `1,6` inside calc() is a parse error in every engine.
    for (const grade of MOTION_GRADES) {
      const v = motionFactorVar({ grade, factor: MOTION_FACTORS[grade], why: "" });
      expect(v, grade).toMatch(/^\d+(\.\d+)?$/);
    }
    expect(motionFactorVar({ grade: "steady", factor: 1.6, why: "" })).toBe("1.6");
  });

  it("describes itself in one line", () => {
    expect(describeMotion({ grade: "vivid", factor: 1, why: "" })).toBe("motion vivid");
    expect(describeMotion({ grade: "steady", factor: 1.6, why: "" })).toBe("motion steady ×1.6");
    expect(describeMotion({ grade: "still", factor: 1, why: "" })).toBe("motion still");
  });
});

describe("the profile carries the grade", () => {
  const env: Environment = { ...DESKTOP_ENVIRONMENT };

  it("publishes the factor and the attribute from one decision", () => {
    const desktop = resolveForSize(1440, 900, env);
    expect(desktop.motion.grade).toBe("vivid");
    expect(desktop.cssVars["--adaptive-motion-factor"]).toBe("1");
    expect(adaptiveAttributes(desktop)["data-adaptive-motion-grade"]).toBe("vivid");

    const phone = resolveForSize(390, 780, env);
    expect(phone.motion.grade).toBe("steady");
    expect(phone.cssVars["--adaptive-motion-factor"]).toBe("1.6");
    expect(adaptiveAttributes(phone)["data-adaptive-motion-grade"]).toBe("steady");
  });

  it("grades still when the environment asks for reduced motion", () => {
    const still = resolveForSize(1440, 900, { ...env, reducedMotion: true });
    expect(still.motion.grade).toBe("still");
    expect(still.prefs.motion).toBe("reduced");
  });

  it("lists the factor among the published variables", () => {
    expect(ADAPTIVE_CSS_VARS).toContain("--adaptive-motion-factor");
  });

  it("is finite on every preset, including degenerate windows", () => {
    for (const [w, h] of [[1, 1], [0, 0], [Number.NaN, 720], [1920, 1080], [844, 300]] as const) {
      const p = resolveForSize(w, h, env);
      expect(Number.isFinite(p.motion.factor), `${w}×${h}`).toBe(true);
      expect(p.motion.factor, `${w}×${h}`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("the stylesheet consumes it", () => {
  const css = readFileSync(resolve(__dirname, "../src/index.css"), "utf8");

  it("scales the decorative durations that matter", () => {
    // The hero halo and the about crest are the two ornaments a player stares at.
    for (const selector of [".halo-ring-1", ".halo-ring-2", ".halo-ring-3", ".about-crest-orbit-main", ".about-crest-orbit-inner", ".about-crest-orbit-dotted"]) {
      const at = css.indexOf(`${selector} {`);
      expect(at, `${selector} must exist`).toBeGreaterThan(-1);
      const body = css.slice(at, css.indexOf("}", at));
      expect(body, selector).toContain("var(--adaptive-motion-factor, 1)");
    }
  });

  it("keeps a 1 fallback so a profile-less render is identical to before", () => {
    // A stylesheet that divides by an unset variable is a blank screen in SSR.
    const uses = [...css.matchAll(/var\(--adaptive-motion-factor([^)]*)\)/g)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(5);
    for (const fallback of uses) expect(fallback).toContain(", 1");
  });
});
