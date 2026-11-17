# Adaptive, rounds 8–15 — one profile, every size, every pixel

> **Trạng thái:** hợp đồng đang có hiệu lực cho v1.1.8 (vòng 8 → 15).
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
| `scene + reserve === usableHeight` (trừ `crop`, và bậc `crop` cuộn được) | `layout-fit`, `adaptive-resolve`, `menu-no-scroll` |
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

## 16. 15 bất biến — một định nghĩa, ba nơi dùng

`constraints.ts` giữ danh sách; `tests/adaptive-constraints.test.ts` chạy nó trên
21 preset, `scripts/check-adaptive.ts` chạy nó như một cổng CI, và tài liệu này
liệt kê nó. Trước vòng 9, cổng kiểm ba bất biến còn suite kiểm chín — hai bên
không thể đồng bộ vì chúng là hai bản sao. Giờ chỉ còn một.

Hai dòng cuối (`chip-*`) đến từ vòng 10, sau khi ảnh chụp cho thấy không có lời
hứa nào giữ chip chế độ ở trong band. Một lời hứa chỉ sống trong component là lời
hứa không ai kiểm được ở mọi cửa sổ.

| id | bất biến | bắt lỗi gì |
| --- | --- | --- |
| `column-fills-window` | `scene + reserve === height` (trừ `fit: crop`, bậc đó cuộn được) | cột không lấp hết cửa sổ, hở đáy |
| `reserve-inside-window` | `0 ≤ reserve ≤ height` | panel cao hơn cửa sổ |
| `panel-fits-reserve` | panel ≤ reserve, trừ `crop` | panel tràn ra ngoài reserve |
| `hero-fits-scene` | hero ≤ band | hero cao hơn vùng nó ở |
| `lockup-fits-scene` | `lockup × 1.68 ≤ band` | wordmark cao hơn band → cắt `LỌ` |
| `cheo-under-lo` | `lockupCheo < lockupLo` | hai nửa wordmark đảo cỡ |
| `type-legible` | `rowLabel ≥ 10`, `hint ≥ 9` | chữ nhỏ hơn ngưỡng đọc |
| `dialog-fits-window` | modal ≤ `visualViewport` | dialog tràn khỏi cửa sổ |
| `jar-fits-board` | jar ≤ board, tâm trong board | lọ ra ngoài canvas |
| `density-matches-flags` | ticker/footer theo density | density và chrome nói khác nhau |
| `css-vars-complete` | **27** biến: 17 `--type-*` + 10 `--adaptive-*` | component đọc biến không tồn tại |
| `numbers-finite` | mọi số hữu hạn; hai biến dạng tên phải thuộc bộ giá trị của nó | `NaN` từ `aspect` hoặc `dvh` |
| `chip-name-survives` | không tên chế độ nào bị ellipsis, **cả bảy ngôn ngữ** | tên dài (bản dịch) tràn band |
| `chip-labelled` | chip **không mất hai bậc cùng lúc** (vòng 14) | mất nhãn *và* co tên trong cùng một cửa sổ |
| `prefs-respected` | `prefs` và hai biến `--adaptive-motion/-contrast` khớp nhau (vòng 15) | profile nói "giảm chuyển động" mà biến nói "đầy đủ" |

## 17. "Vì sao trông như vậy" — `diagnose()`

Một bảng số trả lời *cái gì*. Câu hỏi đến cùng ảnh chụp màn hình luôn là *vì
sao*: vì sao không có ticker, vì sao hero thành hàng ở đây mà thành cột ở kia.
`diagnose()` xếp **mười** lớp theo đúng thứ tự suy ra, mỗi lớp một câu `because` lấy
từ chính trường đã quyết định nó — lớp 8 là chip chế độ (vòng 10), lớp 10 là sở thích
của người chơi (vòng 15), và lớp 11 `repair` chỉ xuất hiện khi profile ấy do hook vẽ ra,
vì `resolveAdaptive()` thuần không đi thang sửa nên không có bậc nào để báo:

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

`warningsFor()` chỉ báo *thoả hiệp*, không báo *lỗi*: `crop` kèm số pixel vượt và
việc vượt đó **tới được bằng cách cuộn** (vòng 14 — trước đó câu chữ nói "hero bị cắt",
trong khi thứ bị cắt là đáy chrome),
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

### 19.3 Cùng một con số, ba chỗ đọc

| Chỗ | In ra | Test khoá |
| --- | --- | --- |
| `describeModeChip()` | `… · box 35px` | `mode-chip.test.ts` |
| `diagnose()` lớp 8 | `… · box 35px` | `adaptive-diagnostics.test.ts` |
| `check:adaptive` | cột `box` + cổng `chip-box` ≤ 128px | `check-adaptive-script.test.ts` |

`chip-box` **không** phải một bất biến của hợp đồng adaptive: `chipBoxHeight()`
là con số của một component, không phải của một cửa sổ. Nó là một cổng trong
công cụ, đúng chỗ mà hàng xóm bị ảnh hưởng.

### 19.4 `diagnose()` lớp 8 in thêm chiều cao hộp

```
8 · chip   band 452px · needs 246px · full · box 35px
```

Ba số, ba câu hỏi khác nhau: band là chỗ được cấp, `needs` là chỗ nó muốn,
`box` là chiều cao nó chiếm. Vòng 11 đổi cái thứ ba mà không đổi hai cái đầu —
nên nó là cái phải hiện ra.

### 19.5 Vì sao test component không bắt được

Không có DOM, không có `getComputedStyle`, và `overflow: hidden` không làm thay
đổi `textContent`. Cái duy nhất nhìn thấy được là **pixel**, và repo này không có
trình duyệt trong CI. Nên lớp bảo vệ là **đọc file**: `tests/diacritics-clip.test.ts`
khẳng định `.clip-safe` tồn tại với `padding`/`margin` cân nhau, không còn
`truncate` nào trong `src/`, và chip không có `overflow` nào trong cây. Thô, nhưng
nó bắt đúng thứ đã ship sai hai lần.

### 19.6 Hàng xóm của sửa đổi này

| Hàng xóm | Ảnh hưởng | Xử lý |
| --- | --- | --- |
| `heroContentHeight()` | chip cao thêm 3.3px | `chipBoxHeight()` + test ≤ mascot 128px |
| `.menu-row-label` 1.2 | chỗ dấu chỉ vừa khít | nâng 1.35, chiều cao hàng không đổi |
| 6 call site `truncate` | mất ellipsis | `.clip-safe` — cùng hành vi, khác hộp cắt |
| `menu-row.test.ts` | ghim `truncate` | sửa thành `clip-safe` |
| `mode-chip-wiring.test.ts` | ghim `min-w-0 truncate` | sửa thành "không tự cắt chữ" |
| `assets/` 23 hình | tài liệu trực quan | thêm `diacritics-clip.svg` (24) |

## 20. Vòng 12 — kiểm toán toàn không gian, và thang tự sửa

Ba vòng trước mỗi vòng thêm **một** corpus: 1 110 cửa sổ (vòng 8), 510 cặp band
(vòng 9), 189 cặp chip (vòng 10). Mỗi corpus trả lời một câu hẹp. Không corpus nào
trả lời câu mà người bảo trì hỏi trước mỗi bản phát hành:

> Trên **mọi** cửa sổ chơi được, bố cục làm gì, bao nhiêu lần, và có gì hỏng?

Câu trả lời đó nằm rải ở ba tệp test, một bảng trong `check-adaptive.ts` và một mục
tài liệu — bốn chỗ, bốn con số có thể lệch. Vòng 12 gộp nó thành **một giá trị**.

### 20.1 `AuditReport` — một phép quét, sáu câu trả lời

`src/components/menu/adaptive/audit/` chạy `resolveAdaptive()` trên **578** cửa sổ
(21 preset + lưới 25 × 23 quanh từng breakpoint, khử trùng lặp) và gộp thành:

| Trường | Trả lời |
| --- | --- |
| `violations` | *có hỏng không* — id bất biến × số cửa sổ × ví dụ |
| `warnings` | *đã nhường cái gì* — `crop` 25, `no-ticker` 176, `minimal` 101… |
| `fits` / `densities` / `tiers` / `chip` | *bốn quyết định chính rơi vào đâu* |
| `hero` | hàng **170** / cột **408** |
| `extrema` | scene 140–1 642px, reserve sàn 216px, room chật nhất `0` |
| `samples` | từng cửa sổ, để một lỗi đọc được tên |

Con số quan trọng nhất là **0 vi phạm trên 578 cửa sổ**. Đây không phải "chưa
kiểm": mỗi cửa sổ đã chạy hết 15 bất biến.

**Vì sao vừa preset vừa lưới.** Preset là nơi hồi quy thật đã xảy ra, và một thất
bại ở đó đọc là `iphone-4` chứ không phải `320×480`. Nhưng 21 cửa sổ không thấy được
**vách**: bậc `row → stack` là một ngưỡng *chiều rộng*, và 420px là điện thoại thật
mà không preset nào phủ. Lưới vì thế có mặt ở **hai bên** mỗi ngưỡng (639/640,
1023/1024, 1151/1152).

### 20.2 Báo cáo là tệp, không phải màn hình console

`docs/adaptive-audit.md` được **sinh** từ chính report — histogram có bar 40 ký tự
cố định, nên hai bản báo cáo của hai bản phát hành diff được với nhau. `--check`
nằm trong `npm run check`, nên tệp không thể cũ đi mà không ai biết: đổi một
breakpoint, một dòng density hay một sàn chữ **sẽ** hiện ra như một diff trong
đúng commit đã gây ra nó.

### 20.3 Thang sửa — động từ còn thiếu

`constraints.ts` nói *có hỏng không*. `diagnostics.ts` nói *vì sao*. Không tệp nào
nói **làm gì**. `adaptive/repair/` là câu trả lời, dưới dạng một thang hữu hạn:

| Bậc | Nhường | Lever |
| --- | --- | --- |
| `as-planned` | không gì — profile đang vẽ | `{}` |
| `ignore-inset` | safe-area inset thôi chiếm chiều cao chrome | `ignoreInset` |
| `compact-hud` | HUD còn 85% cỡ | `hudScale: 0.85` |
| `single-column` | modal rộng xuống một cột | `singleColumn` |
| `smaller-type` | chữ còn 94% | `typeScale: 0.94` |
| `smallest-type` | chữ còn 88% — bậc cuối trước sàn 8px | `typeScale: 0.88` |

Thứ tự là nguyên tắc: **chữ cuối cùng**, vì sàn 8px là lời hứa.

**Vì sao thang là dữ liệu.** Một nhánh `if (bad) { … }` chỉ chạy tới bậc thứ ba khi
tìm được cửa sổ hỏng ba bất biến cùng lúc — gần như không bao giờ, và một đường dự
phòng chưa từng chạy là đường dự phòng sẽ hỏng đúng ngày cần. Nên mỗi bậc là
`{ id, why, overrides }` và test bắt đầu từ bất kỳ bậc nào.

**Vì sao có `validator`.** Với hợp đồng thật, `as-planned` luôn thắng trên cả 578
cửa sổ. `repairProfile()` nhận một `validator` (mặc định `violations()`), và test
truyền một hợp đồng **chặt hơn** để thang thật sự bước — khẳng định đúng bậc dừng
(`smaller-type` cho 390×844), đúng thứ tự `attempts`, và đúng tie-break
"ít hỏng nhất" khi mọi bậc đều hỏng.

### 20.4 Bốn lever, và ba bất biến của chính chúng

`resolveAdaptive()` nhận `overrides` (mặc định vắng mặt ⇒ **byte-identical** với
trước vòng 12, có test so sánh từng trường trên 21 preset). Bốn lever:
`ignoreInset`, `typeScale`, `singleColumn`, `hudScale`.

Ba luật, mỗi luật một test:

1. **Không lever nào phá hợp đồng** — cả 6 bậc × 21 preset đều qua 15 bất biến.
2. **Không vượt sàn** — `typeScale` kẹp ở 8px, `hudScale` kẹp ở 0.55 (sàn của
   `planHud`).
3. **Chỉ nhỏ đi, không bao giờ to lên** — `0 < f ≤ 1`; `NaN`, `Infinity`, `0`, số
   âm và `> 1` bị **bỏ qua**, không bị kẹp thành nonsense.

### 20.5 Vòng này **không** làm gì

- Không đổi bố cục nào: 578 cửa sổ cho ra đúng profile cũ (test so từng trường).
- Không thêm bất biến: vẫn 14.
- Không dùng thang sửa trong ứng dụng — `useAdaptive()` vẫn resolve trần, vì không
  cửa sổ nào cần sửa. Thang tồn tại để *có thể* dùng.

---

## 21. Vòng 13 — không chỉ *đúng*, mà *rẻ nhất*

Vòng 12 dựng thang sửa và một bộ kiểm toán. Cả hai trả lời câu hỏi nhị phân: **có
đúng hợp đồng không**. Không chỗ nào trả lời câu thứ hai, câu mà mỗi lần đọc ảnh
chụp người ta vẫn phải tự hỏi: **có bản nào rẻ hơn không**.

### 21.1 Một thứ tự, không phải một trọng số

`score.ts` cho mỗi profile bảy hạng tử và so chúng **từ điển**, theo đúng thứ tự
khai báo:

| # | Hạng tử | Người chơi mất gì | Đo từ |
| --- | --- | --- | --- |
| 1 | `violations` | không gì cả — phá hợp đồng thì không phải ứng viên | `violations()` |
| 2 | `hidden` | mascot, deck, tagline | `plan.minimal` **so với base** |
| 3 | `cropped` | px thiếu so với sàn của chính nó | `scene + reserve − height` |
| 4 | `hudLost` | phần trăm cỡ HUD | `playfield.hudScale` |
| 5 | `typeDrop` | px chữ, cộng toàn thang | `type.*` |
| 6 | `levers` | *không nhìn thấy* — nhưng là số thứ đã đổi | so profile |
| 7 | `slack` | không gì cả — phòng thừa là chuyện tốt | `scene − heroContentHeight()` |

Tổng có trọng số sẽ ngắn hơn để viết và sai hơn để đọc: nó cho phép 40px trống
"mua lại" một cái mascot đã mất nếu các trọng số cộng ra như vậy. Thứ tự từ điển
là một khẳng định về sản phẩm, không phải một bảng cân.

### 21.2 Hai hạng tử đo *so với base*, và vì sao

`hidden` và `cropped` **không** đọc cờ thô. Cửa sổ 320×320 vốn chỉ có wordmark và
vốn bị crop — đó là **cửa sổ**, không phải mất mát. Chấm theo cờ thô sẽ báo
"hidden 1" cho chính profile ứng dụng đang vẽ, và biến mọi so sánh ở góc chật nhất
của không gian thành vô nghĩa — đúng chỗ chúng quan trọng nhất.

Bài học lặp lại của bốn vòng: **một phép đo không biết cái gì là nền thì đo sai ở
đúng biên**. `heroContentHeight()` ở vòng 9 từng báo tràn 10px ở 320×320 vì nó
không thấy cỡ chữ bố cục đã chọn; đây là cùng một lỗi ở dạng khác.

### 21.3 `levers` đếm từ profile

Một override không làm gì — `ignoreInset` trên cửa sổ không có inset — không đổi
kế hoạch. Đếm override sẽ phạt oan và, tệ hơn, làm hai ứng viên **giống hệt** có
điểm khác nhau. Nên `countLevers()` so hai profile, không so hai `AdaptiveOverrides`.

Hệ quả là **hoà là chuyện thật**, xảy ra thường xuyên: `ignore-inset` trên desktop
cho ra điểm y hệt `as-planned`. Thứ tự chốt là **vị trí trong thang**, không phải
thứ tự `Array.prototype.sort` nhìn thấy — sort ổn định là thuộc tính của engine,
còn quyết định này không được phép phụ thuộc vào engine. `describeSelection()` in
`tied, earlier rung` thay vì bịa một khoảng cách không tồn tại.

### 21.4 Mệnh đề mà vòng này mua được

    trên mọi cửa sổ chơi được, profile đang ship là bản rẻ nhất trong sáu bậc.

Đó là câu về **sản phẩm**, và nó kiểm được: `tests/adaptive-select.test.ts` quét 21
preset + 270 cửa sổ; `npm run audit:adaptive -- --select` chạy trên chính lưới của
audit (578 cặp width × height) và in `578 / 578`. Vòng 12 nói "không gì hỏng";
vòng 13 nói "không gì rẻ hơn" — mạnh hơn, và cũng dễ sai hơn, nên nó có corpus
riêng.

### 21.5 Corpus thứ năm: quyết định, không phải bố cục

`tests/fixtures/selection/` — 12 cửa sổ, mỗi file ghi `chosen`, điểm bảy hạng tử,
thứ hạng đủ sáu bậc, người về nhì, và profile người thắng tạo ra. Bốn corpus trước
trả lời "bố cục **là gì**"; corpus này trả lời "**vì sao nó được chọn**". Khi một
ngưỡng xê dịch, diff của 12 file này cho thấy một *quyết định* đổi — thứ người
review thật sự cần duyệt.

### 21.6 Vòng này **không** làm gì

- **Không đổi bố cục.** `selectBest()` chọn `as-planned` ở cả 578 cửa sổ; đây là
  bản kiểm tra, không phải bản viết lại.
- **Không tìm kiếm rộng hơn thang.** 2⁴ tổ hợp lever là 16; tìm kiếm tổ hợp là
  nhiều mã hơn cho một quyết định mà thang đã xếp đúng. Tên thật của module là
  "phép so sánh trên thang sửa".
- **Không thêm bất biến.** Vẫn 14. `select/` không phải luật mới, mà là phép đo
  chất lượng trên luật đang có.

---

## 22. Vòng 14 — hợp đồng phải đếm đủ ngôn ngữ

Vòng 13 thêm một phép so sánh. Vòng 14 không thêm gì; nó đi tìm chỗ mà một lời hứa
được phát biểu rộng hơn thứ đã kiểm.

### 22.1 Một literal, bốn nơi, bảy ngôn ngữ

Chip được đo bằng `const CHIP_LABEL = "CHẾ ĐỘ CHƠI"` trong `constraints.ts`,
`diagnostics.ts` và `audit/audit.ts`, và bằng `const CHIP_NAME = "MUỐI DƯA CỔ ĐIỂN"`
trong generator corpus. Bốn bản của **một chuỗi đã dịch**, và tiếng Việt là ngôn ngữ
ngắn nhất trong bảy:

| | nhãn | tên dài nhất |
| --- | --- | --- |
| vi | `CHẾ ĐỘ CHƠI` (11) | `MUỐI DƯA CỔ ĐIỂN` (19) |
| es | `MODOS DE JUEGO` (14) | `60 SEGUNDOS DE LOCURA` (21) |
| fr | `MODES DE JEU` (12) | `FESTIVAL DES COMBOS` (19) |

Nên `chip-labelled` — *"nhãn sống trên mọi cửa sổ chơi được"* — sai ở 320px (es, fr)
và 360px (es), trong khi audit báo **0 vi phạm**. Một lời hứa về bảy ngôn ngữ không
được kiểm bằng một ngôn ngữ.

### 22.2 Cách sửa: một định nghĩa, hai mươi nhăm lời hứa

`chip/probes.ts` sinh probe từ `localeTable()` + `MODE_LIST`: `chipProbes()` (bảy),
`widestProbe()` (trường hợp xấu nhất), `widestNameFor(id)` (bản dịch rộng nhất của
**một** chế độ), `widestChipLabel()`, `widestChipName()`. Bốn nơi trên đều đọc từ
đây, nên một lần dịch lại di chuyển cả hợp đồng, cả chẩn đoán, cả audit và cả corpus
— đúng thứ cần di chuyển cùng nhau.

`chip-labelled` đổi **nghĩa**, giữ **id**: không còn là "nhãn luôn sống" (sai về hình
học ở ngôn ngữ dài) mà là **"chip không bao giờ mất hai bậc cùng lúc"** — mất nhãn thì
tên phải còn nguyên cỡ thiết kế. Đó là thứ kiểm được, và nó vẫn bắt được cửa sổ 200px
mà test dùng làm đầu dò.

### 22.3 Hệ quả lên số

Audit báo đúng cái đang xảy ra thay vì cái đang đúng ở một ngôn ngữ:
**439 full · 101 hidden · 38 label-dropped** (trước: 477 / 101). Ba mươi tám cửa sổ
đó là **thiết kế**, không phải lỗi: bậc thang bỏ nhãn trước khi bỏ tên. Cái sai là báo
cáo nói chúng không tồn tại.

### 22.4 Và một con số không tồn tại

`--select` in `648 / 648 cửa sổ`: tích của 18 bề rộng × 36 chiều cao, không phải tập
cửa sổ nào cả — audit quét 578. Nay `bestOnWindows()` quét đúng danh sách đó:
`578 / 578`.

---

## 23. Vòng 14 (tiếp) — bậc `crop` là một lối cụt

Vòng 14 đi tìm chỗ mà một lời hứa rộng hơn thứ đã kiểm. Đây là chỗ thứ ba: một **bậc**
mà mười bốn bất biến cùng bỏ qua.

### 23.1 Ba miễn trừ, không một bù trừ

`fit: "crop"` có ba miễn trừ trong `constraints.ts` (`column-fills-window`,
`reserve-inside-window`, `panel-fits-reserve`) — hợp lý, vì cửa sổ thấp hơn `sàn + chrome`
thì **không có** cách bố trí nào vừa. Nhưng cả ba miễn trừ đều giả định điều không đúng:
rằng `crop` là **khung hình xoay tạm thời**, một hai frame rồi cửa sổ báo lại cỡ thật.

Quét lại cửa sổ audit: **25 / 578** cửa sổ là `crop`, cả 25 ở chiều cao 320px. Đó không
phải frame chuyển tiếp. Và `.menu-pane` là `overflow: clip`: phần cột vượt cửa sổ — đáy
của hai panel, nút START — bị cắt và **không có cách nào tới**. Mười bốn bất biến im
lặng, vì cả mười bốn đều miễn trừ đúng cái bậc ấy.

### 23.2 Cách sửa: miễn trừ giữ nguyên, bù trừ thành thật

Bậc `crop` **được** phép vượt cửa sổ; điều sai là bỏ phần vượt đi. Nên:

- `[data-adaptive-fit="crop"] .menu-pane` → `overflow-y: auto` (dọc), `overflow-x: clip`,
  `overscroll-behavior: contain`. Chỉ bậc này; mọi cửa sổ từ 356px trở lên vẫn
  `overflow: clip` và vẫn lấp đúng cửa sổ.
- `data-adaptive-fit` đã được ghi ra DOM từ vòng 12 và **không ai đọc** — một hook chết.
  Giờ CSS đọc nó, và `menu-no-scroll` khẳng định đúng **một** quy tắc được làm pane cuộn,
  và nó phải mang selector của bậc `crop`.
- Ngưỡng được ghim thành số: `crop` bắt đầu dưới **356px** = sàn hero 140 + chrome 216,
  và **không** phụ thuộc bề rộng. Từ 356px trở lên, `scene + reserve === height` đúng
  từng pixel.
- Câu cảnh báo `crop` nói đúng hộp: *"column is taller than the window: Npx past floor +
  chrome, reachable by scrolling"* — trước đó nó nói "hero is cropped", trong khi hero
  chính là hộp **không** bị cắt (nó giữ đúng sàn 140px).

## 24. Vòng 16 — dải 2px trả lời bằng *lý do*, và audit đi theo *đường*

Vòng 15 thêm dải 2px và để nó là một boolean. Vòng 16 không thêm một cơ chế ổn định
nào; nó làm ba việc với cơ chế đã có: **giải thích** nó, **đo** nó trên một trục mới,
và sửa **một lỗi sống còn** mà chính boolean ấy che mất.

### 24.1 Một quyết định, sáu lý do

`explainHold(previous, next, margin)` trả `HoldVerdict`, và `shouldHold()` chỉ còn là
một lần đọc `verdict.hold`. Sáu lý do, mỗi lý do là một tình huống thật:

| `reason` | Khi nào | Giữ? |
| --- | --- | --- |
| `first-frame` | chưa vẽ gì (SSR, lần đầu, sau reset) | không |
| `no-band` | `margin` ≤ 0 hoặc `NaN` — người gọi xin không ổn định | không |
| `same-rung` | bố cục không đổi; kích thước đổi bao nhiêu cũng được | không |
| `still` | bậc đổi trong khi cửa sổ **không nhích** — thứ khác đổi nó | không |
| `jump` | cửa sổ nhảy quá `margin` ở một trong hai trục (xoay, fullscreen) | không |
| `held` | cửa sổ nhích trong dải và bậc đổi | **có** |

Trước vòng 16 chỉ có hai kết quả, `true`/`false`, nên mọi câu hỏi "vì sao profile này
trễ 2px" phải trả lời bằng cách dán năm điều kiện vào REPL. Verdict là cùng một câu
trả lời cho hook, cho `diagnose()` và cho test.

### 24.2 `still` — lỗi mà boolean che mất

Điều kiện cũ là *"hai hộp nằm trong `margin` của nhau"*, và điều đó **cũng đúng khi
hai hộp giống nhau**. Một lần đổi bậc mà cửa sổ không nhích thì không đến từ cửa sổ:
safe-area inset xuất hiện, một lever của test, hay — quan trọng nhất — **profile do
thang sửa vẽ ra**. Thang sửa đổi `plan.fit`; profile sửa có cùng hộp với profile cũ,
nên điều kiện cũ giữ nó lại. Và vì khung hình sau ở đúng trạng thái ấy, `last.current`
không bao giờ tiến: **bản sửa không bao giờ được vẽ**. Không phải nhấp nháy — im lặng.

Một bộ ổn định có thể nuốt mất bản sửa thì tệ hơn một lần nhấp nháy, nên `still` là
lý do riêng, được kiểm bằng test "khung đầu tiên đã vẽ bản sửa".

### 24.3 Lớp 12 — dòng giải thích khung hình trễ

`AdaptiveProfile.held` là trường tuỳ chọn thứ hai chỉ hook mới điền (trường thứ nhất là
`repair`), và cùng lý do: một *chuỗi* cửa sổ là sự thật runtime, hàm thuần chỉ thấy một
hộp. Ba nơi đọc nó:

- `data-adaptive-held` trên DOM — ảnh chụp phân biệt được "trễ có chủ ý" với "đã cập nhật";
- `diagnose()` lớp `12 · hold` — in **cả hai** bậc: `held lg · comfortable instead of sm · compact`;
- `audit/drag.ts` — đếm `heldFrames` và `worstLag`.

### 24.4 Audit không chỉ điểm, mà cả đường

`adaptive-audit.md` là bảng 578 cửa sổ, và **mọi dòng đều đúng ở mọi thời điểm** — nên
nó không thể thấy hiện tượng sinh ra dải 2px. `adaptive-drag.md` (vòng 16) là chuỗi:
mỗi preset được kéo ±120px theo từng pixel (4 600 cửa sổ), chạy hai lần — raw và qua
`stabilize()` — rồi đếm số lần **bậc nhìn thấy** đổi.

| Cử chỉ | raw | held | Dải 2px mua được |
| --- | --- | --- | --- |
| **sweep** — kéo một chiều, ±120px | 12 | 11 | **1** (8%) |
| **shake** — con trỏ rung 1px tại mỗi ranh giới (`b−1, b, b+1, b` ×2) | 48 | **0** | **48** (100%) |

Con số thứ nhất là con số **thật thà**: kéo một chiều đi qua mỗi ranh giới đúng một lần,
mà hàm bậc thang cũng đổi đúng một lần — không có gì để dập. Con số thứ hai là thứ dải
2px thật sự mua: con trỏ đứng gần ranh giới và rung, mỗi khung hình là một bậc khác
nhau. Báo cáo in **cả hai cột** vì một cột sẽ để nó kể một trong hai câu chuyện.

Ba bất biến của đường kéo, và cả ba đều là cách dải 2px có thể *sai* chứ không chỉ khác:

- **an toàn** — profile được vẽ vẫn thoả 15 bất biến (nó *là* profile trước đó, nên đây
  là kiểm tra rằng `stabilize()` không trộn hai profile): 0 vi phạm / 4 600 cửa sổ;
- **sống** — không lần giữ nào dài quá `margin + 1` khung, vì dải nhả ngay khi cửa sổ đi
  quá `margin`: `stalled` rỗng;
- **trễ có biên** — `worstLag` = 2px trên mọi đường.

### 24.5 Sổ đếm trong tài liệu cũng là một cổng

Cùng vòng này, CI đỏ vì bốn tệp vẫn ghi «26 SVG» sau khi hình thứ 27 ra đời. Cổng đã có
từ lâu — `node scripts/sync-prose-counts.mjs --verify` — nhưng nó chỉ chạy trong một job
mà không ai chạy khi đang viết README, trong khi `npm run check` thì nằm trong tay mọi
người. Bộ luật được tách ra `scripts/lib/prose-counts.mjs`, và `tests/prose-counts-gate.test.ts`
chạy **đúng** bộ luật ấy (không phải bản sao) trên cả 14 tài liệu, với số đo lấy từ
badge và `readdirSync`, bên trong `vitest run`. Một cổng chỉ CI chạy là một cổng không
ai chạy.
