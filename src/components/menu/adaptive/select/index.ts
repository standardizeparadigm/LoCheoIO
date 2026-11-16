/**
 * `select/` — a comparator over the repair ladder.
 *
 * `score.ts` turns a profile into seven ordered terms; `select.ts` resolves every
 * rung, sorts by those terms and returns the winner with its receipts. The claim
 * the pair buys is checked in `tests/adaptive-select.test.ts`: on every window the
 * app can be played in, the profile it ships is the cheapest one that passes.
 */
export {
  SCORE_ORDER,
  compareScores,
  describeScore,
  scoreProfile,
  slackOf,
  typeDropOf,
  countLevers,
  isFiniteProfile,
  type Comparable,
  type Score,
  type ScoreTerm,
  type ScoreTerms,
  type ScoreContext,
} from "./score";
export {
  bestOn,
  candidatesFor,
  describeSelection,
  selectBest,
  selectionRungIds,
  shippedIsBest,
  type Candidate,
  type Loser,
  type Selection,
  type SelectionInput,
  type SelectionValidator,
} from "./select";
