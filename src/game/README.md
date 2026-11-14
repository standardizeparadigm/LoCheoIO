# `src/game/`

Rules, storage and progression. **No React in this folder** — enforced by
`tests/barrels.test.ts`.

| File | Owns |
| --- | --- |
| `engine.ts` | The tick loop: spawn, move, collide, score |
| `spawn.ts` | Weighted spawn tables |
| `modes.ts` / `modesIndex.ts` | Mode ordering and lookup |
| `modes/*.ts` | The nine play modes, one file each |
| `settings.ts` | Settings schema, defaults, normalisation, persistence |
| `settingsIO.ts` | Import/export of a settings blob |
| `settingsPresets.ts` | The named presets in the settings panel |
| `runSave.ts` | The resumable run |
| `storage.ts` | Namespaced `localStorage` with a migration chain |
| `safeStorage.ts` | The wrapper that survives private mode and a full quota |
| `achievements.ts` | Definitions and the unlock check |
| `palette.ts` | Colour weights for the tiles |
| `audioLevels.ts` | The volume curve |

## Layering

```
settings / storage  ←  engine  ←  runSave
        ↑                ↑
     modes/*         palette / spawn
```

Nothing here imports a component, and nothing here reads `window` except through
`safeStorage` and `audio`. That keeps the whole folder runnable in a test with no
DOM, which is why the suite is fast.

## Reading old data

Nothing on disk is trusted. `loadSettings`, `loadSavedRun`, `loadScores` and
`loadProgress` all pass whatever came out of storage through a `normalize…`
function that returns a known-good value when the input is missing, the wrong
type, or from an older shape. There is no version number to branch on: the
normaliser simply fills in defaults for fields that are absent and drops fields
it does not recognise, so a blob written by 1.1.2 loads in 1.1.8 and a blob
written by 1.1.8 loads in 1.1.2 with the extra field ignored.

`tests/storage-migrate.test.ts` feeds each loader the shapes earlier releases
actually wrote, including truncated and hand-edited blobs.

## Modules added after this README was written

The table above stopped at v1.1.5 and four files have landed since. They are
listed here rather than inserted into the table because the sorting matters
less than the note on each:

| File | Why it exists |
| --- | --- |
| `audio.ts` | The WebAudio graph: one `AudioContext`, lazily created, and the mute gate |
| `modeMath.ts` | Every per-mode number the HUD shows, clamped in one place (`saneInt`) |
| `modeTypes.ts` | `ModeId` and the type guard — `isModeId()` |
| `index.ts` | The barrel; no logic, and deliberately never imported by the app |

### `modeMath.ts` deserves the paragraph

It exists because `state.score` once rendered as the string **"NaN"** and never
recovered: `NaN + x` is `NaN`, so one bad frame poisoned the score for the rest
of the run and every HUD row derived from it.

The fix was not one clamp but a *location*: every number a mode contributes to
the HUD goes through `saneInt()` here, and `tests/mode-math.test.ts` covers 25
cases including `NaN`, `±Infinity`, and `undefined` from a corrupt save.

It is the same story as `modeTypes.ts`: `isModeId("toString")` returned `true`
before the guard, because `"toString" in MODES` walks the prototype chain. A
restored run could therefore name a mode that does not exist.

### What is *not* in this folder

`daily/` and `changelog/` sit here because their output is game content, but
neither is part of the engine: `daily/` is a pure function of the local date and
`changelog/` is a read-only data set. Both have their own README.

`storage/` is here for a different reason: it is not game content, it is the
**persistence** of it. It sits under `game/` because the record shapes
(`ScoreEntry`, `Progress`) are game types, and it is a folder rather than a file
because the three record kinds have three different invariants — a bounded top-8
list, a set of counters, and a merge-only set of ids — that were previously
sharing one module because they shared one storage layer. `storage.ts` remains
as a re-export so that the forty-odd imports of `../game/storage` keep working.
