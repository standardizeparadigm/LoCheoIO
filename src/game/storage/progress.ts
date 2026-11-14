/**
 * Lifetime counters: runs, jars, hazards sliced, best score.
 *
 * These are not the leaderboard. The board keeps eight rows and forgets the
 * ninth; progress keeps a total and never forgets. They share a storage layer
 * and nothing else, which is why they are separate modules.
 */
import { STORAGE_KEYS, readJSON, writeJSON } from "../safeStorage";
import { num } from "./guard";

export interface Progress {
  /** Total finished runs across sessions */
  runs: number;
  /** Cumulative jars filled across sessions */
  totalJars: number;
  /** Cumulative hazards sliced across sessions */
  totalSliced: number;
  /** Best lifetime score */
  bestScore: number;
}

/** A fresh player. Frozen-by-copy: every caller gets its own object. */
export const EMPTY_PROGRESS: Progress = { runs: 0, totalJars: 0, totalSliced: 0, bestScore: 0 };

/**
 * Coerce anything into a progress record.
 *
 * Every field is a counter, so every field floors at zero and rounds to an
 * integer: a fractional total is not a state the game can produce, and it reads
 * as a bug when it appears in the stats line.
 */
export function normalizeProgress(v: unknown): Progress {
  if (typeof v !== "object" || v === null) return { ...EMPTY_PROGRESS };
  const p = v as Record<string, unknown>;
  return {
    runs: Math.max(0, Math.round(num(p.runs, 0))),
    totalJars: Math.max(0, Math.round(num(p.totalJars, 0))),
    totalSliced: Math.max(0, Math.round(num(p.totalSliced, 0))),
    bestScore: Math.max(0, Math.round(num(p.bestScore, 0))),
  };
}

/** Stored progress, or zeroes when there is nothing stored. */
export function loadProgress(): Progress {
  const stored = readJSON(STORAGE_KEYS.progress);
  if (stored === null) return { ...EMPTY_PROGRESS };
  return normalizeProgress(stored);
}

/** Write progress; returns the normalised record, not the one passed in. */
export function saveProgress(p: Progress): Progress {
  const clean = normalizeProgress(p);
  writeJSON(STORAGE_KEYS.progress, clean);
  return clean;
}

/**
 * Fold a finished run into lifetime progress and persist it.
 *
 * `bestScore` is a running maximum, not a sum — every other field accumulates
 * and that one must not. `Math.round` before `Math.max` matters: a `Math.max`
 * of a valid total and a `NaN` score is `NaN`, and the next save would then
 * persist `NaN` over a good record.
 */
export function recordRun(stats: { jars: number; sliced: number; score: number }): Progress {
  const prev = loadProgress();
  return saveProgress({
    runs: prev.runs + 1,
    totalJars: prev.totalJars + Math.max(0, Math.round(num(stats.jars, 0))),
    totalSliced: prev.totalSliced + Math.max(0, Math.round(num(stats.sliced, 0))),
    bestScore: Math.max(prev.bestScore, Math.round(num(stats.score, 0))),
  });
}
