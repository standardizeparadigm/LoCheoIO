# Adaptive, round 8 — one profile, every size

> **Trạng thái:** hợp đồng đang có hiệu lực cho v1.1.8 (vòng 8).
> **Đọc trước:** [`adaptive-layout.md`](adaptive-layout.md) — hợp đồng giữa
> `menu/layout/` và `menu/adaptive/` ở vòng 6.

Vòng 6 trả lời **bố cục nào vừa**. Vòng 8 trả lời **mỗi thứ phải to bao nhiêu**,
trên *cả hai trục*. Đây là bản mô tả đầy đủ của lớp thứ hai đó.

---

## 1. Vấn đề: mọi thứ chỉ đọc chiều rộng

Trước vòng 8, kích thước chữ và khung trong dự án được quyết theo bốn cách khác
nhau, và **cả bốn đều chỉ nhìn một trục**:

| Nơi | Cách cũ | Trục |
| --- | --- | --- |
| `Wordmark` | `clamp(2.6rem, 9.5vw, 5.6rem)` | rộng |
| `StartScreen` badge / record | `text-[11px]`, `sm:text-xs` | rộng |
| `GameOverScreen` tiêu đề | `text-[clamp(2.6rem,9vw,5rem)]` | rộng |
| `Modal` | `max-h-[86vh]`, `max-w-md` | **layout viewport** |
| HUD trong `engine.ts` | `clamp(w/900, .78, 1.16)` | rộng |
| Panel rows | `text-[11px]` hằng số | không trục nào |

Hệ quả không phải là "hơi xấu". Ba lỗi đã ship:

1. **`LỌ` bị cắt ở 1280×720.** Band 342px, nội dung 349px — vì `clamp()` theo
   `vw` không biết band cao bao nhiêu.
2. **Modal settings không với tới được footer trên điện thoại.** `86vh` của
   layout viewport là 726px trong khi visual viewport còn ~300px khi bàn phím mở.
3. **HUD che nửa bàn chơi ở cửa sổ thấp.** 1920×400 vẽ điểm ở `1.16 × 36px`
   trong khi bàn chỉ cao 400px.

Vòng 8 thay cả bốn bằng **một** phép suy: `resolveAdaptive()`.

---

## 2. Chuỗi suy luận

```
window  ──►  Box              (viewport.ts)          một phép clamp duy nhất
              │
              ├─►  SizeTier    (tiers.ts)             xs · sm · md · lg · xl · xxl
              │
              ├─►  MenuPlan    (layout/fit.ts)        scene + reserve (đã có từ vòng 3)
              │      │
              │      ├─►  Density      (density.ts)   bảng pixel của chrome
              │      ├─►  HeroLayout   (hero.ts)      hàng hay cột
              │      └─►  TypeScale    (typeScale.ts) mọi cỡ chữ, px
              │
              ├─►  ModalPlan   (ui/modalPlan.ts)      hộp thoại
              └─►  PlayfieldPlan(game/adaptive)       canvas
```

Mọi mũi tên là **hàm thuần**. Chỉ `useAdaptive.ts` chạm `window`, và nó chạm
đúng một lần cho mỗi animation frame.

---

## 3. `Box` — chuẩn hoá một lần

`boxOf(width, height)` trả về `{width, height, shortest, longest, area, aspect,
orientation}`. `shortest` là trục quyết định cỡ chữ; `longest` quyết định bố cục
ngang; `area` quyết định mật độ.

Ba lỗi cũ được đóng ở đây:

- `NaN` / `Infinity` / `""` → `1` (qua `Number.isFinite` **trước** `Math.round`;
  `Math.round(Infinity)` là `Infinity`, và `Math.max(1, NaN)` là `NaN`).
- `MAX_SIDE = 20 000` — trên mọi màn hình thật (8K là 7 680) và đủ nhỏ để
  `width × height` nằm gọn trong mantissa 53-bit.
- `SQUARE_BAND = 0.04` — chênh 4% vẫn là "vuông", nên 1010×1000 không nhảy tier.

`roomDriver(box)` gộp hai trục thành một tín hiệu 0..1, **nghiêng về chiều cao**
(0.6/0.4): chữ quá cao thì bị cắt, chữ hẹp thì vẫn đọc được.

---

## 4. `SizeTier` — từ vựng dùng chung

| Tier | Sàn (cạnh ngắn) | Ví dụ | Hệ quả |
| --- | --- | --- | --- |
| `xs` | 0 | 320×568 | mọi economy bật, wordmark-first |
| `sm` | 360 | 375×667, 414×896 | hàng tight, không hint |
| `md` | 480 | 600×800 | chrome compact |
| `lg` | 720 | 1280×720, 1440×900 | bố cục tham chiếu |
| `xl` | 1024 | 1920×1080, 1920×820 | hero hai cột |
| `xxl` | 1440 | 2560×1440, 3840×2160 | scale trần + nhiều không khí |

Tier suy từ **cạnh ngắn**, không phải từ width. 1920×400 là `sm`, không phải
`xxl` — đây đúng là lỗi mà `hero.ts` sinh ra để sửa, nay được đặt tên.

---

## 5. `Density` — bảng pixel của chrome

`MenuPlan` có ba cờ (`dense`, `tight`, `compact`) vì mỗi cờ trả lời một bất đẳng
thức khác nhau. Nhưng ba cờ có **tám** tổ hợp và chỉ bốn tổ hợp là thật. Một
component đọc từng cờ phải tự dựng lại bảng đó — và đó chính là lỗi vòng 8:

```diff
- height={cornerRowHeight(plan.dense, plan.tight)}          // quên `compact`
+ height={panelHeightForPlan(plan)}                          // không thể quên
```

`GameMenu` và `InfoMenu` vẽ panel **cao hơn 28px** so với chỗ `planMenuLayout()`
đã giữ, trên mọi cửa sổ compact (1568×677, 1366×650, 677–838px). Panel đè lên
ticker. Plan đúng, painter sai, và không có test nào so hai con số.

| Density | Row | Gap | Padding | Header | Rich |
| --- | --- | --- | --- | --- | --- |
| `spacious` | 54 | 6 | 16 | 22 | ✓ |
| `comfortable` | 34 | 6 | 16 | 22 | |
| `compact` | 34 | 3 | 10 | 18 | |
| `tight` | 26 | 6 | 16 | 22 | |
| `minimal` | 26 | 3 | 10 | 18 | |

`tests/adaptive-density.test.ts` dựng lại cả hai phía trên 1 600 viewport và
cấm `cornerRowHeight()` xuất hiện trong hai menu.

---

## 6. `TypeScale` — chữ theo *cả* hai trục

Ưu tiên, theo thứ tự:

1. **Sàn đọc được.** Không nhãn nào nhỏ hơn hôm qua. Một bố cục mua 2px hero
   bằng cách thu hint xuống 7px đã làm màn hình *tệ hơn*.
2. **Band thắng width.** Lockup bị chặn bởi `scene / 1.68` — chiều cao thật của
   khối hai dòng — nên cửa sổ thấp **thu nhỏ logo** thay vì cắt nó.
3. **Tỉ lệ được giữ.** `CHÉO = LỌ × 0.82` ở mọi cỡ, kể cả cỡ do band sinh ra.
4. **Ramp, không bậc.** Cỡ chữ chạy liên tục theo `roomDriver()`, nên kéo cửa sổ
   cho ra thay đổi mượt thay vì nhảy ở 840px.

| Biến | Khoảng | Nơi đọc |
| --- | --- | --- |
| `--type-lockup-lo` / `-cheo` | 22–89.5px | `Wordmark` (inline) |
| `--type-eyebrow` | 8–12px | dòng `ARCADE · v1.1.8` |
| `--type-live` | 8–10px | chip LIVE |
| `--type-badge` | 9.5–13px | plate «HŨ DƯA ĐẠI CHIẾN» |
| `--type-record` | 10.5–14px | dòng kỷ lục |
| `--type-panel-head` | 9–12px | `.panel-head` trong `index.css` |
| `--type-row-label` | 10–13px | `.menu-row-label` |
| `--type-row-hint` | 8–11px | `.menu-row-hint` |
| `--type-stat` | 8–9.5px | `.panel-footer` |
| `--type-ticker` / `-foot` | 9.5–13 / 8–10px | dải chạy chữ |
| `--type-modal-title` / `-body` | 11–15 / 12–16px | `Modal` |
| `--type-hud-score` / `-label` | 20–36 / 9–12px | HUD (thông qua `hudScale`) |
| `--type-over-score` | 28–60px | «KẾT THÚC», «TẠM DỪNG» |

`ADAPTIVE_CSS_VARS` là danh sách **duy nhất**; `tests/adaptive-resolve.test.ts`
so `Object.keys(profile.cssVars)` với nó, nên một biến được khai mà không được
set (hoặc ngược lại) là một test đỏ.

---

## 7. `ModalPlan` — hộp thoại theo cửa sổ

| | 390×300 (bàn phím mở) | 390×844 | 1280×720 | 3840×2160 |
| --- | --- | --- | --- | --- |
| `maxWidth` | 374 | 374 | 448 / 672 | 448 / 672 |
| `maxHeight` | 284 | 726 | 619 | 1857 |
| `padding` | 10 | 10 | 14 | 20 |
| `columns` (`wide`) | 1 | 1 | 2 | 2 |

`wide` là **yêu cầu**, không phải lời hứa: trên điện thoại changelog hai cột
thành một cột thay vì ép 2 × 180px.

---

## 8. `PlayfieldPlan` — canvas

`engine.resize()` từng viết năm phép clamp inline. Nay chúng là một hàm thuần ở
`src/game/adaptive/playfield.ts`:

| Field | Công thức | Ghi chú |
| --- | --- | --- |
| `itemScale` | `clamp(h/700, .62, 1.45)` | y nguyên công thức cũ |
| `playerSpeed` | `clamp((w/1000 + h/700)/2, .6, 1.25)` | y nguyên |
| `playerRadius` | `clamp(min(w,h) × .055, 21, 38)` | y nguyên |
| `stars` / `decor` | `clamp(area/26000, 18, 46)` · `clamp(area/42000, 10, 26)` | y nguyên |
| `hudScale` | `clamp(min(w/900, h/700), .72, 1.16)` | **mới**: trước đó chỉ có `w/900` |
| `edgeMargin` | `clamp(min(w,h) × .06, 12, 48)` | **mới** |
| `safeBottom` | `clamp(h × .16, 56, 140)` | **mới** |

`tests/playfield.test.ts` dựng lại bốn công thức cũ và so — đây là một phép
**dời**, không phải đổi cảm giác chơi.

---

## 9. Một profile, không phải bảy hook

Cách dễ nhất là ghép các hook sẵn có:

```tsx
const plan = useMenuPlan();        // resize + visualViewport + fullscreen
const env  = useEnvironment();     // cùng event, thêm hai media query
const w    = useViewportWidth();   // cùng event, lần thứ ba
```

Ba subscriber, ba `requestAnimationFrame`, ba `setState` — không được React gộp
vào cùng một batch. Một render có thể giữ plan của 1920×720 bên cạnh width của
1920×700. Đó là một frame nhấp nháy khi kéo cửa sổ, và là đúng loại lỗi thư mục
này tồn tại để dứt điểm.

`useAdaptive()` subscribe **một** lần, đọc **một** lần, resolve **một** profile.

---

## 10. Bất biến, và nơi chúng được kiểm

| Bất biến | Test |
| --- | --- |
| `scene + reserve === usableHeight` (trừ `crop`) | `layout-fit`, `adaptive-resolve` |
| `type.lockupLo × 1.68 ≤ scene + 0.5` | `adaptive-type` |
| `CHÉO < LỌ` ở mọi width × band | `adaptive-type`, `adaptive-wordmark-band` |
| `panelHeightForPlan + 12 ≤ reserve` (và `+ (footer ? 0 : 30) === cornerRowHeight`) | `adaptive-density`, `panel-footer-overflow`, `adaptive-fixtures` |
| `modal.maxWidth ≤ box.width`, `maxHeight ≤ box.height` | `adaptive-modal` |
| `playfield.playerRadius × 2 ≤ min(w,h)` | `playfield` |
| mọi field hữu hạn với `NaN`/`Infinity` | cả bảy file trên |
| `Object.keys(cssVars)` = `ADAPTIVE_CSS_VARS` | `adaptive-resolve` |
| không menu nào gọi `cornerRowHeight()` trực tiếp | `adaptive-density` |
| `Wordmark` nhận cỡ từ profile | `adaptive-wordmark-band` |

---

## 11. Điều **không** làm ở vòng này

- Không đổi cân bằng gameplay (`S`, `SP`, `pr` giữ nguyên công thức).
- Không đổi định dạng lưu, không thêm chế độ, không bump version.
- Không thay `.menu-pane { overflow: clip }` — không cuộn vẫn là bất biến.
- Không thêm media query mới. Nếu một quyết định cần cả hai trục, nó thuộc về
  `resolve.ts`.

---

## 12. Lỗi thứ tư — bất biến tự bắt lỗi của chính nó

Bảng bất biến ở §10 được viết **trước** khi corpus tồn tại, và dòng mới
`panel + lề ≤ reserve` đỏ ngay lần chạy đầu tiên, ở **844×390** — iPhone nằm
ngang, đúng cỡ trong ảnh chụp của báo cáo.

`reserveFor()` đã luôn trừ `PANEL_FOOTER_HEIGHT` khi `plan.footer` sai. Đó là
cách một cửa sổ 390px cao mua được 30px hero: cửa sổ hẹp thì panel không vẽ dải
thống kê, và plan không giữ chỗ cho nó. Nhưng `panelHeightForPlan()` chỉ nhận
`density`, không nhận `footer`, nên nó vẫn trả về chiều cao **đầy đủ**:

| Cửa sổ | reserve mua | panel vẽ | Hệ quả |
| --- | --- | --- | --- |
| 844×390 | 216px | 234px | chân panel **18px ngoài màn hình**, đỉnh đè hero |
| 1024×320 | 216px | 234px | như trên |
| 1280×720 | 378px | 318 + 48 + 12 | vừa khít — nên lỗi vô hình ở desktop |

Hai điều đáng ghi lại:

1. **Test cũ không thể bắt lỗi này.** Nó khẳng định
   `panelHeightForPlan(plan) === cornerRowHeight(plan.dense, plan.tight, plan.compact)`.
   Hai vế là **cùng một phép tính**; test đúng trong khi pixel sai. Câu hỏi đúng
   là "cái hộp vẽ ra có nằm trong dải đã mua không", không phải "hai hàm có bằng
   nhau không".
2. **Lỗi ở tầng painter, không ở tầng planner.** reserve 216px là đúng — panel
   thật sự có một đứa con ít hơn. Sửa ở planner (giữ chỗ cho footer không vẽ) sẽ
   làm mất 30px hero trên mọi cửa sổ thấp, tức là chữa triệu chứng bằng cách bỏ
   đúng cái lợi ích mà `FOOTER_HIDE_HEIGHT` tồn tại để mang lại.

## 13. Corpus — 1 620 ảnh chụp số

| Corpus | Số file | Trục | Sinh bởi |
| --- | --- | --- | --- |
| `tests/fixtures/adaptive-matrix/` | 1 110 | 45 bề ngang × 32 bề cao | `scripts/gen-adaptive-fixtures.ts` |
| `tests/fixtures/hero-bands/` | 510 | 30 bề ngang × 17 band | `scripts/gen-hero-fixtures.ts` |

Hai quyết định, cả hai đều có lý do:

- **Một file mỗi mẫu, không phải một mảng trong một file.** Khi ngưỡng dịch,
  `git diff --stat` kể tên đúng những cửa sổ đổi hành vi — thay vì "một dòng đổi
  trong `adaptive.json`", câu trả lời không nói được cửa sổ nào bị ảnh hưởng.
- **Sinh rồi commit, không sinh lúc chạy.** Ảnh chụp sinh lại mỗi lần khẳng định
  code bằng chính nó. Commit ảnh chụp là thứ khiến kỳ vọng **độc lập** với code,
  và đó là toàn bộ giá trị của nó.

Cả hai script có `--check` (chỉ báo, exit 1) để CI phát hiện corpus lệch, và
`tests/adaptive-fixtures.test.ts` / `tests/adaptive-hero-fixtures.test.ts` làm
việc đó trong `vitest run` mà không cần bước riêng.

### Vì sao band bắt đầu từ 150

`TIGHT_SCENE_HEIGHT` là 140 nhưng bố cục nhỏ nhất — chỉ wordmark — cần 150px.
Band dưới 150 là band **không plan nào tạo ra** (`check-adaptive` cho thấy sàn
thật là 174 ở 320×480), nên lấy mẫu ở đó là khẳng định một tính chất của đầu vào
bất khả thi. Corpus bắt đầu đúng nơi bậc thang bắt đầu.
