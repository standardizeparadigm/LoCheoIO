# ADR 0004 — Cổng đếm số liệu chạy bên trong vitest, không chỉ trong CI

| | |
| --- | --- |
| **Trạng thái** | Đã chấp nhận |
| **Ngày** | 2026-11-14 (v1.1.7 vòng sau cùng; siết chặt 2026-11-16) |

## Bối cảnh

`scripts/sync-prose-counts.mjs` tự sửa số liệu trong 14 tài liệu — nhưng nó chỉ
chạy khi ai đó nhớ chạy. Sự cố điển hình: `adaptive-stability.svg` được thêm,
mười README sửa tay thành «27 SVGs», và **bốn** file khác — `scripts/README.md`,
`tests/README.md`, `docs/README.md`, `CONTRIBUTING.md` — giữ nguyên «26». Không
gì đỏ cho đến khi CI chạy một job riêng mà không ai chạy khi sửa README.

Vấn đề thật: cổng tồn tại, nhưng nằm ở chỗ không ai ghé qua khi đang viết văn.

## Quyết định

1. Luật đếm chuyển vào `scripts/lib/prose-counts.mjs` — script và test dùng
   **chung một bản**, không sao chép.
2. `tests/prose-counts-gate.test.ts` chạy chính những luật đó **bên trong vitest**
   — tức là bên trong `npm run check`, lệnh mà mọi contributor chạy trước khi
   mở PR.
3. Test **không tự chạy lại script** (fork-bomb với thêm bước); nó nạp luật và
   kiểm tra các byte trên đĩa — file nào stale sẽ đỏ với thông báo kèm lệnh sửa.
4. CI vẫn giữ bước `--verify` riêng cho cả badge lẫn prose — phòng trường hợp
   ai đó chạy vitest thiếu file test.

## Lý do chọn

- Hai bản của một luật là đúng cách để hai bản nói khác nhau.
- `npm run check` là cổng duy nhất nằm trên tay mọi người — cổng phải ở đó.

## Hệ quả

- Sửa số liệu «tay» bị đỏ ngay tại lần `check` đầu tiên, kèm tên file và lệnh sửa.
- Một file docs mới muốn được đếm phải nằm trong danh sách target của
  `prose-counts.mjs` (hoặc khớp pattern tên) — file nằm ngoài danh sách là
  một file có thể stale vô hình, và đó là khoảng trống đã biết, không phải
  bí mật.

## Kiểm chứng

- `tests/prose-counts-gate.test.ts` — 14 target phải nêu đúng số hôm nay và
  không có cặp «nửa cũ nửa mới» nào sót lại.
- `.github/workflows/ci.yml` — bước «Prose counts … match the repo» chạy
  `--verify` một lần nữa ở CI.
