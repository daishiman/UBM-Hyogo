# Phase 2 — layout-blueprint（3 層 ASCII ワイヤフレーム + token 割当）

> 全 token は `apps/web/src/styles/tokens.css` の実在値。HEX 直書きは存在しない（AC-5）。

## 1. デスクトップ（lg: ≥1024px）ワイヤフレーム

```
┌────────────────────────────────────────────────────────────────────────┐
│ AdminPageHeader (h1: 出席ダッシュボード / breadcrumb)  ← page.tsx 据え置き │
├────────────────────────────────────────────────────────────────────────┤
│ [期間: 全期間|今月|3M|6M|1Y]  [回数帯: ☑0 ☑1-9 ☑10-99 ☑100+]  [CSV ⬇] │  ← AttendanceFilterBar 据え置き
├────────────────────────────────────────────────────────────────────────┤
│ ▎h2 概況 (PRIMARY zone)                                                  │
│ ┌───────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ ① 全体出席率                       │ │ ② 要フォロー対象              │ │
│ │                                    │ │                              │ │
│ │     42.0%   ↑7.0pt                 │ │   ⚠ 3 名  [warn badge]       │ │
│ │   (--ubm-text-3xl)  (delta)        │ │  (直近 3 セッション連続欠席)  │ │
│ │  期間内出席者 30名 / 出席者率60.0% │ │  ▸ 詳細を開く (details)       │ │
│ └───────────────────────────────────┘ └──────────────────────────────┘ │
│        grid-cols-1  lg:grid-cols-2   gap = --ubm-space-4                  │
├────────────────────────────────────────────────────────────────────────┤
│ ▎h2 傾向 (TREND zone)                                                    │
│ ┌───────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ 出席トレンド (折れ線 SVG)          │ │ 出席回数帯別分布 (横棒)       │ │
│ │  AdminSectionCard + Card surface   │ │  AdminSectionCard             │ │
│ └───────────────────────────────────┘ └──────────────────────────────┘ │
│        grid-cols-1  lg:grid-cols-2   gap = --ubm-space-4                  │
├────────────────────────────────────────────────────────────────────────┤
│ ▎h2 詳細 (DETAIL zone)  ← AttendanceDetailTabs                           │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │ [ セッション別 ] [ 会員別 ] [ TOP10 ]   ← Segmented (role=radiogroup) ││
│ ├──────────────────────────────────────────────────────────────────────┤│
│ │ (選択タブの表のみ表示 = 段階的開示・初期スクロール量削減)              ││
│ │  例) セッション別: 開催日 | タイトル | 出席者数 | 出席率 | [詳細]      ││
│ └──────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

## 2. モバイル（< 1024px）ワイヤフレーム

```
┌──────────────────────────────┐
│ AdminPageHeader (h1)          │
├──────────────────────────────┤
│ フィルタ (縦積み / 折返し)     │
├──────────────────────────────┤
│ ▎h2 概況                      │
│ ┌──────────────────────────┐ │
│ │ ① 全体出席率 42.0% ↑7.0pt │ │  ← 1col（grid-cols-1）
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ② 要フォロー 3 名 [warn]  │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ ▎h2 傾向                      │
│ ┌──────────────────────────┐ │
│ │ トレンド                  │ │  ← 1col
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 回数帯分布                │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ ▎h2 詳細                      │
│ [セッション別][会員別][TOP10] │  ← Segmented（横スクロール可）
│ ┌──────────────────────────┐ │
│ │ 選択タブの表              │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## 3. レスポンシブ breakpoint

| 要素 | mobile（< lg） | desktop（≥ lg = 1024px） | 実装 utility |
| --- | --- | --- | --- |
| PRIMARY 2 枚 hero | 1 カラム縦積み | 2 カラム | `grid-cols-1 lg:grid-cols-2`（既存 utility） |
| TREND 2 カラム | 1 カラム縦積み | 2 カラム | `grid-cols-1 lg:grid-cols-2` / 既存 `.attendance-charts-grid` のリズム調整 |
| DETAIL Segmented | 横スクロール許容 | 全幅 inline | 既存 Segmented スタイル |
| ページ余白 | `p-4`（layout 既存） | `md:p-6`（layout 既存） | `(admin)/layout.tsx` 据え置き |

> breakpoint は Tailwind `lg`（1024px）を踏襲。新規 breakpoint は定義しない（AC-8）。

## 4. token 割当（各ゾーン）

### 共通リズム

| 用途 | token | 値 |
| --- | --- | --- |
| ゾーン間 gap | `--ubm-space-6` | 24px 相当（ゾーン間を広く） |
| ゾーン内 card gap | `--ubm-space-4` | 16px |
| card 内 padding | `--ubm-space-4` 〜 `--ubm-space-6` | — |
| ゾーンサーフェス角丸 | `--ubm-radius-lg`（16）/ `--ubm-radius-xl`（20） | PRIMARY hero は xl で強調 |
| ゾーン境界 | `--ubm-color-border-default` | — |
| PRIMARY hero shadow | `--ubm-shadow-md` | 最大ウェイト |
| TREND/DETAIL shadow | `--ubm-shadow-sm` | 控えめ |

### タイポグラフィ階層（AC-2）

| レベル | token | 用途 |
| --- | --- | --- |
| h1 ページタイトル | `AdminPageHeader` 既定（`--ubm-text-2xl` 相当） | 「出席ダッシュボード」 |
| h2 ゾーン見出し | `--ubm-text-xl`（20） | 「概況」「傾向」「詳細」 |
| h3 ゾーン内サブ | `--ubm-text-lg`（16） | hero card タイトル・タブ内表見出し |
| **PRIMARY ① 出席率 value** | **`--ubm-text-3xl`（32）** | 最大焦点（AC-1） |
| KPI ラベル | `--ubm-text-sm`（12.5） | secondary KPI ラベル |
| eyebrow tracking | `--ubm-eyebrow-tracking`（0.12em） | ゾーン eyebrow（任意） |

### 色割当

| 用途 | token |
| --- | --- |
| ページ背景 | `--ubm-color-surface-bg` |
| card サーフェス | `--ubm-color-surface-panel` / `--ubm-color-surface-panel-2` |
| 本文 | `--ubm-color-text-primary` |
| 補助文 | `--ubm-color-text-secondary` / `--ubm-color-text-muted` |
| 出席率 hero アクセント | `--ubm-color-accent` / `--ubm-color-accent-soft` / `--ubm-color-accent-ink` |
| delta 上昇 | `--ubm-color-ok` |
| delta 下降 | `--ubm-color-danger` |
| 要フォロー warn | `--ubm-color-warn` / `--ubm-color-warn-soft` |
| 要フォロー 0 名 ok | `--ubm-color-ok` / `--ubm-color-ok-soft` |
| zone ラベル | `--ubm-color-zone-a` 〜 `--ubm-color-zone-e` |

## 5. `data-attendance-level` マッピング（AC-4・issue-1112 踏襲）

要フォロー hero（② PRIMARY）に `data-attendance-follow` 属性を付与し、件数でトーンを切り替える。新規 token は追加しない（既存 `--ubm-color-ok-soft` / `--ubm-color-warn-soft` を使用）。

| 要フォロー件数 | `data-attendance-follow` 値 | 表現 | 使用 token | Badge tone |
| --- | --- | --- | --- | --- |
| 0 名（連続欠席なし） | `none` | neutral/ok トーン（健全） | `--ubm-color-ok-soft` 背景 / `--ubm-color-ok` 文字 | `success` |
| 1 名以上 | `warn` | warn トーン（要対応） | `--ubm-color-warn-soft` 背景 / `--ubm-color-warn` 文字 | `warning` |

> 命名注: issue-1112 の `meetingStats.attendanceLevel()` は `none/normal/high` の 3 段（会議の出席「多寡」用）。本タスクの要フォローは「欠席者数」という別意味のため、属性名を `data-attendance-follow`（値 `none` / `warn`）として混同を避ける。判定関数は `attendanceFollowLevel(count: number): "none" | "warn"`（count <= 0 → none / それ以外 → warn）を新設（純粋関数・例外なし・[WEEKGRD-02]）。CSS は `globals.css` に `.attendance-follow-hero[data-attendance-follow="none"]` / `="warn"` を追加。

### globals.css 追加クラス（設計案）

| セレクタ | 用途 |
| --- | --- |
| `.attendance-zones` | 3 ゾーンの縦リズム（`gap: var(--ubm-space-6)`） |
| `.attendance-primary-grid` | PRIMARY 2 枚 hero（`grid-cols-1 lg:grid-cols-2`） |
| `.attendance-hero-card` | hero サーフェス（`--ubm-radius-xl` / `--ubm-shadow-md`） |
| `.attendance-hero-rate` | 出席率特大数値（`--ubm-text-3xl`） |
| `.attendance-follow-hero[data-attendance-follow]` | 要フォロートーン切替（`none` / `warn`） |
| `.attendance-trend-grid` | TREND 2 カラム（既存 `.attendance-charts-grid` をリネーム or 流用） |
| `.attendance-detail-tabs` | DETAIL Segmented + タブ body |
