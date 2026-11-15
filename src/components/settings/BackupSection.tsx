import { useState } from "react";
import { useI18n } from "../../i18n/useI18n";
import { GameButton } from "../ui";
import SettingsSection from "./SettingsSection";
import { exportSettings, importSettings } from "../../game/settingsIO";
import { copyText } from "../../utils/clipboard";
import type { GameSettings } from "../../game/settings";

/**
 * Section SAO LƯU — export the live settings as JSON (copied to the
 * clipboard, with a manual fallback textarea) and import a previous one.
 * Import is validated by `importSettings`; bad JSON never overwrites state.
 */
export default function BackupSection({
  settings,
  onImport,
}: {
  settings: GameSettings;
  onImport: (next: GameSettings) => void;
}) {
  const { t } = useI18n();
  const [blob, setBlob] = useState("");
  const [status, setStatus] = useState<"idle" | "copied" | "bad" | "ok">("idle");

  const doExport = async () => {
    const json = exportSettings(settings);
    setBlob(json);
    // only claim "copied" when the clipboard API actually accepted it —
    // the textarea still holds the payload either way
    setStatus((await copyText(json)) ? "copied" : "ok");
  };

  const doImport = () => {
    // `settings` is the third argument on purpose: keys absent from the backup
    // keep their current value instead of snapping back to the defaults.
    const next = importSettings(blob, settings.language, settings);
    if (!next) {
      setStatus("bad");
      return;
    }
    onImport(next);
    setStatus("ok");
  };

  return (
    <SettingsSection title={t("settings.backupTitle")}>
      <p className="px-1 font-body text-[9px] leading-snug text-clay-100/50">{t("settings.backupDesc")}</p>
      <div className="flex gap-1.5">
        <GameButton size="sm" variant="ghost" className="flex-1" onClick={doExport}>
          {t("settings.backupExport")}
        </GameButton>
        <GameButton size="sm" variant="ghost" className="flex-1" onClick={doImport} disabled={blob.trim().length === 0}>
          {t("settings.backupImport")}
        </GameButton>
      </div>
      <textarea
        value={blob}
        onChange={(e) => {
          setBlob(e.target.value);
          setStatus("idle");
        }}
        spellCheck={false}
        rows={3}
        placeholder={t("settings.backupPlaceholder")}
        aria-label={t("settings.backupTitle")}
        className="w-full resize-y border-2 border-jade-800 bg-jade-950 px-2 py-1.5 font-mono text-[9px] leading-snug text-clay-100/80 outline-none focus:border-jade-600"
      />
      {status !== "idle" && (
        <p
          role="status"
          className={`px-1 font-body text-[9px] font-bold ${
            status === "bad" ? "text-chili-400" : "text-brine-300"
          }`}
        >
          {status === "copied" && t("settings.backupCopied")}
          {status === "ok" && t("settings.backupOk")}
          {status === "bad" && t("settings.backupBad")}
        </p>
      )}
    </SettingsSection>
  );
}
