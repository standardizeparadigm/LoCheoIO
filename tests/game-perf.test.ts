/**
 * The frame governor — the game adjusting to the machine, inside the player's choice.
 *
 * The rules worth pinning, each of which is a way a naive governor annoys people:
 *
 *   1. one slow frame is not a slow machine (flapping);
 *   2. a stall — a tab switch, a GC pause, the frame after a resize — is not a
 *      sample at all, or every window switch would cost the rest of the run its
 *      glow;
 *   3. `settings.visualQuality: "low"` is a floor nobody may raise;
 *   4. coming back up is slower than going down, on purpose.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  FrameWatch,
  INITIAL_PERF,
  PERF,
  describePerf,
  median,
  nextQuality,
  type PerfState,
} from "../src/game/adaptive/perf";

/** Feed the pure function `n` samples of the same length. */
const run = (state: PerfState, ms: number, n: number, ceiling: "low" | "high" = "high"): PerfState => {
  let s = state;
  for (let i = 0; i < n; i++) s = nextQuality(s, ms, ceiling);
  return s;
};

describe("nextQuality — going down", () => {
  it("ignores a single slow frame", () => {
    // 40ms once, then nothing. A GC pause is not a reason to drop the glow.
    const after = nextQuality(INITIAL_PERF, 40);
    expect(after.quality).toBe("high");
    expect(after.busy).toBe(1);
  });

  it("drops after two slow frames in a row", () => {
    expect(run(INITIAL_PERF, 40, PERF.dropAfter).quality).toBe("low");
  });

  it("resets the streak when a good frame arrives in between", () => {
    let s = nextQuality(INITIAL_PERF, 40);
    s = nextQuality(s, 10); // fast frame — the streak breaks
    s = nextQuality(s, 40);
    expect(s.quality).toBe("high");
  });

  it("never drops below low", () => {
    expect(run(INITIAL_PERF, 999, 50).quality).toBe("high"); // 999ms is a stall
    expect(run(INITIAL_PERF, 30, 50).quality).toBe("low");
  });
});

describe("nextQuality — coming back up", () => {
  const low: PerfState = { quality: "low", busy: 0, smooth: 0 };

  it("is slower to recover than to drop", () => {
    // Asymmetry is the whole point: a fast recovery flaps.
    expect(PERF.raiseAfter).toBeGreaterThan(PERF.dropAfter);
    expect(run(low, 10, PERF.raiseAfter - 1).quality).toBe("low");
    expect(run(low, 10, PERF.raiseAfter).quality).toBe("high");
  });

  it("treats a mediocre frame as neither good nor bad", () => {
    // 18ms is inside the dead band: it neither earns quality back nor spends it.
    const mid = (PERF.busyMs + PERF.smoothMs) / 2;
    let s = nextQuality(low, 10);
    expect(s.smooth).toBe(1);
    s = nextQuality(s, mid);
    expect(s.smooth).toBe(0);
    expect(s.quality).toBe("low");
  });
});

describe("nextQuality — the player's ceiling", () => {
  it("cannot leave low while the player asked for low", () => {
    let s: PerfState = { quality: "high", busy: 0, smooth: 0 };
    for (let i = 0; i < 30; i++) s = nextQuality(s, 8, "low");
    expect(s.quality).toBe("low");
  });

  it("is idempotent on a machine that is already low", () => {
    const s = nextQuality(INITIAL_PERF, 40, "low");
    expect(nextQuality(s, 40, "low")).toBe(s); // same reference, no allocation
  });
});

describe("stalls", () => {
  it("treats a very long frame as no sample", () => {
    const s = nextQuality(INITIAL_PERF, PERF.stallMs + 1);
    expect(s).toBe(INITIAL_PERF);
  });

  it("treats a corrupt delta as no sample", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -1, 0]) {
      expect(nextQuality(INITIAL_PERF, bad), String(bad)).toBe(INITIAL_PERF);
    }
  });
});

describe("FrameWatch", () => {
  it("starts at high and drops under sustained load", () => {
    const w = new FrameWatch();
    expect(w.quality).toBe("high");
    for (let i = 0; i < 5; i++) w.sample(33);
    expect(w.quality).toBe("low");
    expect(w.movements.drops).toBe(1);
  });

  it("hands quality back after a second of good frames", () => {
    const w = new FrameWatch();
    for (let i = 0; i < 5; i++) w.sample(33);
    for (let i = 0; i < PERF.raiseAfter; i++) w.sample(9);
    expect(w.quality).toBe("high");
    expect(w.movements.raises).toBe(1);
  });

  it("respects a low ceiling set after the fact", () => {
    const w = new FrameWatch();
    expect(w.quality).toBe("high");
    w.setCeiling("low");
    expect(w.quality).toBe("low");
    for (let i = 0; i < 20; i++) w.sample(8);
    expect(w.quality).toBe("low");
  });

  it("keeps a bounded sample window and a median", () => {
    const w = new FrameWatch();
    for (let i = 0; i < 500; i++) w.sample(16);
    expect(w.medianMs).toBe(16);
    // One wild sample must not move the median much — that is why it is a median.
    w.sample(200);
    expect(w.medianMs).toBe(16);
  });

  it("resets to a clean slate", () => {
    const w = new FrameWatch();
    for (let i = 0; i < 5; i++) w.sample(40);
    w.reset();
    expect(w.quality).toBe("high");
    expect(w.movements).toEqual({ drops: 1, raises: 0 }); // the counters are history, not state
    expect(w.medianMs).toBe(0);
  });

  it("prints one line", () => {
    const w = new FrameWatch();
    w.sample(16);
    expect(describePerf(w)).toMatch(/^perf (high|low) · median [\d.]+ms · \d+↓ \d+↑$/);
  });
});

describe("median", () => {
  it("ignores junk", () => {
    expect(median([Number.NaN, -5, 10, 20])).toBe(15);
    expect(median([])).toBe(0);
  });

  it("handles even and odd lengths", () => {
    expect(median([1, 2, 3])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("the engine uses it", () => {
  const engine = readFileSync(resolve(__dirname, "../src/game/engine.ts"), "utf8");

  it("samples the raw frame delta before the physics clamp", () => {
    // Feeding the clamped value would make a 300ms hitch look like a perfect
    // frame — the governor would never see the stutter it exists for.
    const at = engine.indexOf("this.perf.sample(");
    expect(at).toBeGreaterThan(-1);
    expect(engine.indexOf("raw = Math.min(raw, 1 / 20)")).toBeGreaterThan(at);
  });

  it("lets the setting lower the ceiling rather than set the value", () => {
    const at = engine.indexOf("setQuality(q: \"low\" | \"high\")");
    const body = engine.slice(at, engine.indexOf("}", at));
    expect(body).toContain("this.perf.setCeiling(q)");
  });
});
