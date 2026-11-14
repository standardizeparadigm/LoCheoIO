/**
 * The start screen — v1.1.8.
 *
 * WHAT WAS WRONG
 * --------------
 * The screenshot in the report shows four separate failures, all from one
 * structural mistake: the hero and the chrome were flex siblings competing
 * for the same 720px.
 *
 *   1. `LỌ` was cut off at the top. The hero was inside a nested
 *      `overflow-y-auto` box that centred its content, so once the content
 *      was taller than the box its top sat above the scroll origin and could
 *      not be reached by scrolling. That is the "kéo lên xuống" complaint.
 *   2. The GAME panel ran off the bottom edge, taking `CÀI ĐẶT` with it.
 *   3. The ticker's copyright line was sliced in half.
 *   4. A stray `×` floated in the middle of the screen — the how-to accordion
 *      had a close control, and the accordion itself had scrolled away.
 *
 * WHAT THIS FILE DOES NOW
 * -----------------------
 *   - one scroll container (`.menu-scroll`), content anchored to the top, so
 *     nothing can be pushed out of reach
 *   - the hero keeps a declared height from `planMenuLayout()`
 *   - the chrome is absolutely positioned (MenuChrome) and the hero reserves
 *     its height, so the two cannot fight
 *   - how-to-play is a modal reached from the GAME panel, not an accordion
 *   - the hero is decorated: floating spices, three halo rings, a stage rule
 *
 * The wordmark sits a little above centre rather than dead centre — the
 * report asked for it "ở giữa sau đó kéo lên trên một tí" (centred, then up a
 * bit), which is `justify-start` plus a small top offset inside a hero that
 * is itself vertically centred in whatever height is left.
 */
import { useState } from "react";
import { APP_VERSION } from "../version";
import { MenuBackground } from "./menu/background";
import { fmtNum } from "../i18n/i18n";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n/i18n";
import type { ModeId } from "../game/modes";
import type { ScoreEntry } from "../game/storage";
import { ACHIEVEMENTS } from "../game/achievements";
import type { SavedRun } from "../game/runSave";
import type { GameSettings, SettingLanguage } from "../game/settings";
import {
  GameMenu,
  InfoMenu,
  MenuChrome,
  HowToModal,
  ShortcutsModal,
  ModeSelectModal,
  SettingsModal,
  LeaderboardModal,
  AchievementsModal,
  AboutModal,
  ChangelogModal,
  QuitModal,
} from "./menu";
import { useMenuPlan, useViewportWidth } from "./menu/layout/useMenuPlan";
import { Wordmark } from "./menu/wordmark";
import { TICKER_KEYS } from "./menu/ticker/keys";
import { MenuTicker } from "./menu/ticker/MenuTicker";
import { heroLayout } from "./menu/adaptive";
import { HeroDecor } from "./menu/scene/HeroDecor";
import { JarHalo } from "./menu/scene/JarHalo";
import { JarLogo } from "./ui";

type ModalId =
  | "none"
  | "modes"
  | "settings"
  | "leaderboard"
  | "achievements"
  | "about"
  | "changelog"
  | "quit"
  | "howto"
  | "shortcuts";

export default function StartScreen({
  scores,
  best,
  touchMode,
  achievements,
  mode,
  onModeChange,
  onStart,
  resume,
  onResume,
  settings,
  onPatchSettings,
  onChangeLanguage,
  onQuickSettings,
  onResetDefaults,
  onClearAllData,
}: {
  scores: ScoreEntry[];
  best: number;
  touchMode: boolean;
  achievements: string[];
  mode: ModeId;
  onModeChange: (m: ModeId) => void;
  onStart: () => void;
  resume: SavedRun | null;
  onResume: () => void;
  settings: GameSettings;
  onPatchSettings: (patch: Partial<GameSettings>) => void;
  onChangeLanguage: (lang: SettingLanguage) => void;
  onQuickSettings: (patch: Partial<GameSettings>) => void;
  onResetDefaults: () => void;
  onClearAllData: () => void;
}) {
  const { t, lang } = useI18n();
  const [modal, setModal] = useState<ModalId>("none");
  const closeModal = () => setModal("none");
  const plan = useMenuPlan();
  const viewportWidth = useViewportWidth();
  /*
   * The hero's layout comes from the plan, not from a media query — see
   * `menu/adaptive/hero.ts` for why. Both inputs are live: `plan` re-plans on
   * resize/orientationchange/visualViewport resize, and `viewportWidth` is the
   * width the same re-plan read, so the two can never describe different
   * windows.
   */
  const hero = heroLayout({ scene: plan.scene, width: viewportWidth, minimal: plan.minimal });

  return (
    <div className="absolute inset-0 z-40 overflow-hidden">
      {/* ------- ambient background layers (see background/layers.ts) ------- */}
      <MenuBackground />

      {/*
        NOT A SCROLL CONTAINER. `.menu-pane` is `overflow: clip`, and the
        column below is exactly one window tall:
        `plan.scene + plan.reserve === viewport height`, guaranteed by
        `planMenuLayout()` and asserted by `tests/menu-no-scroll.test.ts`.

        The previous rounds kept this box scrollable and argued about whether
        the bar was visible. That is why the bug kept returning: the content
        was genuinely taller than the window, so hiding the bar only moved the
        symptom. Now there is nothing to scroll.
      */}
      <div className="menu-pane absolute inset-0 z-10">
        {/*
          `height` not `minHeight`: the column is pinned to the window so it
          cannot grow past it, whatever a translation, a font fallback or a
          browser's line-height rounding does. `box-sizing: border-box`
          (Tailwind preflight) keeps `paddingBottom` inside that height, so
          the hero ends exactly where the chrome begins.
        */}
        <div
          className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden px-4 pt-3 sm:px-8"
          style={{ paddingBottom: plan.reserve }}
        >
          {/* ---------- hero: holds the height the plan assigned ---------- */}
          {/*
            The hero is given an explicit height — not a minimum. A `min-height`
            lets content push the column taller than the window, which is the
            exact mechanism that produced every scrollbar in rounds 1 and 2.
            With a height, the hero is a fixed band and any overflow inside it
            is clipped by the column above.
          */}
          <section
            data-hero={plan.minimal ? "minimal" : "full"}
            /*
             * `justify-start`, not `justify-center`.
             *
             * This is the round-5 report. The hero is a fixed-height band with
             * `overflow: hidden`, which is right — but a centred flex column
             * whose content is taller than the band spills out *both* ends.
             * The top edge of `LỌ` then sits above the band and is clipped, so
             * the wordmark appears cut in half at the top of the screen. That
             * happened at 1280×720: the plan gave the hero 342px, and the hero
             * content measured 349.
             *
             * Anchoring to the top changes what happens when content outgrows
             * the band: the overflow now goes to the *bottom*, where it is the
             * deck (decoration) that gives, instead of the wordmark (the whole
             * point of the screen). No viewport can cut `LỌ` this way.
             */
            className="menu-hero relative flex flex-col justify-start"
            style={{
              ["--menu-scene-h" as string]: `${plan.scene}px`,
              height: plan.scene,
            }}
            aria-label={t("app.wordmark")}
          >
            <HeroDecor />

            <div
              className={`relative z-10 flex flex-col items-center gap-4${
                hero.sideBySide ? " lg:flex-row lg:items-center lg:gap-10" : ""
              }`}
              data-hero-layout={hero.sideBySide ? "row" : "stack"}
            >
              {/* ---- title lockup ---- */}
              <div className={`anim-slide w-full flex-1 text-center${hero.sideBySide ? " lg:text-left" : ""}`}>
                <div className={`mb-2 flex flex-wrap items-center justify-center gap-2 ${hero.sideBySide ? "lg:justify-start" : ""}${hero.liveBadge ? "" : " hidden"}`}>
                  <span className="flex items-center gap-1.5 border border-chili-500/50 bg-chili-500/10 px-2 py-0.5">
                    <span className="anim-flicker h-2 w-2 rounded-full bg-chili-500" />
                    <span className="font-body text-[9px] font-extrabold tracking-[0.4em] text-chili-400 uppercase">
                      {t("live.badge")}
                    </span>
                  </span>
                  <span className="font-body text-[9px] font-bold tracking-[0.3em] text-jade-500 uppercase">
                    {t("menu.arcade")} · v{APP_VERSION}
                  </span>
                </div>

                {/* The wordmark: centred, then lifted a little — the report's "kéo lên trên một tí". */}
                {/*
                  The lockup lives in `menu/wordmark/` now: two bugs in this
                  patch came from it (the covered `nặng` and the oversized
                  `CHÉO`), and a named component with its own scale module and
                  test file is easier to keep honest than 30 inline lines.
                */}
                <Wordmark lo={t("app.wordmarkLo")} cheo={t("app.wordmarkCheo")} label={t("app.wordmark")} />

                {hero.badgeRow && (
                  <div
                    className={`mt-3 flex flex-wrap items-center justify-center gap-3${
                      hero.sideBySide ? " lg:justify-start" : ""
                    }`}
                  >
                    <span className="inline-block -rotate-2 border-[3px] border-jade-950 bg-chili-500 px-3 py-1 font-display text-[11px] tracking-[0.2em] text-clay-100 hard-shadow-sm sm:text-xs">
                      {t("brand.badge")}
                    </span>
                    <span className="font-body text-xs font-semibold tracking-wide text-brine-300">
                      {t("menu.best")}{" "}
                      <b className="font-display text-sm text-tumeric-400 tabular-nums">{fmtNum(best, lang)}</b>
                    </span>
                  </div>
                )}

                {/*
                  ROUND 5: the tagline moved out of the hero and into
                  `menu/about/` as the top section of the «GIỚI THIỆU» modal.

                  It was three lines of prose in the middle of a fixed-height
                  band, and the band had to pay for it: 75px of tagline is 75px
                  that the wordmark and the deck were competing for, on a
                  screen whose height is decided by the chrome, not by this
                  paragraph. On a 1290×720 window it was the difference between
                  showing `LỌ` and cutting it.

                  Nothing is lost. The text is not decoration — it explains the
                  whole game — so it does not go away; it moves to a place with
                  room to read it, reachable from the INFO panel.
                */}

                {/*
                  v1.1.8: the "hoặc nhấn ENTER" hint used to sit here.

                  The report asked for it to go. It had to: nothing on this
                  screen ever listened for Enter. The only `key === "Enter"`
                  handler in the codebase is on GameOverScreen ("chơi lại"),
                  so the label advertised a shortcut that was never written —
                  deleting it removes a false claim, not a feature.

                  (An earlier draft of this comment said pressing ENTER did
                  start the game. It does not; that claim was wrong and is
                  corrected here so the next reader is not misled by it.)
                */}
                {hero.badgeRow && <div className={`hero-rule mx-auto mt-5 w-40${hero.sideBySide ? " lg:mx-0" : ""}`} />}

                {/*
                  ROUND 6: the deck is GONE — this is the «chỗ ở hình 3» the
                  report points at.

                  It was three columns of prose (mode blurb, daily challenge,
                  rule of the day) sitting inside a fixed-height hero. At every
                  height the chrome allowed, the three columns needed more room
                  than the band had: at 1920×1080 the right column's rule text
                  was clipped mid-sentence, and at 1920×820 the whole deck row
                  was underneath the corner panels. A band cannot hold three
                  paragraphs and a 200px wordmark at the same time; something
                  had to stop being a paragraph.

                  What it carried is not lost, and none of it was only here:

                    · the mode is printed on the chip under the mascot, and the
                      full list is a modal away in GAME;
                    · the challenge is in the INFO panel's summary now, with its
                      mode and target — see `menu/panel/summary.ts`;
                    · the rule of the day is one line of the how-to modal, which
                      was always the complete version of the same six rules.

                  Deleting the band is what lets the hero be *only* the wordmark,
                  the badge and the record — which is what the layout needs to
                  fit at every size without clipping anything.
                */}
              </div>

              {/* ---- mascot ---- */}
              <div className={`anim-pop relative flex shrink-0 items-center justify-center${hero.mascot ? "" : " hidden"}`}>
                <div className={`relative flex items-center justify-center ${hero.sideBySide ? "h-40 w-40 sm:h-48 sm:w-48 xl:h-60 xl:w-60" : "h-32 w-32"}`}>
                  {hero.halo && <JarHalo />}
                  <JarLogo className="anim-bob anim-breathe jar-glow relative z-10 h-32 w-auto sm:h-40 xl:h-48" mood="happy" />
                </div>
                {!plan.minimal && (
                <button
                  type="button"
                  onClick={() => setModal("modes")}
                  title={t("game.modes")}
                  className="press hard-shadow-sm group absolute -bottom-1 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 border-[3px] border-jade-700 bg-jade-950/90 px-3 py-1.5 whitespace-nowrap transition-colors hover:border-tumeric-500"
                >
                  <span className="h-2 w-2 rounded-full bg-tumeric-500 transition-transform group-hover:scale-125" aria-hidden="true" />
                  <span className="font-body text-[8px] font-extrabold tracking-[0.2em] text-jade-500 uppercase">
                    {t("game.modes")}
                  </span>
                  <span className="font-display text-[11px] tracking-[0.06em] text-tumeric-400">
                    {t(`mode.${mode}.name` as MessageKey)}
                  </span>
                </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ---- floating chrome: corner panels + ticker, out of the flex flow ---- */}
      <MenuChrome reserve={plan.reserve}>
        <div
          className={`flex w-full items-end px-2 pb-0 sm:px-3 ${
            plan.stacked ? "flex-col gap-2" : "justify-between gap-2"
          }`}
        >
          <GameMenu
            resume={resume}
            achievementsUnlocked={achievements.length}
            achievementsTotal={ACHIEVEMENTS.length}
            onPlay={onStart}
            onResume={onResume}
            onModes={() => setModal("modes")}
            onLeaderboard={() => setModal("leaderboard")}
            onAchievements={() => setModal("achievements")}
            onSettings={() => setModal("settings")}
            onHowTo={() => setModal("howto")}
            plan={plan}
          />
          <InfoMenu
            onAbout={() => setModal("about")}
            onShortcuts={() => setModal("shortcuts")}
            onChangelog={() => setModal("changelog")}
            onQuit={() => setModal("quit")}
            plan={plan}
          />
        </div>
        {plan.ticker && <MenuTicker keys={TICKER_KEYS} version={APP_VERSION} />}
      </MenuChrome>

      {/* ---- modals ---- */}
      {modal === "howto" && <HowToModal onClose={closeModal} touchMode={touchMode} />}
      {modal === "shortcuts" && <ShortcutsModal onClose={closeModal} />}
      {modal === "modes" && <ModeSelectModal mode={mode} onChange={onModeChange} onClose={closeModal} />}
      {modal === "settings" && (
        <SettingsModal
          settings={settings}
          onPatch={onPatchSettings}
          onChangeLanguage={onChangeLanguage}
          onQuickSettings={onQuickSettings}
          onResetDefaults={onResetDefaults}
          onClearAllData={onClearAllData}
          onClose={closeModal}
        />
      )}
      {modal === "leaderboard" && <LeaderboardModal scores={scores} onClose={closeModal} />}
      {modal === "achievements" && <AchievementsModal unlocked={achievements} onClose={closeModal} />}
      {modal === "about" && <AboutModal onClose={closeModal} />}
      {modal === "changelog" && <ChangelogModal onClose={closeModal} />}
      {modal === "quit" && <QuitModal onBack={closeModal} />}
    </div>
  );
}
