# Bố cục thích nghi — hợp đồng giữa plan và hero

Tài liệu này mô tả **hợp đồng** giữa `menu/layout/` (nơi tính toán) và
`menu/adaptive/` (nơi quyết định hiển thị). Vòng 6 tồn tại vì hợp đồng đó
không có ai viết ra.

## 1. Vấn đề: hai trục, một media query

CSS có media query theo chiều rộng (`sm:` · `lg:`) và theo chiều cao
(`@media (min-height:)`). Nhưng bố cục hero cần **cả hai cùng lúc**:

> Nếu cửa sổ đủ rộng **và** hero đủ cao, đặt mascot cạnh wordmark.
> Ngược lại, xếp dọc.

Điều kiện "và" giữa hai trục không viết được bằng hai media query rời, vì
chúng không biết nhau. Cách duy nhất là một ngôn ngữ khác — CSS không diễn đạt
được `A ∧ B` khi `A` đến từ viewport width và `B` đến từ một biến do JavaScript
tính.

## 2. Hợp đồng

```
planMenuLayout(viewport)  ──►  MenuPlan { scene, reserve, minimal, … }
                                        │
                                        ▼
                              heroLayout({ scene, width, minimal })
                                        │
                                        ▼
                              HeroLayout { sideBySide, halo, … }
```

Ba bất biến:

1. **`scene + reserve === usableHeight(height, inset)`** — luôn đúng khi economy
   không đổi. Bản trước của câu này ghi `viewport.height`, và nó đúng cho tới khi
   inset an toàn vùng được thêm vào: khi đó phần bị tai thỏ / home indicator ăn
   mất không thuộc về layout, nên tổng phải bằng phần **còn dùng được**. Đây là
   bất biến của `layout/fit.ts`, không phải của tài liệu này.
2. **`heroLayout` không đọc DOM.** Nó là hàm thuần của ba số. Đó là lý do
   `tests/menu-adaptive.test.ts` quét được 1 682 kích thước trong 15ms.
3. **`heroContentHeight(heroLayout(x)) ≤ x.scene`** với mọi `x` mà plan sinh
   ra được. Bất biến này do bài quét giữ, không do người viết mã.

## 3. Bốn ngưỡng

| Hằng số | Giá trị | Suy từ | Nếu đặt sai |
| --- | --- | --- | --- |
| `HEIGHT_FOR_BADGE_ROW` | 232 | 150 + 40 + 22 + 20 | dòng kỷ lục bị cắt ở đáy band |
| `HEIGHT_FOR_HALO` | 300 | 150 + 240 − 90 | vòng sáng đè lên badge row |
| `HEIGHT_FOR_SIDE_BY_SIDE` | 300 | 192 + 24 + đệm | mascot bị cắt đáy |
| `WIDTH_FOR_SIDE_BY_SIDE` | 1024 | `lg` của Tailwind | hai cột chen vào 700px |

Cột "Nếu đặt sai" là lý do mỗi ngưỡng có một bài kiểm riêng trong
`describe("the thresholds are derived, not chosen")`.

## 4. Vì sao không có cascade

Mỗi cờ trong `HeroLayout` là một phép thử **độc lập**:

```ts
return {
  sideBySide,                                  // width ≥ 1024 ∧ scene ≥ 300
  halo:      scene >= HEIGHT_FOR_HALO,         // không phụ thuộc sideBySide
  badgeRow:  scene >= HEIGHT_FOR_BADGE_ROW,
  mascot:    true,                             // không bao giờ ẩn logo
  liveBadge: scene >= HEIGHT_FOR_BADGE_ROW,
};
```

Nếu viết theo kiểu cascade (`if (!sideBySide) return { halo: false, … }`) thì
nâng một ngưỡng có thể vô tình tắt một thứ khác. Bài kiểm "the ladder" đi từ
900px xuống 100px theo bước 10px và khẳng định thứ tự tắt: badge row → halo,
và mascot không bao giờ tắt ngoài `minimal`.

## 5. Điều gì xảy ra khi resize

`layout/viewportEvents.ts` đăng ký sáu sự kiện trên một danh sách duy nhất:

```ts
VIEWPORT_EVENTS = [
  "resize", "orientationchange", "fullscreenchange",
  "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange",
]
```

Cả `useMenuPlan()` và `useViewportWidth()` dùng `onViewportChange()`. Cập nhật
được gộp vào một `requestAnimationFrame`, nên kéo cửa sổ không re-plan hàng
trăm lần mỗi giây.

`fullscreenchange` là sự kiện vòng 6 thêm vào — chính là cách người dùng tạo ra
hai ảnh chụp mở đầu vòng này.

## 6. Khi thêm một phần tử vào hero

1. Đo chiều cao thật của nó ở cỡ chữ nhỏ nhất.
2. Thêm một cờ vào `HeroLayout` **và** một ngưỡng vào `breakpoints.ts`.
3. Cộng chiều cao đó vào `heroContentHeight()`.
4. Thêm nó vào bài kiểm "the ladder" nếu nó phải tắt theo thứ tự.
5. Chạy `npx vitest run tests/menu-adaptive.test.ts` — bài quét sẽ nói ngay
   ngưỡng có đúng không.

Bước 3 là bước dễ quên nhất, và là bước duy nhất khiến ngưỡng trở thành số
suy ra thay vì số đoán.

## 7. Tầng dưới cùng: môi trường

Ba mục trên nói về *kích thước*. Nhưng kích thước cửa sổ không phải thứ duy nhất
quyết định bố cục, và `adaptive/environment.ts` đọc phần còn lại:

| Trường | Nguồn | Vì sao không đọc thẳng ở nơi dùng |
| --- | --- | --- |
| `dpr` | `window.devicePixelRatio` | có thể là `0`, `NaN`, hay `1.5` — phải kẹp [1, 4] |
| `landscape` | `matchMedia("(orientation: landscape)")` | `innerWidth > innerHeight` sai khi bàn phím ảo mở |
| `coarse` | `matchMedia("(pointer: coarse)")` | đổi **không cần** `resize` trên máy hybrid |
| `inset*` | `env(safe-area-inset-*)` qua một phần tử dò | không đọc được nếu không có phần tử *dùng* nó |
| `reducedMotion` | `matchMedia("(prefers-reduced-motion: reduce)")` | người dùng đổi giữa phiên |

### 7.1 Inset: phần tử dò

`env()` chỉ có giá trị khi một phần tử **dùng** nó. Cách đọc:

```ts
probe.style.padding = "env(safe-area-inset-top) env(safe-area-inset-right) " +
                      "env(safe-area-inset-bottom) env(safe-area-inset-left)";
body.appendChild(probe);
const cs = getComputedStyle(probe);   // một lần ép layout
const top = parseFloat(cs.paddingTop) || 0;
// … và finally { probe.remove(); }
```

Bản đầu tạo **bốn** phần tử (mỗi cạnh một cái) vì cho rằng phải tách. Không: bốn
padding trên **một** phần tử cho đúng bốn số, với **một** lần ép layout thay vì
bốn — và trên một sự kiện `resize` bắn 60 lần/giây thì đó là khác biệt thật.

`parseFloat("")` là `NaN`, `|| 0` biến nó thành 0. Dùng `sane()` thì sai: hàm đó
có sàn 1, và inset `0` là hợp lệ.

### 7.2 `usableHeight()`

```ts
export function usableHeight(v: { height: number; inset?: number }): number {
  const raw = Number.isFinite(v.inset) ? Math.trunc(v.inset!) : 0;
  const inset = Math.min(Math.max(raw, 0), MAX_INSET);   // [0, 200]
  return Math.max(1, Math.trunc(v.height) - inset);
}
```

Ba lựa chọn ở đây, mỗi cái có lý do:

- **`Number.isFinite` trước, `Math.max` sau** — `Math.max(1, NaN)` là `NaN`, và
  một `NaN` đi vào phép chia economy sẽ tạo ra `scene: NaN`, mà React lặng lẽ bỏ.
- **`MAX_INSET = 200`** — một inset lớn hơn thế là dữ liệu hỏng, không phải tai
  thỏ. Không kẹp thì `inset: 9999` cho `usableHeight = 1`, tức là màn hình tối
  giản trên một cửa sổ 1080p.
- **Sàn `1`** — không phải để "tránh 0", mà để phép chia economy không bao giờ
  chia cho 0.

### 7.3 Giới hạn đã biết

Ở **844×600**: inset 0 → hero 222px; inset 10 → hero **268px**. Cửa sổ nhỏ hơn,
hero cao hơn 46px. Nguyên nhân là economy đổi ngưỡng, không phải inset bị tính
sai.

Đã thử sửa bằng cách liệt kê 8 economy và lấy cái cho `scene` lớn nhất — hàm
**đơn điệu** theo thiết kế. Nhưng nó cũng tối đa `scene` *ở mọi nơi*, nên ở
1920×1080 nó cắt ticker và hàng cao để nhường chỗ cho hero: 12 test hiện có đỏ.
Đã hoàn nguyên. Sửa đúng cần hai mục tiêu (đặt sàn trước, tối đa sau), tức là
thiết kế lại bố cục — không phải một bản vá.

`tests/layout-inset.test.ts` khẳng định **con số đo được** (222 → 268, +46) như
một test đang xanh. Sửa được thì test đỏ và buộc cập nhật; không sửa thì nó vẫn
được ghi lại. Cạnh đó là bất biến thật: trong *một* economy,
`scene + reserve === usableHeight` (252 tổ hợp).
