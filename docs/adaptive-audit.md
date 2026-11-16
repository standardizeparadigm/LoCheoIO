# Kiểm toán adaptive — không gian cửa sổ

> Tệp này **được sinh tự động** từ `resolveAdaptive()` — hàm mà ứng dụng thật dùng để vẽ. Đừng sửa tay:
> `npm run audit:adaptive -- --write` ghi lại, `npm run audit:adaptive -- --check` báo lỗi nếu tệp lệch.

| | |
| --- | --- |
| **Cửa sổ đã kiểm** | **578** (21 preset + lưới theo breakpoint) |
| **Vi phạm hợp đồng** | **0** |
| **Chỉ còn chữ LỌ CHÉO** | 101 (17%) |
| **Hero hàng / cột** | 170 / 408 |
| **Kết luận** | ✅ không cửa sổ nào phá hợp đồng |

## 1. Hợp đồng

Không có vi phạm nào trên 578 cửa sổ. Con số này là **0**, không phải "chưa kiểm": mỗi cửa sổ ở trên đều đã chạy hết 14 bất biến của `constraints.ts`.

## 2. Những gì bố cục đã nhường

Đây là **thương lượng, không phải lỗi**: cửa sổ nhỏ thì phải bỏ thứ gì đó.

### 2.1 Thương lượng theo mã

| Khoá | Cửa sổ | Tỉ lệ | |
| --- | --- | --- | --- |
| `no-ticker` | 176 | 30% | ████████████████████████████████████████ |
| `dialog-compact` | 126 | 22% | █████████████████████████████··········· |
| `no-footer` | 126 | 22% | █████████████████████████████··········· |
| `panels-stacked` | 117 | 20% | ███████████████████████████············· |
| `jar-at-floor` | 113 | 20% | ██████████████████████████·············· |
| `minimal` | 101 | 17% | ███████████████████████················· |
| `crop` | 25 | 4% | ██████·································· |

### 2.2 Kiểu khít

| Khoá | Cửa sổ | Tỉ lệ | |
| --- | --- | --- | --- |
| `none` | 277 | 48% | ████████████████████████████████████████ |
| `squeeze` | 276 | 48% | ████████████████████████████████████████ |
| `crop` | 25 | 4% | ████···································· |

### 2.3 Mật độ chrome

| Khoá | Cửa sổ | Tỉ lệ | |
| --- | --- | --- | --- |
| `comfortable` | 250 | 43% | ████████████████████████████████████████ |
| `spacious` | 152 | 26% | ████████████████████████················ |
| `minimal` | 126 | 22% | ████████████████████···················· |
| `tight` | 50 | 9% | ████████································ |

### 2.4 Bậc kích thước

| Khoá | Cửa sổ | Tỉ lệ | |
| --- | --- | --- | --- |
| `md` | 249 | 43% | ████████████████████████████████████████ |
| `sm` | 132 | 23% | █████████████████████··················· |
| `lg` | 110 | 19% | ██████████████████······················ |
| `xs` | 47 | 8% | ████████································ |
| `xl` | 30 | 5% | █████··································· |
| `xxl` | 10 | 2% | ██······································ |

### 2.5 Nấc của chip chế độ

| Khoá | Cửa sổ | Tỉ lệ | |
| --- | --- | --- | --- |
| `full` | 477 | 83% | ████████████████████████████████████████ |
| `hidden` | 101 | 17% | ████████································ |

## 3. Hai đầu của không gian

| | Giá trị | Cửa sổ |
| --- | --- | --- |
| Scene nhỏ nhất | 140px | 320×320 |
| Scene lớn nhất | 1642px | 3840×2160 |
| Reserve nhỏ nhất | 216px | 320×480 |
| Room chật nhất | 0 | 320×320 |

## 4. 21 preset, đọc từ profile thật

| Preset | Cửa sổ | Box | Tầng | Mật độ | Scene | Reserve | Khít | Hero | Chip |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `iphone-4` | 320×480 | 320×480 · portrait · portrait | xs | minimal | 264 | 216 | squeeze | cột | full |
| `iphone-se-1` | 320×568 | 320×568 · portrait · portrait | xs | tight | 294 | 274 | squeeze | cột | full |
| `android-small` | 360×640 | 360×640 · portrait · portrait | sm | comfortable | 262 | 378 | squeeze | cột | full |
| `iphone-se-2` | 375×667 | 375×667 · portrait · portrait | sm | comfortable | 289 | 378 | squeeze | cột | full |
| `iphone-12` | 390×844 | 390×844 · tall · portrait | sm | spacious | 326 | 518 | none | cột | full |
| `phone-landscape` | 844×390 | 844×390 · ultrawide · landscape | sm | minimal | 174 | 216 | squeeze | cột | hidden |
| `iphone-max` | 414×896 | 414×896 · tall · portrait | sm | spacious | 378 | 518 | none | cột | full |
| `short-window` | 900×500 | 900×500 · wide · landscape | md | tight | 226 | 274 | squeeze | cột | full |
| `laptop-small` | 1024×600 | 1024×600 · wide · landscape | md | comfortable | 222 | 378 | squeeze | cột | full |
| `720p-chrome` | 1280×640 | 1280×640 · ultrawide · landscape | md | comfortable | 262 | 378 | squeeze | hàng | full |
| `window-1366` | 1366×650 | 1366×650 · ultrawide · landscape | md | comfortable | 272 | 378 | squeeze | hàng | full |
| `window-1568` | 1568×677 | 1568×677 · ultrawide · landscape | md | comfortable | 299 | 378 | squeeze | hàng | full |
| `720p` | 1280×720 | 1280×720 · wide · landscape | lg | comfortable | 342 | 378 | none | hàng | full |
| `ipad-portrait` | 768×1024 | 768×1024 · portrait · portrait | lg | spacious | 506 | 518 | none | cột | full |
| `ipad-landscape` | 1024×768 | 1024×768 · wide · landscape | lg | comfortable | 390 | 378 | none | hàng | full |
| `laptop-1366` | 1366×768 | 1366×768 · wide · landscape | lg | comfortable | 390 | 378 | none | hàng | full |
| `window-1920` | 1920×820 | 1920×820 · ultrawide · landscape | lg | comfortable | 442 | 378 | none | hàng | full |
| `macbook-air` | 1440×900 | 1440×900 · wide · landscape | lg | spacious | 382 | 518 | none | hàng | full |
| `1080p` | 1920×1080 | 1920×1080 · wide · landscape | xl | spacious | 562 | 518 | none | hàng | full |
| `1440p` | 2560×1440 | 2560×1440 · wide · landscape | xxl | spacious | 922 | 518 | none | hàng | full |
| `4k` | 3840×2160 | 3840×2160 · wide · landscape | xxl | spacious | 1642 | 518 | none | hàng | full |

## 5. Chạy lại

```bash
npm run audit:adaptive            # in bảng tóm tắt
npm run audit:adaptive -- --json  # toàn bộ report, cho máy đọc
npm run audit:adaptive -- --check # lỗi nếu tệp này lệch
npm run audit:adaptive -- --write # ghi lại tệp này
```
