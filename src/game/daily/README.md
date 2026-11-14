# `game/daily/` — thử thách và luật của ngày

Hai hàm thuần của **ngày địa phương**. Không React, không DOM, không `Date.now()`
bên trong — ngày được truyền vào, nên test điều khiển được thời gian.

## Vì sao ở `game/`, không ở `components/`

Chúng từng nằm trong `components/menu/deck/`, cạnh băng ba cột hiển thị chúng.
Vòng 6 xoá băng đó — ba đoạn văn không vừa một band cao cố định — và *hiển thị*
đi mất không phải lý do để *logic* đi theo.

Chuyển sang `game/` cũng đúng theo quy ước: đây là dữ kiện trò chơi suy ra từ
ngày, không phải thành phần giao diện.

## `challenge.ts`

| Hàm | Vào | Ra |
| --- | --- | --- |
| `localDayNumber(date)` | `Date` | số ngày kể từ epoch, theo **giờ địa phương** |
| `mix(n)` | số | bộ trộn 32-bit |
| `challengeFor(date, modeIds)` | `Date` + danh mục chế độ | `{ mode, target, day }` |
| `isToday(challenge, now)` | challenge + `Date` | `boolean` |

Ba điều dễ sai, và cả ba được khoá bằng test:

1. **Ngày tính theo giờ địa phương.** Dùng mốc UTC thì thử thách đổi lúc
   **07:00 sáng ở Việt Nam**, và người chơi đọc thành *"đổi hai lần hôm nay"*.
   `localDayNumber()` dựng `new Date(y, m, d)` để một ca DST không làm rơi ngày.
2. **Không dùng `day % modes.length`.** Nó đi tuần tự qua danh sách: hôm nay
   classic, mai zen, mốt inferno — người chơi học được quy luật sau ba ngày.
3. **`modeIds` được truyền vào, không import.** Người gọi sở hữu danh mục, nên
   thêm chế độ thứ mười mở rộng vòng xoay mà không phải sửa test nào.

Mốc điểm: `1 200 → 3 600`, bước `100`. Một số tròn để nhắm tới, và đủ rộng để
mục tiêu hôm qua không phải hôm nay.

## `tip.ts`

`tipIndexFor(day)` chọn một trong `RULE_COUNT` (6) luật. Bước nhảy **5** trên
**6** ô — nguyên tố cùng nhau, nên cả sáu luật xuất hiện trước khi lặp.

Nếu tip xoay cùng nhịp với thử thách thì mỗi chế độ luôn đi với đúng một luật,
và người chơi chỉ học được một phần sáu trò chơi.

## Ai dùng

| Nơi | Dùng gì |
| --- | --- |
| `components/menu/panel/PanelChallenge.tsx` | `challengeFor()` → một dòng `mode · mốc` trong panel THÔNG TIN |
| `components/menu/HowToModal.tsx` | `tipIndexFor()` → đánh dấu luật nào của hôm nay trong sáu luật |

Cả hai đều là chỗ **có chỗ chứa nội dung**, không phải chỗ nhét vừa. Đó là
toàn bộ lý do deck biến mất: nó không phải chỗ chứa, nó là một band cao cố
định cố chứa ba đoạn văn.

## `index.ts`

Exports `challengeFor`, `localDayNumber`, `mix`, `tipIndexFor` and `RULE_COUNT`
— the whole public surface of this folder, in one place. `PanelChallenge` and
`HowToModal` import from here and not from the individual modules, so moving a
function between `challenge.ts` and `tip.ts` is a one-line change.
