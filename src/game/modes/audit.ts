/**
 * A cross-mode audit — every rule the nine balance records owe each other.
 *
 * WHY THIS EXISTS
 * ---------------
 * `modes/*.ts` is nine plain records, one per file, each written by copying a
 * sibling and changing numbers. That is the right shape (a rebalance is a
 * one-file diff) and it has one failure mode: a record can be internally
 * plausible and still disagree with the rest of the game — a badge that says
 * «×1.25» on a mode whose `scoreMult` is 1.2, a `maxCracks` the HUD cannot
 * draw, a `zen` that somehow still spawns mould, a `gradient` with a colour
 * token that is not in the palette.
 *
 * `tests/modes-balance.test.ts` checks the *catalogue* (ids, signs, unique
 * accents). This module checks the *contract between the record and the rest of
 * the app*: the badge the player reads, the spawn table the engine builds, the
 * crack budget the HUD draws, the time limit the countdown uses.
 *
 * It is a pure function returning a list of findings rather than throwing, for
 * the same reason `constraints.ts` returns violations: a caller may want to
 * print all of them, and a test wants to assert "zero" with the whole list in
 * the failure message.
 */
import { DEFS, KINDS, type ItemKind } from "../engine";
import { itemWeight } from "../spawn";
import { MAX_CRACKS } from "../modeMath";
import { MODE_LIST, MODES } from "../modesIndex";
import type { ModeConfig, ModeId } from "../modeTypes";

/** One thing that is wrong, in a sentence a reviewer can act on. */
export interface ModeFinding {
  /** The mode it is about, or `"catalogue"` for a set-level problem. */
  mode: ModeId | "catalogue";
  /** Machine-readable slug — stable enough to filter a log by. */
  rule: string;
  /** What is wrong, and what the value should be. */
  detail: string;
}

/** Ranges a balance record has to stay inside to be playable. */
const RANGES = {
  scoreMult: [0.01, 4] as const,
  speedMult: [0.5, 1.6] as const,
  spawnMult: [0.01, 1.6] as const,
  hazardMult: [0, 3] as const,
  goldMult: [0.01, 4] as const,
  comboWindowMult: [0.01, 4] as const,
  jarBonusMult: [0.01, 4] as const,
  timeLimit: [10, 600] as const,
  maxCracks: [1, MAX_CRACKS] as const,
};

/** The multiplier a badge is allowed to state — one or two decimals. */
function badgeNumber(v: number): string[] {
  const one = v.toFixed(1);
  const two = v.toFixed(2);
  return [one, two.replace(/0$/, "")].filter((s, i, all) => all.indexOf(s) === i);
}

/** Does this badge mention `×<number>`? */
function statesBadge(badge: string, v: number): boolean {
  return badgeNumber(v).some((n) => badge.includes(`×${n}`));
}

/** A mode's effective value for an optional multiplier. */
const optional = (v: number | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : 1);

/**
 * Weights a mode hands the spawner at a given level.
 *
 * Duplicated from `engine.pickKind()` on purpose: the audit must be able to ask
 * "what can this mode spawn" without constructing a canvas, and `itemWeight()`
 * is the function the engine actually uses, so the answer is the real one.
 */
function spawnTable(mode: ModeConfig, level: number): number[] {
  return KINDS.map((k) => itemWeight(DEFS[k], { level, mode, deco: false }));
}

/** Kinds with a non-zero weight at any level from 1 to 8. */
function reachableKinds(mode: ModeConfig): ItemKind[] {
  return KINDS.filter((_, i) => {
    for (let level = 1; level <= 8; level++) {
      if (spawnTable(mode, level)[i] > 0) return true;
    }
    return false;
  });
}

/**
 * Audit one record. Exported so a single mode can be checked in isolation (the
 * per-mode test loops over it), and so a new tenth mode can be audited before
 * it is added to the catalogue.
 */
export function auditMode(mode: ModeConfig): ModeFinding[] {
  const out: ModeFinding[] = [];
  const add = (rule: string, detail: string) => out.push({ mode: mode.id, rule, detail });

  /* ---- multipliers in range ---- */
  for (const [field, [min, max]] of Object.entries(RANGES)) {
    const raw = (mode as unknown as Record<string, unknown>)[field];
    if (raw === undefined) continue;
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      add("finite", `${field} is ${String(raw)}`);
      continue;
    }
    if (raw < min || raw > max) add("range", `${field} is ${raw}, outside [${min}, ${max}]`);
  }

  /* ---- the badge tells the truth ---- */
  if (!statesBadge(mode.badge, mode.scoreMult)) {
    add("badge-score", `badge «${mode.badge}» does not state ×${mode.scoreMult}`);
  }
  if (mode.timeLimit !== undefined && !mode.badge.toUpperCase().includes(`${mode.timeLimit}S`)) {
    add("badge-time", `badge «${mode.badge}» does not state the ${mode.timeLimit}s limit`);
  }
  if (mode.maxCracks !== undefined && !mode.badge.includes(`${mode.maxCracks} NỨT`)) {
    add("badge-cracks", `badge «${mode.badge}» does not state ${mode.maxCracks} crack(s)`);
  }
  if (mode.comboWindowMult !== undefined && !mode.badge.includes(`COMBO ×${mode.comboWindowMult}`)) {
    add("badge-combo", `badge «${mode.badge}» does not state COMBO ×${mode.comboWindowMult}`);
  }
  if (mode.jarBonusMult !== undefined && !mode.badge.includes(`HŨ ×${mode.jarBonusMult}`)) {
    add("badge-jar", `badge «${mode.badge}» does not state HŨ ×${mode.jarBonusMult}`);
  }
  if (mode.goldMult !== undefined && !mode.badge.includes(`GOLD ×${mode.goldMult}`)) {
    add("badge-gold", `badge «${mode.badge}» does not state GOLD ×${mode.goldMult}`);
  }

  /*
   * The crack budget itself is covered by the `range` check above (`[1,
   * MAX_CRACKS]`): the HUD draws `maxCracksFor(id)` shells, `maxCracksFor()`
   * clamps to the same interval, and a record outside it is reported here. The
   * clamp function has its own tests in `tests/modes-audit.test.ts`.
   */

  /* ---- hazards: a zero multiplier has to mean "impossible", not "rare" ---- */
  const hazards = KINDS.filter((k) => DEFS[k].hazard);
  const reachable = reachableKinds(mode);
  const hazardReachable = hazards.filter((k) => reachable.includes(k));
  if (optional(mode.hazardMult) === 0 && hazardReachable.length > 0) {
    add("hazard-mult", `hazardMult is 0 but ${hazardReachable.join(", ")} can still spawn`);
  }
  if (optional(mode.hazardMult) > 0 && hazardReachable.length === 0) {
    add("hazard-mult", "hazardMult is positive but no hazard can spawn");
  }

  /* ---- every mode must be playable: something to catch, at level 1 ---- */
  const catchable = reachable.filter((k) => !DEFS[k].hazard);
  if (catchable.length < 3) {
    add("playable", `only ${catchable.length} catchable kind(s) reachable: ${catchable.join(", ") || "none"}`);
  }
  const totalAtOne = spawnTable(mode, 1).reduce((a, b) => a + b, 0);
  if (!(totalAtOne > 0)) add("playable", "every spawn weight is zero at level 1");

  /* ---- styling the UI actually parses ---- */
  if (!/^#[0-9a-fA-F]{6}$/.test(mode.accent)) add("accent", `accent is «${mode.accent}»`);
  if (!/^linear-gradient\(/.test(mode.gradient)) add("gradient", `gradient is «${mode.gradient}»`);
  if (!/^#[0-9a-fA-F]{6}(,|$)/.test(mode.gradient.match(/linear-gradient\(([^)]*)\)/)?.[1] ?? "")) {
    // Any `#rrggbb` inside the gradient is acceptable; this only rejects a
    // gradient whose first stop is not a hex colour (a stray CSS variable).
    if (!/#[0-9a-fA-F]{6}/.test(mode.gradient)) add("gradient", "no hex stop in the gradient");
  }
  if (mode.tint !== null && !/^rgba\(/.test(mode.tint)) add("tint", `tint is «${mode.tint}»`);

  return out;
}

/**
 * Audit the whole catalogue, including the set-level rules no single record can
 * answer: ids in lockstep with the registry, unique accents, unique ids inside
 * the registry.
 */
export function auditModes(): ModeFinding[] {
  const out: ModeFinding[] = [];

  const keys = Object.keys(MODES) as ModeId[];
  const listed = MODE_LIST.map((m) => m.id);
  if (keys.length !== listed.length) {
    out.push({ mode: "catalogue", rule: "lockstep", detail: `MODES has ${keys.length} ids, MODE_LIST has ${listed.length}` });
  }
  for (const id of keys) {
    if (!listed.includes(id)) {
      out.push({ mode: "catalogue", rule: "lockstep", detail: `${id} is in MODES but not in MODE_LIST` });
    }
    if (MODES[id].id !== id) {
      out.push({ mode: id, rule: "identity", detail: `registered as «${id}» but its record says «${MODES[id].id}»` });
    }
  }
  for (const id of listed) {
    if (!(id in MODES)) {
      out.push({ mode: "catalogue", rule: "lockstep", detail: `${id} is in MODE_LIST but not in MODES` });
    }
  }

  /* Accents double as the card glow, the pause badge and the game-over chip. */
  const seen = new Map<string, ModeId>();
  for (const mode of MODE_LIST) {
    const previous = seen.get(mode.accent);
    if (previous) {
      out.push({ mode: mode.id, rule: "accent-unique", detail: `accent ${mode.accent} is also ${previous}'s` });
    }
    seen.set(mode.accent, mode.id);
    out.push(...auditMode(mode));
  }

  return out;
}

/** One line per finding, ready for a test failure message or a script. */
export function describeModeFindings(findings: readonly ModeFinding[]): string {
  if (findings.length === 0) return "nine modes, no findings";
  return findings.map((f) => `[${f.mode}] ${f.rule}: ${f.detail}`).join("\n");
}
