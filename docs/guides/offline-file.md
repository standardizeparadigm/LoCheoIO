# Chơi offline từ đĩa (`file://`) — luồng đúng, watchdog và các giới hạn

> Cách chơi phổ biến nhất của Lọ Chéo: tải `dist/index.html` từ release về và
> mở thẳng bằng `file://`. Tài liệu này nói rõ luồng đúng, cơ chế tự bảo vệ
> (boot watchdog + gate build), và những giới hạn cố hữu của file:// để khỏi
> chẩn đoán nhầm «mất sạch animation» thành lỗi game.

## Luồng đúng — 2 cách

### 1. Tải bản build từ release (không cần cài gì)

Mỗi release đính kèm đúng một file game:

| Asset | Dùng để làm gì |
| --- | --- |
| `index.html` (~960 KB) | **Cả game.** Tải về, double-click, chơi. |
| `favicon.ico` / `.png` / `.svg` | Chỉ là icon trang — thiếu cũng không ảnh hưởng. |

File này **tự chứa 100%**: JS bundle inline, CSS inline, font `woff2` dạng
data-URI, không một tham chiếu ngoài. Gate `scripts/check-offline.mjs` (chạy
trong `npm run check`) quét toàn file sau mỗi lần build để cam kết đó không
bao giờ thoát lỗi: một `src="/assets/…"` hay `url(/fonts/…)` duy nhất — thứ
mà web host giải quyết được lặng lẽ — sẽ chết thành `file:///assets/…` trên
đĩa, nên gate làm lỗi CI ngay khi build.

### 2. Tự build từ mã nguồn

```bash
npm install && npm run build   # → dist/index.html — một file, mở từ đâu cũng chơi được
```

## Đừng mở file nguồn `index.html` ở gốc repo

`index.html` nằm ở **gốc repo** không phải bản game — đó là *dev entry* cho
máy chủ phát triển:

```html
<script type="module" src="/src/main.tsx"></script>
```

Đường dẫn `/src/main.tsx` là tuyệt đối theo origin. Trên web (kèm dev server
của `npm run dev`) nó trỏ vào mã nguồn; trên `file://` nó trỏ vào
`file:///src/main.tsx` — không tồn tại, module không chạy, trang trắng. Đây
là lý do số 1 của báo cáo «mở index.html offline mất sạch animation»: trang
không hề chạy nửa nào để mà mất hiệu ứng.

Dấu hiệu phân biệt nhanh: bản build một file nặng ~960 KB; dev entry chỉ vài
KB. Nếu trang hiện **bảng chữ xanh lá trên nền tối** sau 4 giây — đó là boot
watchdog (mục dưới) nói cho bạn biết game chưa mount vì lý do nào.

## Boot watchdog — trang chết tự giải thích

Từ v1.1.8 (vòng 20), template `index.html` mang một script watchdog thuần
ES5, và Vite **mang nó theo vào bản build**:

- Nếu `#root` còn trống sau **4 giây**, một tấm bảng khóa theme hiện lên giải
  thích song ngữ VI/EN ba lý do thường gặp: mở nhầm file nguồn (chỉ
  `dist/index.html` hoặc `npm run dev`), trình duyệt quá cũ, JavaScript bị
  tắt/chặn.
- `MutationObserver` gỡ bảng **ngay lập tức** khi game mount thành công — kể
  cả khi máy chậm vượt ngưỡng 4 s. Không bao giờ báo động nhầm.
- Toàn bộ trong try/catch, không fetch, không đụng vào game: watchdog chết
  thì cũng chỉ là không có lời nhắn, không thể là nguyên nhân chết mới.

Xem ADR 0009 (`docs/decisions/0009-hop-dong-offline-file.md`) vì sao chọn 4 s,
vì sao gate quét sau build, và danh sách cấu trúc được quét.

## Cố hữu của file:// — không phải bug

| Hiện tượng | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| Tiến độ/điểm online và offline **không thông nhau** | `file://` là một origin riêng, storage tách biệt với web host | Đây là chủ ý của nền tảng, không phải lỗi game |
| Lần chạy đầu trên máy/origin mới, menu đứng im | HĐH/trình duyệt bật «giảm chuyển động» (`prefers-reduced-motion`) — lần chạy đầu mượn thiết lập đó làm khởi điểm | Cài đặt → Giao diện & chuyển động → bật lại chuyển động; lựa chọn sẽ được ghi nhớ |
| Không lưu được gì (ẩn danh, storage bị chặn) | Giới hạn cố hữu — game rơi về memory-only | Xem `docs/guides/troubleshooting.md` |
| Nút «Xuất» copy không được | Clipboard API thiếu trên origin không an toàn — đã vá từ v1.1.6 với fallback | Dán tay vào textarea nhập |

Lưu ý dòng thứ hai: đây **không phải mất sạch animation offline-only** — cơ
chế này hoạt động y hệt trên web (origin lần đầu), và tắt được trong Cài đặt.

## Kiểm chứng

- `npm run check` — gate `check-offline` chạy ngay sau `vite build`:
  `✓ offline self-contained: dist/index.html (… KB) — 0 tham chiếu ngoài`.
- `tests/offline-gate.test.ts` — pin máy quét + watchdog + dist thật.
- Thủ công: mở `dist/index.html` từ đĩa (game vào, watchdog tự gỡ); mở
  `index.html` gốc từ đĩa (4 s sau hiện bảng giải thích).
