# Modes balance — công thức & triết lý cân bằng 9 chế độ

Nguồn sự thật: `src/game/modes/<id>.ts` (một file mỗi chế độ, từ v1.1.7 — trước đó là `src/game/modes.ts`) ·
công thức trong `src/game/modeMath.ts` · test `tests/modes.test.ts` & `tests/modes-balance.test.ts` &
`tests/modes-split.test.ts`.

## Bảng số nhanh (đọc trực tiếp từ 9 file record)

| # | Chế độ | `id` | score | speed | hazard | spawn | knob riêng |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | MUỐI DƯA CỔ ĐIỂN | `classic` | ×1.0 | ×1.0 | ×1.0 | ×1.0 | — |
| 2 | THẢNH THƠI | `zen` | ×0.5 | ×0.8 | ×0 | ×1.08 | hazard tắt hẳn |
| 3 | ỚT LỬA | `inferno` | ×1.5 | ×1.35 | ×1.8 | ×0.85 | — |
| 4 | ĐUA 60 GIÂY | `blitz` | ×1.25 | ×1.12 | ×1.2 | ×0.9 | `timeLimit: 60` |
| 5 | MÙA VÀNG | `goldrush` | ×1.0 | ×1.0 | ×1.0 | ×0.95 | `goldMult: 2.6` |
| 6 | MƯA DƯA | `storm` | ×0.75 | ×0.88 | ×1.5 | ×0.72 | — |
| 7 | GỐM MỎNG | `hardcore` | ×2.0 | ×1.1 | ×1.3 | ×0.95 | `maxCracks: 1` |
| 8 | LỄ HỘI COMBO | `combo` | ×1.15 | ×1.05 | ×1.25 | ×0.92 | `comboWindowMult: 2` |
| 9 | ĐẠI TIỆC DƯA | `feast` | ×0.6 | ×0.78 | ×1.15 | ×0.6 | `jarBonusMult: 2.5` |

> Bảng này **phải khớp** `src/game/modes/*.ts`; `tests/modes-split.test.ts` khoá sự tồn tại và
> thứ tự, `tests/modes-balance.test.ts` khoá các con số. Khi chỉnh cân bằng, sửa file record —
> đừng sửa engine.

## Công thức lõi

```
incoming rate   = baseSpawn(level) × spawnMult
fall speed      = (186 + level × 18) × S × def.speed × speedMult × (frenzy ? 1.12 : 1)
hazard weight   = def.weight(level) × hazardMult × (level < requiredLevel ? 0 : 1)
gold weight     = def.weight(level) × (goldMult ?? 1)        (nếu def.power || def.fillBoost)
score           = round(def.pts × comboMult(combo, frenzy) × scoreMult)
jar bonus       = jarBonusFor(level, mode)      ← 200 + level×50, rồi × multOf(mode, jarBonusMult)
combo window    = comboWindowFor(mode)          ← COMBO_WINDOW (2.7s) × multOf(mode, comboWindowMult)
```

## Hệ số: `multOf()`, không phải `?? 1`

Dòng công thức cũ ghi `(jarBonusMult ?? 1)` — và đó **chính là mã cũ**, trước khi
sửa. `?? 1` chỉ chặn `undefined` và `null`:

| Giá trị `jarBonusMult` | `?? 1` cho | `multOf()` cho | Vì sao |
| --- | --- | --- | --- |
| `undefined` | 1 | 1 | đúng cả hai |
| `0` | **1** | **0** | chế độ "không thưởng hũ" là thiết kế hợp lệ |
| `Infinity` | **Infinity** | 1 | thưởng hũ vô hạn |
| `NaN` | **NaN** | 1 | `NaN` lan vào điểm |
| `-2` | **-2** | 1 | thưởng âm |
| `"2"` (chuỗi) | **"2"** | 1 | phép nhân với chuỗi vẫn ra số, nhưng không phải hệ số |

Và `comboWindowFor("không-tồn-tại")` còn ném `TypeError` **trong vòng tick của
engine** trước khi sửa — xem `multOf()` trong `src/game/modeMath.ts` và
`tests/mode-multiplier.test.ts` (12 test).

## Triết lý thiết kế

1. **Mỗi chế độ một câu chuyện**, không phải một "độ khó" tuyến tính:
   - **Cổ Điển** — cân bằng, chuẩn để học CHÉO.
   - **Thảnh Thơi** (`zen`) — hazard ×0: đọc combo, thư giãn.
   - **Ớt Lửa** (`inferno`) — nhanh + hazard nhiều + ×1.5: risk/reward.
   - **Đua 60 Giây** (`blitz`) — `timeLimit: 60`: điểm/phút, adrenaline thuần.
   - **Mùa Vàng** (`goldrush`) — gold ×2.6: power fantasy, buff stack.
   - **Mưa Dưa** (`storm`) — spawn dày × hazard nhiều ×0.75 điểm: lụt, leo cấp nhanh.
   - **Gốm Mỏng** (`hardcore`) — `maxCracks: 1`, ×2.0: một cú là xong.
   - **Lễ Hội Combo** (`combo`) — `comboWindowMult: 2` +15%/củ: giữ dây.
   - **Đại Tiệc Dưa** (`feast`) — dày ×0.78 speed ×0.6 điểm + hũ ×2.5: trồng lúa.
2. **Điểm không phải tất cả** — combo multiplier là nguồn bùng nổ thật sự; nên mọi mode buff combo window (`combo`) hoặc nhân phạt hazard.
3. **Gold powers luôn khan hiếm** (`goldMult ≤ ~2.6`) — nếu power thành spam, game mất nhịp.
4. **Không bao giờ solo-buff**: mọi chế độ mạnh đều có counterweight (blitz: clock; inferno: hazard; feast: điểm thấp; combo: hazard ×1.25).

## Invariants được test ép

- `spawnMult` / `speedMult` / `scoreMult` > 0; `hazardMult ≥ 0` (zen = 0 là hợp lệ).
- `blitz` là chế độ duy nhất có `timeLimit`; `hardcore` duy nhất có `maxCracks`.
- `MODE_LIST` ids unique, khớp `Object.keys(MODES)`.
- Combo multiplier monotonic non-decreasing, frenzy ≥ normal.
- `comboWindowFor("combo") === COMBO_WINDOW × 2`.
- `jarBonusFor(lvl, "feast") === jarBonusFor(lvl, "classic") × 2.5`.

## Khi thêm chế độ thứ 10

1. Thêm vào `ModeId` union + `MODES` + `MODE_LIST` (vị trí = thứ tự hiển thị).
2. Thêm 4 key × 7 locale (`mode.<id>.name/tagline/desc/badge`) — `tests/i18n-modes.test.ts` ép.
3. Thêm achievement riêng nếu chế độ có fantasy độc đáo (như `feast-3jars`).
4. Ghi quyết định cân bằng vào file này + cập nhật `modes.svg` asset + README what's-new.
