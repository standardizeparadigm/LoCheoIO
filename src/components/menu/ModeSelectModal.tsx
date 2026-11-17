import { useI18n } from "../../i18n/useI18n";
import { MODE_LIST, type ModeId } from "../../game/modes";
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
      {/*
        The footer used to print `MODES[mode].name` — the Vietnamese balance
        record's own `name` field, which is data, not copy. In six of the seven
        languages that put «MUỐI DƯA CỔ ĐIỂN» under a translated picker. The
        catalogue's `name` is the *source* string for the i18n table, not a
        renderable one, so the footer now asks the same table every other
        surface asks.
      */}
      <p className="mt-3 text-center font-body text-[9px] tracking-[0.2em] text-jade-700 uppercase">
        {MODE_LIST.length} · {t(`mode.${mode}.name` as MessageKey)}
      </p>
    </Modal>
  );
}
