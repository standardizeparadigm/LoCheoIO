# `menu/panel` — khoảng dư của một panel không phải là ba khoảng trống

Hai file, một footer.

```
stat.ts            số liệu cho footer — thuần, test được không cần DOM
PanelStatStrip.tsx <PanelStatStrip stats={…} />, chỉ hiển thị
index.ts           barrel
```

## Vấn đề nó sửa

`CornerPanel` là một khung **cao cố định**, và từ vòng 7 nó có **bốn** giá trị
chứ không phải hai (xem `layout/metrics.ts`, hàm `cornerPanelHeight(7, rich,
tight, compact)`):

| Chế độ | Hàng | Header · gap · padding | 7 hàng (GAME) | 3 hàng (INFO) |
| --- | --- | --- | --- | --- |
| gọn | 34px | 22 · 6 · 16 | **318** | 158 |
| gọn + tight | 26px | 22 · 6 · 16 | **262** | 134 |
| đầy đủ | 54px | 22 · 6 · 16 | **458** | 218 |
| đầy đủ + compact | 54px | 18 · 3 · 10 | **430** | 202 |

Bốn hàng đó là bốn cách trả cùng một hoá đơn. `tight` hạ **hàng** — thứ duy nhất
được phép mất chiều cao, vì nó vẫn là một nút bấm được. `compact` hạ **không
khí** — header, gap, padding — và giữ nguyên mọi hàng. Vòng 7 cần cả hai vì một
cửa sổ 677px không đủ cho 318px panel cộng hero 299px.

Panel GAME có 7 hàng nên 7 hàng đó gần lấp hết khung; panel INFO có 3 hàng nên
còn dư một khoảng rất lớn — 240px ở chế độ đầy đủ.

Cách cũ xử lý khoảng dư đó là `justify-content: space-around` trên body. Với
GAME (7 hàng) kết quả trông ổn. Với INFO (3 hàng) nó biến khung thành:

```
┌────────────────────┐
│                    │  ← dư
│   GIỚI THIỆU TÁC GIẢ│
│                    │  ← dư
│   CHANGELOG        │
│                    │  ← dư
│   THOÁT            │
│                    │  ← dư
└────────────────────┘
```

Ba nút trông như ba thứ rời rạc, không phải một danh sách. Đó chính là câu
«phần thông tin tự nhiên bị chia ra» trong ảnh chụp thứ hai.

## Cách sửa

Hai thay đổi, và thứ tự quan trọng:

1. **`.corner-panel-body { justify-content: flex-start }`** — hàng xếp thành
   một khối ở đỉnh, giống một danh sách thật. GAME và INFO dùng chung rule,
   không cần biết panel nào có mấy hàng.
2. **Một footer chiếm phần dư** (`margin-top: auto`) — khoảng trống trở thành
   *một* khoảng có chủ đích thay vì N khoảng ngẫu nhiên.

## `stat.ts`

Hai hàm, cả hai đều thuần và đều có test:

```ts
progressStat({ unlocked, total, modes })
// → [ { label: "✓", value: "7/16" }, { label: "◆", value: "9" } ]

buildStat(APP_VERSION, tierFor(latestEntry().version))
// → [ { label: "build", value: "v1.1.8" }, { label: "◆", value: "PATCH" } ]
```

`progressStat` **kẹp** `unlocked` về `[0, total]`. Lý do không phải phòng xa:
một bản lưu cũ từng khiến panel in ra `18/16` vì achievements được đếm theo
khoá lưu mà danh sách thành tựu đã đổi giữa các bản. Footer là nơi con số hiện
ra thường trực nhất, nên nó không được phép in một phân số vô lý.

`buildStat` nhận tier từ **chính** `tierFor(latestEntry().version)` chứ không
phải một tham số rời — nhờ vậy chip `◆PATCH` ở footer không thể lệch với chip
ở panel changelog ngay trên nó.

## Vì sao tách khỏi `CornerPanel`

`CornerPanel` không biết gì về thành tựu hay phiên bản; nó chỉ nhận một
`footer?: ReactNode`. Việc tính toán nằm ở đây, nên `tests/menu-panel.test.ts`
kiểm tra được phép kẹp, phép lấy tier và thứ tự khoá **mà không cần render**
một panel nào — 12 test chạy trong vài mili giây.

## Bất biến được khoá

- Footer **không** được tính theo số hàng: GAME 7 hàng và INFO 3 hàng dùng
  cùng một footer, cùng một rule.
- `justify-around` / `justify-between` / `justify-evenly` **không** được quay
  lại `.corner-panel-body` — có test grep.
- `unlocked` luôn bị kẹp; `NaN` và số âm đều trả `0`.

## The two components the footers render

| File | What it shows | When |
| --- | --- | --- |
| `PanelChallenge.tsx` | today's challenge: mode name · target | `plan.footer` is true |
| `PanelSummary.tsx` | three catalogue counts, one line each | `!plan.tight` |

Neither is interactive. The counts are already announced by the rows above them
(`16 thành tựu`, `9 chế độ`), so these blocks render plain text rather than adding
a second reading of the same numbers to the accessibility tree.

`PanelSummary.tsx` is the one that had `mt-auto` while its body used
`space-between`. `summary.ts` is the module behind both: `summaryLines()`,
`challengeLine()`, and the `safeCount()` clamp.
