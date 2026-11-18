# ADR 0009 — Hợp đồng offline `file://`: một file tự chứa + boot watchdog + gate quét tham chiếu

| | |
| --- | --- |
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | 2026-11-18 (v1.1.8 vòng 20 — hotfix báo cáo «mở offline mất sạch animation») |

## Bối cảnh

Cách chơi phổ biến nhất của Lọ Chéo không phải trên web host mà là **mở thẳng
từ đĩa**: release đính kèm `dist/index.html`, các script launcher
(`play-windows.bat` / `play-mac.command` / `play-linux.sh`) build rồi mở file
bằng `file://`. Vòng 20 nhận báo cáo người chơi: «mở index.html offline thì
mất sạch animation/hiệu ứng, up web online thì bình thường».

Điều tra (không có browser trong môi trường build, nên là phân tích tĩnh toàn
diện) khẳng định bản build **tự chứa 100%**: bundle JS inline, CSS inline,
font `woff2` data-URI, không một tham chiếu ngoài (`/assets/`, `http(s)://`,
`//host` = 0 trên toàn file), game không nạp SVG runtime (33 SVG trong
`assets/` chỉ là minh hoạ README/docs). Nghĩa là `file://` và `https://` chạy
cùng một mã, cùng một CSS — **không có cơ chế nào trong build làm mất
animation chỉ vì thiếu mạng**. Trang «mất sạch» thật ra là một trang chết im
lặng, và nó có ba nguồn thực tế:

1. **Mở nhầm file nguồn** — `index.html` ở gốc repo là *dev entry*
   (`<script type="module" src="/src/main.tsx">`): trên `file://` đường dẫn
   tuyệt đối trỏ vào hư không, module không chạy, trang trắng. Đây là file
   người ta thấy đầu tiên khi tải repo.
2. **Trình duyệt quá cũ** — bundle production dùng cú pháp hiện đại; trình
   duyệt không đọc được thì toàn bộ `<script type="module">` chết, lại là
   trang trắng.
3. **JavaScript bị chặn** — phần mềm bảo mật/tiện ích chặn script nội dòng.

Điểm chung của cả ba: **không có thông báo nào**. Người chơi chỉ thấy một
trắng trơn (hoặc một trang tĩnh) và tự kết luận «game hỏng offline».

Ngoài ra hợp đồng một-file (ADR 0001) cho đến nay **không có gì thực thi**:
một build tương lai để lọt `src="/assets/x.js"` vẫn vượt mọi gate hiện có —
trên web host nó lặng lẽ hoạt động, trên `file://` nó lặng lẽ chết, và không
ai phát hiện cho tới khi người chơi báo lỗi.

## Quyết định

1. **Boot watchdog trong template** — một script inline thuần ES5 ở cuối
   `<body>` của `index.html`: nếu `#root` còn trống sau **4 giây**, hiện một
   tấm bảng khóa theme giải thích song ngữ VI/EN ba lý do trên (dùng
   `dist/index.html` hoặc `npm run dev` · trình duyệt cũ · JavaScript tắt).
   `MutationObserver` gỡ bảng **ngay khi** game mount, nên không bao giờ báo
   động nhầm; toàn bộ trong try/catch để chính watchdog không thể là nguyên
   nhân chết mới. Vite giữ nguyên inline script thường khi build → bản
   single-file được bảo vệ y hệt.
2. **Gate `scripts/check-offline.mjs`** — chạy trong `npm run check` ngay sau
   `vite build`: strip data URI (payload base64 có thể chứa chữ `http`), rồi
   quét mọi cấu trúc fetch — `src`/`href`/`poster`/`srcset`, CSS `url()` và
   `@import`, `link` modulepreload/preload/prefetch. Bất kỳ giá trị tuyệt đối
   (`/…`, `//…`, `http(s)://`) nào trong `dist/index.html` là **lỗi CI**.
   File đích thiếu → exit 0 có hint, để chạy lẻ trên cây sạch vẫn xanh.
3. **Tài liệu hóa luồng đúng** — `docs/guides/offline-file.md` và mục
   «Chơi offline» trong 10 README: chơi offline bằng `dist/index.html` đính
   kèm release; `index.html` gốc là dev entry; storage trên `file://` là
   origin riêng (tiến độ không trộn với bản web); nếu HĐH bật giảm chuyển
   động, lần chạy đầu trên origin mới mượn thiết lập đó và có thể tắt trong
   Cài đặt.

## Lý do chọn

- **Watchdog giải thích thay vì im lặng** — ba nguồn trang chết không thể
  sửa được từ code (người chơi mở nhầm file, trình duyệt cũ, JS bị chặn);
  thứ duy nhất sửa được là *trang tự nói*. 4 giây đủ rộng cho máy chậm
  mount xong, đủ ngắn để không ai chờ lâu.
- **Gate thay cho niềm tin** — hợp đồng chỉ thật khi vi phạm làm CI đỏ.
  Quét sau build là điểm duy nhất nhìn thấy file thật sẽ được phát hành.
- **Không đụng runtime game** — cả hai lớp đều nằm ngoài game loop; không
  thêm một byte vào bundle engine, không đổi hành vi khi mọi thứ vào được.

## Hệ quả

- `npm run check` dài thêm ~0,2 s (một lần đọc file 960 KB + regex).
- Watchdog là **mã sống trong template**: sửa lời nhắn là sửa cả dev entry
  và bản build — và là chỗ duy nhất được phép nói chuyện với người chơi khi
  React chưa lên.
- Thêm một kiểu tham chiếu fetch mới (ví dụ `<iframe src>`, `fetch()` runtime
  tới URL tĩnh) phải dạy cho gate — quét chỉ covering các cấu trúc đã liệt kê.

## Kiểm chứng

- `tests/offline-gate.test.ts` — 8 test: từ vựng `REF_KINDS`, `isExternalRef`
  từng lớp tiền tố, 4 nhóm phạm vi + 3 cấu trúc CSS/link, data URI giả
  `http` không báo nhầm, template giữ watchdog nguyên vẹn, dist thật (khi có)
  0 tham chiếu.
- `node scripts/check-offline.mjs` — trong `npm run check` sau `vite build`;
  hiện «0 tham chiếu ngoài» kèm kích thước file.
- Khởi động thật trên `file://`: mở `dist/index.html` từ đĩa — game mount,
  watchdog tự gỡ; mở `index.html` gốc từ đĩa — sau 4 s hiện bảng giải thích.
