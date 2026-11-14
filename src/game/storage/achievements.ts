/**
 * Unlocked achievement ids — a set, persisted as an array.
 *
 * The one rule that matters: `unlockAchievements` *merges*, it does not replace.
 * A replace would clear every achievement earned in a previous session the
 * first time a new one is unlocked, and the player would see the counter go
 * down. `unlockAchievements` therefore reads before it writes.
 */
import { STORAGE_KEYS, readJSON, writeJSON } from "../safeStorage";

/** Every stored id that is a string; anything else in the array is dropped. */
export function loadAchievements(): string[] {
  const parsed = readJSON(STORAGE_KEYS.achievements);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((v): v is string => typeof v === "string");
}

/** Merge newly unlocked ids into the persisted list; returns the full list. */
export function unlockAchievements(ids: string[]): string[] {
  // `new Set` both dedupes and keeps insertion order, so the list reads as a
  // chronology rather than as whatever order the last merge happened to use.
  const merged = [...new Set([...loadAchievements(), ...ids])];
  writeJSON(STORAGE_KEYS.achievements, merged);
  return merged;
}
