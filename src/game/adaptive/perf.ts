/**
 * The frame-time governor — the game adjusting itself to the machine it runs on.
 *
 * THE GAP
 * -------
 * `settings.visualQuality` is a *switch the player owns*: `"low"` halves the
 * particle budget and skips the glow passes. That is right — a player who chose
 * low quality on a fast desktop should keep it — and it is also the only
 * performance decision the engine ever made. A 2015 laptop and a gaming phone
 * both ran at whatever `"high"` means, and the laptop's only feedback was a
 * game that stuttered.
 *
 * The menu's adaptive layer has been answering "how much room is there" for six
 * rounds (`planMenuLayout`, `planHud`, the hero ladder). This module is the same
 * idea for the other resource a browser game competes for: **frame time**.
 *
 * WHAT IT IS, AND WHAT IT IS NOT
 * ------------------------------
 * It is a *ceiling reducer*, never a floor raiser. It can drop quality from
 * `high` to `low` when the machine cannot hold the frame budget, and it can hand
 * it back when it can — but it can never go above `settings.visualQuality`. The
 * player's choice is a ceiling; the governor is the machine's vote inside it.
 *
 * It is *hysteretic* in both directions, because the failure mode of a naive
 * governor is the worst one: quality flapping between two settings, which makes
 * the particle count flicker and the frame time worse. Down is fast (two bad
 * samples in a row — a stutter is obvious and the player is already suffering),
 * up is slow (six good samples — one good second is a loading screen or a
 * paused tab).
 *
 * Pure, so it can be tested without a browser: `nextQuality()` takes the state
 * and one frame delta and returns the next state. `FrameWatch` is the only state
 * that lives across frames, and it holds two counters.
 */

/** Quality levels the engine understands — the same union `settings` stores. */
export type Quality = "low" | "high";

/** The thresholds, in one object so a test can quote them instead of guessing. */
export const PERF = {
  /**
   * A frame slower than this (~45 fps) counts as "busy".
   *
   * 22ms and not 16.7ms: every browser drops an occasional frame during a GC or
   * a tab switch, and a governor that reacts to one hiccup is a governor that
   * turns the glow off while the player is reading the menu.
   */
  busyMs: 22,
  /** A frame faster than this (~70 fps) counts as "smooth" and can earn quality back. */
  smoothMs: 14,
  /** Consecutive busy frames before the quality drops. */
  dropAfter: 2,
  /** Consecutive smooth frames before it is handed back. */
  raiseAfter: 6,
  /**
   * A single frame longer than this is a *stall*, not a slow frame: it is the
   * tab coming back, the GC, or the first frame after a resize. It is dropped
   * from the decision entirely rather than counted as busy — otherwise every
   * window switch drops the quality permanently for the rest of the run.
   */
  stallMs: 250,
} as const;

/** The governor's memory: two counters and the level it currently suggests. */
export interface PerfState {
  /** What the governor thinks the machine can hold. */
  quality: Quality;
  /** Consecutive samples over `busyMs`. */
  busy: number;
  /** Consecutive samples under `smoothMs`. */
  smooth: number;
}

/** The state a run starts in — full quality, no history. */
export const INITIAL_PERF: PerfState = { quality: "high", busy: 0, smooth: 0 };

/** Sanitise a frame delta, in milliseconds. */
function sane(ms: number): number {
  return typeof ms === "number" && Number.isFinite(ms) && ms > 0 ? ms : 0;
}

/**
 * One frame, one decision.
 *
 * `ceiling` is `settings.visualQuality`. A `low` ceiling returns `low` forever
 * and costs two comparisons — there is nothing to decide, and the governor must
 * not "helpfully" raise it back.
 */
export function nextQuality(state: PerfState, frameMs: number, ceiling: Quality = "high"): PerfState {
  if (ceiling === "low") {
    return state.quality === "low" && state.busy === 0 && state.smooth === 0
      ? state
      : { quality: "low", busy: 0, smooth: 0 };
  }

  const ms = sane(frameMs);
  if (ms === 0 || ms >= PERF.stallMs) return state; // a stall is not a sample

  if (ms > PERF.busyMs) {
    const busy = state.busy + 1;
    if (busy >= PERF.dropAfter && state.quality === "high") {
      return { quality: "low", busy: 0, smooth: 0 };
    }
    return { quality: state.quality, busy, smooth: 0 };
  }

  if (ms < PERF.smoothMs) {
    const smooth = state.smooth + 1;
    if (smooth >= PERF.raiseAfter && state.quality === "low") {
      return { quality: "high", busy: 0, smooth: 0 };
    }
    return { quality: state.quality, busy: 0, smooth };
  }

  /* Between the two thresholds — the dead band. Keep the history, drop nothing. */
  return { quality: state.quality, busy: 0, smooth: 0 };
}

/** Median of a sample list — the statistic the diagnostics use, not the decision. */
export function median(samples: readonly number[]): number {
  const clean = samples.filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b);
  if (clean.length === 0) return 0;
  const mid = clean.length >> 1;
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

/**
 * The governor with a memory, for the engine's frame loop.
 *
 * `sample(ms)` is called once per rendered frame. `quality` is what the engine
 * should use *this* frame — reading a field rather than recomputing keeps the
 * hot path to one comparison.
 */
export class FrameWatch {
  private state: PerfState = INITIAL_PERF;
  private ceiling: Quality = "high";
  private samples: number[] = [];
  private drops = 0;
  private raises = 0;

  /** `settings.visualQuality` — the ceiling the governor may not exceed. */
  setCeiling(q: Quality): void {
    this.ceiling = q;
    this.state = nextQuality(this.state, Number.NaN, q);
  }

  /** One frame delta, in ms. Returns the quality to paint this frame. */
  sample(ms: number): Quality {
    const before = this.state.quality;
    this.state = nextQuality(this.state, ms, this.ceiling);
    if (this.state.quality !== before) {
      if (this.state.quality === "low") this.drops++;
      else this.raises++;
    }
    /*
     * The sample window is for the diagnostics only — 60 frames ≈ one second at
     * 60 fps. It is capped so a tab left open for an hour does not grow an
     * array: the engine already samples every frame, and an unbounded list here
     * would be the only allocation in the loop.
     */
    if (Number.isFinite(ms) && ms > 0 && ms < PERF.stallMs) {
      this.samples.push(ms);
      if (this.samples.length > 60) this.samples.shift();
    }
    return this.state.quality;
  }

  /** What the engine should paint with right now. */
  get quality(): Quality {
    return this.ceiling === "low" ? "low" : this.state.quality;
  }

  /** Median frame time over the last second, ms — for `describePerf()` and tests. */
  get medianMs(): number {
    return median(this.samples);
  }

  /** How many times the governor has moved, in each direction — the numbers a bug report needs. */
  get movements(): { drops: number; raises: number } {
    return { drops: this.drops, raises: this.raises };
  }

  /** Forget everything — a new run starts as if the machine were fast. */
  reset(): void {
    this.state = INITIAL_PERF;
    this.samples = [];
  }
}

/** One line for the debug strip: what it chose, and why. */
export function describePerf(watch: FrameWatch): string {
  const { drops, raises } = watch.movements;
  return `perf ${watch.quality} · median ${watch.medianMs.toFixed(1)}ms · ${drops}↓ ${raises}↑`;
}
