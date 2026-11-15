import type { ChangelogEntry } from "../types";

/**
 * v1.1.0 — released 2026-10-29 — tier: MINOR
 *
 * Ba chế độ chơi, nguyên liệu mới, thành tựu đầu tiên, menu aurora, font tự host, README 3 ngôn ngữ
 *
 * 8 bullets (vi) / 8 (en). Keep the two lists the same length:
 * tests/changelog-tiers.test.ts asserts it, and the panel would show an
 * uneven list otherwise.
 */
export const V1_1_0: ChangelogEntry = {
  version: "1.1.0",
  date: "2026-10-29",
  kind: "feature",
  vi: "Ba chế độ chơi, nguyên liệu mới, thành tựu đầu tiên, menu aurora, font tự host, README 3 ngôn ngữ",
  en: "Three game modes, new ingredients, the first achievements, an aurora menu, self-hosted fonts, READMEs in three languages",
  itemsVi: [
    "Ba chế độ chơi chọn ngay trên menu: MUỐI DƯA CỔ ĐIỂN · THẢNH THƠI · ỚT LỬA",
    "Mỗi chế độ có thẻ gradient riêng, viền phát sáng theo màu nhấn, chọn xong lưu vào locheo.mode.v1",
    "THẢNH THƠI không bao giờ sinh đồ hư nhưng chỉ ×0.5 điểm; ỚT LỬA hazard ×1.8, đền ×1.5 điểm",
    "Thêm nguyên liệu mới và bảng thành tựu đầu tiên (10 mốc: hứng, chuỗi, chém, hũ, cấp, điểm, số ván)",
    "Làm lại menu theo phong cách gradient/aurora sống động, có chuyển động nền",
    "Tự host font — không còn tải font từ CDN, chạy được hoàn toàn offline",
    "Viết lại README thành 3 ngôn ngữ (Việt · English · 中文) kèm animation",
    "HUD hiển thị cấp, hũ, chuỗi combo và điểm cao nhất của chế độ đang chơi",
  ],
  itemsEn: [
    "Three modes you pick right on the menu: CLASSIC · CHILL · CHILI",
    "Each mode has its own gradient card and accent-coloured glow; the choice is saved to locheo.mode.v1",
    "CHILL never spawns hazards but pays only ×0.5; CHILI runs hazards at ×1.8 and pays ×1.5",
    "New ingredients and the first achievement board (10 milestones: catches, chains, slices, jars, level, score, runs)",
    "The menu rebuilt around a living gradient/aurora look with animated backgrounds",
    "Self-hosted fonts — no CDN font fetch, fully playable offline",
    "README rewritten in three languages (Việt · English · 中文) with animation",
    "The HUD shows level, jar fill, combo chain and the best score for the current mode",
  ],
};
