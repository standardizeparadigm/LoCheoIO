# Vẽ lại một hình trong `assets/`

Hai mươi file SVG trong `assets/` không phải hình trang trí — chúng là **tài
liệu**. Mỗi cái giải thích một quyết định thiết kế, và mỗi cái được nhúng vào
ít nhất một README. Vì vậy "vẽ đẹp hơn" luôn đi kèm "vẫn đúng".

## Quy trình

```
1. đọc script/check-svg.mjs       → biết sàn chất lượng
2. sửa file
3. python3 -c "import xml.etree.ElementTree as ET; ET.parse('assets/<tên>.svg')"
4. node scripts/check-svg.mjs
5. node scripts/check-assets.mjs  → vẫn được tham chiếu, không mồ côi
6. npx vitest run tests/docs-numbers.test.ts
```

Không có bước render: sandbox không có `rsvg-convert`, `cairosvg` hay trình
duyệt headless. Đó là lý do `check-svg.mjs` tồn tại và tại sao nó kiểm **cấu
trúc** thay vì pixel.

## Sàn chất lượng

`check-svg.mjs` từ chối một file nếu thiếu bất kỳ thứ nào:

| Yêu cầu | Vì sao |
| --- | --- |
| `viewBox`, không `width` cố định trên root | README nhúng với `width="100%"`; `height` cố định sẽ chống lại |
| mọi `url(#id)` phân giải được | id sai vẽ ra **đen**, không báo lỗi |
| gradient không tự tham chiếu | bị bỏ qua trong mọi engine, trông như lỗi |
| không `<script>`, không `on*=` | file phục vụ từ CDN |
| `<animate>` có `attributeName` | thiếu thì không animate gì và không cảnh báo |
| ≥ 1 gradient | tô phẳng là mức thấp hơn |
| ≥ 1 animation SMIL | README không chạy JS; SMIL là cách duy nhất |
| ≥ 1 filter | gradient vẫn tô phẳng highlight; filter mới làm nó **phát sáng** |

Ba yêu cầu cuối là "sàn chất lượng" của vòng 6. Trước vòng đó, 12/20 file có
gradient và animation nhưng **không một filter nào**.

## Bốn lỗi đã gặp, và cách chúng trông

### 1. Comment XML không được chứa `--`

```xml
<!-- ---- the rule ---- -->   ❌ không hợp lệ
<!-- ==== the rule ==== -->   ✅
```

Trình phân tích XML từ chối cả file với "not well-formed". Dễ mắc khi dùng dấu
gạch để trang trí comment.

### 2. `begin` âm là hợp lệ

```xml
<animate begin="-0.6s" .../>   ✅ SMIL hợp lệ — lệch pha khởi động
```

Nếu validator báo lỗi ở đây thì **sửa validator**, không sửa file. Bài học từ
`favicon.svg`.

### 3. `<defs>` không có sẵn

Một số file cũ không có `<defs>`, nên thêm filter cần tạo khối đó trước. Kiểm
tra bằng `grep -c "<defs>"` trước khi chèn.

### 4. Filter id phải duy nhất trong *file*, không phải trong trang

Hai file cùng `id="glow"` vẫn ổn khi nhúng riêng, nhưng README có thể đặt hai
hình cạnh nhau. Dùng tiền tố theo tên file: `dv-glow` · `ns-glow` · `tm-glow`.

## Vì sao không dùng CSS animation

`@keyframes` cần stylesheet, và README trên GitHub **không** áp stylesheet vào
`<img src="...svg">`. SMIL nằm trong chính file SVG nên chạy ở mọi nơi nhúng
được SVG. Đó là lý do mọi animation trong `assets/` là `<animate>` /
`<animateTransform>`.

## Khi thêm hình thứ 21

1. Tạo file trong `assets/`.
2. Tham chiếu nó từ **ít nhất một** README hoặc `docs/` — `check-assets.mjs`
   từ chối file mồ côi.
3. Thêm một dòng vào bảng trong `docs/assets.md`.
4. Chạy cả ba script.
