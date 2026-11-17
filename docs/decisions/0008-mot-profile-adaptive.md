# ADR 0008 — Một `AdaptiveProfile` cho mọi bề mặt

| | |
| --- | --- |
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | 2026-11-04 (v1.1.8 vòng 8 — hợp đồng vòng 8; siết thêm các vòng 12–18) |

## Bối cảnh

Trước vòng 8, mỗi bề mặt tự đo viewport: hero có breakpoint riêng, hộp thoại có
media query riêng, canvas hỏi `window.innerWidth` nơi nó cần. Kết quả là màn
hình mà hero chọn «row» nhưng modal vẫn «stack», và hai nơi cùng một viewport
lại hai quyết định. Mỗi sự kiện resize chạy ba lần tính toán và **không lần nào
hỏi lần kia**.

Cách sửa hiển nhiên là gom — nhưng gom sai kiểu thì càng tệ: một biến global
đọc lén ở mọi nơi, hoặc mỗi component vẫn tự gọi `useAdaptive()` rồi tự diễn giải.

## Quyết định

1. **Một điểm giải**: `resolveAdaptive({ box, env })` trả **một** `AdaptiveProfile`
   — plan (scene/reserve/fit/minimal), hero, cỡ chữ, hộp thoại, canvas, mức
   chuyển động, bậc chip, held/repair — một object, không ai tự suy lại.
2. `useAdaptive()` là **kênh phát** duy nhất: mọi consumer nhận cùng profile qua
   context, không giữ bản sao riêng.
3. Profile mang cả **tên quyết định** (`chip.reason`, `fit`, `hero`, `held`,
   `repair`) — consumer vẽ theo tên, không đoán lại từ số.
4. Mọi bất biến kiểm trên profile, không kiểm trên DOM: 15 bất biến × 578 cửa sổ
   trong audit, corpus sự cố chụp lại từng quyết định thành JSON.

## Lý do chọn

- Một object một lần tính = không thể lệch giữa hai bề mặt cùng viewport.
- Tên quyết định trong profile là thứ làm `diagnose()` trả lời được *vì sao* —
  audit đọc tên, không đọc lại hình học.

## Hệ quả

- Thêm một bề mặt mới là thêm một **consumer**, không thêm một phép đo — nếu
  chỗ mới tự đo viewport thì đó là lỗi, không phải tối ưu.
- `readInsets()` cache 1 s và `planMotion()` factor là **phần của profile**;
  sửa chúng là sửa profile, mọi bề mặt theo ngay.

## Kiểm chứng

- `tests/adaptive-fixtures.test.ts` — tính lại từng quyết định của corpus
  1 110 cửa sổ, kiểm tính nhất quán nội tại.
- `tests/adaptive-regressions.test.ts` — corpus sự cố khớp lại cả `device`,
  kể cả sau khi ngưỡng chuyển.
- `npm run audit:adaptive -- --check` · `npm run check:adaptive` — trong
  `npm run check`.
- `tests/adaptive-motion.test.ts` — grade ↔ factor ↔ biến CSS khớp từng cửa sổ.
