/**
 * The two preferences, and the three sources that decide them.
 *
 * Round 15. Before this file, `settings.reducedMotion` reached the canvas and
 * nothing else, `prefers-contrast: more` was read by `App.tsx` alone, and the
 * profile could not answer "what did the player ask for?" at all. Each of those is
 * a claim in the READMEs that no test could see.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { DESKTOP_ENVIRONMENT, type Environment } from "../src/components/menu/adaptive/environment";
import {
  adaptiveAttributes,
  resolveAdaptive,
  resolveForSize,
} from "../src/components/menu/adaptive/resolve";
import { boxOf } from "../src/components/menu/adaptive/viewport";
import {
  CONTRAST_PREFERENCES,
  DEFAULT_PREFERENCES,
  MOTION_PREFERENCES,
  describePreferences,
  preferenceAttributes,
  preferenceVars,
  preferencesFor,
} from "../src/components/menu/adaptive/preferences";
import { violations } from "../src/components/menu/adaptive/constraints";

const env = (patch: Partial<Environment> = {}): Environment => ({ ...DESKTOP_ENVIRONMENT, ...patch });

describe("preferencesFor", () => {
  it("defaults to full motion and normal contrast", () => {
    expect(preferencesFor()).toEqual(DEFAULT_PREFERENCES);
    expect(preferencesFor(env())).toEqual({ motion: "full", contrast: "normal" });
  });

  it("takes the OS reduced-motion request", () => {
    expect(preferencesFor(env({ reducedMotion: true }))).toEqual({ motion: "reduced", contrast: "normal" });
  });

  it("takes the player's own switch", () => {
    expect(preferencesFor(env(), true)).toEqual({ motion: "reduced", contrast: "normal" });
  });

  it("OR-s the two sources, so the app never overrules the OS", () => {
    // The player turns the switch *off* on a machine whose OS asks for less motion:
    // the OS statement wins, because it is about the person and not about a default.
    expect(preferencesFor(env({ reducedMotion: true }), false).motion).toBe("reduced");
    // …and the switch alone is enough on a machine that asks for nothing.
    expect(preferencesFor(env({ reducedMotion: false }), true).motion).toBe("reduced");
  });

  it("does not trust the settings file", () => {
    // `settings` is user-editable JSON, so the argument is `unknown` on purpose.
    for (const junk of ["true", 1, null, undefined, {}, Number.NaN]) {
      expect(preferencesFor(env(), junk).motion, String(junk)).toBe("full");
    }
  });

  it("reads the contrast request", () => {
    expect(preferencesFor(env({ moreContrast: true })).contrast).toBe("more");
  });

  it("only ever returns a value from the published sets", () => {
    for (const reducedMotion of [true, false]) {
      for (const moreContrast of [true, false]) {
        const prefs = preferencesFor(env({ reducedMotion, moreContrast }));
        expect(MOTION_PREFERENCES).toContain(prefs.motion);
        expect(CONTRAST_PREFERENCES).toContain(prefs.contrast);
      }
    }
  });
});

describe("the profile carries them", () => {
  it("resolves prefs from the environment it was given", () => {
    const profile = resolveForSize(1280, 720, env({ reducedMotion: true, moreContrast: true }));
    expect(profile.prefs).toEqual({ motion: "reduced", contrast: "more" });
  });

  it("publishes the same values as CSS variables", () => {
    const profile = resolveForSize(1280, 720, env({ reducedMotion: true }));
    expect(profile.cssVars["--adaptive-motion"]).toBe("reduced");
    expect(profile.cssVars["--adaptive-contrast"]).toBe("normal");
    expect(preferenceVars(profile.prefs)["--adaptive-motion"]).toBe("reduced");
  });

  it("emits the legacy hooks only when the preference is on", () => {
    const quiet = adaptiveAttributes(resolveForSize(1280, 720));
    expect(quiet["data-adaptive-motion"]).toBe("full");
    expect(quiet["data-adaptive-contrast"]).toBe("normal");
    // Absent, not "false": the CSS rules select on presence.
    expect(quiet["data-reduced-motion"]).toBeUndefined();
    expect(quiet["data-contrast"]).toBeUndefined();

    const loud = adaptiveAttributes(resolveForSize(1280, 720, env({ reducedMotion: true, moreContrast: true })));
    expect(loud["data-reduced-motion"]).toBe("true");
    expect(loud["data-contrast"]).toBe("more");
    expect(preferenceAttributes({ motion: "reduced", contrast: "more" })).toEqual({
      "data-adaptive-motion": "reduced",
      "data-adaptive-contrast": "more",
      "data-reduced-motion": "true",
      "data-contrast": "more",
    });
  });

  it("does not change one number of the layout", () => {
    // Preferences are not geometry: turning either on must not move a pixel.
    const calm = resolveForSize(844, 390);
    const loud = resolveForSize(844, 390, env({ reducedMotion: true, moreContrast: true }));
    expect(loud.plan).toEqual(calm.plan);
    expect(loud.type).toEqual(calm.type);
    expect(loud.density).toBe(calm.density);
    expect(violations(loud)).toEqual([]);
  });

  it("describes itself in one line", () => {
    expect(describePreferences({ motion: "reduced", contrast: "more" })).toBe("motion reduced · contrast more");
  });
});

describe("prefs-respected", () => {
  const profile = resolveForSize(1280, 720, env({ reducedMotion: true }));

  it("is satisfied by every resolved profile", () => {
    for (const [w, h] of [[320, 480], [844, 390], [1280, 720], [3840, 2160]] as const) {
      for (const e of [env(), env({ reducedMotion: true }), env({ moreContrast: true }), env({ reducedMotion: true, moreContrast: true })]) {
        const p = resolveAdaptive({ box: boxOf(w, h), env: e });
        expect(violations(p).map((v) => v.id), `${w}×${h}`).not.toContain("prefs-respected");
      }
    }
  });

  it("catches a field and a variable that disagree", () => {
    const lying = { ...profile, cssVars: { ...profile.cssVars, "--adaptive-motion": "full" } };
    expect(violations(lying).map((v) => v.id)).toContain("prefs-respected");

    const lyingContrast = { ...profile, prefs: { ...profile.prefs, contrast: "more" as const } };
    expect(violations(lyingContrast).map((v) => v.id)).toContain("prefs-respected");
  });

  it("catches a value outside the published set", () => {
    const bogus = { ...profile, prefs: { motion: "sometimes" as never, contrast: "normal" as const } };
    expect(violations(bogus).map((v) => v.id)).toContain("prefs-respected");
  });
});

describe("the CSS that consumes them", () => {
  const css = readFileSync("src/index.css", "utf8");
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

  it("stops the same decorative layers for the setting as for the OS", () => {
    /*
     * Round 5's attribute rule stopped three class names; the OS media query stops
     * twenty-seven. A player toggling «Giảm chuyển động» therefore saw almost no
     * change in the menu. The two lists are compared here by *selector count*, which
     * is what made the gap invisible in the first place.
     */
    const osBlock = strip(css).slice(
      strip(css).indexOf("@media (prefers-reduced-motion: reduce)"),
      strip(css).indexOf("@media (prefers-reduced-motion: reduce)") + 1400,
    );
    const settingBlock = strip(css).slice(strip(css).indexOf('[data-reduced-motion="true"] .aurora-bg'));
    const osSelectors = (osBlock.match(/^\s*\.[a-z0-9-]+(?:,| \{)/gm) ?? []).length;
    const settingSelectors = (settingBlock.slice(0, 2400).match(/\[data-reduced-motion="true"\]/g) ?? []).length;
    expect(settingSelectors).toBeGreaterThanOrEqual(osSelectors - 1);
  });

  it("raises the panel border in contrast mode, on a class that exists", () => {
    expect(css).toMatch(/\[data-adaptive-contrast="more"\] \.corner-panel/);
    // `.corner-panel` is painted by CornerPanel.tsx; a rule on a class nothing
    // renders is dead CSS with a tidy name.
    expect(readFileSync("src/components/menu/CornerPanel.tsx", "utf8")).toContain("corner-panel");
  });
});
