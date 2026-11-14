# Chặn số hỏng — vì sao `Math.max(0, x)` không phải guard

Vòng 6 tìm ra **mười một** chỗ trong tám module khác nhau dùng một phép toán như thể
nó chặn được giá trị không hữu hạn. Sáu chỗ dùng `Math.max(0, x)`, hai chỗ dùng
`?? 1`. Cả hai đều không chặn.

Chỗ thứ sáu đến muộn: nó nằm trong footer của panel góc, nơi bị đọc là "chỉ là
một dòng trạng thái", và nó in ra `✓NaN/NaN` cho tới khi có người viết test cho
một component mà không ai nghĩ cần test.

## Vì sao

`Math.max` và `Math.min` là **phép so sánh**:

```js
Math.max(0, NaN)      // NaN      — mọi so sánh với NaN đều false
Math.max(0, Infinity) // Infinity — Infinity thắng mọi so sánh
Math.min(1, Infinity) // 1        — nhưng chỉ khi có cận trên hữu hạn
```

Nên `Math.max(0, x)` chỉ chặn **số âm**. Nó không phải guard cho `NaN`, không
phải guard cho `Infinity`, và tên hàm (`max`) trông như thể nó bao quát hơn.

## Các chỗ đã sai

| Module | Triệu chứng trước khi sửa |
| --- | --- |
| `game/modeMath.ts` | HUD in ra chữ **"NaN"** và không bao giờ phục hồi — `NaN + x` luôn là `NaN` |
| `utils/math.ts` | `damp()` trả `Infinity` ngay frame đầu; canvas **bỏ qua** toạ độ không hữu hạn nên hình biến mất, không có lỗi nào trong console |
| `game/engine.ts` | Save JSON **hợp lệ** (`"shield": 1e999`) khôi phục khiên vô hạn |
| `game/audioLevels.ts` | `Infinity` vào `GainNode.gain.value`; WebAudio clip và có thể chốt node — hiệu ứng tắt hẳn |
| `menu/layout/fit.ts` | `Math.max(1, NaN)` = `NaN`; React **bỏ im lặng** `style={{ height: NaN }}` nên hero mất chiều cao khai báo |
| `menu/panel/stat.ts` | Footer panel in `✓NaN/NaN` và `✓5/Infinity`; giá trị đến từ localStorage nên người chơi **sửa được** |
| `game/modeMath.ts` ×2 | `comboWindowFor("id-không-tồn-tại")` ném `TypeError` **trong tick engine** → mất cả ván; `?? 1` để `Infinity` thành cửa sổ combo vô hạn |
| `game/engine.resize` | `canvas.width = NaN` → trình duyệt **đặt lại backing store về 300×150**; game chạy ở độ phân giải không ai biết |
| `menu/layout/metrics` | `cornerPanelHeight(NaN)` → chiều cao **khai báo** là `NaN`; React bỏ `style` hỏng, panel tự cao bằng nội dung (đúng lỗi 1.1.7) |
| `settings/VolumeStepper` | `Math.round(NaN)` → nhãn `NaN/100`, thanh âm lượng vẽ **0 vạch** (phòng thủ hai lớp) |

Đó là sáu chỗ dùng `Math.max`. Chỗ thứ bảy và thứ tám không dùng `Math.max` mà
dùng **`??`** như một guard số — cùng một sai lầm, khác cú pháp:

```ts
const mult = MODES[mode].comboWindowMult ?? 1;   // hai lỗi trong một dòng
```

`??` chặn `null` và `undefined`. Nó không chặn `Infinity`, không chặn `NaN`,
không chặn số âm, **và nó cũng chặn nhầm `0`** — một chế độ muốn "không có cửa
sổ combo" bị âm thầm nâng thành hệ số 1.

Tệ hơn: `MODES[mode]` có thể là `undefined` với `mode` không tồn tại, và phép đọc
trường trên `undefined` **ném lỗi**. `mode` đến từ `locheo.run.v1`, tức là người
chơi sửa storage là tới được trạng thái đó — và lỗi ném trong tick thì mất ván.

**`?? 1` không phải guard. Nó là phép chọn giữa hai giá trị.**

Điểm chung: mỗi chỗ đều có một **comment khẳng định nó an toàn**. Đó là lý do
chúng sống lâu — người đọc tin comment hơn đọc phép toán.

## Khi nào `??` là đúng

`x ?? y` đúng khi `y` là **giá trị thay thế cho sự vắng mặt**, và khi mọi giá trị
không vắng mặt đều hợp lệ:

```ts
// ĐÚNG — nhãn i18n optional, chuỗi rỗng không phải trạng thái người dùng muốn
const label = t(entry.hintKey ?? "menu.hintFallback");

// ĐÚNG — cờ ba trạng thái, `false` là câu trả lời thật
const autoPause = settings.autoPauseOnBlur ?? true;

// SAI — hệ số nhân: 0, Infinity, NaN đều "có mặt" và đều không phải hệ số
const mult = def.comboWindowMult ?? 1;
```

Câu hỏi phân biệt: **"giá trị này có phải là một câu trả lời?"** Nếu `Infinity`
không phải câu trả lời, `??` là sai công cụ.

## Mẫu đúng

```ts
/** Số nguyên không âm, an toàn với mọi input. */
function saneInt(n: number): number {
  if (!Number.isFinite(n)) return 0;   // 1. loại NaN VÀ ±Infinity
  return Math.max(0, Math.floor(n));   // 2. floor, rồi mới chặn âm
}
```

Thứ tự quan trọng: `Math.floor(Infinity)` là `Infinity`, nên kiểm
`isFinite` **phải** đứng trước.

Cho giá trị 0..1 dùng `unit()` của `audioLevels.ts` — nó đã đúng từ v1.1.6:

```ts
export function unit(v: unknown, fallback = 1): number {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.min(1, Math.max(0, v))
    : fallback;
}
```

## Khi nào dùng cách nào

| Tình huống | Cách đúng |
| --- | --- |
| Có dải hợp lệ đã biết (0..1, 0..maxCracks) | `clamp(v, a, b)` — nó trả `a` cho NaN |
| Không có dải, chỉ cần "số dương" | `saneInt()` |
| Giữ nguyên giá trị cũ khi input hỏng | `if (!Number.isFinite(x)) return current` (như `damp`) |
| Đọc từ save/localStorage | Kiểm **tại tầng tiêu thụ**, không chỉ tầng loader |

## Vì sao kiểm ở hai tầng

`runSave.ts` đã từ chối save có `stats.score` không hữu hạn. Vậy mà
`engine.restoreRun()` vẫn phải kiểm lại sáu trường thân ván — vì đó là **sáu
trường khác**, không nằm trong object `stats` mà loader kiểm.

Nguyên tắc: lớp tiêu thụ không được tin lớp gọi. Một caller thứ hai (trình xem
lại, harness debug) sẽ không nhớ kiểm trước.

## Test cho lớp bug này

Mẫu chung: quét tích Descartes của `{0, 1, -1, ±Infinity, NaN, undefined}` và
khẳng định **kết quả hữu hạn**. Xem `tests/audioLevels.test.ts` và
`tests/mode-math.test.ts` cho hai ví dụ đầy đủ.

`Number.isFinite` là phép kiểm duy nhất đúng: `typeof x === "number"` cho
`NaN` đi qua, và `!Number.isNaN(x)` cho `Infinity` đi qua.
