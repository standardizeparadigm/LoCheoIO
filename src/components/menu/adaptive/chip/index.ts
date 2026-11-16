/** The mode chip's planner and its text estimator. */
export { estimateText, charsThatFit } from "./measure";
export {
  planModeChip,
  describeModeChip,
  chipBoxHeight,
  MODE_CHIP_FLOOR,
  MODE_CHIP_GUTTER,
  MODE_CHIP_LINE_HEIGHT,
  MODE_CHIP_NAME_FLOOR,
  CHIP_BORDER,
  CHIP_PAD_Y,
  CHIP_DOT,
  MODE_CHIP_CHROME_X,
  MODE_CHIP_DOT,
  MODE_CHIP_GAP,
  MODE_CHIP_WANT,
} from "./modeChip";
export {
  CHIP_LOCALES,
  chipProbeFor,
  chipProbes,
  widestChipLabel,
  widestChipName,
  widestNameFor,
  widestOf,
  widestProbe,
} from "./probes";
export type { ChipProbe } from "./probes";
export type { ModeChipInput, ModeChipPlan } from "./modeChip";
