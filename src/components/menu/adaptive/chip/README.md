# `src/components/menu/adaptive/chip/` — the mode chip, planned

The chip under the mascot («CHẾ ĐỘ CHƠI · MUỐI DƯA CỔ ĐIỂN») is the only element
in the hero that is *absolutely positioned against a narrow anchor* while carrying
text nobody controls: a translation, in seven locales, where the classic mode's
name is nineteen characters.

| File | Owns |
| --- | --- |
| `probes.ts` | **mọi ngôn ngữ**: `chipProbes()`, `widestProbe()`, `widestChipLabel()`, `widestChipName()`, `widestNameFor()` — một định nghĩa của "chuỗi xấu nhất" cho cả 7 locale |
| `measure.ts` | `estimateText()` · `charsThatFit()` — painted width from characters, no layout engine |
| `modeChip.ts` | `planModeChip()` · `describeModeChip()` — alignment, the label ladder, the width cap |
| `index.ts` | the barrel: `planModeChip` is what the component imports |

## The bug this folder exists for

The chip was `left: 50%; transform: translateX(-50%)` inside the mascot column.
In the **stacked** layout that is correct — mascot centred, chip centred on it.

In the **row** layout the mascot is the *last* item of the row, i.e. at the right
end of the band. A chip centred on it therefore reaches ~half its width past the
band's right edge, and `.menu-hero` is `overflow: hidden`. The longest name lost
its right border, its padding and the end of the word — the screenshot in the
round-10 report — while the shorter names were cut by less or not at all, which
is why it read as "the classic mode is broken".

## Two guarantees, on purpose

1. **The box is CSS, and it is bounded.** `planModeChip()` returns `align`
   (`end` when the mascot is on the right, `center` otherwise) and a hard
   `maxWidth`; `ModeChip.tsx` applies both. An absolute element cannot leave a
   container it is aligned against.
2. **The ladder is decided before paint.** When the band is too narrow the label
   «CHẾ ĐỘ CHƠI» goes first — it is decoration, and the button's `title` and
   `aria-label` still say it — then the name shrinks to a 9.5px floor, and only
   then is an ellipsis allowed.

The estimate can be 6% wrong and the chip is still correct, because (1) is what
holds the pixels. That is the point of keeping the two apart: a better estimate
only ever picks a smaller chip, never a clipped one.

## The ladder, measured

`planModeChip({ heroWidth, side: "right", name: "MUỐI DƯA CỔ ĐIỂN", label: "CHẾ ĐỘ CHƠI" })`

| Band | Available | Result |
| --- | --- | --- |
| 1280 | 1264 | `full` — label + name at 11px |
| 640 | 624 | `full` |
| 320 | 288 | `full` — 246px needed |
| 300 | 272 | `full` |
| 280 | 248 | `full` (2px of slack) |
| 260 | 228 | `label-dropped` — the dot and the name survive |
| 200 | 168 | `label-dropped` |
| 150 | 118 | `name-shrunk` |
| 120 | 88 | `ellipsis` at the 9.5px floor |

`estimateText()` is documented at the top of `measure.ts`: per-character advances
for the chip's two faces, ×1.06 for the worst error measured across the seven
locales.

## Reading it in the browser

`ModeChip` stamps three attributes on the button:

| Attribute | Values |
| --- | --- |
| `data-mode-chip` | `full` · `label-dropped` · `name-shrunk` · `ellipsis` |
| `data-mode-chip-align` | `center` · `end` |
| `data-mode-chip-name` | the name's font size in px |

So a screenshot review can answer "why is the label missing here" without opening
React DevTools — the same discipline as `data-adaptive-*` one level up.

## Tests

`tests/mode-chip.test.ts` sweeps the nine mode names × seven locales against
`heroBandWidth()` for every preset, and asserts that `needed ≤ available` whenever
`truncated` is false, that the ellipsis state is the only one that overflows, and
that the classic name survives at every window the app can actually be used in.
