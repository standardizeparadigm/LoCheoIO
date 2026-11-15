# Đóng góp cho Lọ Chéo — Hũ Dưa Đại Chiến

Cảm ơn bạn đã quan tâm tới hũ dưa này! Dưới đây là quy tắc đóng góp ngắn gọn.

## Nguyên tắc vàng

1. **Một file — không mạng — chơi được mãi mãi.** Không thêm dependency runtime nếu không thực sự cần thiết. Game phải chạy offline 100% từ `dist/index.html`.
2. **Đúng hồn Việt mộc mạc**: ngôn ngữ gốc của game là tiếng Việt (mọi chuỗi hiển thị đi qua `src/i18n/`, không hardcode), giao diện theo phong cách gạch bông/ẩm thực miền Nam, màu chủ đạo ngọc bích – nghệ – ớt.
3. **Hiệu năng là tính năng**: giữ budget (≤460 particles, ≤70 items, DPR ≤ 2), không re-render React trong hot loop.

## Quy trình

1. Fork repo → tạo branch `arena/<tên>` hoặc `feat/<tên>`.
2. `npm install` rồi `npm run check` (typecheck + 1029 tests + build) — tất cả phải xanh.
3. Nếu sửa logic thuần (`modes.ts`, `achievements.ts`, `storage.ts`, `src/i18n/i18n.ts`): thêm/sửa test trong `tests/`.
4. Nếu sửa gameplay/cân bằng: ghi rõ chế độ ảnh hưởng (Cổ điển / Thảnh Thơi / Ớt Lửa / Đua 60 Giây / Mùa Vàng) và đính clip trong PR.
5. Không commit `dist/` (đã có trong `.gitignore`) — artifact release được tạo bằng `npm run build`.

## Thêm ngôn ngữ mới

1. Tạo `src/i18n/locales/<lang>.ts` export `Record<MessageKey, string>` với **đúng key set** của `vi.ts` (thiếu/thừa key sẽ fail test `tests/i18n.test.ts`).
2. Cập nhật `LANGUAGES` trong `src/i18n/i18n.ts` và thêm nút vào `LanguageSwitcher.tsx` (+ key `lang.<lang>` trong **cả 7 locale**).
3. Xem `docs/guides/adding-a-locale.md` — parity test (`tests/i18n.test.ts`) ép đồng bộ key + placeholder.
4. Đồng bộ `<html lang>` (đã tự động) và số locale trong `numberLocale`.

## Kiểm thử

- `npm run typecheck` — TypeScript strict, `noUnusedLocals`.
- `npm run test` — vitest (1029 tests / 104 file).
- `npm run build` — phải ra đúng 1 file `dist/index.html`.
- `npm run smoke` — headless render smoke cho toàn bộ menu/modal.
- `npm run check:readme` — bảo vệ README 10 ngôn ngữ khỏi lệch version (chạy trong CI).

Tài liệu sâu hơn: [docs/guides/](docs/guides/) (engine overview, storage keys, a11y, performance, release process, thêm locale).

## Báo lỗi

Dùng GitHub Issues, ghi rõ: trình duyệt/OS, chế độ chơi, các bước tái hiện, và kèm console log nếu có.

## License

Đóng góp của bạn được cấp phép AGPL-3.0-only, cùng license với dự án.
