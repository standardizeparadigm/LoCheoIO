import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_PROGRESS,
  bestScore,
  clearAllProgress,
  loadAchievements,
  loadProgress,
  loadScores,
  persistScores,
  saveProgress,
  normalizeScores,
  qualifies,
  rankOf,
  recordRun,
  submitScore,
  unlockAchievements,
  type ScoreEntry,
} from "../src/game/storage";

function memStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeScores", () => {
  it("drops malformed entries and keeps valid ones sorted", () => {
    const out = normalizeScores([
      { id: "a", name: "BÀ TƯ", score: 100, level: 2, jars: 1, combo: 5, date: 1 },
      { id: "b", name: "CHÚ BA", score: 300, level: 4, jars: 2, combo: 9, date: 2 },
      { name: "NO SCORE" },
      "garbage",
      null,
      { id: "c", name: "MỤ NỘI", score: 200, level: 3, jars: 1, combo: 7, date: 3 },
    ]);
    expect(out.map((e) => e.score)).toEqual([300, 200, 100]);
  });

  it("coerces missing stats to safe defaults", () => {
    const out = normalizeScores([{ name: "BÀ TƯ", score: 42 }]);
    expect(out).toHaveLength(1);
    expect(out[0].level).toBe(1);
    expect(out[0].jars).toBe(0);
    expect(out[0].combo).toBe(0);
    expect(out[0].id).toBeTruthy();
  });

  it("slices to the top 8", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: `x${i}`,
      name: `P${i}`,
      score: i * 10,
      level: 1,
      jars: 0,
      combo: 0,
      date: i,
    }));
    const out = normalizeScores(many);
    expect(out).toHaveLength(8);
    expect(out[0].score).toBe(110);
  });

  it("returns [] for non-array input", () => {
    expect(normalizeScores(undefined)).toEqual([]);
    expect(normalizeScores("nope")).toEqual([]);
    expect(normalizeScores(42)).toEqual([]);
  });
});

describe("board helpers", () => {
  const list: ScoreEntry[] = normalizeScores([
    { id: "a", name: "A", score: 500, level: 1, jars: 0, combo: 0, date: 1 },
    { id: "b", name: "B", score: 300, level: 1, jars: 0, combo: 0, date: 2 },
    { id: "c", name: "C", score: 100, level: 1, jars: 0, combo: 0, date: 3 },
  ]);

  it("bestScore returns the leader", () => {
    expect(bestScore(list)).toBe(500);
    expect(bestScore([])).toBe(0);
  });

  it("rankOf places scores correctly", () => {
    expect(rankOf(600, list)).toBe(1);
    expect(rankOf(500, list)).toBe(1);
    expect(rankOf(400, list)).toBe(2);
    expect(rankOf(0, list)).toBe(4);
  });

  it("qualifies honours the top-8 cut", () => {
    expect(qualifies(1, list)).toBe(true); // board not full yet
    const full = Array.from({ length: 8 }, (_, i) => ({
      id: `f${i}`,
      name: `F${i}`,
      score: (8 - i) * 100,
      level: 1,
      jars: 0,
      combo: 0,
      date: i,
    }));
    expect(qualifies(50, full)).toBe(false);
    expect(qualifies(1000, full)).toBe(true);
    expect(qualifies(0, full)).toBe(false);
  });
});

describe("persistence round-trips (stubbed storage)", () => {
  it("loadScores seeds the board when storage is empty", () => {
    vi.stubGlobal("localStorage", memStorage());
    const list = loadScores();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].score).toBeGreaterThanOrEqual(list[list.length - 1].score);
  });

  it("submitScore persists and keeps the board sorted", () => {
    vi.stubGlobal("localStorage", memStorage());
    const { list, id } = submitScore({ name: "TESTER", score: 99999, level: 12, jars: 9, combo: 33, date: Date.now() });
    expect(list[0].id).toBe(id);
    expect(loadScores()[0].score).toBe(99999);
  });

  it("recordRun accumulates lifetime progress", () => {
    const mem = memStorage();
    vi.stubGlobal("localStorage", mem);
    expect(loadProgress()).toEqual(EMPTY_PROGRESS);
    recordRun({ jars: 2, sliced: 5, score: 1200 });
    const after = recordRun({ jars: 1, sliced: 3, score: 800 });
    expect(after.runs).toBe(2);
    expect(after.totalJars).toBe(3);
    expect(after.totalSliced).toBe(8);
    expect(after.bestScore).toBe(1200);
  });

  it("unlockAchievements merges without duplicates", () => {
    vi.stubGlobal("localStorage", memStorage());
    expect(loadAchievements()).toEqual([]);
    unlockAchievements(["first-catch"]);
    unlockAchievements(["first-catch", "combo-10"]);
    expect(loadAchievements().sort()).toEqual(["combo-10", "first-catch"]);
  });
});

describe("clearAllProgress", () => {
  it("removes the localStorage keys for scores, progress and achievements", () => {
    const mem = memStorage();
    vi.stubGlobal("localStorage", mem);
    persistScores([
      { id: "a", name: "AAA", score: 100, level: 1, jars: 1, combo: 3, date: 1 },
    ]);
    saveProgress({ bestScore: 10, totalJars: 5, totalSliced: 5, runs: 2 });
    unlockAchievements(["combo-40"]);
    clearAllProgress();
    // keys physically removed — empty board falls back to the built-in seed
    expect(localStorage.getItem("locheo.scores.v1")).toBeNull();
    expect(localStorage.getItem("locheo.progress.v1")).toBeNull();
    expect(localStorage.getItem("locheo.achievements.v1")).toBeNull();
    expect(loadProgress().runs).toBe(0);
    expect(loadAchievements()).toEqual([]);
  });

  it("leaves settings, language, mode and mute alone", () => {
    /*
     * The half of this contract that no test covered. "Xóa dữ liệu" sits in the
     * settings modal next to a volume slider; a player who clears their scores
     * must not also lose their volume preference, their language or whether the
     * game was muted.
     *
     * `clearAllGameKeys()` exists and removes all eight — it is the settings
     * *reset*, not the danger zone. Confusing the two would be silent: the
     * board would empty and the volume would go back to default, and the only
     * report would be "the game forgot my settings".
     */
    const mem = memStorage();
    vi.stubGlobal("localStorage", mem);
    mem.setItem("locheo.settings.v1", JSON.stringify({ sfx: false, musicVolume: 0.3 }));
    mem.setItem("locheo.lang.v1", JSON.stringify("ja"));
    mem.setItem("locheo.mode.v1", JSON.stringify("inferno"));
    mem.setItem("locheo.muted.v1", JSON.stringify("1"));
    const before = [
      "locheo.settings.v1",
      "locheo.lang.v1",
      "locheo.mode.v1",
      "locheo.muted.v1",
    ].map((k) => mem.getItem(k));

    clearAllProgress();

    const after = [
      "locheo.settings.v1",
      "locheo.lang.v1",
      "locheo.mode.v1",
      "locheo.muted.v1",
    ].map((k) => mem.getItem(k));
    expect(after).toEqual(before);
    /* Not vacuous: the four keys really are distinct from the three removed. */
    expect(before.every((v) => v !== null)).toBe(true);
  });
});
