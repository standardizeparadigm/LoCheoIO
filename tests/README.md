# `tests/` — unit tests (vitest)

**815 tests / 76 files.** Pure logic only — engine/canvas được phủ bởi `npm run check` (build) + `scripts/smoke-ssr.tsx` (SSR render smoke).

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
| `i18n.test.ts` | parity 7 locale × 304 keys + placeholders + number formats + `fmtNum` chịu NaN/thiếu Intl | import trực tiếp dict |
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
| `menu-decor.test.ts` | 14 món trang trí hero — số lượng, toạ độ trong khung, không chồng lên chữ, id duy nhất, hai dải trên/dưới | pure |
| `menu-ticker.test.ts` | dải chạy chữ — 14 chuỗi đủ cả 7 locale, `tickerTone()` thuần, không chuỗi rỗng, bản quyền cùng khối | pure |
| `menu-background.test.ts` | khoá bản sửa nền 1.1.7 — trần 8 lớp, id duy nhất, sàn trước vignette, nebula KHÔNG `inset-0`, blur ≤ 24px, đỉnh opacity ≤ 0.85, vignette phải 2 radial ở góc, khung CRT nhẹ hơn 140px@0.9 | fs + pure |
| `modes-split.test.ts` | sau khi tách `modes/`: 9 id đúng thứ tự, MODE_LIST ↔ MODES 1:1, mỗi record tự khai đúng id, đủ trường bắt buộc, knob tuỳ chọn hợp lệ, `isModeId` từ chối `"Classic"` | pure |

## Thêm test mới

1. Logic pure → test thẳng, không mock.
2. Cần localStorage → copy pattern `memStorage()` ở `storage.test.ts`, `vi.stubGlobal("localStorage", mem)` trong test, `vi.unstubAllGlobals()` ở `afterEach`.
3. Assert dữ liệu người dùng thật (điểm, combo) → luôn qua `normalize*` — đừng tin input.
4. Mọi con số trong tài liệu (test count, file count) phải khớp `npx vitest run` — xem `docs/guides/release-process.md`.

Chạy một file: `npx vitest run tests/<file>.test.ts`. Toàn bộ: `npm test` hoặc `npm run check`.
