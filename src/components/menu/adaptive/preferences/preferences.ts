/**
 * What the player asked for, as two named values.
 *
 * WHY THIS IS A MODULE AND NOT TWO BOOLEANS ON THE PROFILE
 * -------------------------------------------------------
 * `Environment` already carries `reducedMotion`, and the app already writes
 * `data-reduced-motion` / `data-contrast` attributes that `index.css` keys off —
 * but the *profile* never saw either. Three consequences, all of them real:
 *
 *  - the settings switch «Giảm chuyển động» reached the canvas (`GameCanvas` sets
 *    the attribute on its own element) and **not the menu**, so the hero kept
 *    bobbing and the halo kept rotating while the game itself went still;
 *  - `prefers-contrast: more` was read by `App.tsx` for the root element and by
 *    nothing else, so no part of the adaptive tree could report it;
 *  - every screenshot-diagnosis tool had to ask the DOM for two attributes to
 *    know what the player had asked for, and the audit could not see it at all.
 *
 * Naming them once — `motion: "full" | "reduced"`, `contrast: "normal" | "more"` —
 * gives the profile one field per question, gives CSS one attribute per answer
 * (see `adaptiveAttributes()`), and gives `constraints.ts` something it can
 * cross-check against the CSS variables the profile publishes.
 *
 * The two sources are OR-ed, never AND-ed: the operating system asks for less
 * motion and the player asks for less motion, and either one is enough. A player
 * who turns the setting *off* on a machine whose OS asks for reduced motion still
 * gets reduced motion, because the OS preference is an accessibility statement
 * about the person, not a default the app may overrule.
 */

import type { Environment } from "../environment";

/** `reduced` means every decorative animation stops. */
export type MotionPreference = "full" | "reduced";

/** `more` means body copy and borders are lifted for legibility. */
export type ContrastPreference = "normal" | "more";

/** The two preferences, as one value. */
export interface Preferences {
  motion: MotionPreference;
  contrast: ContrastPreference;
}

/** The default: the desktop browser that reports nothing. */
export const DEFAULT_PREFERENCES: Preferences = { motion: "full", contrast: "normal" };

/** Every value `motion` can take — used by the contract and the docs test. */
export const MOTION_PREFERENCES: readonly MotionPreference[] = ["full", "reduced"];

/** Every value `contrast` can take. */
export const CONTRAST_PREFERENCES: readonly ContrastPreference[] = ["normal", "more"];

/**
 * Resolve the two preferences from the environment and the player's setting.
 *
 * `playerReducedMotion` is `settings.reducedMotion` — a *third* source, because
 * the setting can be on while the OS says nothing. `unknown` in, a named value
 * out: the settings file is user-editable JSON, so the argument is not trusted.
 */
export function preferencesFor(
  env: Environment = { dpr: 1, landscape: true, coarse: false, insetTop: 0, insetRight: 0, insetBottom: 0, insetLeft: 0, reducedMotion: false, moreContrast: false },
  playerReducedMotion: unknown = false,
): Preferences {
  const os = env.reducedMotion === true;
  const player = playerReducedMotion === true;
  const more = env.moreContrast === true;
  return {
    motion: os || player ? "reduced" : "full",
    contrast: more ? "more" : "normal",
  };
}

/**
 * The preferences as CSS custom properties.
 *
 * Published so a rule can be written against the *value* rather than guessed
 * from a media query, and so `css-vars-complete` can assert that the profile's
 * own field and its own variable say the same thing. A profile that claims
 * `motion: "reduced"` while publishing `--adaptive-motion: full` is exactly the
 * kind of silent disagreement this folder keeps finding.
 */
export function preferenceVars(prefs: Preferences): Record<string, string> {
  return {
    "--adaptive-motion": prefs.motion,
    "--adaptive-contrast": prefs.contrast,
  };
}

/**
 * The preferences as `data-*` attributes.
 *
 * Two spellings on purpose, and only one of them is new:
 *
 *  - `data-adaptive-motion` / `data-adaptive-contrast` always exist, carry the
 *    resolved value, and are what a screenshot diagnosis reads;
 *  - `data-reduced-motion="true"` / `data-contrast="more"` are the *existing*
 *    hooks `index.css` already selects on (rounds 5 and 9). They are emitted only
 *    when the preference is on, so no rule that predates this module changes
 *    behaviour: the menu subtree now simply carries the same hooks the game
 *    canvas has carried since round 5.
 */
export function preferenceAttributes(prefs: Preferences): Record<string, string> {
  const out: Record<string, string> = {
    "data-adaptive-motion": prefs.motion,
    "data-adaptive-contrast": prefs.contrast,
  };
  if (prefs.motion === "reduced") out["data-reduced-motion"] = "true";
  if (prefs.contrast === "more") out["data-contrast"] = "more";
  return out;
}

/** One line for a log or a diagnostic strip. */
export function describePreferences(prefs: Preferences): string {
  return `motion ${prefs.motion} · contrast ${prefs.contrast}`;
}
