# `src/components/menu/icons/`

Nine icons, one file each, plus a barrel. Every one is a stroke-only SVG at a
24×24 viewBox with `stroke="currentColor"`.

| Icon | Used by |
| --- | --- |
| `PlayIcon` | CHƠI |
| `ContinueIcon` | CHƠI TIẾP |
| `ModesIcon` | CHẾ ĐỘ |
| `TrophyIcon` | BẢNG XẾP HẠNG |
| `MedalIcon` | THÀNH TỰU |
| `GearIcon` | CÀI ĐẶT · PHÍM TẮT |
| `ScrollIcon` | CHANGELOG |
| `InfoIcon` | GIỚI THIỆU |
| `DoorIcon` | THOÁT |
| `index.ts` | the barrel — the only import site for all nine |

## The four rules these follow

1. **Stroke, never fill.** A fill-only icon disappears on the two-pixel border
   of a pressed button; a stroke icon inherits `currentColor` and survives every
   variant.
2. **`stroke-width="2"` and round caps**, matching the panel's own 2px borders.
   An icon at the same weight as the frame around it reads as part of the
   furniture rather than as a sticker.
3. **`aria-hidden="true"` on every one.** None of them is the only label for its
   control — each sits beside a text label — so announcing them would make every
   row read twice.
4. **No `viewBox` scaling above 24.** They are rendered at 20px and 24px only;
   a 48px rendering would expose the missing interior detail that a one-file
   icon at this weight does not have.

## One file each, deliberately

Nine icons in one `icons.tsx` would be ~200 lines and a merge conflict every
time two rows change. One file each means a change to the trophy touches the
trophy. The barrel is the only import site, so `import { TrophyIcon } from
"./icons"` does not name a path that will move.
