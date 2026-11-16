# Kiểm toán adaptive — từ "cửa sổ này trông lạ" tới "cả không gian ổn"

Hướng dẫn này dành cho người **không** viết ra hệ adaptive: bạn vừa thấy một ảnh
chụp lạ, hoặc bạn sắp phát hành và muốn biết bố cục đang làm gì trên 578 cửa sổ.

## 1. Ba câu hỏi, ba công cụ

| Câu hỏi | Công cụ | Thời gian |
| --- | --- | --- |
| "Cửa sổ **này** trông thế nào?" | `npm run check:adaptive` | 1s |
| "Vì sao **cửa sổ này** trông như vậy?" | `npm run check:adaptive -- --explain` | 1s |
| "**Cả không gian** đang làm gì, có gì hỏng?" | `npm run audit:adaptive` | 2s |

Ba công cụ, một nguồn: cả ba đều gọi `resolveAdaptive()`. Nếu chúng nói khác nhau
thì đó là bug, không phải chuyện "góc nhìn".

## 2. Đọc bảng audit

```
ADAPTIVE AUDIT — 578 windows (21 presets + breakpoint grid)
------------------------------------------------------------------------------
contract      OK — no window breaks an invariant
minimal       101 window(s) are wordmark-only
hero          170 row · 408 stack
extremes      scene 140px (320×320) … 1642px (3840×2160)
              reserve floor 216px (320×480) · tightest room 0 (320×320)

trade-offs
  no-ticker          176   30%  ████████████████████████████
  dialog-compact     126   22%  ██████████████████████······
  …
```

Đọc theo thứ tự:

1. **`contract`** — nếu khác `OK`, dừng lại. Đó là bug, không phải thương lượng.
   Dòng vi phạm in kèm **ví dụ cửa sổ**, nên bước tiếp theo là chạy `--explain` trên
   đúng cửa sổ đó.
2. **`minimal`** — 101/578 cửa sổ chỉ còn chữ LỌ CHÉO. Con số này *tăng* là dấu
   hiệu một ngưỡng vừa bị nâng quá tay.
3. **`hero row/stack`** — bậc `row → stack` là ngưỡng **chiều rộng**; tỉ lệ này đổi
   mạnh khi `WIDTH_FOR_SIDE_BY_SIDE` đổi.
4. **`extremes`** — hai đầu của không gian. `scene` nhỏ nhất là chỗ dễ vỡ nhất;
   `room 0` là cửa sổ chật nhất mà ứng dụng vẫn nhận.
5. **`trade-offs`** — không phải lỗi. `crop` 25 cửa sổ (cả 25 ở chiều cao 320px) là
   *quyết định*: cửa sổ thấp hơn sàn + chrome thì thà cắt còn hơn bóp chữ. Nhưng "cắt"
   phải **tới được**: từ vòng 14, `[data-adaptive-fit="crop"] .menu-pane` là vùng cuộn
   dọc, nên phần cột vượt cửa sổ vẫn với tới được thay vì bị `overflow: clip` nuốt mất.

Bốn chế độ (`--json`, `--write`, `--check`, `--select`) **không đi cùng nhau**: mỗi cái
sở hữu stdout theo một kiểu, nên đưa hai cờ là từ chối (`exit 2`) — trước vòng 14,
`--select --check` lặng lẽ bỏ qua phần kiểm.

## 3. Khi audit đỏ

```bash
# 1. cửa sổ nào?
npm run audit:adaptive -- --json | grep -A3 '"violations"' | head

# 2. vì sao?
npm run check:adaptive -- --explain 1280x720

# 3. bất biến nào?
npx vitest run tests/adaptive-constraints.test.ts
```

Rồi sửa **nguyên nhân**, không sửa con số: một vi phạm `column-fills-window` là
`planMenuLayout()` cộng sai, không phải `scene` trong bảng cần chỉnh tay.

## 4. Khi bạn *cố ý* đổi bố cục

Đổi một breakpoint hay một dòng density sẽ làm `docs/adaptive-audit.md` lệch. Đó
là thiết kế, không phải phiền toái:

```bash
npm run audit:adaptive -- --write   # sinh lại tệp
npm run audit:adaptive -- --select  # chế độ thứ tư — xem guides/adaptive-selection.md
git diff docs/adaptive-audit.md     # đọc xem bạn vừa đổi cái gì, bao nhiêu cửa sổ
```

Diff đó **là** bản mô tả thay đổi của bạn, bằng số. Nếu nó làm 40 cửa sổ rơi từ
`comfortable` xuống `tight`, bạn thấy ngay trước khi mở PR.

Ba corpus còn lại trả lời ba câu hẹp hơn và cũng cần `--check` khi chúng đổi:

```bash
npx vite-node scripts/gen-adaptive-fixtures.ts --check   # 1 110 cửa sổ
npx vite-node scripts/gen-hero-fixtures.ts --check       # 510 cặp band
npm run gen:chip -- --check                              # 189 cặp chip
npx vite-node scripts/gen-regression-fixtures.ts --check  # 14 cửa sổ sự cố
```

## 5. Corpus sự cố — đọc trước khi sửa bất cứ thứ gì

`tests/fixtures/regressions/` có 14 file, mỗi file là **một cửa sổ đã từng bị báo
lỗi**, kèm `symptom` (triệu chứng, theo lời báo cáo) và `guard` (điều phải giữ).

```bash
cat tests/fixtures/regressions/r10-chip-row-1920x820.json
```

Trước khi đổi một ngưỡng, chạy:

```bash
npx vitest run tests/adaptive-regressions.test.ts
```

Nếu đỏ, câu báo lỗi sẽ là *"the chip is «ellipsis» — «MUỐI DƯA CỔ ĐIỂN» lost the
right side…"*. Đó là lý do corpus này tồn tại: một thất bại phải đọc thành một câu
về cửa hàng, không phải hai con số.

## 6. Khi một cửa sổ **thật sự** không thể vừa

`src/components/menu/adaptive/repair/` có thang sáu bậc:

```
as-planned → ignore-inset → compact-hud → single-column → smaller-type → smallest-type
```

`repairProfile()` resolve, kiểm hợp đồng, và đi xuống thang tới khi đúng. Hôm nay
**không** cửa sổ nào cần nó — cả 578 cửa sổ dừng ở bậc 0 — nhưng nó tồn tại để
* có thể* dùng, và `tests/adaptive-repair.test.ts` chứng minh thang thật sự bước
bằng cách truyền một hợp đồng chặt hơn.

Muốn thấy nó chạy:

```bash
npx vitest run tests/adaptive-repair.test.ts -t "stops on the first rung"
```

## 7. Bốn điều **không** làm

1. **Đừng sửa `docs/adaptive-audit.md` bằng tay.** Nó được sinh; `--check` trong
   `npm run check` sẽ báo.
2. **Đừng thêm bất biến vào audit.** Hợp đồng ở `constraints.ts`, một nơi duy nhất.
3. **Đừng "làm tròn" một con số trong test cho vừa.** Con số ghim trong
   `tests/adaptive-audit.test.ts` là hành vi, không phải nhiễu.
4. **Đừng bỏ preset khỏi lưới.** 21 preset là nơi hồi quy thật đã xảy ra; lưới chỉ
   bổ sung chỗ *giữa* chúng.
