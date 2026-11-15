# `src/styles/`

Stylesheets that are too big, or too load-bearing, to live inside `index.css`.

`index.css` is the entry point: it declares the Tailwind import, the `@theme`
block that names every colour and font, and the handful of global rules that
apply to the whole app. Everything that belongs to *one part* of the UI lives in
a file here and is pulled in with an `@import` at the top.

| File | Owns |
| --- | --- |
| `fonts.css` | The `@font-face` declarations and the font files they point at |
| `wordmark.css` | The `LỌ / CHÉO` lockup: gold fill, hard shadow, descender room |
| `animations.css` | All 28 `@keyframes` (v1.1.8). The *rules* that use them stay in `index.css` next to their selectors; only the named animations moved, because a name does not care where it is defined |

## Why the wordmark got its own file

The wordmark has been the subject of three rounds of bug reports — a missing
diacritic, a gold band that read as a rectangle, and a `CHÉO` that was larger
than the `LỌ` above it. Each fix needed to say, in a comment, *why* the obvious
alternative was wrong. Those comments are now next to the rules they describe
instead of 900 lines away from them.

The one rule that matters most, repeated here because it has been violated
twice: **nothing may be painted behind the letters.** A gradient cannot follow a
glyph outline, so a gradient behind a word is always a box. Light has to come
from a `text-shadow`, which has no edges.

## Why the keyframes are separate from the rules

An animation is referenced by **name**, so  works from
anywhere in the cascade. That makes them the one kind of rule in `index.css`
that could be collected without touching a single selector — and collecting
them turned out to answer a question nothing else could: are any names
duplicated?

Twenty-eight blocks scattered across 1,049 lines, some under a `v1.1.6`
banner 400 lines below the rule that used them, cannot be checked by eye. After
the move, one line answers it:

```console
$ grep "^@keyframes" src/styles/animations.css | sort | uniq -d
$                                     # no output: 28 names, no collisions
```

## Adding a file

Only add one when a rule set has a name — a feature, a page, a component with
its own visual identity. "Miscellaneous" files are how `index.css` reached 1,246
lines in the first place.
