# `adaptive/repair/` — thang sửa khi một cửa sổ phá hợp đồng

`constraints.ts` nói *có hỏng không*. `diagnostics.ts` nói *vì sao trông như vậy*.
Không tệp nào nói **phải làm gì** khi câu trả lời là "hỏng".

Thư mục này là động từ còn thiếu: `repairProfile()` resolve một cửa sổ, kiểm hợp
đồng, và nếu sai thì đi xuống một **thang hữu hạn, có thứ tự** cho tới khi đúng.

## Thang

| Bậc | Nhường cái gì | Lever |
| --- | --- | --- |
| `as-planned` | không gì cả — profile ứng dụng đang vẽ | `{}` |
| `ignore-inset` | safe-area inset thôi chiếm chiều cao chrome | `ignoreInset` |
| `compact-hud` | HUD lấy 85% cỡ của nó trên bàn chơi | `+ hudScale: 0.85` |
| `single-column` | modal rộng xuống một cột thay vì cuộn ngang | `+ singleColumn` |
| `smaller-type` | chữ còn 94% kế hoạch, vẫn trên sàn 8px | `+ typeScale: 0.94` |
| `smallest-type` | chữ còn 88% — bậc cuối trước sàn | `+ typeScale: 0.88` |

Thứ tự là nguyên tắc, không phải pixel: **chữ là cuối cùng**, vì sàn 8px là một
lời hứa và chữ không đọc được thì không phải là bản sửa.

## Vì sao thang là *dữ liệu*

Một nhánh sửa viết bằng `if (bad) { … }` chỉ chạy tới bậc thứ ba khi tìm được một
cửa sổ hỏng ba bất biến cùng lúc — tức là gần như không bao giờ. Nay mỗi bậc là
`{ id, why, overrides }`, nên test có thể bắt đầu ở bất kỳ bậc nào bằng một
`AdaptiveOverrides` tường minh và khẳng định đúng bậc nó dừng.

## Vì sao có `validator`

Với hợp đồng thật, **không** cửa sổ nào trong 21 preset hay 578 cửa sổ của audit
hỏng — nên `as-planned` luôn thắng và các bậc sau không bao giờ chạy. Một đường dự
phòng không được chạy thử là đường dự phòng sẽ hỏng đúng ngày cần nó.

Nên `repairProfile()` nhận một `validator` (mặc định là `violations()`); test truyền
một hợp đồng **chặt hơn** và khẳng định thang dừng đúng bậc. Đây là seam thật, không
phải móc test: hàm là một fold thuần trên một hàm kiểm.

## Tệp

| Tệp | Nội dung |
| --- | --- |
| `repair.ts` | `REPAIR_LADDER` · `repairProfile()` · `repairForSize()` · `describeRepair()` · `repairRungIds()` · type `RepairResult`/`RepairInput`/`RepairValidator` |
| `index.ts` | barrel — `src/components/menu/adaptive/index.ts` re-export từ đây |
| `README.md` | tệp này |

## Không làm gì

- **Không sửa window.** Không zoom, không đổi device pixel ratio, không bịa số đo.
  Chỉ nhường thứ bố cục tự sở hữu.
- **Không trả `null`.** Ứng dụng phải vẽ một cái gì đó; nên luôn trả profile, kèm
  `ok` và `steps` để ai muốn log thì log.
- **Không thay `constraints.ts`.** Hợp đồng vẫn ở một nơi; thang chỉ là cách đi
  xuống cho tới khi chạm nó.
