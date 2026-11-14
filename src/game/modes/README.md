# `src/game/modes/`

The nine balance records, one file each. Until v1.1.7 these were a 255-line
object literal in `src/game/modes.ts`; the folder exists so a balance tweak is
one record and one diff instead of nine numbers inside one table.

| File | Mode | Its one distinguishing idea |
| --- | --- | --- |
| `classic.ts` | MUỐI DƯA CỔ ĐIỂN | the reference row — every multiplier is `1` |
| `zen.ts` | THẢNH THƠI | `hazardMult: 0`; spawns 8% *denser* to compensate for the lower speed |
| `inferno.ts` | ỚT LỬA | hazards outweigh catches 1.8:1 |
| `blitz.ts` | ĐUA 60 GIÂY | `timeLimit: 60` — the only mode with a clock |
| `goldrush.ts` | MÙA VÀNG | `goldMult: 2.6`; spawn thinned to `0.95`, not `1` |
| `storm.ts` | MƯA DƯA | densest rain in the game (`spawnMult: 0.72`) |
| `hardcore.ts` | GỐM MỎNG | `maxCracks: 1` — one miss ends the run |
| `combo.ts` | LỄ HỘI COMBO | `comboWindowMult: 2`, and it is *harsher* elsewhere, not easier |
| `feast.ts` | ĐẠI TIỆC DƯA | `jarBonusMult: 2.5`, fewest hazards, densest jars |

## `index.ts`

A one-line barrel: `export * from "./<id>"` for the nine records, in catalogue
order. `src/game/modesIndex.ts` imports it and builds `MODES` / `MODE_LIST` from
it — keeping the barrel here means adding a tenth record means touching this file
and the order list, and nothing else.

## What belongs in a record

A record is a `ModeConfig` and nothing else — no functions, no imports beyond the
type, no engine references. Every field is a plain number or string so that
`tests/modes-balance.test.ts` can compare two records field by field and
`tests/modes-balance-doc.test.ts` can read the same numbers out of the design
document's table.

**Change balance here, never in the engine.** `src/game/engine.ts` reads the
fields; it does not know any mode by name.

## Two rules the tests enforce

1. **Order is data.** `modesIndex.ts` assembles the records into `MODE_LIST` in
   the order the menu shows them, and `tests/modes-split.test.ts` pins that
   order. Reordering the array reorders the menu.

2. **The document must agree.** `docs/design/modes-balance.md` prints all four
   multipliers for all nine modes and says in bold that it must match. It did not
   — four rows had drifted — until `tests/modes-balance-doc.test.ts` started
   reading both sides. If you change a record, that test names the row.

## Adding a mode

Four places, and the compiler finds three of them: `modeTypes.ts` (`ModeId`),
a new record here, `modesIndex.ts` (`MODE_LIST`), plus a `rules` line in each of
the seven UI locales. The fourth is the one a type cannot catch.
