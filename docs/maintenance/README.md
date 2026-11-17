# `docs/maintenance/` — quy trình bảo trì và rà soát

Thư mục này chứa **cách dự án tự rà mình** — những quy trình được dùng thật từ
vòng 12 đến vòng 19 của v1.1.8 và đã bắt được lỗi mà cổng thường xuyên không
nhìn thấy. Không phải tài liệu tham khảo; là nhật ký công việc viết đủ cụ thể
để lượt rà tiếp theo làm theo được.

| File | Nội dung |
| --- | --- |
| [`sweep-protocol.md`](sweep-protocol.md) | Quy trình ba lượt: chạy cổng → quét tay số sống trong câu văn → sinh lại fixture; kèm danh mục lỗi đã từng lọt qua cổng |

## Quy tắc của thư mục

1. **Số liệu di chuyển không được xuất hiện ở đây** — tổng test, số SVG, số key
   là số sống; chúng thuộc về badge và `sync-prose-counts` (xem
   [ADR 0004](../decisions/0004-prose-count-gate-trong-vitest.md)).
2. Mỗi bước của quy trình phải **nêu lệnh thật** — một bước không gõ được là một
   bước không ai làm.
3. Khi một lượt rà tìm ra một dạng lỗi mới, dạng đó được thêm vào danh mục của
   `sweep-protocol.md` cùng lượt — không để lại cho "lần sau".
