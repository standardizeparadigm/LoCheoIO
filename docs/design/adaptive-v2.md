# Adaptive, rounds 8–10 — one profile, every size, every pixel

> **Trạng thái:** hợp đồng đang có hiệu lực cho v1.1.8 (vòng 8, 9 và 10).
> **Đọc trước:** [`adaptive-layout.md`](adaptive-layout.md) — hợp đồng giữa
> `menu/layout/` và `menu/adaptive/` ở vòng 6.

Vòng 6 trả lời **bố cục nào vừa**. Vòng 8 trả lời **mỗi thứ phải to bao nhiêu**,
trên *cả hai trục*. Vòng 9 trả lời hai câu còn lại: **HUD có vừa bàn chơi
không**, và **vì sao cửa sổ này trông như vậy**. Ba lớp đó nằm trong một phép suy
duy nhất; mục 14–17 mô tả lớp thứ ba.

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

---

## 14. Vòng 9 — HUD cũng là một kế hoạch

`engine.ts` từng vẽ HUD bằng một chuỗi `fillText` với toạ độ nội tuyến, mỗi toạ độ
cộng dồn từ toạ độ trước. Nó *đúng* ở 1280×720 và sai dần ở mọi nơi khác: hàng
chip ở `clock + 20s` chồng lên nhãn combo khi combo lên hai chữ số, và ở cửa sổ
cao 400px thì ba hàng cuối nằm ngoài bàn.

`src/game/adaptive/hud.ts` thay bằng `planHud()`, cùng triết lý với
`planPlayfield()`:

| Khái niệm | Nghĩa |
| --- | --- |
| **band** | hộp thật của glyph — `baseline − 0.72 × size`, cao `0.97 × size` |
| **drop ladder** | `chips → comboBar → jars → best`, bỏ *thứ ít thông tin nhất* trước |
| **compression** | sau khi bỏ hết, thu `s` từng bước `0.02` cho tới sàn `0.55` |
| **flow** | cột giữa (combo → thanh combo → mult → chips) chạy tiếp từ `clockY` |

Đo được, bằng `npx vite-node /tmp/probe*.ts` trên 1 500 bàn. Cấu hình đo là trường
hợp nặng nhất `engine.drawHud()` gọi: combo glyph **34px**, **3 chip**, vết nứt bật:

| Cửa sổ | `s` | đáy HUD | ghi chú |
| --- | --- | --- | --- |
| 1280×720 | 1.029 | 255px | không bỏ gì |
| 1920×1080 | 1.16 | 283px | không bỏ gì |
| 360×420 | 0.72 | 176px | không |
| 320×320 | 0.68 | 167px | không — chỉ nén |
| 240×320 | — | — | *dưới* ngưỡng chơi được; báo `stamina/fill`, `stamina/clock`, `fill/clock` |

Công thức cũ (nội tuyến) sinh **4 004** cặp chồng lấn trên cùng phép quét. Công
thức mới: **0** trên mọi bàn có `w ≥ 360, h ≥ 420`, và **0** cặp chồng lấn bị che
giấu trên bàn nhỏ hơn — chúng được *báo* qua `traceHud().collisions` và
`describeHud()`, không bị im lặng.

## 15. 21 preset — bảng duy nhất

`presets.ts` là nguồn; `check-adaptive.ts`, suite và tài liệu đều đọc từ đó. Thứ
tự là **theo kích thước**, không phải theo lúc thêm vào: một bảng xếp theo ngày
thêm thì không ai đọc được, và mọi lần chèn đều làm hỏng phép so sánh.

| # | id | cỡ | ghi chú |
| --- | --- | --- | --- |
| 1 | `iphone-4` | 320×480 | sàn thật của điện thoại cũ |
| 2 | `iphone-se-1` | 320×568 | SE đời đầu |
| 3 | `android-small` | 360×640 | phổ biến nhất ở VN |
| 4 | `iphone-se-2` | 375×667 | SE 2/3 |
| 5 | `iphone-12` | 390×844 | notch, tai thỏ |
| 6 | `phone-landscape` | 844×390 | ngang — chỗ `hero` thành `minimal` |
| 7 | `iphone-max` | 414×896 | Max/Plus |
| 8 | `short-window` | 900×500 | cửa sổ bị ép cao |
| 9 | `laptop-small` | 1024×600 | netbook 16:9 |
| 10 | `720p-chrome` | 1280×640 | 720p trừ hai thanh chrome |
| 11 | `window-1366` | 1366×650 | laptop 1366 với chrome |
| 12 | `window-1568` | 1568×677 | MacBook 14" với chrome |
| 13 | `720p` | 1280×720 | **mốc tham chiếu** — mọi phép so sánh bắt đầu ở đây |
| 14 | `ipad-portrait` | 768×1024 | tablet dọc, panel xếp |
| 15 | `ipad-landscape` | 1024×768 | tablet ngang, panel hàng |
| 16 | `laptop-1366` | 1366×768 | laptop phổ thông |
| 17 | `window-1920` | 1920×820 | 1080p trừ chrome |
| 18 | `macbook-air` | 1440×900 | 16:10 |
| 19 | `1080p` | 1920×1080 | fullscreen phổ biến |
| 20 | `1440p` | 2560×1440 | màn hình rời |
| 21 | `4k` | 3840×2160 | trần của hộp thoại |

## 16. 14 bất biến — một định nghĩa, ba nơi dùng

`constraints.ts` giữ danh sách; `tests/adaptive-constraints.test.ts` chạy nó trên
21 preset, `scripts/check-adaptive.ts` chạy nó như một cổng CI, và tài liệu này
liệt kê nó. Trước vòng 9, cổng kiểm ba bất biến còn suite kiểm chín — hai bên
không thể đồng bộ vì chúng là hai bản sao. Giờ chỉ còn một.

Hai dòng cuối (`chip-*`) đến từ vòng 10, sau khi ảnh chụp cho thấy không có lời
hứa nào giữ chip chế độ ở trong band. Một lời hứa chỉ sống trong component là lời
hứa không ai kiểm được ở mọi cửa sổ.

| id | bất biến | bắt lỗi gì |
| --- | --- | --- |
| `column-fills-window` | `scene + reserve === height` (trừ `fit: crop`) | cột không lấp hết cửa sổ, hở đáy |
| `reserve-inside-window` | `0 ≤ reserve ≤ height` | panel cao hơn cửa sổ |
| `panel-fits-reserve` | panel ≤ reserve, trừ `crop` | panel tràn ra ngoài reserve |
| `hero-fits-scene` | hero ≤ band | hero cao hơn vùng nó ở |
| `lockup-fits-scene` | `lockup × 1.68 ≤ band` | wordmark cao hơn band → cắt `LỌ` |
| `cheo-under-lo` | `lockupCheo < lockupLo` | hai nửa wordmark đảo cỡ |
| `type-legible` | `rowLabel ≥ 10`, `hint ≥ 9` | chữ nhỏ hơn ngưỡng đọc |
| `dialog-fits-window` | modal ≤ `visualViewport` | dialog tràn khỏi cửa sổ |
| `jar-fits-board` | jar ≤ board, tâm trong board | lọ ra ngoài canvas |
| `density-matches-flags` | ticker/footer theo density | density và chrome nói khác nhau |
| `css-vars-complete` | 11 biến `--lo-*` | component đọc biến không tồn tại |
| `numbers-finite` | mọi số hữu hạn | `NaN` từ `aspect` hoặc `dvh` |
| `chip-name-survives` | không tên chế độ nào bị cắt bằng ellipsis | tên dài (bản dịch) tràn band |
| `chip-labelled` | chip còn nhãn «CHẾ ĐỘ CHƠI» ở mọi cửa sổ chơi được | nhãn bị bỏ sớm hơn mức cần |

## 17. "Vì sao trông như vậy" — `diagnose()`

Một bảng số trả lời *cái gì*. Câu hỏi đến cùng ảnh chụp màn hình luôn là *vì
sao*: vì sao không có ticker, vì sao hero thành hàng ở đây mà thành cột ở kia.
`diagnose()` xếp **chín** lớp theo đúng thứ tự suy ra, mỗi lớp một câu `because` lấy
từ chính trường đã quyết định nó — lớp 8 là chip chế độ, thêm ở vòng 10:

```
1280×720 · lg · comfortable · row · fit none
1 · box      1280×720 · 720px tall · aspect 1.7778
             ↳ aspect is the width over the height; everything below reads it
2 · tier     lg · laptop
             ↳ the short side (720) crosses the 720px floor
3 · plan     scene 342 · reserve 378
             ↳ reserve is the header, footer and both gaps: 6 × 59 = 366, plus 12 slack
4 · density  comfortable · rows 34px · panel 318px
             ↳ default chrome (window 720px)
5 · hero     row
             ↳ band 342px clears the row floor
6 · type     lockup 89.5px · label 11.5px · hint 9.5px
             ↳ lockup capped by the band
7 · modal    448×619px · 1 col
             ↳ 448px is under the 560px two-column floor
8 · chip     band 1088px · needs 246px · full
             ↳ right-aligned to the mascot's inner edge, 246px of 1072px used
9 · board    1280×720 · jar 38px · hud ×1.029
             ↳ item scale follows height (1.029), radius follows the short side

trade-offs: none — this window gets the full layout
```

`warningsFor()` chỉ báo *thoả hiệp*, không báo *lỗi*: `crop` kèm số pixel thiếu,
`no-ticker`, `no-footer`, `minimal`, `panels-stacked`, `jar-at-floor`,
`dialog-compact`, `inset`. Một cảnh báo luôn đúng là nhiễu — đó là lý do
`dialog-scrolls` bị bỏ ở vòng 9 (mọi dialog đều bị chặn ở 86% cửa sổ).

Cách dùng:

```
npx vite-node scripts/check-adaptive.ts --explain 1280x720
```

---

## 18. Vòng 10 — chip chế độ, và cái giả định đã sai

Chip dưới mascot là phần tử **duy nhất** trong hero vừa tuyệt đối vừa mang chữ
không ai kiểm soát: một bản dịch, bảy ngôn ngữ, tên dài nhất 19 ký tự.

### 18.1 Hình học sai ở đâu

```
chip: position: absolute; left: 50%; transform: translateX(-50%)   /* trong cột mascot */
.menu-hero { overflow: hidden }
```

| Bố cục | Mascot | Kết quả |
| --- | --- | --- |
| cột (`stack`) | giữa band | chip căn giữa mascot → **đúng** |
| hàng (`row`, `lg+`) | cuối hàng = mép phải band | nửa phải chip ra ngoài band → **bị cắt** |

Tên dài nhất bị cắt rõ nhất, nên lỗi đọc thành "chế độ cổ điển bị lỗi". Thực ra
**mọi** tên đều mất một phần — chỉ ít hơn mức nhìn thấy.

### 18.2 Hai tầng, hai bảo đảm

| Tầng | Bảo đảm | Công cụ kiểm |
| --- | --- | --- |
| CSS | căn theo mép trong + `max-width` cứng = band − 2×8 | `tests/mode-chip-wiring.test.ts` (đọc source), `npm run smoke` (đọc HTML) |
| Plan | thang bậc `full → label-dropped → name-shrunk → ellipsis` | `tests/mode-chip.test.ts` (thuần), `tests/mode-chip-fixtures.test.ts` (corpus) |

Hai tầng độc lập có chủ đích: ước lượng bề rộng chữ có thể sai 6%, và khi sai thì
nó chỉ chọn chip *nhỏ hơn*, không bao giờ chọn chip *bị cắt* — vì tầng CSS mới là
thứ giữ pixel.

### 18.3 `heroBandWidth()` — con số thật

`heroContainerWidth()` trừ 64px ở **mọi** cỡ (giả định `px-8`), đúng cho câu hỏi
"hàng có vừa không" vì đó là hướng thận trọng. Nhưng chip dùng con số đó làm
`max-width`, nên 32px thận trọng sẽ bỏ nhãn «CHẾ ĐỘ CHƠI» trên **mọi** điện thoại.
`heroBandWidth()` đọc đúng padding: `px-4` dưới `sm` (16 mỗi bên), `px-8` từ `sm`
(32 mỗi bên).

### 18.4 `estimateText()` — đo chữ khi chưa có layout

React không trả lời được "chữ này rộng bao nhiêu" trong lúc render
(`getBoundingClientRect` cần một lần vẽ), và trả lời **sau** khi vẽ thì frame đầu
tiên đã sai — đúng frame mà ảnh chụp bắt được. Nên bề rộng được ước lượng theo
lớp ký tự:

| Lớp | em |
| --- | --- |
| dấu câu `. , : ; ' \| !` | 0,26 |
| nét hẹp `i l j I [ ] ( )` | 0,33 |
| `f r t` | 0,40 |
| chữ thường | 0,54 |
| chữ số | 0,58 |
| chữ hoa (kể cả dấu tiếng Việt) | 0,68 |
| `M W m w @ % &` | 0,87 |

× 1,06 cho sai số lớn nhất đo được. Hàm **toàn phần**: `null`, `""`, `NaN` → 0.

### 18.5 Corpus thứ ba

`tests/fixtures/mode-chips/` — **189** ảnh chụp (21 preset × 9 chế độ), sinh bằng
`npm run gen:chip`, kiểm bằng `--check` và bằng một suite riêng. Đây là corpus đầu
tiên về một **component** chứ không phải một bố cục: nó ghim đúng hai đầu vào đã
sinh ra lỗi — bề ngang band và một bản dịch dài.

## 19. Vòng 11 — chữ có dấu không được để CSS cắt

### 19.1 Một thuộc tính, ba tác dụng, một cái phá

`truncate` trong Tailwind là ba khai báo. Hai cái đầu ai cũng biết
(`text-overflow`, `white-space`); cái thứ ba — `overflow: hidden` — là cái **cắt**,
và nó cắt theo cả hai trục. Trục dọc mới là vấn đề: hộp dòng của một span một
dòng được tính từ `font-size × line-height`, không từ **mực**.

Tiếng Việt có mực ngoài hộp đó:

| Dấu | Ví dụ | Vị trí mực |
| --- | --- | --- |
| dấu thanh dưới | `Ạ Ụ Ợ` | dưới đường chân chữ, trong hộp |
| dấu thanh giữa | `À Ả` | trên in hoa, vẫn trong hộp 1.5em |
| **chồng hai dấu** | `Ố Ổ Ể Ấ Ự` | **~0.35em trên chiều cao in hoa** |
| móc | `Ư Ơ` | gắn vào thân chữ, không vượt trần |

Chỉ hàng thứ ba vượt ra, và nó là hàng mà bảng chữ Latin không có. Với Bungee
(in hoa 0.78em) và một hộp dòng 1.5em: chỗ phía trên in hoa là
`1.5 − 0.78 = 0.72em`, chia hai bên theo `half-leading` → ~0.36em — **vừa đủ**. Với
1.2em thì còn ~0.21em, và với `leading-none` là **0**. Đó là toàn bộ lý do
`MODE_CHIP_LINE_HEIGHT = 1.5` và con số `.24em` trong `.clip-safe`.

### 19.2 Luật, không phải mẹo

1. **Chữ dịch được thì không `truncate`.** Dùng `.clip-safe` (`overflow` + nới
   `padding-block` + bù `margin-block`). Nếu phải cắt *chuỗi* thì cắt trong code,
   như `planModeChip()` làm.
2. **`line-height` của chữ hiển thị ≥ 1.3.** Ngoại lệ duy nhất là wordmark
   (`leading-[0.9]`), và nó không bao giờ bị cắt — quyết định từ vòng 2 vì hộp
   glyph của `CHÉO` được căn theo `LOCKUP_BOX_RATIO`.
3. **Không `overflow` trên cây của một component đã có planner.** Nếu chip cần
   nhỏ hơn, planner trả về chuỗi nhỏ hơn.
4. **Hộp nào có hàng xóm thì hộp đó phải có hàm đo.** `chipBoxHeight(plan)` thay
   cho hằng số `14` đoán mò của `heroContentHeight()`.

### 19.3 `diagnose()` lớp 8 in thêm chiều cao hộp

```
8 · chip   band 452px · needs 246px · full · box 35px
```

Ba số, ba câu hỏi khác nhau: band là chỗ được cấp, `needs` là chỗ nó muốn,
`box` là chiều cao nó chiếm. Vòng 11 đổi cái thứ ba mà không đổi hai cái đầu —
nên nó là cái phải hiện ra.

### 19.4 Vì sao test component không bắt được

Không có DOM, không có `getComputedStyle`, và `overflow: hidden` không làm thay
đổi `textContent`. Cái duy nhất nhìn thấy được là **pixel**, và repo này không có
trình duyệt trong CI. Nên lớp bảo vệ là **đọc file**: `tests/diacritics-clip.test.ts`
khẳng định `.clip-safe` tồn tại với `padding`/`margin` cân nhau, không còn
`truncate` nào trong `src/`, và chip không có `overflow` nào trong cây. Thô, nhưng
nó bắt đúng thứ đã ship sai hai lần.

### 19.5 Hàng xóm của sửa đổi này

| Hàng xóm | Ảnh hưởng | Xử lý |
| --- | --- | --- |
| `heroContentHeight()` | chip cao thêm 3.3px | `chipBoxHeight()` + test ≤ mascot 128px |
| `.menu-row-label` 1.2 | chỗ dấu chỉ vừa khít | nâng 1.35, chiều cao hàng không đổi |
| 6 call site `truncate` | mất ellipsis | `.clip-safe` — cùng hành vi, khác hộp cắt |
| `menu-row.test.ts` | ghim `truncate` | sửa thành `clip-safe` |
| `mode-chip-wiring.test.ts` | ghim `min-w-0 truncate` | sửa thành "không tự cắt chữ" |
| `assets/` 23 hình | tài liệu trực quan | thêm `diacritics-clip.svg` (24) |
