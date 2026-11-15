import type { ChangelogEntry } from "../types";

/**
 * v1.1.3 — released 2026-11-04 — tier: PATCH
 *
 * Mưa Dưa · Gốm Mỏng, thành tựu thứ 13–14, giao diện 5 ngôn ngữ, launcher có hoạt họa, favicon
 *
 * 9 bullets (vi) / 9 (en). Keep the two lists the same length:
 * tests/changelog-tiers.test.ts asserts it, and the panel would show an
 * uneven list otherwise.
 */
export const V1_1_3: ChangelogEntry = {
  version: "1.1.3",
  date: "2026-11-04",
  kind: "feature",
  vi: "Mưa Dưa · Gốm Mỏng, thành tựu thứ 13–14, giao diện 5 ngôn ngữ, launcher có hoạt họa, favicon",
  en: "Storm · Thin Porcelain, achievements 13–14, five UI languages, animated launchers, a web favicon",
  itemsVi: [
    "Chế độ «Mưa Dưa» — dưa rơi dày ~1.4×, đồ hư ×1.5, đổi lại mỗi củ chỉ ×0.75 điểm; “lụt dưa” đúng nghĩa",
    "Chế độ «Gốm Mỏng» — chỉ chịu đúng MỘT vết nứt là vỡ hũ, đền bù ×2.0 điểm; chế độ hardcore thật sự",
    "Hai thành tựu mới (tổng 14): CƠN MƯA NẶNG HẠT và GỐM THÉP",
    "Giao diện 5 ngôn ngữ — thêm 日本語 và 한국어 bên cạnh Việt · English · 中文",
    "Launcher double-click nay đa ngôn ngữ (phím L: VI→EN→中) và có hoạt ảnh: banner đổi màu, spinner braille, thanh tiến trình build thật",
    "Favicon web hoàn chỉnh: favicon.ico nhiều kích thước + SVG động + data-URI nhúng",
    "Logo rơi vào lọ được vẽ bằng canvas, có nhịp thở riêng",
    "FIX: ngưỡng vỡ hũ giờ đọc theo chế độ (maxCracks) thay vì hằng số toàn cục",
    "55 unit tests",
  ],
  itemsEn: [
    "New mode “Storm” — produce falls ~1.4× denser and hazards ×1.5, but each pickle is worth only ×0.75; a proper pickle flood",
    "New mode “Thin Porcelain” — a single crack shatters the jar, paying ×2.0 per pickle; the real hardcore mode",
    "Two new achievements (14 total): HEAVY RAIN and STEEL PORCELAIN",
    "Five UI languages — 日本語 and 한국어 added beside Tiếng Việt · English · 中文",
    "Double-click launchers are now multilingual (key L: VI→EN→中) and animated: colour-cycling banner, braille spinner, real build progress",
    "A complete web favicon: multi-size favicon.ico + animated SVG + embedded data URI",
    "The logo now drops into the jar as canvas art with its own breathing rhythm",
    "FIX: the crack threshold now comes from the mode (maxCracks) instead of a global constant",
    "55 unit tests",
  ],
};
