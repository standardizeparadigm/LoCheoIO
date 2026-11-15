/*
 * `menu/howto/` — the data behind the instructions modal: the six illustrated
 * rules, the four keys, and the goal line.
 *
 * Kept as data rather than JSX so `menu-howto.test.ts` can assert the rule
 * count and the stride used by the ticker without rendering anything.
 */

export type { HowToRule } from "./rules";
export { HOW_TO_RULES, KEYBOARD_KEYS, HOW_TO_GOAL_KEY } from "./rules";
