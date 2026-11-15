# `src/components/menu/adaptive/`

Nine files, one direction of dependency:

```
viewport.ts   {width, height}          →  Box        (normalised once)
tiers.ts      Box                      →  xs … xxl
scale.ts      —                           ramps, guards, legibility floors
density.ts    MenuPlan                 →  the chrome's pixel table
typeScale.ts  Box + MenuPlan           →  every font size
hero.ts       Box + scene              →  which hero arrangement fits
breakpoints.ts —                          the four thresholds hero.ts quotes
environment.ts / useEnvironment.ts     →  safe areas, dpr, pointer, motion
resolve.ts    Box + Environment        →  one AdaptiveProfile
useAdaptive.ts —                          the only file that touches window
```

| File | Owns |
| --- | --- |
| `viewport.ts` | `Box`, `boxOf()`, `roomDriver()`, `aspectClassOf()` — one clamp for every rule |
| `tiers.ts` | `SizeTier` (`xs`…`xxl`), its floors, `tierScale()`, `deviceClass()` |
| `scale.ts` | `ramp`, `fluid`, `ordered`, `within`, `legible`, `fitText`, `quantised` |
| `density.ts` | `densityFor()`, `metricsFor()`, `panelHeightForPlan()`, `reserveFor()` |
| `typeScale.ts` | `typeScaleFor()`, `typeVars()` — every size the UI paints |
| `hero.ts` | `heroLayout()`, `heroContentHeight()`, and the component's own measurements |
| `breakpoints.ts` | the four constants, each with the derivation in a comment |
| `environment.ts` | readings the geometry cannot carry: safe areas, dpr, pointer, orientation |
| `useEnvironment.ts` | reads them from the browser, and `readInsets()` for the plan |
| `resolve.ts` | `resolveAdaptive()`, `adaptiveAttributes()`, `describeAdaptive()` |
| `useAdaptive.ts` | one subscription → one profile; `readAdaptiveInput()` for scripts |
| `index.ts` | the public surface — import from here, not the modules |

## Why this existed in v1.1.8 round 6

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

## What round 8 adds

Round 6 answered *which* arrangement fits. Round 8 answers *how large* every part
of it should be, on both axes:

| Before | After |
| --- | --- |
| `text-[clamp(2.6rem,9vw,5rem)]` (width only) | `type.overScore`, capped by the shorter axis |
| `text-[11px]` row labels | `--type-row-label`, 10–12.5px by window |
| panel header `text-[10px]` | `--type-panel-head`, 9–11px |
| `max-h-[86vh]` dialogs | `planModal()` — fits the visual viewport, one column on a phone |
| HUD `clamp(w/900, .78, 1.16)` | `playfield.hudScale`, both axes |
| `cornerRowHeight(dense, tight)` | `panelHeightForPlan(plan)` — cannot forget `compact` |

The wordmark additionally gets a **band cap**: `lockupMaxForBand(scene)` is
`scene / 1.68`, so a 140px band renders an 83px `LỌ` instead of a clipped 89.6px
one. That is the difference between "the logo is smaller here" and the round-5
screenshot, which was "the logo is cut in half".

## The ladder, after round 7

`heroLayout()` used to be four independent threshold questions:

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

## `environment.ts` — readings, not decisions

`planMenuLayout()` is a pure function of `{width, height}`, which is right for
geometry and not enough for four things that change what the geometry *should* be:

    safe-area insets   a notched phone loses 44px top + 34px bottom, so an
                       844×390 phone has 312px of usable height, not 390
    dpr                2× draws a 1px border as 2 device pixels — which is why
                       the corner ticks are 3px
    orientation        `width > height` is not "landscape phone": a 1600×900
                       desktop window is landscape too
    coarse pointer     no hover, and 34px rows are below the 44px touch target

Everything in that file is a *reading*. The decisions stay in `fit.ts` and
`hero.ts`, which never touch `window`.

## The measurements are the component's, not this folder's

`WORDMARK = 150`, `MASCOT_STACKED = 128`, `CHIP_OVERHANG = 14`, `STACK_GAP = 16`
and `MASCOT_ROW = 240` live in `hero.ts`, and each was read off a class name in
`StartScreen.tsx` when it was first measured. If someone changes `h-32` to
`h-36`, `hero.ts` is wrong and nothing will tell them —
`tests/hero-stacked-fit.test.ts` rebuilds the column independently from those same
class names, so it fails *only* if the two derivations disagree. That is the
closest thing to a guarantee available without a real browser.

## The four thresholds the README used to quote

Round 8 retired the ladder above, so these are now *inputs to a candidate list*
rather than a cascade. They are still declared, and
`tests/adaptive-readme.test.ts` still compares them to the code:

| Constant | Value | What it gates |
| --- | --- | --- |
| `HEIGHT_FOR_SIDE_BY_SIDE` | 300 | a two-column hero gets enough band |
| `WIDTH_FOR_SIDE_BY_SIDE` | 1024 | below `lg` the hero is one column |
| `HEIGHT_FOR_HALO` | 300 | the 240px halo ring is drawn |
| `HEIGHT_FOR_BADGE_ROW` | 232 | the plate + record row appears |

## `density.ts` — the bug it was written for

`GameMenu` and `InfoMenu` painted `cornerRowHeight(plan.dense, plan.tight)` while
`planMenuLayout()` had reserved `cornerRowReserve(dense, tight, ticker, compact)`.
On every compact window — 1568×677, 1366×650, anything between 677 and 838 —
the panel was drawn **28px taller than the space reserved for it**, so it
overlapped the ticker. Nothing failed: the plan was right, the painter was wrong,
and no test compared the two.

`panelHeightForPlan(plan)` takes the plan, so a painter cannot forget a flag it
never sees. `tests/adaptive-density.test.ts` re-derives both numbers across
1 600 viewports and also asserts that neither menu calls `cornerRowHeight()`
directly.

## Adding a layout feature

1. Add the flag to `HeroLayout`.
2. Measure what it costs and add it to `heroContentHeight`.
3. Insert it into the candidate list at the position matching its *value to the
   player*, not its pixel cost — the list is ordered by what is lost first.
4. Add a case to `tests/menu-adaptive.test.ts` for the band where it appears.

## Adding a size

1. Decide which axis decides it, and write the rule in `typeScale.ts`.
2. Give it a floor from the table in `tests/adaptive-type.test.ts` — a size with
   no floor is a size that will reach 6px on someone's phone.
3. Emit a `--type-*` variable from `typeVars()` so `index.css` can use it, and
   add the same name to `ADAPTIVE_CSS_VARS`.
4. Consume it in the component, keeping the old literal as the fallback.
