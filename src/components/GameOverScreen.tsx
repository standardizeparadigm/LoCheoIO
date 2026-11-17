import { useEffect, useRef, useState } from "react";
import type { AchievementDef } from "../game/achievements";
import type { RunStats } from "../game/engine";
import { modeConfigFor, type ModeId } from "../game/modes";
import { fmtNum } from "../i18n/i18n";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n/i18n";
import type { ScoreEntry } from "../game/storage";
import { fmtTime } from "../utils/time";
import { GameButton, JarLogo, Keycap, Panel, ScoreBoard, Stat } from "./ui";
import { useAdaptive } from "./menu/adaptive";

export default function GameOverScreen({
  stats,
  scores,
  best,
  isHigh,
  rank,
  savedId,
  mode,
  newAchievements,
  onSave,
  onRestart,
  onMenu,
}: {
  stats: RunStats;
  scores: ScoreEntry[];
  best: number;
  isHigh: boolean;
  rank: number;
  savedId: string | null;
  mode: ModeId;
  newAchievements: AchievementDef[];
  onSave: (name: string) => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const { t, lang } = useI18n();
  /*
   * The headline used `text-[clamp(2.6rem,9vw,5rem)]` — width-only, like every
   * other title in v1.1.7. A 1920×500 window therefore drew a 5rem «KẾT THÚC»
   * that filled the screen. The adaptive table caps it by the shorter axis.
   */
  const { type } = useAdaptive();
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDone(false);
    setName("");
    /*
     * The focus is deferred so it lands after the screen has finished animating
     * in. The timer is cancelled on unmount: a player can press "menu" inside
     * those 420ms, and the callback would then run against a component that no
     * longer exists — harmless with the optional chain, but it also means the
     * effect's cleanup does not match its setup, which is the shape that turns
     * into a real leak the next time someone touches this.
     */
    if (!isHigh) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 420);
    return () => window.clearTimeout(id);
  }, [isHigh, stats.score]);

  const submit = () => {
    if (done) return;
    onSave((name.trim() || t("save.anonymous")).slice(0, 10).toUpperCase());
    setDone(true);
  };

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto overscroll-contain">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_0%,rgba(184,31,34,0.28)_0%,rgba(6,26,26,0.88)_55%,#061a1a_100%)]" />

      <div className="relative mx-auto flex min-h-full w-full max-w-6xl items-center gap-6 px-4 py-8 sm:px-8">
        <div className="grid w-full items-center gap-6 lg:grid-cols-12">
          <div className="anim-pop lg:col-span-7">
            <div className="flex items-center gap-3">
              <JarLogo mood="hurt" className="h-16 w-auto shrink-0 sm:h-20" />
              <div>
                <span className="font-body text-[10px] font-extrabold tracking-[0.34em] text-chili-400 uppercase">
                  {t("gameover.kicker")}
                </span>
                <h2
                  className="font-display leading-[0.85] text-chili-500"
                  style={{ fontSize: type.overScore, textShadow: "5px 5px 0 #061a1a" }}
                >
                  {t("gameover.title")}
                </h2>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span
                className="inline-block border px-2 py-0.5 font-display text-[9px] tracking-[0.18em]"
                style={{ borderColor: modeConfigFor(mode).accent, color: modeConfigFor(mode).accent }}
              >
                {t("gameover.mode", { name: t(`mode.${mode}.name` as MessageKey) })}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <div className="font-body text-[10px] font-extrabold tracking-[0.3em] text-jade-500 uppercase">
                  {t("gameover.scoreLabel")}
                </div>
                <div
                  className="font-display text-[clamp(3rem,11vw,6rem)] leading-[0.85] text-tumeric-400 tabular-nums"
                  style={{ textShadow: "6px 6px 0 rgba(6,26,26,0.85)" }}
                >
                  {fmtNum(stats.score, lang)}
                </div>
              </div>
              <div className="mb-2 flex flex-col gap-1">
                <span className="font-body text-xs font-bold tracking-wider text-clay-100/70">
                  {t("gameover.best")} <b className="font-display text-brine-300">{fmtNum(Math.max(best, stats.score), lang)}</b>
                </span>
                {isHigh && !done && (
                  <span className="inline-block w-fit -rotate-2 border-[3px] border-jade-950 bg-brine-500 px-2 py-0.5 font-display text-[11px] tracking-[0.14em] text-jade-950 hard-shadow-sm">
                    {t("gameover.rank", { rank })}
                  </span>
                )}
                {done && (
                  <span className="inline-block w-fit border-[3px] border-jade-950 bg-tumeric-500 px-2 py-0.5 font-display text-[11px] tracking-[0.14em] text-jade-950 hard-shadow-sm">
                    {t("gameover.saved")}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label={t("stats.catches")} value={stats.catches} accent="text-brine-300" />
              <Stat label={t("stats.bestCombo")} value={`×${stats.bestCombo}`} accent="text-tumeric-400" />
              <Stat label={t("stats.level")} value={stats.level} />
              <Stat label={t("stats.jars")} value={stats.jars} accent="text-brine-300" />
              <Stat label={t("stats.sliced")} value={stats.sliced} accent="text-chili-400" />
              <Stat label={t("stats.time")} value={fmtTime(stats.time)} />
            </div>

            {newAchievements.length > 0 && (
              <Panel className="anim-pop mt-4 p-3">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-tumeric-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4z" />
                    <path d="M7 6H4a1 1 0 00-1 1c0 2.2 1.3 4 4 4M17 6h3a1 1 0 011 1c0 2.2-1.3 4-4 4" />
                  </svg>
                  <span className="font-display text-[12px] tracking-[0.22em] text-tumeric-400">
                    {t("newAch.title")}
                  </span>
                </div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {newAchievements.map((a) => (
                    <li
                      key={a.id}
                      className="anim-badge-pop flex items-center gap-2 border-2 border-tumeric-500/70 bg-tumeric-500/15 px-2 py-1.5"
                      title={t(`ach.${a.id}.desc` as MessageKey)}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-tumeric-400 font-display text-[8px] text-tumeric-400">
                        {a.glyph}
                      </span>
                      <span className="font-body text-[9px] leading-tight font-extrabold tracking-[0.08em] text-tumeric-400">
                        {t(`ach.${a.id}.name` as MessageKey)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {isHigh && !done && (
              <Panel className="anim-pop mt-4 flex flex-wrap items-center gap-2 p-3">
                <label className="font-body text-[10px] font-extrabold tracking-[0.24em] text-jade-500 uppercase">
                  {t("save.label")}
                </label>
                <input
                  ref={inputRef}
                  value={name}
                  maxLength={10}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submit();
                    }
                    e.stopPropagation();
                  }}
                  placeholder={t("save.placeholder")}
                  className="min-w-0 flex-1 border-[3px] border-jade-700 bg-jade-950 px-3 py-2 font-display text-sm tracking-[0.14em] text-tumeric-400 placeholder-jade-700 outline-none focus:border-tumeric-500"
                />
                <GameButton onClick={submit}>{t("save.button")}</GameButton>
              </Panel>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <GameButton size="lg" onClick={onRestart} className="anim-cta">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M20 11a8 8 0 10-2.3 6.3" />
                  <path d="M20 4v7h-7" />
                </svg>
                {t("gameover.again")}
              </GameButton>
              <GameButton size="lg" variant="ghost" onClick={onMenu}>
                {t("gameover.menu")}
              </GameButton>
              <span className="flex items-center gap-1.5 font-body text-[11px] font-bold tracking-wider text-jade-500">
                {t("gameover.instantA")} <Keycap>R</Keycap> {t("gameover.instantB")}
              </span>
            </div>
          </div>

          <div className="anim-slide lg:col-span-5">
            <Panel>
              <ScoreBoard entries={scores} highlightId={savedId} rows={8} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
