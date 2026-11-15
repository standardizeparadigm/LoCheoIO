/**
 * How-to-play content, as data.
 *
 * v1.1.7 rendered the six rules *inside the hero column*, under the tagline.
 * Opening «Cách chơi» pushed the wordmark off the top of the screen — the
 * accordion was 300px of text inside a 382px hero.
 *
 * v1.1.8 treats it as what it is: menu content. It lives in the GAME panel
 * (see GameMenu), rendered in a modal, so opening it cannot move anything
 * else on the screen. This file is the data half of that move.
 */
import type { MessageKey } from "../../../i18n/i18n";

/** One rule: a bold title and a one-line explanation. */
export interface HowToRule {
  /** Stable id, used as a React key and in tests. */
  id: string;
  /** 1-based display number. */
  n: number;
  titleKey: MessageKey;
  bodyKey: MessageKey;
  /** Which accent the card uses — cycles so six cards do not read as a wall. */
  accent: "tumeric" | "brine" | "chili";
}

const NUMBERS = ["0", "1", "2", "3", "4", "5"] as const;
const ACCENTS = ["tumeric", "brine", "chili"] as const;

/** The six rules, in the order the old accordion listed them. */
export const HOW_TO_RULES: readonly HowToRule[] = NUMBERS.map((n, i) => ({
  id: `rule-${n}`,
  n: i + 1,
  titleKey: `rule.${n}.t` as MessageKey,
  bodyKey: `rule.${n}.d` as MessageKey,
  accent: ACCENTS[i % ACCENTS.length],
}));

/** The control legend differs by input device; these are the key names. */
export const KEYBOARD_KEYS = ["W", "A", "S", "D"] as const;

/** A short list of what the player is aiming at, shown above the rules. */
export const HOW_TO_GOAL_KEY = "howto.goal" as MessageKey;
