import type { ChangelogEntry } from "../types";

/**
 * v1.0.0 — released 2026-10-26 — tier: MAJOR
 *
 * Bản đầu tiên — Lọ Chéo: Hũ Dưa Đại Chiến
 *
 * 9 bullets (vi) / 9 (en). Keep the two lists the same length:
 * tests/changelog-tiers.test.ts asserts it, and the panel would show an
 * uneven list otherwise.
 */
export const V1_0_0: ChangelogEntry = {
  version: "1.0.0",
  date: "2026-10-26",
  kind: "feature",
  vi: "Bản đầu tiên — Lọ Chéo: Hũ Dưa Đại Chiến",
  en: "The first release — Lọ Chéo: Pickle Jar War",
  itemsVi: [
    "Bản đầu tiên của Lọ Chéo: Hũ Dưa Đại Chiến",
    "Lọ dưa chỉ chịu đi đường chéo — cơ chế gốc của toàn bộ game",
    "Hứng dưa để đầy hũ, né mốc/ruồi/sâu, chém đồ hư bằng cú lướt chéo",
    "Cú SLAM lắc hũ để hút và đánh bay mọi thứ quanh lọ",
    "Hệ thống combo và nhân điểm theo chuỗi",
    "Vật phẩm đặc biệt: Đá Lạnh (làm chậm), Tỏi Vàng (khiên), Cải Vàng (đầy nhanh), Muối Vàng (bùng hũ)",
    "Đồ hoạ canvas vẽ tay, hoạt ảnh splat, hạt văng và rung màn hình",
    "Nhạc nền ngũ cung và hiệu ứng âm thanh tổng hợp bằng WebAudio — không cần file âm thanh",
    "Chơi được hoàn toàn offline, không gửi byte nào lên mạng",
  ],
  itemsEn: [
    "The first release of Lọ Chéo: Pickle Jar War",
    "The jar only moves diagonally — the core mechanic of the whole game",
    "Catch pickles to fill the jar, dodge mould/flies/worms, slice hazards with a diagonal swipe",
    "SLAM shakes the jar, pulling in and blasting away everything around it",
    "A combo system with chain-scaled score multipliers",
    "Special items: Ice Stone (slow-mo), Golden Garlic (shield), Golden Cabbage (fast fill), Golden Salt (jar burst)",
    "Hand-drawn canvas art with splat animations, particle bursts and screen shake",
    "A pentatonic soundtrack and synthesised SFX from WebAudio — no audio files at all",
    "Fully offline; not a single byte is sent over the network",
  ],
};
