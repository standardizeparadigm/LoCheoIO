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

`hudScale` là **trần**, không phải kết quả — từ vòng 9 `planHud()` mới là thứ
quyết định từng readout:

```js
const { planHud, traceHud, describeHud } = await import("/src/game/adaptive/hud.ts");
const pf = planPlayfield(1280, 720, 1);
const plan = planHud(pf, { combo: true, comboSize: 34, chips: 2 });
plan.scale;      // 1.029 — bằng hudScale, không bị nén
plan.bottom;     // 230 — mép dưới cùng, tính từ đỉnh
plan.chipSlots;  // 2 — vẽ được cả hai chip
plan.collisions; // [] — không cặp băng nào chồng nhau
describeHud(plan);  // "hud ×1.029 · bottom 230px · full · no overlap"
```

Ba câu hỏi, ba hàm:

| Hàm | Trả lời |
| --- | --- |
| `planHud()` | dùng cái gì (kế hoạch đã chốt) |
| `traceHud()` | đã thử gì, bỏ gì, còn chồng lấn ở đâu |
| `describeHud()` | một dòng cho console |

Nếu một hàng biến mất khỏi HUD, `traceHud().dropped` nói hàng nào và lý do là
bậc thang (`chips → comboBar → jars → best`) hay nén. Nếu **hai** hàng chồng
nhau, đó là bàn dưới `playable()` — `traceHud().collisions` liệt kê đúng cặp.

## 8. Quét toàn bộ, không cần mở trình duyệt

```bash
npx vitest run tests/adaptive-type.test.ts tests/adaptive-resolve.test.ts
npm run check:adaptive                 # bảng 21 preset thật + 12 bất biến
npm run check:adaptive -- --explain 1280x720   # chẩn đoán một cửa sổ
```

`scripts/check-adaptive.ts` in tier, density, scene, reserve, cỡ chữ, fit,
**những thoả hiệp** và **bậc thang chip** của từng preset — cột `chip` dùng tên chế
độ dài nhất, nên nó là trần: chế độ nào khác cũng vừa bằng hoặc tốt hơn. Bảng đọc từ `presets.ts`, bất biến đọc từ
`constraints.ts` — cùng nguồn với suite, nên không thể lệch.

### 8.1 "Vì sao trông như vậy" — `diagnose()`

Khi ảnh chụp không đủ, gọi thẳng hàm mà script gọi:

```js
const { diagnose, renderDiagnosis } = await import("/src/components/menu/adaptive/diagnostics.ts");
console.log(renderDiagnosis(resolveForSize(1280, 720)));
```

Chín dòng, theo đúng thứ tự suy ra:

```
1 · box      ↳ aspect is the width over the height; everything below reads it
2 · tier     ↳ the short side (720) crosses the 720px floor
3 · plan     scene 342 · reserve 378
4 · density  ↳ default chrome (window 720px)
5 · hero     row   ↳ band 342px clears the row floor
6 · type     89.5px ↳ lockup capped by the band
7 · modal    448×619px · 1 col ↳ 448px is under the 560px two-column floor
8 · chip     band 1088px · needs 246px · full
             ↳ right-aligned to the mascot's inner edge
9 · board    jar 38px · hud ×1.029 ↳ item scale follows height
trade-offs: none — this window gets the full layout
```

`warningsFor()` chỉ liệt kê **thoả hiệp** — `crop` (kèm số pixel thiếu),
`no-ticker`, `no-footer`, `minimal`, `panels-stacked`, `jar-at-floor`,
`dialog-compact`, `inset`. Không có cảnh báo nào là lỗi; cảnh báo **luôn đúng**
thì đã bị xoá (xem `dialog-scrolls` ở vòng 9).

### 8.2 Mười hai bất biến

`constraints.ts` là danh sách duy nhất. Muốn biết một cửa sổ vi phạm gì:

```js
const { violations } = await import("/src/components/menu/adaptive/constraints.ts");
violations(resolveForSize(844, 390));   // → []
```

## 9. "Chip chế độ mất nửa bên phải"

Lỗi vòng 10. Chip là phần tử **tuyệt đối** căn trên một **cột hẹp** (mascot), trong
khi hero là `overflow: hidden`:

```
bố cục CỘT   mascot giữa band    →  chip căn giữa mascot  →  đúng
bố cục HÀNG  mascot mép phải     →  nửa chip ra ngoài band →  bị cắt
```

Kiểm trong 5 giây bằng ba attribute trên chính cái nút:

```js
const chip = document.querySelector("[data-mode-chip]");
chip.dataset.modeChip;        // full | label-dropped | name-shrunk | ellipsis
chip.dataset.modeChipAlign;   // center | end   ← end khi mascot ở phải
chip.dataset.modeChipName;    // 11 (px) …
chip.getBoundingClientRect(); // so right với band: phải ≤ band
```

Nếu `align` là `center` mà mascot đang ở mép phải, lỗi đã quay lại — đó là điều
`tests/mode-chip-wiring.test.ts` chặn ở tầng source.

Ba trạng thái và ý nghĩa:

| `data-mode-chip` | Nghĩa | Có phải lỗi? |
| --- | --- | --- |
| `full` | nhãn + tên ở cỡ chuẩn | không |
| `label-dropped` | chỉ còn chấm + tên (nút vẫn có `title`/`aria-label`) | không, nếu band < 272px |
| `name-shrunk` | tên nhỏ hơn 11px nhưng ≥ 9.5px | không, band rất hẹp |
| `ellipsis` | tên bị cắt bằng `…` | **có** — dưới 128px band, tức dưới ngưỡng chơi được |

Ở 320×480 (cửa sổ nhỏ nhất hỗ trợ) cả 9 tên tiếng Việt vẫn `full`; ba tên bản dịch
dài rơi xuống `label-dropped`, và danh sách đó được ghim trong test.

Sửa gì khi nó sai:

```bash
npm run gen:chip          # ghi lại 189 ảnh chụp của corpus
npm run gen:chip -- --check   # xem cái nào lệch
npx vitest run tests/mode-chip.test.ts tests/mode-chip-fixtures.test.ts
```

## 10. "Chữ mất dấu" — dấu tiếng Việt bị cắt

Triệu chứng: một chữ đọc sai mà **không** có cảnh báo nào. «CỔ ĐIỂN» thành «CỔ
ĐIÊN». Nhìn kỹ mới thấy thiếu đúng phần **đỉnh** dấu, không thiếu chữ.

Nguyên nhân gần như luôn là một trong hai:

| Thấy gì | Nguyên nhân | Sửa |
| --- | --- | --- |
| mất đỉnh mũ/sắc, chữ vẫn đủ | `overflow: hidden` từ `truncate` trên chữ có dấu | `.clip-safe` |
| mất đỉnh ở **mọi** chỗ cùng lúc | `leading-none` / `leading-[0.85]` trên chữ dịch được | `line-height` ≥ 1.3 |
| mất cả dấu ở wordmark | mask glyph chỉ giữ chữ gốc | không đụng `É` — dùng `text-shadow` |

Kiểm nhanh, không cần trình duyệt:

```bash
npx vitest run tests/diacritics-clip.test.ts   # 15 test, đọc file
grep -rn truncate src --include=*.tsx          # phải rỗng
node -e "console.log(require('fs').readFileSync('src/index.css','utf8').match(/\.clip-safe[^}]*}/)[0])"
```

Và nếu đã đổi chiều cao của một hộp có hàng xóm: chạy
`npx vitest run tests/mode-chip.test.ts` — nó khoá `chipBoxHeight()` nhỏ hơn
mascot, và `describeModeChip()` in ra con số để so với `diagnose()` lớp 8.

## 11. Khi nào **không** phải sửa adaptive

- Ảnh chụp ở 320×480: `crop` là câu trả lời đúng, không phải lỗi.
- Chữ nhỏ hơn ở cửa sổ 900×500 so với 1280×720: đúng, cạnh ngắn là 500.
- HUD nhỏ hơn ở 1920×400: đúng, bàn chơi chỉ cao 400px.
- Panel 224px không đổi theo cửa sổ: đúng, bề rộng panel là hằng số có chủ đích.
