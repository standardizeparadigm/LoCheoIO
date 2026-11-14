# Khả năng tiếp cận (a11y)

Trạng thái thật của game về a11y — cái gì có, cái gì không, và **cái gì đã từng
hỏng**. Mục cuối quan trọng nhất: cả ba lỗi a11y của dự án đều thuộc loại không
nhìn thấy được bằng mắt thường và không ném lỗi nào.

## Đã có

### Chuyển động

- **`prefers-reduced-motion`** — chặn toàn bộ animation/vừng CSS
  (`animation/transition: none !important`), tắt shimmer/marquee/aurora/bob/corner
  panels; engine giảm flash (`flashScale 0.25`) và cap screen shake
  (`trauma ≤ 0.12`).
- **Công tắc riêng «Giảm chuyển động»** trong Settings — đôi khi người dùng muốn
  giảm mà không tắt hết ở OS. Lần chạy đầu đọc `prefers-reduced-motion` để bật sẵn.
- **`prefers-contrast: more`** gắn `data-contrast="more"` lên `<html>`, CSS nâng
  độ tương phản chữ mờ.

### Bàn phím

- **Menu**: Tab đi qua mọi hàng, `Enter` kích hoạt, `Escape` đóng modal.
- **Trong game**: WASD/mũi tên + `Space` + `P`/`Escape` + `R` + `M` + `Enter`.
  Danh sách đầy đủ ở `src/components/menu/shortcuts/keys.ts` và mọi phím trong đó
  **đều có handler thật** (xem `tests/shortcuts.test.ts`).
- **`focus-visible`**: viền vàng trên nền jade, phân biệt với trạng thái hover.

### Cấu trúc

- **Modal** là `role="dialog" aria-modal="true"` + `aria-label`; backdrop là một
  `<button aria-label>` thật, nên nó nằm trong thứ tự Tab và được đọc lên.
- **Canvas** có `role="img"` + `aria-label` (thương hiệu + phím điều khiển) thay
  vì canvas câm.
- **`<html lang>`** đồng bộ khi đổi ngôn ngữ.
- **Nút icon-only** đều có `aria-label`; **switch** là `role="switch"
  aria-checked`; **nhóm chọn** là `role="group" aria-labelledby` + `aria-pressed`
  (cố ý không phải `radiogroup` — xem dưới).
- **Touch target** ≥ 40px cho mọi nút trong game.

### Màu

Mọi tỉ lệ dưới đây **được tính** trong `tests/palette-contrast.test.ts`, không
phải chép tay — đổi một mã màu thì test nói ngay tỉ lệ mới có hợp lệ không.

| Màu | Trên `jade-950` | Trên `jade-900` | Dùng cho |
| --- | --- | --- | --- |
| `clay-100` (cream) | **16.30:1** AAA | **13.86:1** AAA | body copy |
| `brine-400` | 11.90:1 AAA | — | nhãn phụ |
| `tumeric-400` | 11.71:1 AAA | — | nhãn ngắn, số |
| `tumeric-500` (gold) | 8.97:1 AAA | — | điểm số |
| `jade-500` | 6.84:1 AA | — | điểm nhấn |
| `chili-500` | 4.30:1 **AA-large** | — | chỉ chữ LỚN: nút SLAM, viền nguy hiểm |
| `jade-800` | 1.55:1 — | — | **chỉ viền**, không bao giờ là chữ |

Hai dòng cuối là **quyết định**, không phải sơ suất:

- `chili` nằm giữa ngưỡng body (4.5) và ngưỡng chữ lớn (3.0), và nó chỉ xuất
  hiện ở cỡ lớn. Test khoá **cả hai chiều** — nếu ai đó "sửa" nó lên 4.5, test
  vẫn xanh nhưng việc đổi thiết kế sẽ phải có chủ đích.
- `jade-800` ở 1.55:1 là **viền panel**. Một khung phải là sợi chỉ, không phải
  tiêu đề. Đòi 4.5 ở đây sẽ biến mọi khung thành một cái hộp nhìn thấy rõ.

Ngoài tỉ lệ tương phản, test còn kiểm **khả năng phân biệt**: vàng và đỏ mang hai
tín hiệu quan trọng nhất của HUD (điểm và sát thương) nên phải cách xa nhau — thứ
mà không thang tương phản nào đo được.

## Ba lỗi a11y đã sửa, và vì sao chúng khó thấy

### 1. Tab bị giữ làm con tin (vòng 6)

`useFocusTrap` lọc control bằng `offsetParent !== null`. Khi container **không
còn** control nào hiện (dialog dài đã cuộn hết, nút đang ẩn), danh sách rỗng và
handler gọi `preventDefault()` rồi `return`.

Kết quả: **Tab không làm gì cả.** Dialog không nói gì về Escape trong cây a11y,
nên người dùng bàn phím không có lối thoát nào tìm được.

Không ném lỗi. Không cảnh báo console. Giao diện y hệt. Cách duy nhất để phát
hiện là **nhấn Tab** trong một dialog như vậy — việc mà người chỉ dùng bàn phím
làm ngay phút đầu, và người dùng chuột không bao giờ làm.

### 2. Trả focus về một phần tử đã chết (vòng 6)

Khi modal đóng, focus được trả về phần tử đã mở nó. Nhưng «Chơi tiếp» **tự tắt**
ngay khi snapshot được dùng, nên phần tử đó còn trong DOM mà `disabled`.

`focus()` trên phần tử disabled **không ném lỗi, không log gì** — focus rơi về
`<body>`, và lần Tab tiếp theo bắt đầu từ đầu trang thay vì từ hàng menu người
chơi đang đứng.

Nay kiểm `isConnected` và `disabled` trước khi gọi.

### 3. Gõ tên kích hoạt phím tắt game (vòng 6)

Handler phím gắn ở `window` nên nhận cả sự kiện từ `<input>` của màn hình kết
thúc. Gõ tên **MINH** thì `M` tắt tiếng; `R` **khởi động lại và xoá ván đang
nhập**.

Nay `isTyping(e)` chặn theo `e.target` — cố ý **không** dùng
`document.activeElement`, vì nó sai trong shadow DOM và trong lúc bàn phím ảo
đang chuyển focus.

## Cố ý **không** làm

### `role="radiogroup"` cho SegmentedControl

Nghe hợp lý: nhóm lựa chọn loại trừ nhau *là* radio group. Và bàn phím thì **y
hệt** — control này có đủ roving tabindex (`tabIndex={active ? 0 : -1}`), phím
mũi tên, `Home`/`End`. Nên `radiogroup` không sai về hành vi.

Nó sai về **thứ được công bố**. `radiogroup` hứa `aria-checked` trên một radio;
control này render `<button aria-pressed>`. Screen reader sẽ đọc "radio button,
checked, 2 / 3" trong khi DOM ghi "button, pressed" — cây a11y và lời đọc không
khớp nhau.

`role="group"` + `aria-pressed` nói đúng thứ đang có, và phím mũi tên vẫn chạy.
Nên: `group`.

### `role="slider"` cho VolumeStepper

Khác trường hợp trên: stepper **không** có phím mũi tên lẫn `aria-valuenow`.
Nó là hai nút `−`/`+` có `aria-label` quanh một `role="img"` đọc
`"<nhãn> 40/100"`.

Gắn `role="slider"` vào đây là hứa hai thứ không tồn tại — và khác với
`SegmentedControl`, không có hành vi nào bù lại.

## Còn hạn chế (biết để tránh ngạc nhiên)

- **Canvas HUD** (điểm, combo) chưa có text-alternative đầy đủ. Canvas chỉ có
  `role="img"` + `aria-label` mô tả game, không đọc được điểm trực tiếp.
- **Không có «reduce flash» riêng** — gộp vào reduced motion.
- **Chưa test với screen reader thật** (NVDA/VoiceOver). Mọi kiểm chứng hiện tại
  là đọc mã + SSR smoke + `tests/focus-trap.test.ts`.

## Quy ước khi thêm UI mới

1. **Nút icon-only** → `aria-label` bắt buộc.
2. **Modal mới** → dùng `Modal` (đã có dialog semantics + Escape + swallow + trap).
   Đừng tự dựng `div` + backdrop: `div` có `onClick` không vào được thứ tự Tab và
   không được đọc lên.
3. **Toggle** → `Switch`. **Nhóm chọn** → `SegmentedControl`. Đừng tự viết lại.
4. **Animation mới** → thêm selector vào khối `prefers-reduced-motion` **cùng
   commit**; animation chạy trong canvas thì thêm vào khối
   `[data-reduced-motion="true"]`.
5. **Mọi chuỗi hiển thị** → key trong `src/i18n/locales/*.ts` ×7, chạy
   `npm run check:i18n`.
6. **Trước khi thêm `role`** → hỏi "role này hứa những phím nào?". Nếu code không
   làm được những phím đó, dùng role đơn giản hơn. Đây là lỗi của chính tài liệu
   này một lần.
