import type { ChangelogEntry } from "../types";

/**
 * v1.1.4 — released 2026-11-06 — tier: PATCH
 *
 * Hai chế độ mới (Lễ Hội Combo · Đại Tiệc Dưa), đủ 16 thành tựu, thêm tiếng Tây Ban Nha và Pháp
 *
 * 9 bullets (vi) / 9 (en). Keep the two lists the same length:
 * tests/changelog-tiers.test.ts asserts it, and the panel would show an
 * uneven list otherwise.
 */
export const V1_1_4: ChangelogEntry = {
  version: "1.1.4",
  date: "2026-11-06",
  kind: "feature",
  vi: "Hai chế độ mới (Lễ Hội Combo · Đại Tiệc Dưa), đủ 16 thành tựu, thêm tiếng Tây Ban Nha và Pháp",
  en: "Two new modes (Combo Festival · Grand Feast), sixteen achievements, Spanish and French added",
  itemsVi: [
    "Chế độ mới «Lễ Hội Combo» — cửa sổ combo dài gấp đôi, thưởng chuỗi liên tục, dành cho ai thích giữ nhịp",
    "Chế độ mới «Đại Tiệc Dưa» — dưa rơi dày hơn, hũ đầy nhanh gấp 2.5 lần, điểm mỗi lần hũ đầy cũng ×2.5",
    "Tổng cộng 9 chế độ chơi, mỗi chế độ có màu nhấn và gradient riêng",
    "16 thành tựu thay vì 14 — thêm nhóm thành tựu cho hai chế độ mới",
    "Thêm tiếng Tây Ban Nha (es) và tiếng Pháp (fr) — nâng lên 7 ngôn ngữ giao diện",
    "Trình chạy (launcher) cho cả 7 ngôn ngữ, tự nhận theo locale của máy",
    "FIX: launcher Windows lưu sai xuống dòng — chuyển sang CRLF + UTF-8 BOM để tiếng Việt có dấu hiện đúng",
    "Bộ đếm combo hiển thị to dần theo chuỗi, đổi màu khi vượt ×6",
    "61 unit tests",
  ],
  itemsEn: [
    "New mode “Combo Festival” — the combo window is twice as long and chains pay more; built for players who like to keep a rhythm",
    "New mode “Grand Feast” — produce falls denser and filling the jar is 2.5× faster, with a 2.5× jar bonus",
    "Nine game modes in total, each with its own accent colour and gradient",
    "Sixteen achievements instead of fourteen — a new group for the two new modes",
    "Spanish (es) and French (fr) added — seven UI languages",
    "Launchers for all seven languages, auto-detecting the machine locale",
    "FIX: the Windows launcher saved the wrong line endings — switched to CRLF + UTF-8 BOM so Vietnamese diacritics render",
    "The combo counter scales up with the chain and turns colour past ×6",
    "61 unit tests",
  ],
};
