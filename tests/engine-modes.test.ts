/**
 * The nine modes, driven through the real engine.
 *
 * Everything before this file tested the modes as *data* (balance records,
 * the math module) or the engine as a source text (resize guards). Neither
 * can answer "does ĐUA 60 GIÂY actually end at 60 seconds" or "does GỐM MỎNG
 * really shatter on the first hit". This file boots `LoCheoGame` headlessly
 * (`tests/helpers/engine-harness.ts`) and plays the game.
 *
 * What is asserted here is the *wiring*: mode → engine → outcome. The balance
 * numbers themselves stay pinned by modes-balance.test.ts.
 */
import { describe, expect, it } from "vitest";

import { DEFS, KINDS } from "../src/game/engine";
import { MODE_LIST, type ModeId } from "../src/game/modes";
import { bootEngine, stepFrames, type BootedEngine } from "./helpers/engine-harness";

/** A hazard placed on top of the jar — the collision must see it. */
function hazardOnPlayer(booted: BootedEngine, kind: "moc" | "ruoi" | "sau") {
  const g = booted.internals;
  const def = DEFS[kind];
  g.items.push({
    kind,
    def,
    x: g.px,
    y: g.py,
    vx: 0,
    vy: 40,
    r: def.r + 3,
    rot: 0,
    spin: 0,
    sway: 0,
    swayF: 0,
    mag: 0,
    born: 0,
    dead: false,
    deco: false,
  });
}

/** A good item (cà pháo, 10 pts) placed on top of the jar. */
function goodOnPlayer(booted: BootedEngine) {
  const g = booted.internals;
  const def = DEFS.ca;
  g.items.push({
    kind: "ca",
    def,
    x: g.px,
    y: g.py,
    vx: 0,
    vy: 40,
    r: def.r + 3,
    rot: 0,
    spin: 0,
    sway: 0,
    swayF: 0,
    mag: 0,
    born: 0,
    dead: false,
    deco: false,
  });
}

describe("every mode boots and plays a few seconds", () => {
  for (const mode of MODE_LIST) {
    it(`${mode.id}: start() + 240 frames — no crash, finite state`, async () => {
      const booted = await bootEngine();
      const g = booted.game;
      g.setMode(mode.id as ModeId);
      g.start();
      expect(g.phase).toBe("playing");
      stepFrames(booted, 240);
      expect(Number.isFinite(g.stats.score)).toBe(true);
      expect(Number.isFinite(g.stats.time)).toBe(true);
      expect(g.stats.time).toBeGreaterThan(2);
      g.destroy();
    }, 30_000);
  }
});

describe("ĐUA 60 GIÂY (blitz)", () => {
  it("ends the run exactly at 60 seconds, not before, not after", async () => {
    const booted = await bootEngine();
    const g = booted.game;
    g.setMode("blitz");
    g.start();
    booted.internals.stats.time = 59.95;
    stepFrames(booted, 2);
    expect(g.phase).toBe("gameover");
    expect(g.stats.time).toBe(60);
    g.destroy();
  }, 30_000);

  it("does NOT end early at 30 seconds", async () => {
    const booted = await bootEngine();
    const g = booted.game;
    g.setMode("blitz");
    g.start();
    booted.internals.stats.time = 30;
    stepFrames(booted, 30); // ~0.5 simulated second
    expect(g.phase).toBe("playing");
    g.destroy();
  }, 30_000);
});

describe("GỐM MỎNG (hardcore) — one crack is death", () => {
  it("a single hazard hit cracks the jar and ends the run", async () => {
    const booted = await bootEngine();
    const g = booted.game;
    g.setMode("hardcore");
    g.start();
    stepFrames(booted, 60); // let the 0.8s spawn grace decay
    booted.internals.invuln = 0;
    hazardOnPlayer(booted, "moc");
    stepFrames(booted, 2);
    expect(booted.internals.cracks).toBe(1);
    expect(g.phase).toBe("gameover");
    g.destroy();
  }, 30_000);
});

describe("MUỐI DƯA CỔ ĐIỂN (classic) — three cracks", () => {
  it("the same hit leaves one crack and the run continues", async () => {
    const booted = await bootEngine();
    const g = booted.game;
    g.setMode("classic");
    g.start();
    stepFrames(booted, 60);
    booted.internals.invuln = 0;
    hazardOnPlayer(booted, "moc");
    stepFrames(booted, 2);
    expect(booted.internals.cracks).toBe(1);
    expect(g.phase).toBe("playing");
    g.destroy();
  }, 30_000);
});

describe("THẢNH THƠI (zen) — hazards never reach the board", () => {
  it("pickKind never returns a hazard at any level, across 1 500 rolls", async () => {
    const booted = await bootEngine();
    const g = booted.game;
    g.setMode("zen");
    g.start();
    const hazards = new Set(["moc", "ruoi", "sau"]);
    for (const level of [1, 3, 6, 9]) {
      booted.internals.stats.level = level;
      for (let i = 0; i < 375; i += 1) {
        expect(hazards.has(booted.internals.pickKind(false))).toBe(false);
      }
    }
    g.destroy();
  }, 30_000);
});

describe("score multiplier is wired per mode", () => {
  const cases: Array<[ModeId, number]> = [
    ["classic", 10], // 10 × ×1.0
    ["inferno", 15], // 10 × ×1.5
    ["feast", 6], // 10 × ×0.6
    ["zen", 5], // 10 × ×0.5
    ["hardcore", 20], // 10 × ×2.0
  ];
  for (const [mode, expected] of cases) {
    it(`${mode}: one cà pháo is worth ${expected}`, async () => {
      const booted = await bootEngine();
      const g = booted.game;
      g.setMode(mode);
      g.start();
      stepFrames(booted, 60);
      booted.internals.invuln = 0;
      goodOnPlayer(booted);
      stepFrames(booted, 2);
      expect(g.stats.score).toBe(expected);
      g.destroy();
    }, 30_000);
  }
});

describe("mode ids are sanitised at both doors", () => {
  it("setMode with garbage falls back to classic instead of poisoning the run", async () => {
    const booted = await bootEngine();
    const g = booted.game;
    g.setMode("__proto__" as ModeId);
    expect(booted.internals.mode).toBe("classic");
    g.setMode("nonsense-mode" as ModeId);
    expect(booted.internals.mode).toBe("classic");
    g.start();
    stepFrames(booted, 30);
    expect(Number.isFinite(g.stats.score)).toBe(true);
    g.destroy();
  }, 30_000);

  it("restoreRun with a garbage mode saves lives, not crashes", async () => {
    const booted = await bootEngine();
    const g = booted.game;
    const { normalizeSavedRun } = await import("../src/game/runSave");
    const saved = normalizeSavedRun({
      version: 1,
      savedAt: Date.now(),
      mode: "constructor", // a save is data, not a type
      stats: { score: 120, catches: 12, bestCombo: 4, level: 2, jars: 0, sliced: 1, time: 42 },
      fill: 0.3,
      cracks: 1,
      stamina: 0.7,
      frenzy: 0,
      slow: 0,
      shield: 0,
      slamCd: 0,
      combo: 3,
      comboT: 1.5,
      px: 400,
      py: 430,
    });
    expect(saved, "runSave rejects the garbage-mode save outright").toBeNull();
    g.destroy();
  }, 30_000);
});

describe("the spawn table knows every kind in every mode", () => {
  it("weightedPick returns a known kind for each mode at three levels", async () => {
    const booted = await bootEngine();
    const valid = new Set(KINDS);
    for (const mode of MODE_LIST) {
      booted.game.setMode(mode.id as ModeId);
      booted.game.start();
      for (const level of [1, 4, 8]) {
        booted.internals.stats.level = level;
        for (let i = 0; i < 60; i += 1) {
          expect(valid.has(booted.internals.pickKind(false))).toBe(true);
        }
      }
      booted.game.destroy();
    }
  }, 60_000);
});
