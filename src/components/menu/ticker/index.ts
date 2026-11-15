/*
 * `menu/ticker/` — the 48px marquee strip under the corner panels.
 *
 * Two exports, and the split matters: `MenuTicker` is the component a screen
 * mounts, while `keys.ts` holds the fourteen strings and the tone rotation as
 * data. Keeping them in separate files is what lets `menu-ticker.test.ts`
 * assert the string count and the three-colour cycle without rendering
 * anything — the same discipline as `menu/howto/` and `menu/scene/`.
 *
 * `tickerTone()` is exported because the ticker is not its only consumer: the
 * changelog badges use the same rotation so a gold badge in the panel and a
 * gold word in the strip mean the same thing.
 */
export { MenuTicker } from "./MenuTicker";
export { TICKER_KEYS, TICKER_COUNT, tickerTone } from "./keys";
