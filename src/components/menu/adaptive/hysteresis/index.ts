/**
 * `adaptive/hysteresis/` — the layout holds its rung for two pixels.
 *
 * A step function of the window is right for *what* to paint and wrong for *when*:
 * dragging an edge across a breakpoint re-lays-out the screen on every mouse move.
 * One remembered profile makes the step sticky without making it stale. See
 * `README.md`.
 */
export type { HoldAxis, HoldReason, HoldVerdict, RungKey } from "./hysteresis";
export {
  HYSTERESIS_MARGIN,
  describeVerdict,
  explainHold,
  rungKeyOf,
  sameRung,
  shouldHold,
  stabilize,
} from "./hysteresis";
