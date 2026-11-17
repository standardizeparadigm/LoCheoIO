import { useI18n } from "../../i18n/useI18n";
import { MODE_LIST, modeConfigFor, type ModeId } from "../../game/modes";
import { Modal } from "../ui";
import type { MessageKey } from "../../i18n/i18n";
import ModeSelector from "../ModeSelector";

/**
 * Mode picker as a dedicated modal — keeps 9 modes out of the main menu.
 * Reuses the battle-tested ModeSelector (9 cards) inside a Modal shell.
 */
export default function ModeSelectModal({
  mode,
  onChange,
  onClose,
}: {
  mode: ModeId;
  onChange: (m: ModeId) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <Modal title={t("modes.title")} onClose={onClose} wide>
      <p className="mb-3 font-body text-xs text-clay-100/70">
        {t("modes.subtitle")}{" "}
        <b className="text-brine-300">
          {t("modes.playing", { name: t(`mode.${mode}.name` as MessageKey) })}
        </b>
      </p>
      <ModeSelector mode={mode} onChange={onChange} />
      <p className="mt-3 text-center font-body text-[9px] tracking-[0.2em] text-jade-700 uppercase">
        {MODE_LIST.length} · {modeConfigFor(mode).name}
      </p>
    </Modal>
  );
}
