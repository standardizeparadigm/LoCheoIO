import type { ChangelogEntry } from "../types";

/**
 * v1.1.1 — released 2026-10-30 — tier: PATCH
 *
 * Quét lỗi toàn dự án, i18n trong game (Việt · English · 中文), build một file, README 7 ngôn ngữ
 *
 * 9 bullets (vi) / 9 (en). Keep the two lists the same length:
 * tests/changelog-tiers.test.ts asserts it, and the panel would show an
 * uneven list otherwise.
 */
export const V1_1_1: ChangelogEntry = {
  version: "1.1.1",
  date: "2026-10-30",
  kind: "fix",
  vi: "Quét lỗi toàn dự án, i18n trong game (Việt · English · 中文), build một file, README 7 ngôn ngữ",
  en: "A project-wide bug sweep, in-game i18n (Việt · English · 中文), single-file build, READMEs in seven languages",
  itemsVi: [
    "Module i18n thuần, không phụ thuộc React: tự nhận ngôn ngữ (localStorage → navigator.language → vi), nội suy {param}, fallback về tiếng Việt",
    "Toàn bộ chuỗi hiển thị đi qua từ điển: HUD canvas, popup, banner, màn hình, ticker",
    "Nút chuyển ngôn ngữ VI · EN · 中 dùng chung ở menu và màn tạm dừng",
    "Số liệu định dạng theo từng locale — dấu phân cách nghìn đổi theo ngôn ngữ",
    "Chuyển sang build một file duy nhất: dist/index.html tự chứa mọi thứ, chép đi đâu cũng chạy",
    "Tự host font woff2 dạng subset, nạp bằng unicode-range — offline-first thật sự",
    "FIX: form nhập tên tự submit khi bấm Enter và nháy lại trang",
    "Bộ quét lỗi toàn dự án: sửa hàng loạt lỗi nhỏ ở HUD, modal, engine và docs",
    "README mở rộng ra 7 ngôn ngữ",
  ],
  itemsEn: [
    "A pure i18n module with no React dependency: it detects the language (localStorage → navigator.language → vi), interpolates {param} and falls back to Vietnamese",
    "Every visible string now goes through the dictionary: canvas HUD, popups, banners, screens, ticker",
    "A VI · EN · 中 switcher shared by the menu and the pause screen",
    "Numbers are formatted per locale — the thousands separator changes with the language",
    "Switched to a single-file build: dist/index.html carries everything and runs wherever you copy it",
    "Fonts self-hosted as woff2 subsets loaded via unicode-range — genuinely offline-first",
    "FIX: the name form no longer submits on Enter and reloads the page",
    "A project-wide bug sweep: batches of small fixes across the HUD, modals, engine and docs",
    "READMEs expanded to seven languages",
  ],
};
