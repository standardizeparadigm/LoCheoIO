# Toàn bộ key `localStorage` của Lọ Chéo

Mọi dữ liệu đều nằm trên máy người chơi — game **không gửi byte nào lên mạng**.

| Key | Ghi bởi | Nội dung | Xóa khi |
| --- | --- | --- | --- |
| `locheo.scores.v1` | `storage.ts` | TOP 8 (normalize, dedupe theo id) | Hard reset (không có nút) |
| `locheo.progress.v1` | `storage.ts` | `{runs, totalJars, totalSliced, bestScore}` cộng dồn | Settings → Xóa dữ liệu |
| `locheo.achievements.v1` | `storage.ts` | Mảng id thành tựu đã mở | Settings → Xóa dữ liệu |
| `locheo.lang.v1` | `i18n/i18n.ts` | `"vi" \| "en" \| "zh" \| "ja" \| "ko" \| "es" \| "fr"` — gương của `settings.language` (v1.1.6: chọn ngôn ngữ nằm trong Settings) | Xóa thủ công |
| `locheo.mode.v1` | `App.tsx` | Chế độ đã chọn (`ModeId`) | Xóa thủ công |
| `locheo.muted.v1` | `App.tsx` | `"1"` hoặc `"0"` — trạng thái tắt tiếng, ghi mỗi lần đổi | Xóa thủ công |
| `locheo.settings.v1` | `settings.ts` | `{sfx, sfxVolume, music, musicVolume, shake, shakeLevel, reducedMotion, visualQuality, autoPauseOnBlur, language}` (v1.1.6) — xem `docs/design/settings-format.md` | Xóa thủ công · Settings → Khôi phục mặc định (giữ ngôn ngữ) |
| `locheo.run.v1` | `runSave.ts` | Snapshot ván dở (xem `docs/design/save-format.md`) | Game over · ván mới · Resume · Xóa dữ liệu |

## Một cửa duy nhất — `src/game/safeStorage.ts`

Từ v1.1.6, **mọi** truy cập `localStorage` đi qua `safeStorage.ts`:

| Hàm | Việc | Khi storage bị chặn |
| --- | --- | --- |
| `STORAGE_KEYS` | Danh mục key duy nhất (nguồn sự thật của bảng trên) | — |
| `storageAvailable()` | Probe ghi/xoá thật → `boolean` | `false` |
| `readRaw` / `writeRaw` / `removeRaw` | Đọc/ghi/xoá thô | `null` / `false` / no-op |
| `readJSON` / `writeJSON` | Đọc-parse & stringify-ghi gộp một bước | `null` / `false` |
| `clearAllGameKeys()` | Xoá đúng **8** key của game, không đụng key khác | no-op |

Trước đây mỗi module tự bọc `try/catch` — `settings.ts` và `runSave.ts` thậm chí parse JSON hai lần. Giờ tất cả đi qua một lớp, và `tests/safeStorage.test.ts` (7 test) khoá hành vi: Safari private mode, quota, JSON hỏng, object circular.

## Ghi chú an toàn

- Tất cả reader đều **chịu dữ liệu rác**: JSON hỏng / kiểu sai / thiếu field → fallback default, không bao giờ crash.
- `locheo.scores.v1` khi trống → board được seed bằng điểm của game (hiển thị TOP 8 "ma" làm mốc).
- **Private mode / storage bị chặn**: game chạy hoàn toàn in-memory; cài đặt không lưu được giữa các phiên — hiển thị bình thường, không báo lỗi.
- Settings → **Xóa dữ liệu đã lưu** dọn: scores · progress · achievements · run snapshot (gọi cả `clearAllProgress()` lẫn `clearSavedRun()`).

## Vì sao bảng này có 8 dòng và code có 8 key

Đây là một con số **kiểm được**, nên nó có test: `STORAGE_KEYS` là nguồn sự thật,
và bảng trên phải liệt kê đúng từng key một.

`locheo.muted.v1` từng **thiếu** khỏi bảng trong khi `App.tsx` ghi nó mỗi lần
người chơi bấm `M`. Đó là loại lỗi tài liệu tệ nhất: bảng trông đầy đủ, và người
đọc kết luận chế độ tắt tiếng không được lưu — hoặc tệ hơn, rằng nó **được** lưu
trong `settings` và đi sửa nhầm file.

**Quy tắc:** thêm key vào `STORAGE_KEYS` thì thêm dòng ở đây **cùng commit**.
`tests/storage-doc.test.ts` chặn nếu không.
