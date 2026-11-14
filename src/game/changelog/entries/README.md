# `src/game/changelog/entries/`

One file per release, ten of them, newest first in `../index.ts`.

| File | Version | Tier | Date |
| --- | --- | --- | --- |
| `v1_1_8.ts` | 1.1.8 | 🟣 patch | 2026-11-13 |
| `v1_1_7.ts` | 1.1.7 | 🟣 patch | 2026-11-12 |
| `v1_1_6.ts` | 1.1.6 | 🟣 patch | 2026-11-10 |
| `v1_1_5.ts` | 1.1.5 | 🟣 patch | 2026-11-09 |
| `v1_1_4.ts` | 1.1.4 | 🟣 patch | 2026-11-06 |
| `v1_1_3.ts` | 1.1.3 | 🟣 patch | 2026-11-04 |
| `v1_1_2.ts` | 1.1.2 | 🟣 patch | 2026-11-02 |
| `v1_1_1.ts` | 1.1.1 | 🟣 patch | 2026-10-30 |
| `v1_1_0.ts` | 1.1.0 | 🟡 minor | 2026-10-29 |
| `v1_0_0.ts` | 1.0.0 | 🩷 major | 2026-10-26 |

The tier column is **derived** by `tierFor()` and shown here only for reading.
It is not a field in the files.

## Two languages per file, and why they must stay the same length

Every entry has `itemsVi` and `itemsEn`. The panel renders one list at a time and
switches on the active language, so a mismatch is invisible in both languages:
the vi reader sees a full list, the en reader sees a full list, and a bullet that
exists only in one is simply not there for the other reader.

`tests/changelog-tiers.test.ts` asserts `itemsVi.length === itemsEn.length` and
that both are at least five. v1.1.8 is 41 and 41.

## Naming

`v1_1_8.ts`, not `v1.1.8.ts`: a dot in a module specifier works but the import
line becomes `from "./entries/v1.1.8"`, which looks like a file extension and
confuses every tool that guesses by suffix. Underscores are ugly and unambiguous.

## Writing a new entry

1. Copy the newest file, change `version`, `date`, `vi`, `en`.
2. Write the bullets **in Vietnamese first**, then translate — the reverse order
   produces English-shaped Vietnamese.
3. Keep the two lists the same length.
4. Import it at the top of `../index.ts` and place it first in the array.

Step 4 is order-sensitive: the array is the render order and
`tests/changelog.test.ts` asserts strictly descending versions *and* dates.
