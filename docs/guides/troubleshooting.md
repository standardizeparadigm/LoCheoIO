# Troubleshooting — các sự cố thường gặp

## Game không mở / màn hình đen

1. Thử **trình duyệt khác** (Chrome/Edge/Firefox/Safari bản gần đây — game cần ES2020+).
2. Xóa **bộ nhớ đệm** và tải lại (`Ctrl/Cmd+Shift+R`).
3. Kiểm tra console (F12 → Console) — nếu có lỗi đỏ, chụp lại và báo issue kèm `npm run check` output.
4. Game **offline hoàn toàn** — nếu máy mất mạng game vẫn chạy; nếu copy `dist/index.html` từ máy khác sang, đảm bảo file copy **nguyên vẹn** (1 file duy nhất, không cần folder assets).

## Mở file offline mà «mất sạch animation» / trang trắng (file://)

Vòng 20 điều tra báo cáo này tới gốc: bản build `dist/index.html` **tự chứa
100%** (JS/CSS/font inline, 0 tham chiếu ngoài — gate `check-offline` quét
sau mỗi build), không có cơ chế nào làm mất hiệu ứng chỉ vì thiếu mạng. Một
trang «mất sạch» thật ra là trang chết im lặng, và thường là một trong ba lý
do sau — từ v1.1.8 trang sẽ **tự nói ra** bằng bảng watchdog sau 4 giây:

1. **Mở nhầm file nguồn** — `index.html` ở *gốc repo* là dev entry (cần
   `npm run dev`); trên `file://` nó trắng trơn. Chơi offline phải dùng
   `dist/index.html` (đính kèm mọi release). Chi tiết: `docs/guides/offline-file.md`.
2. **Trình duyệt quá cũ** — bundle cần ES2020+; script chết cả khối → trang trắng.
3. **JavaScript bị chặn** bởi phần mềm bảo mật/tiện ích.

Hai hiện tượng dễ nhầm là bug mà không phải: tiến độ online/offline không
thông nhau (`file://` là origin riêng — chủ ý nền tảng), và lần chạy đầu
trên máy mới menu đứng im (HĐH bật giảm chuyển động — tắt lại trong Cài đặt
→ Giao diện & chuyển động).

## Không nghe được âm thanh


1. Browser chặn audio cho đến khi có **tương tác người dùng** — hãy bấm một nút (Chơi/phím bất kỳ) một lần.
2. Kiểm tra công tắc **âm thanh** trong Cài đặt (trong game) và nút **M** (mute toàn cục).
3. Nhạc nền vs SFX là 2 cổng riêng — một trong hai có thể bị tắt.
4. Mở đầu ván (hoặc Resume) game tự gọi `audio.unlock()` — cần ít nhất một lần click/tap trước đó.

## «Chơi tiếp» không bật

- Nút này chỉ sáng khi `localStorage["locheo.run.v1"]` tồn tại — tức bạn đã từng **rời màn giữa chừng** (pause → menu).
- Ván **kết thúc** (game over) hoặc **bắt đầu ván mới** sẽ xóa snapshot — «Chơi tiếp» đúng là không còn gì để tiếp.
- Chế độ **private/incognito** hoặc storage bị chặn → không lưu được giữa phiên — đây là giới hạn cố hữu, không phải bug.

## Cài đặt không lưu / tự quay về mặc định

- **Private mode / storage bị chặn**: game vẫn chạy nhưng cài đặt chỉ sống trong phiên — đây là giới hạn cố hữu.
  Từ v1.1.6 thay đổi vẫn **giữ nguyên trong phiên** (trước đó mỗi lần bấm là quay về mặc định).
- Mở DevTools → Application → Local Storage → kiểm tra `locheo.settings.v1`. Nếu trống hoàn toàn mà bạn
  vừa đổi cài đặt → storage đang bị chặn (chế độ ẩn danh, hoặc site data bị khoá).
- Nút **«Khôi phục mặc định»** trong Settings → *Dữ liệu* đặt lại mọi thứ **trừ ngôn ngữ** — đây là chủ ý.

## Nút «Xuất» báo đã copy nhưng dán ra rỗng

- Clipboard API cần **secure context** (`https://` hoặc `file://`/`localhost`). Trên `http://` nội bộ nó không tồn tại.
- Từ v1.1.6 nút chỉ báo "Đã copy vào clipboard" khi copy **thành công thật**; nếu không nó báo "Đã nhập cấu hình"
  và **textarea ngay dưới** vẫn giữ JSON để bạn bôi đen copy tay.
- Có thể dán tay JSON vào textarea rồi bấm **NHẬP** — đường nhập không cần clipboard.

## Đổi ngôn ngữ không thấy đổi gì

- Ngôn ngữ nằm trong **Cài đặt → NGÔN NGỮ** từ v1.1.6 (không còn nút nổi góc phải).
- Chọn xong hộp thoại tự render lại ngay; `<html lang>` cũng đổi theo cho screen reader.
- Nếu chữ vẫn là ngôn ngữ cũ sau khi tải lại → kiểm tra `locheo.lang.v1` và `settings.language` trong storage.

## Điểm / thành tựu mất sạch

- Kiểm tra bạn có bấm **«Xóa dữ liệu đã lưu»** trong Cài đặt không (vùng nguy hiểm, 2 bước xác nhận).
- Second device / profile trình duyệt khác → dữ liệu nằm ở máy đó, không sync đám mây.
- `localStorage` bị xóa tự động (một số trình duyệt dọn khi hết dung lượng/incognito).

## Launcher (double-click) lỗi trên Windows

- Nếu thấy lỗi font/chữ lạ: đảm bảo dùng bản `.bat` **mới nhất** (CRLF + UTF-8 BOM từ v1.1.4).
- `chcp 65001` đã được đặt sẵn trong launcher — không xóa dòng đó.
- Vẫn lỗi → chạy trực tiếp: `npx vite preview` sau `npm run build` để xác nhận game chạy bình thường ở trình duyệt; sau đó báo issue launcher.

## Build fail với `vite-plugin-singlefile`

- `npm ci` lại từ đầu (lockfile có thể lệch sau khi pull).
- Node **≥ 20** (CI dùng 22 — xem `.nvmrc`).
- Xóa `dist/` rồi build lại.
