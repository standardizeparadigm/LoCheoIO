<div align="center">

<img src="assets/banner.svg" alt="Lọ Chéo — 酢漬け壺大戦争" width="100%" />

# LỌ CHÉO — 酢漬け壺大戦争

### 🫙 ブラウザで100%動くベトナム漬物アーケード — 単一HTMLファイル・オフラインファースト
### 🌐 ゲーム内7言語 — Tiếng Việt · English · 中文 · 日本語 · 한국어 · Español · Français

[🇻🇳 Tiếng Việt](README.md) · [🇬🇧 English](README.en.md) · [🇨🇳 中文](README.zh.md) · [🇯🇵 日本語](README.ja.md) · [🇰🇷 한국어](README.ko.md) · [🇪🇸 Español](README.es.md) · [🇫🇷 Français](README.fr.md) · [🇹🇭 ไทย](README.th.md) · [🇩🇪 Deutsch](README.de.md) · [🇵🇹 Português](README.pt.md)

[![Version](https://img.shields.io/badge/version-1.1.8-f5a81c.svg?style=for-the-badge&logo=semver&logoColor=black)](docs/releases/v1.1.8.md)
[![Tier](https://img.shields.io/badge/tier-PATCH%20%C2%B7%20violet-9d6bff.svg?style=for-the-badge)]
[![Tests](https://img.shields.io/badge/tests-842%20%C2%B7%2079%20files-2bb48c.svg?style=for-the-badge&logo=vitest&logoColor=white)]
[![CI](https://github.com/standardizeparadigm/Lo-CheoIO/actions/workflows/ci.yml/badge.svg)](https://github.com/standardizeparadigm/Lo-CheoIO/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-AGPL--3.0--only-e63b2e.svg?style=for-the-badge)](LICENSE)
[![Offline](https://img.shields.io/badge/offline--first-100%25-2bb48c.svg?style=for-the-badge)](#-インストールと実行)
[![Single File](https://img.shields.io/badge/single--file-HTML-8cc63f.svg?style=for-the-badge)](#-プロダクションビルド)
[![Languages](https://img.shields.io/badge/UI-VI%20%C2%B7%20EN%20%C2%B7%20ZH%20%C2%B7%20JA%20%C2%B7%20KO%20%C2%B7%20ES%20%C2%B7%20FR-ffc94a.svg?style=for-the-badge&logo=googletranslate&logoColor=black)](#-言語の切り替え)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ffc94a.svg?style=for-the-badge)](CONTRIBUTING.md)

<img src="assets/demo.svg" alt="Lọ Chéo プレイ画面 — 壺が斜めに突進し、漬物をキャッチし、カビを斬る" width="100%" />

<img src="assets/languages.svg" alt="7つの言語 — VI · EN · 中文 · 日本語 · 한국어 · Español · Français" width="100%" />

<img src="assets/palette-ribbon.svg" alt="Lọ Chéo のパレット——七つの帯が交互に息づく（SMIL アニメーション）" width="100%" />

</div>

---

## 🥒 プロジェクトについて

> Lọ Chéo — 酢漬け壺大戦争：ブラウザで100%動く漬物アーケード。単一の自己完結HTMLファイルに詰め込まれた、オフラインファースト設計 — CDNなし、サーバーなし。この陶壺は**斜め移動**しかできません。2つのキーを押して斜めに疾走し、加速し、カビ・ハエ・青虫を斬り刻み、陶壺が三つに割れる前に満杯にしましょう！**9モード · 14食材 · 16実績 · TOP 8ランキング · ゲーム内7言語。**

これはベトナムの家庭的な漬物にインスパイアされた**ワン画面アクション**です。直線的なレベルも煩雑なメニューもありません — あるのは壺と、無限に降り注ぐ漬物と、燃えるような反射神経だけ。

<img src="assets/divider.svg" alt="" width="100%" />

## 🆕 v1.1.8 の新機能

> 1.2.0 前の**最後のパッチ**。新モードなし、バランス変更なし、セーブ形式の変更なし。この最終ラウンドが行うのは一つだけ —— **ヒーローがウィンドウを測り、自分でレイアウトを選ぶ**。どのサイズでもスクロールも切れもなし。デッキの帯は削除、20 枚の SVG はすべて描き直し。

### 📐 誰も管理していなかった足し算——そして同時に四つの不具合

スクリーンショットは四つの問題を報告していましたが、原因は**一つ**でした。コーナーパネルの行とティッカーは `shrink-0` のフレックス兄弟で、先に自分の高さを取り、残りだけがヒーローに回っていました：

```
720px のウィンドウ
├── 415px   GAME/INFO パネル行  （内容に応じた高さ、shrink-0）
├──  55px   ティッカー          （文字に応じた高さ、shrink-0）
└── 250px   ヒーロー            ← 残り。必要量は約430px
```

| スクリーンショットの症状 | 原因 |
| --- | --- |
| `LỌ` が上端で切れる | ヒーローが250px、内容は430px |
| `CÀI ĐẶT` がパネルからはみ出す | パネルがウィンドウではなく内容で高さを決めていた |
| 著作権表示が二つに切れる | ティッカーは55px必要だが48pxしか割り当てなし |
| 「遊び方」の `×` が画面中央に浮く | それを含むアコーディオンが画面外へスクロール済み |

修正は数ピクセルの余裕を足すことではなく、**高さを一度だけ宣言し、すべてがそこから読み返す**ことでした：`layout/metrics.ts` がすべての数値を持ち、`layout/fit.ts` が純粋な `MenuPlan` を返し、`MenuChrome` は `absolute inset-x-0 bottom-0` の一本の帯になり、ヒーローは**同じ**関数が計算した `padding-bottom` で場所を確保します。

<img src="assets/layout-fix.svg" alt="1.1.8 の修正前後——1.1.7 はシーンを250pxに圧縮して壺を切っていた、1.1.8 は342pxのシーンとパネル用378pxの余白を保つ（SMIL アニメーション）" width="100%" />

### 🌀 スクロールの不具合：スクロール領域の中のスクロール領域

下は動かないのに上はまだ上下に動く——ご指摘のとおりです。v1.1.7 はヒーローの中身を `overflow-y-auto` で包み、`min-h-full` + `justify-center` で中央寄せしていました。これは内容が枠より**低い**間だけ正しく動きます。内容が**高い**と `justify-center` が上へ押し出し、その天辺は*スクロール原点より上*に位置します——どのスクロール位置でも届きません。

いまは画面全体で**一つ**のスクロール領域（`.menu-scroll`）だけがあり、内容は上端に固定され、縦方向の中央寄せは一切しません。原因になった三つのクラス——`flex-1 overflow-y-auto`、`min-h-full`、`justify-center`——は `tests/menu-layout.test.ts` によって再発を禁止されています。

### 🎯 ヒーロー：`LỌ CHÉO` を中央に、少し上へ

- タイトルは**水平中央**に置かれ、そのあと**少し上へ**移動。文字サイズは幅と高さの**両方**で制限されるので、低いウィンドウでもグリフがあふれません。
- 陶器の壺は右へ移動し、周囲に**18s / 26s / 34s の三つの光輪**——旧版の14s単環は読み込みスピナーに見えていました。
- タイトルの上下二帯に**14個の装飾**（星、火花、輪、泡、唐辛子、ライムの葉、ハエ、魚醤のしずく）を配置。それぞれ独自の周期と遅延を持ちます——「LỌ CHÉO と壺だけでは少なすぎる」という声への回答です。
- 座標は `scene/decor.ts` の**データ**で、衝突判定関数付き。だから `tests/menu-decor.test.ts` が位置と個数の両方を固定できます。

### 📖 「遊び方」を GAME メニューへ

六つのルールとキー表はもうヒーローの中にありません——開くと `LỌ` が画面外へ押し出されていました。いまは **GAME パネルの一行**になり、モーダル（`HowToModal`）を開きます。開いても閉じてもレイアウトは動きません。画面中央に浮いていた `×` は、それを生んだアコーディオンと一緒に消えました。

### 🗂️ プロジェクトにまた新しいフォルダ

```
src/components/menu/
├── layout/          metrics.ts · fit.ts · useMenuPlan.ts       ← 新規：数値を一箇所に
├── scene/           decor.ts · DecorGlyph · HeroDecor · JarHalo ← 新規：装飾されたヒーロー
├── ticker/          strings.ts · tickerTone.ts · MenuTicker     ← 新規：帯を独立モジュールに
├── howto/           rules.ts                                    ← 新規：6ルール + キー表
├── background/      layers.ts · MenuBackground                  ← 8層の背景をデータで宣言
└── MenuChrome.tsx · HowToModal.tsx                              ← 新規：下部の帯 + モーダル
```

### 🐛 修正

| # | 不具合 | 修正 |
| --- | --- | --- |
| 1 | 下は静止、上はまだスクロールできる | 入れ子のスクロール枠を廃止、上端固定の `.menu-scroll` **一つ**に |
| 2 | `LỌ` が上端で切れる | ヒーローは342pxのシーンを保持、250pxに圧縮されない |
| 3 | `CÀI ĐẶT` が GAME パネルからはみ出す | `CornerPanel.height` を**必須引数**に：318px（コンパクト）/ 458px（リッチ） |
| 4 | 著作権表示が二つに切れる | ティッカーは固定48px、著作権はマーキーと同じ塊に |
| 5 | 「遊び方」の `×` が画面中央に浮く | アコーディオン → モーダル、流れ去った枠に `absolute` は無し |
| 6 | パネルの高さが翻訳の長さに従う（独語・タイ語が先にはみ出す） | 高さを宣言し、内容と無関係に |
| 7 | 14s の単環がスピナーに見える | 18s / 26s / 34s の三環、ほぼ同位相にならない |
| 8 | ドキュメント/SVG/ランチャーが版に遅れる | 10 README + docs + 19 SVG を全数走査 → 1.1.8 |

→ 詳細：[docs/releases/v1.1.8.md](docs/releases/v1.1.8.md) · 前回：[docs/releases/v1.1.7.md](docs/releases/v1.1.7.md)

### 🪟 2 枚のスクリーンショット、同じウィンドウ、260 ピクセルの差

このラウンドの最後の 2 枚は **同じアプリ** です。`1920×1080` の全画面と `1920×820` のウィンドウ表示。幅は 1 ピクセルも変わっていません。しかし 2 枚目では、ヒーローの下半分が 2 つの角パネルの **下に潜り**、`CHẾ ĐỘ CHƠI` チップが真っ二つに切れています。

原因は高さの不足ではなく、**問いの立て方** が間違っていたことです:

| レイアウトを決めるもの | 知っている | 知らない |
| --- | --- | --- |
| CSS の `sm:` · `lg:` | **幅** | **高さ** |
| `plan.minimal` | **高さ**（220px 未満） | 幅、しかも手遅れになってから |
| `heroLayout()`（新規） | **両方**、クロームと同じ数値から | — |

*2 軸* に依存する判断は、1 軸のメディアクエリでは書けません。だからヒーローのレイアウトは CSS を離れ、純粋関数になりました: `heroLayout({ scene, width, minimal })`。

`scene` は `planMenuLayout()` がヒーローに割り当てた高さ —— **クロームが予約しているのと同じ数値** です。両方が同じ関数から読むので、ずれようがありません。

#### 3 つのしきい値、すべて導出

| 定数 | 値 | 導出元 |
| --- | --- | --- |
| `HEIGHT_FOR_BADGE_ROW` | **232** | wordmark 150 + バッジ 40 + ライブバッジ 22 = 212、+ 余白 20 |
| `HEIGHT_FOR_HALO` | **300** | ロックアップ 150 + ヘイローリング 240 − 重なり 90 |
| `HEIGHT_FOR_SIDE_BY_SIDE` | **300** | 高い方の列: マスコット 192 + チップ 24 + 余白 |

`232` は **捕まえたバグ** です。最初の草稿は `210` でした —— 自分が制御する 212px のロックアップより下。210px の帯が 212px のロックアップを描き、記録の行が切れました。このラウンドが直しているバグの種類そのものを、修正自体が生んでいたわけです。

`tests/menu-adaptive.test.ts` は **1,682 のビューポート** を走査し、各サンプルで `heroContentHeight(layout) ≤ scene` を検証します。

#### 欠けていた 4 つ目のイベント

ユーザーはこの 2 枚を **全画面キーを押して** 作りました。アプリは `resize` と `orientationchange` を購読していました。Firefox は全画面切替でどちらも発火しません。古い Safari は `webkitfullscreenchange` だけです。だからウィンドウの高さが変わり、ヒーローは古い計画を保ち、チップは次のリサイズまで切れたままでした。

`VIEWPORT_EVENTS` は 6 つの綴りを 1 か所にまとめます。`useMenuPlan()` と `useViewportWidth()` の **両方** が必要とするからです —— 以前はそれぞれが自分のコピーを登録しており、2 つのコピーが 2 つの違うウィンドウを説明しうる状態でした。

### 🗑️ 画像 12 の区切り帯 —— そして一緒に消えたデッキ

3 枚目は画面中央から切り出した `1443×180` の帯です。`🎮` のマーカー、金色の罫線、そして `GAME / 今日の挑戦 / 今日のルール` の 3 見出し。これが **デッキ** —— 高さ固定の帯の中の 3 列の文章です。

そこには置けません。他の 2 枚がその理由を示しています: `1920×1080` では右の列が **文の途中で** 切れ、`1920×820` では行ごとパネルの下でした。200px の wordmark に足りる高さの帯は、3 つの段落にも足りる高さではありません。

デッキが語っていたことは失われていません:

| デッキの内容 | 現在の場所 |
| --- | --- |
| これから遊ぶモード | マスコット下のチップ。一覧は GAME 内 |
| **今日の挑戦** | INFO パネルの 1 行 —— `モード · 目標` |
| 今日のルール | 遊び方モーダルの 1 行。もともと 6 ルールの完全版 |

日付の計算は **一緒に消えていません**。`challengeFor()` と `tipIndexFor()` は `src/game/daily/` に移り、21 のテストと名前もそのまま移りました。

wordmark 下の空いた帯は、いまや **意図的** です。それが、あらゆるサイズで収まるヒーローの代償です。

### 🏷️ 変更履歴の階層——一階層に一色

| 階層 | ラベル | 色 | 意味 | 例 |
| --- | --- | --- | --- | --- |
| `major` | **MAJOR** | 🩷 ピンク `#ff5fb0` | 大きな版——仕組みの追加 | 1.0.0 |
| `minor` | **UPDATE** | 🟡 金 `#f5a81c` | アップグレード——内容の追加 | 1.1.0 |
| `patch` | **PATCH** | 🟣 紫 `#9d6bff` | 修正と整理 | 1.1.1 → **1.1.8** |

階層は `tierFor(version)` が **SemVer から導出**し、手書きしません。パネルには**絞り込み**（すべて · MAJOR · UPDATE · PATCH）と階層ごとの件数があります。

<img src="assets/release-tiers.svg" alt="MAJOR/UPDATE/PATCH の三階層とその色、十リリースのタイムライン（SMIL アニメーション）" width="100%" />

<img src="assets/test-matrix.svg" alt="1.1.8 のテストマトリクス——40ファイル344テスト、九つのゲート（SMIL アニメーション）" width="100%" />

<img src="assets/corner-menu.svg" alt="GAME（左下）と INFO（右下）パネルがスライドイン（SMIL アニメーション）" width="100%" />

<img src="assets/settings-sections.svg" alt="六区分の設定（v1.1.6 から）——スイッチ、レベルバー、ピッカー（SMIL アニメーション）" width="100%" />

## 📐 適応レイアウト — ヒーローが自分の形を選ぶ仕組み

スタート画面はレイアウトをメディアクエリで決めません。ウィンドウを**測って**、五つの能力から選びます: `sideBySide`・`halo`・`badgeRow`・`mascot`・`liveBadge`。

```
planMenuLayout(viewport) → { scene, reserve, … }    scene + reserve = 高さ
            │
            └─ scene はクロームが予約しているのと同じ数値
                        │
    heroLayout({ scene, width }) → 5 つの真偽値
```

| フラグ | 有効になる条件 | 無いと消えるもの |
| --- | --- | --- |
| `sideBySide` | 幅 ≥ 1024 **かつ** ヒーロー ≥ 300px | マスコットが wordmark の下へ回る |
| `halo` | ヒーロー ≥ 300px | 壺の周りのリング |
| `badgeRow` | ヒーロー ≥ 232px | 「HŨ DƯA ĐẠI CHIẾN」プレートと記録の行 |
| `mascot` | ほぼ常時 | —（最小エコノミーでのみ非表示） |
| `liveBadge` | ヒーロー ≥ 232px | 「厨房から生中継」の行とバージョン |

三つのしきい値は**丸い数字ではありません** — それぞれが制御する対象の実高さです:

```ts
HEIGHT_FOR_BADGE_ROW    = 232  // 150 wordmark + 40 プレート + 22 live + 20 余白
HEIGHT_FOR_HALO         = 300  // 150 ロックアップ + 240 リング − 90 重なり
HEIGHT_FOR_SIDE_BY_SIDE = 300  // 高い方の列: 192 マスコット + 24 チップ
```

`tests/menu-adaptive.test.ts` は **1,682 のビューポート**を走査し、各サンプルで `heroContentHeight(layout) ≤ scene` を検証します。リサイズ時は両フックが**六つ**のイベントを購読し、1 フレームで更新します。

## ✨ ハイライト

| グループ | 詳細 |
| --- | --- |
| 🎮 **9つのゲームモード** | **クラシック漬け**（バランス型）· **ZEN**（危険物なし、×0.5）· **インフェルノチリ**（速度+35%、×1.5）· **60秒ダッシュ**（タイムアタック60s、×1.25）· **ゴールドラッシュ**（黄金出現率×2.6）· **漬物ダウンポア**（〜1.4倍の密度、×0.75）· **薄陶器**（ひび1つで砕ける、×2.0） · **コンボ大祭**（コンボ窓 ×2、×1.15）· **漬物大宴会**（密度 ~×2、壺 ×2.5、×0.6） |
| 🌐 **ゲーム内 i18n** | Tiếng Việt · English · 中文 · 日本語 · 한국어 · Español · Français — `src/i18n/`（pureモジュール + Reactブリッジ）、補間対応の `t()`、`<html lang>` 同期、ロケール別数値表記（vi-VN / en-US / zh-CN / ja-JP / ko-KR / es-ES / fr-FR） |
| 🕹️ **シグネチャ「斜め切り」** | 2キー/斜め軸を同時押し — 壺が加速・発光し、危険物を斬り刻む。ちらつき防止ヒステリシス付き専用スタミナバー |
| 🥬 **14種の食材** | 小茄子、唐辛子、ニンニク、生姜、塩、芥菜、**黄金芥菜**（素早く満タンに）· 黄金塩/黄金ニンニク · 鬼唐辛子 · アイス · カビ、ハエ、**青虫**（危険物） |
| 🧄 **黄金ニンニクシールド** | パワーアップ：最大**2層**のシールドでひび割れを吸収。壺の周りに回転する光輪 |
| 🏆 **16個の実績** | **ラン横断**の累計保存（localStorage）、ゲームオーバー画面に「新実績！」トースト |
| 🔊 **手作りオーディオ** | Web Audio API による11種のシンセ効果音（ファイル不使用）+ レベルに応じて変化する五音音階BGM、`M` でミュート |
| 💾 **TOP 8 ランキング** | ローカル保存、読み込み時に検証・正規化、名前は自動大文字化、新記録はハイライト |
| 🎨 **60fpsグラフィックス** | Canvas 2D、パーティクル上限460、DPR上限2、オフスクリーン事前描画の花柄床、星の瞬き + メニューオーロラ |
| 📴 **真のオフラインファースト** | 自己ホストフォント（latin + ベトナム語サブセット、woff2）、CDN・API不使用 — `dist/index.html` をダブルクリックするだけ |
| 🧪 **品質ゲート** | modes / achievements / storage / i18n / settings をカバーする501件のユニットテスト（vitest）— `npm run check` がCIゲート |

<img src="assets/items.svg" alt="14種の食材 — キャッチすべき漬物、取るべき黄金パワー、避けるべき危険物" width="100%" />

## 🌐 言語の切り替え

Lọ Chéo はゲーム内で **7 言語のUI** を搭載 — リロード不要、プレイ中でも即時反映：

<img src="assets/languages.svg" alt="7つの言語 — VI · EN · 中文 · 日本語 · 한국어 · Español · Français" width="100%" />

| 言語 | 場所 | 保存先 |
| --- | --- | --- |
| 🇻🇳 Tiếng Việt | **VI** ボタン（デフォルト。未設定時はブラウザの言語に従います） | `locheo.lang.v1` |
| 🇬🇧 English | **EN** ボタン | `locheo.lang.v1` |
| 🇨🇳 中文 | **中** ボタン | `locheo.lang.v1` |
| 🇯🇵 日本語 | **日** ボタン | `locheo.lang.v1` |
| 🇰🇷 한국어 | **한** ボタン | `locheo.lang.v1` |
| 🇪🇸 Español | **ES** ボタン | `locheo.lang.v1` |
| 🇫🇷 Français | **FR** ボタン | `locheo.lang.v1` |

- 言語の切り替えは **設定 → 言語**（7つの国旗ボタンのグリッド）—— 唯一の場所。メニュー上の浮遊スイッチャーは廃止。
- ユーザー向け文字列はすべて `src/i18n/locales/{vi,en,zh,ja,ko,es,fr}.ts` — Canvasエンジン、各画面、HUD、ポップアップ、ティッカー、ヒント。
- 欠けたキーは？`t()` がベトナム語へフォールバック — 7つのロケールのキー集合とプレースホルダの一致はテストで強制されています。

## 🕹️ 操作方法

| 操作 | キーボード | タッチ |
| --- | --- | --- |
| 移動 | `W` `A` `S` `D` または `← ↑ ↓ →` | 画面上のどこでもドラッグ（フローティングジョイスティック） |
| **斜め切り（CHÉO）** | **2キー同時押し**（例: `A`+`W`） | **45°の斜めドラッグ** — ジョイスティックリングが金色に |
| 壺叩き（衝撃波 + 吸い寄せ） | `Space` | 右下の赤い**叩き**ボタン |
| 一時停止 / 再開 | `P` または `Esc` | 右上の一時停止ボタン |
| 即座にリスタート | `R`（一時停止中/ゲームオーバー中も可） | 「もう一度漬ける」ボタン |
| 開始 / 確定 | `Enter` | **厨房へ**ボタン |
| ミュート / 解除 | `M` | 右上のスピーカーボタン |
| 言語切替 | —（VI/EN/中/日/한/ES/FR ボタンを使用） | メニュー / 一時停止の VI/EN/中/日/한/ES/FR ボタン |

## 🚀 インストールと実行

### ビルド不要で今すぐ遊ぶ

```bash
# すべてのリリースは単一の自己完結ファイルを同梱：
open dist/index.html      # macOS
xdg-open dist/index.html  # Linux
start dist/index.html     # Windows
```

### プロダクションビルド

```bash
npm install        # 依存関係をインストール（Node ≥ 20.19）
npm run build      # → dist/index.html（単一の自己完結ファイル）
```

> `vite-plugin-singlefile` が全 JS/CSS/フォント/画像を**1つの** `dist/index.html`（約700 KB、gzip約355 KB）にインライン化。サーバーもネットワークも不要です。

### 開発

```bash
npm run dev        # HMR付き開発サーバー（http://localhost:5173）
npm run preview    # プロダクションビルドをローカルで確認
npm run typecheck  # tsc --noEmit（strict、noUnusedLocals…）
npm run test       # vitest — 501件のユニットテスト（modes / achievements / storage / i18n / settings）
npm run check      # typecheck + test + build（CI品質ゲート）
```

## 🗂️ プロジェクト構成

```
lo-cheoio/
├─ index.html              # エントリ、SEO/OGメタ（CDNなし）
├─ package.json            # lo-cheoio v1.1.8、dev/build/test/check スクリプト
├─ .gitattributes          # *.bat/*.cmd → CRLF · posix → LF · binaries
├─ vite.config.ts          # vite + react + tailwind v4 + singlefile
├─ tsconfig.json           # strict；src + tests を含む
├─ favicon.ico             # web icon (multi-size 16→256)
├─ public/                 # favicon.ico/png/svg served at web root
├─ assets/
│  ├─ banner.svg           # READMEバナー（SMILアニメーション）
│  ├─ demo.svg             # ゲームプレイシミュレーション（SMILアニメーション）
│  ├─ items.svg            # 14種の食材（SMILアニメーション）
│  ├─ modes.svg            # 9モード（SMILアニメーション）
│  ├─ languages.svg        # 7 in-game languages (SMIL animation)
│  ├─ new-modes.svg        # the 2 new v1.1.4 modes (SMIL animation)
│  ├─ corner-menu.svg     # corner GAME/INFO panels (SMIL animation)
│  ├─ settings-sections.svg # 6-section settings tour (SMIL, v1.1.6)
│  ├─ divider.svg          # sparkle divider (SMIL animation)
│  ├─ license.svg          # AGPL-3.0 copyleft 印章（SMILアニメーション）
│  └─ favicon.svg          # favicon (SMIL animation)
├─ scripts/
│  ├─ play-mac.command     # macOS ランチャー — ダブルクリックでフルカラーメニュー
│  ├─ play-windows.bat     # Windows ランチャー — ダブルクリックでフルカラーメニュー
│  ├─ play-linux.sh        # Linux ランチャー — ダブルクリックでフルカラーメニュー
│  └─ README.md            # ターミナル初心者向けランチャーガイド
├─ docs/
│  ├─ README.md            # ドキュメント索引（v1.1.5）
│  ├─ DESCRIPTION.md       # 多言語プロジェクト紹介（vi/en/zh + SEO）
│  ├─ design/              # menu-corners / save-format / settings-format 仕様
│  ├─ guides/              # engine 概観 · a11y · パフォーマンス · storage keys · リリース手順…
│  └─ releases/
│     ├─ v1.0.0.md         # 初回リリースノート
│     ├─ v1.1.0.md         # v1.1.0 リリースノート
│     ├─ v1.1.1.md         # v1.1.1 リリースノート
│     ├─ v1.1.2.md         # v1.1.2
│     ├─ v1.1.3.md         # v1.1.3 release notes
│     ├─ v1.1.4.md         # release notes (1.1.4)
│     ├─ v1.1.5.md         # release notes (1.1.5)
│     ├─ v1.1.6.md         # release notes (1.1.6)
│     └─ v1.1.8.md         # current release notes (1.1.8)
├─ README.md               # 🇻🇳 Tiếng Việt
├─ README.en.md            # 🇬🇧 English
├─ README.zh.md            # 🇨🇳 中文
├─ README.ja.md            # 🇯🇵 日本語（このファイル）
├─ README.ko.md            # 🇰🇷 한국어
├─ README.es.md            # 🇪🇸 Español
├─ README.fr.md            # 🇫🇷 Français
├─ README.th.md            # 🇹🇭 ไทย
├─ README.de.md            # 🇩🇪 Deutsch
├─ README.pt.md            # 🇵🇹 Português
├─ src/
│  ├─ main.tsx             # Reactルート、StrictMode
│  ├─ App.tsx              # フェーズマシン menu/playing/paused/gameover
│  ├─ version.ts           # APP_VERSION = "1.1.8"（唯一の真実の源）
│  ├─ index.css            # tailwind v4 テーマ + 全アニメーション/グラデーション
│  ├─ assets/fonts/        # woff2サブセット（Be Vietnam Pro ×6、Bungee）
│  ├─ styles/fonts.css     # @font-face + unicode-range、100%オフライン
│  ├─ i18n/
│  │  ├─ i18n.ts           # pureモジュール：検出・永続化・t() + 補間
│  │  ├─ useI18n.ts        # Reactフック：useI18n/useLanguage
│  │  └─ locales/          # vi.ts（キー源）· en · zh · ja · ko · es · fr
│  ├─ components/
│  │  ├─ GameCanvas.tsx    # キャンバス + フローティングジョイスティック + キーボード
│  │  ├─ StartScreen.tsx   # メニュー：ヒーロー + 多層アニメ + コーナーパネル
│  │  ├─ menu/              # コーナー GAME/INFO パネル + モーダル + icons/
│  │  │  └─ background/     # 8 background layers as data (v1.1.8)
│  │  ├─ ModeSelector.tsx  # 9枚のモードカード（classic/zen/inferno/blitz/goldrush/storm/hardcore · combo · feast）
│  │  ├─ AchievementsPanel.tsx  # ロック/解除バッジウォール
│  │  ├─ GameOverScreen.tsx     # 壺が割れた！+ スコア + 新実績
│  │  ├─ PauseScreen.tsx        # 一時停止 + ラン統計
│  │  ├─ settings/           # 6セクションの設定モジュール + 部品（v1.1.6）
│  │  └─ ui/               # 8 つのプリミティブ、1 ファイルずつ（v1.1.8 — ui.tsx から分割）
│  ├─ game/
│  │  ├─ engine.ts         # シミュレーションとキャンバス描画のすべて（約2260行）
│  │  ├─ modeTypes.ts      # ModeId · ModeConfig (types-only, v1.1.8)
│  │  ├─ modes/            # 9 balance records — classic.ts … feast.ts (v1.1.8)
│  │  ├─ modesIndex.ts     # MODES · MODE_LIST · isModeId (v1.1.8)
│  │  ├─ modeMath.ts       # multiplierForCombo · jarBonus · comboWindowFor… (v1.1.8)
│  │  ├─ modes.ts          # barrel — keeps every old import working
│  │  ├─ achievements.ts   # 16バッジ + pureチェッカー（pure）
│  │  ├─ storage.ts        # localStorage：TOP 8、進行度、実績
│  │  ├─ audio.ts          # Web Audioシンセ：効果音 + 五音音階ミュージック
│  │  ├─ changelog/          # in-game changelog (v1.1.8 — split from one file)
│  │  │  ├─ types.ts        #   ChangelogEntry · ReleaseTier · copyFor()
│  │  │  ├─ tiers.ts        #   tierFor() · TIER_ORDER · TIER_LABEL_KEY
│  │  │  ├─ entries/        #   1 file per release — v1_0_0.ts … v1_1_7.ts
│  │  │  └─ index.ts        #   ordered list + 5 helpers
│  │  ├─ runSave.ts         # 中断ランの保存
│  │  ├─ settings.ts        # 設定スキーマ・既定値・正規化
│  │  ├─ settingsIO.ts      # バックアップ/復元コーデック（v1.1.6）
│  │  ├─ settingsPresets.ts # 4つのクイックプリセット（v1.1.6）
│  │  └─ audioLevels.ts     # 純粋なゲイン計算（v1.1.6）
│  └─ utils/
│     ├─ cn.ts             # clsx + tailwind-merge
│     └─ useFocusTrap.ts   # モーダルのフォーカス封じ込め（v1.1.6）
└─ tests/                  # vitest — 40ファイル · 344テスト（modes · achievements · storage · i18n · runSave · settings · presets · audio…）
```

## 🧱 アーキテクチャとパフォーマンス
<img src="assets/architecture.svg" alt="Lọ Chéo v1.1.8 のアーキテクチャ——入力 → エンジン → 状態 → 描画と各サービス（SMIL アニメーション）" width="100%" />


- **ゲームループ** `requestAnimationFrame`、デルタ時間を `1/20秒` にクランプ、`timeScale`（アイススローモー）を乗算し、キャッチ毎に数十msの **ヒットストップ** で「ズン」とした手応え。
- **Canvas HUD** を毎フレーム直描画。React は `phase` ごとに画面を描画するだけ — ホットループでReactは再レンダーされません。言語変更後、HUDは次のフレームから新しい辞書を参照します。
- **レイヤードi18n**：`src/i18n/i18n.ts` は pure モジュール（React非依存）、`useI18n` は `locheo:languagechange` イベントで再レンダーを橋渡しするだけ。`t()` は `{param}` 補間とベトナム語フォールバックをサポート。
- **花柄の床** はオフスクリーンキャンバスに一度だけ事前描画（ビネット + 光のプール付き）。星の瞬きと泡はリアルタイム計算で非常に軽量。
- **バジェット**：パーティクル ≤460、アイテム ≤70、ポップアップ ≤34、DPR ≤ 2。ヒットボックスによる衝突判定。床の漬物痕跡は自動で消えます。
- **localStorage** は入力検証・正規化付き — 1件の不正レコードがボード全体を壊すことはありません。ストレージがブロック（Safariプライベートモード）されてもメモリ上でプレイ継続。言語設定は `locheo.lang.v1` に分離。
- **モーション配慮**：`prefers-reduced-motion` でオーロラ/シマー/回転を無効化。背景の星と画面シェイクもメディアクエリに従います。

## ❓ よくある質問

**Windows ランチャーがベトナム語でエラーを出す？**
v1.1.4で修正済み：`play-windows.bat` は CRLF + UTF-8 BOM と `chcp 65001`、ベトナム語のダイアクリティクス完全対応 —— `'Ọ' is not recognized...` エラーは完全に解消。他のエディタで .bat を編集する場合は CRLF と BOM を保持してください（`.gitattributes` が自動強制）。


**ネットワークなしで遊べますか？**
はい — 100%：`dist/index.html` を開くだけでフォントと音声を含めて完全に動作します。ネットワークリクエストは一切ありません。

**広告やテレメトリは？**
ありません。トラッキングもアナリティクスもなし — スコアがローカルのlocalStorageから出ることはありません。

**言語を変えると進行が消えますか？**
いいえ。スコア、実績、進行度、モード選択は `locheo.lang.v1` とは独立しています。

**TOP 8 ランキングはどこに保存されますか？**
`locheo.scores.v1`（スコア）、`locheo.progress.v1`（通算ラン/壺/撃破数）、`locheo.achievements.v1`（バッジ）— ストレージを消去すると失われます。壺を大切に！

**新しい言語を追加したい**
`src/i18n/locales/xx.ts` に `vi.ts` のキー集合をミラーしたファイルを追加し、`LANGUAGES` とテストを更新してPRを — [CONTRIBUTING.md](CONTRIBUTING.md) を参照。

**ターミナルが苦手？**
[`scripts/play-mac.command`](scripts/play-mac.command)（macOS）、[`scripts/play-windows.bat`](scripts/play-windows.bat)（Windows）、[`scripts/play-linux.sh`](scripts/play-linux.sh)（Linux）をダブルクリック —— カラーメニューが開き、`1` を選ぶとビルドしてすぐ遊べます。開発時は `2`。詳しくは [scripts/README.md](scripts/README.md)。

## 📦 リリースと変更履歴

| バージョン | Tier | 日付 | ノート |
| --- | --- | --- | --- |
| [v1.1.8](docs/releases/v1.1.8.md) | 🟣 **PATCH** | 2026-11-12 | **開始画面のはみ出し解消**：高さの足し算の誤りでヒーローが250pxになり `LỌ` が切れていた · **スクロール不具合**（入れ子スクロール枠 + `justify-center`）を上端固定の**単一** `.menu-scroll` に · **「遊び方」を GAME メニューへ**（モーダル）· パネルは内容ではなく **318px/458px** を宣言 · ティッカー48px · **ヒーロー装飾14個** + **光輪3本** · `src/components/menu/{layout,scene,ticker,howto}/` · **495 テスト / 48 ファイル** |
| [v1.1.7](docs/releases/v1.1.7.md) | 🟣 **PATCH** | 2026-11-10 | **メニュー背景のかすみ除去**（四層の重なり：`blur 64→22px`、全画面ヴィネットを四隅のみに、CRT 枠 140→90px、床 45→70%）· **階層別カラー履歴** · 旧八版に **96 項目の説明** · 日付再整列 · `src/game/changelog/` 分割 · README 10 本刷新 · **256 テスト** |
| [v1.1.6](docs/releases/v1.1.6.md) | 🟣 **PATCH** | 2026-11-08 | **6セクション設定**（プリセット · サウンド · 表示 · 言語 · バックアップ · データ）· 音量 0–100 · 揺れの強さ · 画質 · タブ切替で自動停止 · 言語を設定へ移設 · 4プリセット · JSON 入出力 · 多層アニメのメニュー · 作者カードの流れるグラデーション · モーダルのフォーカス封じ込め · 再読込後の音楽バグ修正 · **150テスト** |
| [v1.1.5](docs/releases/v1.1.5.md) | 🟣 **PATCH** | 2026-11-06 | **四隅 GAME/INFO メニュー**（プレイ · つづきから · モード · ランキング · 実績 · 設定 / 作者について · 更新履歴 · 終了）· **中断ランの保存＆再開**（`locheo.run.v1`）· ゲーム内設定（効果音/BGM/揺れ/動作を減らす）· モーダル越しショートカット修正 · prefers-reduced-motion 完全対応 · **113テスト** |
| [v1.1.4](docs/releases/v1.1.4.md) | 🟣 **PATCH** | 2026-11-04 | **9モード**（コンボ大祭 · 漬物大宴会）· **16実績** · **7言語**（ES/FR追加）· play-windows.bat 修正（CRLF+BOM）· 7言語ランチャー · 61テスト |
| [v1.1.3](docs/releases/v1.1.3.md) | 🟣 **PATCH** | 2026-11-02 | 7モード（漬物ダウンポア · 薄陶器）· 14実績 · 5言語 · favicon · 多言語ランチャー · 55テスト |
| [v1.1.2](docs/releases/v1.1.2.md) | 🟣 **PATCH** | 2026-10-31 | 5モード（60秒ダッシュ · ゴールドラッシュ）· 12実績 · コンボ炎 · ダブルクリックランチャー · 10言語README · 49テスト |
| [v1.1.1](docs/releases/v1.1.1.md) | 🟣 **PATCH** | 2026-10-29 | ゲーム内i18n VI/EN/ZH · 7言語README · バグ全掃除 · 49テスト |
| [v1.1.0](docs/releases/v1.1.0.md) | 🟡 **UPDATE** | 2026-10-27 | 3モード · 黄金ニンニクシールド · 青虫 · 黄金芥菜 · 10実績 · 自己ホストフォント |
| [v1.0.0](docs/releases/v1.0.0.md) | 🩷 **MAJOR** | 2026-10-24 | 初回リリース：完成したエンジン、11食材、壺叩き、コンボ×9 |

[CHANGELOG.md](CHANGELOG.md) も参照。

## 🗺️ ロードマップ（草案 — フィードバックで変わります）

| マイルストーン | 時期 | アイデア |
| --- | --- | --- |
| **v1.2.0** | 2026 Q1 | モード別のプロシージャルBGM · CIでのビジュアル回帰テスト（Playwright）· フォントサブセットを深くしてバンドル削減 |
| **v1.3.0** | 2026 Q1–Q2 | 10番目のモード（候補：**ハエ嵐** — ハエしか落ちてこない、斬って生き残れ）· デイリーチャレンジ用シードモード |
| **v1.4.0** | 2026 Q2 | **オプトイン**のオンラインリーダーボード（サーバーレス、暗号化）— オフラインファーストはデフォルトのまま |
| Backlog | — | ベストランのゴーストリプレイ · フォトモード（HUD非表示でPNG出力）· タイ語（ไทย）ロケール検討中 |

*ロードマップは約束ではありません — 優先順位は常に: 安定性 → 遊びやすさ → コンテンツ。*

## 📚 さらに読む & 開発ドキュメント

設計ノートと詳細な技術ドキュメント：

| Doc | What it covers |
| --- | --- |
| [docs/releases/v1.1.8.md](docs/releases/v1.1.8.md) | リリース v1.1.8 —— 一つの足し算から生じた四つのレイアウト不具合、入れ子スクロールの不具合、「遊び方」の GAME メニュー移動、ヒーロー装飾14個 |
| [docs/releases/v1.1.7.md](docs/releases/v1.1.7.md) | リリース v1.1.7 —— メニュー背景のかすみ除去（四層の診断）、階層別カラー履歴、96項目の新説明 |
| [docs/releases/v1.1.6.md](docs/releases/v1.1.6.md) | リリース v1.1.6 — 6セクション設定、プリセット、バックアップ、多層メニュー |
| [docs/releases/v1.1.5.md](docs/releases/v1.1.5.md) | リリース v1.1.5 — 四隅メニュー、保存/再開、設定、修正 |
| [docs/design/menu-corners.md](docs/design/menu-corners.md) | 四隅 GAME/INFO メニュー設計 — 原則、a11y、レスポンシブ |
| [docs/design/save-format.md](docs/design/save-format.md) | Spec `locheo.run.v1` — 中断ランのスナップショット（schema + ライフサイクル） |
| [docs/design/settings-format.md](docs/design/settings-format.md) | Spec `locheo.settings.v1` — ゲーム設定（schema + 配線） |
| [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md) | よくある問題 — 黒画面 · 音が出ない · つづきから · ランチャー |
| [scripts/smoke-ssr.tsx](scripts/smoke-ssr.tsx) | ヘッドレス描画スモークテスト（全メニュー/モーダル） |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | CI: npm ci → npm run check (Node 22) |

## 🤝 コントリビュート

1. リポジトリをForkし、`arena/<名前>` または `feat/<名前>` の命名規則でブランチを作成。
2. PRを出す前に `npm run check` をグリーンに（typecheck + 344テスト + build）。
3. 本当に必要な場合以外、ランタイム依存を追加しない — 理念：**1ファイル、ネットワーク不要、永遠に遊べる**。
4. PRには影響する画面/モードを明記し、ゲームプレイ変更時はクリップを添付してください。

## 📄 ライセンスと作者

<img src="assets/license.svg" alt="AGPL-3.0-only — copyleft ライセンス" width="400" />

- **AGPL-3.0-only** © 2026 [Standardize Paradigm](mailto:standardizeparadigm@donuco.com) — [LICENSE](LICENSE) と [assets/license.svg](assets/license.svg) を参照。
- フォント：[Be Vietnam Pro](https://fonts.google.com/specimen/Be+Vietnam+Pro) と [Bungee](https://fonts.google.com/specimen/Bungee) — SIL Open Font License 1.1（自己ホストのwoff2サブセット）。
- ベトナムの食卓に並ぶすべての漬物壺に、乾杯。🫙🇻🇳
