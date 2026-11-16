/**
 * The adaptive layer's public surface.
 *
 * FIVE LAYERS, EACH A PURE FUNCTION OF THE ONE ABOVE IT
 * -----------------------------------------------------
 *
 *   viewport.ts    `{width,height}`        → `Box` — normalised once
 *   tiers.ts       `Box`                   → `xs`…`xxl` vocabulary
 *   scale.ts       —                         ramps, guards, legibility floors
 *   density.ts     `MenuPlan`              → the chrome's pixel table
 *   typeScale.ts   `Box + MenuPlan`        → every font size
 *   resolve.ts     `Box + Environment`     → one `AdaptiveProfile`
 *   useAdaptive.ts —                         the only file that touches `window`
 *
 * Import from this file, not from the modules: a test can then pin the whole
 * decision surface in one place, and an internal rename stays internal.
 */

/* ---- numbers ---------------------------------------------------------- */
export {
  HEIGHT_FOR_BADGE_ROW,
  HEIGHT_FOR_HALO,
  HEIGHT_FOR_SIDE_BY_SIDE,
  WIDTH_FOR_SIDE_BY_SIDE,
} from "./breakpoints";

/* ---- hero ------------------------------------------------------------- */
export type { HeroInput, HeroLayout } from "./hero";
export {
  BADGE_ROW_WIDTH,
  CHIP_OVERHANG,
  HERO_PAD_NARROW,
  HERO_PAD_SWITCH,
  HERO_PAD_WIDE,
  heroBandWidth,
  heroContainerWidth,
  heroContentHeight,
  heroLayout,
  heroRowFits,
  lockupWidth,
  MASCOT_ROW,
  MASCOT_ROW_HALO,
  MASCOT_STACKED,
  ROW_GAP,
  STACK_GAP,
} from "./hero";

/* ---- the mode chip ---------------------------------------------------- */
export type { ModeChipInput, ModeChipPlan } from "./chip";
export {
  charsThatFit,
  describeModeChip,
  estimateText,
  MODE_CHIP_FLOOR,
  MODE_CHIP_GUTTER,
  MODE_CHIP_NAME_FLOOR,
  planModeChip,
} from "./chip";

/* ---- the window ------------------------------------------------------- */
export type { AspectClass, Box, Orientation } from "./viewport";
export {
  MAX_SIDE,
  SQUARE_BAND,
  aspectClassOf,
  boxOf,
  describeBox,
  isShortLandscape,
  orientationOf,
  roomDriver,
  saneSide,
} from "./viewport";

/* ---- vocabulary ------------------------------------------------------- */
export type { DeviceClass, SizeTier } from "./tiers";
export {
  TIERS,
  TIER_FLOORS,
  atLeast,
  bigger,
  describeTier,
  deviceClass,
  smaller,
  tierFor,
  tierOf,
  tierRank,
  tierScale,
} from "./tiers";

/* ---- ramps ------------------------------------------------------------ */
export type { Span } from "./scale";
export {
  fitText,
  fluid,
  half,
  legible,
  ordered,
  percent,
  quantised,
  ramp,
  scaled,
  unit,
  within,
} from "./scale";

/* ---- density ---------------------------------------------------------- */
export type { Density, DensityFlags, DensityMetrics } from "./density";
export {
  airier,
  chromeShare,
  denser,
  densityFor,
  densityMetricsFor,
  metricsFor,
  panelHeightFor,
  panelHeightForPlan,
  panelWidthFor,
  reserveFor,
} from "./density";

/* ---- type ------------------------------------------------------------- */
export type { TypeInput, TypeScale } from "./typeScale";
export {
  LOCKUP_BOX_RATIO,
  MAX_LOCKUP_PX,
  MIN_LOCKUP_PX,
  lockupMaxForBand,
  typeScaleFor,
  typeVars,
} from "./typeScale";

/* ---- environment ------------------------------------------------------ */
export type { Environment } from "./environment";
export {
  DESKTOP_ENVIRONMENT,
  HANDHELD_MAX_HEIGHT,
  TOUCH_ROW_HEIGHT,
  isHandheld,
  parseInset,
  saneDpr,
  verticalInset,
} from "./environment";
export { readEnvironment, readInsets, useEnvironment } from "./useEnvironment";

/* ---- the profile ------------------------------------------------------ */
export type { AdaptiveInput, AdaptiveOverrides, AdaptiveProfile } from "./resolve";
export {
  ADAPTIVE_CSS_VARS,
  adaptiveAttributes,
  describeAdaptive,
  resolveAdaptive,
  resolveForSize,
} from "./resolve";
export { readAdaptiveInput, useAdaptive, useAdaptiveVars } from "./useAdaptive";

/* ---- presets ---------------------------------------------------------- */
export type { PresetGroup, ViewportPreset } from "./presets";
export {
  PRESETS,
  presetFor,
  presetSize,
  presetTuples,
  presetsIn,
  presetsTallEnough,
} from "./presets";

/* ---- the contract ----------------------------------------------------- */
export type { Constraint } from "./constraints";
export {
  CONSTRAINTS,
  constraintIds,
  firstViolation,
  violations,
} from "./constraints";

/* ---- the audit -------------------------------------------------------- */
export type { AuditReport, AuditSample, AuditTally } from "./audit";
export {
  AUDIT_HEIGHTS,
  AUDIT_WIDTHS,
  auditAdaptive,
  auditOne,
  auditWindowList,
  auditWindows,
  knownViolationIds,
  renderAuditMarkdown,
  summarise,
} from "./audit";

/* ---- the repair ladder ------------------------------------------------ */
export type { RepairInput, RepairResult, RepairRung, RepairValidator } from "./repair";
export { REPAIR_LADDER, describeRepair, repairForSize, repairProfile, repairRungIds } from "./repair";

/* ---- the explanation -------------------------------------------------- */
export type { AdaptiveWarning, Diagnosis, DiagnosisRow } from "./diagnostics";
export { diagnose, headline, renderDiagnosis, warningsFor } from "./diagnostics";
