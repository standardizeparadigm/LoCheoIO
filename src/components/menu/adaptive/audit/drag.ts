/**
 * The adaptive system, audited along a *path* instead of at points.
 *
 * WHY THE 578-WINDOW AUDIT IS NOT ENOUGH
 * -------------------------------------
 * `audit/audit.ts` resolves 578 windows and checks the contract on each. That is
 * the right audit for the layout *planner*, and it is blind to the layout
 * *sequence*: every one of those windows is legal, and a drag that crosses them
 * can still rebuild the screen forty times. The complaint the two-pixel band
 * answers — "the menu re-lays-out on every mouse move" — cannot appear in a
 * per-window table at all, because a table has no yesterday.
 *
 * So this file replays drags. For each of the 21 presets it walks the width from
 * `w - span` to `w + span` in 1px steps at the preset's height, resolves the
 * profile at each step ("raw"), chains those steps through `stabilize()` the way
 * `useAdaptive()` does ("painted"), and counts how many times the visible rung
 * changed in each chain. The difference between those two numbers is the entire
 * value of the band, measured over 5 061 windows instead of asserted over one.
 *
 * WHY A PRESET IS THE RIGHT AXIS
 * ------------------------------
 * A drag is a real gesture on a real window, so it starts from a window someone
 * actually uses — the same 21 the probe, the docs and the corpus agree on. The
 * sweep is symmetric so the path crosses the preset's own boundaries in both
 * directions, which is where a stabiliser that latches (holds and never releases)
 * would show up as a path that ends on the wrong rung.
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * It does not render and it does not run React: `stabilize()` is a pure function,
 * so a path is a fold over it. The thing being audited is the *decision*, not the
 * frame — a component that ignored the returned profile would still pass here,
 * and `tests/adaptive-hysteresis.test.ts` plus the smoke render cover that half.
 */
import { resolveAdaptive, type AdaptiveProfile } from "../resolve";
import { boxOf } from "../viewport";
import { violations } from "../constraints";
import { HYSTERESIS_MARGIN, rungKeyOf, stabilize } from "../hysteresis";
import { PRESETS, type ViewportPreset } from "../presets";
import type { Environment } from "../environment";

/** How far either side of a preset's width a drag is replayed, in px. */
export const DRAG_SPAN = 120;

/** The narrowest window the app plans for; a drag never goes below it. */
const FLOOR = 320;

/** One rung, as a string — the unit a "change" is counted in. */
export function rungText(profile: AdaptiveProfile): string {
  const k = rungKeyOf(profile);
  return `${k.tier}·${k.density}·${k.hero}·${k.fit}`;
}

/** What one replayed drag found. */
export interface DragPath {
  /** The preset the drag started from, e.g. `iphone-4`. */
  label: string;
  /** Fixed height of the drag. */
  height: number;
  /** First and last width walked, inclusive. */
  from: number;
  to: number;
  /** Widths visited — `to - from + 1`. */
  steps: number;
  /** Rung changes with no memory: one per step that lands on a new step. */
  changesRaw: number;
  /** Rung changes as painted — through `stabilize()`. */
  changesHeld: number;
  /** Steps where the previous profile was painted instead of the fresh one. */
  heldFrames: number;
  /** Largest distance between the painted profile's window and the real one. */
  worstLag: number;
  /** Contract violations found on any *painted* profile. Must be 0. */
  violations: number;
  /** The rung the last step painted — the anti-latch check. */
  endsOn: string;
  /** The rung the last width resolves to on its own. */
  expects: string;
  /** The rung the *first* step painted. */
  startsOn: string;
  /**
   * The longest run of frames that painted the previous profile.
   *
   * This is the liveness bound: the band releases as soon as the window is more
   * than `margin` px past the edge, so no run may be longer than `margin + 1`. A
   * longer one is a hold that outlived its reason — the failure mode a stabiliser
   * that latches has.
   */
  longestHold: number;
  /** Rung boundaries found inside the swept range. */
  boundaries: number;
  /** Rung changes across all the dither paths at those boundaries. */
  ditherRaw: number;
  /** The same, painted. This is where the band earns its keep. */
  ditherHeld: number;
}

/** The whole sweep. */
export interface DragReport {
  paths: DragPath[];
  /** Total windows visited across every path. */
  steps: number;
  changesRaw: number;
  changesHeld: number;
  heldFrames: number;
  worstLag: number;
  violations: number;
  /** `changesHeld / changesRaw`, 0 when nothing ever changed. */
  ratio: number;
  /** The path with the most raw changes — where the band earned the most. */
  worst: DragPath | null;
  /**
   * Paths where a hold outlived the band: a run of held frames longer than
   * `margin + 1`. Empty on every release so far, and the assertion that would
   * catch a stabiliser that latches.
   */
  stalled: string[];
  /** Jitter, aggregated: raw and painted changes across every boundary. */
  ditherRaw: number;
  ditherHeld: number;
  /** Rung boundaries found in the swept ranges, summed over paths. */
  boundaries: number;
}

/** Replay one drag. Pure; the whole report is a fold over this. */
export function dragPath(
  preset: ViewportPreset,
  span: number = DRAG_SPAN,
  env?: Environment,
): DragPath {
  const from = Math.max(FLOOR, preset.width - span);
  const to = Math.max(from, preset.width + span);
  const height = preset.height;

  let rawPrev: string | null = null;
  let paintedPrev: AdaptiveProfile | null = null;
  let paintedText = "";
  let startsOn = "";
  let changesRaw = 0;
  let changesHeld = 0;
  let heldFrames = 0;
  let longestHold = 0;
  let run = 0;
  let worstLag = 0;
  let breaks = 0;
  /* Boundaries inside the swept range, for the jitter replay below. */
  const boundaries: number[] = [];
  let previousRaw: string | null = null;

  for (let width = from; width <= to; width += 1) {
    const fresh = resolveAdaptive({ box: boxOf(width, height), env });
    const raw = rungText(fresh);
    if (rawPrev !== null && raw !== rawPrev) changesRaw += 1;
    rawPrev = raw;
    if (previousRaw !== null && raw !== previousRaw) boundaries.push(width - 1);
    previousRaw = raw;

    const painted = stabilize(paintedPrev, fresh);
    const text = rungText(painted);
    if (paintedPrev && text !== paintedText) changesHeld += 1;
    if (!paintedPrev) startsOn = text;
    if (painted !== fresh) {
      heldFrames += 1;
      run += 1;
      longestHold = Math.max(longestHold, run);
      worstLag = Math.max(worstLag, Math.abs(painted.box.width - width));
    } else {
      run = 0;
    }
    /* The hold must never paint something the contract rejects. */
    breaks += violations(painted).length;

    paintedPrev = painted;
    paintedText = text;
  }

  /*
   * A monotone drag crosses each boundary once, and a step function also changes
   * the rung exactly once — so on a *sweep* the band saves almost nothing, and
   * that is the honest result. The symptom that produced the band is the other
   * gesture: a pointer that settles near a boundary and shakes by a pixel while
   * the trackpad drifts. Replay that at every boundary found above.
   *
   *      b-1, b, b+1, b, b-1, b, b+1, b
   *
   * Eight frames, six rung changes without memory, zero with it.
   */
  const dither = ditherAt(boundaries, height, env);

  const last = resolveAdaptive({ box: boxOf(to, height), env });
  return {
    label: preset.id,
    height,
    from,
    to,
    steps: to - from + 1,
    changesRaw,
    changesHeld,
    heldFrames,
    worstLag,
    violations: breaks,
    endsOn: paintedText,
    expects: rungText(last),
    startsOn,
    longestHold,
    boundaries: boundaries.length,
    ditherRaw: dither.raw,
    ditherHeld: dither.held,
  };
}

/**
 * Replay a shaking pointer at each boundary: raw changes vs painted changes.
 *
 * A helper rather than a loop inside `dragPath` because it is the only place in
 * this file that is not a fold over widths — the pattern is deliberately not
 * monotone, and a reader should see that in one place.
 */
function ditherAt(boundaries: number[], height: number, env?: Environment): { raw: number; held: number } {
  const pattern = [-1, 0, 1, 0];
  let raw = 0;
  let held = 0;
  for (const b of boundaries) {
    let rawPrev: string | null = null;
    let paintedPrev: AdaptiveProfile | null = null;
    let paintedText = "";
    for (let pass = 0; pass < 2; pass += 1) {
      for (const offset of pattern) {
        const width = Math.max(FLOOR, b + offset);
        const fresh = resolveAdaptive({ box: boxOf(width, height), env });
        const text = rungText(fresh);
        if (rawPrev !== null && text !== rawPrev) raw += 1;
        rawPrev = text;

        const painted = stabilize(paintedPrev, fresh);
        const ptext = rungText(painted);
        if (paintedPrev && ptext !== paintedText) held += 1;
        paintedPrev = painted;
        paintedText = ptext;
      }
    }
  }
  return { raw, held };
}

/** Replay a drag for every preset. */
export function dragAudit(options: { span?: number; env?: Environment; presets?: readonly ViewportPreset[] } = {}): DragReport {
  const { span = DRAG_SPAN, env, presets = PRESETS } = options;
  const paths = presets.map((p) => dragPath(p, span, env));
  const sum = (pick: (p: DragPath) => number) => paths.reduce((n, p) => n + pick(p), 0);

  const changesRaw = sum((p) => p.changesRaw);
  const changesHeld = sum((p) => p.changesHeld);
  const worst = paths.reduce<DragPath | null>(
    (best, p) => (best === null || p.changesRaw > best.changesRaw ? p : best),
    null,
  );
  return {
    paths,
    steps: sum((p) => p.steps),
    changesRaw,
    changesHeld,
    heldFrames: sum((p) => p.heldFrames),
    worstLag: paths.reduce((n, p) => Math.max(n, p.worstLag), 0),
    violations: sum((p) => p.violations),
    ratio: changesRaw === 0 ? 0 : changesHeld / changesRaw,
    worst,
    stalled: paths.filter((p) => p.longestHold > HYSTERESIS_MARGIN + 1).map((p) => p.label),
    ditherRaw: sum((p) => p.ditherRaw),
    ditherHeld: sum((p) => p.ditherHeld),
    boundaries: sum((p) => p.boundaries),
  };
}

/**
 * The headline numbers, one line — used by the script's summary.
 *
 * A percentage rather than a ratio because the interesting claim ("the band
 * removes four changes in five") is a claim about *how much*, and `0.21` does not
 * read as "five times".
 */
export function describeDrag(r: DragReport): string {
  const saved = r.changesRaw - r.changesHeld;
  const pct = r.changesRaw === 0 ? 0 : Math.round((saved / r.changesRaw) * 100);
  return (
    `${r.paths.length} drags · ${r.steps} windows · ` +
    `rung changes ${r.changesRaw} → ${r.changesHeld} (−${pct}%) · ` +
    `held ${r.heldFrames} frames, worst lag ${r.worstLag}px · ` +
    `${r.violations} violations · ${r.stalled.length} stalled`
  );
}
