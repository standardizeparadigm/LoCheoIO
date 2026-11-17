# ADR 0002 — Hoạt họa tài liệu bằng SMIL SVG, không video/GIF/Lottie

| | |
| --- | --- |
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | 2026-10-26 (từ v1.0.0 — `banner.svg` đã SMIL; chốt rõ thành quy ước v1.1.8) |

## Bối cảnh

README cần hình minh họa **chuyển động** (banner, biểu đồ test, sơ đồ kiến trúc,
trước/sau của các bản vá). Các lựa chọn:

1. **GIF/video** — nặng (mỗi hình vài MB), không scale theo chiều rộng, và GitHub
   không render video trong README một cách ổn định trên mọi client.
2. **Lottie/JS** — cần script chạy trong README: GitHub chặn `<script>` trong
   README, và cả khi không chặn thì đây là mã thực thi trong tài liệu.
3. **SMIL SVG** — `<animate>`/`<animateTransform>`/`<animateMotion>` trong file
   SVG, GitHub render qua `<img>`; không JS, không request, scale theo `viewBox`.

## Quyết định

Mọi hình minh họa là **SVG tự chứa, SMIL thuần**: gradient + animation + glow
bên trong một file, nhúng bằng `<img src="assets/…" width="100%">`. Quy ước chi
tiết nằm ở `docs/assets.md` (≤ 40 kB/file, palette 5 màu, không `clip-path="inset()"`,
tiếng Việt giữ nguyên dấu).

## Lý do chọn

- `<img>` là cách nhúng duy nhất GitHub đảm bảo render — và SMIL sống sót qua đó.
- File SVG đọc được bằng text: diff của một thay đổi hình là diff thật, không
  phải một blob nhị phân 3 MB.
- Quy mô nhỏ giữ được: hình lớn nhất của dự án ~14 kB.

## Hệ quả

- SMIL không có event sống động như JS — mọi hiệu ứng phải là chu trình lặp với
  `dur` cố định; chấp nhận vì mục đích là minh họa, không phải demo tương tác.
- Không có renderer SVG trong CI — `scripts/check-svg.mjs` thay chỗ đó bằng
  kiểm tra cấu trúc (root, `url(#id)` resolve, không script, SMIL đặt tên
  attribute thật, có gradient + animation + filter).
- Thêm hình là tăng số đếm toàn dự án: `EXPECTED_ASSETS` trong `check-svg.mjs`,
  hàng bảng `docs/assets.md`, và cụm «N SVGs» do `sync-prose-counts.mjs` ghi.

## Kiểm chứng

- `npm run check:svg` — cấu trúc + animation + tham chiếu của **mọi** file.
- `npm run check:assets` — hai chiều: mọi tham chiếu tồn tại, không file mồ côi.
- `tests/assets-table.test.ts` — bảng «Hình ra đời» phải liệt kê đủ mọi file,
  và cột «Dùng ở» phải khớp số README thực sự nhúng.
