# Quy trình rà soát ba lượt

Mỗi vòng của v1.1.8 kết thúc bằng ba lượt rà dưới đây. Chúng không thay thế
`npm run check` — chúng tìm những thứ **không cổng nào nhìn thấy**.

## Lượt 1 — cổng, đúng thứ tự

```bash
npm run check          # tsc · vitest · check-svg · check-adaptive · audit-adaptive --check · audit-drag --check · audit-modes · build
npm run smoke          # SSR render toàn cây menu/modal
npm run check:readme   # đồng bộ badge · ngày · version ở 10 README + verify badge/prose
npm run check:i18n     # 7 locale cùng key set
npm run check:assets   # mọi asset được tham chiếu hai chiều
```

Cổng này bắt được cấu trúc vỡ. Nó **không** bắt được:

- một con số đúng nằm trong câu văn bằng tiếng bản địa (pattern của
  `sync-prose-counts` không khớp tiếng Nhật, tiếng Hàn, tiếng Thái, tiếng Trung);
- một fixture được sinh từ code đã đổi mà không chạy lại generator;
- một ngày phát hành muộn hơn ngày code thực sự đi đường;
- một corpus khẳng định sai chính hợp đồng của nó ở một trường không được so.

## Lượt 2 — quét tay những chỗ cổng không nhìn

### 2.1. Số sống trong câu văn

Câu văn bằng tiếng bản địa là bờ biển riêng. Đã từng lọt: `1553/145` ở ja/ko/th/zh
(năm chỗ mỗi file), lớp `256` và `360` cũ hơn còn sót trong th/zh, dòng cây
`tests/` ghi `97 file · 981` ở sáu bản latin, `docs/README.md` còn
`1458 test / 137 file` cho bản **đang phát hành**. Quét: badge là nguồn, thân
văn là nghi phạm — mọi cụm số đứng cạnh chữ
"file/files/Dateien/archivos/fichiers/ファイル/파일/ไฟล์/个文件" phải
được đối với badge — trừ các dòng **lịch sử** (bảng releases, tường thuật
«thay vì X», các bản cũ).

### 2.2. Ngày phát hành

Ngày của một bản phát hành có đúng một nguồn sự thật: `date:` trong
`src/game/changelog/entries/*.ts`. Chuỗi dời ngày của chính v1.1.8 (11-15 →
11-16 → 11-17 → 11-18) là minh chứng: giữ nhãn cũ khi vòng mới khép là lặp lại
mẫu lỗi «date muộn sau khi code đã ship». Đối chiếu ba nguồn + `release-tiers.svg`
+ con trỏ «bản kế tiếp» của bản trước + hàng release ×10 README.

### 2.3. Fixture và corpus

```bash
npx vite-node scripts/gen-regression-fixtures.ts   # và bốn generator còn lại
git status tests/fixtures/                          # dirty = code đã đổi mà corpus chưa kịp
```

Cây dirty sau khi sinh là **tin tốt**: generator vừa bắt được một thay đổi mà
test snapshot không so tới (dạng lỗi thật: `device: "tablet"` còn nguyên sau khi
ngưỡng tablet chuyển). Khi đó: commit corpus mới **cùng** một guard test so
thêm trường đã trôi, để lần sau generator không phải làm CSI.

### 2.4. Hai chiều của số đếm tài sản

Thêm hình là đổi **bốn** chỗ: `EXPECTED_ASSETS` (check-svg), pin trong
`assets-table.test.ts`, bảng `docs/assets.md` (hàng + dòng thời gian biểu), và
cụm «N SVGs» do `sync-prose-counts` ghi. Quên một trong bốn là một commit mà
gates vẫn xanh — vì mỗi gate chỉ nhìn một chỗ.

## Lượt 3 — lặp lại

Lượt 1–2 chạy lại sau khi mọi sửa đã vào chỗ. Ba lượt là con số đã được kiểm
bằng thực tế: lượt 2 của vòng 18 bắt được dòng trống mất sau đoạn chèn trong
mười README — lỗi mà lượt 1 vẫn xanh trọn vẹn.

## Danh mục dạng lỗi đã từng lọt qua cổng

| Dạng lỗi | Vòng bắt được | Gate nào không nhìn thấy | Chặn ở đâu |
| --- | --- | --- | --- |
| Số test trong câu văn bản địa | 18 | `docs-numbers` chỉ đọc badge | quét tay §2.1 |
| Corpus lệch generator (một trường) | 18 | test chỉ so năm trường | §2.3 + guard `device` |
| Ngày muộn sau khi code đi đường | 17–19 | test chỉ kiểm doc ↔ entry | §2.2 |
| «26 SVG» ở 4 file ngoài README | 16 | script chỉ chạy ở CI, không trong check | ADR 0004 — gate trong vitest |
| Cặp «nửa cũ nửa mới» trong một file | 16 | không ai đọc lại văn sau khi sửa tay | `prose-counts-gate` |
| Dòng trống mất sau đoạn chèn | 18 | markdown table test không kiểm spacing | quét cấu trúc §lượt 3 |
| ADR ghi sai ngày ra đời | 19 | không gate nào đọc ADR | §2.2 đối chiếu chuỗi phát hành |
