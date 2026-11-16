# `src/components/menu/adaptive/`

Fifteen files and three subfolders (`chip/`, `audit/`, `repair/`), one direction of dependency:

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
presets.ts    —                           the 21 named windows the tables use
constraints.ts AdaptiveProfile           →  the invariants, as data
diagnostics.ts AdaptiveProfile           →  why the layout is shaped this way
chip/         Box width + the band width →  how the mode chip fits (see chip/README.md)
audit/        the whole window space      →  one AuditReport (see audit/README.md)
repair/       a profile + the contract    →  the rungs it walks (see repair/README.md)
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
| `regressions.ts` | `REGRESSIONS` — 14 cửa sổ đã từng bị báo lỗi (vòng 1 → 12), mỗi cái kèm triệu chứng và điều phải giữ; nguồn của `tests/fixtures/regressions/` |
| `presets.ts` | `PRESETS` — 21 named windows (phone → 4K), the single source the probe, the docs and the corpus agree on |
| `constraints.ts` | `CONSTRAINTS` — fourteen invariants as `{ id, why, check }`, run by the tests and the probe |
| `diagnostics.ts` | `diagnose()`, `warningsFor()`, `renderDiagnosis()` — the explanation, not the numbers |
| `audit/` | `adaptive/audit/` — kiểm toán toàn bộ không gian cửa sổ (578 cửa sổ) thành `AuditReport` + `docs/adaptive-audit.md` |
| `repair/` | `adaptive/repair/` — thang sửa `as-planned → ignore-inset → … → smallest-type` khi một cửa sổ phá hợp đồng |
| `chip/` | `adaptive/chip/` — chip chế độ: `planModeChip()`, `chipBoxHeight()`, `estimateText()` |
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

## The fourth painter bug — round 8

`panelHeightForPlan()` knew the density but not `plan.footer`, while
`reserveFor()` had always subtracted `PANEL_FOOTER_HEIGHT` when the footer is
hidden. On every window under 470px the plan bought 30px less than the panel
drew: at 844×390 a 234px panel sat in a 216px band, its base 18px past the bottom
edge.

The reason it survived a test is worth keeping: the assertion compared
`panelHeightForPlan(plan)` with `cornerRowHeight(plan.dense, plan.tight,
plan.compact)` — **two sides of the same arithmetic**. A test can only catch a
geometry bug if one side of it is geometry. The replacement adds the 12px margin
and compares against `plan.reserve`, and `tests/panel-footer-overflow.test.ts`
does it on the eight short windows where the footer is off.

The fix is in the painter, not the planner: the reserve is right (the panel has
one fewer child), so the painter is what shrinks.

## The corpora

`tests/fixtures/adaptive-matrix/` (1 110 windows) and
`tests/fixtures/hero-bands/` (510 width×band pairs) pin every decision this
folder makes, one file per sample so a moved threshold names the windows it
changed. Regenerate with `npx vite-node scripts/gen-adaptive-fixtures.ts` (or
`gen-hero-fixtures.ts`); `--check` reports drift without writing.

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

## What round 9 adds: the contract and the explanation

Rounds 6–8 built the derivation. Round 9 makes it *auditable*.

**One list of invariants.** Before this round each invariant lived in three
places — an `expect()`, an `if` in the probe, a sentence in the design doc — and
the copy that got forgotten was always the one that mattered. `CONSTRAINTS` is the
single list: `tests/adaptive-constraints.test.ts` runs it over the corpus,
`scripts/check-adaptive.ts` runs it over the 21 presets, and
`tests/adaptive-constraints.test.ts` và `tests/adaptive-presets.test.ts` đỏ nếu
tài liệu thiết kế ngừng nêu một id.

**One list of windows.** `PRESETS` replaced three copies of the same 21-row table.
A preset carries only its size and why it exists; everything it *does* stays
`resolveAdaptive()`'s answer.

**An answer to "why".** `diagnose()` walks the eight layers in derivation order
and pairs each value with the reason it won — the band cleared the row floor, the
window was 30px short of floor + chrome, the panel was 448px and so under the
560px two-column floor. `warningsFor()` is the other half: the trade-offs the
window is living with (crop, no ticker, no footer, minimal hero, scrolling
dialogs) stated as sentences, because a reviewer who sees a cropped hero without
the reason files it as a bug.

**Which cap won.** `typeScaleFor()` now reports `lockupLimitedBy`, so "the logo is
small" has an answer without calling the wordmark module by hand.
