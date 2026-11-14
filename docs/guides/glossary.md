# Từ vựng trong game (cho người dịch & contributor)

| Tiếng Việt | Nghĩa | English | Ghi chú |
| --- | --- | --- | --- |
| Lọ Chéo | tên game — hũ dưa "chéo" | — | giữ nguyên mọi ngôn ngữ |
| Muối dưa | quy trình muối chua | pickling | — |
| Hứng | bắt đồ rơi | catch | core verb |
| Lắc hũ | SLAM — lắc mạnh hũ | jar slam | SLAM giữ nguyên như một term |
| Chém chéo | chém theo đường chéo | diagonal slash | cơ chế CHÉO |
| Đồ hư | mốc/ruồi/sâu — phải né | hazards | KHÔNG gọi là "enemy" |
| Vết nứt | crack | crack | Gốm Mỏng: 1 vết là vỡ |
| Hũ | jar | jar | đầy hũ = thắng vòng |
| Brine | nước muối chua | brine | màu `#b6e07a` |
| Nghệ/tumeric | màu nhấn vàng | turmeric-gold | `#f5a81c` |

## Thuật ngữ kỹ thuật xuất hiện trong tài liệu

Bảng trên là từ vựng **trong game**. Bảng dưới là từ vựng **của mã nguồn** — những
từ xuất hiện trong commit, review và tên file mà người mới phải tra.

| Thuật ngữ | Nghĩa trong dự án này |
| --- | --- |
| **plan** | `MenuPlan` — kết quả của `planMenuLayout(width, height)`. Năm cờ + bốn con số. Không phải state, không phải context: một hàm thuần, tính lại mỗi lần cửa sổ đổi |
| **scene** | chiều cao hero còn lại sau khi trừ `reserve`. `scene + reserve === viewport.height` là bất biến |
| **reserve** | chiều cao `MenuChrome` giữ chỗ ở đáy. Cùng một lần gọi plan sinh ra cả hai |
| **economy** | mức "kinh tế" của panel: `full` · `dense` · `tight` · `minimal`. Quyết định hàng cao bao nhiêu và khối nào còn hiện |
| **chrome** | khối `absolute inset-x-0 bottom-0` chứa hai panel + ticker |
| **deck** | dải ba cột dưới hero — **đã bị xoá** ở vòng 6. Nếu thấy trong commit cũ, đó là lịch sử |
| **stage** | dải `9 · 14 · 16` — **đã bị xoá** ở vòng 3, rồi bị bác lần nữa ở vòng 5. Cùng lý do |
| **wordmark** | `LỌ CHÉO` — hai dòng chữ ở giữa hero, và là tên module `menu/wordmark/` |
| **slam** | cú lắc hũ. Luôn viết hoa `SLAM` khi nói về phím, thường khi nói về cơ chế |
| **challenge** | thử thách trong ngày, suy ra từ ngày địa phương. Không lưu, không mạng |
| **tip** | luật chơi trong ngày; `tipIndexFor()` chọn bằng bước nhảy 5/6 |
| **tier** | tầng phát hành: `major` · `minor` · `patch`. **Suy ra** từ SemVer bằng `tierFor()`, không lưu |
| **bullets** | các dòng `itemsVi` / `itemsEn` của một changelog entry. Phải cùng độ dài |
| **barrel** | file `index.ts` chỉ re-export. App không import barrel nào — cố ý |
| **gate** | một trong 9 bước kiểm tra (`tsc`, `vitest`, `check:readme`, `check:i18n`, `check-assets`, `check-svg`, `smoke`, `probe`, `build`) |
| **probe** | `scripts/probe-menu-layout.tsx` — 33 cỡ cửa sổ, đọc DOM thật |
| **smoke** | `scripts/smoke-ssr.tsx` — render headless, chỉ trả lời "có ném lỗi không" |

## Ba từ dễ nhầm

**plan ≠ state.** `plan` được tính lại mỗi lần viewport đổi; nó không được lưu,
không được truyền qua context. Một `useState` cho plan sẽ khiến layout trễ một
frame so với cửa sổ.

**scene ≠ hero.** `scene` là *chiều cao*; hero là *phần tử* có chiều cao đó.

**chrome ≠ panel.** Chrome là dải chứa; panel là hai khối bên trong. Chrome có
`pointer-events-none`, panel có `pointer-events-auto` — nếu không, dải phủ toàn
chiều rộng sẽ nuốt mọi cú click ở một phần ba dưới màn hình.
