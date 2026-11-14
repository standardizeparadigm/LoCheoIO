/**
 * The fourteen ingredient strings the marquee cycles, in order.
 *
 * They were an inline array of `ticker.0`…`ticker.13` inside StartScreen's
 * JSX. As data they can be counted, tested for parity and reordered without
 * touching a component — and the count is asserted by
 * `tests/menu-ticker.test.ts` so a missing key cannot silently shorten the
 * strip.
 */
import type { MessageKey } from "../../../i18n/i18n";

/** The marquee sequence. Every entry must resolve in all seven locales. */
export const TICKER_KEYS = [
  "ticker.0",
  "ticker.1",
  "ticker.2",
  "ticker.3",
  "ticker.4",
  "ticker.5",
  "ticker.6",
  "ticker.7",
  "ticker.8",
  "ticker.9",
  "ticker.10",
  "ticker.11",
  "ticker.12",
  "ticker.13",
] as const satisfies readonly MessageKey[];

/** How many strings the strip cycles. */
export const TICKER_COUNT = TICKER_KEYS.length;

/**
 * Which palette a given position uses. Three-way rotation, so adjacent items
 * never share a colour — a single-colour strip reads as a solid bar.
 */
export function tickerTone(index: number): "tumeric" | "brine" | "chili" {
  return index % 3 === 0 ? "tumeric" : index % 3 === 1 ? "brine" : "chili";
}
