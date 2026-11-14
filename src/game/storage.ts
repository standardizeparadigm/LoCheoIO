/**
 * Persistence for the top-8 board, lifetime progress and achievements.
 *
 * This file is now a **re-export**; the implementation moved to
 * `src/game/storage/` in v1.1.8, one module per record kind:
 *
 *     storage/guard.ts         num() · saneDate() — the two field guards
 *     storage/scores.ts        the board: normalise, load, persist, rank
 *     storage/progress.ts      lifetime counters
 *     storage/achievements.ts  unlocked ids (merge, never replace)
 *     storage/index.ts         barrel + clearAllProgress()
 *
 * WHY THE FILE STAYS
 * ------------------
 * Forty-odd modules import from `../game/storage`, and a re-export keeps every
 * one of them working, keeps `git blame` useful on the moved code, and lets the
 * split land in one commit instead of one per call site. It also means the two
 * entry points are interchangeable: `from "../game/storage"` and
 * `from "../game/storage/"` resolve to the same set of exports.
 *
 * `saneDate` is exported here because it was exported (as a private helper) in
 * the original file's `normalizeScores` documentation; `guard.ts` makes it a
 * real export so the behaviour can be tested directly.
 */
export {
  type Progress,
  type ScoreEntry,
  EMPTY_PROGRESS,
  bestScore,
  clearAllProgress,
  loadAchievements,
  loadProgress,
  loadScores,
  normalizeProgress,
  normalizeScores,
  num,
  persistScores,
  qualifies,
  rankOf,
  recordRun,
  saneDate,
  saveProgress,
  submitScore,
  unlockAchievements,
} from "./storage/index";
