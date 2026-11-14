# Spec: module `src/game/changelog/` — in-game changelog (v1.1.7)

> Trước v1.1.7: một file `src/game/changelog.ts` ~300 dòng, chín object lồng
> nhau, mỗi bản một dòng tóm tắt. Sau v1.1.7: một thư mục, mỗi bản một file,
> tầng phát hành suy ra từ SemVer.

## 1. Vì sao tách

| Vấn đề của file đơn | Hệ quả |
| --- | --- |
| 9 object × 2 ngôn ngữ × (1 tóm tắt + n gạch) trong 1 file | diff của mỗi bản trộn vào nhau, review không đọc được |
| Thêm bản mới = chèn 40–60 dòng vào giữa file 300 dòng | conflict với mọi nhánh đang mở |
| `kind: "feature" \| "fix" \| "polish"` viết tay | đã lệch thực tế ít nhất 2 lần (1.1.3, 1.1.5) |
| Không có helper tra cứu | UI phải `filter`/`find` tại chỗ |

## 2. Cấu trúc

```
src/game/changelog/
├── types.ts        ChangelogEntry · ReleaseTier · LegacyKind · copyFor()
├── tiers.ts        tierFor() · TIER_ORDER · TIER_LABEL_KEY
├── entries/
│   ├── v1_0_0.ts   … 10 file, mỗi file export một hằng `V1_x_y: ChangelogEntry`
│   └── v1_1_8.ts
└── index.ts        CHANGELOG_ENTRIES (thứ tự render) + 5 helper
```

`index.ts` là **nguồn thứ tự duy nhất**. Thứ tự render = thứ tự khai báo trong
mảng, và `tests/changelog.test.ts` bắt buộc mảng đó giảm dần nghiêm ngặt theo
SemVer.

## 3. Hợp đồng dữ liệu

```ts
export interface ChangelogEntry {
  version: string;              // SemVer, giảm dần trong mảng
  date: string;                 // ISO YYYY-MM-DD
  kind: LegacyKind;             // @deprecated — KHÔNG đọc khi render
  vi: string;  en: string;      // tóm tắt một dòng
  itemsVi: readonly string[];   // nguồn sự thật
  itemsEn: readonly string[];   // bản gương, cùng độ dài
}
```

Quy tắc bắt buộc (đều có test):

1. `itemsVi.length === itemsEn.length`
2. `itemsVi.length >= 5` — không bản nào được "mỏng"
3. Không gạch nào trùng nhau trong cùng một bản
4. `date` giảm dần nghiêm ngặt giữa các bản
5. `version` khớp `^\d+\.\d+\.\d+$`

## 4. Tầng phát hành

```ts
tierFor("1.0.0") // "major"   patch === 0 && minor === 0
tierFor("1.1.0") // "minor"   patch === 0
tierFor("1.1.8") // "patch"   patch !== 0
tierFor("junk")  // "patch"   không ném lỗi — hàm này chạy trong render
```

| Tầng | Nhãn UI | Token CSS | Hằng màu | Vai trò thị giác |
| --- | --- | --- | --- | --- |
| `major` | MAJOR | `pink-500` / `pink-400` / `pink-600` | `#ff5fb0` | ồn nhất — viền trái, chấm mốc và quầng sáng hồng |
| `minor` | UPDATE | `tumeric-500` | `#f5a81c` | màu thương hiệu — bản "nâng cấp" thường gặp |
| `patch` | PATCH | `violet-500` / `violet-400` | `#9d6bff` | lặng nhất — bản vá hằng ngày |

`tierFor()` **không** đọc `kind`. Nhờ vậy nhãn trên màn hình không thể lệch khỏi
số phiên bản in cạnh nó, kể cả khi ai đó quên cập nhật `kind`.

## 5. Helper

| Hàm | Dùng ở đâu |
| --- | --- |
| `changelogVersions()` | test thứ tự, docs |
| `latestEntry()` | gợi ý changelog ở menu (thay vì ghi cứng số bản) |
| `tierCounts()` | số trên mỗi chip lọc |
| `entriesForTier(tier \| null)` | danh sách đã lọc |
| `entryFor(version)` | tra một bản (deep-link, test, docs) |

## 6. i18n

Chỉ **hai** ngôn ngữ nội dung: `vi` (nguồn) và `en` (gương). Sáu locale còn lại
hiển thị `en` — quyết định có chủ đích, ghi ở `docs/guides/adding-a-locale.md`.
Sáu **khoá UI** thì có đủ 7 locale:

```
changelog.tier.major   MAJOR
changelog.tier.minor   UPDATE
changelog.tier.patch   PATCH
changelog.filter.all   TẤT CẢ
changelog.releases     {n} bản
changelog.filterHint   Lọc theo tầng phát hành
```

## 7. Thêm một bản phát hành

1. Tạo `entries/v1_2_0.ts`, export `V1_2_0: ChangelogEntry`.
2. Import + chèn **đầu** mảng trong `index.ts`.
3. Không đụng `tiers.ts` — `tierFor("1.2.0")` tự trả `minor`, UI tự đổi sang màu vàng.
4. Chạy `npm run check` — 5 quy tắc ở §3 sẽ tự kiểm.

## 8. Kiểm chứng

```console
$ npx vitest run tests/changelog.test.ts tests/changelog-tiers.test.ts
```

`tests/changelog-tiers.test.ts` là test đã phát hiện 1.1.5 và 1.1.6 đang dùng
chung một ngày phát hành.
