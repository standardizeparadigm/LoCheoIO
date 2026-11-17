# Thiết kế: nền menu nhiều lớp (v1.1.6 → chỉnh tương phản ở v1.1.7)

Menu v1.1.6 không dùng ảnh nền — **toàn bộ scene là CSS thuần**, xếp lớp từ xa tới gần, mỗi lớp có
tốc độ và chu kỳ riêng để mắt không bắt được "vòng lặp". Mục tiêu: menu **sống** nhưng không tranh
chấp sự chú ý với hai panel góc và nút CHƠI.

## Thứ tự lớp (z thấp → z cao)

| # | Lớp | Class (`src/index.css`) | Chuyển động | Chu kỳ |
| --- | --- | --- | --- | --- |
| 1 | Nền quầng màu | `aurora-bg` | `lc-aurora-drift` — bốn quầng màu trượt ngang, `background-size: 200%` | 16 s |
| 2 | Tinh vân trôi | `nebula-a` · `nebula-b` | `lc-nebula-a` / `lc-nebula-b` — dịch + phóng nhẹ, ngược chiều nhau | 17 s / 19 s |
| 3 | Tia sáng chéo | `light-ray` | `lc-ray` — nghiêng rất nhẹ, opacity thở | 11 s |
| 4 | Sao xa | `star-field-far` | `lc-twinkle` chậm, mờ, trễ 1.3 s | 5.2 s |
| 5 | Sao gần | `star-field` | `lc-twinkle` nhanh hơn, sáng hơn | 3.6 s |
| 6 | Sàn gạch | `tile-floor` + `tile-floor-mask` | **tĩnh** — mask mờ dần về đỉnh, không animation | — |
| 7 | Vòng sáng quanh lọ | `glow-ring` · `jar-glow` | `lc-ring-rotate` + `lc-jar-glow` | 9 s / 3.4 s |
| 8 | Vệt sáng nút CHƠI | `cta-shine` (qua `MenuItemButton shine`) | `lc-cta-shine` — vệt trắng chạy ngang | 2.9 s |

## Độ tương phản — bài học v1.1.7

v1.1.6 thêm lớp nền nhưng **không đo lại tổng độ tối**, nên kết quả bị "mờ/đục".
Bốn lớp cộng hưởng:

| Lớp | v1.1.6 | v1.1.7 | Ghi chú |
| --- | --- | --- | --- |
| `.nebula-a/b` | `filter: blur(64px)`, opacity đỉnh `1.0` | `blur(22px)`, đỉnh `0.80` | 64px > nửa bán kính khối 46vw → mép biến mất |
| Vignette menu | nội tuyến `rgba(6,26,26,0.42→0.88→1.0)` phủ toàn màn hình | `.menu-vignette`: `0.30` góc trên-trái, `0.62` mép dưới | trung bình ~70% đen → còn ~20% |
| Khung CRT | `inset 0 0 140px rgba(6,26,26,0.9)` | `.app-vignette`: `inset 0 0 90px rgba(6,26,26,0.55)` | 140px ăn gần hết bốn góc |
| `.tile-floor` | `opacity-45` | `opacity-70` | dưới vignette cũ sàn gần như vô hình |

**Quy tắc mới (bắt buộc khi thêm lớp):**

6. **Lớp trang trí không bao giờ đục 100%** — tinh vân, quầng sáng, tia sáng đều phải ≤ 0.85 ở đỉnh.
7. **Blur ≤ 24px cho khối trang trí lớn** — blur lớn hơn làm mất hình khối và tạo cảm giác "sương".
8. **Vignette chỉ ở góc/viền, không phủ giữa màn hình** — nếu cần tối, dùng hai radial ở góc như
   `.menu-vignette`, không dùng một radial phủ 100%.
9. **Mọi lớp phủ tối phải là CSS có tên**, không phải utility viết thẳng trong JSX — để còn đo, còn
   chỉnh một chỗ, và để `prefers-reduced-motion` với tới được.

Trước khi merge một thay đổi nền: chụp màn hình ở 1280×720 và ở 800×600, so sánh độ sáng trung bình
vùng giữa (phải sáng hơn vùng góc ít nhất 1.5×).

## Quy tắc

1. **Chỉ `transform`, `opacity` và `background-position`** — không animate `width/height/top/left/filter`
   (layout thrash và repaint toàn lớp trên máy yếu).
2. **Chu kỳ lệch nhau** (16/17/19/11/5.2/3.6/9/3.4/2.9) — không chu kỳ nào là bội của chu kỳ khác, nên
   mắt không nhận ra điểm lặp. Con số trong bảng trên là **nguồn duy nhất**; `tests/menu-scene-motion.test.ts`
   đọc bảng rồi đối chiếu với `src/index.css`, nên tài liệu không thể lùi lại một mình.
3. **Mọi lớp đều `pointer-events-none`** — không bao giờ chặn click của panel góc.
4. **`prefers-reduced-motion`** tắt sạch: mỗi class animation đều nằm trong khối `@media` ở cuối `index.css`.
   Thiếu một class ở đó là bug — xem checklist trong `docs/guides/accessibility.md`.
5. **Giới hạn GPU**: 8 lớp là mức trần. Thêm lớp thứ 9 phải bỏ một lớp cũ hoặc chứng minh được 60 fps
   trên máy tham chiếu (xem `docs/guides/performance.md`).

## Vì sao không dùng canvas/video?

- Canvas đã dành cho gameplay — thêm một vòng `requestAnimationFrame` cho menu là lãng phí pin.
- Video nền phá cam kết **single-file, offline, 0 asset ngoài**: bundle sẽ phình lên hàng MB.
- CSS thuần ở đây chỉ tốn ~4 KB trong bundle đã build (đo bằng `dist/index.html` trước/sau).

## Liên quan

- `docs/design/menu-icons.md` — bộ icon của panel góc.
- `docs/design/menu-corners.md` — bố cục hai panel GAME/INFO.

## Sàn gạch đứng yên — quyết định, không phải thiếu sót

Bảng trên từng ghi `tile-floor` là «trôi dọc, 12 s». Trong `src/index.css` lớp đó **không** có
`animation`, và đã không có từ lâu: sàn là lớp phủ **rộng nhất** màn hình (100% × 100%), nên
`background-position` trên nó là repaint toàn khung ở mỗi frame — đúng thứ đắt nhất trên máy yếu,
trong khi chuyển động gần như không đọc được qua mask và vignette. Bốn lớp còn lại (quầng màu, hai
tinh vân, hai tầng sao, tia sáng) đã đủ để scene «sống».

Nay tài liệu ghi **tĩnh**, và test kiểm đúng điều đó: nếu ai thêm animation cho sàn, bảng phải đổi
theo hoặc test đỏ.
