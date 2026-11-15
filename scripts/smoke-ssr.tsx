/**
 * Headless render smoke test — renders every menu modal + the StartScreen
 * to static HTML with react-dom/server. Catches runtime render crashes that
 * tsc can't (bad hooks order, undefined lookups, broken i18n keys).
 * Not wired into the bundle; run with: npx vite-node scripts/smoke-ssr.tsx
 */
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import StartScreen from "../src/components/StartScreen";
import ModeChip from "../src/components/menu/ModeChip";
import GameMenu from "../src/components/menu/GameMenu";
import InfoMenu from "../src/components/menu/InfoMenu";
import ModeSelectModal from "../src/components/menu/ModeSelectModal";
import SettingsModal from "../src/components/settings/SettingsModal";
import LeaderboardModal from "../src/components/menu/LeaderboardModal";
import AchievementsModal from "../src/components/menu/AchievementsModal";
import AboutModal from "../src/components/menu/AboutModal";
import ChangelogModal from "../src/components/menu/ChangelogModal";
import QuitModal from "../src/components/menu/QuitModal";
import { DEFAULT_SETTINGS } from "../src/game/settings";
import HowToModal from "../src/components/menu/HowToModal";
import ShortcutsModal from "../src/components/menu/ShortcutsModal";
import PauseScreen from "../src/components/PauseScreen";
import GameOverScreen from "../src/components/GameOverScreen";
import ModeSelector from "../src/components/ModeSelector";
import AchievementsPanel from "../src/components/AchievementsPanel";
import type { RunStats } from "../src/game/engine";
import { planMenuLayout } from "../src/components/menu/layout";

/** The reference plan the SSR fallback also uses (1280×720). */
const PLAN = planMenuLayout({ width: 1280, height: 720 });

const noop = () => {};

/** A run that has actually happened — score, combos and a countdown all set. */
const RUN_STATS: RunStats = {
  score: 4820,
  catches: 37,
  bestCombo: 9,
  level: 4,
  jars: 2,
  sliced: 61,
  time: 84,
};
const scores = [
  { id: "1", name: "TEST", score: 9999, level: 6, jars: 3, combo: 21, date: Date.now() },
];

const html = renderToString(
  createElement(StartScreen as never, {
    scores,
    best: 12345,
    touchMode: false,
    achievements: ["first-catch"],
    mode: "classic",
    onModeChange: noop,
    onStart: noop,
    resume: null,
    onResume: noop,
    settings: DEFAULT_SETTINGS,
    onPatchSettings: noop,
    onChangeLanguage: noop,
    onQuickSettings: noop,
    onResetDefaults: noop,
    onClearAllData: noop,
  } as never),
);
/*
 * Round-4 probe. The wordmark had two bugs that unit tests alone could not see:
 * a gold plate behind `CHÉO` (a `::before` pseudo-element) and a `CHÉO` larger
 * than the `LỌ` above it. Both are geometric, so both are checked here against
 * the markup that actually ships:
 *
 *   · `LỌ` and `CHÉO` must carry an inline font-size (Tailwind cannot generate
 *     a class from a runtime value, so an inline style is the only route that
 *     works — and its absence would mean the word rendered at the inherited
 *     size).
 *   · `CHÉO`'s floor must be below `LỌ`'s floor. This is the one that broke on
 *     phones: at 375px the clamp floor decides the size, not the vw slope.
 *   · no `text-shimmer::before` may survive anywhere in the output.
 */
{
  const lo = html.match(/wordmark-lo[^>]*style="([^"]*)"/i);
  const cheo = html.match(/class="[^"]*text-shimmer[^"]*"[^>]*style="([^"]*)"/i);

  /*
   * The size arrives in one of two forms, and both are legitimate:
   *
   *   px            the adaptive profile fitted the lockup to the band
   *                 (`menu/adaptive/typeScale.ts`); this is what the app ships
   *   clamp(…rem…)  the width-only fallback, used when no profile exists
   *
   * The probe used to read only the second, so the moment the component started
   * carrying the better of the two it failed with "ratio NaN" — a gate that
   * rejects an improvement is worse than no gate, because the fix is to delete
   * the assertion.
   */
  const sizeOf = (style: string | undefined): number => {
    if (!style) return NaN;
    const px = style.match(/font-size:\s*([\d.]+)px/);
    if (px) return Number(px[1]);
    const rem = style.match(/font-size:\s*clamp\(([\d.]+)rem/);
    if (rem) return Number(rem[1]);
    const bare = style.match(/font-size:\s*([\d.]+)rem/);
    return bare ? Number(bare[1]) : NaN;
  };
  const loSize = sizeOf(lo?.[1]);
  const cheoSize = sizeOf(cheo?.[1]);
  const ratio = loSize > 0 && cheoSize > 0 ? cheoSize / loSize : NaN;

  const check = (name: string, pass: boolean, detail = "") => {
    if (!pass) throw new Error(`wordmark probe failed: ${name} ${detail}`);
    console.log("ok", name, detail);
  };
  check("wordmark LỌ has an inline font-size", Boolean(lo) && Number.isFinite(loSize));
  check("wordmark CHÉO has an inline font-size", Boolean(cheo) && Number.isFinite(cheoSize));
  check("CHÉO is smaller than LỌ", ratio < 1, `ratio ${ratio.toFixed(2)}`);
  check("nothing is painted behind the wordmark", !/text-shimmer::before/.test(html));
}

/*
 * ---- mode chip probe -------------------------------------------------------
 *
 * The chip's bug was a class name, so this gate reads the class name. Three bands
 * cover the three things that can go wrong: alignment in the row layout, the
 * width cap, and the early return below the floor.
 */
{
  const chip = (band: number) =>
    renderToString(createElement(ModeChip as never, { mode: "classic", bandWidth: band, side: "right", onOpen: noop } as never));
  const check = (name: string, pass: boolean, detail = "") => {
    if (!pass) throw new Error(`mode chip probe failed: ${name} ${detail}`);
    console.log("ok", name, detail);
  };

  const wide = chip(1088);
  const tight = chip(200);
  const tiny = chip(60);

  check("chip right-aligns in the row layout", wide.includes("right-0") && !wide.includes("-translate-x-1/2"));
  check("chip carries the plan's width cap", wide.includes("max-width:1072px"));
  check("chip keeps its label where it fits", wide.includes('data-mode-chip="full"'));
  check("chip drops the label before the name", tight.includes('data-mode-chip="label-dropped"') && tight.includes("MUỐI DƯA CỔ ĐIỂN"));
  check("chip draws nothing under the floor", tiny === "");
}

console.log("StartScreen html length:", html.length, html.includes("LỌ") || html.includes("L") ? "contains title" : "TITLE MISSING?");

const pieces: Array<[string, () => string]> = [
  ["GameMenu", () => renderToString(createElement(GameMenu as never, { resume: null, achievementsUnlocked: 1, achievementsTotal: 16, onPlay: noop, onResume: noop, onModes: noop, onLeaderboard: noop, onAchievements: noop, onSettings: noop, onHowTo: noop, plan: PLAN } as never))],
  ["InfoMenu", () => renderToString(createElement(InfoMenu as never, { onAbout: noop, onChangelog: noop, onQuit: noop, plan: PLAN } as never))],
  ["ModeSelectModal", () => renderToString(createElement(ModeSelectModal as never, { mode: "classic", onChange: noop, onClose: noop } as never))],
  ["SettingsModal", () => renderToString(createElement(SettingsModal as never, { settings: DEFAULT_SETTINGS, onPatch: noop, onChangeLanguage: noop, onQuickSettings: noop, onResetDefaults: noop, onClearAllData: noop, onClose: noop } as never))],
  ["LeaderboardModal", () => renderToString(createElement(LeaderboardModal as never, { scores, onClose: noop } as never))],
  ["AchievementsModal", () => renderToString(createElement(AchievementsModal as never, { unlocked: ["first-catch"], onClose: noop } as never))],
  ["AboutModal", () => renderToString(createElement(AboutModal as never, { onClose: noop } as never))],
  ["ChangelogModal", () => renderToString(createElement(ChangelogModal as never, { onClose: noop } as never))],
  ["QuitModal", () => renderToString(createElement(QuitModal as never, { onBack: noop } as never))],
  ["HowToModal", () => renderToString(createElement(HowToModal as never, { onClose: noop, touchMode: false } as never))],
  /*
   * The twelfth modal. `StartScreen` opens it at `modal === "shortcuts"`, so it
   * renders for a player and was in no gate: not in this list, and not as a
   * child of anything else that is.
   */
  ["ShortcutsModal", () => renderToString(createElement(ShortcutsModal as never, { onClose: noop } as never))],
  ["HowToModal(touch)", () => renderToString(createElement(HowToModal as never, { onClose: noop, touchMode: true } as never))],
  /*
   * The four screens that were missing. StartScreen and the eleven modals were
   * covered from the beginning; the pause screen, the game-over screen, the
   * mode picker and the achievements panel were not — and those are the
   * screens a player reaches by *playing*, which makes them the ones a render
   * crash would hit hardest.
   */
  ["ModeSelector", () => renderToString(createElement(ModeSelector as never, { mode: "classic", onChange: noop } as never))],
  ["AchievementsPanel", () => renderToString(createElement(AchievementsPanel as never, { unlocked: ["first-catch"], justUnlocked: [] } as never))],
  ["AchievementsPanel(fresh)", () => renderToString(createElement(AchievementsPanel as never, { unlocked: [], justUnlocked: [] } as never))],
  ["PauseScreen", () => renderToString(createElement(PauseScreen as never, {
    stats: RUN_STATS, muted: false, mode: "classic",
    onResume: noop, onRestart: noop, onMenu: noop, onToggleMute: noop,
  } as never))],
  ["GameOverScreen", () => renderToString(createElement(GameOverScreen as never, {
    stats: RUN_STATS, scores, best: 12345, isHigh: true, rank: 1, savedId: null,
    mode: "classic", newAchievements: [], onSave: noop, onRestart: noop, onMenu: noop,
  } as never))],
];
for (const [name, fn] of pieces) {
  const out = fn();
  console.log("ok", name, out.length, "chars");
}
console.log("SMOKE OK");
