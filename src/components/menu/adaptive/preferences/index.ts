/**
 * `adaptive/preferences/` — what the player asked the system for.
 *
 * Two named values, one place that computes them, one place that turns them into
 * CSS variables and one that turns them into `data-*` attributes. See
 * `README.md` for why the profile carries them at all.
 */
export type { ContrastPreference, MotionPreference, Preferences } from "./preferences";
export {
  CONTRAST_PREFERENCES,
  DEFAULT_PREFERENCES,
  MOTION_PREFERENCES,
  describePreferences,
  preferenceAttributes,
  preferenceVars,
  preferencesFor,
} from "./preferences";
