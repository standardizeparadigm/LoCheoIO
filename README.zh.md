<div align="center">

<img src="assets/banner.svg" alt="Lọ Chéo — 酸菜腌罐大乱斗" width="100%" />

# LỌ CHÉO — 酸菜腌罐大乱斗

### 🫙 100% 在浏览器中运行的越式腌大戏 — 单个 HTML 文件，离线优先
### 🌐 游戏内置 7 种语言 — Tiếng Việt · English · 中文 · 日本語 · 한국어 · Español · Français

[🇻🇳 Tiếng Việt](README.md) · [🇬🇧 English](README.en.md) · [🇨🇳 中文](README.zh.md) · [🇯🇵 日本語](README.ja.md) · [🇰🇷 한국어](README.ko.md) · [🇪🇸 Español](README.es.md) · [🇫🇷 Français](README.fr.md) · [🇹🇭 ไทย](README.th.md) · [🇩🇪 Deutsch](README.de.md) · [🇵🇹 Português](README.pt.md)

[![Version](https://img.shields.io/badge/version-1.1.8-f5a81c.svg?style=for-the-badge&logo=semver&logoColor=black)](docs/releases/v1.1.8.md)
[![Tier](https://img.shields.io/badge/tier-PATCH%20%C2%B7%20violet-9d6bff.svg?style=for-the-badge)]
[![Tests](https://img.shields.io/badge/tests-821%20%C2%B7%2077%20files-2bb48c.svg?style=for-the-badge&logo=vitest&logoColor=white)]
[![CI](https://github.com/standardizeparadigm/Lo-CheoIO/actions/workflows/ci.yml/badge.svg)](https://github.com/standardizeparadigm/Lo-CheoIO/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-AGPL--3.0--only-e63b2e.svg?style=for-the-badge)](LICENSE)
[![Offline](https://img.shields.io/badge/offline--first-100%25-2bb48c.svg?style=for-the-badge)](#-安装与运行)
[![Single File](https://img.shields.io/badge/single--file-HTML-8cc63f.svg?style=for-the-badge)](#-生产构建)
[![Languages](https://img.shields.io/badge/UI-VI%20%C2%B7%20EN%20%C2%B7%20ZH%20%C2%B7%20JA%20%C2%B7%20KO%20%C2%B7%20ES%20%C2%B7%20FR-ffc94a.svg?style=for-the-badge&logo=googletranslate&logoColor=black)](#-切换语言)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ffc94a.svg?style=for-the-badge)](CONTRIBUTING.md)

<img src="assets/demo.svg" alt="Lọ Chéo 实战演示 — 陶罐斜冲、接住腌菜、斩碎霉菌" width="100%" />

<img src="assets/languages.svg" alt="7 种语言 — VI · EN · 中文 · 日本語 · 한국어 · Español · Français" width="100%" />

<img src="assets/palette-ribbon.svg" alt="Lọ Chéo 调色板——七条色带轮流呼吸（SMIL 动画）" width="100%" />

</div>

---

## 🥒 关于本项目

> Lọ Chéo — 酸菜腌罐大乱斗：100% 在浏览器中运行的腌菜街机，打包进单个自包含 HTML 文件，离线优先 —— 无 CDN，无服务器。这只陶罐只懂走**斜线**：按住两个方向键斜冲、加速、斩碎霉菌、苍蝇与菜虫，赶在陶罐裂成三瓣之前把它装满！**9 种模式 · 14 种食材 · 16 项成就 · TOP 8 名人堂 · 游戏内 7 种语言。**

这是一款致敬越南家常腌菜的**单屏动作游戏**。没有线性关卡，没有繁杂菜单 —— 只有陶罐、无尽的腌菜雨，和你燃烧的反应速度。

<img src="assets/divider.svg" alt="" width="100%" />

## 🆕 v1.1.8 新特性

> 1.2.0 之前的**最后一个补丁**。没有新玩法、没有平衡性改动、没有存档格式变更。这最后一轮只做一件事：**首屏自己测量窗口并选择布局** —— 任何尺寸下都不滚动、不裁切。甲板横条被移除，20 张 SVG 全部重绘。

### 📐 一次没人管的加法——同时造成四个错误

截图里报了四个问题，但原因**只有一个**。角落面板行和滚动条原本是 hero 的 `shrink-0` 弹性兄弟，先拿走自己的高度，剩下的才轮到 hero：

```
720px 窗口
├── 415px   GAME/INFO 面板行   （高度随内容，shrink-0）
├──  55px   滚动字幕           （高度随文字，shrink-0）
└── 250px   hero               ← 剩下的空间，而它需要 ~430px
```

| 截图中的症状 | 原因 |
| --- | --- |
| `LỌ` 在上边缘被裁掉 | hero 只有 250px，内容要 430px |
| `CÀI ĐẶT` 溢出面板 | 面板按内容定高，而不是按窗口 |
| 版权行被切成两半 | 滚动字幕需要 55px，只分到 48px |
| 「玩法」的 `×` 浮在屏幕中间 | 容纳它的手风琴已经滚出视野 |

修法不是多给几像素余量，而是**把高度只声明一次，其余全部读回来**：`layout/metrics.ts` 保存所有数字，`layout/fit.ts` 返回纯函数 `MenuPlan`，`MenuChrome` 是单独一条 `absolute inset-x-0 bottom-0`，hero 用**同一个**函数算出的 `padding-bottom` 预留空间。

<img src="assets/layout-fix.svg" alt="1.1.8 修复前后——1.1.7 把场景压到 250px 导致陶罐被裁，1.1.8 保留 342px 场景并为面板预留 378px（SMIL 动画）" width="100%" />

### 🌀 滚动错误：滚动容器里再套滚动容器

下面纹丝不动，上面却还能上下拖——与描述完全一致。v1.1.7 把 hero 内容包在 `overflow-y-auto` 里，再用 `min-h-full` + `justify-center` 居中。这在内容**比容器矮**时没问题；一旦内容**更高**，`justify-center` 会把它往上推，顶部就落在*滚动原点之上*——任何滚动位置都到不了。

现在整屏只有**一个**滚动容器（`.menu-scroll`），内容锚定在顶部，永不垂直居中。造成错误的三个类——`flex-1 overflow-y-auto`、`min-h-full`、`justify-center`——由 `tests/menu-layout.test.ts` 禁止回归。

### 🎯 主视觉：`LỌ CHÉO` 居中并上移

- 标题**水平居中**后**略微上移**，字号同时受宽度与高度限制，窗口再矮也不会溢出字形。
- 陶罐移到右侧，周围是**三道光环 18s / 26s / 34s**——旧版单环 14s 看起来像加载动画。
- 标题上下两带共 **14 件装饰**（星星、火花、圆环、气泡、辣椒、青柠叶、苍蝇、鱼露滴），每件各有自己的时长与延迟——回应"只有 LỌ CHÉO 和陶罐太少了"。
- 坐标是 `scene/decor.ts` 中的**数据**并带碰撞函数，因此 `tests/menu-decor.test.ts` 可以锁住位置与数量。

### 📖 「玩法」移进 GAME 菜单

六条规则和按键表不再放在 hero（打开就会把 `LỌ` 顶出屏幕），而是成为 **GAME 面板中的一行**，打开模态框（`HowToModal`）——无论开合，版面都不动。浮在屏幕中间的 `×` 随着手风琴一起消失。

### 🗂️ 项目又多了几个目录

```
src/components/menu/
├── layout/          metrics.ts · fit.ts · useMenuPlan.ts      ← 新增：所有数字集中一处
├── scene/           decor.ts · DecorGlyph · HeroDecor · JarHalo ← 新增：装饰后的 hero
├── ticker/          strings.ts · tickerTone.ts · MenuTicker     ← 新增：字幕独立模块
├── howto/           rules.ts                                    ← 新增：6 条规则 + 按键表
├── background/      layers.ts · MenuBackground                  ← 8 层背景，用数据声明
└── MenuChrome.tsx · HowToModal.tsx                              ← 新增：底部条 + 模态框
```

### 🐛 修复

| # | 错误 | 修复 |
| --- | --- | --- |
| 1 | 下面不动，上面仍可滚动 | 去掉嵌套滚动框，只留**一个**顶端锚定的 `.menu-scroll` |
| 2 | `LỌ` 在上边缘被裁 | hero 保留 342px 场景，不再被压到 250px |
| 3 | `CÀI ĐẶT` 溢出 GAME 面板 | `CornerPanel.height` 改为**必填**：318px（紧凑）/ 458px（完整） |
| 4 | 版权行被切成两半 | 字幕固定 48px，版权行与跑马灯同一块 |
| 5 | 「玩法」的 `×` 浮在屏幕中间 | 手风琴 → 模态框，不再有 `absolute` 挂在已滚走的框上 |
| 6 | 面板高度随译文长度变化（德语/泰语先溢出） | 声明高度，与内容无关 |
| 7 | 单环 14s 看起来像加载动画 | 三环 18s / 26s / 34s，几乎永不同相 |
| 8 | 文档/SVG/启动器版本滞后 | 全量扫描 10 个 README + docs + 16 个 SVG → 1.1.8 |

→ 完整详情：[docs/releases/v1.1.8.md](docs/releases/v1.1.8.md) · 上一版：[docs/releases/v1.1.7.md](docs/releases/v1.1.7.md)

### 🪟 两张截图，同一个窗口，相差 260 像素

本轮最后两张截图是**同一个应用**：`1920×1080` 全屏和 `1920×820` 窗口。宽度一个像素都没变。但在第二张里，首屏的下半部分**躲到了**两个角面板下面，`CHẾ ĐỘ CHƠI` 标签被切成两半。

原因不是高度不够，而是**问题问错了**：

| 决定布局的东西 | 知道 | 不知道 |
| --- | --- | --- |
| CSS 的 `sm:` · `lg:` | **宽度** | **高度** |
| `plan.minimal` | **高度**（低于 220px） | 宽度，而且等到已经太晚 |
| `heroLayout()`（新增） | **两者**，来自边框所用的同一个数字 | — |

依赖*两个轴*的决定，写不成单轴的媒体查询。于是首屏布局离开 CSS，变成一个纯函数：`heroLayout({ scene, width, minimal })`。

`scene` 是 `planMenuLayout()` 分配给首屏的高度 —— **正是**边框保留的那个数。两者不可能错位，因为它们读同一个函数。

#### 三个阈值，全部是推导出来的

| 常量 | 值 | 推导自 |
| --- | --- | --- |
| `HEIGHT_FOR_BADGE_ROW` | **232** | wordmark 150 + 徽章 40 + 实时徽章 22 = 212，再加 20px 余量 |
| `HEIGHT_FOR_HALO` | **300** | 锁定区 150 + 光环 240 − 重叠 90 |
| `HEIGHT_FOR_SIDE_BY_SIDE` | **300** | 较高的一列：吉祥物 192 + 标签 24 + 内边距 |

`232` 是**被抓住的 bug**：初稿写的是 `210` —— 低于它自己所守护的 212px 锁定区。210px 的横条就画出了 212px 的锁定区，纪录那一行被裁掉。正是本轮在修的那类 bug，却是修复本身制造出来的。

`tests/menu-adaptive.test.ts` 扫描 **1,682 个视口**，并在每个样本上验证 `heroContentHeight(layout) ≤ scene`。

#### 缺失的第四个事件

用户是**按下全屏键**才拍出那两张的。应用监听 `resize` 和 `orientationchange`。Firefox 在切换全屏时两个都不触发；旧版 Safari 只触发 `webkitfullscreenchange`。于是窗口高度变了，首屏保留着旧方案，标签一直是被切的状态，直到下一次 resize。

`VIEWPORT_EVENTS` 把六种拼写收在一处，因为 `useMenuPlan()` 和 `useViewportWidth()` **都**需要它 —— 以前各自注册自己的副本，也就是两份副本可能描述两个不同的窗口。

### 🗑️ 图 12 里的分隔带 —— 以及随之消失的甲板

第三张是从屏幕中央裁出的 `1443×180` 条带：`🎮` 标记、一条金色横线，然后三个标题 `GAME / 今日挑战 / 今日规则`。那就是**甲板** —— 固定高度横条里的三栏文字。

它没法待在那儿，另外两张截图说明了原因：在 `1920×1080` 下右栏被**从句子中间**裁断，在 `1920×820` 下整行都在面板下面。一条能容下 200px wordmark 的横条，容不下三段文字。

甲板说过的内容没有丢：

| 甲板说什么 | 现在在哪 |
| --- | --- |
| 你要玩的模式 | 吉祥物下方的标签；完整列表在 GAME 里 |
| **今日挑战** | INFO 面板的一行 —— `模式 · 目标` |
| 今日规则 | 玩法弹窗的一行，它一直是那六条规则的完整版 |

日期计算**没有**跟着走：`challengeFor()` 和 `tipIndexFor()` 移到了 `src/game/daily/`，21 个测试和名字一并过去。

wordmark 下方的空带现在是**故意的**。那就是一个在任何尺寸都合适的首屏的代价。

### 🏷️ 分层更新日志——每层一种颜色

| 层级 | 标签 | 颜色 | 含义 | 例 |
| --- | --- | --- | --- | --- |
| `major` | **MAJOR** | 🩷 粉 `#ff5fb0` | 大版本——新增系统 | 1.0.0 |
| `minor` | **UPDATE** | 🟡 金 `#f5a81c` | 升级——新增内容 | 1.1.0 |
| `patch` | **PATCH** | 🟣 紫 `#9d6bff` | 修复与清理 | 1.1.1 → **1.1.8** |

层级由 `tierFor(version)` **从 SemVer 推导**，绝不手写。面板新增**筛选**：全部 · MAJOR · UPDATE · PATCH，并显示各层数量。

<img src="assets/release-tiers.svg" alt="MAJOR/UPDATE/PATCH 三层及其颜色与十个版本的时间轴（SMIL 动画）" width="100%" />

<img src="assets/test-matrix.svg" alt="1.1.8 测试矩阵——51 个文件 501 项测试、九个质量门（SMIL 动画）" width="100%" />

<img src="assets/corner-menu.svg" alt="GAME（左下）与 INFO（右下）面板滑入（SMIL 动画）" width="100%" />

<img src="assets/settings-sections.svg" alt="六段设置（自 v1.1.6）——开关、等级条与选择器（SMIL 动画）" width="100%" />

## 📐 自适应布局 —— 首屏如何选择自己的形态

开始屏幕不用媒体查询决定布局。它**测量**窗口，从五种能力中挑选：`sideBySide`、`halo`、`badgeRow`、`mascot`、`liveBadge`。

```
planMenuLayout(viewport) → { scene, reserve, … }    scene + reserve = 高度
            │
            └─ scene 正是边框保留的那个数
                        │
    heroLayout({ scene, width }) → 5 个布尔
```

| 标志 | 何时开启 | 关闭后消失什么 |
| --- | --- | --- |
| `sideBySide` | 宽度 ≥ 1024 **且** 首屏 ≥ 300px | 吉祥物落到 wordmark 下方 |
| `halo` | 首屏 ≥ 300px | 坛子周围的环 |
| `badgeRow` | 首屏 ≥ 232px | 「HŨ DƯA ĐẠI CHIẾN」牌和纪录行 |
| `mascot` | 几乎始终 | ——（仅在最精简模式隐藏） |
| `liveBadge` | 首屏 ≥ 232px | 「厨房直播」行和版本号 |

三个阈值**都不是整数** —— 每一个都等于它所守护之物的真实高度：

```ts
HEIGHT_FOR_BADGE_ROW    = 232  // 150 wordmark + 40 牌 + 22 live + 20 余量
HEIGHT_FOR_HALO         = 300  // 150 锁定区 + 240 环 − 90 重叠
HEIGHT_FOR_SIDE_BY_SIDE = 300  // 较高的一列：192 吉祥物 + 24 标签
```

`tests/menu-adaptive.test.ts` 扫描 **1,682 个视口**，在每个样本上验证 `heroContentHeight(layout) ≤ scene`。窗口变化时，两个 hook 监听**六个**事件，在一帧内更新。

## ✨ 亮点功能

| 分类 | 详情 |
| --- | --- |
| 🎮 **9 种模式** | **经典腌制**（均衡）· **清心禅意**（无危险物，×0.5）· **辣椒火焰**（速度 +35%，×1.5）· **60秒冲刺**（限时 60s，×1.25）· **黄金丰收**（黄金掉落 ×2.6）· **腌菜暴雨**（密度 ~1.4×，×0.75）· **薄瓷**（一裂即碎，×2.0） · **连击节庆**（连击窗口 ×2，×1.15）· **腌菜盛宴**（密度 ~×2，满罐 ×2.5，×0.6） |
| 🌐 **游戏内 i18n** | Tiếng Việt · English · 中文 · 日本語 · 한국어 · Español · Français —— `src/i18n/`（纯模块 + React 桥接），`t()` 支持插值，同步 `<html lang>`，数字按 locale 分组（vi-VN / en-US / zh-CN / ja-JP / ko-KR / es-ES / fr-FR） |
| 🕹️ **专属“斜切”机制** | 同时按住两个方向键/斜向轴 —— 陶罐加速、发光并斩碎危险物。配有独立耐力条与防闪烁回滞 |
| 🥬 **14 种食材** | 小茄子、辣椒、大蒜、生姜、盐、芥菜、**金卷心菜**（快速装罐）· 黄金盐/黄金蒜 · 魔鬼辣椒 · 寒冰 · 霉菌、苍蝇、**菜虫**（危险物） |
| 🧄 **黄金蒜护盾** | 道具：最多叠加 **2 层护盾**吸收裂痕；陶罐周围环绕旋转光环 |
| 🏆 **16 项成就** | **跨局累计**存档（localStorage），结算画面弹出“新成就！” |
| 🔊 **手工音效** | 11 种 Web Audio API 合成音效（零音频文件）+ 随等级变调的五声音阶背景乐，`M` 键静音 |
| 💾 **TOP 8 名人堂** | 本地存档，读取时校验并归一化，姓名自动大写，新纪录高亮 |
| 🎨 **60fps 画质** | Canvas 2D，粒子上限 460，DPR 上限 2，离屏预渲染花砖地板，星光闪烁 + 菜单极光 |
| 📴 **真·离线优先** | 自托管字体（latin + 越南文子集，woff2），无 CDN、无接口 —— 双击 `dist/index.html` 即玩 |
| 🧪 **质量保障** | 360 项单元测试（vitest）覆盖 modes / achievements / storage / i18n / settings —— `npm run check` 为 CI 关卡 |

<img src="assets/items.svg" alt="14 种食材 — 要接的腌菜、要捡的黄金道具、要躲的危险物" width="100%" />

## 🌐 切换语言

Lọ Chéo 内置 **7 种界面语言**，即时生效 —— 无需刷新、不中断对局：

<img src="assets/languages.svg" alt="7 种语言 — VI · EN · 中文 · 日本語 · 한국어 · Español · Français" width="100%" />

| 语言 | 入口 | 存储键 |
| --- | --- | --- |
| 🇻🇳 Tiếng Việt | **VI** 按钮（默认；未设置时跟随浏览器语言） | `locheo.lang.v1` |
| 🇬🇧 English | **EN** 按钮 | `locheo.lang.v1` |
| 🇨🇳 中文 | **中** 按钮 | `locheo.lang.v1` |
| 🇯🇵 日本語 | **日** 按钮 | `locheo.lang.v1` |
| 🇰🇷 한국어 | **한** 按钮 | `locheo.lang.v1` |
| 🇪🇸 Español | **ES** 按钮 | `locheo.lang.v1` |
| 🇫🇷 Français | **FR** 按钮 | `locheo.lang.v1` |

- 在**设置 → 语言**中切换（7 个国旗按钮的网格）—— 唯一入口，菜单上不再有浮动切换器。
- 所有用户可见文案都在 `src/i18n/locales/{vi,en,zh,ja,ko,es,fr}.ts` —— 画布引擎、各界面、HUD、弹字、跑马灯、提示。
- 缺少 key？`t()` 自动回退到越南语 —— 七套 locale 的 key 集合与占位符一致性由测试强制保证。

## 🕹️ 操作方式

| 操作 | 键盘 | 触屏 |
| --- | --- | --- |
| 移动 | `W` `A` `S` `D` 或 `← ↑ ↓ →` | 任意位置拖动（浮动摇杆） |
| **斜切（CHÉO）** | 同时按住**两个键**（如 `A`+`W`） | **45° 斜向拖动** —— 摇杆圆环变金色 |
| 拍罐（冲击波 + 吸附腌菜） | `Space` | 右下角红色**拍罐**按钮 |
| 暂停 / 继续 | `P` 或 `Esc` | 右上角暂停按钮 |
| 立即重开 | `R`（暂停/结算时也可） | “再腌一坛”按钮 |
| 开始 / 确认 | `Enter` | **进厨房**按钮 |
| 静音 / 取消静音 | `M` | 右上角扬声器按钮 |
| 切换语言 | —（使用 VI/EN/中/日/한/ES/FR 按钮） | 菜单 / 暂停界面的 VI/EN/中/日/한/ES/FR 按钮 |

## 🚀 安装与运行

### 免构建直接玩

```bash
# 每个发行版都附带单个自包含文件：
open dist/index.html      # macOS
xdg-open dist/index.html  # Linux
start dist/index.html     # Windows
```

### 生产构建

```bash
npm install        # 安装依赖（Node ≥ 20.19）
npm run build      # → dist/index.html（单个自包含文件）
```

> `vite-plugin-singlefile` 会把所有 JS/CSS/字体/图片内联进**一个** `dist/index.html`（约 700 KB，gzip 约 355 KB）。不需要服务器，不需要网络。

### 开发

```bash
npm run dev        # 带 HMR 的开发服务器（http://localhost:5173）
npm run preview    # 本地预览生产构建
npm run typecheck  # tsc --noEmit（strict，noUnusedLocals…）
npm run test       # vitest — 360 项单元测试（modes / achievements / storage / i18n / settings）
npm run check      # typecheck + test + build（CI 质量关卡）
```

## 🗂️ 项目结构

```
lo-cheoio/
├─ index.html              # 入口，SEO/OG 元信息（无 CDN）
├─ package.json            # lo-cheoio v1.1.8，dev/build/test/check 脚本
├─ .gitattributes          # *.bat/*.cmd → CRLF · posix → LF · binaries
├─ vite.config.ts          # vite + react + tailwind v4 + singlefile
├─ tsconfig.json           # strict；包含 src + tests
├─ favicon.ico             # web icon (multi-size 16→256)
├─ public/                 # favicon.ico/png/svg served at web root
├─ assets/
│  ├─ banner.svg           # README 横幅（SMIL 动画）
│  ├─ demo.svg             # 实战演示（SMIL 动画）
│  ├─ items.svg            # 14 种食材（SMIL 动画）
│  ├─ modes.svg            # 9 种模式（SMIL 动画）
│  ├─ languages.svg        # 7 in-game languages (SMIL animation)
│  ├─ new-modes.svg        # the 2 new v1.1.4 modes (SMIL animation)
│  ├─ corner-menu.svg     # corner GAME/INFO panels (SMIL animation, v1.1.5)
│  ├─ settings-sections.svg # 6-section settings tour (SMIL, v1.1.6)
│  ├─ divider.svg          # sparkle divider (SMIL animation)
│  ├─ license.svg          # 动态 AGPL-3.0 copyleft 印章（SMIL 动画）
│  └─ favicon.svg          # favicon (SMIL animation)
├─ scripts/
│  ├─ play-mac.command     # macOS 启动器 — 双击弹出全彩菜单
│  ├─ play-windows.bat     # Windows 启动器 — 双击弹出全彩菜单
│  ├─ play-linux.sh        # Linux 启动器 — 双击弹出全彩菜单
│  └─ README.md            # 给不熟悉终端用户的启动器指南
├─ docs/
│  ├─ README.md            # 文档目录（v1.1.5）
│  ├─ DESCRIPTION.md       # 多语言项目简介（vi/en/zh + SEO）
│  ├─ design/              # menu-corners / save-format / settings-format 规范
│  ├─ guides/              # engine 概览 · a11y · 性能 · storage keys · 发布流程…
│  └─ releases/
│     ├─ v1.0.0.md         # 首发版本说明
│     ├─ v1.1.0.md         # v1.1.0 版本说明
│     ├─ v1.1.1.md         # v1.1.1 版本说明
│     ├─ v1.1.2.md         # v1.1.2
│     ├─ v1.1.3.md         # v1.1.3 release notes
│     ├─ v1.1.4.md         # release notes (1.1.4)
│     ├─ v1.1.5.md         # release notes (1.1.5)
│     ├─ v1.1.6.md         # release notes (1.1.6)
│     └─ v1.1.8.md         # current release notes (1.1.8)
├─ README.md               # 🇻🇳 Tiếng Việt
├─ README.en.md            # 🇬🇧 English
├─ README.zh.md            # 🇨🇳 中文（本文件）
├─ README.ja.md            # 🇯🇵 日本語
├─ README.ko.md            # 🇰🇷 한국어
├─ README.es.md            # 🇪🇸 Español
├─ README.fr.md            # 🇫🇷 Français
├─ README.th.md            # 🇹🇭 ไทย
├─ README.de.md            # 🇩🇪 Deutsch
├─ README.pt.md            # 🇵🇹 Português
├─ src/
│  ├─ main.tsx             # React 入口，StrictMode
│  ├─ App.tsx              # 阶段状态机 menu/playing/paused/gameover
│  ├─ version.ts           # APP_VERSION = "1.1.8"（唯一版本来源）
│  ├─ index.css            # tailwind v4 主题 + 全部动画/渐变
│  ├─ assets/fonts/        # woff2 子集（Be Vietnam Pro ×6，Bungee）
│  ├─ styles/fonts.css     # @font-face + unicode-range，100% 离线
│  ├─ i18n/
│  │  ├─ i18n.ts           # 纯模块：检测、持久化、t() + 插值
│  │  ├─ useI18n.ts        # React hook：useI18n/useLanguage
│  │  └─ locales/          # vi.ts（key 源）· en · zh · ja · ko · es · fr
│  ├─ components/
│  │  ├─ GameCanvas.tsx    # 画布 + 浮动摇杆 + 键盘 + 可见性处理
│  │  ├─ StartScreen.tsx   # 菜单：主视觉 + 多层动效 + 角落面板
│  │  ├─ menu/              # 角落 GAME/INFO 面板 + 弹窗 + icons/
│  │  │  └─ background/     # 8 background layers as data (v1.1.8)
│  │  ├─ ModeSelector.tsx  # 9 张模式卡（classic/zen/inferno/blitz/goldrush/storm/hardcore · combo · feast）
│  │  ├─ AchievementsPanel.tsx  # 已锁/已解锁徽章墙
│  │  ├─ GameOverScreen.tsx     # 罐子碎了！+ 分数 + 新成就
│  │  ├─ PauseScreen.tsx        # 暂停 + 本局数据
│  │  ├─ settings/           # 六个分区设置模块 + 控件（v1.1.6）
│  │  └─ ui/               # 八个基础组件，每个一个文件（v1.1.8——从 ui.tsx 拆出）
│  ├─ game/
│  │  ├─ engine.ts         # 全部模拟与画布渲染（约 2100 行）
│  │  ├─ modeTypes.ts      # ModeId · ModeConfig (types-only, v1.1.8)
│  │  ├─ modes/            # 9 balance records — classic.ts … feast.ts (v1.1.8)
│  │  ├─ modesIndex.ts     # MODES · MODE_LIST · isModeId (v1.1.8)
│  │  ├─ modeMath.ts       # multiplierForCombo · jarBonus · comboWindowFor… (v1.1.8)
│  │  ├─ modes.ts          # barrel — keeps every old import working
│  │  ├─ achievements.ts   # 16 枚徽章 + 纯校验器（纯函数）
│  │  ├─ storage.ts        # localStorage：TOP 8、进度、成就
│  │  ├─ audio.ts          # Web Audio 合成：音效 + 五声音阶音乐
│  │  ├─ changelog/          # in-game changelog (v1.1.8 — split from one file)
│  │  │  ├─ types.ts        #   ChangelogEntry · ReleaseTier · copyFor()
│  │  │  ├─ tiers.ts        #   tierFor() · TIER_ORDER · TIER_LABEL_KEY
│  │  │  ├─ entries/        #   1 file per release — v1_0_0.ts … v1_1_7.ts
│  │  │  └─ index.ts        #   ordered list + 5 helpers
│  │  ├─ runSave.ts         # 中断对局持久化
│  │  ├─ settings.ts        # 设置 schema、默认值、归一化
│  │  ├─ settingsIO.ts      # 备份/恢复编解码（v1.1.6）
│  │  ├─ settingsPresets.ts # 四个快速预设（v1.1.6）
│  │  └─ audioLevels.ts     # 纯音频增益计算（v1.1.6）
│  └─ utils/
│     ├─ cn.ts             # clsx + tailwind-merge
│     └─ useFocusTrap.ts   # 弹窗焦点捕获（v1.1.6）
└─ tests/                  # vitest — 51 个文件 · 501 项测试（modes · achievements · storage · i18n · runSave · settings · presets · audio…）
```

## 🧱 架构与性能
<img src="assets/architecture.svg" alt="Lọ Chéo v1.1.8 架构——输入 → 引擎 → 状态 → 渲染，另含服务层（SMIL 动画）" width="100%" />


- **游戏主循环** `requestAnimationFrame`，增量时间钳制到 `1/20s`，乘以 `timeScale`（寒冰慢动作），每次接住还有几十毫秒 **hit-stop** 停顿带来打击感。
- **画布 HUD** 每帧直绘；React 只按 `phase` 渲染界面 —— 热循环中不重渲染 React；切换语言后 HUD 下一帧即读取新词典。
- **分层 i18n**：`src/i18n/i18n.ts` 为纯模块（不依赖 React），`useI18n` 仅通过 `locheo:languagechange` 事件桥接重渲染；`t()` 支持 `{param}` 插值并回退到越南语。
- **花砖地板** 一次离屏预渲染（含暗角与光池），星光闪烁与气泡实时计算 —— 极其廉价。
- **预算**：≤460 粒子，≤70 物品，≤34 弹字，DPR ≤ 2；按 hitbox 扫描碰撞；落地的腌菜印记会自行消失。
- **localStorage** 输入校验/归一化 —— 一条脏记录不会毁掉整个榜；存储被禁用（Safari 无痕模式）时照常在内存中游玩；语言选择单独存放在 `locheo.lang.v1`。
- **动效关怀**：`prefers-reduced-motion` 关闭极光/流光/旋转；背景星光与屏幕震动同样遵循媒体查询。

## ❓ 常见问题

**Windows 启动器遇到越南文报错？**
v1.1.4 已修复：`play-windows.bat` 为 CRLF + UTF-8 BOM、`chcp 65001`，越南语声调完整 —— `'Ọ' is not recognized...` 错误彻底消失。若用其他编辑器修改 .bat，请保持 CRLF 与 BOM（`.gitattributes` 自动强制）。


**没有网络可以玩吗？**
可以 —— 100% 可以：打开 `dist/index.html` 即可完整游玩，包括字体与音效，没有任何网络请求。

**有广告或追踪吗？**
没有。无追踪、无分析 —— 你的分数只存在本机 localStorage 里。

**切换语言会丢档吗？**
不会。分数、成就、进度、模式选择都与 `locheo.lang.v1` 相互独立。

**TOP 8 名人堂存在哪里？**
`locheo.scores.v1`（分数）、`locheo.progress.v1`（累计局数/罐数/斩碎数）、`locheo.achievements.v1`（徽章）—— 清空存储就会丢失，所以请珍惜这只陶罐！

**想新增一种语言？**
添加 `src/i18n/locales/xx.ts` 并镜像 `vi.ts` 的 key 集合，更新 `LANGUAGES` 与测试，然后提交 PR —— 详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

**不会敲命令？**
双击 [`scripts/play-mac.command`](scripts/play-mac.command)（macOS）、[`scripts/play-windows.bat`](scripts/play-windows.bat)（Windows）或 [`scripts/play-linux.sh`](scripts/play-linux.sh)（Linux）—— 全彩菜单会弹出；选 `1` 即构建并立刻游玩，选 `2` 进入开发模式。详见 [scripts/README.md](scripts/README.md)。

## 📦 发行版与更新日志

| 版本 | Tier | 日期 | 说明 |
| --- | --- | --- | --- |
| [v1.1.8](docs/releases/v1.1.8.md) | 🟣 **PATCH** | 2026-11-12 | **开始界面不再溢出**：一次高度加法失误让 hero 只剩 250px，`LỌ` 被裁 · **滚动错误**（嵌套滚动框 + `justify-center`）改为**单一**顶部锚定的 `.menu-scroll` · **「玩法」移入 GAME 菜单**（模态框）· 面板声明高度 **318px/458px** 而非随内容 · 字幕 48px · **14 件主视觉装饰** + **3 道光环** · `src/components/menu/{layout,scene,ticker,howto}/` · **501 项测试 / 47 文件** |
| [v1.1.7](docs/releases/v1.1.7.md) | 🟣 **PATCH** | 2026-11-10 | **菜单背景去雾**（四层叠加：`blur 64→22px`、角落暗角替换全屏、CRT 边框 140→90px、地面 45→70%）· **分层彩色日志** · 8 个旧版 **96 条新描述** · 日期重排 · `src/game/changelog/` 拆分 · 10 个 README 重做 · **256 测试** |
| [v1.1.6](docs/releases/v1.1.6.md) | 🟣 **PATCH** | 2026-11-08 | **六分区设置**（预设 · 音频 · 画面 · 语言 · 备份 · 数据）· 0–100 音量 · 震动强度 · 画质 · 切标签自动暂停 · 语言移入设置 · 4 个预设 · JSON 导入导出 · 多层动态菜单 · 作者卡片渐变流动 · 弹窗焦点捕获 · 修复刷新后音乐 · **150 项测试** |
| [v1.1.5](docs/releases/v1.1.5.md) | 🟣 **PATCH** | 2026-11-06 | **双角 GAME/INFO 菜单**（开始 · 继续 · 模式 · 排行榜 · 成就 · 设置 / 关于 · 更新日志 · 退出）· **保存并恢复未完成对局**（`locheo.run.v1`）· 游戏内设置（音效/音乐/震动/减少动态）· 修复快捷键穿透弹窗 · prefers-reduced-motion 全覆盖 · **113 项测试** |
| [v1.1.4](docs/releases/v1.1.4.md) | 🟣 **PATCH** | 2026-11-04 | **9 种模式**（新增连击节庆 · 腌菜盛宴）· **16 项成就** · **7 种语言**（新增 ES/FR）· 修复 play-windows.bat（CRLF+BOM）· 7 语言启动器 · 61 项测试 |
| [v1.1.3](docs/releases/v1.1.3.md) | 🟣 **PATCH** | 2026-11-02 | 7 种模式（新增腌菜暴雨 · 薄瓷）· 14 项成就 · 5 种语言 · favicon · 多语言启动器 · 55 项测试 |
| [v1.1.2](docs/releases/v1.1.2.md) | 🟣 **PATCH** | 2026-10-31 | 5 种模式（60秒冲刺 · 黄金丰收）· 12 项成就 · 连击火焰 · 双击启动器 · README 10 种语言 · 49 项测试 |
| [v1.1.1](docs/releases/v1.1.1.md) | 🟣 **PATCH** | 2026-10-29 | 游戏内 i18n VI/EN/ZH · README 7 种语言 · 全面修 BUG · 45 项测试 |
| [v1.1.0](docs/releases/v1.1.0.md) | 🟡 **UPDATE** | 2026-10-27 | 3 种模式 · 黄金蒜护盾 · 菜虫 · 金卷心菜 · 10 项成就 · 自托管字体 |
| [v1.0.0](docs/releases/v1.0.0.md) | 🩷 **MAJOR** | 2026-10-24 | 首发：完整引擎，11 种食材，拍罐冲击波，×9 连击 |

另见 [CHANGELOG.md](CHANGELOG.md)。

## 🗺️ 路线图（草案 — 可能随反馈调整）

| 里程碑 | 预期 | 创意 |
| --- | --- | --- |
| **v1.2.0** | 2026 Q1 | 每种玩法的程序化配乐 · CI 中的视觉回归测试（Playwright）· 更深入的字体子集化以压缩体积 |
| **v1.3.0** | 2026 Q1–Q2 | 第 10 个玩法（候选：**蜂群风暴** —— 全是苍蝇，靠斩杀求生）· 每日挑战的 seed 玩法 |
| **v1.4.0** | 2026 Q2 | **可选（opt-in）** 在线排行榜（serverless，加密）—— 离线优先依然是默认 |
| Backlog | — | 最佳对局幽灵回放 · 摄影模式（隐藏 HUD，导出 PNG）· 泰语（ไทย）译本评估中 |

*路线图不是承诺 — 优先级永远是：稳定 → 更好玩 → 更多内容。*

## 📚 延伸阅读与开发文档

设计说明与更深入的技术文档：

| Doc | What it covers |
| --- | --- |
| [docs/releases/v1.1.8.md](docs/releases/v1.1.8.md) | 发行版 v1.1.8 —— 一次高度加法造成的四个版面错误、嵌套滚动错误、「玩法」移入 GAME 菜单、14 件主视觉装饰 |
| [docs/releases/v1.1.7.md](docs/releases/v1.1.7.md) | 发行版 v1.1.7 —— 菜单背景去雾（四层诊断）、分层彩色日志、96 条新描述 |
| [docs/releases/v1.1.6.md](docs/releases/v1.1.6.md) | 发行版 v1.1.6 —— 六分区设置、预设、备份、多层菜单场景 |
| [docs/releases/v1.1.5.md](docs/releases/v1.1.5.md) | 发行版 v1.1.5 — 四角菜单、保存/继续、设置、修复 |
| [docs/design/menu-corners.md](docs/design/menu-corners.md) | 四角 GAME/INFO 菜单设计 — 原则、a11y、响应式 |
| [docs/design/save-format.md](docs/design/save-format.md) | Spec `locheo.run.v1` — 暂停对局快照（schema + 生命周期） |
| [docs/design/settings-format.md](docs/design/settings-format.md) | Spec `locheo.settings.v1` — 游戏设置（schema + 接线） |
| [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md) | 常见问题 — 黑屏 · 无声音 · 继续游戏 · 启动器 |
| [scripts/smoke-ssr.tsx](scripts/smoke-ssr.tsx) | 无头渲染冒烟测试（完整菜单/弹窗树） |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | CI: npm ci → npm run check (Node 22) |

## 🤝 贡献

1. Fork 仓库，按 `arena/<名称>` 或 `feat/<名称>` 规范创建分支。
2. 提 PR 前 `npm run check` 必须全绿（typecheck + 501 项测试 + build）。
3. 非必要不新增运行时依赖 —— 理念：**一个文件、不联网、永久可玩**。
4. PR 描述请注明受影响的界面/模式；若涉及玩法变更请附录屏。

## 📄 许可证与作者

<img src="assets/license.svg" alt="AGPL-3.0-only — copyleft 许可证" width="400" />

- **AGPL-3.0-only** © 2026 [Standardize Paradigm](mailto:standardizeparadigm@donuco.com) —— 见 [LICENSE](LICENSE) 与 [assets/license.svg](assets/license.svg)。
- 字体：[Be Vietnam Pro](https://fonts.google.com/specimen/Be+Vietnam+Pro) 与 [Bungee](https://fonts.google.com/specimen/Bungee) —— SIL Open Font License 1.1（自托管 woff2 子集）。
- 致敬越南每一桌饭上的那坛腌菜。🫙🇻🇳
