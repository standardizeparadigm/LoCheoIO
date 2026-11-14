import { useI18n } from "../../i18n/useI18n";
import type { SavedRun } from "../../game/runSave";
import { MODE_LIST } from "../../game/modes";
import { fmtNum } from "../../i18n/i18n";
import type { MessageKey } from "../../i18n/i18n";
import CornerPanel from "./CornerPanel";
import { cornerRowHeight } from "./layout";
import MenuItemButton from "./MenuItemButton";
import { PlayIcon, ContinueIcon, ModesIcon, TrophyIcon, MedalIcon, GearIcon, ScrollIcon } from "./icons";
import type { MenuPlan } from "./layout";
import { PanelStatStrip } from "./panel";
import { progressStat } from "./panel";

/**
 * GAME corner panel (bottom-left): everything related to playing.
 * «Chơi tiếp» is enabled only when a suspended run snapshot exists.
 */
export default function GameMenu({
  resume,
  achievementsUnlocked,
  achievementsTotal,
  onPlay,
  onResume,
  onModes,
  onLeaderboard,
  onAchievements,
  onSettings,
  onHowTo,
  plan,
}: {
  resume: SavedRun | null;
  achievementsUnlocked: number;
  achievementsTotal: number;
  onPlay: () => void;
  onResume: () => void;
  onModes: () => void;
  onLeaderboard: () => void;
  onAchievements: () => void;
  onSettings: () => void;
  onHowTo: () => void;
  plan: MenuPlan;
}) {
  const { t, lang } = useI18n();
  const resumeHint = resume
    ? t("game.continueHint", {
        mode: t(`mode.${resume.mode}.name` as MessageKey),
        score: fmtNum(resume.stats.score, lang),
        jars: resume.stats.jars,
      })
    : t("game.continueNone");

  return (
    <CornerPanel
      title={t("menu.game")}
      corner="left"
      height={cornerRowHeight(plan.dense, plan.tight)}
      width={plan.panelWidth}
      tight={plan.tight}
      compact={plan.compact}
      footer={plan.footer ? <PanelStatStrip stats={progressStat(achievementsUnlocked, achievementsTotal, MODE_LIST.length)} /> : undefined}
    >
      <MenuItemButton icon={<PlayIcon className="h-5 w-5" />} label={t("game.play")} variant="primary" shine rich={plan.dense} onClick={onPlay} />
      <MenuItemButton
        icon={<ContinueIcon className="h-5 w-5" />}
        label={t("game.continue")}
        hint={resumeHint}
        variant="brine"
        rich={plan.dense}
        disabled={!resume}
        onClick={onResume}
      />
      <MenuItemButton
        icon={<ModesIcon className="h-5 w-5" />}
        label={t("game.modes")}
        hint={t("game.modesHint")}
        rich={plan.dense}
        onClick={onModes}
        trailing={
          <span className="font-display text-[9px] text-brine-400/80 tabular-nums">{MODE_LIST.length}</span>
        }
      />
      <MenuItemButton
        icon={<TrophyIcon className="h-5 w-5" />}
        label={t("game.leaderboard")}
        hint={t("game.leaderboardHint")}
        rich={plan.dense}
        onClick={onLeaderboard}
      />
      <MenuItemButton
        icon={<MedalIcon className="h-5 w-5" />}
        label={t("game.achievements")}
        hint={t("game.achievementsHint", { n: achievementsUnlocked, total: achievementsTotal })}
        rich={plan.dense}
        onClick={onAchievements}
      />
      <MenuItemButton
        icon={<ScrollIcon className="h-5 w-5" />}
        label={t("menu.howtoOpen")}
        hint={t("game.howtoHint")}
        rich={plan.dense}
        onClick={onHowTo}
      />
      <MenuItemButton
        icon={<GearIcon className="h-5 w-5" />}
        label={t("game.settings")}
        hint={t("game.settingsHint")}
        rich={plan.dense}
        onClick={onSettings}
      />
    </CornerPanel>
  );
}
