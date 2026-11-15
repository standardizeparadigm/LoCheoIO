import { useI18n } from "../../i18n/useI18n";
import SettingsSection from "./SettingsSection";
import { PRESET_LIST, matchPreset, type PresetId } from "../../game/settingsPresets";
import type { GameSettings } from "../../game/settings";

const GLYPH: Record<PresetId, string> = {
  performance: "🪶",
  balanced: "⚖️",
  cinematic: "🎬",
  speedrun: "⏱️",
};

/**
 * Section CẤU HÌNH NHANH — one tap applies a curated bundle of settings.
 * The active preset is re-derived on every render, so tweaking one slider
 * afterwards simply flips the row back to "custom" (no hidden state).
 */
export default function PresetsSection({
  settings,
  onApply,
}: {
  settings: GameSettings;
  onApply: (id: PresetId) => void;
}) {
  const { t } = useI18n();
  const active = matchPreset(settings);
  return (
    <SettingsSection title={t("settings.section.presets")}>
      <div className="grid grid-cols-2 gap-1.5" role="group" aria-label={t("settings.section.presets")}>
        {PRESET_LIST.map((p) => (
          <button
            key={p.id}
            type="button"
            // aria-pressed so a screen reader announces which preset is live;
            // data-active alone only drives the CSS highlight
            aria-pressed={active === p.id}
            data-active={active === p.id}
            onClick={() => onApply(p.id)}
            className="press flex items-center gap-2 border-2 border-jade-800 bg-jade-900/50 px-2.5 py-1.5 text-left transition-colors hover:border-jade-600 data-[active=true]:border-tumeric-500 data-[active=true]:bg-tumeric-500/15"
          >
            <span aria-hidden="true" className="text-sm leading-none">{GLYPH[p.id]}</span>
            <span className="min-w-0">
              <span className="block font-body text-[10px] font-extrabold tracking-wide text-clay-100">
                {t(`settings.preset.${p.id}`)}
              </span>
              <span className="block clip-safe font-body text-[8px] leading-tight text-clay-100/50">
                {t(`settings.preset.${p.id}Desc`)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}
