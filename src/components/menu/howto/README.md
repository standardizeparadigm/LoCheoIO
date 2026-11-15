# `src/components/menu/howto/`

The six rules, as data. `HowToModal` (one level up) renders them; this folder
owns the content and the ordering.

| File | What it is |
| --- | --- |
| `rules.ts` | six `HowToRule` objects: id, display number, title key, body key, accent |
| `index.ts` | the barrel |

## Why this moved out of the hero

v1.1.7 rendered the rules **inside the hero column**, under the tagline, in an
accordion. Opening it added ~300px of text to a 382px hero, which pushed the
wordmark off the top of the screen. The bug report showed `LỌ CHÉO` half-clipped
with the rules open, and the natural reading was "the accordion is broken" —
it was not; the accordion was doing exactly what it should, in the one place it
could not be.

The fix was not a shorter accordion. It was recognising that the rules are
**menu content**: they belong to a panel row that opens a modal, where opening
them cannot move anything else on the screen.

## Accents cycle on purpose

`accent` is one of `tumeric` / `brine` / `chili` and it cycles by index. Six
cards in one colour read as a wall of text; six cards in six colours read as a
rainbow. Three, cycling, gives the eye somewhere to land without turning the
modal into a palette test.

The value is stored per rule rather than derived from the index so a rule can be
reordered without silently changing colour — the accent is part of the rule's
identity, not an accident of its position.

## The `n` field is display-only

`n` is the 1-based number shown in the corner of each card. It is **not** used
for ordering — the array order is the order. They agree today, and the field
exists so that removing a rule in the middle does not renumber the rest in a way
that contradicts the how-to text elsewhere.
