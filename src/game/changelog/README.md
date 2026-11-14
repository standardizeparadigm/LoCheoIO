# `src/game/changelog/`

The in-game changelog: ten release entries, a tier derivation, and the copy
selector. It is data plus two pure functions — no React, no storage, no clock.

| File | What it is |
| --- | --- |
| `types.ts` | `ChangelogEntry`, `ReleaseTier`, and `copyFor()` which picks vi/en |
| `tiers.ts` | `tierFor()` — SemVer → `major`/`minor`/`patch`; plus the chip order and label keys |
| `index.ts` | the ordered array, newest first; the only import surface |
| `entries/v*.ts` | one file per release, each with a Vietnamese and an English bullet list |

## Why one file per release

A changelog entry is a *document*: forty bullets, two languages, and a date. In
one array it is unreadable in review and the diff for a new release touches a
file that already has nine hundred lines. As separate modules, adding v1.1.9 is
one new file plus one import, and the diff for a correction to v1.1.3 is three
lines.

## The tier is derived, never typed

An entry stores `version: "1.1.8"` and the chip on screen comes from
`tierFor(version)`. There is no `tier:` field to get out of sync — which is the
whole reason the field does not exist.

    major   x.0.0     pink      a feature wave
    minor   x.y.0     gold      an upgrade
    patch   x.y.z     purple    fixes

`tierFor` parses **strictly** (`^\d+\.\d+\.\d+$`, then `Number.isSafeInteger`).
It used `Number.parseInt`, which reads a numeric prefix and accepts `0x` and
`1e1` notation, so `"0x10.0.0"` became `0.0.0` and returned **major** — junk
degrading to the loudest label instead of the quietest. See the commit that
fixed it and the four tests that now pin it.

## Dates

`date: "YYYY-MM-DD"` and the entries are in strict descending order — the array
order *and* the dates. `tests/changelog.test.ts` asserts both, plus that no date
is in the future relative to the newest entry, because a changelog whose dates
contradict its own order is a changelog nobody trusts.

The v1.1.x chain is deliberately uneven — features on Mondays, hotfixes the
next day, cleanups at the end of the week — and ends on the release day:

    1.0.0 10-26 · 1.1.0 10-29 · 1.1.1 10-30 · 1.1.2 11-02 · 1.1.3 11-04
    1.1.4 11-06 · 1.1.5 11-09 · 1.1.6 11-10 · 1.1.7 11-12 · 1.1.8 11-13

## The bullet-count rule

`itemsVi` and `itemsEn` must be the same length. The panel renders one list at a
time and switches on language, so a mismatch is invisible in both languages —
the vi reader sees 41 bullets and the en reader sees 41, but a vi bullet that was
never translated simply does not exist for the en reader and nobody notices.

`tests/changelog-tiers.test.ts` asserts the two lengths are equal and that every
entry has at least five bullets. Both lists in v1.1.8 are 41.
