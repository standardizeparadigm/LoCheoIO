# 🫙 Trình chạy Lọ Chéo — không cần gõ lệnh

Chỉ cần **nhấn đúp** file tương ứng với hệ điều hành của bạn — menu màu **nhiều màu, có hoạt ảnh** sẽ hiện ra; bạn **chọn số** rồi nhấn <kbd>Enter</kbd>. Không cần mở Terminal và gõ tay bất kỳ lệnh nào.

| Hệ điều hành | File | Cách mở |
| --- | --- | --- |
| 🍎 **macOS** | [`play-mac.command`](play-mac.command) | Nhấn đúp trong Finder (tự mở Terminal) |
| 🪟 **Windows** | [`play-windows.bat`](play-windows.bat) | Nhấn đúp trong File Explorer (chạy bằng cmd) |
| 🐧 **Linux** | [`play-linux.sh`](play-linux.sh) | Nhấn đúp (chọn *Run* / *Execute*) hoặc `./play-linux.sh` |

> **Linux:** nếu nhấn đúp chỉ mở file bằng trình soạn thảo, hãy cấp quyền chạy một lần:
> ```bash
> chmod +x scripts/play-linux.sh
> ```
> sau đó thử lại, hoặc chạy `bash scripts/play-linux.sh`.

## 🌐 Đa ngôn ngữ — đổi ngay trong menu bằng phím `L`

| Ngôn ngữ | Ghi chú |
| --- | --- |
| 🇻🇳 **Tiếng Việt (gốc, có dấu đầy đủ)** | Mặc định — root language |
| 🇬🇧 **English** | Available instantly |
| 🇨🇳 **中文** | 按 `L` 键切换 |
| 🇯🇵 **日本語** | `L` キーで切り替え |
| 🇰🇷 **한국어** | `L` 키로 전환 |
| 🇪🇸 **Español** | Pulsa `L` para cambiar |
| 🇫🇷 **Français** | Appuyez sur `L` pour changer |

- Thứ tự chuyển: **VI → EN → 中文 → 日本語 → 한국어 → Español → Français → VI**…
- Tự nhận theo locale của máy (`$LANG` / Windows UI) nếu có; mặc định luôn là **Tiếng Việt**.
- Ép ngôn ngữ bằng biến môi trường: `LOCHEO_LANG=vi` / `en` / `zh` / `ja` / `ko` / `es` / `fr` (ví dụ `LOCHEO_LANG=fr ./scripts/play-linux.sh`).

## ✨ Hoạt ảnh & hiệu ứng

- **Banner nhấp nháy** 3 khung màu (vàng → vàng sáng → hồng) khi vào menu — Terminal thật sẽ thấy khung đổi màu mượt.
- **Spin-loader braille** (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏) kèm **% tiến trình thật** khi build production (chạy nền, không treo terminal).
- **Sparkle line** `✦ ·˚ ·✦…` trang trí menu; khung viền vàng double-line.
- Mọi thông báo đều có emoji/biểu tượng (▶ 🛠 📦 🧪 ✅ 📥 🧹 ℹ️ 🚪) và màu sắc riêng theo trạng thái (vàng=hành động, xanh lá=thành công, đỏ=lỗi, cyan=thông tin).

## Yêu cầu

- **Node.js LTS ≥ 20.19** và **npm** ([nodejs.org](https://nodejs.org), `brew install node`, `winget install OpenJS.NodeJS.LTS`, hoặc `sudo apt-get install nodejs npm`).
- Lần chạy đầu file sẽ tự lo phần còn lại.

## Menu có gì

| Mục | Lệnh nền | Tác dụng |
| --- | --- | --- |
| **1) Chơi ngay (Production)** | `npm run build` → mở `dist/index.html` | Build bản tự chứa rồi mở game bằng trình duyệt mặc định |
| **2) Dev mode** | `npm run dev` | Server HMR tại <http://localhost:5173>; <kbd>Ctrl</kbd>+<kbd>C</kbd> để dừng |
| **3) Build production** | `npm run build` | Tạo đúng 1 file `dist/index.html` (single-file) |
| **4) Chạy tests** | `npm run test` | vitest — **1618 tests / 149 file** |
| **5) Kiểm tra toàn bộ** | `npm run check` | typecheck + tests + build — cổng chất lượng |
| **6) Cài đặt dependencies** | `npm install` | Cài/cập nhật `node_modules` |
| **7) Dọn dẹp** | xoá `node_modules/` và `dist/` | Yêu cầu gõ `YES` để xác nhận; không đụng mã nguồn |
| **8) Thông tin & hướng dẫn** | — | Phiên bản v1.1.8, tác giả, nơi lưu dữ liệu |
| **0) Thoát** | — | Đóng trình chạy |
| **L) Đổi ngôn ngữ** | — | VI ⇄ EN ⇄ 中文 ⇄ 日本語 ⇄ 한국어 ⇄ ES ⇄ FR (hint hiển thị ngay cạnh mục 0) |

Các mục **1, 2, 3, 4, 5** tự kiểm tra Node.js và tự chạy `npm install` nếu `node_modules/` chưa tồn tại — bạn không bao giờ phải lo thứ tự bước.

## Ghi chú nền tảng

- **macOS / Linux:** menu dùng mã màu ANSI + clear-screen; terminal nào cũng hiển thị ổn. File `.command` nhờ Finder tự gán vào Terminal.
- **Windows:** menu dùng `chcp 65001` (UTF-8) nên **tiếng Việt có dấu hiển thị đầy đủ**, ANSI colors bật sẵn trên Windows 10/11 (Terminal & cmd). Trên console đời cũ không hiện màu, menu vẫn chạy bình thường.
- Cả 3 file đều tự `cd` về **gốc repo** dù được mở từ đâu, kiểm tra `node`/`npm` và báo lỗi thân thiện (VI/EN/中文/日本語/한국어/ES/FR) nếu thiếu.
- Nội dung hiển thị gốc là **Tiếng Việt có dấu**; sáu bản dịch còn lại (EN/ZH/JA/KO/ES/FR) tương đương 100% về mặt chức năng.

---

# Repo utilities (không thuộc launcher)

## `smoke-ssr.tsx`

Headless render smoke test cho toàn bộ menu/modal tree. Render tĩnh bằng `react-dom/server` — bắt các lỗi render mà `tsc --noEmit` không thấy (hook order, context thiếu, i18n lookup hỏng, component undefined).

```bash
npx vite-node scripts/smoke-ssr.tsx
# → in "ok <Component> …" cho từng phần, kết thúc bằng "SMOKE OK"
```

Mọi render error đều làm exit code khác 0.

## `check-assets.mjs`

Kiểm tra tài nguyên SVG 2 chiều:

1. Mọi `assets/<name>.svg` được nhắc trong README/index.html/docs đều tồn tại trên đĩa.
2. Mọi SVG trong `assets/` đều được nhắc ở đâu đó (không orphan).

```bash
node scripts/check-assets.mjs
# → ✓ N SVGs all referenced
```

## `check-readme-sync.mjs`

Bảo vệ 10 README bản địa khỏi lệch version/nội dung:

1. badge version phải khớp `APP_VERSION` trong `src/version.ts` (**không ghi cứng** — v1.1.7 sửa lỗi 1.1.6 bị bake vào script)
2. link `docs/releases/v<phiên bản>.md`
3. hàng `| [v<phiên bản>](…)` phải tồn tại và **có chip tầng** (🩷 MAJOR · 🟡 UPDATE · 🟣 PATCH)
4. nhúng `assets/corner-menu.svg` (panel góc v1.1.5) + `assets/settings-sections.svg` (tour 6 mục v1.1.6)
5. nhúng ba SVG của v1.1.7: `palette-ribbon.svg` · `architecture.svg` · `release-tiers.svg`
   (v1.1.8 không thêm điều kiện mới — hai sơ đồ `layout-fix.svg` / `test-matrix.svg` được `check-assets` phủ)
6. hàng lịch sử `v1.1.5` giữ nguyên claim 113 tests, `v1.1.4` giữ 61 tests
7. hàng `v1.0.0` phải gắn 🩷 **MAJOR**
8. không còn badge phiên bản cũ (`version-1.1.6-f5a81c` / `version-1.1.5-f5a81c` / …)

```bash
node scripts/check-readme-sync.mjs
# → ✓/✗ từng file + tổng hợp lỗi (chạy trong CI)
```

## `check-i18n.mjs`

Bản CI (không cần build) của bộ test parity i18n — đọc thẳng file locale dạng text nên chạy trong ~40 ms, không import TypeScript:

1. **đủ key**: 6 bản dịch phải có đúng bộ key của `vi` (327 key), không thiếu không thừa
2. **placeholder**: `{n}`, `{jars}`… phải khớp từng key với bản gốc
3. **không rỗng**: value `""` bị chặn
4. **không trùng key**: hai dòng cùng key trong một file bị chặn

```bash
npm run check:i18n
# → ✓ vi/en/zh/ja/ko/es/fr — 327 key · "All 7 locales in parity."
```

## `sync-test-badge.mjs`

Giữ badge `tests-<số test>%20%C2%B7%20<số file>%20files` trong cả 10 README khớp
với suite thật.

```bash
node scripts/sync-test-badge.mjs            # sửa badge
node scripts/sync-test-badge.mjs --verify   # chỉ báo, exit 1 nếu lệch (CI)
npm run sync:badge
```

**Số lấy từ đâu:** từ chính vitest (`--reporter=json` → `numTotalTests`), không
phải từ `grep`. Đếm tĩnh `it(` trong mã nguồn báo **587** cho một suite **675
test**: `it.each(BẢNG)` là một lời gọi và mười một test, và có bốn chỗ như vậy.

**Vì sao chịu được exit code khác 0:** lượt chạy có cả `docs-numbers.test.ts`,
và nó **fail chính vì badge cũ** — đúng thứ script này sinh ra để sửa. Đọc báo
cáo bất kể exit code là cách phá vòng luẩn quẩn.

## `sync-prose-counts.mjs`

Cùng ý tưởng với `sync-test-badge.mjs`, nhưng cho **câu văn** thay vì badge.

```bash
node scripts/sync-prose-counts.mjs            # viết lại
node scripts/sync-prose-counts.mjs --verify   # chỉ báo, exit 1 nếu lệch
```

**Vì sao cần script thứ hai.** Badge là widget sinh tự động, một regex lo cả
mười README. Câu văn thì không: tám ngôn ngữ nói cùng một sự thật theo tám cách
— «520 tests / 51 files», «520 Tests in 51 Dateien», «520 test trên 48 file»,
«520 testes em 51 ficheiros», «520 Unit-Tests», «typecheck + 520 tests + build»,
«501 เทสต์ใน 48 ไฟล์» — và **mọi** cách đều đã lệch hàng trăm so với badge.
(Đặt trong «» vì đây là **trích dẫn** những con số cũ, không phải số hôm nay.)
Badge cũ thì người đọc hiểu là số sinh tự động; câu văn cũ thì bị đọc như sự
thật.

**Bài học đắt.** Bản đầu viết lại bằng template chứa `$&` — trong replacement
không phải regex thì `$&` là **ký tự thường**, nên không sửa gì. Bản "sửa" sau
đó dùng backreference trong template và tạo ra `82 Dateien · 882 51 Dateien ·
520 Tests`: hỏng dữ liệu, trong sáu file, mà suite không bắt được vì **không có
test nào đọc số trong câu văn**. Vì thế script này:

1. **mỗi thay thế là một hàm của match đầy đủ** — không `$1`, không `$&`,
   không gì phải escape;
2. **tự kiểm tra đầu ra**: sau khi viết lại, dòng nào còn ghép số cũ với số file
   cũ trong ngữ cảnh câu văn sẽ bị báo và script exit 1, thay vì lặng lẽ để lại
   số sai trong tám ngôn ngữ.

Dòng lịch sử (`v1.1.0`…`v1.1.7`, ngày phát hành) được **miễn trừ** qua
`HISTORICAL` — bảng phát hành ghi lại con số của thời điểm đó, không phải hôm nay.

## `check-svg.mjs`

Validator cho 33 file SVG trong `assets/`. Không có trình render SVG trong CI,
nên nó kiểm đúng những cách một SVG **hỏng trên trình duyệt mà vẫn hợp lệ XML**:

1. `url(#id)` trỏ tới `id` không tồn tại — gradient biến mất, hình phẳng.
2. `width` / `height` cố định trên thẻ `<svg>` gốc — không co giãn theo khung.
3. Gradient tự tham chiếu chính nó — vòng lặp, trình duyệt bỏ qua.
4. `<script>` hoặc thuộc tính `on*=` — không được có trong tài nguyên tĩnh.
5. `<animate>` thiếu `attributeName` — hợp lệ, nhưng không animate gì cả.

Nó cũng áp **sàn chất lượng**: mỗi file phải có ít nhất một gradient, một
animation SMIL và một filter.

```bash
node scripts/check-svg.mjs
# → ASSETS OK — 33 SVG, all references resolve, all animated.
```

> **Vì sao có sàn:** trước vòng 6, 12/20 file có gradient và animation nhưng
> **không một filter nào** — highlight là màu phẳng giả vờ phát sáng. Sàn này
> là thứ khiến lần vẽ lại sau đó có kết quả.

## `probe-menu-layout.tsx`

Render menu ở 33 cỡ cửa sổ và đọc **DOM thật** để kiểm những gì `planMenuLayout()`
hứa: không tràn, không cuộn, panel cao đúng, hero còn chỗ cho wordmark.

```bash
npx vite-node scripts/probe-menu-layout.tsx
# → 33/33 DOM checks passed
```

Khác `smoke-ssr.tsx`: smoke chỉ trả lời "render có ném lỗi không"; probe trả lời
"bố cục có đúng ở cỡ này không". Nó là cổng duy nhất bắt được lỗi hình học, vì
`tsc` không thấy số và test đọc-source không thấy DOM.

## `check-svg.mjs` — qua `npm run check:svg`

Cùng script ở trên, nay có alias npm và nằm trong chuỗi `npm run check`. Trước
vòng 8 nó chỉ chạy khi có người nhớ gõ; nay nó là một mắt xích của cổng.

## `check-adaptive.ts`

Cổng của hệ adaptive: in bảng **21 viewport** (bề ngang, bề cao, tier, density,
scene, reserve, lockup, cỡ chữ, chế độ fit, hero, thiết bị) rồi khẳng định sáu
bất biến trên từng dòng — `scene + reserve === usableHeight`, lockup vừa band,
`CHÉO < LỌ`, panel + lề ≤ reserve, hộp thoại vừa cửa sổ, jar ≤ cạnh ngắn.

```bash
npm run check:adaptive
# → bảng 21 dòng … ADAPTIVE OK — 21 viewports
```

Khác `probe-menu-layout.tsx` (đọc DOM thật): script này chỉ tính số, nên chạy
được trong CI không cần trình duyệt và không cần `jsdom`. Hai cổng bổ sung nhau —
một cái bắt số sai, một cái bắt số đúng nhưng DOM vẽ khác.

## `audit-modes.ts`

Kiểm toán **chín bản ghi chế độ** với phần còn lại của engine: badge trên thẻ có
nói đúng con số bên cạnh nó không («×1.25 · 60S»), mọi multiplier có hữu hạn và
nằm trong khoảng chơi được không, `hazardMult: 0` có thật sự làm bảng spawn về 0
không (lời hứa của «THẢNH THƠI» là thuộc tính của `itemWeight()`, không phải của
con số), mỗi chế độ có ít nhất ba loại nguyên liệu hứng được ở cấp 1 không, accent
có trùng không.

```bash
npm run check:modes        # exit 1 nếu có phát hiện nào
npm run check:modes -- -v  # in thêm bảng 9 chế độ + bảng trọng số spawn
```

Đây là cổng đã bắt được **lỗi ngân sách vết nứt**: HUD vẽ 3 vỏ nứt cho mọi chế độ,
kể cả «GỐM MỎNG» — chế độ vỡ ngay từ vết đầu tiên. `maxCracksFor()` trong
`game/modeMath.ts` giờ là câu trả lời duy nhất.

## `audit-adaptive.ts`

Kiểm toán **toàn bộ** không gian cửa sổ: 21 preset + lưới 25 × 23 quanh từng
breakpoint, khử trùng lặp → **578** cửa sổ, mỗi cửa sổ resolve một lần rồi gộp
thành một `AuditReport` (vi phạm, thương lượng, bốn histogram, hai đầu không gian,
và từng mẫu).

```bash
npm run audit:adaptive              # bảng tóm tắt có bar
npm run audit:adaptive -- --json    # toàn bộ report
npm run audit:adaptive -- --write   # ghi docs/adaptive-audit.md
npm run audit:adaptive -- --check   # exit 1 nếu tệp lệch
```

`--check` nằm trong `npm run check`, nên báo cáo không thể cũ đi mà không ai biết:
đổi một breakpoint hay một sàn chữ là đổi `docs/adaptive-audit.md` trong **cùng**
commit. Khác `check-adaptive.ts` (21 preset, dạng bảng cho người đọc) — cái này
quét cả không gian và trả lời "bao nhiêu lần".

## `audit-drag.ts`

Kiểm toán **đường đi**, không chỉ điểm: bảng 578 cửa sổ ở trên đúng ở *mọi* thời
điểm, nên nó không thể thấy hiện tượng mà dải 2px sinh ra để dập — menu dựng lại
mỗi lần nhéch chuột. Script này phát lại cử chỉ:

```bash
npm run audit:drag                  # tổng số + những drag cắt nhiều ranh giới nhất
npm run audit:drag -- --json        # toàn bộ DragReport
npm run audit:drag -- --write       # ghi docs/adaptive-drag.md
npm run audit:drag -- --check       # exit 1 nếu tệp lệch
```

Mỗi preset bị kéo **±120px** theo từng pixel (21 × 241 = **4 600** cửa sổ) ở đúng
chiều cao của nó, và mỗi bước được chạy hai lần: `resolveAdaptive()` trả gì (**raw**)
và qua `stabilize()` (**held**). Số lần **bậc nhìn thấy** đổi là thứ được đếm.

| Cử chỉ | raw | held |
| --- | --- | --- |
| sweep — kéo một chiều | 12 | 11 |
| shake — con trỏ rung 1px tại mỗi ranh giới | 48 | **0** |

Con số thứ nhất là con số thật thà: kéo một chiều qua mỗi ranh giới đúng một lần,
nên hàm bậc thang cũng đổi đúng một lần. Con số thứ hai là thứ dải 2px mua. Báo cáo
in **cả hai** cột vì một cột sẽ để nó kể một trong hai câu chuyện.

Nó cũng ghim ba bất biến của đường kéo — **an toàn** (profile được vẽ vẫn hợp lệ),
**sống** (không lần giữ nào dài quá `margin + 1` khung), **biên** (`worstLag` = 2px) —
và `tests/adaptive-drag.test.ts` là bản kiểm trong suite.

## `gen-adaptive-fixtures.ts`

Sinh `tests/fixtures/adaptive-matrix/` — **1 110** file JSON, mỗi cửa sổ một
file, ghi lại tier / density / scene / reserve / fit / hero / cỡ chữ / hộp thoại
/ sân chơi.

```bash
npx vite-node scripts/gen-adaptive-fixtures.ts           # ghi
npx vite-node scripts/gen-adaptive-fixtures.ts --check   # chỉ báo, exit 1 nếu lệch
```

Một file mỗi cửa sổ là chủ ý: khi một ngưỡng dịch, `git diff --stat` kể tên
đúng những cửa sổ đổi hành vi, thay vì báo "một dòng đổi trong một file to".

## `gen-hero-fixtures.ts`

Sinh `tests/fixtures/hero-bands/` — **510** cặp (bề ngang, band), ghi lại bố cục
hero chọn được, chiều cao nó cần, và cỡ lockup kèm `limitedBy`.

```bash
npx vite-node scripts/gen-hero-fixtures.ts           # ghi
npx vite-node scripts/gen-hero-fixtures.ts --check   # chỉ báo
```

Corpus thứ hai vì hai ảnh chụp trong báo cáo — 1920×1080 và 1920×820 — **cùng bề
ngang, cách nhau 260px band**. Corpus cửa sổ chỉ lấy được những band mà cửa sổ
tình cờ tạo ra; corpus này đi thẳng từng bậc.

## `gen-mode-chip-fixtures.ts`

Sinh `tests/fixtures/mode-chips/` — **189** ảnh chụp, một file mỗi cặp
(preset, chế độ): band, `showLabel`, `nameSize`, `maxWidth`, `needed`, `reason`.

```bash
npx vite-node scripts/gen-mode-chip-fixtures.ts           # ghi
npx vite-node scripts/gen-mode-chip-fixtures.ts --check   # chỉ báo
```

Corpus thứ ba là corpus đầu tiên về một **component** chứ không phải một bố cục:
nó ghim đúng hai đầu vào đã sinh ra lỗi ở vòng 10 — bề ngang band và một bản dịch
dài 19 ký tự. Dùng tên tiếng Việt trong `MODE_LIST` vì đó là tập rộng nhất; bảy
ngôn ngữ được phủ riêng trong `tests/mode-chip.test.ts`.

## `gen-regression-fixtures.ts`

Sinh `tests/fixtures/regressions/` — **14** cửa sổ đã từng là chủ đề của một ảnh
chụp báo lỗi, từ vòng 1 tới vòng 12. Danh sách nằm ở
`src/components/menu/adaptive/regressions.ts` (đó là *kiến thức*: cửa sổ nào, vòng
nào, triệu chứng gì), còn script chỉ chụp lại profile.

```bash
npm run gen:regress                                  # ghi
npx vite-node scripts/gen-regression-fixtures.ts --check   # chỉ báo
```

Đây là corpus nhỏ nhất và là corpus dễ bắt hồi quy nhất, vì mỗi file là một cửa sổ
mà bố cục đã từng **sai nhìn thấy được** — và file mang theo câu mô tả triệu chứng,
nên khi đỏ nó đọc thành một câu về cửa hàng chứ không phải hai con số.

## `gen-selection-fixtures.ts`

Sinh `tests/fixtures/selection/` — **12** cửa sổ, mỗi file ghi lại *quyết định* của
`selectBest()`: bậc thắng, điểm bảy hạng tử, thứ hạng đủ sáu bậc, người về nhì và
lý do từng bậc thua. Bốn corpus trước ghi lại bố cục **là gì**; corpus này ghi lại
**vì sao nó được chọn** — nên khi một ngưỡng xê dịch, diff cho thấy một *quyết định*
đổi, không chỉ một con số đổi.

```bash
npm run gen:select                                        # ghi
npx vite-node scripts/gen-selection-fixtures.ts --check   # chỉ báo
```

`--check` cũng khẳng định hai điều về chính corpus: không cửa sổ nào hỏng hợp đồng,
và cả 12 cửa sổ đều chọn `as-planned` — corpus không được chứa một quyết định mà
ứng dụng không làm.
