/**
 * The mode chip: «CHẾ ĐỘ CHƠI · MUỐI DƯA CỔ ĐIỂN» under the mascot.
 *
 * THE BUG THIS FIXES
 * ------------------
 * The chip was a `position: absolute; left: 50%; transform: translateX(-50%)`
 * button inside the mascot column — centred on a 160–240px anchor and free to
 * grow to whatever its text needed. In the stacked layout that is fine: the
 * mascot is centred, the chip is centred on it, and both are centred in the band.
 *
 * In the *row* layout the mascot sits at the **right end** of the hero. A chip
 * centred on it therefore extends roughly half its width past the hero's right
 * edge, and `.menu-hero` is `overflow: hidden`. The classic mode is the longest
 * name in every locale ("MUỐI DƯA CỔ ĐIỂN", 19 characters), so it was the one
 * that overflowed enough to be visibly cut: the screenshot shows the right side
 * of the chip — its border, its padding and the end of the name — simply gone.
 *
 * WHAT THIS DOES
 * --------------
 * Two independent guarantees, because one is never enough for a bug that shipped:
 *
 *   1. **Geometry is CSS, and it is bounded.** The chip is rendered in a
 *      full-width layer at the bottom of the hero, `align` decides whether it
 *      hugs the right edge (row) or the centre (stack), and `maxWidth` is a hard
 *      clamp ≤ the band. No absolute offset can leave the container, whatever
 *      the text says.
 *   2. **The ladder is decided before paint.** `showLabel` drops «CHẾ ĐỘ CHƠI»
 *      before the name is touched — the label is decoration, the name is
 *      information — then `nameSize` shrinks to a legible floor, and only then
 *      is an ellipsis allowed.
 *
 * The estimate can be 6% wrong and the chip is still correct, because the
 * clamp in (1) is what actually holds the box.
 */
import { estimateText } from "./measure";

/** Below this the chip is not worth drawing at all. */
export const MODE_CHIP_FLOOR = 108;

/** The name never goes below this, matching `type-legible`'s floor for labels. */
export const MODE_CHIP_NAME_FLOOR = 9.5;

/** Breathing room between the chip and the band's edges, px. */
export const MODE_CHIP_GUTTER = 8;

/** The chip's own chrome: `px-3` (12) plus the 3px border, per side. */
const CHROME_X = 15;
/** Dot 8px + its gap 8px. */
const DOT = 16;
/** The gap between the label and the name. */
const GAP = 8;

export interface ModeChipInput {
  /** Width of the band the chip lives in, px — `profile.box.width`. */
  heroWidth: number;
  /** Where the chip sits when it has room: hugging the mascot's side, or centred. */
  side: "left" | "right" | "center";
  /** The mode's localised name. */
  name: string;
  /** «CHẾ ĐỘ CHƠI», already translated. */
  label: string;
  /** Name size before any shrinking, px. */
  nameSize?: number;
  /** Label size before any shrinking, px. */
  labelSize?: number;
  /** Tracking of the name in em (`tracking-[0.06em]`). */
  nameTracking?: number;
  /** Tracking of the label in em (`tracking-[0.2em]`). */
  labelTracking?: number;
}

export interface ModeChipPlan {
  /** The chip is drawn. */
  visible: boolean;
  /** `end` = hug the right edge; `center` = centred in the band. */
  align: "center" | "end";
  /** The «CHẾ ĐỘ CHƠI» label is drawn. */
  showLabel: boolean;
  /** Name size actually used, px. */
  nameSize: number;
  /** Label size actually used, px — 0 when the label is dropped. */
  labelSize: number;
  /** Hard clamp the component applies to the button, px. */
  maxWidth: number;
  /** Width the chip wants at `nameSize`, px. */
  needed: number;
  /** Width available between the gutters, px. */
  available: number;
  /** The name needs an ellipsis even at the floor size. */
  truncated: boolean;
  /** Which step of the ladder decided this. */
  reason: "full" | "label-dropped" | "name-shrunk" | "ellipsis" | "hidden";
}

const WANT = {
  nameSize: 11,
  labelSize: 8,
  nameTracking: 0.06,
  labelTracking: 0.2,
};

/**
 * Decide the chip's ladder for one band.
 *
 * Total: every numeric input is sanitised, and a chip that cannot fit returns
 * `visible: false` rather than a plan with a negative width.
 */
export function planModeChip(input: ModeChipInput): ModeChipPlan {
  const width = Number.isFinite(input.heroWidth) ? Math.max(0, Math.trunc(input.heroWidth)) : 0;
  const available = Math.max(0, width - 2 * MODE_CHIP_GUTTER);

  const nameSheet = clampSize(input.nameSize, WANT.nameSize);
  const labelSheet = clampSize(input.labelSize, WANT.labelSize);
  const nameTracking = finite(input.nameTracking, WANT.nameTracking);
  const labelTracking = finite(input.labelTracking, WANT.labelTracking);
  const name = typeof input.name === "string" ? input.name : "";
  const label = typeof input.label === "string" ? input.label : "";

  const align: "center" | "end" = input.side === "right" ? "end" : "center";

  const blank: ModeChipPlan = {
    visible: false,
    align,
    showLabel: false,
    nameSize: 0,
    labelSize: 0,
    maxWidth: 0,
    needed: 0,
    available,
    truncated: false,
    reason: "hidden",
    };

  if (available < MODE_CHIP_FLOOR || name.length === 0) return blank;

  const nameAt = (size: number) => estimateText(name, size, nameTracking);
  const full = 2 * CHROME_X + DOT + GAP + labelSheetWidth(label, labelSheet, labelTracking) + nameAt(nameSheet);

  if (full <= available) {
    return {
      visible: true,
      align,
      showLabel: true,
      nameSize: nameSheet,
      labelSize: labelSheet,
      maxWidth: available,
      needed: full,
      available,
      truncated: false,
      reason: "full",
    };
  }

  /*
   * Step 1 — drop the label. The dot stays: it is the control's affordance, and
   * the button's `title`/`aria-label` still say «Chế độ chơi» for a screen
   * reader, so nothing is actually lost by hiding the words.
   */
  const withoutLabel = 2 * CHROME_X + DOT + nameAt(nameSheet);
  if (withoutLabel <= available) {
    return {
      visible: true,
      align,
      showLabel: false,
      nameSize: nameSheet,
      labelSize: 0,
      maxWidth: available,
      needed: withoutLabel,
      available,
      truncated: false,
      reason: "label-dropped",
    };
  }

  /*
   * Step 2 — shrink the name, keeping the ratio the text needs. The floor is
   * 9.5px: a name smaller than that is a name nobody reads, and an ellipsis is
   * the more honest failure at that point.
   */
  const room = available - 2 * CHROME_X - DOT;
  const perPx = nameAt(1);
  const fitted = perPx > 0 ? Math.floor((room / perPx) * 10) / 10 : 0;
  const shrunk = Math.max(MODE_CHIP_NAME_FLOOR, Math.min(nameSheet, fitted));

  if (shrunk > MODE_CHIP_NAME_FLOOR && nameAt(shrunk) <= room) {
    return {
      visible: true,
      align,
      showLabel: false,
      nameSize: shrunk,
      labelSize: 0,
      maxWidth: available,
      needed: 2 * CHROME_X + DOT + nameAt(shrunk),
      available,
      truncated: false,
      reason: "name-shrunk",
    };
  }

  return {
    visible: true,
    align,
    showLabel: false,
    nameSize: MODE_CHIP_NAME_FLOOR,
    labelSize: 0,
    maxWidth: available,
    needed: 2 * CHROME_X + DOT + nameAt(MODE_CHIP_NAME_FLOOR),
    available,
    truncated: true,
    reason: "ellipsis",
  };
}

function labelSheetWidth(label: string, size: number, tracking: number): number {
  return estimateText(label, size, tracking);
}

function clampSize(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || (value as number) <= 0) return fallback;
  return value as number;
}

function finite(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? (value as number) : fallback;
}

/** One line, for a console or a test failure message. */
export function describeModeChip(plan: ModeChipPlan): string {
  if (!plan.visible) return "chip hidden — band under the floor";
  const label = plan.showLabel ? `label ${plan.labelSize}px` : "no label";
  const end = plan.truncated ? "ellipsis" : plan.reason;
  return `chip ${plan.align} · name ${plan.nameSize}px · ${label} · ${Math.round(plan.needed)}/${plan.available}px · ${end}`;
}
