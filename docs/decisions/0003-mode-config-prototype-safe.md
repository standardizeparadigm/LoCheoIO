# ADR 0003 — Tra cứu chế độ prototype-safe qua `modeConfigFor()`

| | |
| --- | --- |
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | 2026-11-17 (v1.1.8 vòng 17-18) |

## Bối cảnh

Mọi nơi đọc cấu hình chế độ đều viết trực tiếp `MODES[this.mode]` — 14 chỗ chỉ
trong mỗi tick của engine. `MODES` là một object thường, nên `Object.prototype`
cung cấp sẵn các key không phải chế độ:

- `MODES["constructor"]`, `MODES["toString"]` → trả về hàm, không phải record;
- `MODES["__proto__"]` → trả về prototype;
- một chuỗi lạ từ bản lưu (`restoreRun` ép trạng thái qua `this.mode`) hoặc từ
  i18n có thể đi đến đó mà không qua bước kiểm tra nào.

Hậu quả không phải crash lốp đốp mà là hành vi sai âm thầm: đọc `timeLimit` của
một hàm trả `undefined`, nhân điểm với `undefined`, và `maxCracks ?? 3` lẻ tẻ
rải trong code mỗi nơi một cách phù hợp riêng.

## Quyết định

1. **Một lối tra cứu**: `modeConfigFor(id)` trong `src/game/modesIndex.ts` —
   dùng `isModeId()` (kiểm tra từng key của `MODES`, không quét prototype),
   id lạ trả về record `classic`.
2. **Bọc cả 14 chỗ đọc trong tick** và mọi chỗ đọc ngoài engine
   (`PauseScreen`, `GameOverScreen`, `InfoMenu`) qua `modeConfigFor()`.
3. **`restoreRun()` ép trạng thái lưu qua `modeConfigFor`** — bản lưu hỏng
   không mang được id lạ vào tick.
4. **`setMode()` giữ nguyên hành vi của nó**: guard
   `Object.prototype.hasOwnProperty.call(MODES, m)` — id lạ thì **giữ nguyên
   chế độ hiện tại**, không rơi về classic. Hai hàm, hai hợp đồng, không gộp.
5. **`maxCracks ?? 3` → `maxCracksFor()`** — có clamp, trunc, và một bảng ngân
   sách nứt duy nhất.

## Lý do chọn

- `Object.create(null)` hoặc `Map` cho `MODES` đổi kiểu dữ liệu của cả hệ —
  dọn một lỗi bằng cách đổi tất cả những thứ xung quanh, trái nguyên tắc của
  dự án.
- Tra cứu an toàn tại **một** điểm giữ ngữ nghĩa cũ cho mọi caller đúng.

## Hệ quả

- Mọi id lạ giờ có hành vi đã biết: đọc → classic; `setMode` → giữ nguyên.
- Thêm chế độ mới không phải sửa tra cứu — chỉ thêm record vào `MODES`.

## Kiểm chứng

- `tests/mode-config-guard.test.ts` — `__proto__`, `constructor`, `NaN` rơi về
  `classic`; id thật trả đúng record.
- `tests/engine-modes.test.ts` — chín chế độ chạy thật trong engine headless,
  gồm cả hardcore vỡ sau đúng một vết nứt (`maxCracksFor`).
- `tests/modes-audit.test.ts` — badge ↔ số liệu, ngân sách nứt, bảng spawn.
