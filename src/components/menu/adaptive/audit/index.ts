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
