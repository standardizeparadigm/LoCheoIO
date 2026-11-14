# `game/storage/` — ba loại bản ghi, ba module

Bảng điểm, tiến trình trọn đời, và thành tựu. Chúng chia sẻ **một tầng lưu trữ**
(`safeStorage.ts`) và không chia sẻ gì khác — đó là toàn bộ lý do thư mục này
tồn tại.

## Vì sao tách

`game/storage.ts` từng là một file 191 dòng chứa cả ba. Chúng chỉ ở chung vì
cùng đọc `localStorage`, và hệ quả là ba bộ bất biến khác nhau nằm trong một
module không có chỗ để viết ra:

| Loại | Bất biến | Nếu vi phạm |
| --- | --- | --- |
| bảng điểm | tối đa **8** hàng, sắp giảm dần | hàng thứ chín hiển thị, hoặc bảng mất thứ tự |
| tiến trình | mọi trường **cộng dồn**, trừ `bestScore` là **max** | điểm cao nhất bị cộng thay vì so |
| thành tựu | **merge**, không bao giờ replace | mở thành tựu mới → mất sạch thành tựu cũ |

Ba dòng đó giờ nằm cạnh nhau trong một file README, thay vì rải trong 191 dòng
mã.

## Các file

| File | Nội dung |
| --- | --- |
| `guard.ts` | `num()` và `saneDate()` — hai bộ chặn mà **mọi** trường đi qua |
| `scores.ts` | `normalizeScores` · `loadScores` · `persistScores` · `submitScore` · `bestScore` · `qualifies` · `rankOf` |
| `progress.ts` | `Progress` · `EMPTY_PROGRESS` · `normalizeProgress` · `loadProgress` · `saveProgress` · `recordRun` |
| `achievements.ts` | `loadAchievements` · `unlockAchievements` |
| `index.ts` | barrel + `clearAllProgress()` |

### Vì sao `guard.ts` đứng riêng

Hai hàm này khác nhau ở đúng một điểm, và đó là điểm đã từng gây lỗi:

```ts
num(v)       // từ chối NaN và ±Infinity. Chấp nhận MỌI số hữu hạn.
saneDate(v)  // từ chối cả số hữu hạn mà Date không render được.
```

Một timestamp **không phải** "một số hữu hạn bất kỳ". `1e308` là hữu hạn và cho
ra «Invalid Date»; `-1e15` là hữu hạn và cho ra năm âm ba mươi mốt triệu. Cả hai
đều với tới được từ một save sửa tay. Dùng `num()` cho ngày là lỗi mà module này
sinh ra để chặn, nên hai hàm phải nằm cạnh nhau để đọc được sự khác biệt trong
một lần nhìn.

`tests/storage-normalise.test.ts` và `tests/storage-migrate.test.ts` phủ cả hai.

### Vì sao `clearAllProgress()` ở `index.ts`

Nó phải xoá **đúng ba** key. Đặt trong `scores.ts` thì file đó phải import hai
module còn lại chỉ để biết tên key của chúng. Barrel là chỗ duy nhất mà một thao
tác **xuyên** cả ba là tự nhiên.

Ba key, không phải "mọi key": cài đặt, ngôn ngữ và ván dở không phải tiến trình.
Người chơi xoá điểm không nên mất luôn mức âm lượng. `clearAllGameKeys()` trong
`safeStorage.ts` là búa nặng hơn, dùng cho nút khôi phục cài đặt.

## `storage.ts` vẫn tồn tại

`src/game/storage.ts` giờ chỉ là re-export:

```ts
export { … } from "./storage/index";
```

Bốn mươi module import từ `../game/storage`, và một re-export giữ tất cả chúng
chạy được, giữ `git blame` có ích trên phần mã đã chuyển, và cho phép việc tách
vào **một** commit thay vì một commit cho mỗi call site. Hai đường vào
(`../game/storage` và `../game/storage/`) cho cùng một tập export — có test khoá
điều đó (`tests/storage-split.test.ts`).

## Đọc thêm

- `docs/guides/storage-keys.md` — tám key, ai ghi, xoá khi nào.
- `docs/design/save-format.md` — schema của `locheo.run.v1`.
- `src/game/safeStorage.ts` — cửa duy nhất ra `localStorage`.
