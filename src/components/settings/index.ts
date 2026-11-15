/*
 * `components/settings/` — the settings modal and its six sections.
 *
 * This barrel is deliberately the *whole* surface of the folder: a screen that
 * needs settings imports `SettingsModal` from here and never reaches into
 * `AudioSection` or `VolumeStepper`. Those are exported only because the
 * section registry iterates them, and because `settings-wiring.test.ts` checks
 * that every field the settings object persists has a control somewhere in
 * this list.
 *
 * The one-way dependency is the point: `game/settings.ts` knows about fields,
 * `components/settings/` knows about controls, and this file is the only place
 * that knows both exist.
 */
export { default as SettingsModal } from "./SettingsModal";
export { default as SettingsSection } from "./SettingsSection";
export { default as SegmentedControl } from "./SegmentedControl";
export { default as VolumeStepper } from "./VolumeStepper";
export { default as AudioSection } from "./AudioSection";
export { default as DisplaySection } from "./DisplaySection";
export { default as LanguageSection } from "./LanguageSection";
