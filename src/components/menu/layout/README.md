# `menu/layout` — the arithmetic behind the fix

Bốn file, một phép cộng.

```
metrics.ts      mọi con số được phép dùng — khai báo, không suy ra
fit.ts          một viewport → một kế hoạch (thuần, không DOM)
useMenuPlan.ts  đọc cửa sổ thật, giữ kế hoạch đồng bộ
index.ts        barrel
```

## Vì sao có thư mục này

v1.1.7 đo menu bằng padding và hy vọng. Panel góc tự cao bằng nội dung, ticker
tự cao bằng chữ, hero nhận phần còn lại. Không có gì được *khai báo* nên không
có gì kiểm tra được, và hai lỗi trong ảnh chụp là hệ quả trực tiếp:

```
720px cửa sổ
├── 415px  hàng panel (6 dòng × 2 dòng chữ + padding)
├──  55px  ticker (marquee + dòng bản quyền)
└── 250px  hero  ← 720 − 415 − 55
```

`250 < 320`, và 320 là chiều cao tối thiểu để chữ `LỌ` cộng chú lọ vừa khung.
Vì thế `LỌ` bị đẩy lên trên mép và bị cắt, còn `CÀI ĐẶT` bị đẩy xuống dưới.

## Phép cộng đúng

```
ROW 34   RICH 54   GAP 6   HEADER 22   PADDING 16   BORDER 6   ROWS 7

panel(rich)    = 22 + 7×54 + 6×6 + 16 + 6 = 458
panel(compact) = 18 + 7×54 + 6×3 + 10 + 6 = 430      ← header 18, gap 3, padding 10

reserve(rich)    = 458 + 48 (ticker) + 12 (margin) = 518
reserve(compact) = 430 + 48 + 12                   = 490

scene@720  = 720 − 378 = 342   ✅      (rows 34px: panel = 278)
scene@1080 = 1080 − 518 = 562  ✅
```

## Năm viewport thật

| Viewport | reserve | scene | bố cục | fit |
| --- | --- | --- | --- | --- |
| 1280×720 | 378 | **342** | cạnh nhau / gọn (34px) | `none` |
| 1366×768 | 378 | 390 | cạnh nhau / gọn (34px) | `none` |
| 1920×1080 | 518 | 562 | cạnh nhau / đầy đủ (54px) | `none` |
| 768×1024 | 518 | 506 | cạnh nhau / đầy đủ (54px) | `none` |
| 375×667 | 378 | 289 | **xếp dọc** / gọn (34px) | `squeeze` |
| 375×568 | 274 | 294 | xếp dọc / tight (26px) | `squeeze` |
| 844×390 | 216 | 174 | xếp dọc / tight + minimal | `squeeze` |

Dòng cuối từng ghi `244 / 146`, và nó sai theo cả hai cách: `reserve` 244 không
phải một tổng nào `cornerRowReserve()` sinh ra được (tight + minimal cho **216**),
và hero 174 không vừa `MIN_SCENE_HEIGHT` 220 — đúng, vì `minimal` hạ sàn xuống
`TIGHT_SCENE_HEIGHT` 140. Một dòng trong bảng mô tả một chế độ mà bảng không có
cột nào để nói ra.

## Bất biến duy nhất, và nó được kiểm

```
scene + reserve === viewport.height        (mọi viewport ≥ 240px)
```

Vòng 1 và vòng 2 kẹp `scene` bằng `max(320, height − reserve)`. Kẹp **sàn** như
thế nghĩa là khi `height < reserve + 320`, `scene + reserve > height` — **cột
cao hơn cửa sổ**, và phần dư biến thành thanh cuộn. Mỗi vòng sau đó chỉ dời chỗ
tràn: lần đầu là chữ `LỌ` bị cắt, lần sau là dòng bản quyền, lần nữa là thanh
cuộn. Đó là lý do yêu cầu "phải dứt điểm" là đúng.

Nay `planMenuLayout()` **không được phép** trả về kế hoạch không vừa. Khi cửa
sổ không đủ chỗ, plan hạ cấp theo thứ tự cố định:

| Bước | Hy sinh | Được lại | Không bao giờ mất |
| --- | --- | --- | --- |
| 1 | hàng 34 → **26px** | 56px / 7 hàng | đủ **mọi** nút |
| 2 | **ticker** | 48px + lề | có lại trong modal Cách chơi |
| 3 | **footer** panel | 30px | con số đã in trên hàng |
| 4 | hero chỉ còn **wordmark** | ~80px | chữ ký thương hiệu |

`MenuPlan` mang theo ba cờ — `tight`, `minimal`, `ticker`, `footer` — và mỗi cờ
có **đúng một** chỗ đọc: `CornerPanel` vẽ `data-tight`, `StartScreen` bỏ
tagline/deck/mascot khi `minimal`, và `MenuTicker` chỉ render khi `ticker`.

## Hai ngưỡng bề rộng

- **`STACK_BREAKPOINT = 520`** — hai panel 224px cộng khe cần 456px. Dưới
  520px chúng sẽ đè lên nhau giữa màn hình, nên cả hàng chuyển sang một cột.
- **`RICH_ROW_BREAKPOINT = 840`** — dòng đầy đủ tốn thêm 20px × 7 = 140px.
  840 − 518 = 322, vẫn trên `PREFERRED_SCENE_HEIGHT` (320), nên một laptop cao
  không bao giờ nhận hero *thấp hơn* một laptop thấp.

## Không cuộn, theo nghĩa đen

`.menu-pane` dùng `overflow: clip` — nó **không tạo vùng cuộn**. Không phải
`hidden` (vẫn cuộn được bằng bàn phím), không phải `auto`. Và
`tests/menu-no-scroll.test.ts` **cấm** một rule giấu thanh cuộn quay lại
`.menu-pane`: một rule như thế nghĩa là ai đó vẫn đang chờ có tràn.

## Vì sao `justify-center` không còn là lỗi

Bản cũ đặt `justify-center` + `min-h-full` trong một khung `overflow-y-auto`,
nên nội dung cao hơn khung bị đẩy **lên trên gốc cuộn** và không thể cuộn tới.
Nay không có khung cuộn nào và hero có `height` chính xác: `justify-center`
chỉ căn nội dung trong một dải đã biết chiều cao, nên nó căn đúng — hoặc cắt
phần dư ở hai đầu bằng nhau, chứ không đẩy ai ra ngoài tầm với.

## Kiểm chứng

- `tests/menu-layout.test.ts` — 30+ ca, quét 300→1600px theo bước 7px trên 10
  bề rộng, khẳng định `scene + reserve === height` ở từng tổ hợp.
- `tests/menu-no-scroll.test.ts` — 26 ca trên 15 viewport thật, cộng quét
  300→2000px theo bước 5px.
- `scripts/probe-menu-layout.tsx` — render `StartScreen` thành HTML thật và
  kiểm 30 tính chất trên DOM, không chỉ trên mã nguồn.

## `viewportEvents.ts`

One list of the six window events that can change the plan:

    resize · orientationchange · fullscreenchange · webkitfullscreenchange
    visualViewport.resize · visualViewport.scroll

Both hooks (`useMenuPlan` and `useViewportWidth`) subscribe through this module
instead of each registering its own copies — the bug it fixed was a plan that
went stale on entering fullscreen, because the app listened only for `resize`
and Firefox fires no `resize` for a fullscreen change.

`tests/viewport-events.test.ts` has 16 cases, including the 0×0 `visualViewport`
that used to produce a 1×1 plan.
