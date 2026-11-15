/*
 * `src/utils/` — small, dependency-free helpers shared by the game and the UI.
 *
 * Nothing in here may import from `src/game/` or `src/components/`: the point
 * of the folder is that any layer can use it without pulling in the next layer.
 * Barrel added in round 4 so call sites can read `from "../utils"`.
 */

export { clamp, clamp01, lerp, damp } from "./math";
export { cn } from "./cn";
export { copyText } from "./clipboard";
export {
  prefersReducedMotion,
  prefersCoarsePointer,
  prefersMoreContrast,
  matches,
  onMediaChange,
} from "./mediaQuery";
export { useFocusTrap } from "./useFocusTrap";
export { fmtTime, fmtCountdown } from "./time";
