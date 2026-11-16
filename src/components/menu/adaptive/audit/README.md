# `adaptive/audit/` — kiểm toán không gian cửa sổ, và cả đường đi qua nó

Thư mục này trả lời **hai** câu hỏi mà bốn corpus trước không trả lời được:

> Trên *mọi* cửa sổ ứng dụng có thể chạy, bố cục làm gì, bao nhiêu lần, và có gì hỏng?

và, từ vòng 16:

> Khi cửa sổ **di chuyển**, màn hình dựng lại bao nhiêu lần — và cái dải 2px thật
> sự mua được gì?

Câu thứ nhất là bảng: 578 cửa sổ, mỗi cửa sổ một dòng, mọi dòng đều đúng ở mọi thời
điểm. Câu thứ hai là **chuỗi**: cùng những cửa sổ ấy, đi theo thứ tự khác, cho ra số
lần dựng lại khác nhau. Một bảng không có "hôm qua", nên nó không thể thấy hiện tượng
mà dải 2px sinh ra để dập — menu nhấp nháy khi kéo cạnh.

Trước vòng 12, câu trả lời nằm rải ở bốn tệp test, một bảng trong `check-adaptive.ts`
và một mục trong tài liệu thiết kế. Bốn chỗ, bốn con số có thể lệch nhau. Nay nó là
**một giá trị** — `AuditReport` — tính từ chính `resolveAdaptive()` mà ứng dụng dùng
để vẽ, nên không thể nói khác pixel.

## Vì sao vừa có preset vừa có lưới

21 preset là 21 thiết bị có tên: chỗ hồi quy thật đã xảy ra, và một thất bại ở đó
đọc là `iphone-4` chứ không phải `320×480`. Nhưng 21 cửa sổ không nhìn thấy được
**vách** giữa hai cửa sổ: bậc `row → stack` là một ngưỡng **chiều rộng**, và 420px
là một chiếc điện thoại thật mà không preset nào phủ.

Nên lần quét mặc định là **preset + lưới chữ nhật** các chiều rộng × chiều cao,
khử trùng lặp:

- `AUDIT_WIDTHS` — 25 giá trị, chọn quanh từng breakpoint thật của bố cục này:
  sàn 320, hai bên `sm` (640), mốc tablet 768, hai bên ngưỡng hàng 1024, và mốc
  `max-w-6xl` 1152 (trên đó hình học không đổi nữa).
- `AUDIT_HEIGHTS` — 23 giá trị: sàn 320, các dải điện thoại, hai chiều cao của báo
  lỗi (677 và 820), cặp 720/768, và các chiều cao desktop không còn áp lực.

578 cửa sổ, chạy hết 14 bất biến, mất chưa tới một giây.

## Tệp

| Tệp | Nội dung |
| --- | --- |
| `audit.ts` | `auditWindows()` (preset + lưới) · `auditOne()` · `auditWindowList()` · `summarise()` (gộp mẫu thành `AuditReport`) · `knownViolationIds()` · hai bảng `AUDIT_WIDTHS`/`AUDIT_HEIGHTS` |
| `report.ts` | `renderAuditMarkdown(report)` — sinh `docs/adaptive-audit.md`, cột bar 40 ký tự cố định để hai bản báo cáo diff được với nhau |
| `drag.ts` | **vòng 16** — `dragPath()` / `dragAudit()`: mỗi preset được "kéo" ±120px theo từng pixel, chạy hai lần (raw và qua `stabilize()`), đếm số lần đổi bậc; kèm đường **rung** `b−1, b, b+1, b` tại mỗi ranh giới — cử chỉ mà dải 2px sinh ra để dập |
| `dragReport.ts` | `renderDragMarkdown(report)` — sinh `docs/adaptive-drag.md` với **hai** cột (sweep và shake), vì một cột sẽ để báo cáo kể một trong hai câu chuyện |
| `index.ts` | barrel — `src/components/menu/adaptive/index.ts` re-export từ đây |
| `README.md` | tệp này |

## `AuditReport` gồm gì

| Trường | Nghĩa |
| --- | --- |
| `windows` | số cửa sổ đã resolve |
| `ok` | không cửa sổ nào phá hợp đồng |
| `violations` | id bất biến × số cửa sổ × ví dụ |
| `warnings` | mã thương lượng (`crop`, `no-ticker`, `minimal`…) × số cửa sổ |
| `fits` / `densities` / `tiers` / `chip` | histogram của bốn quyết định chính |
| `hero` | `{ row, stack }` |
| `minimal` | số cửa sổ chỉ còn chữ LỌ CHÉO |
| `extrema` | scene/reserve/room nhỏ nhất–lớn nhất, kèm cửa sổ đã sinh ra nó |
| `samples` | từng cửa sổ, theo thứ tự quét |

`summarise()` là hàm thuần và được export, nên một test có thể gộp một danh sách
cửa sổ tự chọn (ví dụ 4 cửa sổ của một hồi quy) mà không phải chạy cả lưới.

## Chạy

```bash
npm run audit:adaptive              # bảng tóm tắt
npm run audit:adaptive -- --json    # toàn bộ report
npm run audit:adaptive -- --check   # lỗi nếu docs/adaptive-audit.md lệch
npm run audit:adaptive -- --write    # ghi lại tài liệu
npm run audit:adaptive -- --select   # profile đang ship có phải bản rẻ nhất không
```

`--check` nằm trong `npm run check`, nên báo cáo không thể cũ đi mà không ai biết.

```bash
npm run audit:drag                  # tổng số, và những drag cắt nhiều ranh giới nhất
npm run audit:drag -- --json        # toàn bộ DragReport
npm run audit:drag -- --check       # lỗi nếu docs/adaptive-drag.md lệch
npm run audit:drag -- --write       # ghi lại tài liệu
```

## Drag audit đo gì (vòng 16)

| Số | Ở bản 1.1.8 (vòng 16) | Nghĩa |
| --- | --- | --- |
| windows | **4 600** | 21 preset × 241 bước 1px (± 120px ở chiều cao của preset) |
| sweep raw → held | **12 → 11** | kéo một chiều: mỗi ranh giới đi qua **một** lần, nên gần như không có gì để dập |
| shake raw → held | **48 → 0** | con trỏ rung 1px quanh ranh giới: **toàn bộ** bị dập — đây là thứ dải 2px mua được |
| held frames | **23 / 4 600** (1%) | tỉ lệ khung hình cố ý trễ, và trễ không quá `worstLag` |
| worst lag | **2px** | đúng bằng `HYSTERESIS_MARGIN`; vượt là dải bị rò |
| violations | **0** | profile được vẽ vẫn hợp lệ — nó *là* profile trước đó |
| stalled | **0** | không đường nào giữ lâu quá `margin + 1` khung |

**Một chế độ mỗi lần (vòng 14).** `--json`, `--write`, `--check`, `--select` cùng ghi
ra stdout theo bốn kiểu khác nhau, nên tổ hợp hai cờ không có nghĩa. Trước đây
`--select --check` chạy phần chọn bậc rồi `exit 0` **trước khi** kiểm báo cáo — thêm
một cờ không liên quan là bỏ qua được cổng mà `npm run check` dựa vào. Nay tổ hợp bị
từ chối với `exit 2`.

## Cái thư mục này **không** làm

- **Không render.** Nó không thấy font fallback hay border 1px. Phần đó là của
  `scripts/smoke-ssr.tsx` (markup) và ảnh chụp (mắt người).
- **Không sửa gì.** Nó chỉ mô tả. Việc tự sửa nằm ở `../repair/`.
- **Drag audit không render và không chạy React.** `stabilize()` là hàm thuần nên
  một đường kéo chỉ là một phép fold; thứ được kiểm là *quyết định*, không phải khung
  hình. Một component lờ profile trả về vẫn qua được đây — nửa còn lại nằm ở
  `tests/adaptive-hysteresis.test.ts` và smoke render.
- **Không thay bất biến.** `constraints.ts` vẫn là nơi duy nhất định nghĩa "hỏng";
  audit chỉ đếm.
