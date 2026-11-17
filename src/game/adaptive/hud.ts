/**
 * The in-game HUD, planned from the board instead of from offsets.
 *
 * THE PROBLEM
 * -----------
 * `drawHud()` was a fixed vertical run of `pad + N * s`:
 *
 *     score    pad + 34·s     best      pad + 54·s     cracks   pad + 78·s
 *     stamina  pad + 68·s     level     pad + 20·s     jars     pad + 38·s
 *     fill     pad + 46·s     jar/time  pad + 70·s     combo    pad + 96·s
 *     ×mult    pad + 128·s    chips     pad + (combo ? 146 : 96)·s + i·24·s
 *
 * Every one of those is a *constant offset times one scale*. Nothing asked
 * whether the stack was taller than the board, whether the three anchored
 * columns were wider than it, or whether the last chip had landed on top of the
 * touch stick.
 *
 * Two failures are geometrical, and both exist today:
 *
 *   · **vertical** — a 420×360 board reserves 58px for the virtual stick, and a
 *     four-chip run reaches 178px, which is fine; but the same run on a 320×320
 *     board reaches the strip's top edge exactly, and one more chip overlaps it;
 *   · **horizontal** — the score is left-anchored and the level column is
 *     centred. On a 240px-wide board the score's bounding box and the centred
 *     `CẤP n` label want the same twenty pixels, and both are drawn.
 *
 * `planHud()` answers three questions in one place:
 *
 *   1. **Does it fit?** The lowest painted edge must stay above `safeBottom`.
 *      When it does not, rows are dropped in a fixed order (chips → combo bar →
 *      jars → best) and then the whole HUD is compressed.
 *   2. **Do the rows collide?** Nine *bands* — the score number, the best line,
 *      the stamina bar, the crack row, the level, the jars line, the fill meter,
 *      the clock, the combo stack, the chips — are compared pairwise. Bands, not
 *      bounding boxes: a column's bounding box overlaps everything beside it,
 *      which is how a check reports a defect that is not there.
 *   3. **What is the scale?** `hudScale` from the playfield is the *ceiling*.
 *      Compression lowers it, never raises it, so a big board keeps the size it
 *      already had.
 *
 * The numbers are the engine's own expressions, **moved** — at 1280×720 every
 * offset here equals what `drawHud()` computed inline, and
 * `tests/hud-plan.test.ts` pins that against the old formulas before testing
 * anything new.
 */

import type { PlayfieldPlan } from "./playfield";
import { MAX_CRACKS } from "../modeMath";

/** A rectangle in canvas pixels, top-left origin. */
export interface HudZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One painted run of the HUD, named for the collision report. */
export interface HudBand {
  /** `score` · `best` · `stamina` · `cracks` · `level` · `jars` · `fill` · `clock` · `combo` · `chips`. */
  name: string;
  zone: HudZone;
}

/** What the HUD may draw, and where. */
export interface HudPlan {
  /** Inner margin from the canvas edge, px. */
  pad: number;
  /** The multiplier every size below is expressed in. */
  scale: number;
  /** True when compression lowered `scale` below the playfield's `hudScale`. */
  compressed: boolean;

  /** Baseline of the score number. */
  scoreY: number;
  /** Score number size, px. */
  scoreSize: number;
  /** Baseline of the best line — painted only when `showBest`. */
  bestY: number;
  /** Top of the stamina bar. */
  staminaY: number;
  /** Baseline of the chéo label beside the bar. */
  cheoY: number;
  /** Baseline of the level line. */
  levelY: number;
  /** Baseline of the jars/catches line — painted only when `showJars`. */
  jarsY: number;
  /** Top of the fill meter. */
  fillY: number;
  /** Baseline of the jar label or the countdown. */
  clockY: number;
  /** Baseline of the combo number. */
  comboY: number;
  /** Top of the combo decay bar — painted only when `showComboBar`. */
  comboBarY: number;
  /** Baseline of the `×n` multiplier. */
  multY: number;
  /** Top of the first power chip. */
  chipsY: number;
  /** Vertical distance between two chips. */
  chipStep: number;
  /** Width of a power chip. */
  chipWidth: number;
  /** Top of the crack row. */
  cracksY: number;
  /** Width of one crack shell. */
  crackSize: number;
  /**
   * How many shells the mode can actually fill — `MODES[id].maxCracks ?? 3`.
   *
   * It is a *plan* field, not an engine constant, because the row's width is
   * part of the layout: «GỐM MỎNG» has one shell, so its crack band is a third
   * of the width and it must not be laid out as if it had three.
   */
  crackSlots: number;
  /** Width of the stamina bar. */
  staminaWidth: number;
  /** Width of the fill meter. */
  fillWidth: number;

  /** The best line fits. */
  showBest: boolean;
  /** The jars/catches line fits. */
  showJars: boolean;
  /** The combo block is on screen at all. */
  comboShown: boolean;
  /** The combo decay bar fits. */
  showComboBar: boolean;
  /** How many chips fit — the caller may draw fewer than it has. */
  chipSlots: number;

  /** Every painted band, in draw order. */
  bands: HudBand[];
  /** The four anchored blocks, for the debug overlay. */
  zones: { score: HudZone; cracks: HudZone; centre: HudZone; chips: HudZone };
  /** Pairs of band names that overlap — empty on every board that can be played. */
  collisions: string[];
  /** Lowest painted edge, px from the top of the canvas. */
  bottom: number;
  /** True when `bottom` is above the strip reserved for the touch stick. */
  withinSafeBottom: boolean;
}

/** The rows that can be dropped, cheapest first. */
export const HUD_DROP_ORDER = ["chips", "comboBar", "jars", "best"] as const;

/** A row the plan may remove. */
export type HudRow = (typeof HUD_DROP_ORDER)[number];

/** Hard floor on compression, so a pathological board still draws something. */
export const HUD_MIN_SCALE = 0.55;

/** Requested optional content — what the caller *has*, not what will fit. */
export interface HudInput {
  /** The combo block is showing. */
  combo?: boolean;
  /**
   * Unscaled size of the combo number, px: `clamp(18 + combo * 0.7, 18, 34)`.
   *
   * The engine grows this number with the combo count, and the centre column has
   * to make room for the size it will actually paint — a fixed `96·s` baseline
   * for a 34px glyph reaches up into the jar/time line at combo ≥ 20, which is a
   * collision the bands catch and the old offsets could not.
   */
  comboSize?: number;
  /** How many power chips the caller wants to draw. */
  chips?: number;
  /** The crack row is showing (it always is during play). */
  cracks?: boolean;
  /**
   * The mode's crack budget. `undefined` means the default `MAX_CRACKS`.
   *
   * The HUD used to hardcode three shells for every mode, which is wrong for
   * exactly one of the nine — «GỐM MỎNG», where one hazard ends the run. Three
   * lit shells told the player they had three lives.
   */
  maxCracks?: number;
}

/** Overlap test for two rectangles, with a 1px tolerance for touching edges. */
export function zonesOverlap(a: HudZone, b: HudZone): boolean {
  return a.x + a.w > b.x + 1 && b.x + b.w > a.x + 1 && a.y + a.h > b.y + 1 && b.y + b.h > a.y + 1;
}

/**
 * A rough text width.
 *
 * The HUD is painted on a canvas, so there is no layout engine to ask. 0.58em per
 * character is the average for the two face stacks the HUD uses, measured against
 * the strings it actually prints. It feeds *collision* estimates only, never
 * painting, so being a few px off costs nothing.
 */
function textWidth(text: string, size: number): number {
  return Math.round(text.length * size * 0.58);
}

/** Longest strings the fixed-width bands can print, so a zone never depends on state. */
const PROBE = {
  score: "999 999",
  best: "KỶ LỤC 99 999",
  level: "CẤP 999",
  jars: "HŨ 99 · BẮT 999",
  clock: "CÒN 60s",
  mult: "×999",
  combo: "COMBO 999",
} as const;

/** Everything the caller wants, with defaults. */
function wanted(input: HudInput): {
  combo: boolean;
  comboSize: number;
  chips: number;
  cracks: boolean;
  crackSlots: number;
} {
  const chips = Number.isFinite(input.chips) ? Math.max(0, Math.trunc(input.chips as number)) : 0;
  const comboSize = Number.isFinite(input.comboSize) ? (input.comboSize as number) : 18;
  /*
   * 1..MAX_CRACKS, defaulting on anything that is not a finite number. A slot
   * count of 0 would draw an empty band where the player's lives should be.
   */
  const raw = Number.isFinite(input.maxCracks) ? Math.trunc(input.maxCracks as number) : MAX_CRACKS;
  const crackSlots = Math.max(1, Math.min(MAX_CRACKS, raw));
  return { combo: Boolean(input.combo), comboSize, chips, cracks: input.cracks !== false, crackSlots };
}

/** The rows still visible at one point in the drop sequence. */
interface Rows {
  best: boolean;
  jars: boolean;
  comboBar: boolean;
  chips: number;
}

/** One layout attempt, at one scale and one set of visible rows. */
interface Attempt {
  pad: number;
  scale: number;
  scoreSize: number;
  scoreY: number;
  bestY: number;
  staminaY: number;
  cheoY: number;
  levelY: number;
  jarsY: number;
  fillY: number;
  clockY: number;
  comboY: number;
  comboBarY: number;
  multY: number;
  chipsY: number;
  chipStep: number;
  chipWidth: number;
  cracksY: number;
  crackSize: number;
  crackSlots: number;
  staminaWidth: number;
  fillWidth: number;
  showBest: boolean;
  showJars: boolean;
  showComboBar: boolean;
  chipSlots: number;
  bands: HudBand[];
  zones: HudPlan["zones"];
  collisions: string[];
  bottom: number;
}

/** Build one attempt. Pure arithmetic; no state, no canvas. */
function attempt(pf: PlayfieldPlan, scale: number, rows: Rows, want: ReturnType<typeof wanted>): Attempt {
  const s = Math.min(pf.hudScale, Math.max(HUD_MIN_SCALE, scale));
  const pad = Math.round(Math.min(26, Math.max(14, pf.width * 0.022)));
  const scoreSize = Math.round(36 * s);
  const fillWidth = Math.max(120, Math.min(240, pf.width * 0.24));
  const chipWidth = Math.max(126, 142 * s);
  const staminaWidth = 118 * s;

  const scoreY = pad + 34 * s;
  const bestY = pad + 54 * s;
  const staminaY = pad + 68 * s;
  const cheoY = staminaY + 11;
  const levelY = pad + 20 * s;
  const jarsY = pad + 38 * s;
  const fillY = pad + 46 * s;
  const clockY = pad + 70 * s;
  /*
   * The centre column **flows** from here down instead of jumping to fixed
   * offsets. Two numbers decide the rest: the clock line's own size (13·s, or the
   * jar label's 10·s) and the combo number's, which the engine scales with the
   * combo count. `chips` therefore sit under whatever is actually above them
   * rather than at `pad + 146·s` regardless.
   */
  const clockSize = 13 * s;
  const comboSize = Math.max(18, Math.min(34, Number.isFinite(want.comboSize) ? want.comboSize : 18)) * s;
  let flow = clockY + clockSize * 0.28 + 4 * s;
  let comboY = flow + comboSize * 0.72;
  /* Below the glyph box, not below the baseline: a descender is still a glyph. */
  let comboBarY = comboY + comboSize * 0.28 + 3 * s;
  let multY = comboBarY + 5 + 4 * s + 16 * s * 0.72;
  if (!want.combo) {
    comboY = 0;
    comboBarY = 0;
    multY = 0;
  } else {
    flow = multY + 16 * s * 0.28 + 5 * s;
  }
  const chipsY = flow + 20 * s;
  const chipStep = 24 * s;
  const cracksY = pad + 78 * s;
  const crackSize = 16 * s;

  const cx = pf.width / 2;
  const bands: HudBand[] = [];

  /* ---- left column ---- */
  bands.push({
    name: "score",
    zone: { x: pad, y: pad - 2, w: textWidth(PROBE.score, scoreSize), h: 36 * s + 6 },
  });
  if (rows.best) {
    bands.push({
      name: "best",
      zone: { x: pad, y: bestY - 13 * s, w: textWidth(PROBE.best, 13 * s), h: 16 * s },
    });
  }
  bands.push({
    name: "stamina",
    zone: { x: pad, y: staminaY - 7 * s, w: 18 + staminaWidth + 6 + textWidth("CHÉO", 14 * s), h: 18 * s },
  });

  /* ---- right column ---- */
  if (want.cracks) {
    const w = want.crackSlots * crackSize + 8 * (want.crackSlots - 1);
    bands.push({
      name: "cracks",
      zone: { x: pf.width - pad - w, y: cracksY - crackSize, w, h: crackSize * 2 },
    });
  }

  /* ---- centre column ---- */
  /*
   * A text band is the glyph box, not a padded one: `baseline − 0.72·size` is the
   * cap/accent top the faces actually reach, and `0.97·size` covers it plus the
   * descenders. The first version padded by 1.25× and reported a fill/clock
   * collision on every board — a check that cries wolf gets deleted, so the
   * geometry has to be the real one.
   */
  const centred = (name: string, baseline: number, size: number, w: number): HudBand => ({
    name,
    zone: { x: cx - w / 2, y: baseline - size * 0.72, w, h: size * 0.97 },
  });
  bands.push(centred("level", levelY, 15 * s, textWidth(PROBE.level, 15 * s)));
  if (rows.jars) bands.push(centred("jars", jarsY, 12 * s, textWidth(PROBE.jars, 12 * s)));
  bands.push({ name: "fill", zone: { x: cx - fillWidth / 2, y: fillY, w: fillWidth, h: 10 } });
  bands.push(centred("clock", clockY, clockSize, textWidth(PROBE.clock, clockSize)));
  if (want.combo) {
    bands.push(centred("combo", comboY, comboSize, textWidth(PROBE.combo, comboSize)));
    if (rows.comboBar) bands.push({ name: "combo-bar", zone: { x: cx - 46 * s, y: comboBarY, w: 92 * s, h: 5 } });
    bands.push(centred("mult", multY, 16 * s, textWidth(PROBE.mult, 16 * s)));
  }
  if (rows.chips > 0) {
    bands.push({
      name: "chips",
      zone: { x: cx - chipWidth / 2, y: chipsY - 14 * s, w: chipWidth, h: rows.chips * chipStep },
    });
  }

  const collisions: string[] = [];
  for (let i = 0; i < bands.length; i++) {
    for (let j = i + 1; j < bands.length; j++) {
      if (zonesOverlap(bands[i].zone, bands[j].zone)) collisions.push(`${bands[i].name}/${bands[j].name}`);
    }
  }

  const bottom = Math.max(...bands.map((b) => b.zone.y + b.zone.h));
  const byName = (name: string) => bands.find((b) => b.name === name)?.zone;
  const empty: HudZone = { x: 0, y: 0, w: 0, h: 0 };

  return {
    pad,
    scale: s,
    scoreSize,
    scoreY,
    bestY,
    staminaY,
    cheoY,
    levelY,
    jarsY,
    fillY,
    clockY,
    comboY,
    comboBarY,
    multY,
    chipsY,
    chipStep,
    chipWidth,
    cracksY,
    crackSize,
    crackSlots: want.crackSlots,
    staminaWidth,
    fillWidth,
    showBest: rows.best,
    showJars: rows.jars,
    showComboBar: rows.comboBar,
    chipSlots: rows.chips,
    bands,
    zones: {
      score: byName("score") ?? empty,
      cracks: byName("cracks") ?? empty,
      centre: byName("level") ?? empty,
      chips: byName("chips") ?? empty,
    },
    collisions,
    bottom,
  };
}

/** The drop sequence: start with everything, lose one row at a time. */
function rowStates(want: ReturnType<typeof wanted>): Rows[] {
  const all: Rows = { best: true, jars: true, comboBar: true, chips: want.chips };
  const states: Rows[] = [all];
  let current = all;
  for (const row of HUD_DROP_ORDER) {
    if (row === "chips") current = { ...current, chips: 0 };
    else if (row === "comboBar") current = { ...current, comboBar: false };
    else if (row === "jars") current = { ...current, jars: false };
    else current = { ...current, best: false };
    states.push(current);
  }
  return states;
}

/**
 * Plan the HUD for a board.
 *
 * The search is ordered and deterministic — no optimisation, no randomness:
 *
 *   1. full layout at `hudScale`;
 *   2. if it does not fit or two bands collide, drop rows in `HUD_DROP_ORDER`;
 *   3. if it still does not, compress the scale in 0.02 steps down to
 *      `HUD_MIN_SCALE`;
 *   4. whatever is left is returned with `withinSafeBottom` and `collisions`
 *      telling the truth.
 *
 * Step 3 is last on purpose: a smaller HUD is legible, a HUD with fewer numbers
 * is incomplete, and a HUD whose labels overlap is unreadable.
 */
function search(pf: PlayfieldPlan, want: ReturnType<typeof wanted>) {
  const limit = pf.height - pf.safeBottom;
  const trace: HudAttemptTrace[] = [];
  const fits = (a: Attempt) => a.bottom <= limit && a.collisions.length === 0;
  const record = (a: Attempt, stage: string) => {
    trace.push({
      stage,
      scale: Math.round(a.scale * 1000) / 1000,
      rows: describeRows(a),
      bottom: Math.round(a.bottom),
      limit,
      fits: fits(a),
      collisions: a.collisions,
    });
    return a;
  };

  let chosen: Attempt | null = null;
  for (const rows of rowStates(want)) {
    /* The combo bar can only exist when the combo block does. */
    const state = want.combo ? rows : { ...rows, comboBar: false };
    const a = record(attempt(pf, pf.hudScale, state, want), "drop");
    if (fits(a)) {
      chosen = a;
      break;
    }
  }

  if (!chosen) {
    /*
     * Nothing fits at the ceiling. Compress downward and, at each scale, walk the
     * drop sequence again — the largest HUD that fits is the answer, and if even
     * the floor does not fit, keep the floor and report it rather than inventing
     * a size below the legibility floor.
     */
    let best: Attempt | null = null;
    for (let s = pf.hudScale - 0.02; s >= HUD_MIN_SCALE; s -= 0.02) {
      for (const rows of rowStates(want)) {
        const state = want.combo ? rows : { ...rows, comboBar: false };
        const a = record(attempt(pf, s, state, want), "compress");
        if (fits(a)) {
          best = a;
          break;
        }
      }
      if (best) break;
    }
    chosen =
      best ??
      record(
        attempt(pf, HUD_MIN_SCALE, { best: false, jars: false, comboBar: false, chips: 0 }, want),
        "floor",
      );
  }

  return { chosen, trace, limit };
}

/** How the visible rows read in a trace line. */
function describeRows(a: Attempt): string {
  return ["best", "jars", "combo-bar"].filter((row) => {
    if (row === "best") return a.showBest;
    if (row === "jars") return a.showJars;
    return a.showComboBar;
  }).concat(a.chipSlots ? [`${a.chipSlots} chips`] : []).join("+") || "core only";
}

/** One step of the HUD search — what was tried, and whether it fit. */
export interface HudAttemptTrace {
  /** `drop` · `compress` · `floor`. */
  stage: string;
  scale: number;
  rows: string;
  bottom: number;
  limit: number;
  fits: boolean;
  collisions: string[];
}

/**
 * Every step the search took, in order.
 *
 * Exists because "why did my power chips disappear" is a question with an exact
 * answer — the first attempt whose `fits` is true — and because a search this
 * ordered is worth being able to read instead of infer.
 */
export function traceHud(pf: PlayfieldPlan, input: HudInput = {}): HudAttemptTrace[] {
  return search(pf, wanted(input)).trace;
}

/** The plan for a board. */
export function planHud(pf: PlayfieldPlan, input: HudInput = {}): HudPlan {
  const want = wanted(input);
  const { chosen, limit } = search(pf, want);
  return {
    pad: chosen.pad,
    scale: chosen.scale,
    compressed: chosen.scale < pf.hudScale - 1e-9,
    scoreY: chosen.scoreY,
    scoreSize: chosen.scoreSize,
    bestY: chosen.bestY,
    staminaY: chosen.staminaY,
    cheoY: chosen.cheoY,
    levelY: chosen.levelY,
    jarsY: chosen.jarsY,
    fillY: chosen.fillY,
    clockY: chosen.clockY,
    comboY: chosen.comboY,
    comboBarY: chosen.comboBarY,
    multY: chosen.multY,
    chipsY: chosen.chipsY,
    chipStep: chosen.chipStep,
    chipWidth: chosen.chipWidth,
    cracksY: chosen.cracksY,
    crackSize: chosen.crackSize,
    crackSlots: chosen.crackSlots,
    staminaWidth: chosen.staminaWidth,
    fillWidth: chosen.fillWidth,
    showBest: chosen.showBest,
    showJars: chosen.showJars,
    comboShown: want.combo,
    showComboBar: chosen.showComboBar,
    chipSlots: chosen.chipSlots,
    bands: chosen.bands,
    zones: chosen.zones,
    collisions: chosen.collisions,
    bottom: chosen.bottom,
    withinSafeBottom: chosen.bottom <= limit,
  };
}

/** One line for the debug overlay, the game-over screen and the tests. */
export function describeHud(plan: HudPlan): string {
  const dropped = [
    plan.showBest ? null : "best",
    plan.showJars ? null : "jars",
    /* Only a combo that exists can lose its bar. */
    plan.comboShown && !plan.showComboBar ? "combo-bar" : null,
    plan.chipSlots === 0 ? "chips" : null,
  ].filter(Boolean);
  return [
    `hud ×${plan.scale}`,
    `bottom ${Math.round(plan.bottom)}px`,
    dropped.length ? `dropped ${dropped.join("+")}` : "full",
    plan.collisions.length ? `collides ${plan.collisions.join(",")}` : "no overlap",
  ].join(" · ");
}
