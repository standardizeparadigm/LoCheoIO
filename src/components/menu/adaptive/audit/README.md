# `adaptive/audit/` — kiểm toán toàn bộ không gian cửa sổ

Thư mục này trả lời **một** câu hỏi mà bốn corpus trước không trả lời được:

> Trên *mọi* cửa sổ ứng dụng có thể chạy, bố cục làm gì, bao nhiêu lần, và có gì hỏng?

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
```

`--check` nằm trong `npm run check`, nên báo cáo không thể cũ đi mà không ai biết.

## Cái thư mục này **không** làm

- **Không render.** Nó không thấy font fallback hay border 1px. Phần đó là của
  `scripts/smoke-ssr.tsx` (markup) và ảnh chụp (mắt người).
- **Không sửa gì.** Nó chỉ mô tả. Việc tự sửa nằm ở `../repair/`.
- **Không thay bất biến.** `constraints.ts` vẫn là nơi duy nhất định nghĩa "hỏng";
  audit chỉ đếm.
