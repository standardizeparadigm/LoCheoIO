import type { ChangelogEntry } from "../types";

/**
 * v1.1.6 — released 2026-11-10 — tier: PATCH
 *
 * Đại tu cài đặt thành 6 mục, ngôn ngữ dời hẳn vào Settings, nền menu nhiều lớp, 11 lỗi thật được sửa
 *
 * 15 bullets (vi) / 15 (en). Keep the two lists the same length:
 * tests/changelog-tiers.test.ts asserts it, and the panel would show an
 * uneven list otherwise.
 */
export const V1_1_6: ChangelogEntry = {
  version: "1.1.6",
  date: "2026-11-10",
  kind: "feature",
  vi: "Đại tu cài đặt thành 6 mục, ngôn ngữ dời hẳn vào Settings, nền menu nhiều lớp, 11 lỗi thật được sửa",
  en: "Settings rebuilt into six sections, language moved into Settings, a layered menu scene and eleven real fixes",
  itemsVi: [
    "Cài đặt chia 6 mục: Cấu hình nhanh · Âm thanh · Giao diện & chuyển động · Ngôn ngữ · Sao lưu · Dữ liệu",
    "Ba kiểu điều khiển trong một hộp thoại: công tắc bật/tắt, bộ chọn 2 lựa chọn, mức 0–100 với thanh 10 vạch nghiêng",
    "Âm lượng thật cho SFX và nhạc (0–100), áp dụng ngay không cần tải lại",
    "Mức rung nhẹ/mạnh (45% và 100% chấn động) và chất lượng hình thấp/cao (trần hạt 230 vs 460, tắt phát sáng)",
    "Tự tạm dừng khi đổi tab — bật/tắt được, mất focus là ván tự dừng",
    "4 preset một chạm: MƯỢT · CÂN BẰNG · ĐIỆN ẢNH · SPEEDRUN — không bao giờ đổi ngôn ngữ; lệch một mục là nhãn tự chuyển TUỲ CHỈNH",
    "Xuất/nhập cấu hình bằng JSON để mang cài đặt sang máy khác",
    "Ngôn ngữ dời hẳn vào Cài đặt — bỏ nút nổi góc phải ở menu và thanh chọn ở màn tạm dừng",
    "Nền menu nhiều lớp: tinh vân trôi, tia sáng thở, hai lớp sao nhấp nháy, vòng sáng xoay quanh lọ, vệt sáng chạy qua nút CHƠI",
    "Mục giới thiệu tác giả: viền gradient chạy vòng liên tục + quầng sáng xoay quanh logo",
    "FIX: nhạc nền sau khi tải lại trang phát to hơn mức đã đặt (bus nhạc mở ở 0.5 cố định)",
    "FIX: Tab không còn thoát ra khỏi modal đang mở; focus được giữ trong hộp thoại và trả lại khi đóng",
    "FIX: gợi ý changelog ở menu ghi cứng v1.1.5 thay vì đọc phiên bản hiện tại",
    "FIX: nút Xuất báo “đã copy” dù clipboard trống; toggle tự về mặc định khi storage bị chặn; âm thanh tự bật lại sau reload",
    "222 unit tests / 29 file — thêm 6 module thuần: safeStorage · palette · spawn · math · time · clipboard",
  ],
  itemsEn: [
    "Settings rebuilt into six sections: Quick presets · Audio · Display & motion · Language · Backup · Data",
    "Three control types in one dialog: on/off switches, two-way pickers, 0–100 levels with a ten-segment bar",
    "Real loudness for SFX and music (0–100), applied live without a reload",
    "Shake level low/high (45% and 100% of the trauma) and visual quality low/high (230 vs 460 particles, glow off)",
    "Auto-pause on tab switch — toggleable; losing focus suspends the run",
    "Four one-tap presets: SMOOTH · BALANCED · CINEMATIC · SPEEDRUN — never touching your language; tweak anything and the badge flips to CUSTOM",
    "Export/import the configuration as JSON to carry it between machines",
    "Language moved all the way into Settings — the floating corner switcher and the pause-screen row are gone",
    "Layered menu scene: drifting nebulae, a breathing light ray, two twinkling starfields, a rotating ring around the jar, a shine sweep across PLAY",
    "Author card: a perpetually panning gradient border plus a rotating halo around the logo",
    "FIX: music played louder than configured after a reload (the music bus opened at a flat 0.5)",
    "FIX: Tab can no longer escape an open modal; focus is trapped and restored on close",
    "FIX: the menu changelog hint was hardcoded to v1.1.5 instead of reading the current version",
    "FIX: export claimed “copied” with an empty clipboard; toggles reverted when storage was blocked; sound turned itself back on after a reload",
    "222 unit tests / 29 files — six new pure modules: safeStorage · palette · spawn · math · time · clipboard",
  ],
};
