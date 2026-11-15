/**
 * Why the layout looks like that — the explanation, not the numbers.
 *
 * THE PROBLEM IT SOLVES
 * ---------------------
 * `check-adaptive.ts` prints a table, and a table answers "what". When a
 * screenshot is wrong the question is "why": why is the ticker gone at 1568×677,
 * why is the hero a row here and a column 200px lower, why is this dialog one
 * column when the code asked for two.
 *
 * Every one of those answers already exists — in `plan.fit`, in `plan.ticker`, in
 * `hero.sideBySide`, in `modal.columns` — but finding it means knowing which of
 * eleven modules to open. `diagnose()` collects the decisions in the order the
 * derivation makes them, each with the reason it won, and `warningsFor()` states
 * the trade-offs the player is living with (a cropped hero, a hidden ticker, a
 * compressed HUD) as sentences rather than as booleans.
 *
 * WHY WARNINGS ARE NOT ERRORS
 * ---------------------------
 * `constraints.ts` answers "is this a bug". This file answers "what did the
 * layout give up to fit". A cropped hero on a 320px-tall window is not a bug, it
 * is the plan doing its job — but a reviewer who sees it without the reason will
 * file it as one. The two are deliberately separate lists.
 */

import type { AdaptiveProfile } from "./resolve";
import { describeTier } from "./tiers";
import { heroBandWidth } from "./hero";
import { planModeChip } from "./chip";
import { MODE_LIST } from "../../../game/modes";
import { describeBox } from "./viewport";

/** One decision and the reason it went the way it did. */
export interface DiagnosisRow {
  /** Which layer decided — matches the layer numbers in the design doc. */
  layer: string;
  /** What the value is, in the player's terms. */
  value: string;
  /** Why this value and not the neighbouring one. */
  because: string;
}

/** A trade-off the layout made, with a stable code so a tool can filter it. */
export interface AdaptiveWarning {
  /** `crop` · `no-ticker` · `no-footer` · `minimal` · `dialogs-scroll` · `compressed` … */
  code: string;
  /** One sentence for a human. */
  message: string;
}

/** The whole explanation for one window. */
export interface Diagnosis {
  /** e.g. `1280×720 · lg · comfortable · row · fit none`. */
  headline: string;
  /** The decisions, in derivation order. */
  rows: DiagnosisRow[];
  /** Trade-offs, not defects. */
  warnings: AdaptiveWarning[];
}

/** Why the hero is the shape it is. */
function heroReason(p: AdaptiveProfile): string {
  if (p.hero.sideBySide) return `band ${p.plan.scene}px clears the row floor`;
  if (p.plan.minimal) return `band ${p.plan.scene}px is minimal: wordmark only`;
  if (p.plan.scene < 300) return `band ${p.plan.scene}px is under the 300px row floor`;
  return `width ${p.box.width}px is under the 1024px row floor`;
}

/** Why the chrome is the density it is. */
function densityReason(p: AdaptiveProfile): string {
  const flags = [p.plan.dense ? "rich rows" : null, p.plan.tight ? "26px rows" : null, p.plan.compact ? "compact chrome" : null]
    .filter(Boolean)
    .join(" + ");
  return flags ? `${flags} (window ${p.box.height}px)` : `default chrome (window ${p.box.height}px)`;
}

/** Why the plan reports the fit it does. */
function fitReason(p: AdaptiveProfile): string {
  if (p.plan.fit === "none") return `hero kept its preference (${p.plan.scene}px ≥ 320)`;
  if (p.plan.fit === "squeeze") return `hero shortened to ${p.plan.scene}px, still above the 220px floor`;
  return `window is shorter than floor + chrome; hero cropped to ${p.plan.scene}px`;
}

/** Why the dialog is one or two columns. */
function modalReason(p: AdaptiveProfile): string {
  return p.modal.columns === 2
    ? `${p.modal.maxWidth}px leaves room for two readable columns`
    : `${p.modal.maxWidth}px is under the 560px two-column floor`;
}

/**
 * Build the explanation for a profile.
 *
 * The rows are in *derivation* order — box, tier, plan, density, hero, type,
 * modal, board — because that is the order a reader has to follow to find the
 * layer a wrong number came from.
 */
export function diagnose(p: AdaptiveProfile): Diagnosis {
  const rows: DiagnosisRow[] = [
    {
      layer: "1 · box",
      value: describeBox(p.box),
      because: p.insetApplied ? "safe-area inset subtracted before any rule" : "no safe-area inset reported",
    },
    {
      layer: "2 · tier",
      value: `${p.tier} · ${p.device} · ${p.aspect}`,
      because: `shortest side ${p.box.shortest}px decides the tier — ${describeTier(p.tier)}`,
    },
    {
      layer: "3 · plan",
      value: `scene ${p.plan.scene}px · reserve ${p.plan.reserve}px · fit ${p.plan.fit}`,
      because: fitReason(p),
    },
    {
      layer: "4 · density",
      value: `${p.density} · rows ${p.metrics.rowHeight}px · panel ${p.panelHeight}px`,
      because: densityReason(p),
    },
    {
      layer: "5 · hero",
      value: `${p.hero.sideBySide ? "row" : "stack"}${p.plan.minimal ? " · minimal" : ""}`,
      because: heroReason(p),
    },
    {
      layer: "6 · type",
      value: `lockup ${p.type.lockupLo}px · label ${p.type.rowLabel}px · hint ${p.type.rowHint}px`,
      because: `lockup capped by the ${p.type.lockupLimitedBy === "band" ? "band" : "width"}`,
    },
    {
      layer: "7 · modal",
      value: `${p.modal.maxWidth}×${p.modal.maxHeight}px · ${p.modal.columns} col`,
      because: modalReason(p),
    },
    {
      layer: "8 · chip",
      value: chipValue(p),
      because: chipReason(p),
    },
    {
      layer: "9 · board",
      value: `${p.playfield.width}×${p.playfield.height} · jar ${p.playfield.playerRadius}px · hud ×${p.playfield.hudScale}`,
      because: `item scale follows height (${p.playfield.itemScale}), radius follows the short side`,
    },
  ];

  return { headline: headline(p), rows, warnings: warningsFor(p) };
}

/**
 * The chip row.
 *
 * It is the newest layer and the one that produced a screenshot bug, so it earns
 * a line of its own: the band it was given, the width it needed, and which rung of
 * the ladder it landed on — read from the same planner the component calls, so the
 * diagnosis cannot disagree with the pixels.
 */
function chipValue(p: AdaptiveProfile): string {
  if (p.plan.minimal) return "hidden · hero is wordmark-only";
  const band = heroBandWidth(p.box.width);
  const plan = planModeChip({ heroWidth: band, side: "right", name: CHIP_WIDEST_NAME, label: CHIP_LABEL });
  return `band ${band}px · needs ${plan.needed}px · ${plan.reason}`;
}

function chipReason(p: AdaptiveProfile): string {
  if (p.plan.minimal) return "no mascot, so no chip — the mode is still in GAME → Modes";
  const band = heroBandWidth(p.box.width);
  const plan = planModeChip({ heroWidth: band, side: "right", name: CHIP_WIDEST_NAME, label: CHIP_LABEL });
  if (plan.reason === "full") return `right-aligned to the mascot's inner edge, ${plan.needed}px of ${plan.available}px used`;
  if (plan.reason === "label-dropped") return "the label goes before the name does — the name is the information";
  if (plan.reason === "name-shrunk") return `the name shrinks to ${plan.nameSize}px, still above the legible floor`;
  if (plan.reason === "ellipsis") return "the name is ellipsised: the band is below what a name needs";
  return "hidden: the band is under the chip floor";
}

/** The label the chip prints, and the widest mode name it can be asked to print. */
const CHIP_LABEL = "CHẾ ĐỘ CHƠI";
const CHIP_WIDEST_NAME = MODE_LIST.reduce((best, m) => (m.name.length > best.length ? m.name : best), "");

/** The one-line summary, with the parts a screenshot review always needs. */
export function headline(p: AdaptiveProfile): string {
  return [
    `${p.box.width}×${p.box.height}`,
    p.tier,
    p.density,
    p.hero.sideBySide ? "row" : "stack",
    `fit ${p.plan.fit}`,
  ].join(" · ");
}

/**
 * The trade-offs this window is living with.
 *
 * Ordered by how much the player loses, so a truncated list is still the
 * important half of it.
 */
export function warningsFor(p: AdaptiveProfile): AdaptiveWarning[] {
  const out: AdaptiveWarning[] = [];

  if (p.plan.fit === "crop") {
    out.push({
      code: "crop",
      message: `hero is cropped: the window is ${Math.max(0, 220 + p.plan.reserve - p.box.height)}px shorter than floor + chrome`,
    });
  }
  if (!p.plan.ticker) {
    out.push({ code: "no-ticker", message: `ticker hidden below ${570}px so the hero keeps its band` });
  }
  if (!p.plan.footer) {
    out.push({ code: "no-footer", message: `panel footer hidden below 470px; the stat is still in its row` });
  }
  if (p.plan.minimal) {
    out.push({ code: "minimal", message: `hero is wordmark-only: tagline, deck and mascot are dropped` });
  }
  /*
   * No warning for `modal.scroll`: `planModal()` caps every dialog at 86% of the
   * window, so `scroll` is true on every window and a warning that fires always
   * is noise. What is worth saying is when the cap gets *small* — under 420px the
   * dialog is a single screenful with no room for a header and a footer.
   */
  if (p.modal.maxHeight < 420) {
    out.push({ code: "dialog-compact", message: `dialogs are capped at ${p.modal.maxHeight}px: header, body and footer share one screen` });
  }
  /*
   * Nothing about the column count either: a dialog is one column unless its
   * *content* asks for two, and the profile cannot know what the content wants.
   * Warning on `columns === 1` lit up every desktop window and meant nothing.
   */
  if (p.plan.stacked) {
    out.push({ code: "panels-stacked", message: `corner panels stack: two 224px panels do not fit in ${p.box.width}px` });
  }
  if (p.playfield.playerRadius <= 21) {
    out.push({ code: "jar-at-floor", message: `jar is at its 21px floor: the board is short on both axes` });
  }
  if (p.insetApplied) {
    out.push({ code: "inset", message: `layout is measured against the usable window, not the raw one` });
  }
  return out;
}

/**
 * The diagnosis as plain text, for a console or a copy-pasted bug report.
 *
 * Fixed-width because it is meant to be pasted into an issue next to a
 * screenshot, and a table that does not line up is a table nobody reads.
 */
export function renderDiagnosis(p: AdaptiveProfile): string {
  const d = diagnose(p);
  const w = Math.max(...d.rows.map((r) => r.layer.length));
  const lines = [d.headline, ""];
  for (const row of d.rows) lines.push(`${row.layer.padEnd(w)}  ${row.value}\n${" ".repeat(w)}  ↳ ${row.because}`);
  if (d.warnings.length) {
    lines.push("", "trade-offs:");
    for (const warn of d.warnings) lines.push(`  · [${warn.code}] ${warn.message}`);
  } else {
    lines.push("", "trade-offs: none — this window gets the full layout");
  }
  return lines.join("\n");
}
