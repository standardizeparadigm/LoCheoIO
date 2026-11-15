/**
 * Today's challenge and today's rule — pure functions of the local date.
 *
 * WHY THEY MOVED HERE
 * -------------------
 * These two lived in `components/menu/deck/`, next to the three-column band
 * that displayed them. Round 6 deleted that band (it could not fit inside a
 * fixed-height hero), and the *display* going away is not a reason for the
 * *logic* to go away with it: the challenge is still the thing the INFO panel
 * shows and the game could score against.
 *
 * So they moved to `game/`, which is where date-derived game facts belong and
 * which by convention holds no React. The deck folder is deleted; the tests
 * for the date maths moved with it and kept their names.
 */
export type { DailyChallenge } from "./challenge";
export { challengeFor, isToday, localDayNumber, mix } from "./challenge";
export { RULE_COUNT, tipIndexFor } from "./tip";
