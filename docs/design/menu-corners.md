# Thiết kế: Menu góc GAME / INFO (v1.1.5)

## Mục tiêu

Menu chính pre-1.1.5 gánh toàn bộ tương tác (CTA, mode cards, scoreboard, achievements, language, how-to) — quá tải thị giác và phá luật phân cấp. v1.1.5 gom lại theo hai trục:

- **GAME (góc dưới-trái)** — mọi thứ dẫn tới việc *chơi*: Chơi · Chơi tiếp · Chế độ · Bảng xếp hạng · Thành tựu · Cài đặt.
- **INFO (góc dưới-phải)** — mọi thứ dẫn tới việc *biết về dự án*: About · Changelog · Quit.

## Nguyên tắc

1. **Hai cụm, không hơn** — không cột thứ ba; hero chỉ còn chữ + mascot.
2. **Hành động chính luôn nhìn thấy** — CHƠI là nút primary vàng; CHƠI TIẾP bật/tắt theo `locheo.run.v1` (không bao giờ bấm rồi mới báo lỗi).
3. **Mọi thứ khác là modal** — đóng bằng `Escape`, bấm backdrop, hoặc nút ✕; nội dung modal tái sử dụng component sẵn có (`ScoreBoard`, `AchievementsPanel`, `ModeSelector`) để không nhân bản logic.
4. **Không phá muscle memory** — `Enter` vẫn bắt đầu; `P/R/M` không còn rò rỉ khi modal mở.
5. **A11y** — panel là `<section aria-label>`, modal là `role="dialog" aria-modal`, switch là `role="switch"`; `prefers-reduced-motion` tắt sạch animation.

## Vị trí & responsive

> **CẬP NHẬT v1.1.8 — đoạn dưới đây đã SAI và được sửa.** Bản trước viết "2 panel nằm
> trong flow (`flex items-end justify-between`) phía trên ticker, dưới hero". Đó là
> thiết kế v1.1.5, và chính nó là lỗi: hai panel là *flex sibling* `shrink-0` của hero,
> nên chúng lấy chiều cao trước và hero bị ép còn 250px trong cửa sổ 720px — chữ `LỌ`
> bị cắt ở đỉnh. Xem `docs/releases/v1.1.8.md` §1.

- **Chrome là `absolute inset-x-0 bottom-0`**, không nằm trong flow của hero. Hero giữ
  chỗ bằng `padding-bottom: reserve`, và `reserve` do **cùng** `planMenuLayout()` tính —
  nên hai con số không thể lệch (`scene + reserve === viewport.height`).
- Band chrome có `pointer-events-none`, mỗi panel có `pointer-events-auto` — nếu không,
  dải phủ toàn chiều rộng sẽ nuốt mọi cú click ở một phần ba dưới màn hình.
- Desktop: hai panel neo hai góc, cách nhau tuyệt đối, cùng chiều cao `CORNER_MAX_ROWS`
  để khung thẳng hàng.
- Mobile (<lg): mascot ẩn, panel `w-44`/`w-48`, hint thu nhỏ.
- Modal luôn `max-h-[86vh]` + scroll nội bộ.

## Chiều cao panel là hằng số, không phải kết quả

Cả hai panel cao bằng `CORNER_MAX_ROWS` hàng — **kể cả khi nội dung ngắn hơn**. Đó là
lý do khung của GAME và INFO thẳng hàng được, và cũng là lý do phát sinh lỗi "nửa dưới
panel THÔNG TIN trống" của v1.1.8.

GAME có 7 hàng, INFO có 4 hàng cộng hai khối (thử thách + tóm tắt). Khung bảy
hàng rich là **458px**; bốn hàng là **278px**, ba hàng là **218px**. Khoảng trống
lớn nhất — khi INFO chỉ có ba hàng — là **240px**, và đó là con số §12 của
`docs/releases/v1.1.8.md` mô tả. (Tài liệu này từng ghi ~126px, tức là chênh lệch
của một hàng, không phải của cả khung.)
Cách xử lý:

| Kinh tế | `justify-content` của body | Vì sao |
| --- | --- | --- |
| GAME (mọi lúc) | `flex-start` | 7 hàng lấp đầy, không có khoảng dư |
| INFO, đầy đủ | `space-between` | chia đều khoảng dư **giữa** sáu khối thay vì dồn một chỗ |
| INFO, `tight` | `flex-start` | không có khoảng dư để chia |

`.panel-footer` **không** còn `margin-top: auto`: với `space-between` nó sẽ đẩy footer
ra xa khối trên **lần thứ hai**, tạo lại đúng cái lỗ vừa sửa nhưng nhỏ hơn và ở đáy.

`tests/panel-slack.test.ts` khoá cả bốn dòng trong bảng trên.

## Cùng luật đó áp cho khối cuối body

`PanelSummary.tsx` là con cuối của body INFO (footer là slot riêng, render sau).
Nó mang `mt-auto` từ vòng 5 — hồi đó body còn `flex-start` nên cần ai đó đẩy nó
xuống. Khi body chuyển sang `space-between`, auto margin đó xin **lát thứ hai**
của cùng khoảng dư: khối tóm tắt dính đáy và mở ra một khe mới phía trên nó.
Chính là lỗ của báo cáo v1.1.8, tái hiện thấp hơn 60px.

Không test badge nào bắt được (class vẫn biên dịch), không ảnh 720px nào thấy
(khe chỉ ~2px). Nó chỉ mở ra ở cửa sổ cao — nên có test riêng.

**Luật tổng quát:** trong body `space-between`, **không** con nào được mang
`margin-top: auto`. Khoảng dư chia đều giữa các khối; một auto margin sẽ lấy
thêm lần nữa.

## Trạng thái «Chơi tiếp»

| Điều kiện | Nút | Hint |
| --- | --- | --- |
| Không có snapshot | `disabled`, mờ, saturation 0 | "Chưa có ván nào đang dở" |
| Có snapshot | bật, brine-500 | `{chế độ} · {điểm} điểm · {n} hũ` |
| Sau khi resume/game over | `disabled` (snapshot đã xóa) | quay lại trạng thái không snapshot |

## Cập nhật v1.1.6 — Settings lớn dần

Panel góc **không đổi** (vẫn GAME/INFO, vẫn 6 + 3 mục) nhưng nội dung sau mục «Cài đặt» thì đổi hẳn:
Settings từ 4 toggle phẳng thành **6 section** (preset · âm thanh · giao diện · ngôn ngữ · sao lưu · dữ liệu)
với 3 loại control (switch / segmented / stepper). Quyết định v1.1.5 — *modal chứ không phải màn riêng* —
vẫn giữ: modal rộng `max-w-2xl`, body scroll riêng, `useFocusTrap` giữ Tab bên trong.

Ngôn ngữ rời khỏi menu (xoá `LanguageSwitcher` góc trên-phải) và trở thành section 4 của Settings —
một chỗ duy nhất cho mọi cấu hình, đúng tinh thần "hai cụm, không hơn".

## Không làm (non-goals)

- Không tách «Cài đặt» thành màn riêng — modal rộng + scroll là đủ cho 6 section (quyết định giữ nguyên từ v1.1.5).
- Không auto-đóng tab khi bấm THOÁT (trình duyệt chặn) — chỉ best-effort + hướng dẫn.
- Không đổi ngữ nghĩa thắng/thua, không đổi balance mode.
