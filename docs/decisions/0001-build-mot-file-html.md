# ADR 0001 — Build ra một file HTML duy nhất

| | |
| --- | --- |
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | 2026-10-30 (v1.1.1 — «build một file») |

## Bối cảnh

Game chạy 100% trong trình duyệt, không server. Ba cách phát hành từng được cân:

1. **Site nhiều file** (`dist/index.html` + `assets/*.js` + `assets/*.css`) —
   chuẩn Vite mặc định. Người chơi phải tải một thư mục, mở file bằng `file://`
   thì CORS chặn module, và hosting lệch phiên bản khi chỉ một file được cập nhật.
2. **ZIP một thư mục** — giải quyết CORS nhưng thêm một bước «giải nén» mà người
   chơi mobile sẽ không làm.
3. **Một file HTML duy nhất** — JS/CSS/font/ảnh inlined hết vào `index.html`.

## Quyết định

`vite-plugin-singlefile`: toàn bộ bundle inlined vào **một** `dist/index.html`.
Mọi bản release đính kèm đúng một file; double-click là chơi (launcher chỉ là
cách mở file cho đẹp).

## Lý do chọn

- `file://` phải hoạt động: một file không có request nào để CORS chặn.
- Không hosting = không lệch phiên bản: file nào tải về là file đó.
- Kích thước không phải vấn đề thương mại — bản 1.1.8 là ~952 KB (gzip ~430 KB),
  nhỏ hơn một ảnh chụp màn hình game AAA.

## Hệ quả

- Không dùng được lazy-loading theo route/chunk — cả game là một bundle; chấp
  nhận, vì game nhỏ hơn nhiều so với một ảnh hero của web thông thường.
- Source map không kèm trong artifact (vẫn build ra khi cần debug).
- Mọi thay đổi làm tăng kích thước phải nhìn thấy được trong `npm run check`
  — `vite build` in kích thước, và release doc ghi lại con số từng vòng.

## Kiểm chứng

- `npm run check` chạy `vite build` mỗi lần; build thất bại nếu một dependency
  nào chừa request ra ngoài (plugin báo lỗi khi không inline được).
- `npm run smoke` render SSR từ `dist/` — nếu một tài nguyên không vào được file
  duy nhất, smoke là chỗ lộ ra.
