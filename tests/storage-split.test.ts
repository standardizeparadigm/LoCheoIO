/**
 * `storage.ts` became `storage/` in v1.1.8, and a refactor that moves code is
 * only safe if two things hold:
 *
 *   1. the old entry point still exports everything it exported before;
 *   2. the two entry points (`../game/storage` and `../game/storage/`) agree.
 *
 * (2) is the one that is easy to get wrong. TypeScript will happily let the
 * re-export file drift — add a function to `storage/index.ts` and forget the
 * `export { … } from` list, and `import { it } from "../game/storage"` fails
 * while every test that imports from `../game/storage/` passes.
 *
 * So this test imports the same module twice, through both paths, and compares
 * their key sets and their function identity.
 */
import { describe, expect, it } from "vitest";

import * as viaBarrel from "../src/game/storage/index";
import * as viaShim from "../src/game/storage";
import { STORAGE_KEYS } from "../src/game/safeStorage";

describe("the storage split", () => {
  it("exposes the same exports through storage.ts and storage/index.ts", () => {
    const shim = Object.keys(viaShim).sort();
    const barrel = Object.keys(viaBarrel).sort();
    expect(shim).toEqual(barrel);
  });

  it("keeps every function from the original file reachable through the old path", () => {
    /*
     * The list is written out rather than derived: the point is to fail when a
     * function *disappears* from the public surface, and a derived list would
     * derive the absence too.
     */
    for (const name of [
      "normalizeScores", "loadScores", "persistScores", "submitScore",
      "bestScore", "qualifies", "rankOf",
      "loadProgress", "saveProgress", "recordRun",
      "loadAchievements", "unlockAchievements", "clearAllProgress",
    ]) {
      expect(viaShim, `${name} is no longer exported from storage.ts`).toHaveProperty(name);
      expect(typeof (viaShim as Record<string, unknown>)[name], name).toBe("function");
    }
  });

  it("re-exports the same function object, not a copy", () => {
    // A copy would be a second implementation waiting to diverge.
    expect(viaShim.normalizeScores).toBe(viaBarrel.normalizeScores);
    expect(viaShim.recordRun).toBe(viaBarrel.recordRun);
  });

  it("still exports the two types' runtime companions", () => {
    // `ScoreEntry` and `Progress` are types and vanish at runtime; the constants
    // that go with them do not, and losing one is a silent type-only failure.
    expect(viaShim.EMPTY_PROGRESS).toEqual({
      runs: 0, totalJars: 0, totalSliced: 0, bestScore: 0,
    });
    expect(viaShim.saneDate).toBe(viaBarrel.saneDate);
  });

  it("clearAllProgress removes exactly the three progress keys", () => {
    /*
     * Restore the global afterwards: this is the only test that touches real
     * localStorage, and leaving a stub behind would poison the files that run
     * after it in the same worker.
     */
    const store = new Map<string, string>();
    const had = "localStorage" in globalThis;
    const previous = (globalThis as { localStorage?: Storage }).localStorage;
    const fake = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    } as Storage;
    Object.defineProperty(globalThis, "localStorage", { value: fake, configurable: true });
    try {
      store.set(STORAGE_KEYS.scores, "[]");
      store.set(STORAGE_KEYS.progress, "{}");
      store.set(STORAGE_KEYS.achievements, "[]");
      store.set(STORAGE_KEYS.settings, "{}");
      store.set(STORAGE_KEYS.lang, "vi");

      viaShim.clearAllProgress();

      expect(store.has(STORAGE_KEYS.scores)).toBe(false);
      expect(store.has(STORAGE_KEYS.progress)).toBe(false);
      expect(store.has(STORAGE_KEYS.achievements)).toBe(false);
      // Settings and language are not progress.
      expect(store.has(STORAGE_KEYS.settings)).toBe(true);
      expect(store.has(STORAGE_KEYS.lang)).toBe(true);
    } finally {
      if (had) {
        Object.defineProperty(globalThis, "localStorage", { value: previous, configurable: true });
      } else {
        delete (globalThis as { localStorage?: Storage }).localStorage;
      }
    }
  });
});
