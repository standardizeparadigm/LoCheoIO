# ADR 0006 — localStorage đi qua đúng một cổng: `safeStorage`

| | |
| --- | --- |
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | 2026-11-10 (v1.1.6 — `safeStorage` 7 test; siết chặt khi `storage/` tách thành 9 module ở v1.1.8) |

## Bối cảnh

Trước khi tách, các caller tự đặt `try { localStorage.getItem(…) } catch {}` rải
rác — mỗi nơi một cách nuốt lỗi, một cách parse JSON, và một cách trả mặc định.
Một bản lưu JSON hỏng có thể ném exception lên đúng lúc gameplay đang render,
hoặc tệ hơn: trả `undefined` và lặng lẽ xoá sạch bảng vàng vì «không có gì».

Tách `storage.ts` thành `storage/` (9 module) làm số caller tăng lên — và làm
vấn đề nhân bản try/catch tăng theo.

## Quyết định

1. **Một cổng duy nhất** vào localStorage: `src/game/safeStorage.ts` — `getItem`
   / `setItem` / `removeItem` trả `null` khi hỏng, không bao giờ ném.
2. JSON hỏng → `null`, không phải `{}` — caller phân biệt được «chưa từng lưu»
   với «lưu nhưng hỏng» mà vẫn không phải bắt exception.
3. `storage/` là **lớp nằm trên** `safeStorage`: hợp nhất, chuẩn hoá, clamp, cứu
   dữ liệu từng mục — nhưng không module nào trong chín module được chạm
   `localStorage` trực tiếp.

## Lý do chọn

- Kẹp mọi caller vào một cổng = một chỗ để audit, một chỗ để test hành vi hỏng
  (quota, chế độ riêng tư, tab ẩn).
- Nuốt lỗi ở cổng thay vì ở caller nghĩa là caller chỉ viết nhánh vui.

## Hệ quả

- Ghi `null` về localStorage có nghĩa là xoá key — hành vi được chọn và ghi rõ
  trong hợp đồng của `safeStorage`.
- Môi trường không có `window`/`localStorage` (SSR smoke) vẫn chạy: mọi call
  trả `null` / no-op.

## Kiểm chứng

- `tests/storage-normalise.test.ts` — chuẩn hoá: làm tròn, cắt tên, kẹp ngày,
  không NaN.
- `tests/storage-split.test.ts` — mọi ký hiệu cũ vẫn re-export, và chín module
  con không import vòng.
- `tests/game-perf.test.ts` · `tests/input-release.test.ts` — đọc mã nguồn,
  không cần DOM: bắt mọi chỗ tự đặt try/catch localStorage quay lại.
