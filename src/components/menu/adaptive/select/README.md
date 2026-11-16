# `adaptive/select/` — so sánh, không phải chấp nhận cái đầu tiên

`repair/` trả lời *có đúng hợp đồng không* và dừng ở bậc đầu tiên đúng. Với một
lần sửa thì đó là quy tắc đúng — thang đã xếp theo thứ tự mất mát, nên bậc đầu
tiên đúng **là** bậc rẻ nhất. Nhưng "đúng đầu tiên" không phải là một phép so
sánh, và nó để lại hai câu hỏi mà dự án này vẫn phải hỏi bằng tay:

    profile đang ship có thật là tốt nhất trong sáu bậc?
    khi hai bậc cùng đúng, bậc nào nhường ít hơn?

Thư mục này trả lời cả hai, một lần, trên toàn thang: resolve từng bậc, cho điểm
từng bậc, sắp xếp. Kết quả là một `Selection` — người thắng, mọi ứng viên nó đã
thắng, và **vì sao từng cái thua**.

## Điểm, và thứ tự của nó

Không dùng tổng có trọng số: tổng có trọng số sẽ cho 40px trống "mua lại" một
cái mascot đã mất, nếu các trọng số tình cờ cộng ra như vậy. Bảy hạng tử được so
**từ điển**, theo đúng thứ tự khai báo, và mỗi hạng tử là một thứ người chơi nhìn
thấy:

| # | Hạng tử | Nghĩa | Đo từ |
| --- | --- | --- | --- |
| 1 | `violations` | phá hợp đồng thì không phải ứng viên | `violations()` (hoặc validator truyền vào) |
| 2 | `hidden` | hero mất mascot, deck, tagline | `plan.minimal` **so với base** |
| 3 | `cropped` | thiếu bao nhiêu px so với sàn của chính nó | `scene + reserve − height`, **so với base** |
| 4 | `hudLost` | HUD mất bao nhiêu phần trăm cỡ | `playfield.hudScale` |
| 5 | `typeDrop` | mất bao nhiêu px chữ, cộng toàn thang | `type.*` |
| 6 | `levers` | đã kéo bao nhiêu lever | so profile, không so override |
| 7 | `slack` | phòng thừa theo chiều dọc | `scene − heroContentHeight()` |

Hai điều đáng nói:

**`hidden` và `cropped` đo so với base.** Cửa sổ 320×320 *vốn* chỉ có wordmark và
*vốn* bị crop — đó là cửa sổ, không phải mất mát. Chấm theo cờ thô sẽ báo "hidden 1"
cho chính profile ứng dụng đang vẽ, và một cái giá thật ra là thuộc tính của cửa sổ
làm mọi so sánh ở góc chật nhất của không gian thành vô nghĩa — đúng chỗ chúng quan
trọng nhất.

**`levers` đếm từ profile.** Một override không làm gì (inset trên cửa sổ không có
inset) không thay đổi kế hoạch, nên nó không được tính là đã kéo. Đếm override sẽ
phạt oan — và tệ hơn, sẽ làm hai ứng viên *giống hệt nhau* có điểm khác nhau.

`slack` đứng cuối vì nó là hạng tử duy nhất **không phải mất mát**: band 518px với
hero 300px là *thoáng*, không phải sai — đó là việc của density `spacious`. Nó chỉ
phá hoà.

## Điều mà thư mục này mua được

`selectBest()` **phải** trả bậc 0, `as-planned`, trên cả 578 cửa sổ của audit —
nếu không thì ứng dụng đang ship một bố cục mà nó có bản thay thế rẻ hơn.

Đó là câu về **sản phẩm**, không phải về module. Vòng 12 chỉ nói được "không bất
biến nào hỏng"; vòng này nói được "không có bản rẻ hơn", mệnh đề mạnh hơn.
`tests/adaptive-select.test.ts` quét 21 preset + 270 cửa sổ để khẳng định, và
`scripts/gen-selection-fixtures.ts` ghi lại quyết định của 12 cửa sổ vào
`tests/fixtures/selection/` để một vòng sau nhìn diff mà thấy **quyết định** đổi,
chứ không chỉ thấy một con số đổi.

## Hoà, và vì sao phải nói ra

`ignore-inset` trên cửa sổ không có inset cho ra điểm **giống hệt** `as-planned`.
Thứ tự chốt là vị trí trong thang, không phải thứ tự `Array.prototype.sort` nhìn
thấy — sort ổn định là thuộc tính của engine, còn quyết định này không được phép
phụ thuộc vào engine. `describeSelection()` in `tied, earlier rung` thay vì bịa ra
một khoảng cách không tồn tại.

## Tệp

| Tệp | Nội dung |
| --- | --- |
| `score.ts` | `SCORE_ORDER` · `scoreProfile()` · `compareScores()` · `typeDropOf()` · `slackOf()` · `countLevers()` · `isFiniteProfile()` · `describeScore()` |
| `select.ts` | `candidatesFor()` · `selectBest()` · `shippedIsBest()` · `describeSelection()` · `selectionRungIds()` · `bestOn()` · type `Selection`/`Candidate`/`Loser` |
| `index.ts` | barrel — `src/components/menu/adaptive/index.ts` re-export từ đây |
| `README.md` | tệp này |

## Không làm gì

- **Không tìm kiếm rộng hơn thang.** 2⁴ tổ hợp lever là 16, và tìm kiếm tổ hợp sẽ
  là nhiều mã hơn cho một quyết định mà thang đã xếp đúng. Tên thật của thư mục này
  là "phép so sánh trên thang sửa", không phải "planner". Muốn rộng hơn thì cần một
  lý do trước — và audit là chỗ lý do đó sẽ hiện ra.
- **Không đổi profile ứng dụng.** Nó chọn `as-planned` ở mọi cửa sổ, tức là chọn
  đúng cái đang vẽ. Đây là bản kiểm tra, không phải bản viết lại bố cục.
- **Không thay `repair/`.** `repairProfile()` vẫn là cái dùng khi cần *một* profile
  sửa được; `select/` là cái dùng khi cần *biết* bậc nào rẻ nhất.
