# `tests/` — unit tests (vitest)

**999 tests / 100 files.** Pure logic only — engine/canvas được phủ bởi `npm run check` (build) + `scripts/smoke-ssr.tsx` (SSR render smoke).

| File | Phủ | Pattern |
| --- | --- | --- |
| `modes.test.ts` | balance math 9 chế độ, multiplier/combo, isModeId | pure |
| `achievements.test.ts` | checkAchievements + normalize | pure |
| `storage.test.ts` | scores/progress/achievements roundtrip, clearAllProgress, seed fallback | `memStorage()` + `vi.stubGlobal` |
| `settings.test.ts` | normalize/load/save/updateSettings garbage handling | `memStorage()` |
| `settings-v116.test.ts` | schema v1.1.6 — default âm lượng, roundtrip persist, save cũ thiếu field, JSON hỏng, clamp, idempotent normalize | `memStorage()` |
| `settingsIO.test.ts` | codec sao lưu — envelope roundtrip, object trần, JSON lạ bị từ chối, số phá hoang bị kẹp | pure |
| `settingsPresets.test.ts` | 4 preset, không chạm language, idempotent, `matchPreset` phát hiện tuỳ chỉnh | pure |
| `audioLevels.test.ts` | `unit`/`musicBusGain`/`sfxPeak`/`masterGain` + hồi quy bug bus 0.5 cố định | pure |
| `runSave.test.ts` | normalizeSavedRun (clamp/garbage), roundtrip, clearSavedRun | `memStorage()` |
| `i18n.test.ts` | parity 7 locale × 327 keys + placeholders + number formats + `fmtNum` chịu NaN/thiếu Intl | import trực tiếp dict |
| `i18n-v115.test.ts` | 53 key v1.1.5 tồn tại + placeholder khớp VI | import trực tiếp dict |
| `i18n-v116.test.ts` | 21 key settings v1.1.6 × 7 locale — tồn tại, không rỗng, không placeholder lạc | import trực tiếp dict |
| `i18n-settings-ui.test.ts` | hợp đồng UI↔i18n — mọi key `SettingsModal` gọi `t()` có ở cả 7 locale, nhãn preset ≤ 14 ký tự | import trực tiếp dict + preset catalogue |
| `settings-wiring.test.ts` | guard tĩnh — mỗi setting v1.1.6 phải được App áp (audio/engine/boot), auto-pause có gate, LanguageSwitcher đã xoá | đọc file qua `node:fs` |
| `mediaQuery.test.ts` | matchMedia thiếu/throw, nhánh `addListener` cũ (Safari < 14), unsubscribe | `vi.stubGlobal` |
| `languageMeta.test.ts` | 7 ngôn ngữ 1:1 với `LANGUAGES`/`SUPPORTED_LANGUAGES`, short code/native name unique, `metaFor` an toàn | pure |
| `safeStorage.test.ts` | lớp truy cập localStorage duy nhất — probe khả dụng, read/write/remove an toàn, JSON hỏng, object circular, `clearAllGameKeys` không đụng key lạ | `memStorage()` |
| `spawn.test.ts` | trọng số sinh vật phẩm — hazard/gold mult, chế độ deco, determinism, không rơi vào kind trọng số 0 | pure |
| `palette.test.ts` | 9 màu canvas phải khớp `--color-*` trong `index.css`, engine không giữ bảng màu riêng | fs + pure |
| `time.test.ts` | `fmtTime`/`fmtCountdown` — pad, floor, ván dài, NaN/âm | pure |
| `math.test.ts` | `clamp`/`clamp01`/`lerp`/`damp` — biên, NaN, 60↔120 Hz, không overshoot | pure |
| `clipboard.test.ts` | `copyText` trả true/false thay vì throw (thiếu API, bị từ chối) | stub `navigator` |
| `changelog.test.ts` | CHANGELOG_ENTRIES descending semver, unique, ISO dates | pure |
| `modes-balance.test.ts` | mode catalogue invariants (unique ids, positive mults, blitz timed-only, hardcore cracks-only, combo/feast math) | pure |
| `achievements-defs.test.ts` | catalogue integrity — unique ids, 16 entries, glyph/tone rules, MAP 1:1 | pure |
| `version-bump.test.ts` | version coherence — APP_VERSION = pkg = lock = changelog = README badges = release notes | fs |
| `storage-seed.test.ts` | SEED board trả về bản sao sâu khi trống / sau clearAllProgress | `memStorage()` |
| `i18n-modes.test.ts` | 9 chế độ × 4 key (name/tagline/desc/badge) hiện diện ở cả 7 locale + vi names unique | import trực tiếp dict |
| `storage-migrate.test.ts` | normalizeScores: hàng hỏng, id `imp-*`, cap-8, JSON corrupt → SEED, round/truncate | `memStorage()` |
| `changelog-tiers.test.ts` | `tierFor()` SemVer→tầng (major/minor/patch + đầu vào rác), tierCounts/entriesForTier, ≥5 gạch mỗi bản, gạch không trùng, dãy ngày nghiêm ngặt | pure |
| `changelog-ui.test.ts` | wiring UI changelog — modal dùng `tierFor` chứ không `entry.kind`, mỗi tầng một họ màu, 3 màu phân biệt, token violet/pink có trong theme, filter có `aria-pressed`, hint menu đọc `latestEntry()` | đọc file qua `node:fs` |
| `menu-layout.test.ts` | phép cộng chiều cao của màn hình bắt đầu — metrics <-> fit nhất quán, panel 318/458px, reserve đúng, plan cho 6 kích thước cửa sổ, và cấm ba lớp CSS từng gây lỗi cuộn quay lại (`flex-1 overflow-y-auto`, `min-h-full`, `justify-center`) | pure + fs |
| `layout-metrics.test.ts` | bảy hằng số không có assertion nào — mỗi cái là một số hạng trong `cornerPanelHeight()`; khẳng định **hai lần**: như tổng các số hạng của chính nó, và như số cụ thể (458/430) vì một đẳng thức vẫn đúng khi cả hai vế đều sai | pure |
| `layout-readme-table.test.ts` | bảng bảy viewport trong `layout/README.md` được **tính lại** từ `planMenuLayout()` — đọc từng hàng và so `reserve`/`scene`, cộng hai khối số học (458/430, 518/490) và bất biến `scene + reserve === height` | fs + pure |
| `adaptive-readme.test.ts` | bốn ngưỡng và năm số đo mà `adaptive/README.md` in ra, đối chiếu hằng số thật; đồng thời khẳng định README **vẫn còn** đoạn tự thừa nhận rằng các số đo đến từ class name của component chứ không từ thư mục này | fs |
| `panel-readme-table.test.ts` | bảng **bốn chế độ** panel trong `panel/README.md` — mỗi ô so với `cornerPanelHeight()`; bảng này phải viết lại lần hai vì bản đầu bịa bốn trong tám số bằng cách nội suy giữa hai số đúng | fs + pure |
| `catalogue-counts.test.ts` | ba con số **9 · 14 · 16** mà mười tài liệu in ra — đếm trực tiếp từ `MODE_LIST`, `KINDS`, `ACHIEVEMENTS`, và khẳng định id là duy nhất để một bản trùng không làm số đếm sai | pure |
| `key-count-docs.test.ts` | **327 key** — số trong bảng i18n; kiểm cả bảy locale cùng độ dài, và cấm 306/307 như một **tuyên bố hiện tại** trong hai hướng dẫn, trong khi vẫn giữ dòng so sánh lịch sử của release doc | fs + i18n |
| `readme-tree.test.ts` | cây thư mục trong `README.md` — không node nào (trừ `tests/`) được ghi số file của suite; và script sync vẫn còn bộ lọc `TREE` áp cạnh các bộ lọc khác | fs |
| `svg-counts.test.ts` | số trong **mọi** SVG — «308 / 36» từng nằm trong `test-matrix.svg` dưới một badge đúng, và không ai diff được một tấm ảnh; quét cả 20 file tìm ba dạng tuyên bố (test/file/khoá) | fs |
| `menu-decor.test.ts` | 14 món trang trí hero — số lượng, toạ độ trong khung, không chồng lên chữ, id duy nhất, hai dải trên/dưới | pure |
| `menu-ticker.test.ts` | dải chạy chữ — 14 chuỗi đủ cả 7 locale, `tickerTone()` thuần, không chuỗi rỗng, bản quyền cùng khối | pure |
| `menu-background.test.ts` | khoá bản sửa nền 1.1.7 — trần 8 lớp, id duy nhất, sàn trước vignette, nebula KHÔNG `inset-0`, blur ≤ 24px, đỉnh opacity ≤ 0.85, vignette phải 2 radial ở góc, khung CRT nhẹ hơn 140px@0.9 | fs + pure |
| `modes-split.test.ts` | sau khi tách `modes/`: 9 id đúng thứ tự, MODE_LIST ↔ MODES 1:1, mỗi record tự khai đúng id, đủ trường bắt buộc, knob tuỳ chọn hợp lệ, `isModeId` từ chối `"Classic"` | pure |
| `panel-summary.test.ts` | `summaryLines`/`summaryText`/`challengeLine` của panel INFO — kẹp NaN/±Infinity/âm, đúng ba dòng, và **sanitise mode id** (id rỗng hay lạ không được sinh key `mode..name`) | pure |
| `howto-rules.test.ts` | bảng «Cách chơi» đối chiếu **bảng dịch thật** qua `hasKey()` — sáu rule, số 1..6, id duy nhất, accent xoay vòng, mỗi thẻ dùng đúng key của số nó | pure + i18n |
| `layout-inset.test.ts` | `usableHeight()` và inset an toàn vùng — clamp [0, 200], NaN/âm/∞ → 0, và **một GIỚI HẠN ĐÃ BIẾT** được khẳng định bằng số đo (844×600: inset 0 → 222, inset 10 → 268) | pure |
| `hero-stacked-fit.test.ts` | lỗi cửa sổ hẹp, kiểm từ nguyên lý — wordmark + badge + live badge + mascot xếp chồng phải vừa `scene`, khoảng cách cộng đúng | pure |
| `environment.test.ts` | tín hiệu môi trường và bốn cách mỗi tín hiệu nói dối — `saneDpr` (NaN/âm/7), `parseInset`, `verticalInset`, `isHandheld` | pure |
| `use-environment.test.ts` | `useEnvironment()` với `window`/`document` giả (không jsdom) — hướng, dpr, `matchMedia` thiếu/throw, `pointer: coarse`, inset, padding không parse được, không có `body`, probe dọn khi throw | `vi.stubGlobal` |
| `viewport-events.test.ts` | danh sách sự kiện resize — không sót tiền tố nhà cung cấp, không trùng, huỷ đăng ký đúng cặp | pure |
| `layout-fit.test.ts` | `planFits`/`occupiesExactly` — scene + reserve, kinh tế, ngưỡng min/tight, `sceneFor` sàn khi crop | pure |
| `layout-guards.test.ts` | chốt chặn đầu vào hình học — NaN, âm, ∞, số vô lý không được tạo plan rác | pure |
| `menu-adaptive.test.ts` | quét **1 682 viewport** và khẳng định `heroContentHeight(layout) ≤ scene` ở từng mẫu | pure |
| `menu-panel.test.ts` | panel góc — chiều cao 318/458, bảy hàng, `cornerRowReserve`, co theo `compact` | pure |
| `menu-row.test.ts` | hàng panel — nhãn, icon, trạng thái khoá, không tràn khi nhãn dài nhất | pure |
| `menu-chrome.test.ts` | dải chrome tuyệt đối — không phải flex sibling của hero, chiều cao khớp `reserve` | pure + fs |
| `menu-no-scroll.test.ts` | cấm tái phát lỗi cuộn — một vùng cuộn, neo trên, không `justify-center`/`min-h-full`/`flex-1` | fs |
| `menu-about.test.ts` | modal About — mọi mục có key i18n thật, thứ tự ổn định | pure + i18n |
| `menu-about-sections.test.ts` | **dữ liệu** của modal About — ba mục đúng thứ tự, rule ở mọi mục trừ mục đầu, mỗi mục có ít nhất một đoạn, mọi key tồn tại | pure + i18n |
| `panel-gap-docs.test.ts` | khoảng trống 240px từng được ghi bằng **ba số khác nhau** trong docs và comment — test grep các cụm sai và khẳng định cả ba khung (458/278/218) có mặt để người đọc tự suy ra 240 | fs |
| `menu-shortcuts.test.ts` | bảng phím tắt trong modal khớp bảng điều khiển ở README | fs |
| `panel-stat.test.ts` | `stat.ts` — kẹp 18/16 xuống 16/16, tầng lấy từ `tierFor`, không NaN | pure |
| `panel-slack.test.ts` | khoảng thở của panel — reserve ≥ nội dung ở mọi economy đã biết | pure |
| `a11y-claims.test.ts` | hướng dẫn trợ năng nói về mã nguồn, nên mã nguồn được kiểm — mọi khẳng định trong `docs/design/a11y.md` phải có thật | fs |
| `focus-trap.test.ts` | `useFocusTrap` — Tab/Shift+Tab quấn vòng, Esc đóng, focus trả về nơi xuất phát | fake DOM |
| `keyboard-guide.test.ts` | bảng điều khiển trong README khớp phím thật trong mã nguồn | fs |
| `i18n-interpolate.test.ts` | `{param}` — thiếu tham số, tham số thừa, dấu ngoặc lồng, chuỗi rỗng | pure |
| `i18n-prototype.test.ts` | key trùng tên thành viên `Object.prototype` (`toString`, `constructor`) không được lọt ra ngoài | pure |
| `language-meta-prototype.test.ts` | cùng lớp lỗi ấy ở `languageMeta` — tra cứu không dùng `in` | pure |
| `glossary.test.ts` | bảng thuật ngữ kỹ thuật phải gọi tên thứ có thật trong mã nguồn | fs |
| `barrels.test.ts` | mỗi thư mục có barrel, và barrel không xuất thứ không tồn tại | fs |
| `barrel-contract.test.ts` | sáu barrel không ai import vẫn phải đúng hợp đồng, để lần import đầu tiên không nổ | fs |
| `folder-readmes.test.ts` | mỗi thư mục dưới `src/` có README phải mô tả **mọi** file trong đó | fs |
| `docs-counts.test.ts` | số trong tài liệu phải khớp mã nguồn — không tài liệu hiện hành nào được ghi dưới sàn test, không tài liệu nào nói số key i18n cũ | fs |
| `smoke-coverage.test.ts` | hình dạng của cổng `npm run smoke` — bốn màn hình trong ván có mặt, fixture `RUN_STATS` là một ván thật chứ không phải toàn số 0 (số 0 đi vào nhánh rỗng, tức là màn hình không ai thấy) | fs |
| `docs-numbers.test.ts` | mười README và doc release trích số file/số test — đọc `tests/` và đối chiếu | fs |
| `numeric-guards-doc.test.ts` | hướng dẫn về chặn số phải khớp các hàm chặn thật | fs |
| `storage-doc.test.ts` | tài liệu storage khớp schema thật trong `storage.ts` | fs |
| `storage-keys-doc.test.ts` | `storage-keys.md` mở đầu bằng "**toàn bộ** key", nên nó được kiểm **hai chiều** với `STORAGE_KEYS`: key nào trong mã cũng phải có trong bảng, và key nào trong bảng cũng phải còn được ghi | fs |
| `modes-balance-doc.test.ts` | bảng cân bằng trong docs khớp hệ số trong `modes/*.ts` | fs |
| `changelog-dates.test.ts` | ba nguồn ngày phải đồng ý — `entries/*.ts`, `docs/releases/v*.md`, và heading `CHANGELOG.md`; cộng anchor trỏ đúng | fs |
| `release-timeline-doc.test.ts` | dòng cadence trong `v1.1.8.md` khớp entry, và nhịp **có hình dạng của thật** (1–5 ngày, có hotfix, ≤ 2 cuối tuần) | fs |
| `settings-import-merge.test.ts` | nhập JSON cài đặt — merge, không ghi đè ngoài phạm vi, chịu file hỏng | pure |
| `settings-presets-guard.test.ts` | preset không được chạm `language`, không chạm dữ liệu người chơi | pure |
| `daily-challenge.test.ts` | thử thách hôm nay — số ngày theo giờ địa phương, `mix()` tất định, target trong khoảng, danh mục rỗng vẫn hợp lệ | pure |
| `tip-index.test.ts` | mẹo trong ngày — chỉ số quấn vòng, không âm, không lặp trước khi hết danh sách | pure |
| `engine-resize.test.ts` | `LoCheoGame.resize` — nơi duy nhất kích thước canvas đi vào engine; DPR kẹp, không phóng to quá 2 | pure |
| `wordmark-scale.test.ts` | `lockupWidth` — 300 @375, 374 @768, 427 @≥1024, và không bao giờ nhỏ hơn sàn | pure |
| `wordmark-diacritics.test.ts` | dấu nặng của `LỌ` — ba thứ cộng lại (font, line-height, padding) không được quay lại | pure + fs |
| `palette-contrast.test.ts` | tương phản chữ/nền đạt WCAG AA trên mọi cặp màu dùng thật | pure |
| `assets-round-two.test.ts` | ba SVG của vòng hai — tồn tại, được tham chiếu, có animation | fs |
| `mode-math.test.ts` | toán của chế độ — time limit, combo window, jar bonus, không chia cho 0 | pure |
| `mode-multiplier.test.ts` | chín hệ số nhân khớp bảng công bố trong docs | pure |
| `storage-normalise.test.ts` | chuẩn hoá bản ghi — làm tròn, cắt tên, kẹp ngày, không NaN | `memStorage()` |
| `input-release.test.ts` | lỗi "hũ tự đi" — `releaseAllInput()` phải xoá **cả bảy** trường, và phải được gọi từ cả `blur` lẫn `visibilitychange`; đọc mã nguồn nên không cần DOM | fs |

## Thêm test mới

1. Logic pure → test thẳng, không mock.
2. Cần localStorage → copy pattern `memStorage()` ở `storage.test.ts`, `vi.stubGlobal("localStorage", mem)` trong test, `vi.unstubAllGlobals()` ở `afterEach`.
3. Assert dữ liệu người dùng thật (điểm, combo) → luôn qua `normalize*` — đừng tin input.
4. Mọi con số trong tài liệu (test count, file count) phải khớp `npx vitest run` — xem `docs/guides/release-process.md`.

Chạy một file: `npx vitest run tests/<file>.test.ts`. Toàn bộ: `npm test` hoặc `npm run check`.
