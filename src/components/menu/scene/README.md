# `menu/scene/`

The painted backdrop of the menu hero: the jar, its halo, and the decorative
glyphs that fill the empty corners.

| File | Owns |
| --- | --- |
| `HeroDecor.tsx` | The only thing the menu mounts |
| `JarHalo.tsx` | The glow behind the jar |
| `DecorGlyph.tsx` | One drifting glyph |
| `decor.ts` | The glyph list, the overlap rule, the reserved zones |

## The reserved zone

`WORDMARK_ZONE` is a rectangle the decor may not enter, and `insideWordmark()`
is what enforces it. This exists because a drifting glyph that passes behind the
wordmark makes the lockup look smudged for as long as it is there — which is
most of the time, since the animation is slow.

Rounding 3 added `decorOverlap()` so two glyphs cannot stack either. Both rules
are covered by `tests/menu-decor.test.ts` against the real list, so adding a
glyph in the wrong place fails immediately instead of being noticed in a
screenshot two weeks later.

## Why the decor is data

Everything is a value in `decor.ts` — position, size, kind, drift duration. No
component holds its own numbers. That means the layout can be asserted in a test
with no renderer, and moving one glyph is a one-line edit rather than a hunt
through JSX.

## `index.ts`

The barrel that `HeroDecor` and `JarHalo` are imported through. It exports the
three components and the decor type; `decor.ts` stays importable directly
because the tests read it without React.
