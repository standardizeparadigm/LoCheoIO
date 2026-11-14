# `src/components/menu/adaptive/`

Two files, two jobs: **numbers** (`breakpoints.ts`) and **decision** (`hero.ts`).

## Why this exists

Round 6's report compared two screenshots of the same app:

    1920×1080 (fullscreen)   everything visible, hero tall
    1920×820  (windowed)     hero laid out as a wide row, lower half under the
                             corner panels, chip cut in half

The difference is 260px of *height* and zero of width. Every breakpoint in the
CSS is a width breakpoint (`sm:`, `lg:`), so both viewports took the identical
branch and produced the identical layout — one of which had nowhere to put it.

The answer is not another media query. `heroLayout()` reads the numbers the layout
plan already computed and answers five booleans; the component branches on those.
Because they come from `scene` — the same value the chrome reserves — a resize
cannot leave them stale.

## The rule that changed in round 7

The ladder used to be four independent threshold questions:

    badgeRow  = h >= 232
    halo      = h >= 300
    sideBySide= w >= 1024 && h >= 300

That works only if every threshold is an upper bound on the feature's cost *in the
layout it ends up in*, and none of them were. `232` was derived from the
side-by-side row but also fired when stacked, where the same badge row plus the
mascot below it needs **370**.

It is now a measurement: build candidates richest-first, return the first one
`heroContentHeight()` says fits. A layout the sweep test says fits is, by
construction, a layout the component can draw.

## The files

| File | Owns |
| --- | --- |
| `breakpoints.ts` | The four constants, each with the derivation in a comment |
| `hero.ts` | `heroLayout()`, `heroContentHeight()`, and the component's own measurements |
| `environment.ts` | Readings the geometry cannot carry: safe areas, dpr, pointer, orientation |
| `useEnvironment.ts` | The only place that touches `window`: reads them, and `readInsets()` for the plan |
| `index.ts` | The public surface — import from here, not the modules |

## `environment.ts` — readings, not decisions

`planMenuLayout()` is a pure function of `{width, height}`, which is right for
geometry and not enough for four things that change what the geometry *should* be.
None of them were read at all before round 7:

    safe-area insets   a notched phone loses 44px top + 34px bottom, so an
                       844×390 phone has 312px of usable height, not 390
    dpr                2× draws a 1px border as 2 device pixels — which is why
                       the corner ticks are 3px
    orientation        `width > height` is not "landscape phone": a 1600×900
                       desktop window is landscape too
    coarse pointer     no hover, and 34px rows are below the 44px touch target

Everything in that file is a *reading*. The decisions stay in `fit.ts` and
`hero.ts`, which never touch `window` — that is what keeps them pure and
testable, and it is why `Viewport` carries a plain `inset?: number` instead of
this module being imported by the planner.

## The measurements are the component's, not this folder's

`WORDMARK = 150`, `MASCOT_STACKED = 128`, `CHIP_OVERHANG = 14`, `GAP = 16` and
`MASCOT_ROW = 240` are read off `StartScreen.tsx`'s class names. If someone
changes `h-32` to `h-36`, this module is wrong and nothing will tell them —
`tests/hero-stacked-fit.test.ts` rebuilds the column independently from those same
class names, so it fails *only* if the two derivations disagree. That is the
closest thing to a guarantee available without a real browser.

## Adding a layout feature

1. Add the flag to `HeroLayout`.
2. Measure what it costs and add it to `heroContentHeight`.
3. Insert it into the candidate list at the position matching its *value to the
   player*, not its pixel cost — the list is ordered by what is lost first.
4. Add a case to `tests/menu-adaptive.test.ts` for the band where it appears.
