# Changelog

Mọi thay đổi đáng chú ý của Lọ Chéo — Hũ Dưa Đại Chiến được ghi ở đây.
Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [SemVer](https://semver.org/lang/vi/).

## [1.1.8] — 2026-11-13

Bản **vá cuối cùng trước 1.2.0**, sáu vòng: **màn hình bắt đầu hết tràn (bốn lỗi, một nguyên nhân) · chữ `LỌ` không còn bị cắt · «Cách chơi» chuyển vào mục GAME · panel THÔNG TIN hết trống · hero tự đo cửa sổ và tự chọn bố cục ở mọi kích thước · dải deck bị bỏ · 20 hình SVG vẽ lại · 556 unit tests (54 file)**.

→ Chi tiết đầy đủ: [docs/releases/v1.1.8.md](docs/releases/v1.1.8.md)

### Fixed

- **Bốn lỗi trong ảnh chụp, một nguyên nhân** — hàng panel góc và ticker là *flex sibling* `shrink-0` của hero, chiếm `415 + 55 = 470px` trong cửa sổ 720px, nên hero chỉ còn **250px** trong khi nội dung cần khoảng 430px. Panel tự cao bằng nội dung nên chiều cao phụ thuộc độ dài bản dịch — tiếng Đức và tiếng Thái tràn trước tiếng Anh
- **`LỌ` bị cắt và không thể cuộn tới** — đây là lỗi *khác* với lỗi chiều cao, và nghiêm trọng hơn: v1.1.7 lồng một khung `overflow-y-auto` bên trong cột flex và căn giữa nội dung bằng `min-h-full` + `justify-center`. Khi nội dung cao hơn khung, căn giữa đẩy **đỉnh** nội dung lên trên gốc cuộn — nên phần đầu hero không chỉ bị cuộn khỏi tầm nhìn mà *không thể với tới ở bất kỳ vị trí cuộn nào*. Nay cả màn hình chỉ còn **một** vùng cuộn, nội dung neo ở đỉnh
- **Panel GAME tràn xuống dưới** — `CÀI ĐẶT` và dòng bản quyền bị đẩy ra ngoài mép. Chiều cao panel nay là tham số bắt buộc: bảy dòng luôn là **318px** (gọn) hoặc **458px** (đầy đủ) ở mọi ngôn ngữ
- **Ticker bị cắt ở mép dưới** — dòng `V1.1.7 · AGPL-3.0 · …` từng là khối thứ hai trong cùng một flex item `shrink-0`, nên nó xuống dòng, dải vượt quá chiều cao được cấp và mép dưới cắt đôi chữ. Nay dải cao cố định **48px**, dòng bản quyền nằm cùng khối với marquee
- **Nút `×` lạc giữa màn hình** — nút đóng của khung «Cách chơi», thuộc một accordion đã cuộn khỏi tầm nhìn. Accordion được thay bằng modal nên không còn nút nào lạc chỗ
- **Chữ `CHÉO` bị chặn cỡ theo chiều rộng nhưng không theo chiều cao** — cửa sổ thấp mà rộng làm glyph tràn khỏi dải hero

### Changed

- **«Cách chơi» chuyển vào mục GAME** — sáu luật chơi và bảng phím không còn nằm trong hero (mở ra là đẩy chữ `LỌ` khỏi màn hình) mà thành một hàng trong panel GAME, mở ra modal. Bố cục không nhúc nhích khi mở
- **Chữ `LỌ CHÉO` đặt giữa hero rồi nhấc lên một chút** — đúng yêu cầu trong báo cáo
- **Panel GAME từ 6 lên 7 hàng** — thêm «Cách chơi», nên `CORNER_MAX_ROWS` và toàn bộ phép cộng phía sau đổi theo
- **Ngưỡng dòng đầy đủ từ 800 lên 840px** — dòng đầy đủ tốn thêm 20px × 7 = 140px; reserve đầy đủ là 518px, nên hero chỉ còn giữ được sàn 320px từ `518 + 320 = 838px` trở lên

### Added

- **`src/components/menu/adaptive/`** — `breakpoints.ts` (bốn ngưỡng, mỗi cái suy từ chiều cao thật của thứ nó canh) · `hero.ts` (`heroLayout()` · `heroContentHeight()`) · `index.ts` · `README.md`. Bố cục hero rời khỏi media query một trục; quyết định giờ đọc `scene` — đúng con số `MenuChrome` đang giữ chỗ
- **`src/components/menu/layout/viewportEvents.ts`** — sáu tên sự kiện (`resize` · `orientationchange` · `fullscreenchange` + ba tiền tố nhà cung cấp) trong một chỗ; `useMenuPlan()` và `useViewportWidth()` dùng chung
- **`src/game/daily/`** — `challenge.ts` · `tip.ts` · `index.ts` · `README.md`, chuyển từ `components/menu/deck/`. Thử thách và luật trong ngày là dữ kiện trò chơi suy từ ngày địa phương, không phải thành phần giao diện
- **`src/components/menu/panel/PanelChallenge.tsx`** — dòng `mode · mốc điểm` trong panel THÔNG TIN
- **`scripts/check-svg.mjs`** — validator cho 20 hình: `url(#id)` treo, `width` cố định trên root, gradient tự tham chiếu, `<script>`, `on*=`, `<animate>` thiếu `attributeName`. Kèm **sàn chất lượng**: mỗi file phải có gradient, animation SMIL và filter
- **`tests/menu-adaptive.test.ts`** (15) — quét **1 682 viewport**, hai ảnh chụp, bậc thang ba cờ, ngưỡng suy ra
- **`tests/viewport-events.test.ts`** (10) — sáu sự kiện, đăng ký/huỷ khớp nhau, không cần jsdom
- **`tests/panel-slack.test.ts`** (7) — khoảng trống panel đi đâu, và không được đi đâu

### Changed — vòng sáu

- **Hero tự đo cửa sổ** — bốn class `lg:` quyết định *bố cục* giờ theo `hero.sideBySide`, lấy từ plan nên biết cả chiều cao. `data-hero-layout="row|stack"` để probe kiểm được nhánh nào đã chạy
- **Dải deck bị xoá** — ba cột chữ trong band cao cố định; ở `1920×1080` cột phải bị cắt giữa câu, ở `1920×820` cả hàng nằm dưới panel. Nội dung không mất: chế độ ở chip dưới mascot, thử thách ở panel THÔNG TIN, luật ở modal Cách chơi
- **Panel THÔNG TIN chia đều khoảng trống** (`space-between` chỉ trên panel phải) thay vì dồn nội dung lên đỉnh và footer xuống đáy — đó chính là khoảng trống ~126px dưới «THOÁT» trong cả hai ảnh
- **20 hình SVG vẽ lại** — mỗi file thêm filter glow; `divider.svg` từ 1 060 lên 5 828 byte (file được thấy nhiều nhất, giữa mọi mục của cả 10 README); `no-scroll-steps.svg` thêm hiện dần bốn khung
- **`tests/menu-deck.test.ts` → `tests/daily-challenge.test.ts`** — 21 test ngày tháng giữ nguyên, 2 test về component đã xoá thì đi theo component

### Fixed — vòng sáu: năm lỗi "clamp giả"

Bốn module khác nhau, cùng một dạng sai: dùng `Math.max(0, x)` như thể nó chặn
được giá trị không hữu hạn. Nó không — `Math.max` là một phép **so sánh**, và
mọi so sánh với `NaN` đều sai, còn `Infinity` thì thắng mọi so sánh.

| Nơi | Trước | Sau |
| --- | --- | --- |
| `modeMath.ts` `jarBonus` / `levelForCatches` / `multiplierForCombo` | `NaN` và `Infinity` đi thẳng vào `state.score`; HUD in ra chữ "NaN" và không phục hồi được | `saneInt()`: `Number.isFinite` → `Math.floor` → chặn ở 0 |
| `utils/math.ts` `damp` | `damp(0, Infinity, …)` trả `Infinity` ngay frame đầu; canvas bỏ qua toạ độ không hữu hạn nên hình **biến mất** không báo lỗi | giữ nguyên `current` khi target không hữu hạn |
| `engine.ts` `restoreRun` | sáu trường thân ván (`shield` · `slamCd` · `combo` · `comboT` · `frenzy` · `slow`) nhận `Infinity` từ save JSON hợp lệ (`1e999`) | `finiteOr()` — cùng kỷ luật với `nonNegInt` của `runSave`, áp ở tầng tiêu thụ |
| `audioLevels.ts` `sfxPeak` | `sfxPeak(Infinity, 1)` = `Infinity` vào `GainNode.gain.value`; WebAudio clip và có thể chốt node, hiệu ứng tắt hẳn | `unit(baseGain, 0)` — chặn ở 1, đúng cả về mặt âm thanh (peak > 1 là clipping) |
| `layout/fit.ts` `planMenuLayout` | `Math.trunc(NaN)` = `NaN`, `Math.max(1, NaN)` = `NaN`; `style={{ height: NaN }}` bị React **bỏ im lặng**, hero mất chiều cao khai báo | `sane()` kiểm `Number.isFinite` **trước** khi truncate |

Ngoài ra:

- **`i18n.ts` `interpolate` chạy hai lượt và phụ thuộc thứ tự key** — nếu giá trị của một tham số lại là placeholder của tham số khác thì kết quả phụ thuộc thứ tự key trong object; hai call site cùng object ra hai chuỗi khác nhau. Nay là một lượt regex trên *template*, không đệ quy.
- **`fit.ts` vẽ footer trong chế độ `minimal`** — `footer` tính từ chiều cao thô (`≥ 470`), `minimal` tính từ `available` sau reserve, nên cửa sổ 475px vừa `minimal` vừa giữ 30px cho dải thống kê. Nay `footer` dùng chung phép gấp với `minimal`.
- **`tipIndexFor()` mất người gọi duy nhất khi deck bị xoá** — hàm thuần còn 6 test xanh và không ảnh hưởng gì tới app. Nay modal Cách chơi đánh dấu luật của hôm nay, và có test khoá "mỗi hàm export phải có caller thật".
- **Panel THÔNG TIN trống ~126px** — `flex-start` + `margin-top: auto` đẩy footer xuống đáy; nay `space-between` chỉ trên panel phải.

### Fixed — vòng sáu (giao diện)

- **`1920×820` cắt mất nửa chip `CHẾ ĐỘ CHƠI`** — band ~452px, hero hai cột cần ~460px, `minimal` là `false`, nên hàng ngang được dựng rồi bị cắt ở đáy
- **Toàn màn hình không kích hoạt re-plan** — Firefox không bắn `resize` khi vào toàn màn hình, Safari cũ chỉ bắn `webkitfullscreenchange`. Cửa sổ đổi chiều cao mà hero giữ kế hoạch cũ
- **`HEIGHT_FOR_BADGE_ROW` từng là `210`** — thấp hơn chính lockup 212px mà nó canh, nên band 210px vẽ lockup 212px và dòng kỷ lục bị cắt. Bài quét bắt được, không phải người đọc mã
- **`tipIndexFor()` không có người gọi** — xoá deck làm mất caller duy nhất; hàm thuần còn 6 test xanh và **không ảnh hưởng gì tới app**. Nay modal Cách chơi đánh dấu luật của hôm nay, và có test khoá "mỗi hàm export phải có caller thật"
- **`challengeFor()` gọi hai lần trong một biểu thức JSX** — hai lần băm cùng một ngày mỗi render, cho một giá trị không đổi tới nửa đêm
- **`no-scroll-steps.svg` không có animation nào** — cả sơ đồ nói về *trình tự* bốn bước co lại

- **`src/components/menu/layout/`** — `metrics.ts` (mọi con số được khai báo, phép cộng viết ra), `fit.ts` (`planMenuLayout()` thuần, không DOM), `useMenuPlan.ts` (đọc cửa sổ thật, ưu tiên `visualViewport`, gộp resize vào một animation frame), `index.ts`, `README.md`
- **`src/components/menu/scene/`** — `decor.ts` (14 món trang trí dạng dữ liệu + hai phép kiểm hình học), `DecorGlyph.tsx` (tám hình vẽ tay 24×24), `HeroDecor.tsx`, `JarHalo.tsx`
- **`src/components/menu/ticker/`** — dải chạy chữ tách thành module: 14 chuỗi + `tickerTone()` thuần
- **`src/components/menu/howto/rules.ts`** — sáu luật chơi dạng dữ liệu thay vì JSX viết tay
- **`src/components/menu/HowToModal.tsx`** — modal «Cách chơi», hai cột, huy hiệu theo màu
- **`src/components/menu/MenuChrome.tsx`** — chrome nổi, ra khỏi flex flow
- **`tests/menu-layout.test.ts`** (32 ca) · **`tests/menu-decor.test.ts`** (12) · **`tests/menu-ticker.test.ts`** (8) — **+52 test**
- **`scripts/probe-menu-layout.tsx`** — render `StartScreen` thành HTML thật rồi kiểm **21 tính chất** trên DOM sinh ra
- **`docs/releases/v1.1.8.md`** — mô tả phát hành đầy đủ
- **Hai i18n key** `game.howtoHint` · `howto.goal` cho cả 7 locale — **304 key**, parity nguyên vẹn

### Documentation

- Đồng bộ toàn bộ **10 README**, `docs/`, `assets/*.svg`, ba launcher và `index.html` lên **1.1.8**
- Xoá hết câu "1.1.7 là bản vá cuối cùng trước 1.2.0" — vai trò đó thuộc về 1.1.8
- Chuỗi ngày phát hành: `10-26 · 10-30 · 11-06 · 11-09 · 11-09 · 11-09 · 11-13 · 11-13 · 11-13 · 11-14`

[1.1.8]: https://github.com/standardizeparadigm/LoCheoIO/releases/tag/v1.1.8

## [1.1.7] — 2026-11-12

**Nền menu hết mờ (sửa bốn lớp chồng nhau) · changelog chia tầng PATCH/UPDATE/MAJOR có màu riêng · mô tả đầy đủ cho cả 8 bản phát hành · ngày phát hành xếp lại thành chuỗi liền mạch · dự án tách thành nhiều thư mục hơn · README 10 ngôn ngữ làm lại · đồng bộ toàn bộ tài liệu/SVG/launcher lên 1.1.7 · 256 unit tests (33 file)**.

→ Chi tiết đầy đủ: [docs/releases/v1.1.7.md](docs/releases/v1.1.7.md)

### Fixed
- **Nền sau menu vẫn mờ** — bốn lớp phủ cộng hưởng: `.nebula-*` `blur(64px)` + opacity đỉnh `1.0`; vignette nội tuyến `rgba(6,26,26, 0.42 → 0.88 → 1.0)` phủ toàn màn hình; khung CRT `inset 0 0 140px rgba(6,26,26,0.9)`; `.tile-floor` chỉ `opacity-45` nên gần như vô hình. Sửa: `blur(22px)`, đỉnh `0.80`, `.menu-vignette` chỉ tối ở góc (`0.30` / `0.62`), `.app-vignette` `90px @ 0.55`, sàn `opacity-70`
- **Ngày phát hành trùng và phi logic** — bảy bản liền nhau đều ghi `2026-11-13`, riêng 1.1.6 ghi `2026-11-13` (sau thời điểm phát hành). Chuỗi mới: 10-26 · 10-30 · 11-06 · 11-09 · 11-09 · 11-09 · 11-13 · 11-13 · 11-13 (nhịp 2 ngày, không bản nào trùng ngày)
- **Nhãn changelog sai bản chất** — trường `kind` viết tay (`feature`/`fix`/`polish`) không suy ra từ SemVer nên đã từng lệch. Nay `tierFor(version)` suy tầng trực tiếp từ số phiên bản; `kind` còn đó nhưng `@deprecated` và không còn được đọc khi render
- **Năm chuỗi chưa dịch lọt qua mọi cổng** — `changelog.title` / `info.changelog` ở es và fr, `scoreboard.top` ở es/fr/ko vẫn là tiếng Anh. Bật luật thứ 5 trong `check:i18n` (một locale không được mang nguyên văn chuỗi tiếng Anh) và dịch: **CAMBIOS** / **NOUVEAUTÉS** / **MEJORES** / **MEILLEURS** / **상위**
- **Comment của `scripts/check-readme-sync.mjs` ghi cứng `1.1.6`** — đọc từ `package.json` thay vì sao chép tay qua từng bản
- **Tài liệu/SVG/launcher còn sót phiên bản cũ** — quét toàn bộ `1.1.4`/`1.1.5`/`1.1.6` trong README, `docs/`, `assets/*.svg`, ba launcher và badge; đồng bộ hết về 1.1.7

### Added
- **Ba tầng phát hành có màu** — `PATCH` tím (`violet-500` `#9d6bff`) · `UPDATE` vàng (`tumeric-500` `#f5a81c`) · `MAJOR` hồng (`pink-500` `#ff5fb0`); mỗi tầng có viền trái, chấm mốc thời gian và quầng sáng riêng
- **Bộ lọc theo tầng** trong panel changelog — TẤT CẢ · MAJOR · UPDATE · PATCH, kèm số bản mỗi tầng, `aria-pressed` và `role="group"`
- **Mô tả đầy đủ cho 8 bản cũ** — 96 gạch đầu dòng tiếng Việt + 96 tiếng Anh; sáu bản trước đây có `itemsVi: []`
- **`src/game/changelog/`** thay cho `src/game/changelog.ts` — `types.ts` · `tiers.ts` · `entries/v1_0_0.ts … v1_1_7.ts` (9 file) · `index.ts`
- **Helper mới** — `latestEntry()` · `entryFor(version)` · `copyFor(entry, vi)` · `TIER_ORDER` · `TIER_LABEL_KEY`
- **6 khoá i18n mới × 7 locale** — `changelog.tier.{major,minor,patch}` · `changelog.filter.all` · `changelog.releases` · `changelog.filterHint` (302 khoá mỗi locale)
- **`tests/changelog-tiers.test.ts`** — 13 test khoá ánh xạ tầng, độ dài mô tả tối thiểu, tính duy nhất của từng gạch và thứ tự ngày nghiêm ngặt
- **`tests/changelog-ui.test.ts` · `tests/menu-background.test.ts` · `tests/modes-split.test.ts`** — 21 test mới khoá màu theo tầng, bốn luật tương phản nền menu và cấu trúc 9 chế độ sau khi tách file

### Changed
- **Dự án tách thành nhiều thư mục hơn** — `src/game/changelog/` (types · tiers · entries/ · index) · `src/components/ui/` (8 primitive + barrel) · `src/game/modes/` (9 record + modeTypes · modesIndex · modeMath) · `src/components/menu/background/` (8 lớp nền khai báo bằng dữ liệu). Mọi barrel giữ nguyên import cũ, **không call site nào phải sửa**
- **`APP_VERSION` → 1.1.7**; `package.json` + lock, `src/version.ts`, thẻ `<meta name="version">` trong `index.html`, badge 10 README, ba launcher
- **README 10 ngôn ngữ** — dải màu động SMIL, sơ đồ kiến trúc SVG, bảng so sánh 9 bản phát hành, mục kiểm chứng chất lượng, mục giải thích "nền menu đã hết mờ"
- **`.menu-vignette` / `.app-vignette`** thành rule CSS có tên thay cho utility viết thẳng trong JSX — chỉnh một chỗ, và `prefers-reduced-motion` áp dụng được
- Build ~831 KB (`dist/index.html`, gzip ~388 KB)

## [1.1.6] — 2026-11-10

Bản **đại tu cài đặt + làm đẹp menu**: **cài đặt chia 6 mục (Cấu hình nhanh · Âm thanh · Giao diện & chuyển động · Ngôn ngữ · Sao lưu · Dữ liệu) · ngôn ngữ dời hẳn vào cài đặt · thêm âm lượng 0–100, mức rung, chất lượng hình, tự tạm dừng khi đổi tab · 4 preset một chạm · xuất/nhập cấu hình JSON · nền menu nhiều lớp chuyển động · viền gradient chạy vòng ở mục tác giả · trap focus trong modal · lớp truy cập storage duy nhất · bảng màu canvas/CSS dùng chung · README 10 ngôn ngữ làm mới · 222 unit tests (29 file)**.

→ Chi tiết đầy đủ: [docs/releases/v1.1.6.md](docs/releases/v1.1.6.md)

### Added
- **Cài đặt 6 mục** (`src/components/settings/`, module mới): **CẤU HÌNH NHANH** · **ÂM THANH** · **GIAO DIỆN & CHUYỂN ĐỘNG** · **NGÔN NGỮ** · **SAO LƯU** · **DỮ LIỆU** — thay panel 4 công tắc phẳng của v1.1.5
- **Ba kiểu điều khiển** trong settings: công tắc bật/tắt (`Switch`), bộ chọn 2 lựa chọn (`SegmentedControl`: mức rung, chất lượng hình), mức 0–100 (`VolumeStepper`: âm lượng SFX/nhạc, bước 10, thanh 10 vạch nghiêng)
- **Schema `locheo.settings.v1` mở rộng** (giữ nguyên key, save cũ đọc được): `sfxVolume` 80 · `musicVolume` 60 · `shakeLevel` `low|high` · `visualQuality` `low|high` · `autoPauseOnBlur` · `language`
- **Âm lượng thật**: `audio.setSfxVolume` nhân vào peak từng tiếng, `audio.setMusicVolume` nhân vào bus nhạc (`0.5 × volume`), áp dụng trực tiếp không cần reload
- **Mức rung**: `engine.setShakeLevel("low")` = 45% chấn động, `"high"` = 100%
- **Chất lượng hình**: `engine.setQuality("low")` = trần **230** hạt (so với 460) + tắt toàn bộ `shadowBlur` glow (12 điểm vẽ)
- **Tự tạm dừng khi đổi tab**: `GameCanvas` đọc `autoPauseOnBlur` trong `visibilitychange`
- **4 preset một chạm** (`src/game/settingsPresets.ts`): **MƯỢT** (máy yếu: ít hạt, tắt sáng) · **CÂN BẰNG** (mặc định) · **ĐIỆN ẢNH** (hết hạt/sáng/rung) · **SPEEDRUN** (tắt nhạc, SFX nhỏ, không auto-pause) — **không bao giờ đổi ngôn ngữ**; `matchPreset()` tự nhận ra "TUỲ CHỈNH" khi người chơi chỉnh tay
- **Sao lưu cài đặt** (`src/game/settingsIO.ts` + `BackupSection`): xuất JSON có envelope `{app, kind, version, exportedAt, settings}` (copy clipboard, có textarea dự phòng), nhập lại qua `normalizeSettings` — JSON rác/không liên quan bị từ chối, không bao giờ ghi đè cấu hình
- **Nền menu nhiều lớp** (`src/index.css` + `StartScreen`): tinh vân trôi (`nebula-a/b`), tia sáng thở (`light-ray`), **2 lớp sao nhấp nháy** (`star-field`, `star-field-far`), vòng sáng xoay quanh lọ (`glow-ring`), quầng sáng lọ (`jar-glow`), vệt sáng chạy qua nút CHƠI (`cta-shine`), header panel góc có dải gradient + chấm sáng thở
- **Mục tác giả**: viền gradient chạy vòng vô hạn (`.about-card`, pan 320% `5.5s`), quầng sáng xoay quanh logo, chip cảm ơn gradient
- **`useFocusTrap`** (`src/utils/useFocusTrap.ts`): Tab/Shift+Tab quấn trong modal, focus trả về phần tử trước khi mở
- **Changelog trong game** có mục 1.1.6 (`src/game/changelog.ts`)
- **21 + 10 + 9 key i18n mới × 7 locale** (settings viền/mức/chất lượng/auto-pause/reset · preset · sao lưu) — parity test giữ nguyên
- Tests: **222/222** (29 files) — 15 file mới/thêm: `i18n-v116` 8 · `settings-v116` 9 · `settingsIO` 6 · `settingsPresets` 9 · `audioLevels` 6 · `i18n-settings-ui` 4 · `settings-wiring` 9 · `mediaQuery` 6 · `languageMeta` 5 · `safeStorage` 7 · `spawn` 9 · `palette` 4 · `time` 6 · `math` 8 · `clipboard` 3

### Fixed
- **Nhạc phát to hơn mức đã đặt sau khi tải lại trang** — `audio.unlock()` mở bus nhạc ở `0.5` cố định, bỏ qua `musicVolume` cho tới lần setter kế tiếp; giờ mở đúng `musicBusGain(musicEnabled, musicVolume)`
- **Tab thoát khỏi modal** — focus có thể đi ra canvas/panel góc phía sau hộp thoại; `useFocusTrap` giữ focus trong `Panel`
- **Gợi ý changelog ở menu ghi cứng `v1.1.5`** — đọc `APP_VERSION`, không lệch mỗi bản
- `settings.updateSettings` giờ trả bản **đã normalize** (trước đó trả patch thô, state React có thể giữ giá trị ngoài biên)
- `LanguageSwitcher.tsx` xoá hẳn (không còn mount ở `StartScreen`/`PauseScreen`) — `menu/index.ts` re-export `SettingsModal` từ module mới
- `scripts/smoke-ssr.tsx` trỏ `src/components/menu/SettingsModal` (đã di chuyển) → sửa import + prop mới
- **Nút "Xuất" báo "Đã copy" khi clipboard trống** — `await navigator.clipboard?.writeText()` resolve cả khi API không tồn tại; `utils/clipboard.ts` giờ trả `true` chỉ khi copy thật sự xảy ra
- **Toggle cài đặt tự quay về mặc định khi storage bị chặn** — `updateSettings()` đọc lại storage; `patchSettings` persist thẳng `prev + patch`, `updateSettings(patch, base?)` nhận base tường minh
- **Âm thanh tự bật lại sau reload** — cờ mute giờ lưu ở `locheo.muted.v1`
- **`sau` có thể rơi ở cấp 1** — `weightedPick` fallback về kind cuối **có trọng số dương**, không phải kind cuối mảng
- **HUD/bảng điểm in "NaN"** — `fmtNum` kẹp non-finite về 0 và có fallback khi thiếu `Intl`
- **Nút xác nhận xoá dữ liệu chỉ có dấu ←** — thêm `common.cancel` ×7 locale + `aria-label` cho hai nút trigger

### Changed
- **`APP_VERSION` → 1.1.6**; `package.json` + lock, `src/version.ts`, badge 10 README
- **`docs/design/settings-format.md`** viết lại theo schema mới; `docs/guides/storage-keys.md` thêm dòng settings mới + ghi chú `locheo.lang.v1` là gương của `settings.language`
- **`docs/guides/adding-a-locale.md`** — ngôn ngữ chọn trong Settings (`LanguageSection`), không còn `LanguageSwitcher`
- **`tests/README.md`** — bảng 29 file / 222 test
- Reduced-motion bao phủ **toàn bộ** animation mới (nebula, starfield, light-ray, glow-ring, jar-glow, about-card, cta-shine)
- Build ~771 KB

## [1.1.5] — 2026-11-09

Bản **chuẩn hóa menu + hoàn thiện trải nghiệm**: **menu chính gọn lại với panel góc GAME (dưới-trái) & INFO (dưới-phải) · chế độ chơi dồn vào màn chọn riêng · lưu & «Chơi tiếp» ván đang dở · cài đặt trong game (SFX · nhạc · rung · giảm chuyển động) · Changelog/Author/Quit ngay từ menu · prefers-reduced-motion toàn bộ · README 10 ngôn ngữ với animation · 113 unit tests**.

→ Chi tiết đầy đủ: [docs/releases/v1.1.5.md](docs/releases/v1.1.5.md)

### Added
- **Panel GAME góc dưới-trái**: Chơi (bắt đầu ván mới) · **Chơi tiếp** (chỉ bật khi có ván đang dở — snapshot `locheo.run.v1`, giữ nguyên điểm/hũ/combo/stamina/shield/slamCd) · Chế độ chơi (9 chế độ, tách khỏi menu chính) · Bảng xếp hạng (TOP 8 cục bộ) · Thành tựu (16, có đếm) · **Cài đặt** (trong game)
- **Panel INFO góc dưới-phải**: Giới thiệu tác giả (about card — role, craft, liên hệ, license, font credits) · **Changelog** (timeline ngay trong game, dữ liệu `src/game/changelog.ts`) · **Thoát** (best-effort `window.close()` + hướng dẫn Ctrl/Cmd+W)
- **Chọn chế độ dạng màn hình riêng** (`ModeSelectModal`) — 9 thẻ chế độ không còn chiếm diện tích menu chính
- **Lưu & tiếp tục ván đang chơi dở** (`src/game/runSave.ts`): snapshot khi rời màn (pause → menu hoặc pause screen), khôi phục khi bấm «Chơi tiếp» (invuln grace 1.2s + spawn stagger), tự xóa khi ván kết thúc / bắt đầu ván mới / xóa dữ liệu
- **Cài đặt trong game** (`src/game/settings.ts` + `SettingsModal`): SFX, nhạc nền, rung màn hình, **giảm chuyển động** — lưu `locheo.settings.v1`, áp dụng tức thì (audio gates + engine hooks `setShakeEnabled`/`setReducedMotion`)
- **Danger zone** trong Cài đặt: xóa toàn bộ điểm/tiến trình/thành tựu/snapshot trên máy (`storage.clearAllProgress`)
- 53 i18n keys mới × **7 locale** (VI/EN/ZH/JA/KO/ES/FR); parity test giữ nguyên
- `scripts/smoke-ssr.tsx` — headless render smoke test toàn bộ menu/modal tree (`react-dom/server`)
- `assets/corner-menu.svg` — animation SMIL minh họa 2 panel góc (nhúng trong README)
- CI GitHub Actions (`.github/workflows/ci.yml`): npm ci → npm run check → `scripts/check-readme-sync.mjs` (10 READMEs)
- npm scripts mới: `npm run smoke` (SSR smoke), `npm run check:readme` (README drift gate)
- Tests: **113/113** (14 files) — +5 runSave · +5 settings · +2 changelog · +2 i18n-v115 · +1 storage clearAllProgress · **+37 hardening**: modes-balance 10 · achievements-defs 5 · version-bump 5 · storage-seed 3 · i18n-modes 8 · storage-migrate 6

### Fixed
- **Phím tắt rò rỉ qua modal**: Enter (bắt đầu), R (restart), P (pause), M (mute), Space (slam) vẫn kích hoạt game khi đang mở modal từ menu — `Modal` chặn ở capture phase (`stopImmediatePropagation`), phím Escape đóng modal
- **`resumeRun` stale closure** trong `App.tsx` (callback `[]` bắt state khởi tạo → «Chơi tiếp» có thể không khôi phục sau khi snapshot phát sinh) — đọc qua `resumeRef`, bỏ side-effect trong state updater
- **Ván resumed tính sai chế độ**: engine chuyển về `saved.mode` khi khôi phục nhưng state React + `locheo.mode.v1` vẫn trỏ chế độ đã chọn ở menu → HUD/GameOver/thành tựu quy về chế độ sai — giờ `resumeRun` đồng bộ `setMode(saved.mode)`
- **`prefers-reduced-motion` thiếu hầu hết animation** — giờ vô hiệu hóa toàn bộ `.anim-*`, marquee, scanlines, shake/flash
- GameMenu hiển thị số chế độ hardcode `9` → đọc từ `MODE_LIST.length`
- `docs/releases/v1.1.4.md` tiêu đề còn "(Bản phát hành hiện tại)" — chuyển nhãn sang bản 1.1.5
- **SEED board bị mutate chéo session** (`loadScores()` trả shallow spread `[...SEED]`) — entry có thể bị ghi đè và lọt vào mọi lần load sau; giờ `seedCopy()` deep-copy từng row
- **Focus không nhìn thấy được khi bàn phím tab** — thêm `:focus-visible` ring nghệ vàng trên nền ngọc bích; suppression cho focus bằng chuột

### Changed
- **`APP_VERSION` → 1.1.5**; `package.json`/lock, `src/version.ts`, launcher ×3 (bat/sh/command), banner V1.1.5
- **StartScreen layout**: hero gọn (bỏ scoreboard/achievements/mode selector inline), Mascot + current-mode card ở giữa, 2 panel góc cố định, ticker giữ nguyên
- README 10 ngôn ngữ: badge 1.1.5, mục "Mới trong v1.1.5", releases table, cây thư mục (menu/ · changelog.ts · runSave.ts · settings.ts · smoke-ssr), 113 tests
- Build ~766 KB (gzip ~368 KB) — tăng do modal layer

## [1.1.4] — 2026-11-06

Bản **mở rộng nội dung chơi + sửa lỗi launcher Windows tận gốc**: **2 chế độ mới (Lễ Hội Combo · Đại Tiệc Dưa) · 16 thành tựu · 7 ngôn ngữ trong game (thêm Español · Français) · sửa crash `play-windows.bat` (CRLF + UTF-8 BOM) · launcher 7 ngôn ngữ · README 10 ngôn ngữ làm mới · assets SMIL mới (languages/new-modes/divider) · modes.svg 9 chế độ · 61 unit tests**.

→ Chi tiết đầy đủ: [docs/releases/v1.1.4.md](docs/releases/v1.1.4.md)

### Added
- Chế độ **LỄ HỘI COMBO** (`combo`): cửa sổ combo sống **gấp đôi** (`comboWindowMult: 2` → 5.4s), **+15% điểm mỗi củ** (`scoreMult: 1.15`), `spawnMult: 0.92`, `hazardMult: 1.25`, `speedMult: 1.05` — giữ nhịp là combo không bao giờ đứt, multiplier pháo bông
- Chế độ **ĐẠI TIỆC DƯA** (`feast`): dưa rơi chậm hơn (`speedMult: 0.78`) nhưng **dày gần gấp đôi** (`spawnMult: 0.6`), mỗi củ **×0.6 điểm**, bù lại **thưởng đổ đầy hũ ×2.5** (`jarBonusMult: 2.5`) — kiểu chơi «trồng lúa» leo hũ siêu nhanh
- 2 thành tựu mới — **DÂY THÉP COMBO** (`combo-40`: chuỗi 40 củ liên tiếp, mọi chế độ) và **TẤM LÒNG TRẨY HỘI** (`feast-3jars`: đầy 3 hũ trong một ván Đại Tiệc Dưa); tổng cộng **16 thành tựu**
- **2 ngôn ngữ giao diện mới**: **Español** (`es.ts`) và **Français** (`fr.ts`) — 207 khóa mỗi bản, parity test ép **7 locale** đồng bộ; `Language` type, `LANGUAGES`, detect theo trình duyệt (es/fr), `locheo.lang.v1`, `numberLocale` (es-ES/fr-FR), `LanguageSwitcher` hiển thị VI/EN/中/日/한/ES/FR
- **Launcher 7 ngôn ngữ**: phím **`L`** chuyển vòng **VI → EN → 中 → 日 → 한 → ES → FR** (cả 3 launcher), `LOCHEO_LANG=vi|en|zh|ja|ko|es|fr`; `scripts/README.md` cập nhật
- **Assets SMIL mới**: `assets/languages.svg` (7 ngôn ngữ), `assets/new-modes.svg` (2 chế độ mới), `assets/divider.svg` (dải sparkle ngăn cách section); `assets/modes.svg` nâng lên **9 chế độ**; `assets/banner.svg` — V1.1.4 · 9 CHẾ ĐỘ · 16 THÀNH TỰU
- **README 10 ngôn ngữ làm mới** (vi/en/zh/ja/ko/es/fr/th/de/pt): badge 1.1.4 + language badge 7 ngôn ngữ, "What's new v1.1.4" viết tay theo từng ngôn ngữ, FAQ mới (launcher Windows tiếng Việt), cây thư mục/releases/tests đồng bộ
- `.gitattributes` — ép CRLF cho `*.bat`/`*.cmd` (posix giữ LF), chặn lỗi encoding vĩnh viễn cho launcher Windows

### Fixed
- **`play-windows.bat` crash ngay khi mở** (`'Ọ' is not recognized as an internal or external command` / `else was unexpected at this time.`): viết lại hoàn toàn — **CRLF + UTF-8 BOM** bắt buộc, `chcp 65001`, prompt dùng delayed expansion `!TSTR!`, tiếng Việt **giữ nguyên dấu**; `.gitattributes` đảm bảo không tái diễn
- Docs còn số cũ (DESCRIPTION, package.json description/keywords, `index.html` meta, CONTRIBUTING/scripts README "55 tests", banner V1.1.3) — đồng bộ **1.1.4 / 9 chế độ / 16 thành tựu / 7 ngôn ngữ / 61 tests**

### Changed
- `APP_VERSION` → **1.1.4**; `package.json`/lock, `src/version.ts`, `assets/banner.svg`, `index.html` đều hiển thị 1.1.4
- `ModeSelector` grid → 9 thẻ (`lg:grid-cols-9`); `ModeConfig` thêm optional `comboWindowMult?` / `jarBonusMult?` (mặc định 1)
- Test suite: **61/61** (modes 22 · achievements 15 · storage 11 · i18n 13)

## [1.1.3] — 2026-11-04

Bản **sửa lỗi + mở rộng nội dung chơi**: **2 chế độ mới (Mưa Dưa · Gốm Mỏng) · 14 thành tựu · 5 ngôn ngữ trong game (thêm 日本語 · 한국어) · launcher đa ngôn ngữ + animation cho macOS/Windows/Linux · favicon web · modes.svg showcase 7 chế độ · README 10 ngôn ngữ đồng bộ · 55 unit tests**.

→ Chi tiết đầy đủ: [docs/releases/v1.1.3.md](docs/releases/v1.1.3.md)

### Added
- Chế độ **MƯA DƯA** (`storm`): dưa rơi chậm hơn (`speedMult 0.88`) nhưng dày gấp ~1.4× (`spawnMult 0.72`) và đồ hư nhiều gấp 1.5× (`hazardMult 1.5`), đổi lại ×0.75 điểm (`scoreMult 0.75`) — cảm giác «lụt dưa», leo cấp rất nhanh
- Chế độ **GỐM MỎNG** (`hardcore`): chỉ **MỘT vết nứt** là vỡ hũ (`maxCracks: 1`), ×2.0 điểm (`scoreMult 2`), hazard ×1.3, spawn ×0.95, speed ×1.1 — chỉ dành cho tay chéo kim cương
- 2 thành tựu mới — **CƠN MƯA NẶNG HẠT** (`storm-60`: hứng 60 củ trong một ván Mưa Dưa) và **GỐM THÉP** (`hardcore-jar`: đầy một hũ trong một ván Gốm Mỏng); tổng cộng **14 thành tựu**
- **2 ngôn ngữ giao diện mới**: **日本語** (`ja.ts`) và **한국어** (`ko.ts`) — 193 khóa mỗi bản, parity test ép 5 locale đồng bộ; `Language` type, `LANGUAGES`, detect theo trình duyệt (ja/ko), `locheo.lang.v1`, `numberLocale` (ja-JP/ko-KR), `LanguageSwitcher` hiển thị VI/EN/中/日/한
- **Favicon web**: `favicon.ico` (multi-size 16/24/32/48/64/128/256) ở repo root, `public/favicon.ico` + `public/favicon.png` (256) + `public/favicon.svg`, `assets/favicon.svg` (hoạt họa SMIL, nhúng trong README) và `assets/favicon-512.png`; `index.html` nhúng **data-URI ICO** + `favicon.svg` + `apple-touch-icon`
- **Launcher đa ngôn ngữ + animation**: cả 3 launcher đổi ngôn ngữ bằng phím **`L`** (VI→EN→中), đọc biến môi trường **`LOCHEO_LANG`**, có **banner 3 nháy**, **spinner braille** kèm % thật và **tia lấp lánh** (sparkle line); menu tiếng Việt hiển thị **dấu đầy đủ**; `play-mac.command` viết lại cho macOS (brew hint, `open`), `play-windows.bat` viết lại hoàn toàn (UTF-8 qua `chcp 65001`, ANSI màu, winget, menu animation)
- `assets/modes.svg` — showcase **7 chế độ** (SMIL animation); `assets/favicon.svg` — favicon động (SMIL: lọ lắc nhẹ + tia lấp lánh); banner hiển thị **V1.1.3**

### Fixed
- `play-linux.sh`: `spin_run` bắt `$*` làm nhãn và gọi cứng `npm run build` — ký hiệu thật giờ là `spin_run <log> <label> -- <lệnh…>`; **banner 3 nháy in rác `\033[2J` khi output không phải TTY** — giờ animation chỉ chạy khi `[ -t 1 ]`; **`sparkle_line` ghi byte null thô** từ `/dev/zero` vào terminal — giờ là chuỗi ký tự tĩnh và có gọi trước prompt; **`LANG: unbound variable`** dưới `set -u` khi env trống — thêm fallback `${LANG:-vi}`
- `play-windows.bat`: menu in 3 frame banner liền nhau không `cls`; toàn bộ file chuyển CRLF + `chcp 65001` để menu tiếng Việt có dấu hiển thị đúng
- `index.html` còn meta "3 ngôn ngữ / 5 chế độ / 12 thành tựu" và thiếu favicon — cập nhật **5 ngôn ngữ / 7 chế độ / 14 thành tựu** + 3 link icon
- `package.json`/`docs/DESCRIPTION.md`/`CONTRIBUTING.md` còn "5 chế độ / 12 thành tựu / 3 ngôn ngữ / 49 tests" — đồng bộ **1.1.3 / 7 chế độ / 14 thành tựu / 5 ngôn ngữ / 55 tests**
- Mọi README (10 ngôn ngữ) còn sót số liệu/version cũ (badge 1.1.2, "5 modes", "12 achievements", "3 languages", 49 tests, release notes link trỏ v1.1.2.md) — đã rà quét và đồng bộ **1.1.3** trên cả 10 bản

### Changed
- `APP_VERSION` → **1.1.3**; `package.json`/lock, `src/version.ts`, `assets/banner.svg`, `index.html` đều hiển thị 1.1.3
- Engine: ngưỡng **vỡ hũ theo từng chế độ** — `MODES[mode].maxCracks ?? 3` (dùng cho cả popup `popup.cracked/broken` và `gameOver()`); Gốm Mỏng gãy ở đúng 1 vết nứt
- ModeSelector grid: `lg:grid-cols-5` → `lg:grid-cols-7` (vừa 7 thẻ)
- `npm run check` (typecheck + 55 tests + build) xanh — cổng CI bắt buộc trước PR

## [1.1.2] — 2026-11-02

Bản **sửa lỗi + mở rộng nội dung chơi**: **2 chế độ mới (Đua 60 Giây · Mùa Vàng) · 12 thành tựu · combo 12+ bốc lửa · launcher double-click cho macOS/Windows/Linux · README 10 ngôn ngữ · license asset mới · 49 unit tests**.

→ Chi tiết đầy đủ: [docs/releases/v1.1.2.md](docs/releases/v1.1.2.md)

### Added
- Chế độ **ĐUA 60 GIÂY** (`blitz`): time-attack 60 giây, dưa rơi dày hơn (`spawnMult 0.9`) và nhanh hơn (`speedMult 1.12`), hazard nhiều hơn một chút (`hazardMult 1.2`), đổi lại ×1.25 điểm. Khi hết giờ, ván chơi tự kết thúc (`timeLimit` trong `MODES`); HUD đổi nhãn `HŨ DƯA` thành đồng hồ đếm ngược (`hud.timeLeft` với `{n}`), **nhấp nháy đỏ** khi còn ≤ 10 giây
- Chế độ **MÙA VÀNG** (`goldrush`): Muối Vàng, Cải Vàng, Tỏi Vàng, Ớt Hiểm và Đá Lạnh ra nhiều hơn **~2.6×** (`goldMult`), cân bằng như Cổ điển (×1.0 điểm, `speedMult 1`, `hazardMult 1`, `spawnMult 0.95`)
- 2 thành tựu mới — **VUA ĐUA 60 GIÂY** (`blitz-3000`: 3.000 điểm một ván Đua 60 Giây) và **MÙA VÀNG BỘI THU** (`goldrush-2jars`: đầy 2 hũ một ván Mùa Vàng); tổng cộng **12 thành tựu**
- **Combo 12+ bốc lửa**: streak ≥ 12 thì engine sinh hạt lửa vàng/ớt quanh lọ (thuần thị giác, không đổi balancing)
- `hud.timeLeft` (vi/en/zh) + `mode.blitz.*`, `mode.goldrush.*`, `ach.blitz-3000.*`, `ach.goldrush-2jars.*` — mọi key mới đều có mặt trong cả 3 locale (ép bởi test i18n)
- Launcher **double-click** trong `scripts/`: `play-mac.command` (macOS), `play-windows.bat` (Windows), `play-linux.sh` (Linux) — menu full màu, đủ mọi lệnh production (build+preview/chơi) và development (dev/test/check/…); mọi file đều menu đầy đủ; hướng dẫn cho người không rành terminal ở `scripts/README.md`
- `assets/license.svg` — ấn phẩm AGPL-3.0 copyleft (SMIL); `assets/modes.svg` — showcase 5 chế độ (SMIL); banner hiển thị V1.1.2
- README thêm bản 🇹🇭 ไทย · 🇩🇪 Deutsch · 🇵🇹 Português (tổng **10 ngôn ngữ**), mỗi bản gồm đầy đủ mục: tổng quan mới, highlights, FAQ, cấu trúc cây thư mục v1.1.2, release table, license asset
- 4 unit tests mới (blitz/goldrush trong modes, 2 achievement mới) — tổng **49 tests**

### Fixed
- `zh.ts` thiếu dấu câu/diễn đạt ở một số chuỗi và **thiếu toàn bộ key mới** — đã bổ sung đầy đủ; parity test ép cả 3 locale
- `index.html` description/keywords, `package.json` description/keywords, `docs/DESCRIPTION.md` (mọi bản dịch) còn ghi "3 chế độ / 10 thành tựu" — cập nhật thành **5 chế độ / 12 thành tựu**
- Mọi README còn sót tham chiếu 1.1.1/45 tests/10 thành tựu/3 chế độ — đã rà quét và đồng bộ 1.1.2 trên **cả 10 ngôn ngữ**

### Changed
- `APP_VERSION` → **1.1.2**; `package.json`/lock, `src/version.ts`, `index.css` header comment, `index.html` theme/description, `assets/banner.svg` đều hiển thị V1.1.2
- ModeSelector grid: `grid-cols-3` → `grid-cols-2 md… lg:grid-cols-5` để vừa 5 thẻ chế độ mọi cỡ màn hình
- `npm run check` (typecheck + 49 tests + build) là gate bắt buộc trước khi mở PR

## [1.1.1] — 2026-10-30

Bản tập trung **sửa lỗi & mở rộng**: **chuyển đổi ngôn ngữ VI/EN/ZH ngay trong game · README 7 ngôn ngữ · banner/animation mới · rà quét và sửa toàn bộ lỗi tồn đọng · 45 unit tests**.

→ Chi tiết đầy đủ: [docs/releases/v1.1.1.md](docs/releases/v1.1.1.md)

### Added
- i18n trong game: `src/i18n/` (`i18n.ts` module thuần — detect/persist/`t()` có interpolation; `useI18n.ts` bridge React; `locales/vi|en|zh.ts` — key set đồng bộ bắt buộc)
- `LanguageSwitcher.tsx` — nút VI/EN/中 ở menu chính (đầy đủ) và màn Tạm nghỉ (compact); lựa chọn lưu ở `locheo.lang.v1`
- Localized: toàn bộ HUD canvas (điểm, kỷ lục, cấp, hũ/củ, combo, chip power, lắc hũ), banner, popup, ticker nguyên liệu, màn hình menu/pause/game over/thành tựu, `<html lang>` đồng bộ, số theo locale
- README thêm các bản 🇯🇵 日本語 · 🇰🇷 한국어 · 🇪🇸 Español · 🇫🇷 Français (tổng 7 ngôn ngữ) + mục FAQ, mục "Chuyển ngôn ngữ"
- `assets/demo.svg` (mô phỏng gameplay SMIL) + `assets/items.svg` (bảng 14 nguyên liệu)
- 9 unit tests cho i18n (mirror key set, placeholder, interpolation, persistence) — tổng **45 tests**

### Fixed
- Toàn bộ chuỗi hiển thị tiếng Việt bị hardcode (HUD/popup/banner/menu/pause/game over/thành tựu/ticker) nay đi qua dictionary — không còn sót chuỗi cứng
- `t()` cho phép override ngôn ngữ khi gọi (dùng cho engine canvas), không phụ thuộc React state
- `ScoreBoard` dùng chung locale số của ngôn ngữ đang chọn thay vì luôn `vi-VN`

### Changed
- `APP_VERSION` → **1.1.1**; README badges/cấu trúc cập nhật; `assets/banner.svg` hiển thị V1.1.1

## [1.1.0] — 2026-10-29

Bản đại tu: **3 chế độ chơi · Khiên Tỏi Vàng · Sâu Rau & Cải Vàng mới · 10 thành tựu cộng dồn · menu gradient/aurora · README 3 ngôn ngữ có animation · fonts tự host (offline thật) · 6 lỗi logic được sửa · 36 unit tests**.

→ Chi tiết đầy đủ: [docs/releases/v1.1.0.md](docs/releases/v1.1.0.md)

### Added
- Chế độ chơi: MUỐI DƯA CỔ ĐIỂN / THẢNH THƠI / ỚT LỬA (lưu `locheo.mode.v1`)
- Nguyên liệu: CẢI VÀNG (fill boost), TỎI VÀNG (khiên ×2), SÂU RAU (hazard)
- Hệ thống 10 thành tựu + progress cộng dồn (`locheo.achievements.v1`, `locheo.progress.v1`), toast "THÀNH TỰU MỚI!"
- HUD: chip khiên `TỎI VÀNG ×N`, nhãn chế độ ở đáy giữa màn hình
- Menu: aurora background, title shimmer, halo xoay quanh mascot, sheen CTA, gradient-border panel
- `src/styles/fonts.css` + `src/assets/fonts/*` — fonts tự host 100%
- `src/game/modes.ts`, `src/game/achievements.ts` (pure, có test)
- `src/components/ModeSelector.tsx`, `src/components/AchievementsPanel.tsx`
- `src/version.ts`, `assets/banner.svg` (animation), docs/releases/v1.0.0.md + v1.1.0.md, CONTRIBUTING.md, .gitignore
- 36 unit tests (vitest) + script `npm run check`

### Fixed
- Frenzy bị nhân đôi hai lần (thực tế ×4 → ×2) trên mọi nguồn điểm
- Popup "+300 MUỐI VÀNG" không khớp số thực nhận
- Ớt Hiểm không thưởng điểm khi kích hoạt frenzy
- Đốm mốc vẽ ngẫu nhiên mỗi frame → cố định theo từng item
- Storage: 1 entry lỗi kéo sập cả bảng điểm; dữ liệu không được validate đầy đủ
- README mô tả sai hoàn toàn dự án; fonts CDN phá offline-first; package.json mặc định; theme-color lệch

## [1.0.0] — 2026-10-26

Phát hành đầu tiên: engine hoàn chỉnh, 11 nguyên liệu, cơ chế CHÉO, LẮC HŨ, combo ×9, bảng vàng TOP 8, âm thanh Web Audio procedural.

→ Chi tiết đầy đủ: [docs/releases/v1.0.0.md](docs/releases/v1.0.0.md)

[1.1.7]: https://github.com/standardizeparadigm/Lo-CheoIO/releases/tag/v1.1.7
[1.1.6]: https://github.com/standardizeparadigm/Lo-CheoIO/releases/tag/v1.1.6
[1.1.5]: https://github.com/standardizeparadigm/Lo-CheoIO/releases/tag/v1.1.5
[1.1.4]: https://github.com/standardizeparadigm/Lo-CheoIO/releases/tag/v1.1.4
[1.1.3]: https://github.com/standardizeparadigm/Lo-CheoIO/releases/tag/v1.1.3
[1.1.2]: https://github.com/standardizeparadigm/Lo-CheoIO/releases/tag/v1.1.2
[1.1.1]: https://github.com/standardizeparadigm/Lo-CheoIO/releases/tag/v1.1.1
[1.1.0]: https://github.com/standardizeparadigm/Lo-CheoIO/releases/tag/v1.1.0
[1.0.0]: https://github.com/standardizeparadigm/Lo-CheoIO/releases/tag/v1.0.0
