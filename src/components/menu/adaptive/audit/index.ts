/** The audit: the whole window space, resolved once, summarised as data. */
export type { AuditReport, AuditSample, AuditTally } from "./audit";
export {
  AUDIT_HEIGHTS,
  AUDIT_WIDTHS,
  auditAdaptive,
  auditOne,
  auditWindowList,
  auditWindows,
  chipRungFor,
  knownViolationIds,
  summarise,
} from "./audit";
export { renderAuditMarkdown } from "./report";
/*
 * The drag audit — the same window space, visited in an order.
 *
 * `adaptive-audit.md` answers "is any window broken"; this answers "when the
 * window moves, how often does the screen rebuild". They share the presets, so
 * the two answers are about the same devices.
 */
export type { DragPath, DragReport } from "./drag";
export { DRAG_SPAN, describeDrag, dragAudit, dragPath, rungText } from "./drag";
export { renderDragMarkdown } from "./dragReport";
