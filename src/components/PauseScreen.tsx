import type { RunStats } from "../game/engine";
import { modeConfigFor, type ModeId } from "../game/modes";
import { useI18n } from "../i18n/useI18n";
import { APP_VERSION } from "../version";
import { fmtNum } from "../i18n/i18n";
import type { MessageKey } from "../i18n/i18n";
import { GameButton, Keycap, Panel, Stat } from "./ui";
import { fmtCountdown, fmtTime } from "../utils/time";
import { useAdaptive } from "./menu/adaptive";

export default function PauseScreen({
  stats,
  muted,
  mode,
  onResume,
  onRestart,
  onMenu,
  onToggleMute,
}: {
  stats: RunStats;
  muted: boolean;
  mode: ModeId;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onToggleMute: () => void;
}) {
  const { t, lang } = useI18n();
  // Sized from the window, not from two Tailwind breakpoints (see GameOverScreen).
  const { type } = useAdaptive();
  const timeLimit = modeConfigFor(mode).timeLimit;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto px-4 py-6">
      <div className="pointer-events-none absolute inset-0 bg-jade-950/70 backdrop-blur-[2px]" />
      <Panel className="anim-pop relative w-full max-w-md p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-body text-[10px] font-extrabold tracking-[0.34em] text-jade-500 uppercase">
              {t("pause.kicker")}
            </span>
            <h2
              className="font-display leading-none text-tumeric-400"
              style={{ fontSize: Math.round(type.overScore * 0.85 * 2) / 2, textShadow: "4px 4px 0 #061a1a" }}
            >
              {t("pause.title")}
            </h2>
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-block border px-1.5 py-0.5 font-display text-[8px] tracking-[0.18em]"
                style={{ borderColor: modeConfigFor(mode).accent, color: modeConfigFor(mode).accent }}
              >
                {t(`mode.${mode}.name` as MessageKey)}
              </span>
              {/* elapsed run time — was only visible after the run ended.
                  Timed modes show what is LEFT instead, which is the number
                  the player is actually racing. */}
              <span className="inline-block border border-jade-700 px-1.5 py-0.5 font-body text-[9px] font-extrabold tracking-[0.14em] text-clay-100/70 tabular-nums">
                {timeLimit ? `${fmtCountdown(timeLimit - stats.time)} ${t("pause.leftSuffix")}` : fmtTime(stats.time)}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? t("mute.turnOn") : t("mute.turnOff")}
            className="press flex h-10 w-10 items-center justify-center border-[3px] border-jade-700 bg-jade-900 text-brine-300 hard-shadow-sm"
          >
            {muted ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                <path d="M17 9l4 6M21 9l-4 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                <path d="M17 8.5a5 5 0 010 7M20 6a9 9 0 010 12" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label={t("pause.score")} value={fmtNum(stats.score, lang)} accent="text-tumeric-400" />
          <Stat label={t("pause.catches")} value={stats.catches} accent="text-brine-300" />
          <Stat label={t("pause.bestCombo")} value={`×${stats.bestCombo}`} accent="text-chili-400" />
          <Stat label={t("pause.levelJars")} value={`${stats.level} / ${stats.jars}`} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <GameButton size="lg" onClick={onResume} className="flex-1">
            {t("pause.resume")}
          </GameButton>
          <GameButton size="lg" variant="ghost" onClick={onRestart}>
            {t("pause.restart")}
          </GameButton>
          <GameButton size="lg" variant="ink" onClick={onMenu}>
            {t("pause.menu")}
          </GameButton>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-dashed border-jade-800 pt-3 font-body text-[11px] font-bold tracking-wider text-clay-100/60">
          <span className="flex items-center gap-1.5">
            <Keycap>P</Keycap> / <Keycap wide>ESC</Keycap> {t("pause.hintResume")}
          </span>
          <span className="flex items-center gap-1.5">
            <Keycap wide>SPACE</Keycap> {t("pause.hintSlam")}
          </span>
          <span className="flex items-center gap-1.5">
            <Keycap>M</Keycap> {t("pause.hintMute")}
          </span>
        </div>

        <div className="mt-4 flex justify-center border-t-2 border-dashed border-jade-800 pt-3">
          <span className="font-body text-[9px] font-bold tracking-[0.3em] text-jade-700 uppercase">
            v{APP_VERSION} · AGPL-3.0
          </span>
        </div>
      </Panel>
    </div>
  );
}
