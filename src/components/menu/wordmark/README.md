# `menu/wordmark/`

The `LỌ / CHÉO` lockup — the two words that *are* the menu. This folder owns **how
big** each line is. `src/styles/wordmark.css` owns how it is painted.

| File | Owns |
| --- | --- |
| `scale.ts` | The two clamps, the ratio between them, and the resolution from a viewport width to a pixel size |
| `Wordmark.tsx` | The `<h1>`, the two spans, the shadow |
| `index.ts` | Re-exports |

## The one invariant

**`CHÉO` must never be larger than `LỌ`.**

`CHÉO` is the shorter word — four letters against two, but the two in `LỌ` are
wide and the four in `CHÉO` are narrow. It is also the *lower* line, so when it
grows past the upper one its glyphs run up into it and the lockup reads as one
smashed block.

The bug that produced this folder is worth keeping in mind, because the fix is
not the obvious one. The two sizes were independent clamps:

```
LỌ    clamp(2.6rem,  9.5vw, 5.6rem)
CHÉO  clamp(3.6rem, 13vw,   8rem)     ← 1.43× the line above it at 1280px
```

Every individual number looked reasonable. Nothing related them. Picking better
numbers would have fixed the screenshot and left the *shape* of the bug in place,
so instead `CHÉO` is now derived:

```ts
LO_CLAMP        = { min: 2.6, slope: 9.5, max: 5.6 }
CHEO_RATIO_MAX  = 0.82
CHEO_CLAMP      = {
  min:   LO_CLAMP.min   * 0.81,   // below the cap, on purpose — see below
  slope: LO_CLAMP.slope * 0.88,
  max:   LO_CLAMP.max   * CHEO_RATIO_MAX,
}
```

and `tests/wordmark-scale.test.ts` sweeps every pixel from 320 to 3840 asserting
`charPx(CHEO) < charPx(LO)`. Change both numbers in a way that keeps the order
and the test passes; change one so the order flips and it fails.

## Why the floor is 0.81 and not 0.82

The cap is 0.82, and the floor is deliberately a little *lower*. On a narrow
phone the slope term has not taken over yet, so the **floor** decides the size.
A floor of `2.9rem` — which is what a first draft used, and which looks harmless
next to `LỌ`'s `2.6rem` — made `CHÉO` **12% larger** than `LỌ` on every phone
below ~575px.

That is the exact bug this module exists to prevent, sitting in the one range a
conventional breakpoint list does not test. The sweep from 320px caught it;
a test at 375 / 768 / 1280 would not have.

## Why `fontSize` is an inline style

`toClass()` returns a plain pixel number, and `Wordmark.tsx` sets
`style={{ fontSize }}`. It cannot be a Tailwind class: Tailwind generates its
utilities by scanning source text, so a class assembled at runtime from a
variable (`text-[${n}px]`) produces a class that does not exist in the
stylesheet, and the element silently falls back to the inherited size.

## Adding a third line

Don't. The lockup is two lines because the two words are two words. A third line
would be a tagline, and the tagline already lives below the hero where it has its
own size and its own colour.
