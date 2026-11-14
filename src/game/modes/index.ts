/*
 * The nine play modes. Each file is a plain data object — no behaviour, no
 * imports from React — so a mode can be rebalanced by editing one file and
 * nothing else.
 *
 * Barrel added in round 4. `modesIndex.ts` one level up does the ordering and
 * the id→config lookup; this file only re-exports the definitions.
 */

export { classic } from "./classic";
export { blitz } from "./blitz";
export { combo } from "./combo";
export { feast } from "./feast";
export { goldrush } from "./goldrush";
export { hardcore } from "./hardcore";
export { inferno } from "./inferno";
export { storm } from "./storm";
export { zen } from "./zen";
