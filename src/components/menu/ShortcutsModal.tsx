/**
 * The keyboard bindings, in one panel.
 *
 * Reachable from the INFO column. Before this existed the only place the
 * controls were written down was a four-key row inside the how-to modal, which
 * covered movement and nothing else — `Space` (slam), `Escape` (pause) and `M`
 * (mute) were discoverable only by pressing them.
 *
 * The list itself lives in `menu/shortcuts/keys.ts` so it can be asserted
 * against `GameCanvas`'s real key handler. This component is only a renderer.
 */
import { useI18n } from "../../i18n/useI18n";
import type { MessageKey } from "../../i18n/i18n";
import { Modal, Keycap } from "../ui";
import { keyBindings } from "./shortcuts";

export default function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const bindings = keyBindings();

  return (
    <Modal title={t("shortcuts.title")} onClose={onClose}>
      <p className="font-body text-[11px] leading-relaxed text-clay-100/75">{t("shortcuts.intro")}</p>

      <ul className="mt-3 space-y-2">
        {bindings.map((binding, i) => (
          <li
            key={`${binding.action}-${i}`}
            className="flex items-center justify-between gap-3 border-b border-dashed border-jade-800 pb-2 last:border-0"
          >
            <span className="font-body text-[11px] font-semibold text-clay-100/85">
              {t(binding.action as MessageKey)}
            </span>
            <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">
              {binding.caps.map((cap) => (
                <Keycap key={cap} wide={cap.length > 3}>
                  {cap}
                </Keycap>
              ))}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t-2 border-dashed border-jade-800 pt-2 font-body text-[10px] leading-relaxed text-jade-500">
        {t("shortcuts.footer")}
      </p>
    </Modal>
  );
}
