# Quy trình phát hành một phiên bản (rút từ v1.1.5, v1.1.7 và v1.1.8)

## Checklist

1. **Scope lock** — liệt kê tính năng/bugfix; cái nào "giữ nguyên" thì ghi rõ là giữ.
2. **Code + tests** — tính năng lõi (pure logic) phải có unit test; `npm run check` xanh liên tục.
3. **i18n** — key mới thêm đồng thời vào **7 locale** cùng commit; parity test ép đồng bộ (1.1.8: **306 khoá** × 7 locale).
4. **Version bump đa điểm** — `package.json` + lock · `src/version.ts` · `index.html` (`<meta name="version">`) · `scripts/play-linux.sh` · `scripts/play-mac.command` · `scripts/play-windows.bat` (giữ CRLF+BOM!) · `assets/banner.svg` · `assets/settings-sections.svg` (aria-label + tiêu đề) · README ×10 (badge + tree + releases row + what's-new) · `docs/` · `.github` nếu cần. **Grep `1\.1\.[0-7]` sau khi bump** — v1.1.7 tìm ra 6 file còn sót, v1.1.8 phải quét cả 10 README, `docs/` và 19 SVG.
5. **CHANGELOG.md** — mục `[x.y.z] — date` (Keep a Changelog), newest-first; link `[x.y.z]: …/releases/tag/vx.y.z` cuối file.
6. **Release notes** — `docs/releases/vx.y.z.md`: ngày, tác giả, TL;DR, Highlights, Added/Fixed (kèm **nguyên nhân gốc**), Changed, verification matrix, migration notes.
7. **Docs đồng bộ** — DESCRIPTION, CONTRIBUTING, scripts/README, trees, test counts.
8. **Smoke** — `npx vite-node scripts/smoke-ssr.tsx` (headless render) khi có UI mới.
9. **PR** — một nhánh `arena/<id>` → base `main`; **user merge**, không tự merge.
10. **Kiểm tra chéo trước khi mở PR** — ba cổng phải xanh **cùng lúc**:
    `npm run check` (typecheck + toàn bộ test + build), `npm run smoke`, và
    `npm run check:readme` + `npm run check:i18n` (10 README đồng bộ, 7 locale parity).
    Ghi lại output của cả ba vào phần *verification* của release notes.

    **Đừng chép số test vào đây.** Câu cũ ghi "393 tests" và đúng vào lúc viết;
    ba vòng sau nó sai và không ai đọc lại. Số test là thứ `npm run check:readme`
    kiểm tra được; con số nằm trong tài liệu thì không.

## Tầng phát hành (từ v1.1.7)

Mỗi bản phát hành có **một tầng**, suy ra từ SemVer bằng `tierFor(version)` trong
`src/game/changelog/tiers.ts` — **không gõ tay**, vì đã từng gõ sai:

| Tầng | Khi nào | Nhãn UI | Màu |
| --- | --- | --- | --- |
| **MAJOR** | `x.0.0` — thêm hệ thống mới, đổi cách chơi | MAJOR | 🩷 hồng `#ff5fb0` |
| **UPDATE** | `x.y.0` — thêm nội dung, làm lại một mảng | UPDATE | 🟡 vàng `#f5a81c` |
| **PATCH** | `x.y.z` (z ≠ 0) — sửa lỗi, dọn dẹp, tài liệu | PATCH | 🟣 tím `#9d6bff` |

Hệ quả cho người làm bản phát hành:

1. **Không tự đặt tầng.** Nếu bạn thấy mình muốn gọi một bản là UPDATE nhưng số là
   `1.1.8`, thì số đang sai — hãy bump `1.2.0`.
2. **Ngày phải tăng nghiêm ngặt.** `tests/changelog-tiers.test.ts` bắt buộc điều này;
   trước 1.1.7 có bảy bản ghi cùng một ngày và không test nào bắt được; từ 1.1.8 `tests/changelog-tiers.test.ts` chặn việc đó.
3. **Mỗi bản ≥ 5 gạch mô tả.** Một dòng tóm tắt là chưa đủ cho panel trong game.
4. **Cập nhật cả ba nơi**: `src/game/changelog/entries/<bản>.ts`, `CHANGELOG.md`, và
   bảng "Releases" trong 10 README — cả ba đều mang cột tầng.

## Anti-patterns (học từ lịch sử)

- Đừng để "releases table ở README" trỏ sai version — badge link và bảng phải khớp `APP_VERSION`.
- Đừng sửa historical release notes (ngày/claimed features giữ nguyên trừ lỗi fact-sai nghiêm trọng).
- Đừng bump docs mà quên launcher/banner — chúng không đọc `APP_VERSION` (ngoài bundle).
- Test count phải khớp thực tế (`npx vitest run` đếm hộ) — v1.1.5 từng lệch 72 vs 76 suốt 2 commit trước khi sửa.
- **Đừng chỉ sửa số test ở một file docs.** v1.1.6 phải quét 2 lượt: lần đầu `177 → 222` chỉ đổi số,
  các cụm *đếm file* theo từng ngôn ngữ (`22ファイル`, `22개 파일`, `22 archivos`…) còn sót — phải grep lại
  theo **mọi** biến thể ngôn ngữ, không chỉ tiếng Anh.
- **Đừng cộng dồn lớp phủ tối mà không đo.** v1.1.6 thêm bốn lớp nền đẹp nhưng không kiểm tra tổng độ
  tối → v1.1.7 phải sửa. Xem `docs/design/menu-scene.md` § Độ tương phản.
- **Đừng để ngày phát hành trùng.** Bảy bản từng ghi chung `2026-11-13`; khi mọi bản cùng ngày thì
  không thể sắp lịch sử, không thể viết "2 ngày sau bản trước", và panel trong game trông như bị lỗi.
- **Đừng để ngày phát hành *đều*.** Sửa xong ngày trùng thì cả mười bản lại cách nhau **đúng hai ngày**,
  rơi vào thứ Bảy và Chủ nhật — đúng nhịp của một lịch bịa, không phải của một dự án. Nhịp thật có
  hotfix sau một hôm, có bản cuối tuần, có tuần nghỉ. `tests/release-timeline-doc.test.ts` khoá
  **tính chất** (mọi bước 1–5 ngày · có ít nhất một hotfix · không quá hai bản rơi cuối tuần) chứ
  không khoá một hằng số, vì khoá hằng số chính là thứ đã sinh ra nhịp đều.
- **Đừng sửa ngày bằng cách lặp qua từng cặp (cũ, mới).** Lần đầu tôi làm thế và `11-10 → 11-12`
  rồi chính `11-12` đó `→ 11-13`, nên 1.1.7 trùng ngày 1.1.8. Phải quét **một lượt** với hàm tra cứu,
  hoặc ghi đè trực tiếp từ `date:` trong `src/game/changelog/entries/*.ts` — nguồn duy nhất.
- **Đừng viết cứng số phiên bản trong script.** `scripts/check-readme-sync.mjs` từng hardcode `1.1.6`
  trong cả comment lẫn hai literal; giờ nó đọc `src/version.ts`.
- **Đừng thêm code không được gọi.** Một `JarLogo` "chuẩn bị dùng" từng vào lịch sử rồi phải soft-reset;
  `canCopy()` trong `clipboard.ts` cũng bị bỏ vì không nơi nào dùng. Trước khi commit một helper mới, grep
  xem có call site thật chưa.
