/* =====================================================================
   Lọ Chéo — one-tap settings presets (v1.1.6)

   Four curated configurations that map onto the new schema. A preset is a
   *partial* patch: language is never touched (players keep their language
   when switching between "Mượt" and "Đẹp"), and every preset is guaranteed
   to normalise to itself — `PRESET_LIST.some(p => matchesPreset(p.patch,
   applyPreset(current, p.id)))` must stay true.

   The three levels (low / balanced / high) mirror what the engine actually
   does: particle cap 230 vs 460 and glow passes on/off.
   ===================================================================== */

import type { GameSettings } from "./settings";

export type PresetId = "performance" | "balanced" | "cinematic" | "speedrun";

export interface SettingsPreset {
  id: PresetId;
  /** settings keys this preset overwrites */
  patch: Partial<GameSettings>;
}

export const PRESETS: Record<PresetId, SettingsPreset> = {
  /** Old laptop / integrated GPU: fewer particles, no glow, short shake. */
  performance: {
    id: "performance",
    patch: { visualQuality: "low", shakeLevel: "low", reducedMotion: true, autoPauseOnBlur: true },
  },
  /** Defaults — what the game ships with. */
  balanced: {
    id: "balanced",
    patch: {
      visualQuality: "high",
      shakeLevel: "high",
      reducedMotion: false,
      sfxVolume: 80,
      musicVolume: 60,
      autoPauseOnBlur: true,
    },
  },
  /** Show off the scene: full particles, glow, full shake. */
  cinematic: {
    id: "cinematic",
    patch: { visualQuality: "high", shakeLevel: "high", reducedMotion: false, sfxVolume: 90, musicVolume: 75 },
  },
  /** Tournament hygiene: quiet SFX, muted music, auto-pause off. */
  speedrun: {
    id: "speedrun",
    patch: { sfxVolume: 30, music: false, autoPauseOnBlur: false, shakeLevel: "low" },
  },
};

export const PRESET_LIST: readonly SettingsPreset[] = [
  PRESETS.performance,
  PRESETS.balanced,
  PRESETS.cinematic,
  PRESETS.speedrun,
];

/**
 * Apply a preset to the live settings without ever touching `language`.
 *
 * The id is validated first. `PRESETS[id].patch` with an id that is not in the
 * table but *is* on `Object.prototype` reads back `undefined` (or a function's
 * `.patch`, also `undefined`), and spreading `undefined` is a silent no-op —
 * the button appears to do nothing. An unknown id returns the settings
 * unchanged, which is the same visible outcome but for a stated reason and
 * without depending on spread's tolerance for `undefined`.
 */
export function applyPreset(current: GameSettings, id: PresetId): GameSettings {
  if (!Object.prototype.hasOwnProperty.call(PRESETS, id)) return current;
  return { ...current, ...PRESETS[id].patch, language: current.language };
}

/** Which preset exactly matches the current values? `null` = custom mix. */
export function matchPreset(current: GameSettings): PresetId | null {
  for (const preset of PRESET_LIST) {
    const ok = Object.entries(preset.patch).every(([k, v]) => current[k as keyof GameSettings] === v);
    if (ok) return preset.id;
  }
  return null;
}
