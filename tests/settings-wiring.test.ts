import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

/**
 * Static wiring assertions — cheap guardrails that catch a whole class of
 * v1.1.6 regressions (a setting added to the schema but never applied).
 */
describe("settings → runtime wiring (v1.1.6)", () => {
  const app = read("src/App.tsx");

  it("App applies every audio setting", () => {
    for (const call of [
      "audio.setSfxEnabled(settings.sfx)",
      "audio.setMusicEnabled(settings.music)",
      "audio.setSfxVolume(settings.sfxVolume / 100)",
      "audio.setMusicVolume(settings.musicVolume / 100)",
    ]) {
      expect(app, call).toContain(call);
    }
  });

  it("App applies every engine setting, both on patch and on boot", () => {
    for (const call of [
      "setShakeEnabled(settings.shake)",
      "setShakeLevel(settings.shakeLevel)",
      "setQuality(settings.visualQuality)",
      "setReducedMotion(settings.reducedMotion)",
    ]) {
      expect(app, call).toContain(call);
    }
    // onReady path (engine hand-off) must not forget the new hooks
    expect(app).toContain("g.setShakeLevel(s.shakeLevel)");
    expect(app).toContain("g.setQuality(s.visualQuality)");
  });

  it("settings.language drives the i18n module", () => {
    expect(app).toContain("setLanguage(settings.language)");
    expect(app).toContain("loadSettings(detectInitialLanguage())");
  });

  it("GameCanvas gates auto-pause on the setting", () => {
    /*
     * ROUND 6 changed the shape of this guard, and the old assertion failed
     * against the new code — correctly, because it pinned a string rather than
     * the behaviour.
     *
     * The guard used to be an early `return` at the top of the visibility
     * handler. That made it a guard over the *whole handler*, which is how the
     * input release was lost: turning auto-pause off also turned off the key
     * release, so the jar kept moving on a hidden tab.
     *
     * Now the release is unconditional and only the *pause* is gated. The
     * setting still does its job; it just no longer covers something that was
     * never a preference.
     */
    const canvas = read("src/components/GameCanvas.tsx");
    expect(canvas).toContain("autoPauseOnBlur");

    // The pause is still gated on the setting …
    expect(canvas).toContain("if (cb.current.autoPauseOnBlur && game.phase === \"playing\")");

    // … and the setting no longer short-circuits the input release.
    expect(canvas).not.toContain("if (!cb.current.autoPauseOnBlur) return;");
  });

  it("reduced motion reaches both the engine and the canvas DOM attribute", () => {
    expect(app).toContain("setReducedMotion(settings.reducedMotion)");
    expect(app).toContain("reducedMotion={settings.reducedMotion}");
    const canvas = read("src/components/GameCanvas.tsx");
    expect(canvas).toContain('data-reduced-motion={reducedMotion ? "true" : undefined}');
    expect(read("src/index.css")).toContain('[data-reduced-motion="true"]');
  });

  it("settings patches persist prev+patch instead of re-reading storage", () => {
    // Regression: updateSettings() re-read storage, so a blocked/full
    // localStorage reverted every toggle to defaults on the next click.
    expect(app).toContain("saveSettings({ ...prev, ...patch })");
    expect(app).toContain("saveSettings({ ...prev, language: lang })");
    expect(app).not.toContain("updateSettings(");
  });

  it("mute state is persisted instead of reset every boot", () => {
    expect(app).toContain('readRaw(STORAGE_KEYS.muted) === "1"');
    expect(app).toContain("writeRaw(STORAGE_KEYS.muted, muted ? \"1\" : \"0\")");
  });

  it("the language switcher component is gone and the settings modal is re-exported", () => {
    const barrel = read("src/components/menu/index.ts");
    expect(barrel).toContain("SettingsModal");
    expect(barrel).toContain("../settings/SettingsModal");
    expect(() => read("src/components/LanguageSwitcher.tsx")).toThrow();
  });

  it("StartScreen no longer mounts a language switcher", () => {
    const start = read("src/components/StartScreen.tsx");
    expect(start).not.toContain("LanguageSwitcher");
    // the settings modal is reachable from the menu (route + props)
    expect(start).toContain("<SettingsModal");
    expect(start).toContain("onChangeLanguage={onChangeLanguage}");
  });
});
