# Đọc `select/` — bậc nào rẻ nhất, và vì sao

Tài liệu này trả lời một câu, cho người sửa bố cục: **khi một cửa sổ có nhiều bản
bố cục cùng đúng hợp đồng, cái nào rẻ nhất — và làm sao biết?**

Đọc kèm: [`docs/guides/adaptive-audit.md`](adaptive-audit.md) (audit nói *có hỏng
không*), [`docs/design/adaptive-v2.md` §21](../design/adaptive-v2.md) (vì sao thứ tự
hạng tử là như vậy).

---

## 1. Chạy nó

```bash
npm run audit:adaptive -- --select
```

```
SELECTION — 648 windows from the audit's own grid
  shipped profile wins   648 / 648
  disagreements          0
  sample                 1280×720 → as-planned (nothing given up, 102px spare;
                         tied, earlier rung: ignore-inset, nothing given up)
```

Dòng `shipped profile wins` là toàn bộ ý tưởng: **648 / 648** nghĩa là trên mọi cửa
sổ trong lưới, profile ứng dụng đang vẽ cũng là bản rẻ nhất trong sáu bậc của thang.
Nếu con số thứ hai khác 0, in ra dưới nó là từng cửa sổ và bậc mà lẽ ra rẻ hơn —
đó là một bố cục đang ship mà đã có bản thay thế tốt hơn.

## 2. Đọc một dòng

```
1280×720 → as-planned (nothing given up, 102px spare; tied, earlier rung: ignore-inset, nothing given up)
```

| Phần | Nghĩa |
| --- | --- |
| `1280×720 → as-planned` | cửa sổ, và bậc thắng |
| `nothing given up` | hạng tử đầu tiên khác 0 — tức là không có gì mất |
| `102px spare` | `slack`: band còn thừa 102px. Không phải lỗi, chỉ là thông tin |
| `tied, earlier rung: ignore-inset` | bậc về nhì *rẻ bằng* — một lever không cắn gì — nên thứ tự chốt là vị trí trong thang |

Nếu bậc thắng thật sự rẻ hơn, chữ đó là `next:` thay vì `tied`.

## 3. Bảy hạng tử, theo thứ tự

| # | Hạng tử | Nghĩa | Đo từ |
| --- | --- | --- | --- |
| 1 | `violations` | phá hợp đồng thì không phải ứng viên | `violations()` |
| 2 | `hidden` | hero mất mascot / deck / tagline | `plan.minimal` **so với base** |
| 3 | `cropped` | px thiếu so với sàn của chính nó | `scene + reserve − height` |
| 4 | `hudLost` | phần trăm cỡ HUD mất đi | `playfield.hudScale` |
| 5 | `typeDrop` | px chữ mất, cộng toàn thang | `type.*` |
| 6 | `levers` | số thứ đã đổi (không nhìn thấy) | so profile, không so override |
| 7 | `slack` | phòng thừa dọc | `scene − heroContentHeight()` |

Hai điều dễ đọc sai:

- **`hidden` / `cropped` đo so với base.** Ở 320×320, `plan.minimal` là `true` *trước
  khi* kéo lever nào. Nếu chấm cờ thô thì profile đang ship bị báo "hidden 1" và mọi
  so sánh ở góc chật nhất thành vô nghĩa. Chỉ **mất thêm** mới là mất.
- **`levers` đếm từ profile.** `ignoreInset` trên cửa sổ không có inset không đổi gì
  → 0 lever. Vì thế `ignore-inset` thường *hoà* với `as-planned`, và thứ tự chốt là
  vị trí trong thang.

## 4. Khi nào sửa `score.ts`, khi nào không

Sửa **thứ tự** trong `SCORE_ORDER` là thay đổi sản phẩm: mỗi lần đổi, chạy

```bash
npm run gen:select     # ghi lại 12 quyết định
git diff tests/fixtures/selection/
```

Diff đó là bản review thật. Nếu nó cho thấy một bậc khác thắng ở một cửa sổ, câu hỏi
cần trả lời là *vì sao người chơi lại thích cái đó hơn* — không phải "test đỏ thì sửa
test".

Đừng thêm hạng tử thứ tám mà không xếp nó vào `SCORE_ORDER`: một hạng tử không có
trong danh sách là một hạng tử **không được so** — nó vẫn được in ra, vẫn trông như
đang hoạt động, và không bao giờ quyết định gì. `tests/adaptive-select.test.ts` kiểm
đúng điều này bằng cách đi qua từng cặp hạng tử kề nhau.

## 5. Quan hệ với `repair/`

| | `repair/` | `select/` |
| --- | --- | --- |
| Câu hỏi | "bậc đầu tiên nào **đúng**?" | "bậc nào **rẻ nhất**?" |
| Trả về | `RepairResult` — profile, `ok`, `attempts` | `Selection` — người thắng, thứ hạng, lý do từng bậc thua |
| Dùng khi | cần **một** profile sửa được, ngay lúc chạy | cần **biết** bậc nào rẻ nhất, và chứng minh nó |

Với hợp đồng thật cả hai trả về cùng một bậc — `as-planned` — vì không cửa sổ nào
hỏng. Seam `validator` của cả hai tồn tại để test có thể làm chặt hợp đồng và bắt
chúng **thật sự bước**; nếu chỉ có đường happy thì thang là mã chết có hình thức
đúng.

## 6. Bốn lỗi đã từng xảy ra ở đúng chỗ này

1. **Đo bằng cờ thô thay vì so với base** → mọi cửa sổ nhỏ bị báo "hidden 1", và
   `slack` bị báo là chi phí. Xảy ra ngay lần chạy đầu của vòng 13.
2. **Đếm override thay vì đếm thay đổi** → hai ứng viên giống hệt nhau có điểm khác
   nhau; `levers` trở thành nhiễu.
3. **Hoà phụ thuộc `sort` ổn định** → kết quả đúng hôm nay, đổi engine là đổi bậc.
   Nay có khoá thứ hai: vị trí trong thang.
4. **Hai định nghĩa của "hero cao bao nhiêu"** → vòng 9 trả giá bằng một ảnh chụp
   hũ dưa bị cắt. `select/` gọi `heroContentHeight()`, không đo lại.

Bốn lỗi, một câu: **một phép đo thứ hai luôn lệch; và một cái giá đo sai chỗ thì
làm mọi so sánh sai theo.**
