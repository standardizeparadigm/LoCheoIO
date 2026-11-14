/* =====================================================================
   Lọ Chéo — game settings persistence (locheo.settings.v1)

   v1.1.6 grew the schema; v1.1.8 has six UI sections:
     Presets · Âm thanh (audio) · Giao diện & chuyển động (display & motion) ·
     Ngôn ngữ (language) · Sao lưu (backup) · Dữ liệu (danger zone).

   Only four of the six are represented *here*: presets and backup are pure UI
   (a preset writes other fields; a backup serialises the whole object), and the
   danger zone deletes storage keys rather than setting one. Writing "four
   sections" above a six-section modal is how a reader concludes the other two
   are missing.

   Mix of control types:
     • on/off toggles  — sfx, music, shake, reducedMotion, autoPauseOnBlur
     • level (0–100)   — sfxVolume, musicVolume
     • discrete choice — shakeLevel ("low"|"high"), visualQuality ("low"|"high")
     • language choice — one of the 7 UI languages

   Everything degrades to in-memory defaults when storage is blocked and
   every read is validated + clamped — corrupt data never crashes the game.
   ===================================================================== */

import { STORAGE_KEYS, readJSON, writeJSON } from "./safeStorage";

export type ShakeLevel = "low" | "high";
export type VisualQuality = "low" | "high";

export const SUPPORTED_LANGUAGES = ["vi", "en", "zh", "ja", "ko", "es", "fr"] as const;
export type SettingLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface GameSettings {
  /* ---- Âm thanh ---- */
  /** Sound effects (catch, slice, hurt, slam…) */
  sfx: boolean;
  /** Pentatonic background music during a run */
  music: boolean;
  /** SFX loudness 0–100 (applied on top of the SFX gate) */
  sfxVolume: number;
  /** Music loudness 0–100 (applied on top of the music gate) */
  musicVolume: number;
  /* ---- Giao diện & chuyển động ---- */
  /** Screen shake at all (master switch) */
  shake: boolean;
  /** Shake strength — "low" ≈ 45% trauma, "high" = full */
  shakeLevel: ShakeLevel;
  /** Reduce aurora/shimmer/flash/shake for motion-sensitive players */
  reducedMotion: boolean;
  /** "low" halves the particle budget and skips glow passes */
  visualQuality: VisualQuality;
  /** Auto-pause the run when the tab/window loses focus */
  autoPauseOnBlur: boolean;
  /* ---- Ngôn ngữ ---- */
  /** UI language — section moved here from the top-right switcher (v1.1.6) */
  language: SettingLanguage;
}

export const SETTINGS_KEY = STORAGE_KEYS.settings;

export const DEFAULT_SETTINGS: GameSettings = {
  sfx: true,
  music: true,
  sfxVolume: 80,
  musicVolume: 60,
  shake: true,
  shakeLevel: "high",
  reducedMotion: false,
  visualQuality: "high",
  autoPauseOnBlur: true,
  language: "vi",
};

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

/**
 * Normalise an untrusted value into a valid settings object.
 * Unknown keys are dropped; missing/invalid keys fall back to `base`.
 *
 * `languageFallback` lets the caller seed the language from the i18n module on
 * first run (so VI-first-run / browser-locale still works).
 *
 * `base` is what a **missing** key becomes. It defaults to `DEFAULT_SETTINGS`,
 * which is right for one job and wrong for the other:
 *
 *   · reading storage — there is no previous state, so defaults are correct;
 *   · importing a backup — the previous state is the player's live settings,
 *     and filling absent keys with defaults silently resets them.
 *
 * The import case is not hypothetical. A backup written by an older build that
 * predates a field (or a hand-written snippet with three keys) used to reset
 * every field it did not mention, and the UI reported success — so a player who
 * turned `reducedMotion` on for motion sickness, restored an old backup, and
 * saw the setting flip back to `false` had no way to tell why.
 */
export function normalizeSettings(
  v: unknown,
  languageFallback: string = DEFAULT_SETTINGS.language,
  base: GameSettings = DEFAULT_SETTINGS,
): GameSettings {
  const d = base;
  if (typeof v !== "object" || v === null) return { ...d, language: pick(languageFallback, SUPPORTED_LANGUAGES, d.language) };
  const s = v as Record<string, unknown>;
  return {
    sfx: bool(s.sfx, d.sfx),
    music: bool(s.music, d.music),
    sfxVolume: clampInt(s.sfxVolume, 0, 100, d.sfxVolume),
    musicVolume: clampInt(s.musicVolume, 0, 100, d.musicVolume),
    shake: bool(s.shake, d.shake),
    shakeLevel: pick(s.shakeLevel, ["low", "high"] as const, d.shakeLevel),
    reducedMotion: bool(s.reducedMotion, d.reducedMotion),
    visualQuality: pick(s.visualQuality, ["low", "high"] as const, d.visualQuality),
    autoPauseOnBlur: bool(s.autoPauseOnBlur, d.autoPauseOnBlur),
    language: pick(s.language, SUPPORTED_LANGUAGES, pick(languageFallback, SUPPORTED_LANGUAGES, d.language)),
  };
}

/**
 * Read persisted settings.
 *
 * `osDefaults` are applied **only on first run** (nothing stored yet) so the
 * player's operating-system preferences — `prefers-reduced-motion`,
 * `prefers-contrast` — become the starting point instead of being ignored
 * until the player finds the settings panel. Once a settings object exists
 * (even a partial one) the stored values always win.
 */
export function loadSettings(languageFallback?: string, osDefaults?: Partial<GameSettings>): GameSettings {
  const stored = readJSON(SETTINGS_KEY);
  if (stored === null || typeof stored !== "object") {
    return normalizeSettings({ ...osDefaults, language: languageFallback }, languageFallback);
  }
  return normalizeSettings(stored, languageFallback);
}

export function saveSettings(settings: GameSettings): GameSettings {
  const clean = normalizeSettings(settings);
  // writeJSON swallows quota/private-mode failures — settings stay in memory
  writeJSON(SETTINGS_KEY, clean);
  return clean;
}

/**
 * Patch a subset of settings, persist, and return the full object.
 *
 * `base` lets the caller pass the settings it already holds in React state.
 * Without it this function has to re-read storage, which **loses in-memory
 * changes when storage is blocked** (Safari private mode, quota exhausted):
 * the patch would be applied to the defaults instead of to what the player
 * just changed. Call sites inside the app always pass `base`.
 */
export function updateSettings(patch: Partial<GameSettings>, base?: GameSettings): GameSettings {
  return saveSettings({ ...(base ?? loadSettings()), ...patch });
}

/** Reset every setting to defaults except keep the current language choice. */
export function resetSettingsKeepingLanguage(current: GameSettings): GameSettings {
  return saveSettings({ ...DEFAULT_SETTINGS, language: current.language });
}
