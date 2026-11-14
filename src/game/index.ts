/*
 * `src/game/` — rules, storage and progression. No React in this folder.
 *
 * Barrel added in round 4. It exposes only the handful of entry points a screen
 * actually needs; spawn tables, palette weights and the engine's inner loop stay
 * module-private, so a screen cannot start depending on a rule it does not own.
 */

export type { ModeId, ModeConfig } from "./modeTypes";
export { MODES, MODE_LIST, isModeId } from "./modesIndex";
export {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  loadSettings,
  saveSettings,
  updateSettings,
  resetSettingsKeepingLanguage,
} from "./settings";
export {
  RUN_SAVE_KEY,
  loadSavedRun,
  saveSavedRun,
  clearSavedRun,
  hasSavedRun,
} from "./runSave";
export { ACHIEVEMENTS, ACHIEVEMENT_MAP, checkAchievements } from "./achievements";
export { CHANGELOG_ENTRIES, latestEntry, changelogVersions } from "./changelog";
