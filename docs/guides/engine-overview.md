# Engine overview — `src/game/engine.ts`

File lớn nhất repo (~2.2k lines). Tài liệu này là bản đồ, không phải hướng dẫn sửa code.

## Vòng đời instance

```
new LoCheoGame(canvas)      → đo canvas, listeners, assets, phase = "menu"
  ├─ setMode(modeId)        → lưu mode + persist (App cũng persist)
  ├─ start()                → resetRun() + phase = "playing"
  ├─ togglePause()          → phase paused ↔ playing
  ├─ captureRun()           → SavedRun (suspend) — xem save-format.md
  ├─ restoreRun(saved)      → resetRun() + inject + invuln 1.2s + phase playing
  ├─ toMenu()               → phase = "menu" + resetRun()
  └─ gameOver()             → phase = "gameover" + emit stats qua onGameOver
```

## Phase machine

`menu → playing ↔ paused → gameover → (restart) playing`

`App.tsx` đăng ký `onPhase` để render đúng screen; engine không biết React.

## Hệ thống chính

1. **Spawner** — trọng lượng theo `MODES[mode]` (`spawnMult`, `hazardMult`, `goldMult`), golden table tách riêng; spawn stagger 1.1s khi resume.
2. **Tương tác lọ × đồ** — hitbox circle sweep; catch (dưa) vs avoid (mốc/ruồi/sâu) vs SLAM (hit bất cứ đồ nào gần + hút item vàng).
3. **Combo** — window `COMBO_WINDOW × comboWindowFor(mode)`; multiplier `multiplierForCombo`; `frenzy` (Ớt Hiểm) nhân 2 và đổi tốc rơi.
4. **Jar integrity** — `cracks` tăng theo hazard; `MAX_CRACKS` (mode override `maxCracks`); vỡ → gameover với animation shatter.
5. **Powers** — ` Đá Lạnh` (slow-mo timeScale), `Tỏi Vàng` (shield charge), `Cải Vàng` (fill ×rate), `Muối Vàng` (instant fill burst).
6. **Screen feedback** — `trauma` (shake, quadratic falloff), `flash` + `flashColor` (fill overlay), popup texts, splat decals, bubbles/stars ambient.

## Render pipeline (thứ tự vẽ)

1. clear + camera shake transform (`trauma²`)
2. background parallax (`bg` image, clamp ±30px)
3. bubbles, stars, decals (splat dưa)
4. mode tint overlay (`MODES[mode].tint` nếu có)
5. items, jar (fill/cracks/shield), player trail, SLAM ring
6. HUD (score, combo, stamina, level, jars), popups, banner
7. flash overlay (`flash * flashScale`)

## Hooks mở rộng cho "meta" features

- `setShakeEnabled(bool)` — nhân `shakeScale` (0 = cứng đơ)
- `setReducedMotion(bool)` — `flashScale` 0.25, trauma cap 0.12
- `captureRun()` / `restoreRun()` — snapshot/restore (không serialize field items)

## Pure vs impure (v1.1.6)

`engine.ts` từng nhốt trong mình cả ba thứ *thuần logic*: bảng màu, trọng số spawn, và các phép nội suy.
v1.1.6 tách chúng ra thành module riêng — engine chỉ còn gọi hàm:

| Module | Vai trò | Test |
| --- | --- | --- |
| `game/palette.ts` | 9 màu, mirror `--color-*` của CSS | `palette.test.ts` |
| `game/spawn.ts` | `itemWeight` / `weightedPick` / `weightTable` — `pickKind()` chỉ còn một dòng gọi | `spawn.test.ts` |
| `utils/math.ts` | `clamp` / `clamp01` / `lerp` / `damp` | `math.test.ts` |
| `game/safeStorage.ts` | đọc/ghi localStorage an toàn | `safeStorage.test.ts` |

- **Pure** (unit-test không cần canvas): `modes.ts`, `achievements.ts`, `palette.ts`, `spawn.ts`,
  `storage.ts`, `safeStorage.ts`, `settings.ts`, `settingsIO.ts`, `settingsPresets.ts`, `audioLevels.ts`,
  `runSave.ts`, `changelog/`, `modes/`, `utils/*` → phủ bởi toàn bộ test của suite.
  *(Con số cụ thể không ghi ở đây: nó đổi mỗi vòng và không ai đọc lại dòng này.)*
- **Impure** (engine, audio, GameCanvas): kiểm chứng qua typecheck + build + SSR smoke + chơi thật.

## Những chỗ đổi hành vi ở v1.1.6

1. **`pickKind()`** — fallback khi vòng lặp rơi hết giờ chọn kind cuối **có trọng số dương** (trước: kind cuối
   mảng, có thể là `sau` khối lượng 0 ở cấp thấp).
2. **Nội suy** — mọi `lerp(x, target, Math.min(1, dt*k))` đổi thành `damp(x, target, k, dt)`; hành vi giống
   nhau ở 60 Hz nhưng đúng ở 120/144 Hz và không overshoot sau khung hình dài.
3. **`setReducedMotion`** — ngoài `flashScale`/trauma cap, canvas còn mang `data-reduced-motion="true"`
   để CSS tắt animation trong scene.
