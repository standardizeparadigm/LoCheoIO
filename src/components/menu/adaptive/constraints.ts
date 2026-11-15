/**
 * The adaptive contract, as data.
 *
 * WHY A LIST AND NOT A DOZEN ASSERTIONS
 * -------------------------------------
 * Every invariant this layout relies on already exists somewhere: as an
 * `expect()` in a test file, as an `if` in `check-adaptive.ts`, and as a sentence
 * in the design doc. Three copies, three chances to forget one — and the one that
 * gets forgotten is always the one that mattered.
 *
 * Here they are one array of `{ id, why, check }`:
 *
 *   - `tests/adaptive-constraints.test.ts` runs it over the corpus windows;
 *   - `scripts/check-adaptive.ts` runs it over the 21 presets and prints the ids;
 *   - `docs/design/adaptive-v2.md` names every id, and `tests/adaptive-docs
 *     .test.ts` fails if a constraint has no name in the doc.
 *
 * A `check` returns `null` when the invariant holds and a *message* when it does
 * not — so a failure is a sentence about the window, not "expected false to be
 * true".
 *
 * WHY THIS IS NOT PART OF `resolve.ts`
 * ------------------------------------
 * `resolveAdaptive()` must answer for every window, including the ones that break
 * a constraint (a 1×1 window is a real `visualViewport` report). The contract is
 * what the rest of the app is allowed to *assume*, and it is checked by tools, so
 * it lives beside the tools rather than inside the producer.
 */

import { CORNER_ROW_MARGIN, PANEL_FOOTER_HEIGHT } from "../layout/metrics";
import { usableHeight } from "../layout/fit";
import { heroContentHeight } from "./hero";
import { densityFor } from "./density";
import { LOCKUP_BOX_RATIO } from "../wordmark/scale";
import { ADAPTIVE_CSS_VARS, type AdaptiveProfile } from "./resolve";

/** One invariant. */
export interface Constraint {
  /** Stable kebab-case id — the same string the design doc must contain. */
  id: string;
  /** One line: what the app is allowed to assume, in the player's terms. */
  why: string;
  /** `null` when the profile satisfies it, else a message naming the numbers. */
  check: (profile: AdaptiveProfile) => string | null;
}

/** Round a number for a message without lying about it. */
function n(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/** Every numeric leaf of the profile, with its dotted path. */
function numbers(
  profile: unknown,
  prefix = "",
  out: Array<[string, number]> = [],
): Array<[string, number]> {
  for (const [key, value] of Object.entries(profile as Record<string, unknown>)) {
    if (key === "cssVars" || key === "metrics" || key === "box") continue;
    if (typeof value === "number") out.push([`${prefix}${key}`, value]);
    else if (value && typeof value === "object" && !Array.isArray(value)) numbers(value, `${prefix}${key}.`, out);
  }
  return out;
}

/** The list. Order is the order a reviewer reads the table in. */
export const CONSTRAINTS: readonly Constraint[] = [
  {
    id: "column-fills-window",
    why: "hero + chrome is exactly the usable height, so there is nothing to scroll.",
    check: (p) => {
      if (p.plan.fit === "crop") return null; // a cropped plan spends the floor, not the window
      const total = p.plan.scene + p.plan.reserve;
      const usable = usableHeight(p.box);
      return total === usable ? null : `scene ${p.plan.scene} + reserve ${p.plan.reserve} = ${total}, usable ${usable}`;
    },
  },
  {
    id: "panel-fits-reserve",
    why: "the GAME panel plus its margin never paints outside the band the plan bought.",
    check: (p) => {
      const painted = p.panelHeight + (p.plan.footer ? 0 : PANEL_FOOTER_HEIGHT);
      const band = p.panelHeight + CORNER_ROW_MARGIN;
      if (band > p.plan.reserve) return `panel ${p.panelHeight} + margin ${CORNER_ROW_MARGIN} > reserve ${p.plan.reserve}`;
      // `painted` is asserted for completeness: a footer-ful plan must not have
      // been shrunk by the footer-aware painter.
      if (p.plan.footer && painted !== p.panelHeight) return "footer-ful panel was shrunk";
      return null;
    },
  },
  {
    id: "hero-fits-scene",
    why: "the arrangement the hero chose needs no more band than the plan gave it.",
    check: (p) => {
      /* The real lockup box, not the 150px nominal one — see `heroContentHeight`. */
      const needs = heroContentHeight(p.hero, Math.round(p.type.lockupLo * LOCKUP_BOX_RATIO * 10) / 10);
      return needs <= p.plan.scene + 0.5 ? null : `hero needs ${n(needs)}px in a ${p.plan.scene}px scene`;
    },
  },
  {
    id: "lockup-fits-scene",
    why: "the wordmark's two-line box is never taller than the hero band.",
    check: (p) => {
      const box = p.type.lockupLo * LOCKUP_BOX_RATIO;
      return box <= p.plan.scene + 0.5 ? null : `lockup box ${n(box)}px in a ${p.plan.scene}px scene`;
    },
  },
  {
    id: "cheo-under-lo",
    why: "CHÉO is always the smaller line, at every window.",
    check: (p) => (p.type.lockupCheo < p.type.lockupLo ? null : `CHÉO ${p.type.lockupCheo} ≥ LỌ ${p.type.lockupLo}`),
  },
  {
    id: "type-legible",
    why: "no text is smaller than the 8px floor, whatever the window is.",
    check: (p) => {
      for (const [name, size] of Object.entries(p.type)) {
        if (typeof size === "number" && size < 8) return `${name} is ${size}px`;
      }
      return null;
    },
  },
  {
    id: "dialog-fits-window",
    why: "every dialog is inside the window it opens in.",
    check: (p) => {
      if (p.modal.maxWidth > p.box.width) return `dialog ${p.modal.maxWidth}px wider than ${p.box.width}px`;
      if (p.modal.maxHeight > p.box.height) return `dialog ${p.modal.maxHeight}px taller than ${p.box.height}px`;
      return null;
    },
  },
  {
    id: "jar-fits-board",
    why: "the player's hitbox is never wider than the board.",
    check: (p) => {
      const d = p.playfield.playerRadius * 2;
      const small = Math.min(p.playfield.width, p.playfield.height);
      return d <= small ? null : `jar ${d}px on a ${small}px board`;
    },
  },
  {
    id: "density-matches-flags",
    why: "the density table is the plan's three flags, not a fourth opinion.",
    check: (p) => {
      const derived = densityFor(p.plan);
      if (derived !== p.density) return `density ${p.density} but flags say ${derived}`;
      if (p.metrics.density !== p.density) return `metrics table is ${p.metrics.density}`;
      return null;
    },
  },
  {
    id: "css-vars-complete",
    why: "every adaptive variable the CSS reads is emitted, and nothing else is.",
    check: (p) => {
      const got = Object.keys(p.cssVars);
      const missing = ADAPTIVE_CSS_VARS.filter((v) => !got.includes(v));
      if (missing.length) return `missing ${missing.join(", ")}`;
      const extra = got.filter((v) => !(ADAPTIVE_CSS_VARS as readonly string[]).includes(v));
      return extra.length ? `unexpected ${extra.join(", ")}` : null;
    },
  },
  {
    id: "numbers-finite",
    why: "a NaN anywhere becomes a dropped CSS declaration or a hitbox that never collides.",
    check: (p) => {
      for (const [path, value] of numbers(p)) {
        if (!Number.isFinite(value)) return `${path} is ${value}`;
      }
      for (const [name, value] of Object.entries(p.cssVars)) {
        if (!/^-?\d+(\.\d+)?px$|^-?\d+(\.\d+)?$/.test(value)) return `${name} is "${value}"`;
      }
      return null;
    },
  },
  {
    id: "reserve-inside-window",
    why: "the chrome alone never claims more than the window.",
    check: (p) => {
      /*
       * A cropped plan is exempt: by definition the window is shorter than
       * floor + chrome, so the chrome *is* taller than the window and the plan
       * says so out loud (`fit: "crop"`). The floor exists so a 1×1 report from a
       * rotation does not collapse the column to nothing — the trade is that the
       * chrome is clipped until the next frame reports a real size.
       */
      if (p.plan.fit === "crop") return null;
      const usable = usableHeight(p.box);
      return p.plan.reserve <= usable ? null : `reserve ${p.plan.reserve} > ${usable}`;
    },
  },
];

/** Every violation for one profile. */
export function violations(profile: AdaptiveProfile): Array<{ id: string; message: string }> {
  const out: Array<{ id: string; message: string }> = [];
  for (const c of CONSTRAINTS) {
    const message = c.check(profile);
    if (message) out.push({ id: c.id, message });
  }
  return out;
}

/** The first violation, or `null` — the shape a test or a probe wants. */
export function firstViolation(profile: AdaptiveProfile): { id: string; message: string } | null {
  return violations(profile)[0] ?? null;
}

/** The ids, in order — used by the docs test to check the guide names them all. */
export function constraintIds(): string[] {
  return CONSTRAINTS.map((c) => c.id);
}
