# `docs/` — tài liệu Lọ Chéo

## Release notes (historical + current)

**Mười bản**: `releases/v1.0.0.md` → `releases/v1.1.8.md`. Bản hiện hành là **v1.1.8** — màn hình bắt đầu hết tràn (một phép cộng chiều cao sai), lỗi cuộn lồng được sửa, «Cách chơi» vào menu GAME, hero có 14 món trang trí. Các bản cũ giữ nguyên (historical), chỉ đính chính fact-sai nghiêm trọng nếu có.

Mỗi bản có một **tầng** (suy ra từ SemVer, xem `docs/guides/release-process.md` § Tầng phát hành) — đúng quy ước mà panel CHANGELOG trong game dùng:

| Bản | Tầng | Nội dung chính | Tests lúc phát hành |
| --- | --- | --- | --- |
| [v1.1.8](releases/v1.1.8.md) | 🟣 PATCH | Màn hình bắt đầu hết tràn · lỗi cuộn lồng · «Cách chơi» vào menu GAME · hero 14 trang trí · `menu/{layout,scene,ticker,howto}/` | 839 / 78 file |
| [v1.1.7](releases/v1.1.7.md) | 🟣 PATCH | Nền menu hết mờ (4 lớp) · changelog chia tầng · 96 gạch mô tả mới · tách `src/game/changelog/` | 256 / 33 file |
| [v1.1.6](releases/v1.1.6.md) | 🟣 PATCH | Settings 6 mục · preset · backup JSON · a11y pass | 222 / 29 file |
| [v1.1.5](releases/v1.1.5.md) | 🟣 PATCH | Panel góc GAME/INFO, Chơi tiếp ván dở | 113 |
| [v1.1.4](releases/v1.1.4.md) | 🟣 PATCH | 2 chế độ mới (Lễ Hội Combo · Đại Tiệc Dưa) · 7 ngôn ngữ | 61 |
| [v1.1.3](releases/v1.1.3.md) | 🟣 PATCH | Mưa Dưa · Gốm Mỏng · 5 ngôn ngữ · favicon | 55 |
| [v1.1.2](releases/v1.1.2.md) | 🟣 PATCH | Đua 60 Giây · Mùa Vàng · launcher double-click | 49 |
| [v1.1.1](releases/v1.1.1.md) | 🟣 PATCH | i18n VI/EN/ZH · build một file · quét lỗi | 45 |
| [v1.1.0](releases/v1.1.0.md) | 🟡 UPDATE | 3 chế độ · 10 thành tựu · menu aurora · font tự host | — |
| [v1.0.0](releases/v1.0.0.md) | 🩷 MAJOR | Bản đầu tiên: engine, 11 nguyên liệu, LẮC HŨ | — |

## Design docs (`design/`)

- `menu-corners.md` — triết lý 2 panel góc GAME/INFO, a11y, responsive.
- `menu-icons.md` — bộ icon SVG tự vẽ cho panel góc (grid 24px, stroke 2.2).
- `menu-scene.md` — 8 lớp nền menu (tinh vân, sao, sàn gạch, vòng sáng…) + ngân sách render, **kèm mục "Độ tương phản" của v1.1.7** và mục bố cục hero của v1.1.8.
- `modes-balance.md` — bảng cân bằng 9 chế độ + cách chỉnh số.
- `save-format.md` — spec `locheo.run.v1` (snapshot ván dở).
- `settings-format.md` — spec `locheo.settings.v1` (v1.1.6: 10 field, 6 mục UI).
- `changelog-format.md` — spec module `src/game/changelog/` + ánh xạ tầng → màu (v1.1.8).
- `adaptive-layout.md` — **hợp đồng** giữa `menu/layout/` và `menu/adaptive/`: ba bất biến, bốn ngưỡng và cột "nếu đặt sai thì hỏng gì" (v1.1.8, vòng 6).

## Hướng dẫn contributor (`guides/`)

| Guide | Dành cho |
| --- | --- |
| `engine-overview.md` | Đọc engine lần đầu (phase machine, render pipeline, pure/impure) |
| `keyboard-shortcuts.md` | Phím tắt + touch + modal-swallow semantics |
| `storage-keys.md` | Inventory 8 key localStorage + wipe semantics + lớp `safeStorage` |
| `accessibility.md` | A11y hiện có, hạn chế, quy tắc khi thêm UI |
| `performance.md` | Ngân sách render + cách đo |
| `adding-a-locale.md` | Thêm/sửa 1 ngôn ngữ (parity rules) |
| `release-process.md` | Playbook phát hành 1 version (học từ v1.1.5, 1.1.7 và 1.1.8) — gồm bảng tầng PATCH/UPDATE/MAJOR |
| `glossary.md` | Từ vựng game cho translator |
| `troubleshooting.md` | Sự cố thường gặp — đen màn hình, audio, «Chơi tiếp», launcher, build |
| `redrawing-an-asset.md` | Vẽ lại một hình trong `assets/` — sàn chất lượng, bốn lỗi đã gặp, vì sao SMIL chứ không CSS |
| `numeric-guards.md` | Chặn số hỏng — vì sao `Math.max(0, x)` không phải guard, và năm lỗi thật của vòng 6 |

## Khác

- `assets.md` — kho 20 SVG SMIL (banner, corner-menu, **palette-ribbon, architecture, release-tiers**…) + quy ước thêm/sửa.
- `DESCRIPTION.md` — mô tả ngắn cho dev/cộng đồng.
