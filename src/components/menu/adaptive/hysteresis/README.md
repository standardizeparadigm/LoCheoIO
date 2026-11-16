# `src/components/menu/adaptive/hysteresis/` — two pixels of memory

`resolveAdaptive()` is a pure function of the window, so the layout is a **step
function**: cross 699 → 700 and the hero switches arrangement, the panel row switches
density and the ticker appears. That is right for *what* to paint. It is wrong for
*when*, because a resize drag produces that step dozens of times a second.

| File | Owns |
| --- | --- |
| `hysteresis.ts` | `stabilize()` · `shouldHold()` · `sameRung()` · `rungKeyOf()` · `HYSTERESIS_MARGIN` |
| `index.ts` | the barrel; `useAdaptive()` imports `stabilize()` from here |

## The bug this folder exists for

Dragging a window edge slowly across a breakpoint re-lays-out the screen on **every
mouse move**: a hero that jumps between row and stack, a ticker that blinks, a type
scale that changes size. On a trackpad near the boundary it oscillates while the
pointer is still — a flicker no screenshot can capture and no unit test of a pure
function can see, because the function is correct and the *input* is genuinely on
both sides of the step.

## What a hold is, and what it is not

`stabilize(previous, next)` returns `previous` when **all three** hold:

1. there is a previous profile (the first frame never holds, or a profile would get
   stuck at the SSR reference size);
2. the two profiles differ in a **visible** rung — `tier`, `density`, `hero`, `fit` or
   `panelHeight`. A size change inside one rung passes straight through: the numbers
   are allowed to differ, the arrangement is not;
3. the window moved by **≤ 2px** in both axes.

So a hold is a *deferred* step, never an ignored one: after two more pixels of drag the
new rung applies. `HYSTERESIS_MARGIN` is 2 because the planner's thresholds are integer
pixels and the smallest visible step in the chrome (panel header, 22 vs 14px) is 8px —
a 2px hold can never straddle two states that differ by less than the band it holds.

## Why not a debounce

A timer would be simpler and worse: it holds for a *duration* rather than a
*distance*, so it either lags a deliberate resize or fails to catch a jitter, depending
on how fast the player drags. Distance is the quantity the layout is a function of.

## Why the profile and not just a class name

The held value is the previous **profile**, so every number in it was already validated
by the contract for a window within 2px of the current one, and the rung report
(`data-adaptive-repair`) travels with it. Holding a rung name and re-deriving the
numbers would be a second resolver, which is the shape of bug this folder keeps
finding.

## What it does not do

- **No animation.** The step is instant; `index.css` owns transitions, and a layout
  that animates its own breakpoints fights the reduced-motion rules.
- **No memory across reloads.** A restored window resolves once, at its real size.
