# Gỡ lỗi bố cục thích ứng

Màn hình bắt đầu tự chọn kích thước cho mọi thứ. Tài liệu này nói cách **đọc**
lựa chọn đó từ DOM, từ console và từ một ảnh chụp — không cần React DevTools.

## 1. Nhìn DOM là biết tier

`StartScreen` đặt profile lên phần tử gốc dưới dạng `data-*`:

```html
<div data-adaptive-tier="lg"
     data-adaptive-density="compact"
     data-adaptive-device="laptop"
     data-adaptive-aspect="wide"
     data-adaptive-hero="row"
     data-adaptive-fit="none"
     data-adaptive-room="0.62"
     data-adaptive-inset="0"
     style="--type-lockup-lo: 74.5px; --adaptive-scene: 299px; …">
```

| Thuộc tính | Đọc gì |
| --- | --- |
| `tier` | `xs`…`xxl`, suy từ **cạnh ngắn** |
| `density` | `spacious`…`minimal` — bảng pixel của chrome |
| `device` | `handset`…`cinema`, theo diện tích |
| `aspect` | `tall`…`panoramic` |
| `hero` | `row` hoặc `stack` — bố cục hero đã chọn |
| `fit` | `none` / `squeeze` / `crop` — cửa sổ có chứa đủ không |
| `room` | tín hiệu 0..1, nghiêng chiều cao |
| `inset` | `1` khi `env(safe-area-inset-*)` đã được trừ |

Từ một ảnh chụp, ba dòng trên đã trả lời 90% câu hỏi "vì sao chỗ này nhỏ thế".

## 2. Console

```js
// toàn bộ profile cho cửa sổ hiện tại
const { resolveForSize } = await import("/src/components/menu/adaptive/index.ts");
console.log(resolveForSize(innerWidth, innerHeight));

// câu trả lời một dòng
const { describeAdaptive } = await import("/src/components/menu/adaptive/index.ts");
console.log(describeAdaptive(resolveForSize(innerWidth, innerHeight)));
// → 1280×720 · wide · landscape · lg · comfortable · scene 342px · reserve 378px · …
```

Profile là **thuần**: cùng một cửa sổ luôn cho cùng một object, nên có thể so
hai lần đọc để tìm ra thứ gì đổi.

## 3. Bảng chân trị của các cờ

`plan` có bốn cờ. Không phải tổ hợp nào cũng tồn tại, và bảng dưới là bảng thật
(`tests/adaptive-density.test.ts` khẳng định nó):

| `dense` | `tight` | `compact` | Density | Khi nào |
| --- | --- | --- | --- | --- |
| ✓ | | | `spacious` | cao ≥ 840px |
| | | | `comfortable` | tham chiếu |
| ✓ | | ✓ | `compact` | rộng, hơi thấp |
| | ✓ | | `tight` | điện thoại dọc |
| | ✓ | ✓ | `minimal` | điện thoại ngang |

## 4. "Chữ nhỏ quá" — kiểm ba thứ, theo thứ tự

1. **`--type-row-label`** trên phần tử gốc. Nếu nó là `10px` thì cửa sổ đang ở
   `xs`/`sm`; đúng như thiết kế, không phải lỗi.
2. **`data-adaptive-fit="crop"`**. Cửa sổ không chứa nổi `floor + reserve`; plan
   giữ hero ở sàn và **chrome** bị cắt. Đây là hành vi có chủ đích (xem
   `docs/design/adaptive-v2.md` §5).
3. **`scene`** trong `--adaptive-scene`. Lockup bị chặn bởi `scene / 1.68`; nếu
   scene là 140 thì `LỌ` cao nhất là 83px và không có cách nào lớn hơn mà không
   cắt chữ.

## 5. "Panel đè lên ticker"

Đây là lỗi đã sửa ở vòng 8. Nếu nó quay lại, kiểm:

```bash
grep -rn "cornerRowHeight(" src/components/menu/*.tsx
# phải không có kết quả — panel đọc panelHeightForPlan(plan)
```

Panel vẽ `--adaptive-panel-h`; reserve là `--adaptive-reserve`. Hai số này đến
từ cùng một hàm, nên nếu chúng lệch nhau thì có ai đó đã tính lại.

## 6. "Modal không với tới footer"

`planModal()` giới hạn theo **window**, không theo `vh`. Trên điện thoại có bàn
phím, `visualViewport.height` mới là con số đúng — và `readViewport()` đã ưu
tiên nó. Kiểm bằng:

```js
visualViewport.height;  // thường nhỏ hơn innerHeight khi bàn phím mở
```

## 7. "HUD che bàn chơi"

`planPlayfield()` trả `hudScale` từ **cả hai** trục:

```js
const { planPlayfield } = await import("/src/game/adaptive/playfield.ts");
planPlayfield(1920, 400, 1);   // → hudScale 0.72, không phải 1.16
```

`tests/playfield.test.ts` khoá điều này: HUD không bao giờ lớn hơn quy tắc cũ
(`clamp(w/900, .78, 1.16)`) và nhỏ hơn khi bàn chơi thấp.

## 8. Quét toàn bộ, không cần mở trình duyệt

```bash
npx vitest run tests/adaptive-type.test.ts tests/adaptive-resolve.test.ts
npm run check:adaptive                 # in bảng 21 viewport thật
```

`scripts/check-adaptive.ts` in tier, density, scene, reserve, cỡ chữ và fit cho
từng viewport trong danh sách, để so với ảnh chụp mà không phải mở app.

## 9. Khi nào **không** phải sửa adaptive

- Ảnh chụp ở 320×480: `crop` là câu trả lời đúng, không phải lỗi.
- Chữ nhỏ hơn ở cửa sổ 900×500 so với 1280×720: đúng, cạnh ngắn là 500.
- HUD nhỏ hơn ở 1920×400: đúng, bàn chơi chỉ cao 400px.
- Panel 224px không đổi theo cửa sổ: đúng, bề rộng panel là hằng số có chủ đích.
