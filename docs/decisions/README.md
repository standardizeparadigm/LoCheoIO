# `docs/decisions/` — biên bản quyết định kiến trúc (ADR)

Mỗi file là **một quyết định đã chốt**, viết sau khi quyết định có hiệu lực —
không phải đề xuất. Định dạng theo phong cách MADR rút gọn:

| Mục | Ghi gì |
| --- | --- |
| **Trạng thái** | `Đã chấp nhận` · `Thay thế bởi 00XX` · `Siết chặt thêm (ngày)` |
| **Bối cảnh** | Vấn đề thật — có ảnh chụp, lỗi, hoặc con số khiến quyết định buộc phải ra |
| **Quyết định** | Cái được chọn, diễn đạt đủ cụ thể để người mới làm theo được |
| **Lý do chọn** | Các phương án bị loại và vì sao bị loại |
| **Hệ quả** | Cái được đổi, cái bị từ bỏ, cái phải chấp nhận chịu |
| **Kiểm chứng** | Test/gate nào giữ quyết định này — một quyết định không ai giữ là một quyết định chưa xong |

Quy tắc của thư mục này:

1. **Một quyết định — một file.** Không gộp hai quyết định vào một biên bản; khi
   một quyết định bị thay thế, file cũ giữ nguyên và thêm hàng *Trạng thái* mới.
2. **Không viết lại quá khứ.** Biên bản ghi quyết định theo thời điểm ra quyết
   định; bối cảnh sai thì đính chính bằng một đoạn «Đính chính», không xoá.
3. **Mỗi biên bản phải nêu gate giữ nó.** Nếu không có test/gate nào kiểm chứng,
   ghi rõ điều đó — không biên bản nào được trông xanh nhờ im lặng.
4. **Số liệu di chuyển không được vào đây.** Tổng test, số key, số SVG là số
   sống — chúng thuộc về badge và `sync-prose-counts`; biên bản chỉ được nêu số
   cố định (9 chế độ, 7 locale, TOP 8…).

## Danh mục

| ADR | Quyết định | Trạng thái |
| --- | --- | --- |
| [0001](0001-build-mot-file-html.md) | Build ra **một file HTML duy nhất** (`vite-plugin-singlefile`) | Đã chấp nhận |
| [0002](0002-smil-thay-video.md) | Hoạt họa tài liệu bằng **SMIL SVG**, không video/GIF/Lottie | Đã chấp nhận |
| [0003](0003-mode-config-prototype-safe.md) | Tra cứu chế độ **prototype-safe** qua `modeConfigFor()` | Đã chấp nhận |
| [0004](0004-prose-count-gate-trong-vitest.md) | Cổng đếm số liệu chạy **bên trong vitest**, không chỉ trong CI | Đã chấp nhận |
| [0005](0005-engine-headless-fake-canvas.md) | Engine được test **headless** qua fake canvas, không jsdom | Đã chấp nhận |
| [0006](0006-safe-storage-mot-loi-vao.md) | localStorage đi qua **đúng một cổng**: `safeStorage` | Đã chấp nhận |
