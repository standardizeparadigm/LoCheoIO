# `src/components/menu/ticker/`

The marquee at the bottom of the start screen: fourteen strings scrolling on a
48px band, with the copyright line inside the same block.

| File | What it is |
| --- | --- |
| `keys.ts` | the fourteen i18n keys, in scroll order |
| `MenuTicker.tsx` | the component: one `<div>`, duplicated text, CSS animation |
| `index.ts` | the barrel |

## Why the strings are keys, not text

The ticker scrolls across a 1920px window at ~60px/s, so a reader gets roughly
four seconds per line. That is enough to read twelve words and not enough to
read a mistranslation — which makes it the surface where a bad string is least
likely to be reported by a user and most likely to be seen by one.

Every string therefore comes from `t()` like everything else, and
`tests/menu-ticker.test.ts` asserts that each key in `keys.ts` exists in all
seven locales. A missing key would render an empty span, and an empty span in a
scrolling band looks like a pause, not a bug.

## Why `tickerTone()`

`keys.ts` also exports a pure function that picks the *tone* of a line — neutral,
highlight, or warning — from its index. It is pure and separate so the tone
sequence can be asserted without a DOM: the test checks that no three
consecutive lines share a tone, which is the property that makes the band read
as varied rather than as decoration.

## The 48px height is load-bearing

The ticker's height is declared, not intrinsic. An earlier version let it size
to its text, which meant the copyright line wrapped to a second row at some
widths and the bottom of that row was clipped by the pane's edge — the
`V1.1.7 · AGPL-3.0 · …` cut visible in the round-6 screenshot.

`planMenuLayout()` now reserves the height and `MenuTicker` paints it. A change
to one without the other is the bug this folder already had once.
