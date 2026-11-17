# ADR 0005 — Engine được test headless qua fake canvas, không jsdom

| | |
| --- | --- |
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | 2026-11-17 (v1.1.8 vòng 17) |

## Bối cảnh

Đến trước vòng 17, engine chưa từng chạy trong vitest: những gì được gọi là
«test engine» thực ra test các hàm thuần (toán mode, toán combo) và giả định
phần nối vào canvas đúng. Chính chỗ này từng chảy máu: `setMode()` đổi một dòng
và 21 lời gọi trong tick theo nó — không test nào đỏ vì không test nào chạy
engine.

Chọn môi trường chạy thật:

1. **jsdom/canvas thật** — nặng, không xác định, và vẽ canvas trong CI là một
   việc không cần đến pixel.
2. **Chỉ test hàm thuần** — chính là trạng thái đang có, và đã chứng minh không đủ.
3. **Engine headless với fake canvas + fake 2D context** — engine chạy thật
   từng tick, render bị ghi lại thay vì vẽ.

## Quyết định

`tests/helpers/engine-harness.ts` dựng một DOM tối thiểu (không jsdom): canvas
giả trả về `getContext("2d")` là một **Proxy** ghi nhận lời gọi, `requestAnimationFrame`
là hàng đợi tick điều khiển được. `engine-modes.test.ts` khởi tạo `LoCheoGame`
với harness, set từng chế độ, chạy tick tới thời điểm mong muốn, và khẳng định
trên trạng thái thật của engine:

- ĐUA 60 GIÂY dừng đúng 60.00 s;
- GỐM MỎNG vỡ hũ sau đúng một vết nứt (`maxCracksFor`);
- THẢNH THƠI không bao giờ spawn hazard;
- hệ số điểm ×1/×1.5/×0.6/×0.5/×2.0 nối đúng vào score;
- chín chế độ × các thời điểm — 22 test.

## Lý do chọn

- Proxy context giữ engine **nguyên trạng**: không thêm hook test vào code chạy
  thật, không đổi một dòng engine vì test.
- Tick điều khiển được giúp test thời gian mà không chờ thời gian — 60 giây của
  ĐUA chạy trong vài millisecond.

## Hệ quả

- Harness phải bám sát API context mà engine dùng; một lời gọi context mới mà
  Proxy không ghi nhận sẽ im lặng — chấp nhận, vì harness ghi nhận mọi property
  access, không có danh sách whitelist để sót.
- Engine giờ là vùng có test — sửa engine mà đỏ engine-modes là biết ngay chỗ nào.

## Kiểm chứng

- `tests/engine-modes.test.ts` — 22 test chạy engine thật trên fake canvas.
- `tests/engine-resize.test.ts` — nơi duy nhất kích thước canvas đi vào engine.
- `npm run smoke` — SSR render toàn cây menu/modal, nơi UI nối vào engine.
