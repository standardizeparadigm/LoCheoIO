import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n/useI18n";
import GameCanvas from "./components/GameCanvas";
import GameOverScreen from "./components/GameOverScreen";
import PauseScreen from "./components/PauseScreen";
import StartScreen from "./components/StartScreen";
import { audio } from "./game/audio";
import { ACHIEVEMENT_MAP, checkAchievements, type AchievementDef } from "./game/achievements";
import type { LoCheoGame, Phase, RunStats } from "./game/engine";
import { isModeId, type ModeId } from "./game/modes";
import type { MessageKey } from "./i18n/i18n";
import {
  bestScore,
  clearAllProgress,
  loadAchievements,
  loadScores,
  qualifies,
  rankOf,
  recordRun,
  submitScore,
  unlockAchievements,
  type ScoreEntry,
} from "./game/storage";
import {
  loadSettings,
  resetSettingsKeepingLanguage,
  saveSettings,
  type GameSettings,
  type SettingLanguage,
} from "./game/settings";
import { detectInitialLanguage, setLanguage } from "./i18n/i18n";
import { clearSavedRun, loadSavedRun, saveSavedRun, type SavedRun } from "./game/runSave";
import { prefersCoarsePointer, prefersMoreContrast, prefersReducedMotion } from "./utils/mediaQuery";
import { STORAGE_KEYS, readRaw, writeRaw } from "./game/safeStorage";

const EMPTY: RunStats = { score: 0, catches: 0, bestCombo: 0, level: 1, jars: 0, sliced: 0, time: 0 };

export default function App() {
  const { t, lang } = useI18n();
  const gameRef = useRef<LoCheoGame | null>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores());
  const [run, setRun] = useState<RunStats>(EMPTY);
  const [showOver, setShowOver] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  // mute survives a reload — it used to reset to "sound on" every boot,
  // which was jarring for players who muted deliberately (v1.1.6)
  const [muted, setMuted] = useState(() => readRaw(STORAGE_KEYS.muted) === "1");
  const [touchMode, setTouchMode] = useState(false);
  const [mode, setMode] = useState<ModeId>(() => {
    const v = readRaw(STORAGE_KEYS.mode); // returns null when storage is blocked
    return isModeId(v) ? v : "classic";
  });
  const [achievements, setAchievements] = useState<string[]>(() => loadAchievements());
  const [newAchievements, setNewAchievements] = useState<AchievementDef[]>([]);
  const [settings, setSettings] = useState<GameSettings>(() =>
    // first run: start from the OS motion preference instead of ignoring it
    loadSettings(detectInitialLanguage(), { reducedMotion: prefersReducedMotion() }),
  );
  const [resume, setResume] = useState<SavedRun | null>(() => loadSavedRun());
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;
  const resumeRef = useRef<SavedRun | null>(resume);
  resumeRef.current = resume;

  const best = bestScore(scores);

  /* ---------------------------------------------------- boot listeners */
  useEffect(() => {
    if (prefersCoarsePointer()) setTouchMode(true);
    // audio unlock only — a mouse click or keypress must NOT flip touch UI on
    const unlock = () => audio.unlock();
    const coarse = () => setTouchMode(true);
    const onPointer = (e: PointerEvent) => {
      audio.unlock();
      if (e.pointerType === "touch" || e.pointerType === "pen") setTouchMode(true);
    };
    window.addEventListener("touchstart", coarse, { once: true, passive: true });
    window.addEventListener("pointerdown", onPointer, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("touchstart", coarse);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    audio.setMuted(muted);
    writeRaw(STORAGE_KEYS.muted, muted ? "1" : "0");
  }, [muted]);

  // settings.language is the source of truth → drives the i18n module
  useEffect(() => {
    setLanguage(settings.language);
  }, [settings.language]);

  // settings → audio gates (SFX / music) + loudness — applied instantly
  useEffect(() => {
    audio.setSfxEnabled(settings.sfx);
    audio.setMusicEnabled(settings.music);
    audio.setSfxVolume(settings.sfxVolume / 100);
    audio.setMusicVolume(settings.musicVolume / 100);
  }, [settings.sfx, settings.music, settings.sfxVolume, settings.musicVolume]);

  // settings → engine hooks (screen shake on/level, quality, reduced motion)
  useEffect(() => {
    gameRef.current?.setShakeEnabled(settings.shake);
    gameRef.current?.setShakeLevel(settings.shakeLevel);
    gameRef.current?.setQuality(settings.visualQuality);
    gameRef.current?.setReducedMotion(settings.reducedMotion);
  }, [settings.shake, settings.shakeLevel, settings.visualQuality, settings.reducedMotion]);

  // OS high-contrast request → root attribute so CSS can lift low-contrast text
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (prefersMoreContrast()) root.setAttribute("data-contrast", "more");
      else root.removeAttribute("data-contrast");
    } catch {
      /* non-DOM environment */
    }
  }, []);

  // keep <html lang> honest for screen readers & search engines
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      /* non-DOM environment */
    }
  }, [lang]);

  // push the mode into the engine and persist it
  useEffect(() => {
    gameRef.current?.setMode(mode);
    try {
      writeRaw(STORAGE_KEYS.mode, mode);
    } catch {
      /* storage blocked — session default only */
    }
  }, [mode]);

  const handleModeChange = useCallback((m: ModeId) => setMode(m), []);

  /* ------------------------------------------------------------ actions */
  const onReady = useCallback((g: LoCheoGame) => {
    gameRef.current = g;
    g.setMode(modeRef.current);
    const s = loadSettings(detectInitialLanguage());
    g.setShakeEnabled(s.shake);
    g.setShakeLevel(s.shakeLevel);
    g.setQuality(s.visualQuality);
    g.setReducedMotion(s.reducedMotion);
  }, []);

  const startRun = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    audio.unlock();
    clearSavedRun(); // a fresh run supersedes the suspended one
    setResume(null);
    setSavedId(null);
    setNewAchievements([]);
    setRun(EMPTY);
    setShowOver(false);
    g.setMode(modeRef.current);
    g.start();
  }, []);

  // Resume the suspended run snapshot (GAME → «Chơi tiếp»)
  const resumeRun = useCallback(() => {
    const g = gameRef.current;
    const saved = resumeRef.current;
    if (!g || !saved) return;
    g.restoreRun(saved);
    setMode(saved.mode); // keep React state + persisted locheo.mode.v1 in sync with the resumed run
    clearSavedRun();
    resumeRef.current = null;
    setResume(null);
    setSavedId(null);
    setNewAchievements([]);
    setRun({ ...saved.stats });
    setShowOver(false);
  }, []);

  /*
   * The settings danger zone: scores, progress, achievements and the suspended
   * run — four keys, not eight. Settings, language, mode and muted survive, on
   * purpose: a player clearing their scores should not lose their volume
   * preference. `clearAllGameKeys()` is the hammer that takes all eight, and it
   * is not what this button calls.
   */
  const clearAllData = useCallback(() => {
    clearAllProgress();
    clearSavedRun();
    setScores(loadScores()); // seeds the default board
    setAchievements([]);
    setResume(null);
    setSavedId(null);
  }, []);

  const patchSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => {
      // Persist `prev + patch` directly. `updateSettings` re-reads storage
      // first, which silently threw away in-memory changes when storage is
      // blocked (private mode, quota) — every toggle reverted to defaults.
      return saveSettings({ ...prev, ...patch });
    });
  }, []);

  // settings → language: go through the i18n module so every subscriber updates
  const changeLanguage = useCallback((lang: SettingLanguage) => {
    setSettings((prev) => saveSettings({ ...prev, language: lang }));
  }, []);

  // data section: restore defaults, keep the chosen language
  const resetDefaults = useCallback(() => {
    setSettings((prev) => resetSettingsKeepingLanguage(prev));
  }, []);

  const toMenu = useCallback(() => {
    const g = gameRef.current;
    const phase = phaseRef.current;
    if (g && (phase === "playing" || phase === "paused")) {
      // suspension: snapshot the run so «Chơi tiếp» can restore it
      const snap = g.captureRun();
      saveSavedRun(snap);
      setResume(snap);
    }
    g?.toMenu();
    setShowOver(false);
    audio.play("ui");
  }, []);

  const togglePause = useCallback(() => {
    const g = gameRef.current;
    if (!g || (g.phase !== "playing" && g.phase !== "paused")) return;
    g.togglePause();
    setRun({ ...g.stats });
    audio.play("ui");
  }, []);

  const onGameOver = useCallback((s: RunStats) => {
    setRun(s);
    clearSavedRun(); // the run is finished — restore is meaningless now
    setResume(null);
    setSavedId(null);
    // fold the run into lifetime progress, then light up any new badges
    const progress = recordRun(s);
    const known = loadAchievements();
    /*
     * The mode comes from the *engine*, not from React state.
     *
     * They agree in every flow the UI can reach today — but the six
     * mode-specific badges (`inferno-1500`, `blitz-3000`, `goldrush-2jars`,
     * `storm-60`, `hardcore-jar`, `feast-3jars`) are the one place where a
     * one-frame disagreement would be permanent: a run resumed from storage sets
     * the engine's mode first and React's second, and a badge is written to disk
     * and never re-evaluated. The engine is the thing that actually simulated
     * the run, so it is the thing that decides which mode it was.
     */
    const playedMode = gameRef.current?.mode ?? modeRef.current;
    const freshIds = checkAchievements({ ...s, mode: playedMode }, progress, known);
    if (freshIds.length > 0) {
      setAchievements(unlockAchievements(freshIds));
      setNewAchievements(
        freshIds
          .map((id) => ACHIEVEMENT_MAP.get(id))
          .filter((d): d is AchievementDef => Boolean(d)),
      );
      audio.play("full");
    } else {
      setAchievements(known);
      setNewAchievements([]);
    }
    setShowOver(true);
  }, []);

  const onStartKey = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    if (g.phase === "menu" || g.phase === "gameover") startRun();
  }, [startRun]);

  const onRestartKey = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.phase === "menu") return;
    startRun();
  }, [startRun]);

  const onMuteKey = useCallback(() => setMuted((m) => !m), []);

  const saveScore = useCallback(
    (name: string) => {
      const { list, id } = submitScore({
        name,
        score: run.score,
        level: run.level,
        jars: run.jars,
        combo: run.bestCombo,
        date: Date.now(),
      });
      setScores(list);
      setSavedId(id);
      audio.play("level");
    },
    [run],
  );

  const isHigh = qualifies(run.score, scores);
  const rank = rankOf(run.score, scores);

  /* ---------------------------------------------------------------- view */
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-jade-950 font-body select-none">
      <GameCanvas
        best={best}
        touchMode={touchMode}
        controlsLive={phase === "playing"}
        onReady={onReady}
        onPhase={setPhase}
        onGameOver={onGameOver}
        onPauseKey={togglePause}
        onRestartKey={onRestartKey}
        onStartKey={onStartKey}
        onMuteKey={onMuteKey}
        autoPauseOnBlur={settings.autoPauseOnBlur}
        reducedMotion={settings.reducedMotion}
      />

      {/* ambient overlays */}
      <div className="scanlines pointer-events-none absolute inset-0 z-10 opacity-45" />
      {/* v1.1.7: was `inset 0 0 140px rgba(6,26,26,0.9)` — a 140px black frame on
          all four sides that ate the corners of the scene. 90px at 0.55 keeps the
          CRT framing without swallowing the nebula glow. */}
      <div className="app-vignette pointer-events-none absolute inset-0 z-10" />
      <div className="pointer-events-none absolute inset-2 z-10 hidden border-2 border-jade-700/35 sm:block" />
      <div className="pointer-events-none absolute inset-2 z-10 hidden sm:block">
        {[
          "top-0 left-0 border-t-4 border-l-4",
          "top-0 right-0 border-t-4 border-r-4",
          "bottom-0 left-0 border-b-4 border-l-4",
          "bottom-0 right-0 border-b-4 border-r-4",
        ].map((c) => (
          <span key={c} className={`absolute h-6 w-6 border-tumeric-500/70 ${c}`} />
        ))}
      </div>

      {/* in-run chrome */}
      {(phase === "playing" || phase === "paused") && (
        <div className="absolute top-3 right-3 z-30 flex gap-2">
          <button
            type="button"
            onClick={togglePause}
            aria-label={phase === "paused" ? t("app.pause.ariaOff") : t("app.pause.ariaOn")}
            className="press flex h-10 w-10 items-center justify-center border-[3px] border-jade-700 bg-jade-950/85 text-tumeric-400 hard-shadow-sm"
          >
            {phase === "paused" ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <rect x="5" y="4" width="4.5" height="16" rx="1" />
                <rect x="14.5" y="4" width="4.5" height="16" rx="1" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onMuteKey}
            aria-label={muted ? t("mute.turnOn") : t("mute.turnOff")}
            className="press flex h-10 w-10 items-center justify-center border-[3px] border-jade-700 bg-jade-950/85 text-brine-300 hard-shadow-sm"
          >
            {muted ? (
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                <path d="M17 9l4 6M21 9l-4 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                <path d="M17 8.5a5 5 0 010 7" />
              </svg>
            )}
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="pointer-events-none absolute bottom-3 left-4 z-20 hidden lg:block">
          <span className="font-display text-[11px] tracking-[0.22em] text-jade-500/80">{t("app.wordmark")}</span>
          <span className="ml-2 font-body text-[10px] tracking-[0.14em] text-jade-700">
            {t("app.hint", { mode: t(`mode.${mode}.name` as MessageKey) })}
          </span>
        </div>
      )}

      {/* screens */}
      {phase === "menu" && (
        <StartScreen
          scores={scores}
          best={best}
          touchMode={touchMode}
          achievements={achievements}
          mode={mode}
          onModeChange={handleModeChange}
          onStart={startRun}
          resume={resume}
          onResume={resumeRun}
          settings={settings}
          onPatchSettings={patchSettings}
          onChangeLanguage={changeLanguage}
          onQuickSettings={patchSettings}
          onResetDefaults={resetDefaults}
          onClearAllData={clearAllData}
        />
      )}
      {phase === "paused" && (
        <PauseScreen
          stats={run}
          muted={muted}
          mode={mode}
          onResume={togglePause}
          onRestart={startRun}
          onMenu={toMenu}
          onToggleMute={onMuteKey}
        />
      )}
      {phase === "gameover" && showOver && (
        <GameOverScreen
          stats={run}
          scores={scores}
          best={best}
          isHigh={isHigh}
          rank={rank}
          savedId={savedId}
          mode={mode}
          newAchievements={newAchievements}
          onSave={saveScore}
          onRestart={startRun}
          onMenu={toMenu}
        />
      )}

    </div>
  );
}
