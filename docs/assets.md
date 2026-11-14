# `assets/` — kho đồ họa SMIL

Tất cả hình là **SVG tự chứa có animation SMIL** — không JS, không phụ thuộc ngoài, nhúng trực tiếp trong Markdown/HTML.

| File | Nội dung | Dùng ở |
| --- | --- | --- |
| `banner.svg` | Banner chính thức **V1.1.8** (9 chế độ · 16 thành tựu) | README ×10 đầu trang |
| `demo.svg` | Mô phỏng gameplay (lọ CHÉO, dưa rơi) | README ×10 |
| `items.svg` | 14 nguyên liệu (dưa, mốc, ruồi…) | README ×10, CONTRIBUTING |
| `modes.svg` | 9 chế độ chơi | README ×10 |
| `languages.svg` | 7 ngôn ngữ giao diện | README ×10 |
| `new-modes.svg` | 2 chế độ mới của v1.1.4 (Lễ Hội Combo · Đại Tiệc Dưa) | README ×10 (mục what's new 1.1.4) |
| `corner-menu.svg` | 2 panel góc GAME/INFO (v1.1.5) | README ×10 (mục what's new 1.1.5) |
| `settings-sections.svg` | Tour 6 mục cài đặt (v1.1.6) | README ×10 (mục what's new 1.1.6+) |
| `palette-ribbon.svg` | 7 dải màu palette chạy sáng luân phiên (v1.1.8) | README ×10 (hero) |
| `architecture.svg` | Sơ đồ kiến trúc + luồng dữ liệu, có xung chạy trên đường nối (v1.1.8) | README ×10 (mục kiến trúc) |
| `release-tiers.svg` | 3 tầng MAJOR/UPDATE/PATCH + thời gian biểu 10 bản (v1.1.8) | README ×10 (mục what's new 1.1.8) |
| `layout-fix.svg` | Trước/sau bản vá bố cục: 250px → 342px scene, 378px reserve (v1.1.8) | README ×10 (mục what's new 1.1.8) |
| `test-matrix.svg` | 827 tests / 77 file chia theo nhóm + 9 cổng (v1.1.8) | README ×10 (mục what's new 1.1.8) |
| `divider.svg` | Dải sparkle ngăn cách section | README ×10 |
| `license.svg` | Con dấu AGPL-3.0 copyleft | README ×10 |
| `favicon.svg` | Favicon động (lọ lắc + tia lấp lánh) | `index.html`, `public/favicon.svg` |
| `favicon-512.png` | Favicon raster 512px (OG/touch icon) | repo root + social preview |

## Quy ước khi thêm/sửa SVG

1. **SMIL only** (`<animate>`, `<animateTransform>`) — không nhúng `<script>`. GitHub/GitLab README render được SMIL qua `<img>`.
2. Text tiếng Việt **giữ nguyên dấu** — mọi SVG dùng UTF-8.
3. Kích thước mục tiêu ≤ 40 KB/file (README nặng = mất người đọc).
4. Màu bám palette: jade `#0b2b2b`, brine `#b6e07a`, turmeric `#f5a81c`, clay `#f4e3c2`, chili `#e63b2e`.
5. Banner phải cập nhật `APP_VERSION` cùng commit với version bump (xem `docs/guides/release-process.md`).
6. **Mọi SVG ghi phiên bản trong `aria-label` hoặc text phải bump cùng lúc** — `scripts/check-assets.mjs`
   chỉ kiểm tra tham chiếu, không kiểm tra số phiên bản. v1.1.7 tìm ra 3 SVG còn 1.1.4/1.1.5/1.1.6 — vì vậy từ 1.1.8 kho có thêm hai sơ đồ và mọi banner đều đọc 1.1.8.
7. **Không dùng `clip-path="inset(...)"`** như thuộc tính — không hợp lệ trên SVG; dùng `<clipPath>` +
   `<rect>` hoặc các hình đã dịch bên trong `<g opacity>`.
8. **Kiểm tra XML well-formed** trước khi commit:
   `python3 -c "import xml.etree.ElementTree as ET; ET.parse('<đường-dẫn>')"` (đổi thành file thật trước khi chạy —
   `check-assets` quét mọi chuỗi `assets/*.svg` trong docs và sẽ báo thiếu nếu bạn để tên giả).

## Thời gian biểu hình minh hoạ

| Bản | Hình ra đời |
| --- | --- |
| v1.0.0 | `banner.svg` · `demo.svg` · `items.svg` · `divider.svg` · `license.svg` · `favicon.svg` |
| v1.1.0 | `languages.svg` |
| v1.1.2 | `modes.svg` |
| v1.1.4 | `new-modes.svg` |
| v1.1.5 | `corner-menu.svg` |
| v1.1.6 | `settings-sections.svg` |
| v1.1.7 | `palette-ribbon.svg` · `architecture.svg` · `release-tiers.svg` |
| v1.1.8 | `layout-fix.svg` · `test-matrix.svg` |
