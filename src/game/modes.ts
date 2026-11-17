/**
 * Game modes & balance math — public surface.
 *
 * v1.1.7: this 255-line file became a folder plus two siblings:
 *
 *   modeTypes.ts      ModeId · ModeConfig          (types only)
 *   modes/<id>.ts     one balance record per mode  (nine files)
 *   modesIndex.ts     MODES · MODE_LIST · isModeId (assembles them)
 *   modeMath.ts       multiplierForCombo · levelForCatches · jarBonus ·
 *                     comboWindowFor · jarBonusFor · COMBO_WINDOW · MAX_CRACKS
 *
 * Every name below is re-exported here, so `import { … } from "game/modes"`
 * keeps working — the engine and the tests were not touched.
 */
export type { ModeId, ModeConfig } from "./modeTypes";
export { MODES, MODE_LIST, isModeId, modeConfigFor } from "./modesIndex";
export {
  multiplierForCombo,
  levelForCatches,
  jarBonus,
  COMBO_WINDOW,
  MAX_CRACKS,
  comboWindowFor,
  maxCracksFor,
  jarBonusFor,
} from "./modeMath";
