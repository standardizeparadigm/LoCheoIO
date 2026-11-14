/**
 * `src/game/storage/` — the three persisted record kinds, one module each.
 *
 * The barrel is also where the one operation that spans all three lives:
 * `clearAllProgress()` has to remove exactly three keys and no more, so it
 * cannot sit inside any one of the modules without importing the other two.
 */
export { num, saneDate } from "./guard";
export {
  type ScoreEntry,
  bestScore,
  loadScores,
  normalizeScores,
  persistScores,
  qualifies,
  rankOf,
  submitScore,
} from "./scores";
export {
  type Progress,
  EMPTY_PROGRESS,
  loadProgress,
  normalizeProgress,
  recordRun,
  saveProgress,
} from "./progress";
export { loadAchievements, unlockAchievements } from "./achievements";

import { STORAGE_KEYS, removeRaw } from "../safeStorage";

/**
 * Danger zone: wipe persisted scores/progress/achievements from this device.
 *
 * Deliberately three keys, not "every key": settings, language and the saved
 * run are not progress, and a player who clears their scores should not also
 * lose their volume preference. `clearAllGameKeys()` in `safeStorage` is the
 * heavier hammer, used by the settings reset.
 */
export function clearAllProgress(): void {
  removeRaw(STORAGE_KEYS.scores);
  removeRaw(STORAGE_KEYS.progress);
  removeRaw(STORAGE_KEYS.achievements);
}
