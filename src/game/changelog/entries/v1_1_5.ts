import type { ChangelogEntry } from "../types";

/**
 * v1.1.5 — released 2026-11-09 — tier: PATCH
 *
 * Menu góc GAME/INFO, chế độ chọn riêng, lưu & chơi tiếp ván dở, cài đặt ngay trong game
 *
 * 11 bullets (vi) / 11 (en). Keep the two lists the same length:
 * tests/changelog-tiers.test.ts asserts it, and the panel would show an
 * uneven list otherwise.
 */
export const V1_1_5: ChangelogEntry = {
  version: "1.1.5",
  date: "2026-11-09",
  kind: "feature",
  vi: "Menu góc GAME/INFO, chế độ chọn riêng, lưu & chơi tiếp ván dở, cài đặt ngay trong game",
  en: "Corner GAME/INFO panels, a dedicated mode picker, save & resume, in-game settings",
  itemsVi: [
    "Menu chính gọn lại thành hai panel góc: GAME (dưới-trái) và INFO (dưới-phải)",
    "Panel GAME: Chơi · Chơi tiếp · Chế độ · Bảng xếp hạng · Thành tựu · Cài đặt",
    "Panel INFO: Giới thiệu tác giả · Changelog · Thoát",
    "Thêm nút «Chơi tiếp» — snapshot ván dở vào locheo.run.v1, khôi phục nguyên điểm/hũ/combo/cấp",
    "«Chơi tiếp» chỉ bật khi thật sự có ván đang dở, kèm gợi ý chế độ và điểm hiện tại",
    "Chế độ chơi dồn vào màn chọn riêng thay vì chiếm chỗ trên hero",
    "Cài đặt trong game: âm thanh, nhạc nền, rung màn hình, giảm chuyển động — áp dụng ngay",
    "FIX: prefers-reduced-motion còn thiếu trong CSS — giờ tôn trọng cài đặt của hệ điều hành",
    "FIX: chữ trong modal bị cắt khi cửa sổ thấp — modal giới hạn 86vh và tự cuộn",
    "Bộ icon SVG tự vẽ: 9 icon stroke nhất quán cho panel góc",
    "113 unit tests / 14 file",
  ],
  itemsEn: [
    "The main menu collapsed into two corner panels: GAME (bottom-left) and INFO (bottom-right)",
    "GAME panel: Play · Continue · Modes · Leaderboard · Achievements · Settings",
    "INFO panel: About the author · Changelog · Quit",
    "New “Continue” button — a suspended run is snapshotted into locheo.run.v1, restoring score/jars/combo/level as-is",
    "“Continue” only lights up when a suspended run actually exists, with a hint showing its mode and score",
    "Game modes moved into their own picker instead of taking over the hero area",
    "In-game settings: SFX, music, screen shake, reduced motion — applied instantly",
    "FIX: prefers-reduced-motion was missing from CSS — the OS setting is honoured now",
    "FIX: modal text was clipped at short window heights — modals cap at 86vh and scroll",
    "Hand-drawn SVG icon set: nine stroke-consistent icons for the corner panels",
    "113 unit tests / 14 files",
  ],
};
