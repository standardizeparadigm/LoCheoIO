# Hiệu năng & ngân sách render

## Ngân sách hiện tại (giữ nghiêm túc khi chỉnh engine)

| Tài nguyên | Trần | Ghi chú |
| --- | --- | --- |
| Particles | ≤ 460 | splat/lấp lánh/văng nước muối |
| Items rơi cùng lúc | ≤ 70 | trần mềm — spawn rate thấp hơn |
| Popups (text điểm) | ≤ 34 | evict theo tuổi |
| DPR | ≤ 2 | `Math.min(devicePixelRatio, 2)` |
| Frame delta | clamp 1/20s | chống teleport sau tab switch |
| Tile floor | pre-render 1 lần | offscreen canvas, vignette + light pools |
| Glow (`shadowBlur`) | chỉ ở `visualQuality: high` | 12 điểm vẽ — `low` bỏ hẳn, tiết kiệm nhất là lúc nhiều hạt |

## Chất lượng hình (v1.1.6)

`settings.visualQuality` không phải "cảm giác" — nó đổi hai thứ đo được:

| | `high` (mặc định) | `low` |
| --- | --- | --- |
| Trần hạt | **460** | **230** |
| `shadowBlur` glow | 12 điểm vẽ | tắt hoàn toàn |
| Mục tiêu | 60 fps trên laptop 2019+ | 60 fps trên máy tích hợp GPU / điện thoại cũ |

Preset **MƯỢT** bật `low` + `reducedMotion`; **ĐIỆN ẢNH** giữ `high` + rung mạnh. Người chơi đổi được
trực tiếp trong Settings → *Giao diện & chuyển động* mà không cần reload ván.

## Chuyển động độc lập frame-rate (v1.1.6)

Các đường "mượt dần về đích" (`hudAlpha`, `timeScale`, bán kính ring) trước đây viết
`lerp(x, target, Math.min(1, dt * k))` — chỉ đúng ở 60 Hz. Trên màn 120/144 Hz tốc độ cảm nhận khác hẳn,
và một khung hình dài (GC, chuyển tab) đẩy `dt * k` vượt 1 rồi bị kẹp → giật.

`utils/math.ts → damp(current, target, rate, dt)` dùng dạng hàm mũ `1 - e^{-rate·dt}`: cùng một `rate`
cho cùng một kết quả ở **mọi** tần số quét, và không bao giờ overshoot. `tests/math.test.ts` khoá lại
bằng phép so sánh 2 × 1/120 s với 1 × 1/60 s.

## Tại sao alpha tĩnh mà vẫn nhanh

- `tile-floor` pre-render → mỗi frame chỉ `drawImage`.
- Va chạm: **spatial sweep** theo trục y, không O(n²) toàn cục.
- HUD canvas vẽ trực tiếp — không roundtrip React trong hot loop.
- `requestAnimationFrame` duy nhất, `timeScale` xử lý slow-mo (Đá Lạnh) + hit-stop (freeze 30–90ms mỗi lần hứng đúng — cảm giác "punch").

## Đo đạc nhanh

- Chrome DevTools → Performance → record 10s gameplay → tìm long frames > 16ms.
- `console.time("frame")` quanh loop nếu cần chi tiết hơn.
- Mục tiêu: sustained 60fps trên laptop phổ thông 2019+; DPR 2 không giảm khung.

## Tối ưu single-file

- Font woff2 subset + `font-display: swap` + unicode-range → phần lớn text Latin dùng 1 file.
- Build một file duy nhất (`vite-plugin-singlefile`) — artifact ~867 KB / gzip ~399 KB (v1.1.8,
  tăng ~20 KB so với v1.1.7 vì thêm bốn thư mục menu (`layout`, `scene`, `ticker`, `howto`) + 2 key i18n
  × 7 locale + bản mô tả 1.1.8 dài 14 gạch × 2 ngôn ngữ).
- Không runtime dependency nào ngoài React/ReactDOM (clsx/tailwind-merge chỉ cho class names).
