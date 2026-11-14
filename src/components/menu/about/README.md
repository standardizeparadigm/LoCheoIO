# `src/components/menu/about/`

The about card's content, as data. `AboutModal` renders it.

| File | What it is |
| --- | --- |
| `sections.ts` | the card's blocks: author, craft, contact, licence, fonts |
| `index.ts` | the barrel |

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
