import type { ChangelogEntry } from "../types";

/**
 * v1.1.7 — released 2026-11-13 — tier: PATCH
 *
 * Nền menu hết mờ, changelog có tầng bản phát hành và mô tả đầy đủ cho cả 8 bản cũ, README làm mới toàn bộ
 *
 * 9 bullets (vi) / 9 (en). Keep the two lists the same length:
 * tests/changelog-tiers.test.ts asserts it, and the panel would show an
 * uneven list otherwise.
 */
export const V1_1_7: ChangelogEntry = {
  version: "1.1.7",
  date: "2026-11-12",
  kind: "fix",
  vi: "Nền menu hết mờ, changelog có tầng bản phát hành và mô tả đầy đủ cho cả 8 bản cũ, README làm mới toàn bộ",
  en: "The foggy menu background is gone, the changelog gains release tiers and full descriptions for all 8 older releases, every README rebuilt",
  itemsVi: [
    "FIX NỀN MENU: ba lớp phủ chồng nhau biến cả scene thành một mảng xám — tinh vân blur 64px→22px và hạ đỉnh xuống 0.80, vignette toàn màn hình 0.42/0.88/1.0 → vignette góc 0.30/0.62, khung CRT 140px@0.9 → 90px@0.55",
    "FIX NỀN MENU: sàn gạch nâng từ 45% lên 70% opacity — dưới vignette cũ thì sàn gần như vô hình",
    "CHANGELOG: tag phiên bản theo tầng SemVer — PATCH màu tím, UPDATE màu vàng, MAJOR màu hồng; tầng suy ra từ chính số phiên bản nên không thể lệch",
    "CHANGELOG: cả 8 bản cũ (1.0.0 → 1.1.6) có danh sách thay đổi thật thay vì một dòng tóm tắt",
    "CHANGELOG: thêm thanh lọc theo tầng (TẤT CẢ · MAJOR · UPDATE · PATCH) kèm số bản mỗi tầng",
    "Ngày phát hành cả 9 bản được xếp lại thành một dòng thời gian liền mạch, không còn hai bản trùng ngày",
    "README: dải màu động theo palette, sơ đồ kiến trúc SVG, bảng so sánh 8 bản phát hành, mục kiểm chứng chất lượng",
    "Thêm tests/changelog-tiers.test.ts — khoá tầng SemVer, độ dài mô tả tối thiểu và tính duy nhất của từng gạch đầu dòng",
    "Dọn dẹp: bỏ `kind` khỏi đường render, giữ lại dưới dạng @deprecated để không phá call site cũ",
  ],
  itemsEn: [
    "MENU BACKGROUND FIX: three stacked overlays turned the whole scene into grey mush — nebula blur 64px→22px with peaks cut to 0.80, full-screen vignette 0.42/0.88/1.0 → corner vignette 0.30/0.62, CRT frame 140px@0.9 → 90px@0.55",
    "MENU BACKGROUND FIX: tile floor raised from 45% to 70% opacity — under the old vignette the floor was effectively invisible",
    "CHANGELOG: SemVer-tiered version tags — PATCH in violet, UPDATE in gold, MAJOR in pink; the tier is derived from the version string so it cannot drift",
    "CHANGELOG: all 8 older releases (1.0.0 → 1.1.6) now carry real change lists instead of a one-line summary",
    "CHANGELOG: tier filter (ALL · MAJOR · UPDATE · PATCH) with per-tier release counts",
    "All 9 release dates re-sequenced into one unbroken timeline — no two releases share a day any more",
    "README: animated palette ribbon, an SVG architecture map, an eight-release comparison table and a quality-gate section",
    "New tests/changelog-tiers.test.ts — locks the SemVer tier mapping, a minimum description length and bullet uniqueness",
    "Cleanup: `kind` is no longer read on the render path; it stays as @deprecated so older call sites keep compiling",
  ],
};
