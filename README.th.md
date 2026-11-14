<div align="center">

<img src="assets/banner.svg" alt="Lọ Chéo — Pickled Jar Showdown" width="100%" />

# LỌ CHÉO — PICKLED JAR SHOWDOWN

### 🫙 เกมอะเคดปีเคิลสัญชาติเวียดนามที่เล่นได้ 100% บนเบราว์เซอร์ — ไฟล์ HTML ไฟล์เดียวจบ ออฟไลน์ได้ทันที
### 🌐 อินเทอร์เฟซในเกม 7 ภาษา — Tiếng Việt · English · 中文 · 日本語 · 한국어 · Español · Français

[🇻🇳 Tiếng Việt](README.md) · [🇬🇧 English](README.en.md) · [🇨🇳 中文](README.zh.md) · [🇯🇵 日本語](README.ja.md) · [🇰🇷 한국어](README.ko.md) · [🇪🇸 Español](README.es.md) · [🇫🇷 Français](README.fr.md) · [🇹🇭 ไทย](README.th.md) · [🇩🇪 Deutsch](README.de.md) · [🇵🇹 Português](README.pt.md)

[![Version](https://img.shields.io/badge/version-1.1.8-f5a81c.svg?style=for-the-badge&logo=semver&logoColor=black)](docs/releases/v1.1.8.md)
[![Tier](https://img.shields.io/badge/tier-PATCH%20%C2%B7%20violet-9d6bff.svg?style=for-the-badge)]
[![Tests](https://img.shields.io/badge/tests-842%20%C2%B7%2079%20files-2bb48c.svg?style=for-the-badge&logo=vitest&logoColor=white)]
[![CI](https://github.com/standardizeparadigm/Lo-CheoIO/actions/workflows/ci.yml/badge.svg)](https://github.com/standardizeparadigm/Lo-CheoIO/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-AGPL--3.0--only-e63b2e.svg?style=for-the-badge)](LICENSE)
[![Offline](https://img.shields.io/badge/offline--first-100%25-2bb48c.svg?style=for-the-badge)](#-ติดตั้ง--เริ่มเล่น)
[![Single File](https://img.shields.io/badge/single--file-HTML-8cc63f.svg?style=for-the-badge)](#-build-production)
[![Languages](https://img.shields.io/badge/UI-VI%20%C2%B7%20EN%20%C2%B7%20ZH%20%C2%B7%20JA%20%C2%B7%20KO%20%C2%B7%20ES%20%C2%B7%20FR-ffc94a.svg?style=for-the-badge&logo=googletranslate&logoColor=black)](#-สลับภาษา)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ffc94a.svg?style=for-the-badge)](CONTRIBUTING.md)

<img src="assets/demo.svg" alt="Lọ Chéo gameplay — ไหเอียงเฉียง รับวัตถุดิบ เฉือนเชื้อรา" width="100%" />

<img src="assets/languages.svg" alt="7 ภาษา — VI · EN · 中文 · 日本語 · 한국어 · Español · Français" width="100%" />

<img src="assets/palette-ribbon.svg" alt="จานสีของ Lọ Chéo — เจ็ดแถบหายใจสลับกัน (แอนิเมชัน SMIL)" width="100%" />

</div>

---

## 🥒 เกี่ยวกับโปรเจกต์

> Lọ Chéo — Pickled Jar Showdown: เกมอะเคดปีเคิลที่รันได้ 100% บนเบราว์เซอร์ แพ็กมาในไฟล์ HTML เดียวจบ ออฟไลน์เต็มรูปแบบ — ไม่มี CDN ไม่มีเซิร์ฟเวอร์ ไหเซรามิกขยับได้ทาง**เฉียง**เท่านั้น: กดสองปุ่มพร้อมกันเพื่อเอียง เร่งสปีด และเฉือนเชื้อรา แมลงวัน และหนอน แล้วเติมไหให้เต็มก่อนที่เซรามิกจะแตกเป็นสามซีก **9 โหมด · 14 วัตถุดิบ · 16 ความสำเร็จ · ตาราง TOP 8 · 7 ภาษาในเกม**

นี่คือ **เกมแอ็กชันจอเดียว** ที่ได้แรงบันดาลใจจากผักดองพื้นบ้านของเวียดนาม ไม่มีด่านเรียงลำดับ ไม่มีเมนูรกรุงรัง มีแค่ไห สายฝนวัตถุดิบที่ไม่สิ้นสุด และรีเฟล็กซ์สุดจี๊ดของคุณ

<img src="assets/divider.svg" alt="" width="100%" />

## 🆕 สิ่งใหม่ใน v1.1.8

> **แพตช์สุดท้าย** ก่อน 1.2.0 ไม่มีโหมดใหม่ ไม่มีการปรับสมดุล ไม่มีการเปลี่ยนรูปแบบเซฟ รอบสุดท้ายนี้ทำสิ่งเดียว: **ฮีโร่วัดหน้าต่างแล้วเลือกเลย์เอาต์เอง** — ทุกขนาด ไม่มีการเลื่อน ไม่มีการตัด แถบเด็คถูกถอดออก และ SVG ทั้ง 20 ถูกวาดใหม่

### 📐 การบวกที่ไม่ใครดูแล — และสี่บั๊กพร้อมกัน

ภาพหน้าจอรายงานสี่ปัญหา แต่มีสาเหตุ**เดียว** แถวแผงมุมกับทิกเกอร์เคยเป็น flex พี่น้องแบบ `shrink-0` จึงได้ความสูงของตัวเองก่อน แล้วเหลือเท่าไหร่ฮีโร่จึงได้เท่านั้น:

```
หน้าต่าง 720px
├── 415px   แถวแผง GAME/INFO   (สูงตามเนื้อหา, shrink-0)
├──  55px   ทิกเกอร์           (สูงตามข้อความ, shrink-0)
└── 250px   ฮีโร่             ← ส่วนที่เหลือ ทั้งที่ต้องใช้ ~430px
```

| อาการในภาพ | เพราะอะไร |
| --- | --- |
| `LỌ` ถูกตัดที่ขอบบน | ฮีโร่ 250px เนื้อหา 430px |
| `CÀI ĐẶT` ล้นออกจากแผง | แผงกำหนดความสูงตามเนื้อหา ไม่ใช่ตามหน้าต่าง |
| บรรทัดลิขสิทธิ์ถูกตัดครึ่ง | ทิกเกอร์ต้องใช้ 55px แต่ได้ 48px |
| `×` ของ「วิธีเล่น」ลอยกลางจอ | แอคคอร์เดียนที่ห่อมันเลื่อนพ้นสายตาไปแล้ว |

วิธีแก้ไม่ใช่การเพิ่มระยะเผื่อสักสองสามพิกเซล แต่คือ**ประกาศความสูงครั้งเดียวแล้วให้ทุกอย่างอ่านกลับมาจากที่นั่น**: `layout/metrics.ts` เก็บทุกตัวเลข, `layout/fit.ts` คืน `MenuPlan` แบบบริสุทธิ์, `MenuChrome` เป็นแถบเดียว `absolute inset-x-0 bottom-0` และฮีโร่จองที่ด้วย `padding-bottom` ที่คำนวณโดยฟังก์ชัน**เดียวกัน**

<img src="assets/layout-fix.svg" alt="ก่อนและหลังแพตช์ 1.1.8 — 1.1.7 บีบฉากเหลือ 250px ทำให้โถถูกตัด 1.1.8 คงฉาก 342px และจอง 378px ให้แผง (แอนิเมชัน SMIL)" width="100%" />

### 🌀 บั๊กการเลื่อน: พื้นที่เลื่อนซ้อนในพื้นที่เลื่อน

ด้านล่างนิ่งแต่ด้านบนยังลากขึ้นลงได้ — ตรงตามที่อธิบาย v1.1.7 ห่อเนื้อหาฮีโร่ในกล่อง `overflow-y-auto` แล้วจัดกลางด้วย `min-h-full` + `justify-center` วิธีนั้นถูกเมื่อเนื้อหา**เตี้ยกว่า**กล่องเท่านั้น พอเนื้อหา**สูงกว่า** `justify-center` จะดันขึ้นไป และขอบบนของมันอยู่*เหนือจุดเริ่มเลื่อน* — ไม่มีตำแหน่งเลื่อนใดเอื้อมถึง

ตอนนี้ทั้งหน้าจอมีพื้นที่เลื่อน**เดียว** (`.menu-scroll`) เนื้อหายึดกับด้านบน ไม่จัดกลางแนวตั้งอีก สามคลาสที่เป็นต้นเหตุ — `flex-1 overflow-y-auto`, `min-h-full`, `justify-center` — ถูกห้ามกลับมาโดย `tests/menu-layout.test.ts`

### 🎯 ฮีโร่: `LỌ CHÉO` อยู่กลางและยกขึ้นเล็กน้อย

- คำโปรยถูกจัด**กลางแนวนอน**แล้ว**ยกขึ้น**ตามที่ขอ ขนาดตัวอักษรถูกจำกัดทั้งความกว้างและความสูง หน้าต่างเตี้ยจึงไม่ทำให้ตัวอักษรล้น
- โถเซรามิกย้ายไปทางขวา ล้อมด้วย**สามวงแสง 18s / 26s / 34s** — วงเดียว 14s เดิมอ่านเป็นสปินเนอร์โหลด
- **ของตกแต่ง 14 ชิ้น** (ดาว ประกาย วงกลม ฟอง พริก ใบมะกรูด แมลงวัน หยดน้ำปลา) แบ่งเป็นสองแถบเหนือและใต้ชื่อ แต่ละชิ้นมีคาบและดีเลย์ของตัวเอง — คำตอบของคำบ่นว่า *"มีแต่คำว่า LỌ CHÉO กับโถดินเผา น้อยเกินไป"*
- พิกัดเป็น**ข้อมูล**ใน `scene/decor.ts` พร้อมฟังก์ชันตรวจการชน `tests/menu-decor.test.ts` จึงล็อกทั้งตำแหน่งและจำนวน

### 📖 「วิธีเล่น」ย้ายเข้าเมนู GAME

หกกฎและตารางปุ่มไม่อยู่ในฮีโร่อีกต่อไป — เปิดแล้วมันดัน `LỌ` ออกจากจอ ตอนนี้เป็น**แถวหนึ่งในแผง GAME** ที่เปิดโมดัล (`HowToModal`) เลย์เอาต์จึงไม่ขยับไม่ว่าเปิดหรือปิด `×` ที่ลอยกลางจอหายไปพร้อมแอคคอร์เดียนที่สร้างมัน

### 🗂️ โปรเจกต์ได้โฟลเดอร์เพิ่มอีก

```
src/components/menu/
├── layout/          metrics.ts · fit.ts · useMenuPlan.ts       ← ใหม่: ทุกตัวเลขอยู่ที่เดียว
├── scene/           decor.ts · DecorGlyph · HeroDecor · JarHalo ← ใหม่: ฮีโร่ที่ตกแต่งแล้ว
├── ticker/          strings.ts · tickerTone.ts · MenuTicker     ← ใหม่: แถบเป็นโมดูลของตัวเอง
├── howto/           rules.ts                                    ← ใหม่: 6 กฎ + ตารางปุ่ม
├── background/      layers.ts · MenuBackground                  ← 8 ชั้นพื้นหลังประกาศด้วยข้อมูล
└── MenuChrome.tsx · HowToModal.tsx                              ← ใหม่: แถบล่าง + โมดัล
```

### 🐛 การแก้ไข

| # | บั๊ก | วิธีแก้ |
| --- | --- | --- |
| 1 | ด้านบนยังเลื่อนได้ทั้งที่ด้านล่างนิ่ง | ตัดกล่องเลื่อนซ้อน เหลือ `.menu-scroll` เดียวที่ยึดขอบบน |
| 2 | `LỌ` ถูกตัดที่ขอบบน | ฮีโร่คงฉาก 342px ไม่ถูกบีบเหลือ 250px |
| 3 | `CÀI ĐẶT` ล้นออกจากแผง GAME | `CornerPanel.height` เป็น**พารามิเตอร์บังคับ**: 318px (กะทัดรัด) / 458px (เต็ม) |
| 4 | บรรทัดลิขสิทธิ์ถูกตัดครึ่ง | ทิกเกอร์คงที่ 48px ลิขสิทธิ์อยู่ในบล็อกเดียวกับมาร์คี |
| 5 | `×` ของ「วิธีเล่น」ลอยกลางจอ | แอคคอร์เดียน → โมดัล ไม่มี `absolute` บนกล่องที่เลื่อนไปแล้ว |
| 6 | ความสูงแผงตามความยาวคำแปล (เยอรมัน/ไทยล้นก่อนอังกฤษ) | ประกาศความสูง ไม่ขึ้นกับเนื้อหา |
| 7 | วงเดียว 14s อ่านเป็นสปินเนอร์ | สามวง 18s / 26s / 34s แทบไม่ตรงเฟสกัน |
| 8 | เอกสาร/SVG/ตัวเรียกเกมล้าหลังเวอร์ชัน | ตรวจ 10 README + docs + 19 SVG → 1.1.8 |

→ รายละเอียดเต็ม: [docs/releases/v1.1.8.md](docs/releases/v1.1.8.md) · เวอร์ชันก่อน: [docs/releases/v1.1.7.md](docs/releases/v1.1.7.md)

### 🪟 สองภาพ หน้าต่างเดียวกัน ต่างกัน 260 พิกเซล

สองภาพสุดท้ายของรอบนี้คือ **แอปเดียวกัน**: `1920×1080` แบบเต็มจอ และ `1920×820` แบบหน้าต่าง ความกว้างไม่เปลี่ยนแม้พิกเซลเดียว แต่ในภาพที่สอง ครึ่งล่างของฮีโร่อยู่ **ใต้** แผงมุมทั้งสอง และชิป `CHẾ ĐỘ CHƠI` ถูกตัดครึ่ง

สาเหตุไม่ใช่ความสูงไม่พอ แต่เป็น **คำถามที่ผิด**:

| สิ่งที่ตัดสินเลย์เอาต์ | รู้ | ไม่รู้ |
| --- | --- | --- |
| `sm:` · `lg:` ใน CSS | **ความกว้าง** | **ความสูง** |
| `plan.minimal` | **ความสูง** (ต่ำกว่า 220px) | ความกว้าง และรู้เมื่อสายเกินไป |
| `heroLayout()` (ใหม่) | **ทั้งสอง** จากตัวเลขเดียวกับที่ครอ มใช้ | — |

การตัดสินใจที่ขึ้นกับ *สองแกน* เขียนเป็นมีเดียควอรีแกนเดียวไม่ได้ เลย์เอาต์ฮีโร่จึงออกจาก CSS และกลายเป็นฟังก์ชันบริสุทธิ์: `heroLayout({ scene, width, minimal })`

`scene` คือความสูงที่ `planMenuLayout()` จัดให้ฮีโร่ —— **ตัวเลขเดียวกับ** ที่ครอมจองไว้ มันคลาดกันไม่ได้ เพราะทั้งคู่อ่านจากฟังก์ชันเดียว

#### สามขีดจำกัด ทั้งสามมาจากการคำนวณ

| ค่าคงที่ | ค่า | มาจาก |
| --- | --- | --- |
| `HEIGHT_FOR_BADGE_ROW` | **232** | wordmark 150 + badge 40 + live badge 22 = 212 บวกที่ว่าง 20 |
| `HEIGHT_FOR_HALO` | **300** | lockup 150 + วงแหวน 240 − ทับซ้อน 90 |
| `HEIGHT_FOR_SIDE_BY_SIDE` | **300** | คอลัมน์ที่สูงกว่า: มาสคอต 192 + ชิป 24 + ระยะขอบ |

`232` คือ **บั๊กที่จับได้** ร่างแรกตั้งไว้ `210` —— ต่ำกว่าล็อกอัป 212px ที่มันเองควบคุม แถบ 210px จึงวาดล็อกอัป 212px และบรรทัดสถิติถูกตัด ทั้งที่เป็นบั๊กชนิดเดียวกับที่รอบนี้กำลังแก้ แต่เกิดจากตัวการแก้เอง

`tests/menu-adaptive.test.ts` กวาด **1,682 viewport** และยืนยัน `heroContentHeight(layout) ≤ scene` ทุกตัวอย่าง

#### อีเวนต์ที่สี่ที่หายไป

ผู้ใช้สร้างสองภาพนั้นโดย **กดปุ่มเต็มจอ** แอปฟัง `resize` และ `orientationchange` Firefox ไม่ยิงทั้งสองตอนสลับเต็มจอ Safari เก่ายิงแค่ `webkitfullscreenchange` หน้าต่างจึงเปลี่ยนความสูง ฮีโร่คงแผนเดิม และชิปยังถูกตัดจนกว่าจะรีไซซ์ครั้งถัดไป

`VIEWPORT_EVENTS` รวมทั้งหกการสะกดไว้ที่เดียว เพราะ `useMenuPlan()` และ `useViewportWidth()` **ทั้งคู่** ต้องการมัน —— เดิมแต่ละตัวลงทะเบียนสำเนาของตัวเอง คือสองสำเนาที่บรรยายสองหน้าต่างต่างกันได้

### 🗑️ แถบคั่นในภาพ 12 —— และเด็คที่จากไปพร้อมกัน

ภาพที่สามคือแถบ `1443×180` ที่ตัดจากกลางจอ: เครื่องหมาย `🎮` เส้นทอง แล้วก็สามหัวข้อ `GAME / ความท้าทายวันนี้ / กฎของวัน` นั่นคือ **เด็ค** —— สามคอลัมน์ข้อความในแถบความสูงคงที่

มันอยู่ตรงนั้นไม่ได้ และอีกสองภาพบอกว่าทำไม: ที่ `1920×1080` คอลัมน์ขวาถูกตัด **กลางประโยค** ที่ `1920×820` ทั้งแถวอยู่ใต้แผง แถบที่สูงพอสำหรับ wordmark 200px ไม่ได้สูงพอสำหรับสามย่อหน้าด้วย

ไม่มีอะไรที่เด็คพูดหายไป:

| เด็คพูดอะไร | ตอนนี้อยู่ที่ไหน |
| --- | --- |
| โหมดที่จะเล่น | ชิปใต้มาสคอต รายการเต็มอยู่ใน GAME |
| **ความท้าทายวันนี้** | หนึ่งบรรทัดในแผง INFO —— `โหมด · เป้าหมาย` |
| กฎของวัน | หนึ่งบรรทัดของมอดัลวิธีเล่น ซึ่งเป็นฉบับเต็มของหกกฎนั้นมาตลอด |

คณิตศาสตร์วันที่ **ไม่ได้** ไปด้วย: `challengeFor()` และ `tipIndexFor()` ย้ายไป `src/game/daily/` พร้อม 21 เทสต์และชื่อเดิม

แถบว่างใต้ wordmark ตอนนี้เป็น **เจตนา** นั่นคือราคาของฮีโร่ที่พอดีทุกขนาด

### 🏷️ Changelog แบ่งชั้น — ชั้นละสี

| ชั้น | ป้าย | สี | ความหมาย | ตัวอย่าง |
| --- | --- | --- | --- | --- |
| `major` | **MAJOR** | 🩷 ชมพู `#ff5fb0` | เวอร์ชันใหญ่ — เพิ่มระบบ | 1.0.0 |
| `minor` | **UPDATE** | 🟡 ทอง `#f5a81c` | ยกระดับ — เพิ่มเนื้อหา | 1.1.0 |
| `patch` | **PATCH** | 🟣 ม่วง `#9d6bff` | แก้บั๊กและจัดระเบียบ | 1.1.1 → **1.1.8** |

ชั้น**อนุมานจาก SemVer** ด้วย `tierFor(version)` ไม่พิมพ์มือ แผงมี**ตัวกรอง** ทั้งหมด · MAJOR · UPDATE · PATCH พร้อมจำนวนแต่ละชั้น

<img src="assets/release-tiers.svg" alt="สามชั้น MAJOR/UPDATE/PATCH กับสีและไทม์ไลน์สิบเวอร์ชัน (แอนิเมชัน SMIL)" width="100%" />

<img src="assets/test-matrix.svg" alt="เมทริกซ์เทสต์ 1.1.8 — 501 เทสต์ใน 48 ไฟล์ เก้าด่าน (แอนิเมชัน SMIL)" width="100%" />

<img src="assets/corner-menu.svg" alt="แผง GAME (ล่างซ้าย) และ INFO (ล่างขวา) เลื่อนเข้ามา (แอนิเมชัน SMIL)" width="100%" />

<img src="assets/settings-sections.svg" alt="ตั้งค่า 6 หมวด (ตั้งแต่ v1.1.6) — สวิตช์ แถบระดับ และตัวเลือก (แอนิเมชัน SMIL)" width="100%" />

## 📐 เลย์เอาต์ปรับตัว — ฮีโร่เลือกทรงของตัวเองอย่างไร

หน้าจอเริ่มต้นไม่ได้ใช้มีเดียควอรีตัดสินเลย์เอาต์ แต่ **วัด** หน้าต่างแล้วเลือกจากห้าความสามารถ: `sideBySide`·`halo`·`badgeRow`·`mascot`·`liveBadge`

```
planMenuLayout(viewport) → { scene, reserve, … }    scene + reserve = ความสูง
            │
            └─ scene คือตัวเลขเดียวกับที่ครอมจองไว้
                        │
    heroLayout({ scene, width }) → บูลีน 5 ตัว
```

| แฟล็ก | เปิดเมื่อ | ถ้าปิดจะหายอะไร |
| --- | --- | --- |
| `sideBySide` | กว้าง ≥ 1024 **และ** ฮีโร่ ≥ 300px | มาสคอตลงไปใต้วอร์ดมาร์ก |
| `halo` | ฮีโร่ ≥ 300px | วงแหวนรอบไห |
| `badgeRow` | ฮีโร่ ≥ 232px | ป้าย «HŨ DƯA ĐẠI CHIẾN» และบรรทัดสถิติ |
| `mascot` | เกือบตลอด | — (ซ่อนเฉพาะโหมดประหยัดสุด) |
| `liveBadge` | ฮีโร่ ≥ 232px | บรรทัด «ถ่ายทอดสดจากครัว» และเวอร์ชัน |

ขีดจำกัดสามตัว **ไม่ใช่เลขกลม** — แต่ละตัวคือความสูงจริงของสิ่งที่มันควบคุม:

```ts
HEIGHT_FOR_BADGE_ROW    = 232  // 150 wordmark + 40 ป้าย + 22 live + 20 ที่ว่าง
HEIGHT_FOR_HALO         = 300  // 150 lockup + 240 วงแหวน − 90 ทับซ้อน
HEIGHT_FOR_SIDE_BY_SIDE = 300  // คอลัมน์ที่สูงกว่า: 192 มาสคอต + 24 ชิป
```

`tests/menu-adaptive.test.ts` กวาด **1,682 viewport** และยืนยัน `heroContentHeight(layout) ≤ scene` ทุกตัวอย่าง เมื่อรีไซซ์ ทั้งสองฮุกฟัง **หก** อีเวนต์และอัปเดตในหนึ่งเฟรม

## ✨ จุดเด่น

| หมวด | รายละเอียด |
| --- | --- |
| 🎮 **9 โหมด** | **ดองคลาสสิก**(สมดุล) · **ZEN**(ไม่มีอันตราย, ×0.5) · **อินเฟอร์โนพริก**(เร็ว +35%, ×1.5) · **60 วินาที**(time-attack 60s, ×1.25) · **โกลด์รัช**(ของทองหล่น ×2.6) · **พายุผักดอง**(หนาแน่น ~1.4×, ×0.75) · **เซรามิกบาง**(ร้าวรอยเดียวจบ, ×2.0) · **เทศกาลคอมโบ** (หน้าต่าง ×2, ×1.15) · **งานเลี้ยงใหญ่** (หนาแน่น ~×2, โถ ×2.5, ×0.6) |
| 🌐 **i18n ในเกม** | Tiếng Việt · English · 中文 · 日本語 · 한국어 · Español · Français — `src/i18n/` (โมดูลล้วน + สะพาน React), `t()` รองรับ interpolation ซิงก์ `<html lang>` ตัวเลขตาม locale (vi-VN / en-US / zh-CN / ja-JP / ko-KR / es-ES / fr-FR) |
| 🕹️ **กลไก CHÉO เฉพาะ** | กด 2 ปุ่ม/แกนแบบเฉียง — ไหเร่งสปีด เรืองแสง และเฉือนอันตราย มีหลอด stamina แยก พร้อม hysteresis กันกระพริบ |
| 🥬 **14 วัตถุดิบ** | มะเขือ พริก กระเทียม ขิง เกลือ ผัก · **ผักทอง** (เติมไหเร็ว) · เกลือ/กระเทียมทอง · พริกเพลิง · น้ำแข็ง · เชื้อรา แมลงวัน **หนอน** (อันตราย) |
| 🧄 **เกราะกระเทียมทอง** | พาวเวอร์อัพ: สะสมได้สูงสุด **2 ชาร์จ** กันรอยร้าว มีรัศมีหมุนโคจรรอบไห |
| 🏆 **16 ความสำเร็จ** | บันทึกข้ามรอบ (localStorage) พร้อม toast «ความสำเร็จใหม่!» บนหน้าจบเกม |
| 🔊 **ซาวด์ทำมือ** | เอฟเฟกต์ 11 แบบสังเคราะห์ด้วย Web Audio API (ไม่มีไฟล์) + บันไดเสียง pentatonic เปลี่ยนตามเลเวล กด `M` ปิดเสียง |
| 💾 **ตาราง TOP 8** | เก็บลงเครื่อง ตรวจสอบ/ปรับค่าเมื่ออ่าน ชื่อตัวพิมพ์ใหญ่ ไฮไลต์สถิติใหม่ |
| 🎨 **กราฟิก 60fps** | Canvas 2D งบอนุภาค ≤460 จำกัด DPR ≤ 2 พื้นกระเบื้องพรีเรนเดอร์ลง offscreen ดาวระยิบ + ออโรร่าในเมนู |
| 📴 **ออฟไลน์จริง** | ฟอนต์โฮสเอง (subset latin + vietnamese woff2) ไม่มี CDN ไม่มี API — ดับเบิลคลิก `dist/index.html` แล้วเล่นได้เลย |
| 🧪 **คุณภาพ** | 501 เทสต์ (vitest) ครอบคลุม modes / achievements / storage / i18n / settings — `npm run check` คือประตู CI |

<img src="assets/items.svg" alt="14 วัตถุดิบ — ผักดองให้รับ พลังทองให้คว้า อันตรายให้หลบ" width="100%" />

## 🌐 สลับภาษา

Lọ Chéo มาพร้อม **อินเทอร์เฟซ 7 ภาษา** เปลี่ยนแล้วมีผลทันที — ไม่ต้องรีโหลด ไม่เสียรอบที่เล่นอยู่:

<img src="assets/languages.svg" alt="7 ภาษา — VI · EN · 中文 · 日本語 · 한국어 · Español · Français" width="100%" />

| ภาษา | ที่ไหน | เก็บไว้ที่ |
| --- | --- | --- |
| 🇻🇳 Tiếng Việt | ปุ่ม **VI** (ค่าเริ่มต้น ถ้าไม่ตั้งจะตาม locale ของเบราว์เซอร์) | `locheo.lang.v1` |
| 🇬🇧 English | **EN** ปุ่ม | `locheo.lang.v1` |
| 🇨🇳 中文 | **中** ปุ่ม | `locheo.lang.v1` |
| 🇯🇵 日本語 | **日** ปุ่ม | `locheo.lang.v1` |
| 🇰🇷 한국어 | **한** ปุ่ม | `locheo.lang.v1` |
| 🇪🇸 Español | **ES** ปุ่ม | `locheo.lang.v1` |
| 🇫🇷 Français | **FR** ปุ่ม | `locheo.lang.v1` |

- เปลี่ยนภาษาใน **ตั้งค่า → ภาษา** (ตารางปุ่มธง 7 ปุ่ม) — จุดเดียว ไม่มีสวิตช์ลอยบนเมนูอีก
- string ทุกตัวที่ผู้ใช้เห็นอยู่ใน `src/i18n/locales/{vi,en,zh,ja,ko,es,fr}.ts` — canvas engine, screens, HUD, popup, ticker, คำแนะนำ
- ถ้าขาด key? `t()` จะ fallback เป็นเวียดนาม — ชุด key ของทั้งเจ็ด locale (และ placeholder) ถูกบังคับด้วยเทสต์

## 🕹️ การควบคุม

| การกระทำ | คีย์บอร์ด | ทัช |
| --- | --- | --- |
| เคลื่อนที่ | `W` `A` `S` `D` หรือ `← ↑ ↓ →` | ลากตรงไหนก็ได้ (floating joystick) |
| **เอียง (CHÉO)** | กดค้าง **2 ปุ่มพร้อมกัน** (เช่น `A`+`W`) | ลากที่ **45°** — วงแหวนจอยสติ๊กเปลี่ยนเป็นทอง |
| กระแทกไห (ช็อกเวฟ + ดูดเข้า) | `Space` | ปุ่ม **SLAM** สีแดง มุมขวาล่าง |
| หยุดชั่วคราว / เล่นต่อ | `P` หรือ `Esc` | ปุ่มหยุด มุมขวาบน |
| รีสตาร์ตทันที | `R` (แม้กำลัง paused/game-over) | ปุ่ม "Pickle again" |
| เริ่ม / ยืนยัน | `Enter` | ปุ่ม **ENTER THE KITCHEN** |
| ปิด/เปิดเสียง | `M` | ปุ่มลำโพง มุมขวาบน |
| สลับภาษา | — (ใช้ปุ่ม VI/EN/中/日/한/ES/FR) | ปุ่ม VI/EN/中/日/한/ES/FR ในเมนู / pause |

## 🚀 ติดตั้ง & เริ่มเล่น

### เล่นได้เลย (ไม่ต้อง build)

```bash
# ทุก release แจกไฟล์เดียวจบ:
open dist/index.html      # macOS
xdg-open dist/index.html  # Linux
start dist/index.html     # Windows
```

### Build Production

```bash
npm install        # ติดตั้ง dependency (Node ≥ 20.19)
npm run build      # → dist/index.html (ไฟล์เดียวจบ)
```

> `vite-plugin-singlefile` ยัด JS/CSS/ฟอนต์/รูปทั้งหมดลง **ไฟล์เดียว** `dist/index.html` (~700 KB, gzip ~355 KB) ไม่ต้องมีเซิร์ฟเวอร์ ไม่ต้องมีเน็ต

### Development

```bash
npm run dev        # dev server พร้อม HMR (http://localhost:5173)
npm run preview    # เสิร์ฟ production build ในเครื่อง
npm run typecheck  # tsc --noEmit (strict, noUnusedLocals…)
npm run test       # vitest — 501 เทสต์ (modes / achievements / storage / i18n / settings)
npm run check      # typecheck + test + build (ประตูคุณภาพ CI)
```

## 🗂️ โครงสร้างโปรเจกต์

```
lo-cheoio/
├─ index.html              # entry, SEO/OG meta (ไม่มี CDN)
├─ package.json            # lo-cheoio v1.1.8, สคริปต์ dev/build/test/check
├─ .gitattributes          # *.bat/*.cmd → CRLF · posix → LF · binaries
├─ vite.config.ts          # vite + react + tailwind v4 + singlefile
├─ tsconfig.json           # strict; ครอบคลุม src + tests
├─ favicon.ico             # web icon (multi-size 16→256)
├─ public/                 # favicon.ico/png/svg served at web root
├─ assets/
│  ├─ banner.svg           # แบนเนอร์ README (SMIL animation)
│  ├─ demo.svg             # จำลอง gameplay (SMIL animation)
│  ├─ items.svg            # 14 วัตถุดิบ (SMIL animation)
│  ├─ modes.svg            # 9 โหมด (SMIL animation)
│  ├─ languages.svg        # 7 in-game languages (SMIL animation)
│  ├─ new-modes.svg        # the 2 new v1.1.4 modes (SMIL animation)
│  ├─ corner-menu.svg     # corner GAME/INFO panels (SMIL animation)
│  ├─ settings-sections.svg # 6-section settings tour (SMIL, v1.1.6)
│  ├─ divider.svg          # sparkle divider (SMIL animation)
│  ├─ license.svg          # ตรา copyleft AGPL-3.0 แบบเคลื่อนไหว (SMIL animation)
│  └─ favicon.svg          # favicon (SMIL animation)
├─ scripts/
│  ├─ play-mac.command     # ตัวเปิด macOS — ดับเบิลคลิก เมนูสีสันจัดเต็ม
│  ├─ play-windows.bat     # ตัวเปิด Windows — ดับเบิลคลิก เมนูสีสันจัดเต็ม
│  ├─ play-linux.sh        # ตัวเปิด Linux — ดับเบิลคลิก เมนูสีสันจัดเต็ม
│  └─ README.md            # คู่มือตัวเปิดสำหรับคนไม่ถนัดเทอร์มินัล
├─ docs/
│  ├─ README.md            # สารบัญเอกสาร (v1.1.5)
│  ├─ DESCRIPTION.md       # คำอธิบายโปรเจกต์หลายภาษา (vi/en/zh + SEO)
│  ├─ design/              # สเปก menu-corners / save-format / settings-format
│  ├─ guides/              # ภาพรวม engine · a11y · ประสิทธิภาพ · storage keys · ขั้นตอน release…
│  └─ releases/
│     ├─ v1.0.0.md         # release notes ฉบับแรก
│     ├─ v1.1.0.md         # release notes v1.1.0
│     ├─ v1.1.1.md         # release notes v1.1.1
│     ├─ v1.1.2.md         # v1.1.2
│     ├─ v1.1.3.md         # v1.1.3 release notes
│     ├─ v1.1.4.md         # release notes (1.1.4)
│     ├─ v1.1.5.md         # release notes (1.1.5)
│     ├─ v1.1.6.md         # release notes (1.1.6)
│     └─ v1.1.8.md         # current release notes (1.1.8)
├─ README.md               # 🇻🇳 Tiếng Việt
├─ README.en.md            # 🇬🇧 English
├─ README.zh.md            # 🇨🇳 中文
├─ README.ja.md            # 🇯🇵 日本語
├─ README.ko.md            # 🇰🇷 한국어
├─ README.es.md            # 🇪🇸 Español
├─ README.fr.md            # 🇫🇷 Français
├─ README.th.md            # 🇹🇭 ไทย (ไฟล์นี้)
├─ README.de.md            # 🇩🇪 Deutsch
├─ README.pt.md            # 🇵🇹 Português
├─ src/
│  ├─ main.tsx             # React root, StrictMode
│  ├─ App.tsx              # phase machine menu/playing/paused/gameover
│  ├─ version.ts           # APP_VERSION = "1.1.8" (แหล่งความจริงเดียว)
│  ├─ index.css            # tailwind v4 theme + แอนิเมชัน/ gradient ทั้งหมด
│  ├─ assets/fonts/        # woff2 subsets (Be Vietnam Pro ×6, Bungee)
│  ├─ styles/fonts.css     # @font-face + unicode-range, ออฟไลน์ 100%
│  ├─ i18n/
│  │  ├─ i18n.ts           # โมดูลล้วน: detect, persist, t() + interpolation
│  │  ├─ useI18n.ts        # React hook: useI18n/useLanguage
│  │  └─ locales/          # vi.ts (แหล่ง key) · en · zh · ja · ko · es · fr
│  ├─ components/
│  │  ├─ GameCanvas.tsx    # canvas + floating joystick + keyboard + visibility
│  │  ├─ StartScreen.tsx   # เมนู: ฮีโร่ + ฉากหลายชั้น + พาเนลมุม
│  │  ├─ menu/              # พาเนล GAME/INFO + โมดัล + icons/
│  │  │  └─ background/     # 8 background layers as data (v1.1.8)
│  │  ├─ ModeSelector.tsx  # การ์ด 9 โหมด (classic/zen/inferno/blitz/goldrush/storm/hardcore · combo · feast)
│  │  ├─ AchievementsPanel.tsx  # กำแพงป้าย locked/unlocked
│  │  ├─ GameOverScreen.tsx     # ไหแตก! + คะแนน + ความสำเร็จใหม่
│  │  ├─ PauseScreen.tsx        # หยุดชั่วคราว + สถิติรอบนี้
│  │  ├─ settings/           # โมดูลตั้งค่า 6 หมวด + คอนโทรล (v1.1.6)
│  │  └─ ui/               # แปดพรีมิทีฟ ไฟล์ละตัว (v1.1.8 — แยกจาก ui.tsx)
│  ├─ game/
│  │  ├─ engine.ts         # การจำลอง + เรนเดอร์ canvas ทั้งหมด (ราว 2260 บรรทัด)
│  │  ├─ modeTypes.ts      # ModeId · ModeConfig (types-only, v1.1.8)
│  │  ├─ modes/            # 9 balance records — classic.ts … feast.ts (v1.1.8)
│  │  ├─ modesIndex.ts     # MODES · MODE_LIST · isModeId (v1.1.8)
│  │  ├─ modeMath.ts       # multiplierForCombo · jarBonus · comboWindowFor… (v1.1.8)
│  │  ├─ modes.ts          # barrel — keeps every old import working
│  │  ├─ achievements.ts   # 16 ป้าย + ตัวตรวจ (pure)
│  │  ├─ storage.ts        # localStorage: top 8, progress, achievements
│  │  ├─ audio.ts          # Web Audio synth: sfx + เพลง pentatonic
│  │  ├─ changelog/          # in-game changelog (v1.1.8 — split from one file)
│  │  │  ├─ types.ts        #   ChangelogEntry · ReleaseTier · copyFor()
│  │  │  ├─ tiers.ts        #   tierFor() · TIER_ORDER · TIER_LABEL_KEY
│  │  │  ├─ entries/        #   1 file per release — v1_0_0.ts … v1_1_7.ts
│  │  │  └─ index.ts        #   ordered list + 5 helpers
│  │  ├─ runSave.ts         # บันทึกเกมที่ค้างไว้
│  │  ├─ settings.ts        # สคีมาตั้งค่า ค่าเริ่มต้น normalize
│  │  ├─ settingsIO.ts      # โคเดกสำรอง/กู้คืน (v1.1.6)
│  │  ├─ settingsPresets.ts # พรีเซ็ตเร็ว 4 แบบ (v1.1.6)
│  │  └─ audioLevels.ts     # คำนวณเกนล้วน (v1.1.6)
│  └─ utils/
│     ├─ cn.ts             # clsx + tailwind-merge
│     └─ useFocusTrap.ts   # กักโฟกัสในโมดัล (v1.1.6)
└─ tests/                  # vitest — 48 ไฟล์ · 501 เทสต์ (modes · achievements · storage · i18n · runSave · settings · presets · audio…)
```

## 🧱 สถาปัตยกรรม & ประสิทธิภาพ
<img src="assets/architecture.svg" alt="สถาปัตยกรรม Lọ Chéo v1.1.8 — อินพุต → เอนจิน → สถานะ → เรนเดอร์ พร้อมชั้นบริการ (แอนิเมชัน SMIL)" width="100%" />


- **Game loop** บน `requestAnimationFrame` delta-time จำกัดที่ `1/20s` คูณ `timeScale` (สโลว์โมชันจากน้ำแข็ง) และ **hit-stop** แช่แข็งสั้น ๆ ทุกครั้งที่รับของ ให้ความรู้สึก "หนักแน่น"
- **Canvas HUD** วาดตรงทุกเฟรม React เรนเดอร์เฉพาะหน้าจอตาม `phase` — ไม่มี re-render ในลูปร้อน เมื่อเปลี่ยนภาษา HUD หยิบ dictionary ใหม่เฟรมถัดไปทันที
- **i18n แบบชั้น**: `src/i18n/i18n.ts` เป็นโมดูลล้วน (ไม่พึ่ง React) `useI18n` เพียงสะพาน re-render ผ่าน event `locheo:languagechange`; `t()` รองรับ `{param}` interpolation และ fallback เป็นภาษาเวียดนาม
- **พื้นกระเบื้อง** พรีเรนเดอร์ครั้งเดียวลง offscreen canvas (พร้อม vignette + แอ่งแสง) ดาวระยิบและฟองคำนวณแบบเรียลไทม์ — ถูกมาก
- **Budget**: ≤460 อนุภาค ≤70 ไอเทม ≤34 popup DPR ≤ 2; กวาด hitbox collision; รอยดองที่พื้นล้างตัวเองได้
- **localStorage** ตรวจ/ปรับข้อมูลเมื่ออ่าน — เรคคอร์ดเสียหนึ่งรายการไม่ทำตารางพัง; ถ้า storage ถูกบล็อก (Safari โหมดส่วนตัว) เกมเล่นต่อในหน่วยความจำ; ตัวเลือกภาษาแยกไว้ใน `locheo.lang.v1`
- **Motion chill**: `prefers-reduced-motion` ปิดออโรร่า/shimmer/การหมุน; ทั้งดาวพื้นหลังและหน้าจอเขย่าเคารพ media query

## ❓ FAQ

**ตัวเปิด Windows ฟ้องตัวอักษรเวียดนาม?**
แก้แล้วใน v1.1.4: `play-windows.bat` เป็น CRLF + UTF-8 BOM พร้อม `chcp 65001` วรรณยุกต์เวียดนามครบถ้วน — ข้อผิดพลาด `'Ọ' is not recognized...` หายไปถาวร หากแก้ไข .bat ด้วยเอดิเตอร์อื่น ให้คง CRLF และ BOM ไว้ (`.gitattributes` บังคับให้อัตโนมัติ)


**เล่นแบบไม่มีเน็ตได้ไหม?**
ได้ 100% — เปิด `dist/index.html` แล้วทุกอย่างทำงาน รวมฟอนต์และเสียง ไม่มี request ออกนอกเครื่องเลยแม้แต่ครั้งเดียว

**มีโฆษณาหรือ telemetry ไหม?**
ไม่มี ไม่มี tracking ไม่มี analytics — คะแนนของคุณไม่เคยออกจาก localStorage

**เปลี่ยนภาษาแล้วความคืบหน้าหายไหม?**
ไม่หาย คะแนน ความสำเร็จ progress และโหมดที่เลือก ทั้งหมดแยกจาก `locheo.lang.v1`

**คะแนน TOP 8 เก็บไว้ที่ไหน?**
`locheo.scores.v1` (คะแนน), `locheo.progress.v1` (จำนวนรอบ/ไห/การเฉือนรวม), `locheo.achievements.v1` (ป้าย) — ล้าง storage คือหายหมด ดังนั้นรักษาไหของคุณไว้!

**อยากเพิ่มภาษาอื่น?**
เพิ่ม `src/i18n/locales/xx.ts` ให้ mirror ชุด key ของ `vi.ts` อัปเดต `LANGUAGES` + tests แล้วเปิด PR — ดู [CONTRIBUTING.md](CONTRIBUTING.md)

**ไม่ถนัดเทอร์มินัล?**
ดับเบิลคลิก [`scripts/play-mac.command`](scripts/play-mac.command) (macOS), [`scripts/play-windows.bat`](scripts/play-windows.bat) (Windows) หรือ [`scripts/play-linux.sh`](scripts/play-linux.sh) (Linux) — เมนูสีสันจะเปิดขึ้น เลือก `1` เพื่อ build & เล่นทันที หรือ `2` สำหรับ dev server รายละเอียด: [scripts/README.md](scripts/README.md)

## 📦 รีลีส & เช็งต์ล็อก

| เวอร์ชัน | Tier | วันที่ | บันทึก |
| --- | --- | --- | --- |
| [v1.1.8](docs/releases/v1.1.8.md) | 🟣 **PATCH** | 2026-11-12 | **หน้าจอเริ่มเกมไม่ล้นอีกต่อไป**: การบวกความสูงพลาดทำให้ฮีโร่เหลือ 250px และ `LỌ` ถูกตัด · **บั๊กการเลื่อน** (กล่องเลื่อนซ้อน + `justify-center`) แก้ด้วย `.menu-scroll` เดียวที่ยึดขอบบน · **「วิธีเล่น」เข้าเมนู GAME** เป็นโมดัล · แผงประกาศ **318px/458px** แทนการสูงตามเนื้อหา · ทิกเกอร์ 48px · **ของตกแต่งฮีโร่ 14 ชิ้น** + **วงแสง 3 วง** · `src/components/menu/{layout,scene,ticker,howto}/` · **501 เทสต์ / 48 ไฟล์** |
| [v1.1.7](docs/releases/v1.1.7.md) | 🟣 **PATCH** | 2026-11-10 | **พื้นหลังเมนูหมอกหาย** (สี่ชั้นซ้อน: `blur 64→22px`, วิชเน็ตต์เฉพาะมุมแทนเต็มจอ, กรอบ CRT 140→90px, พื้น 45→70%) · **changelog แบ่งชั้นมีสี** · **96 หัวข้อใหม่** ให้ 8 เวอร์ชัน · จัดวันใหม่ · แยก `src/game/changelog/` · ทำ README 10 ภาษใหม่ · **256 เทสต์** |
| [v1.1.6](docs/releases/v1.1.6.md) | 🟣 **PATCH** | 2026-11-08 | **ตั้งค่า 6 หมวด** (พรีเซ็ต · เสียง · ภาพ · ภาษา · สำรอง · ข้อมูล) · ความดัง 0–100 · ความแรงสั่น · คุณภาพภาพ · หยุดเมื่อสลับแท็บ · ย้ายภาษาเข้าตั้งค่า · พรีเซ็ต 4 แบบ · นำเข้า/ส่งออก JSON · เมนูหลายชั้นเคลื่อนไหว · การ์ดผู้สร้างไล่ระดับ · กักโฟกัสในโมดัล · แก้เพลงหลังรีโหลด · **150 เทสต์** |
| [v1.1.5](docs/releases/v1.1.5.md) | 🟣 **PATCH** | 2026-11-06 | **เมนูมุม GAME/INFO**（เล่น · เล่นต่อ · โหมด · อันดับ · ความสำเร็จ · ตั้งค่า / เกี่ยวกับ · Changelog · ออก）· **บันทึก & เล่นเกมค้างต่อ**（`locheo.run.v1`）· ตั้งค่าในเกม（เสียง/เพลง/สั่น/ลดแอนิเมชัน）· แก้คีย์ลัดทะลุโมดัล · prefers-reduced-motion ครบทุกตัว · **113 เทสต์** |
| [v1.1.4](docs/releases/v1.1.4.md) | 🟣 **PATCH** | 2026-11-04 | **9 โหมด** (เทศกาลคอมโบ · งานเลี้ยงใหญ่) · **16 ความสำเร็จ** · **7 ภาษา** (เพิ่ม ES/FR) · แก้ play-windows.bat (CRLF+BOM) · ตัวเปิด 7 ภาษา · 61 เทสต์ |
| [v1.1.3](docs/releases/v1.1.3.md) | 🟣 **PATCH** | 2026-11-02 | 7 โหมด (พายุผักดอง · เซรามิกบาง) · 14 ความสำเร็จ · 5 ภาษา · favicon · ตัวเปิดหลายภาษา · 55 เทสต์ |
| [v1.1.2](docs/releases/v1.1.2.md) | 🟣 **PATCH** | 2026-10-31 | 5 โหมด (60-Second Rush · Gold Rush) · 12 ความสำเร็จ · คอมโบไฟ · ตัวเปิดดับเบิลคลิก · README 10 ภาษา · 49 เทสต์ |
| [v1.1.1](docs/releases/v1.1.1.md) | 🟣 **PATCH** | 2026-10-29 | i18n ในเกม VI/EN/ZH · README 7 ภาษา · กวาดบั๊กทั้งหมด · 45 เทสต์ |
| [v1.1.0](docs/releases/v1.1.0.md) | 🟡 **UPDATE** | 2026-10-27 | 3 โหมด · เกราะกระเทียมทอง · หนอน · ผักทอง · 10 ความสำเร็จ · ฟอนต์โฮสเอง |
| [v1.0.0](docs/releases/v1.0.0.md) | 🩷 **MAJOR** | 2026-10-24 | รีลีสแรก: เอนจินครบ 11 วัตถุดิบ JAR SLAM ×9 คอมโบ |

ดูเพิ่มเติมที่ [CHANGELOG.md](CHANGELOG.md)

## 🗺️ แผนงาน (ร่าง — อาจปรับเปลี่ยนตามฟีดแบ็ก)

| ไมล์สโตน | ETA | ไอเดีย |
| --- | --- | --- |
| **v1.2.0** | 2026 Q1 | เพลงประกอบแบบ procedural ต่อโหมด · visual regression tests (Playwright) ใน CI · ลดขนาดฟอนต์ subset ให้ลึกขึ้นเพื่อลด bundle |
| **v1.3.0** | 2026 Q1–Q2 | โหมดที่ 10 (ตัวเลือก: **พายุแมลงวัน** — มีแต่แมลงวัน ต้องฟันรอด) · โหมด seed สำหรับ daily challenge |
| **v1.4.0** | 2026 Q2 | กระดานออนไลน์แบบ **opt-in** (serverless, เข้ารหัส) — offline-first ยังเป็นค่าเริ่มต้นเสมอ |
| Backlog | — | Ghost replay ของรอบที่ดีที่สุด · โหมดถ่ายภาพ (ซ่อน HUD ส่งออก PNG) · กำลังพิจารณา locale ไทย |

*แผนงานไม่ใช่คำสัญญา — ลำดับความสำคัญคือ: เสถียร → เล่นง่ายขึ้น → เนื้อหาเยอะขึ้น*

## 📚 เอกสารเพิ่มเติม & นักพัฒนา

บันทึกการออกแบบและเอกสารเชิงลึกสำหรับนักพัฒนา:

| Doc | What it covers |
| --- | --- |
| [docs/releases/v1.1.8.md](docs/releases/v1.1.8.md) | รีลีส v1.1.8 —— สี่บั๊กเลย์เอาต์จากการบวกความสูงครั้งเดียว, บั๊กการเลื่อนซ้อน, 「วิธีเล่น」เข้าเมนู GAME, ของตกแต่งฮีโร่ 14 ชิ้น |
| [docs/releases/v1.1.7.md](docs/releases/v1.1.7.md) | รีลีส v1.1.7 —— พื้นหลังเมนูหมอกหาย (วินิจฉัยสี่ชั้น), changelog แบ่งชั้นมีสี, 96 หัวข้อใหม่ |
| [docs/releases/v1.1.6.md](docs/releases/v1.1.6.md) | รีลีส v1.1.6 — ตั้งค่า 6 หมวด, พรีเซ็ต, สำรอง, เมนูหลายชั้น |
| [docs/releases/v1.1.5.md](docs/releases/v1.1.5.md) | รีลีส v1.1.5 — เมนูมุม, บันทึก/เล่นต่อ, ตั้งค่า, แก้บัก |
| [docs/design/menu-corners.md](docs/design/menu-corners.md) | ดีไซน์เมนูมุม GAME/INFO — หลักการ, a11y, responsive |
| [docs/design/save-format.md](docs/design/save-format.md) | Spec `locheo.run.v1` — snapshot ของเกมค้าง (schema + วงจรชีวิต) |
| [docs/design/settings-format.md](docs/design/settings-format.md) | Spec `locheo.settings.v1` — ตั้งค่าเกม (schema + wiring) |
| [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md) | ปัญหาที่พบบ่อย — จอดำ · ไม่มีเสียง · เล่นต่อ · launcher |
| [scripts/smoke-ssr.tsx](scripts/smoke-ssr.tsx) | สโมกเทสต์การเรนเดอร์แบบ headless (ทั้งต้น menu/modal) |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | CI: npm ci → npm run check (Node 22) |

## 🤝 ร่วมพัฒนา

1. Fork repo แล้วแตก branch ตามรูปแบบ `arena/<name>` หรือ `feat/<name>`
2. `npm run check` ต้องเขียวก่อนเปิด PR (typecheck + 501 เทสต์ + build)
3. เลี่ยงการเพิ่ม dependency ตอน runtime ถ้าไม่จำเป็นจริง ๆ — ปรัชญา: **ไฟล์เดียว ไม่มีเน็ต เล่นได้ตลอดกาล**
4. ใน PR ระบุหน้าจอ/โหมดที่ได้รับผลกระทบ และแนบคลิปถ้ามีการเปลี่ยน gameplay

## 📄 สัญญาอนุญาต & ผู้สร้าง

<img src="assets/license.svg" alt="AGPL-3.0-only — สัญญาอนุญาต copyleft" width="400" />

- **AGPL-3.0-only** © 2026 [Standardize Paradigm](mailto:standardizeparadigm@donuco.com) — ดู [LICENSE](LICENSE) และ [assets/license.svg](assets/license.svg)
- ฟอนต์: [Be Vietnam Pro](https://fonts.google.com/specimen/Be+Vietnam+Pro) & [Bungee](https://fonts.google.com/specimen/Bungee) — SIL Open Font License 1.1 (โฮสเองเป็น woff2 subsets)
- ขออุทิศให้ไหดองทุกใบบนสำรับข้าวเวียดนามทุกจาน — ชนแก้ว 🫙🇻🇳
