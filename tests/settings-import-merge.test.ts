/**
 * Importing a partial backup must not reset what it does not mention.
 *
 * This is the difference between "restore this file" and "restore this file and
 * silently wipe everything I changed since". The bug was structural rather than
 * a bad branch: `normalizeSettings` fills missing keys from `DEFAULT_SETTINGS`,
 * which is exactly right when reading storage (no previous state exists) and
 * exactly wrong when importing over a live configuration.
 */
import { describe, expect, it } from "vitest";
import { exportSettings, importSettings, looksLikeSettingsBackup } from "../src/game/settingsIO";
import { DEFAULT_SETTINGS, normalizeSettings, type GameSettings } from "../src/game/settings";

/** A player who disagrees with the defaults on six of ten keys. */
const MINE: GameSettings = {
  ...DEFAULT_SETTINGS,
  sfx: false,
  music: false,
  sfxVolume: 17,
  musicVolume: 5,
  reducedMotion: true,
  language: "en",
};

describe("a partial backup merges instead of resetting", () => {
  it("changes only the keys the file contains", () => {
    const next = importSettings(JSON.stringify({ sfxVolume: 30 }), "en", MINE)!;
    expect(next.sfxVolume).toBe(30);
    expect(next.sfx).toBe(MINE.sfx);
    expect(next.music).toBe(MINE.music);
    expect(next.musicVolume).toBe(MINE.musicVolume);
  });

  it("keeps reducedMotion, the setting with a medical reason to stay on", () => {
    // A backup written before the field existed. Losing this silently is the
    // worst-case row of the bug report.
    const next = importSettings(JSON.stringify({ sfx: true }), "en", MINE)!;
    expect(next.reducedMotion).toBe(true);
  });

  it("keeps the language when the file has none", () => {
    /*
     * `languageFallback` outranks `base`, and that is intentional: the fallback
     * is the *detected* language from the i18n module, which the caller passes
     * precisely so a first-run import does not force Vietnamese on a Japanese
     * browser. `BackupSection` passes `settings.language`, so in the app the two
     * agree and this branch is invisible.
     */
    const next = importSettings(JSON.stringify({ musicVolume: 40 }), "en", MINE)!;
    expect(next.language).toBe("en");
  });

  it("lets only a written language override the fallback", () => {
    // The one case where the file wins, which is what makes the previous test
    // meaningful rather than tautological.
    // `ko` is one of the seven UI locales; `th` is not, which is why the first
    // version of this test failed — a useful reminder that README translations
    // and UI locales are different sets.
    const next = importSettings(JSON.stringify({ language: "ko" }), "en", MINE)!;
    expect(next.language).toBe("ko");
  });

  it("still overwrites a key the file does contain", () => {
    // The merge must not be so defensive that the import stops importing.
    const next = importSettings(JSON.stringify({ reducedMotion: false, language: "ja" }), "en", MINE)!;
    expect(next.reducedMotion).toBe(false);
    expect(next.language).toBe("ja");
  });

  it("falls back to defaults when no current settings are given", () => {
    // `looksLikeSettingsBackup()` and the tests use this form; the old
    // behaviour must stay available.
    const next = importSettings(JSON.stringify({ sfxVolume: 30 }))!;
    expect(next.musicVolume).toBe(DEFAULT_SETTINGS.musicVolume);
  });

  it("merges an envelope's inner settings too, not just a bare object", () => {
    const envelope = JSON.stringify({
      app: "lo-cheoio",
      kind: "settings",
      version: 1,
      exportedAt: "2026-11-13T00:00:00.000Z",
      settings: { shake: false },
    });
    const next = importSettings(envelope, "en", MINE)!;
    expect(next.shake).toBe(false);
    expect(next.reducedMotion).toBe(true);
  });

  it("does not mutate the current settings it was given", () => {
    const snapshot = { ...MINE };
    importSettings(JSON.stringify({ sfxVolume: 3, language: "ko" }), "en", MINE);
    expect(MINE).toEqual(snapshot);
  });

  it("round-trips a full export with no drift", () => {
    // Export writes every key, so a full restore must still be exact.
    const back = importSettings(exportSettings(MINE), "vi", DEFAULT_SETTINGS)!;
    expect(back).toEqual(MINE);
  });
});

describe("normalizeSettings keeps both of its jobs", () => {
  it("defaults missing keys when no base is passed (storage read)", () => {
    const s = normalizeSettings({ sfx: false });
    expect(s.sfx).toBe(false);
    expect(s.musicVolume).toBe(DEFAULT_SETTINGS.musicVolume);
  });

  it("uses the base for missing keys when one is passed (import)", () => {
    const s = normalizeSettings({ sfx: false }, "en", MINE);
    expect(s.sfx).toBe(false);
    expect(s.musicVolume).toBe(MINE.musicVolume);
  });

  it("still rejects junk in a present key, whatever the base", () => {
    // The base fills *absent* keys; it must not launder a bad value.
    const s = normalizeSettings({ musicVolume: "loud" }, "en", MINE);
    expect(s.musicVolume).toBe(MINE.musicVolume);
    const t = normalizeSettings({ sfx: 5, shakeLevel: "MAXIMUM" }, "en", MINE);
    expect(t.sfx).toBe(MINE.sfx);
    expect(t.shakeLevel).toBe(MINE.shakeLevel);
  });

  it("looksLikeSettingsBackup ignores the current settings entirely", () => {
    // It answers a question about the *file*, so the player's volume slider
    // must not be able to change the answer.
    const raw = JSON.stringify({ sfxVolume: 30 });
    expect(looksLikeSettingsBackup(raw)).toBe(true);
    expect(looksLikeSettingsBackup(JSON.stringify({ score: 10 }))).toBe(false);
  });
});
