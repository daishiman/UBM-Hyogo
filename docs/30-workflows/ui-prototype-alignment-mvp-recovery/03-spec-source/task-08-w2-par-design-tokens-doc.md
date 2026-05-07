# task-08 design-tokens-doc

## §0. 自己完結コンテキスト

このタスクを単独で着手する担当者が、外部資料に遡らずとも実装判断できるよう、必須前提を本節に閉じ込める。

### 0.1 上位ゴール

`docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70（`:root` + `[data-theme="warm"]` + `[data-theme="cool"]`）の OKLch カラー / shadow / radius / typography / spacing トークン値を **正本転記**し、Tailwind v4 `@theme` block への直接貼り付け可能な CSS 変数 + JSON の対として `09b-design-tokens.md` を新規作成する。命名規則は `--ubm-*` prefix で統一し、後続 task-09 の `globals.css` / `tokens.css` と task-10 の primitive variant がそのまま参照できる状態を作る。dark mode 拡張余地は placeholder で確保し、OKLch 非対応ブラウザ向けの sRGB fallback を `@supports not` 構造で正本化する。

### 0.2 DAG 座標

- 依存元: なし（task-01 scope-gate-all-screens 完了のみ前提。prototype `styles.css` 直読み）
- 依存先: task-09（tailwind-v4-setup・`@theme` で参照）/ task-10（ui-primitives・variant 受け渡し）/ task-18（verify-design-tokens・CI gate の正本）
- 並列性: **task-06（ui-ux 契約書き換え）/ task-07（prototype mapping）と並列実行可**。値の決定権は本ファイルに閉じる。

### 0.3 触れるファイル群

- C（新規作成）: `docs/00-getting-started-manual/specs/09b-design-tokens.md`（380〜540 行）
- R（参照のみ）: `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70（値の出典）/ `outputs/phase-3/phase-3.md` §3.3（OKLch 適用ルール）
- M / 削除: なし

### 0.4 既存 API（不変）

本タスクは UI 値（CSS / JSON）のみを扱い、API 接続を新規定義しない。

### 0.5 不変条件

1. プロトタイプ `styles.css` の OKLch 値は **そのまま採用**する。デザイン変更の議論は本タスクではしない（task-08 完了時点で値は凍結）。
2. CSS 変数 prefix は `--ubm-*` で統一する（旧プロトタイプの `--bg`, `--text`, `--accent` などの素朴名は本ファイル正本化時に rename）。
3. accent / status 系（ok / warn / danger / info）は **テキスト用ではなく面積要素用**として扱い、テキスト用には `-ink` variant を使う。
4. zone 色（a..e）は MVP では status tokens の alias とする（独立 OKLch 値を持たない）。将来拡張で独自値に置換可能な構造を確保する。
5. dark mode は MVP 非対応。`[data-theme="dark"]` placeholder 構造のみ確保し、値は別 workflow で確定。
6. OKLch 非対応ブラウザ向け fallback は `@supports not (color: oklch(0% 0 0))` ブロックで提供する。
7. JSON 表現（`design-tokens.json`）は完全な valid JSON として inline 提示し、Style Dictionary 互換の flat 構造とする。

### 0.6 上流から受け取るシグネチャ

本タスクは依存元なし。受け取り情報は以下:

- `styles.css` L1-L70 の `:root` 全 token 値（stone・既定）/ L42-L55 の `[data-theme="warm"]` 上書き / L56-L70 の `[data-theme="cool"]` 上書き
- phase-3 §3.3 の status / zone OKLch 適用ルール
- プロトタイプ class が暗黙的に依存する font-size / spacing 値（観測ベースで rationalize）

### 0.7 下流へ渡すシグネチャ

task-09 / task-10 / task-18 が依存する **task-08 の必須 export 一覧**を以下にインライン化する。これがそのまま task-09 の `globals.css` と task-10 の primitive ファイルにコピペ可能な状態とする。

#### token JSON のキー命名規則

- 階層 flat 構造: `<category>.<role>[.<variant>]`
  - `color.surface.bg` / `color.surface.panel` / `color.text.primary` / `color.border.default` / `color.accent.base|soft|ink` / `color.status.ok|warn|danger|info` / `color.zone.a|b|c|d|e`
  - `radius.sm|md|lg|xl|2xl` / `shadow.xs|sm|md|lg`
  - `font.jp|en|serif|body|mono` / `text.xs|sm|base|md|lg|xl|2xl|3xl`
  - `spacing.0|1|2|3|4|6|8|12|16|24` / `duration.fast|base|slow` / `easing.standard|emphasized|decelerate|accelerate`
- 各葉ノードは `{ "value": <値>, "css": "--ubm-<...>" }` の対で持つ。

#### CSS 変数名一覧（task-09 がそのまま `@theme` へ・最低 30 個保証）

```css
/* color: surface */
--ubm-color-surface-bg
--ubm-color-surface-bg-2
--ubm-color-surface-panel
--ubm-color-surface-panel-2

/* color: text */
--ubm-color-text-primary
--ubm-color-text-secondary
--ubm-color-text-muted

/* color: border */
--ubm-color-border-default
--ubm-color-border-strong

/* color: accent */
--ubm-color-accent
--ubm-color-accent-soft
--ubm-color-accent-ink

/* color: status */
--ubm-color-ok
--ubm-color-ok-soft
--ubm-color-warn
--ubm-color-warn-soft
--ubm-color-danger
--ubm-color-danger-soft
--ubm-color-info
--ubm-color-info-soft

/* color: zone (a..e, MVP は status alias) */
--ubm-color-zone-a
--ubm-color-zone-b
--ubm-color-zone-c
--ubm-color-zone-d
--ubm-color-zone-e

/* radius */
--ubm-radius-sm
--ubm-radius-md
--ubm-radius-lg
--ubm-radius-xl
--ubm-radius-2xl

/* shadow */
--ubm-shadow-xs
--ubm-shadow-sm
--ubm-shadow-md
--ubm-shadow-lg

/* typography: font-family */
--ubm-font-jp
--ubm-font-en
--ubm-font-serif
--ubm-font-body
--ubm-font-mono

/* typography: font-size */
--ubm-text-xs
--ubm-text-sm
--ubm-text-base
--ubm-text-md
--ubm-text-lg
--ubm-text-xl
--ubm-text-2xl
--ubm-text-3xl

/* spacing (4px base) */
--ubm-space-0
--ubm-space-1
--ubm-space-2
--ubm-space-3
--ubm-space-4
--ubm-space-6
--ubm-space-8
--ubm-space-12
--ubm-space-16
--ubm-space-24

/* motion */
--ubm-dur-fast
--ubm-dur-base
--ubm-dur-slow
--ubm-ease-standard
--ubm-ease-emphasized
--ubm-ease-decelerate
--ubm-ease-accelerate
```

合計 60+ 変数（color 26 + radius 5 + shadow 4 + font 5 + text 8 + space 10 + duration 3 + easing 4 = 65）。

#### `@theme inline` で Tailwind utility に bridge する形式

task-09 の `globals.css` に以下のマッピングを貼り付け、Tailwind utility（`bg-surface` / `text-text` / `bg-accent` / `rounded-md` / `shadow-md` / `font-sans`）が `--ubm-*` 変数経由でテーマ切替に追随する状態を作る:

```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-surface: var(--ubm-color-surface-bg);
  --color-panel:   var(--ubm-color-surface-panel);
  --color-text:    var(--ubm-color-text-primary);
  --color-accent:  var(--ubm-color-accent);
  --color-ok:      var(--ubm-color-ok);
  --color-warn:    var(--ubm-color-warn);
  --color-danger:  var(--ubm-color-danger);
  --color-info:    var(--ubm-color-info);

  --radius-sm: var(--ubm-radius-sm);
  --radius-md: var(--ubm-radius-md);
  --radius-lg: var(--ubm-radius-lg);

  --shadow-xs: var(--ubm-shadow-xs);
  --shadow-sm: var(--ubm-shadow-sm);
  --shadow-md: var(--ubm-shadow-md);
  --shadow-lg: var(--ubm-shadow-lg);

  --font-sans: var(--ubm-font-body);
  --font-mono: var(--ubm-font-mono);

  --spacing: 4px;
}
```

`@theme inline` は Tailwind v4 の機能で、bridge 先の値を `var()` 参照のまま保持し、`[data-theme="warm"]` / `[data-theme="cool"]` の cascade 上書きが効くようにする（`@theme` だけだと値が固定される）。

### 0.8 用語

- **token**: デザインの最小決定単位。色 / 余白 / radius / shadow / typography / motion の値とその CSS 変数名 / JSON path の対。
- **OKLch**: knowledge-perceptual な色空間（lightness / chroma / hue）。CSS Color Module 4 で正式採用。本プロジェクトの色値の正規表現。
- **sRGB fallback**: OKLch 非対応ブラウザ向けの近似 16進 / `rgb()` 値。`@supports not (color: oklch(0% 0 0))` ブロックで提供。
- **theme**: `[data-theme="stone|warm|cool"]` の 3 値。stone が既定。dark は MVP 非対応の placeholder。
- **zone**: 経歴ゾーン（a..e）。MVP では status tokens の alias、将来は独自 OKLch 値に置換可能。
- **`@theme inline`**: Tailwind v4 の token bridge 機能。値を固定せず `var()` 参照を保持して cascade を効かせる。
- **flat JSON**: Style Dictionary 互換の `<category>.<role>.<variant>` ドット階層 + 葉ノードに `{ value, css }` を持つ構造。

---

> 責務 dir: `03-spec-source`
> 想定工数: 0.5 人日
> 主担当: Designer
> 依存: task-01（scope-gate-all-screens）完了
> 後続: task-09 tailwind-v4-setup（`@theme` で参照）/ task-10 ui-primitives（variant 受け渡し）/ task-18 verify-design-tokens（CI gate の正本）

---

## 1. ヘッダー

| 項目 | 値 |
|------|---|
| task id | 08 |
| task name | design-tokens-doc |
| const ref | CONST_005 |
| 入力 | `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70（`:root` + `[data-theme="warm"]` + `[data-theme="cool"]`）、L72 以下の class が参照する CSS 変数 |
| 出力 | `docs/00-getting-started-manual/specs/09b-design-tokens.md`（**新規作成**） |
| 主成果物の DoD | §8 参照 |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. プロトタイプ `styles.css` の OKLch カラー / shadow / radius / typography / spacing トークンを **JSON / CSS 変数の対**で網羅文書化する。
2. accent / ok / warn / danger / info × stone / warm / cool 3 テーマの全色値を **転記済み**で固定する（task-08 完了時点で値は凍結）。
3. CSS 変数命名規則を `--ubm-*` prefix で統一し、Tailwind v4 `@theme` 直結（task-09 で `@theme` block に貼り付け可能な形）にする。
4. dark mode 拡張余地を残す（`:root` + `[data-theme="dark"]` の placeholder のみ宣言、MVP では値未定で OK）。
5. OKLch サポートしないブラウザ向けの sRGB fallback 戦略を明記（`@supports not (color: oklch(...))` ブロック）。
6. token JSON サンプル（`design-tokens.json`）を本ファイル内に inline 提示し、後続で機械生成（Style Dictionary 互換）にも転用可能にする。

### 2.2 非ゴール

- Tailwind v4 の `@theme` 実装（task-09）
- primitive の variant 実装（task-10）
- token の値「決定」（既存プロトタイプ値を **そのまま採用**。デザイン変更の議論はこの task ではしない）
- CI 検証スクリプト本体の実装（task-18 で `verify-design-tokens.ts` を作成。本 task は仕様の正本のみ）

---

## 3. 変更対象ファイル表

| 区分 | path | 概要 |
|------|------|------|
| C（新規作成） | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | tokens 仕様正本 |
| R（参照） | `docs/00-getting-started-manual/claude-design-prototype/styles.css` | 値の出典 |
| R（参照） | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` §3.3 | OKLch 適用ルール（status / zone） |

新規作成 1 ファイルのみ。

---

## 4. 詳細差分（token 定義例）

### 4.1 章立て案（目標 380〜540 行）

```
1. 位置づけ
   1.1 本ファイルが正本である範囲（色 / 余白 / radius / shadow / typography / motion）
   1.2 「契約」は 09-ui-ux.md、「mapping」は 09a。本ファイルは「値」のみ。
2. 命名規則
   2.1 prefix `--ubm-*`
   2.2 階層 (semantic / role / state)
   2.3 dark mode placeholder
3. color tokens (OKLch)
   3.1 surface (bg / panel / border / text)
   3.2 accent / ok / warn / danger / info
   3.3 zone tokens (a..e)
   3.4 3 テーマ (stone / warm / cool) 値表
   3.5 sRGB fallback 戦略
4. radius tokens
5. shadow tokens
6. typography tokens (font-family / size / weight / line-height / letter-spacing)
7. spacing tokens (4px base, 0..16)
8. motion tokens (duration / easing)
9. JSON 表現 (design-tokens.json)
10. Tailwind v4 `@theme` 直結ガイド
11. dark mode 拡張余地（placeholder）
12. 改訂履歴
```

### 4.2 §2 命名規則

| 種別 | prefix | 例 |
|------|--------|---|
| 色（surface） | `--ubm-color-surface-*` | `--ubm-color-surface-bg`, `--ubm-color-surface-panel` |
| 色（text） | `--ubm-color-text-*` | `--ubm-color-text-primary`, `--ubm-color-text-muted` |
| 色（border） | `--ubm-color-border-*` | `--ubm-color-border-default`, `--ubm-color-border-strong` |
| 色（accent / status） | `--ubm-color-{accent\|ok\|warn\|danger\|info}[-soft\|-ink]` | `--ubm-color-accent`, `--ubm-color-accent-soft`, `--ubm-color-accent-ink` |
| 色（zone） | `--ubm-color-zone-{a\|b\|c\|d\|e}` | `--ubm-color-zone-a` |
| radius | `--ubm-radius-{sm\|md\|lg\|xl\|2xl}` | `--ubm-radius-md` |
| shadow | `--ubm-shadow-{xs\|sm\|md\|lg}` | `--ubm-shadow-md` |
| font-family | `--ubm-font-{jp\|en\|serif\|mono\|body}` | `--ubm-font-body` |
| font-size | `--ubm-text-{xs\|sm\|base\|md\|lg\|xl\|2xl\|3xl}` | `--ubm-text-base` |
| spacing | `--ubm-space-{0\|1\|2\|3\|4\|6\|8\|12\|16\|24}`（4px base） | `--ubm-space-4` |
| duration | `--ubm-dur-{fast\|base\|slow}` | `--ubm-dur-base` |
| easing | `--ubm-ease-{standard\|emphasized\|decelerate\|accelerate}` | `--ubm-ease-standard` |

> 旧プロトタイプ（`styles.css`）では `--bg`, `--text`, `--accent` などの素朴名で書かれているが、本ファイル正本化時に `--ubm-*` prefix に **rename**して衝突を避ける。task-09 の `@theme` block で `@property` または直接マッピングを行う。

### 4.3 §3 color tokens — 3 テーマ全値表（プロトタイプ値転記）

#### 3.4.1 stone（既定）

| token | 値 | source |
|-------|---|--------|
| `--ubm-color-surface-bg` | `#f5f4f1` | `styles.css` L3 |
| `--ubm-color-surface-bg-2` | `#ebe9e3` | L4 |
| `--ubm-color-surface-panel` | `#ffffff` | L5 |
| `--ubm-color-surface-panel-2` | `#fafaf8` | L6 |
| `--ubm-color-border-default` | `#e7e5df` | L7 |
| `--ubm-color-border-strong` | `#d6d3cc` | L8 |
| `--ubm-color-text-primary` | `#1a1917` | L9 |
| `--ubm-color-text-secondary` | `#57554e` | L10 |
| `--ubm-color-text-muted` | `#8a877e` | L11 |
| `--ubm-color-accent` | `oklch(0.58 0.10 55)` | L12 |
| `--ubm-color-accent-soft` | `oklch(0.95 0.03 65)` | L13 |
| `--ubm-color-accent-ink` | `oklch(0.38 0.10 55)` | L14 |
| `--ubm-color-ok` | `oklch(0.55 0.10 155)` | L15 |
| `--ubm-color-ok-soft` | `oklch(0.95 0.04 155)` | L16 |
| `--ubm-color-warn` | `oklch(0.62 0.12 75)` | L17 |
| `--ubm-color-warn-soft` | `oklch(0.96 0.05 80)` | L18 |
| `--ubm-color-danger` | `oklch(0.55 0.15 25)` | L19 |
| `--ubm-color-danger-soft` | `oklch(0.95 0.04 30)` | L20 |
| `--ubm-color-info` | `oklch(0.55 0.09 230)` | L21 |
| `--ubm-color-info-soft` | `oklch(0.96 0.025 230)` | L22 |

#### 3.4.2 warm

| token | 値 | source |
|-------|---|--------|
| `--ubm-color-surface-bg` | `#f7f2ea` | L43 |
| `--ubm-color-surface-bg-2` | `#eee5d5` | L44 |
| `--ubm-color-surface-panel` | `#fffcf6` | L45 |
| `--ubm-color-surface-panel-2` | `#fbf6ec` | L46 |
| `--ubm-color-border-default` | `#ece2d1` | L47 |
| `--ubm-color-border-strong` | `#d8c9b0` | L48 |
| `--ubm-color-text-primary` | `#22180a` | L49 |
| `--ubm-color-text-secondary` | `#6b5a42` | L50 |
| `--ubm-color-text-muted` | `#9a8a6e` | L51 |
| `--ubm-color-accent` | `oklch(0.62 0.14 50)` | L52 |
| `--ubm-color-accent-soft` | `oklch(0.94 0.05 60)` | L53 |
| `--ubm-color-accent-ink` | `oklch(0.40 0.13 50)` | L54 |

> `ok / warn / danger / info` は warm/cool テーマでも stone と共通（プロトタイプで未上書き）。

#### 3.4.3 cool

| token | 値 | source |
|-------|---|--------|
| `--ubm-color-surface-bg` | `#f1f3f5` | L58 |
| `--ubm-color-surface-bg-2` | `#e4e8ec` | L59 |
| `--ubm-color-surface-panel` | `#ffffff` | L60 |
| `--ubm-color-surface-panel-2` | `#f8fafc` | L61 |
| `--ubm-color-border-default` | `#e2e5ea` | L62 |
| `--ubm-color-border-strong` | `#cfd5dc` | L63 |
| `--ubm-color-text-primary` | `#0f1720` | L64 |
| `--ubm-color-text-secondary` | `#4a5563` | L65 |
| `--ubm-color-text-muted` | `#7c8693` | L66 |
| `--ubm-color-accent` | `oklch(0.52 0.11 240)` | L67 |
| `--ubm-color-accent-soft` | `oklch(0.95 0.03 235)` | L68 |
| `--ubm-color-accent-ink` | `oklch(0.36 0.12 240)` | L69 |

### 4.4 §3.3 zone tokens（プロトタイプ未明示・本仕様で正本化）

phase-3 §3.3 で「zone 色: `--ubm-color-zone-{a..e}`」と宣言済み。プロトタイプ `primitives.jsx` の `zoneTone` (`L265`) は zone 名（"0→1" / "1→10" / etc）を `info` / `accent` / `ok` の status tone に写像するだけで、独立色は持たない。本仕様では将来拡張のため **5 値の placeholder**を確保し、MVP では既存 status tokens を alias する:

| token | 値（MVP） | 将来 |
|-------|----------|------|
| `--ubm-color-zone-a` | `var(--ubm-color-info)` | 独自 OKLch 値に置換可能 |
| `--ubm-color-zone-b` | `var(--ubm-color-accent)` | 同上 |
| `--ubm-color-zone-c` | `var(--ubm-color-ok)` | 同上 |
| `--ubm-color-zone-d` | `var(--ubm-color-warn)` | 同上 |
| `--ubm-color-zone-e` | `var(--ubm-color-danger)` | 同上 |

### 4.5 §3.5 sRGB fallback 戦略

```css
/* OKLch をサポートしないブラウザ向けの近似 sRGB fallback */
@supports not (color: oklch(0% 0 0)) {
  :root {
    --ubm-color-accent: #b08049;        /* oklch(0.58 0.10 55) ≈ */
    --ubm-color-accent-soft: #f3ece1;   /* oklch(0.95 0.03 65) ≈ */
    --ubm-color-accent-ink: #6f4f25;    /* oklch(0.38 0.10 55) ≈ */
    --ubm-color-ok: #5e8a5d;            /* oklch(0.55 0.10 155) ≈ */
    --ubm-color-warn: #c08540;          /* oklch(0.62 0.12 75) ≈ */
    --ubm-color-danger: #b34a3b;        /* oklch(0.55 0.15 25) ≈ */
    --ubm-color-info: #4d7da6;          /* oklch(0.55 0.09 230) ≈ */
  }
}
```

> 近似値は OKLch から sRGB へ gamut-mapped した値（task-08 実装時に Culori / `colorjs.io` で計算する）。本仕様では「fallback を `@supports not` ブロックで提供する」という構造を確定させ、近似値の正確な算出は task-09 の `globals.css` 適用タイミングで再計算する。

### 4.6 §4 radius tokens

| token | 値 | source |
|-------|---|--------|
| `--ubm-radius-sm` | `8px` | `styles.css` L29 |
| `--ubm-radius-md` | `12px` | L30 |
| `--ubm-radius-lg` | `16px` | L31 |
| `--ubm-radius-xl` | `20px` | L32 |
| `--ubm-radius-2xl` | `28px` | L33 |

### 4.7 §5 shadow tokens

| token | 値 | source |
|-------|---|--------|
| `--ubm-shadow-xs` | `0 1px 2px rgba(24, 23, 20, 0.04)` | L24 |
| `--ubm-shadow-sm` | `0 1px 2px rgba(24, 23, 20, 0.05), 0 2px 6px rgba(24, 23, 20, 0.04)` | L25 |
| `--ubm-shadow-md` | `0 4px 16px rgba(24, 23, 20, 0.06), 0 1px 2px rgba(24, 23, 20, 0.04)` | L26 |
| `--ubm-shadow-lg` | `0 20px 48px rgba(24, 23, 20, 0.10), 0 2px 6px rgba(24, 23, 20, 0.04)` | L27 |

### 4.8 §6 typography tokens

| token | 値 | source |
|-------|---|--------|
| `--ubm-font-jp` | `"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif` | L35 |
| `--ubm-font-en` | `"Geist", "SF Pro Text", system-ui, sans-serif` | L36 |
| `--ubm-font-serif` | `"Noto Serif JP", serif` | L37 |
| `--ubm-font-body` | `var(--ubm-font-en), var(--ubm-font-jp)` | L38 |
| `--ubm-font-mono` | `"SF Mono", "Menlo", ui-monospace, monospace` | L39 |
| `--ubm-text-xs` | `11px` | プロトタイプ class 観測 |
| `--ubm-text-sm` | `12.5px` | 同上 |
| `--ubm-text-base` | `13.5px` | 同上 |
| `--ubm-text-md` | `14px` | 同上 |
| `--ubm-text-lg` | `16px` | 同上 |
| `--ubm-text-xl` | `20px` | 同上 |
| `--ubm-text-2xl` | `24px` | 同上 |
| `--ubm-text-3xl` | `32px` | 同上 |

### 4.9 §7 spacing tokens（4px base）

| token | 値 |
|-------|---|
| `--ubm-space-0` | `0` |
| `--ubm-space-1` | `4px` |
| `--ubm-space-2` | `8px` |
| `--ubm-space-3` | `12px` |
| `--ubm-space-4` | `16px` |
| `--ubm-space-6` | `24px` |
| `--ubm-space-8` | `32px` |
| `--ubm-space-12` | `48px` |
| `--ubm-space-16` | `64px` |
| `--ubm-space-24` | `96px` |

### 4.10 §8 motion tokens

| token | 値 |
|-------|---|
| `--ubm-dur-fast` | `120ms` |
| `--ubm-dur-base` | `180ms` |
| `--ubm-dur-slow` | `260ms` |
| `--ubm-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--ubm-ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1)` |
| `--ubm-ease-decelerate` | `cubic-bezier(0, 0, 0, 1)` |
| `--ubm-ease-accelerate` | `cubic-bezier(0.3, 0, 1, 1)` |

> プロトタイプ `styles.css` の `transition: ... .15s ease` (L189 付近) を参考に標準化。

### 4.11 §9 token JSON サンプル（`design-tokens.json`）

本ファイル内に inline で完全な JSON を載せる。Style Dictionary / 自前 generator どちらでも解釈可能な flat 構造:

```json
{
  "color": {
    "surface": {
      "bg":      { "value": "#f5f4f1", "css": "--ubm-color-surface-bg" },
      "bg-2":    { "value": "#ebe9e3", "css": "--ubm-color-surface-bg-2" },
      "panel":   { "value": "#ffffff", "css": "--ubm-color-surface-panel" },
      "panel-2": { "value": "#fafaf8", "css": "--ubm-color-surface-panel-2" }
    },
    "text": {
      "primary":   { "value": "#1a1917", "css": "--ubm-color-text-primary" },
      "secondary": { "value": "#57554e", "css": "--ubm-color-text-secondary" },
      "muted":     { "value": "#8a877e", "css": "--ubm-color-text-muted" }
    },
    "border": {
      "default": { "value": "#e7e5df", "css": "--ubm-color-border-default" },
      "strong":  { "value": "#d6d3cc", "css": "--ubm-color-border-strong" }
    },
    "accent": {
      "base": { "value": "oklch(0.58 0.10 55)", "css": "--ubm-color-accent" },
      "soft": { "value": "oklch(0.95 0.03 65)", "css": "--ubm-color-accent-soft" },
      "ink":  { "value": "oklch(0.38 0.10 55)", "css": "--ubm-color-accent-ink" }
    },
    "status": {
      "ok":     { "value": "oklch(0.55 0.10 155)", "css": "--ubm-color-ok" },
      "warn":   { "value": "oklch(0.62 0.12 75)",  "css": "--ubm-color-warn" },
      "danger": { "value": "oklch(0.55 0.15 25)",  "css": "--ubm-color-danger" },
      "info":   { "value": "oklch(0.55 0.09 230)", "css": "--ubm-color-info" }
    },
    "zone": {
      "a": { "value": "{color.status.info}",    "css": "--ubm-color-zone-a" },
      "b": { "value": "{color.accent.base}",    "css": "--ubm-color-zone-b" },
      "c": { "value": "{color.status.ok}",      "css": "--ubm-color-zone-c" },
      "d": { "value": "{color.status.warn}",    "css": "--ubm-color-zone-d" },
      "e": { "value": "{color.status.danger}",  "css": "--ubm-color-zone-e" }
    }
  },
  "radius": {
    "sm":  { "value": "8px",  "css": "--ubm-radius-sm" },
    "md":  { "value": "12px", "css": "--ubm-radius-md" },
    "lg":  { "value": "16px", "css": "--ubm-radius-lg" },
    "xl":  { "value": "20px", "css": "--ubm-radius-xl" },
    "2xl": { "value": "28px", "css": "--ubm-radius-2xl" }
  },
  "shadow": {
    "xs": { "value": "0 1px 2px rgba(24, 23, 20, 0.04)", "css": "--ubm-shadow-xs" },
    "sm": { "value": "0 1px 2px rgba(24, 23, 20, 0.05), 0 2px 6px rgba(24, 23, 20, 0.04)", "css": "--ubm-shadow-sm" },
    "md": { "value": "0 4px 16px rgba(24, 23, 20, 0.06), 0 1px 2px rgba(24, 23, 20, 0.04)", "css": "--ubm-shadow-md" },
    "lg": { "value": "0 20px 48px rgba(24, 23, 20, 0.10), 0 2px 6px rgba(24, 23, 20, 0.04)", "css": "--ubm-shadow-lg" }
  },
  "spacing": {
    "0": "0",  "1": "4px", "2": "8px",  "3": "12px", "4": "16px",
    "6": "24px", "8": "32px", "12": "48px", "16": "64px", "24": "96px"
  },
  "font": {
    "jp":    { "value": "\"Noto Sans JP\", \"Hiragino Sans\", \"Yu Gothic\", sans-serif", "css": "--ubm-font-jp" },
    "en":    { "value": "\"Geist\", \"SF Pro Text\", system-ui, sans-serif", "css": "--ubm-font-en" },
    "serif": { "value": "\"Noto Serif JP\", serif", "css": "--ubm-font-serif" },
    "body":  { "value": "var(--ubm-font-en), var(--ubm-font-jp)", "css": "--ubm-font-body" },
    "mono":  { "value": "\"SF Mono\", \"Menlo\", ui-monospace, monospace", "css": "--ubm-font-mono" }
  },
  "text": {
    "xs":   "11px", "sm":   "12.5px", "base": "13.5px", "md":   "14px",
    "lg":   "16px", "xl":   "20px",   "2xl":  "24px",   "3xl":  "32px"
  },
  "duration": { "fast": "120ms", "base": "180ms", "slow": "260ms" },
  "easing": {
    "standard":   "cubic-bezier(0.2, 0, 0, 1)",
    "emphasized": "cubic-bezier(0.3, 0, 0, 1)",
    "decelerate": "cubic-bezier(0, 0, 0, 1)",
    "accelerate": "cubic-bezier(0.3, 0, 1, 1)"
  }
}
```

### 4.12 §10 Tailwind v4 `@theme` 直結ガイド

task-09 で `apps/web/src/styles/tokens.css` に貼り付けるテンプレート（本ファイルは仕様書のため inline サンプルのみ提示）:

```css
/* tokens.css — task-09 で実装 */
:root {
  /* color */
  --ubm-color-surface-bg: #f5f4f1;
  --ubm-color-surface-panel: #ffffff;
  --ubm-color-text-primary: #1a1917;
  --ubm-color-accent: oklch(0.58 0.10 55);
  /* ... §3.4.1 の全 token を列挙 ... */

  /* radius / shadow / spacing / font / text / motion */
  --ubm-radius-md: 12px;
  --ubm-shadow-md: 0 4px 16px rgba(24, 23, 20, 0.06), 0 1px 2px rgba(24, 23, 20, 0.04);
  --ubm-space-4: 16px;
  --ubm-text-base: 13.5px;
  --ubm-dur-base: 180ms;
}

[data-theme="warm"] {
  --ubm-color-surface-bg: #f7f2ea;
  --ubm-color-accent: oklch(0.62 0.14 50);
  /* §3.4.2 */
}

[data-theme="cool"] {
  --ubm-color-surface-bg: #f1f3f5;
  --ubm-color-accent: oklch(0.52 0.11 240);
  /* §3.4.3 */
}

@supports not (color: oklch(0% 0 0)) {
  :root { /* §3.5 fallback */ }
}
```

```css
/* globals.css — Tailwind v4 @theme 直結 */
@import "tailwindcss";
@import "./tokens.css";

@theme {
  --color-surface: var(--ubm-color-surface-bg);
  --color-panel:   var(--ubm-color-surface-panel);
  --color-text:    var(--ubm-color-text-primary);
  --color-accent:  var(--ubm-color-accent);
  --color-ok:      var(--ubm-color-ok);
  --color-warn:    var(--ubm-color-warn);
  --color-danger:  var(--ubm-color-danger);
  --color-info:    var(--ubm-color-info);

  --radius-sm: var(--ubm-radius-sm);
  --radius-md: var(--ubm-radius-md);
  --radius-lg: var(--ubm-radius-lg);

  --shadow-xs: var(--ubm-shadow-xs);
  --shadow-sm: var(--ubm-shadow-sm);
  --shadow-md: var(--ubm-shadow-md);
  --shadow-lg: var(--ubm-shadow-lg);

  --font-sans:  var(--ubm-font-body);
  --font-mono:  var(--ubm-font-mono);

  --spacing: 4px;  /* Tailwind v4 default scale base */
}
```

これで Tailwind utility（`bg-surface`, `text-text`, `bg-accent`, `rounded-md`, `shadow-md`, `font-sans`）が `--ubm-*` 変数経由でテーマ切替に追随する。

### 4.13 §11 dark mode 拡張余地

```css
/* MVP 非対応・placeholder のみ */
[data-theme="dark"] {
  /* TODO: 別 workflow で値を確定。本タスクでは structure のみ確保 */
  --ubm-color-surface-bg: oklch(0.18 0 0);
  --ubm-color-surface-panel: oklch(0.22 0 0);
  --ubm-color-text-primary: oklch(0.95 0 0);
}
```

dark mode 値は MVP では決定しない。`09-ui-ux.md` §6 に「dark は MVP 非対応」と明記されている前提で、structure だけ確保。

---

## 5. 入力・出力

### 5.1 入力

- `styles.css` L1-L70（`:root` + 3 テーマ）の全 token 値
- `phase-3.md` §3.3（zone / status の OKLch 適用ルール）
- プロトタイプの class が暗黙的に依存している font-size / spacing 値（観測値ベースで rationalize）

### 5.2 出力

- 新規 `09b-design-tokens.md`（380〜540 行）
- 章立て §1〜§12
- §3 で 3 テーマ全 token 値が転記済み
- §9 で `design-tokens.json` が完全な形で inline 提示
- §10 で Tailwind v4 `@theme` block の貼り付けテンプレートが提示

---

## 6. テスト方針

### 6.1 markdown 構造検証

| 検証 | 方法 |
|------|------|
| 章立て 12 章 | `grep -c "^## " specs/09b-design-tokens.md` → 12 |
| 3 テーマ全表 | §3.4.1 / §3.4.2 / §3.4.3 が存在 |
| JSON サンプルが parse 可能 | `awk '/^```json$/,/^```$/' specs/09b-design-tokens.md \| sed '1d;$d' \| jq .` → 0 exit |
| `--ubm-*` token 数 | `grep -cE '^\| `--ubm-[a-z0-9-]+`' specs/09b-design-tokens.md` → 60+ |

### 6.2 トークン整合性スクリプト案

task-18 で実装する `verify-design-tokens.ts` の **仕様書側根拠**として、本ファイルが提供する整合性ルールは以下:

```bash
# 1. 09b で宣言された token と styles.css 値が齟齬なし
TOKENS=$(grep -oE '`--ubm-[a-z0-9-]+`' docs/00-getting-started-manual/specs/09b-design-tokens.md | sort -u)
echo "$TOKENS" | wc -l   # → 60+ 期待

# 2. 09b の OKLch 値が styles.css 由来であることを cross-check
for v in "0.58 0.10 55" "0.55 0.10 155" "0.55 0.15 25" "0.55 0.09 230" "0.62 0.14 50" "0.52 0.11 240"; do
  grep -q "oklch($v)" docs/00-getting-started-manual/claude-design-prototype/styles.css || \
    { echo "MISSING in styles.css: oklch($v)"; exit 1; }
  grep -q "oklch($v)" docs/00-getting-started-manual/specs/09b-design-tokens.md || \
    { echo "MISSING in 09b: oklch($v)"; exit 1; }
done

# 3. JSON が valid
awk '/^```json$/,/^```$/' docs/00-getting-started-manual/specs/09b-design-tokens.md | sed '1d;$d' | jq . > /dev/null
```

### 6.3 task-18 で実装する `verify-design-tokens.ts` の入力契約

| input | 期待 |
|-------|------|
| `apps/web/src/**/*.{ts,tsx,css}` | `#[0-9a-fA-F]{3,8}` 直書き 0 件、`bg-[#...]` / `text-[#...]` 直書き 0 件 |
| `apps/web/src/styles/tokens.css` | 09b §10 のテンプレートと完全一致（diff 0） |
| 09b 自体の token 名 | `--ubm-*` prefix で 60+ 個 |

### 6.4 a11y / contrast

- `--ubm-color-text-primary` × `--ubm-color-surface-bg` のコントラスト比が WCAG AA (4.5:1) を満たす想定値であることを §3.4 に注記
- accent, status 系は **テキスト用ではなく面積要素用**として扱い、テキスト用には `-ink` variant を使う規範を §3.2 に明記

---

## 7. 実行コマンド

```bash
# 1. 値の出典を確認
sed -n '1,70p' docs/00-getting-started-manual/claude-design-prototype/styles.css

# 2. 09b-design-tokens.md を新規作成
$EDITOR docs/00-getting-started-manual/specs/09b-design-tokens.md

# 3. 章立て検証
grep -c '^## ' docs/00-getting-started-manual/specs/09b-design-tokens.md   # → 12 期待

# 4. JSON 健全性検証
awk '/^```json$/,/^```$/' docs/00-getting-started-manual/specs/09b-design-tokens.md \
  | sed '1d;$d' | jq . > /dev/null && echo "JSON OK"

# 5. token 数
grep -cE '`--ubm-[a-z0-9-]+`' docs/00-getting-started-manual/specs/09b-design-tokens.md   # → 60+ 期待

# 6. cross-check (§6.2 step 2)
bash scripts/verify-09b-tokens-cross-check.sh || true

# 7. lint
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09b-design-tokens.md || true
```

---

## 8. DoD

- [ ] `09b-design-tokens.md` が 380 行以上で新規作成されている
- [ ] §2 命名規則表が 12 種以上（color/radius/shadow/font/text/spacing/duration/easing 等）
- [ ] §3.4.1 stone / §3.4.2 warm / §3.4.3 cool の **3 テーマ全 token 値**が転記済み
- [ ] §3.3 zone tokens (a..e) が status tokens の alias として正本化
- [ ] §3.5 sRGB fallback 戦略が `@supports not (color: oklch(...))` で記述
- [ ] §4 radius / §5 shadow / §6 typography / §7 spacing / §8 motion すべて token 表あり
- [ ] §9 `design-tokens.json` が **完全な valid JSON**（jq parse OK）として inline
- [ ] §10 Tailwind v4 `@theme` 直結テンプレートが `tokens.css` + `globals.css` の対で記述
- [ ] §11 dark mode placeholder が記述（値未定で OK）
- [ ] §6.2 cross-check で `styles.css` 由来 OKLch 値が 09b に欠落 0
- [ ] `09-ui-ux.md`（task-06 出力）の §6 token 参照規則と整合（prefix `--ubm-*` 一致）
- [ ] `09a-prototype-map.md`（task-07 出力）の §2 で参照される primitive の token 名が 09b に存在
- [ ] markdown lint error 0
- [ ] `--ubm-*` token 数が 60+ 個
- [ ] HEX 直書きはテーマ surface / text / border のみ（プロトタイプ準拠）。それ以外は OKLch または `var(--ubm-*)` 参照

---

## 9. 影響範囲・リスク

| リスク | 緩和策 |
|--------|--------|
| OKLch 非対応ブラウザでの色化け | §3.5 で `@supports not` fallback を確定。task-09 で実装 |
| token 名の prefix 衝突（既存 Tailwind / 他ライブラリ） | `--ubm-*` 専用 prefix で衝突回避 |
| 3 テーマで上書き漏れ（warm/cool で status を未定義） | §3.4 末尾注記で「stone と共通」を明記 |
| dark mode 値未定で実装が止まる | §11 placeholder のみ。MVP 非対応を `09-ui-ux.md` §6 と整合 |
| JSON / CSS の **二重メンテ**による drift | §9 を正本とし、§10 / §3.4 表は generator で派生する位置付けを §1 で明文化（MVP は手動でも OK） |
| zone 色の独自値要求（将来） | §3.3 alias 構造で受け、`--ubm-color-zone-*` だけを書き換えれば全画面追随 |

---

## 10. 関連 task / link 先

- task-06 ui-ux-contract-rewrite → 本ファイルへ link する（`09-ui-ux.md` §6）
- task-07 prototype-mapping-table → 本ファイルへ link する（`09a-prototype-map.md` §2 の token 列）
- task-09 tailwind-v4-setup → §10 のテンプレートを `apps/web/src/styles/{tokens,globals}.css` に実装
- task-10 ui-primitives → variant prop で `--ubm-color-*` を class-variance-authority に渡す
- task-18 verify-design-tokens → §6.2 と §6.3 の input 契約を CI gate として実装
- phase-3 §3.3 → zone / status 適用ルールの出所


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
