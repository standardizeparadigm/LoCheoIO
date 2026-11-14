# `src/components/settings/`

The six-section settings modal. One file per section, two shared controls, and a
shell that owns the draft/commit boundary.

| File | Job |
| --- | --- |
| `SettingsModal.tsx` | the shell: six sections, the draft, the Save/Cancel footer |
| `SettingsSection.tsx` | the titled box every section is wrapped in |
| `PresetsSection.tsx` | the named presets, and a warning when the current values match none |
| `AudioSection.tsx` | sfx / music, each a switch plus a volume stepper |
| `DisplaySection.tsx` | shake, reduced motion, and the two display toggles |
| `LanguageSection.tsx` | the seven UI locales |
| `BackupSection.tsx` | export a settings string, import one |
| `DataSection.tsx` | the destructive half: reset progress, clear scores, wipe everything |
| `SegmentedControl.tsx` | `role="radiogroup"` — a small set of mutually exclusive choices |
| `VolumeStepper.tsx` | `role="slider"` with the full keyboard contract |
| `index.ts` | the barrel |

## The draft boundary

`SettingsModal` holds a **copy** of the settings while it is open and writes once,
on Save. Nothing under it calls `saveSettings()`.

That decision costs one `useState` and buys three things:

1. **Cancel is honest.** Escape restores the previous values because they were
   never overwritten — there is no undo to write.
2. **The audio sliders do not write on every drag frame.** A range input fires
   `onChange` continuously; with direct writes that is ~200 `localStorage.setItem`
   calls per drag, each synchronous.
3. **Import is atomic.** A pasted backup blob is parsed into the draft and
   validated once; a failure leaves the open modal untouched. Writing field by
   field would leave a half-imported state on a malformed blob.

## Two controls, and why those two

The section count grew from 4 toggles to 6 sections, and the temptation was to
add a component per section. Two shared controls instead:

    SegmentedControl   three or fewer mutually exclusive choices   (presets, language)
    VolumeStepper      a bounded integer with a visible value      (sfx, music)

Everything else is a `Switch` from `ui/`. The rule: **a new control type needs
three call sites**, otherwise it is a `Switch` with extra steps. The settings
schema also stays flat — nested settings mean a migration for every shape
change, and `storage-migrate.test.ts` exists because that arithmetic is where
save formats break.

## Accessibility, because this is the modal people tab through

- `SegmentedControl` is `role="group"` + `aria-labelledby`, with one toggle
  button per option (`aria-pressed`), **and** the full roving behaviour:
  `tabIndex={active ? 0 : -1}`, arrow keys move the selection, `Home`/`End` jump
  to the ends.

  It is not `role="radiogroup"`, and the distinction is narrower than it looks —
  the keyboard model is identical. `radiogroup` promises `aria-checked` on a
  radio, and this renders `<button aria-pressed>`; announcing "radio button,
  checked, 2 of 3" while the DOM says "button, pressed" is a disagreement between
  the tree and the announcement. `group` plus `aria-pressed` says exactly what is
  there, and the arrow keys still work.
- `VolumeStepper` is a pair of labelled `−`/`+` buttons around a `role="img"`
  read-out (`aria-label="<label> 40/100"`), not a `role="slider"`. Same reason:
  a slider role promises `aria-valuenow` and arrow keys, and a stepper with two
  buttons does not have either.
- The destructive section requires two presses, and the confirm state resets if
  the modal is closed — a "are you sure" that survives reopening is not a
  confirmation.
