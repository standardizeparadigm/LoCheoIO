# `src/game/adaptive/` — kế hoạch cho *bàn chơi*, không phải cho menu

Hai file, hai câu hỏi khác nhau, cùng một quy tắc: **tính hết trước khi vẽ**.

| File | Xuất | Trả lời |
| --- | --- | --- |
| `playfield.ts` | `planPlayfield()`, `playable()`, `describePlayfield()` | bàn chơi nằm ở đâu, item to bao nhiêu, lọ bán kính bao nhiêu, HUD được phép phóng tới đâu |
| `hud.ts` | `planHud()`, `traceHud()`, `describeHud()`, `HUD_DROP_ORDER`, `HUD_MIN_SCALE` | từng readout nằm ở hàng nào, có bị bỏ hay không, có chồng lên nhau không |

Cả hai là **hàm thuần**: đưa vào kích thước, trả về số. Không đọc DOM, không đọc
`window`, không vẽ. Nhờ vậy cùng một phép tính dùng được trong `engine.ts`, trong
`scripts/check-adaptive.ts` và trong test — ba nơi, một kết quả.

---

## 1. `planPlayfield()` — lớp cũ, giữ nguyên

Chuyển nguyên công thức khỏi `engine.resize()` ở vòng 8, không đổi một con số nào:

```
itemScale = clamp(min(w, h) / 640, 0.62, 1.3)
hudScale  = clamp(min(w / 900, h / 700), 0.72, 1.16)
radius    = clamp(min(w, h) * 0.045, 21, 34)
```

`playable()` là sàn: dưới `240×320` thì không có bố cục nào cứu được, và cả hai
hàm kia nói thẳng điều đó thay vì trả về số vô nghĩa.

## 2. `planHud()` — lớp mới ở vòng 9

HUD cũ là một chuỗi `fillText` với toạ độ cộng dồn. Nó đúng ở đúng một cửa sổ.
`planHud()` thay bằng bốn bước, theo thứ tự:

1. **Band.** Mỗi readout có một *băng* — hộp thật của glyph, không phải baseline:
   `y = baseline − 0.72 × size`, cao `0.97 × size`. Đây là chỗ bản nháp đầu tiên
   sai: đệm băng 1.25× làm `fill` và `clock` báo chồng lấn trên **mọi** bàn, vì
   hai băng phình ra chạm nhau trong khi glyph thì không.
2. **Cột trái/phải cố định.** Điểm, kỷ lục, độ bền, vết nứt bên trái; cấp, số
   lọ, tỉ lệ đầy bên phải; đồng hồ ở góc phải trên.
3. **Cột giữa chảy.** Combo → thanh combo → mult → chips, mỗi thứ tiếp tục từ
   `clockY` chứ không neo vào một offset tuyệt đối. Chips rộng
   `max(126, 142s)`, bước `24s`; combo glyph cao `clamp(18 + combo × 0.7, 18, 34)`
   nên số combo hai chữ số tự đẩy hàng xuống thay vì đè lên.
4. **Bậc thang bỏ dần.** Nếu vẫn không vừa: bỏ `chips → comboBar → jars → best`,
   dừng ngay khi vừa (nên thanh combo sống tới lúc buộc phải chết), rồi nén `s`
   từng bước `0.02` tới sàn `0.55`.

`hudScale` từ `planPlayfield()` là **trần**, không phải kết quả: `s` chỉ đi xuống.

### Số đo tham chiếu

| Cửa sổ | `s` | đáy HUD | bỏ gì |
| --- | --- | --- | --- |
| 1280×720 | 1.029 | 255px | không |
| 1920×1080 | 1.16 | 283px | không |
| 360×420 | 0.72 | 176px | chips |
| 320×320 | 0.68 | — | chips + thanh combo |

## 3. `traceHud()` — để không phải đoán

`planHud()` trả `HudPlan` đã chốt; `traceHud()` trả *đường đi*: đã thử những
trạng thái nào, trạng thái nào vừa, cái gì bị bỏ, và **những cặp băng chồng lấn
còn lại** (nếu có). Trên bàn nhỏ hơn `playable()` vẫn còn chồng lấn — điều đó
được *báo*, không bị giấu:

```
240×320 → collisions: stamina/fill, stamina/clock, fill/clock
```

Test `tests/hud-plan.test.ts` khẳng định đúng sự thật đó, thay vì khẳng định
rằng dưới sàn cũng hoàn hảo.

---

## Đọc tiếp

- [`../../components/menu/adaptive/README.md`](../../components/menu/adaptive/README.md) — lớp profile nuôi màu, chữ, panel và hộp thoại.
- [`../../../docs/design/adaptive-v2.md`](../../../docs/design/adaptive-v2.md) — hợp đồng đầy đủ, 21 preset và 12 bất biến.
