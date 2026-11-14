/**
 * The top-8 board: normalise, load, persist, submit, rank.
 *
 * Split out of `storage.ts` because the board has its own invariants (a fixed
 * size, a sort order, a seed that is a *copy* on every read) that have nothing
 * to do with progress counters or achievement ids, and the three were sharing
 * one module only because they shared one storage layer.
 */
import { STORAGE_KEYS, readJSON, writeJSON } from "../safeStorage";
import { num, saneDate } from "./guard";

/** The board holds eight rows; GAME's leaderboard modal renders eight. */
const SIZE = 8;

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  level: number;
  jars: number;
  combo: number;
  date: number;
}

/**
 * The board a first-time player sees, so the leaderboard is not an empty box.
 *
 * `date` is computed once at module load. That is deliberate and it is also the
 * one thing about this seed that can surprise: the rows are always "two days
 * ago" relative to when the *bundle* loaded, not to when the page was opened.
 * For a placeholder it is fine; it is not a clock.
 */
const SEED: ScoreEntry[] = [
  { id: "s1", name: "BÀ TƯ", score: 6420, level: 9, jars: 5, combo: 24, date: Date.now() - 86400000 * 2 },
  { id: "s2", name: "CÔ HẠNH", score: 5180, level: 8, jars: 4, combo: 19, date: Date.now() - 86400000 * 4 },
  { id: "s3", name: "CHÚ BA", score: 4310, level: 7, jars: 3, combo: 17, date: Date.now() - 86400000 * 5 },
  { id: "s4", name: "MỤ NỘI", score: 3260, level: 6, jars: 3, combo: 14, date: Date.now() - 86400000 * 7 },
  { id: "s5", name: "THẰNG TÍ", score: 2410, level: 5, jars: 2, combo: 12, date: Date.now() - 86400000 * 9 },
  { id: "s6", name: "CHỊ HÀ", score: 1580, level: 4, jars: 1, combo: 9, date: Date.now() - 86400000 * 11 },
];

/** Deep-enough clone so callers can't mutate the module-level SEED rows. */
function seedCopy(): ScoreEntry[] {
  return SEED.map((e) => ({ ...e }));
}

/**
 * Normalise an untrusted value into a clean, sorted top-8 list.
 * Silently drops malformed entries instead of rejecting the whole board.
 *
 * "Silently drops" is the design, not an oversight: one corrupt row from an
 * older build must not cost the player the other seven. A row without a
 * finite score or without a non-blank name is not a score.
 */
export function normalizeScores(v: unknown): ScoreEntry[] {
  if (!Array.isArray(v)) return [];
  const clean: ScoreEntry[] = [];
  for (const raw of v) {
    if (typeof raw !== "object" || raw === null) continue;
    const e = raw as Record<string, unknown>;
    if (typeof e.score !== "number" || !Number.isFinite(e.score)) continue;
    if (typeof e.name !== "string" || e.name.trim().length === 0) continue;
    clean.push({
      id: typeof e.id === "string" && e.id ? e.id : `imp-${Math.random().toString(36).slice(2, 8)}`,
      name: e.name.trim().slice(0, 16),
      score: Math.max(0, Math.round(e.score)),
      level: Math.max(1, Math.round(num(e.level, 1))),
      jars: Math.max(0, Math.round(num(e.jars, 0))),
      combo: Math.max(0, Math.round(num(e.combo, 0))),
      date: saneDate(e.date),
    });
  }
  return clean.sort((a, b) => b.score - a.score).slice(0, SIZE);
}

/** The stored board, or the seed when there is nothing stored. */
export function loadScores(): ScoreEntry[] {
  const stored = readJSON(STORAGE_KEYS.scores);
  if (stored === null) return seedCopy();
  const normalized = normalizeScores(stored);
  return normalized.length > 0 ? normalized : seedCopy();
}

/** Write a normalised board; returns what was written, not what was passed. */
export function persistScores(list: ScoreEntry[]): ScoreEntry[] {
  const next = normalizeScores(list);
  // writeJSON swallows quota/private-mode failures — the board stays in memory
  writeJSON(STORAGE_KEYS.scores, next);
  return next;
}

/** Append a run to the board and return the new list plus the row's id. */
export function submitScore(entry: Omit<ScoreEntry, "id">): { list: ScoreEntry[]; id: string } {
  const id = `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const withId: ScoreEntry = { ...entry, id };
  return { list: persistScores([...loadScores(), withId]), id };
}

/** The top score, or 0 for an empty board. */
export function bestScore(list: ScoreEntry[]): number {
  return list.length ? list[0].score : 0;
}

/**
 * Would this score make the board?
 *
 * `score > 0` first: a zero run is not a score, and without the guard a zero
 * would qualify on an empty board and then sit there, below the seed.
 */
export function qualifies(score: number, list: ScoreEntry[]): boolean {
  return score > 0 && (list.length < SIZE || score > list[list.length - 1].score);
}

/** 1-based position this score would take, counting rows strictly above it. */
export function rankOf(score: number, list: ScoreEntry[]): number {
  let rank = 1;
  for (const e of list) if (e.score > score) rank++;
  return rank;
}
