# ADR 0007 — Governor khung hình: hạ sau 2 khung chậm, trả lại sau 6 khung nhanh

| | |
| --- | --- |
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | 2026-11-17 (v1.1.8 vòng 17) |

## Bối cảnh

Game quảng cáo 60fps, nhưng nó chạy trên máy thật: một chiếc điện thoại yếu có
thể mở ba hiệu ứng nền cùng lúc với một tab music app phía sau. Hai thái cực
đều sai:

1. **Chạy hết mình đến khóc** — hình đẹp, fps rơi, người chơi bỏ.
2. **Tắt dần theo thiết bị** — phân loại thiết bị là một dự đoán; dự đoán sai là
   giật trên máy mạnh và nhạt trên máy yếu.

Cái cần là đo **máy thật đang chạy** — nhưng đo trong game là một cái bẫy: một
frame chậm không phải dấu hiệu (GC, đổi tab, frame đầu sau resize — stall), và
hạ chất lượng cũng phải có lối thoát, không thì game chậm mãi vì một giây tệ.

## Quyết định

`src/game/adaptive/perf.ts` — `FrameWatch`:

1. Lấy mẫu delta **thô**, trước clamp 50ms của vật lý — clamp trước là một lần
   nói dối số liệu: frame 3 giây trông như 50ms.
2. **2 khung chậm liên tiếp** → hạ một bậc `visualQuality`; **6 khung nhanh
   liên tiếp** → trả lại một bậc. Bất đối xứng là cố ý: hạ nhanh để đỡ giật,
   trả chậm để không nhấp nháy quanh ranh giới.
3. Stall (đổi tab, GC, frame đầu sau resize) không tính là mẫu.
4. `settings.visualQuality` là **trần**, không phải đích — governor không bao giờ
   vượt lựa chọn của người chơi.

## Lý do chọn

- Đo thực tế thay vì đoán thiết kế: phân loại thiết bị vẫn giữ cho mức chuyển
  động (`planMotion`), nhưng chất lượng khung hình là số liệu thật.
- Hai ngưỡng là hằng số nhỏ, dễ giải thích, dễ test headless.

## Hệ quả

- Chất lượng có thể dao động trong một ván dài — chấp nhận, vì dao động có sàn
  (trần của người chơi) và có trễ (6 khung).
- Không ai được ghi đè governor từ code gameplay — chỉ người chơi chặn trên.

## Kiểm chứng

- `tests/game-perf.test.ts` (20) — hạ sau 2 khung chậm, nâng sau 6 khung nhanh,
  stall/NaN không tính là mẫu, trần `visualQuality` không ai được vượt, engine
  lấy mẫu trước clamp vật lý.
