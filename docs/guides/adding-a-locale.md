# Thêm ngôn ngữ mới vào game (hoặc sửa dịch)

7 locale hiện có: `vi` (source of truth) · `en` · `zh` · `ja` · `ko` · `es` · `fr`.

## Các bước

1. **Copy `src/i18n/locales/vi.ts`** → `src/i18n/locales/<lang>.ts`, dịch toàn bộ value (không đổi key, không đổi thứ tự).
2. Đăng ký trong `src/i18n/i18n.ts`: thêm vào `LANGUAGES`, `detectInitialLanguage()` (prefix trình duyệt), `numberLocale()` nếu cần locale số riêng.
3. Thêm mã vào `LANGUAGES` (`src/i18n/i18n.ts`) — `LanguageSection` trong Settings tự sinh nút (cờ + tên bản ngữ), không còn `LanguageSwitcher` riêng từ v1.1.6.
4. Thêm một entry vào `LANGUAGE_META` (`src/i18n/languageMeta.ts`): `{ code, flag, native, short }` —
   thiếu bước này `tests/languageMeta.test.ts` fail (nó ép 1:1 với `LANGUAGES` và `SUPPORTED_LANGUAGES`).
5. Thêm mã vào `SUPPORTED_LANGUAGES` (`src/game/settings.ts`) để `normalizeSettings` chấp nhận nó.
6. Chạy `npm run check` + `npm run check:i18n` — parity test sẽ **fail** nếu thiếu key, sai placeholder,
   value rỗng hoặc trùng key.
7. Cập nhật docs: README (10 ngôn ngữ + mục languages), `docs/DESCRIPTION.md`, launcher (nếu muốn menu launcher dịch theo).

## Quy tắc dịch

- **Giữ nguyên placeholder** `{mode}` `{score}` `{jars}` `{n}` `{total}` `{name}` — parity test ép khớp với bản VI (xem `tests/i18n-v115.test.ts`).
- **Tone**: arcade Việt — hài hước, mộc mạc; tránh trang trọng kiểu hành chính.
- **Tên mode giữ nguyên** tên riêng (MUỐI DƯA CỔ ĐIỂN…), dịch phần mô tả/tagline.
- **Tiếng Việt có dấu đầy đủ** — tuyệt đối không bỏ dấu.
- Key mới → thêm vào **tất cả** 7 locale cùng commit (tests ép đồng bộ).
- **Đừng copy nguyên chuỗi tiếng Anh.** Từ v1.1.7, `check:i18n` có luật thứ 5: một locale không được
  mang nguyên văn chuỗi tiếng Anh. Nó đã bắt được 5 chuỗi chưa dịch khi mới bật (CHANGELOG → CAMBIOS /
  NOUVEAUTÉS, TOP → MEJORES / MEILLEURS / 상위). Miễn trừ có chủ đích:
  - `changelog.tier.{major,minor,patch}` — nhãn tầng là tiếng Anh ở mọi locale
  - mọi key kết thúc `.badge` — badge dạng `×1.25 · 60S` là số + một từ, dịch tay khi ra mode mới
  - danh sách `SAME_BY_DESIGN[locale]` trong `scripts/check-i18n.mjs` — chỉ thêm từ **đúng chính tả**
    ở locale đó (vd. tiếng Pháp `le score`, `la pause`), không thêm để né lỗi.

## Kiểm thử nhanh

```bash
npm run check:i18n                                  # parity text-level, ~40 ms, không cần build
npx vitest run tests/i18n.test.ts tests/languageMeta.test.ts
```

`check:i18n` (v1.1.8: **327 key × 7 locale**, 5 luật) là bản chạy trong CI (job `readme-sync`) — nó đọc file locale dưới dạng **text**, nên bắt được
cả lỗi cú pháp mà test TypeScript không thấy: key trùng trong cùng một file, value rỗng, placeholder lệch.
