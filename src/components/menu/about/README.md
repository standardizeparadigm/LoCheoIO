# `src/components/menu/about/`

The about card's content, as data. `AboutModal` renders it.

| File | What it is |
| --- | --- |
| `sections.ts` | the card's blocks: author, craft, contact, licence, fonts |
| `AboutCrest.tsx` | the three-orbit crest drawn behind the mascot (SVG) |
| `index.ts` | the barrel |

## The crest

`AboutCrest.tsx` replaces the v1.1.6 `.glow-ring`: one `<span>`, one conic
gradient masked to a 7px band, one `transform` animation. The report — *"the
ring around the jar does not move"* — was three failures wearing one symptom:

* the only motion cue was a `transform` on an element that also relied on
  `translate` utilities for its centring, so any later rule touching `transform`
  silently removed the rotation;
* the rest state (no motion: OS reduce-motion, or the player's switch, which the
  app seeds from the OS on first run) was three sparse translucent arcs — a
  half-drawn circle, not an ornament;
* one ring at one speed reads as a loading spinner.

The replacement is an SVG with three orbits at 9s / 14s / 22s, two clockwise and
one counter-clockwise, each drawn with a `stroke-dasharray` so the *stationary*
complement is a balanced set of dashes and comet tails. Rotation is applied to a
`<g>` with `transform-box: view-box` and `transform-origin: 50% 50%`, which no
layout rule can cancel.

The first version placed the comets at 58 against a gold arc at 68, and every
orbit started its dash pattern at 0° — at the bottom of the crest the two
strokes ran parallel, ten units apart, which reads as one doubled line rather
than two orbits. The comets now sit at 52 with a shorter tail, and each orbit
declares a `stroke-dashoffset` so the leading dashes never stack on the same
radius. Rendering the SVG on its own is how that was caught: nothing about the
dash *arrays* was wrong, so no test that only reads numbers would have seen it.

`tests/menu-about-crest.test.ts` pins all of it: the geometry and the comet's
clearance, the three distinct durations, that every animation name is a defined
keyframe, that each orbit declares its own phase, and that both reduced-motion
hooks (`prefers-reduced-motion` and `data-reduced-motion`) stop the same six
classes.

## Why the content is not in the modal

`AboutModal` is a layout: a header, a scrolling body, and a footer with the
licence link. The content is five blocks of prose that change when the project
changes — a font is added, the licence line is reworded — and mixing the two
means every content edit is a JSX diff.

Keeping it as `sections.ts` also makes the *order* reviewable as a list, which
is the only part of an about card that is easy to get wrong: the licence must be
last, and a section inserted above it is a change someone should notice.

## What is deliberately not here

No version string. The card is the one place a reader looks for "what am I
running", and the answer is different every release — so it comes from
`APP_VERSION` at render time, not from this file. The footer's `buildStat()`
does the same thing for the same reason.

No translated prose, either. The blocks are `{ key }` references into the i18n
table, so a translator edits one locale file and not a component.
