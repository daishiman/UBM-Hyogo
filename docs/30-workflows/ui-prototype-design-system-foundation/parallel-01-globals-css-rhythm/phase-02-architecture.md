---
phase: 2
title: アーキテクチャ — CSS layer 構造・selector 設計・トークン経路
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 2: アーキテクチャ設計

[実装区分: 実装仕様書]

## 1. CSS layer 構造（現状維持 + 追記）

```css
@import "tailwindcss" source(none);
@import "./tokens.css";
@import "./legacy-public.css";

@theme inline { /* L11-68 既存トークン bridge — 変更しない */ }

@layer base { /* L70-114 既存 reset + body 既定 — 変更しない */ }

@layer components {
  /* L116-198 既存: parallel-09 form / pagination / icon / breadcrumb 規則 — 変更しない */

  /* === parallel-01 P1-1 page surface === */
  /* === parallel-01 P1-2 section rhythm === */
  /* === parallel-01 P1-3 card chrome === */
  /* === parallel-01 P1-4 shell surface === */
  /* === parallel-01 P1-5 typography scale === */

  /* L200-214 既存: focus-visible / reduced-motion — 変更しない */
}
```

本 SW は **既存 `@layer components` 内、parallel-09 規則と focus-visible 規則のあいだ** に
P1-1〜P1-5 の 5 セクションを挿入する。`@layer base` には触らない。

## 2. selector 設計

### 2.1 命名規約

| 種別 | 形式 | 例 |
|------|------|----|
| Page route marker | `[data-route="public\|admin\|member"]` | `main[data-route="admin"]` |
| Section rhythm | `[data-section]` / `[data-section-rhythm="compact\|comfortable\|loose"]` | `<section data-section data-section-rhythm="comfortable">` |
| Card | `[data-card]` / `[data-card-tone="panel\|surface\|emphasis\|flat"]` | `<article data-card data-card-tone="panel">` |
| Shell chrome | `[data-shell="topbar\|sidebar\|footer"]` | `<header data-shell="topbar">` |
| Typography | `[data-text="display\|title\|section\|card\|body\|caption\|eyebrow"]` | `<h1 data-text="display">` |

すべて **属性セレクタ**で specificity を統一する。class セレクタとの混在を避け、AppShell 契約
（parallel-03）と一致させる。

### 2.2 specificity 戦略

- [x] 単一 attribute selector（specificity 0,1,0）を基本
- [x] `data-card-tone="emphasis"` のような modifier も同 specificity
- [x] Tailwind utility（specificity 0,1,0）と同レベルで cascade 順だけで上書き可能にする
- [x] `!important` は禁止

## 3. トークン経路

| selector | 引く token | tokens.css 行 |
|----------|-----------|-------------|
| `body`, `[data-route]` | `--ubm-color-surface-bg` / `--ubm-color-text-primary` | L6, L12 |
| `[data-section]` | `--ubm-space-8` / `--ubm-space-12` / `--ubm-space-16` | L77-79 |
| `[data-card]` | `--ubm-color-surface-panel` / `--ubm-color-border-default` / `--ubm-radius-lg` / `--ubm-shadow-xs` | L8, L17, L45, L50 |
| `[data-card-tone="surface"]` | `--ubm-color-surface-bg-2` | L7 |
| `[data-card-tone="emphasis"]` | `--ubm-color-surface-panel-2` / `--ubm-shadow-md` | L9, L52 |
| `[data-shell="topbar"]` | `--ubm-color-surface-panel` / `--ubm-color-border-default` | L8, L17 |
| `[data-shell="sidebar"]` | `--ubm-color-surface-panel` / `--ubm-color-border-default` | L8, L17 |
| `[data-shell="footer"]` | `--ubm-color-surface-bg-2` / `--ubm-color-border-default` | L7, L17 |
| `[data-text="display"]` | `--ubm-text-3xl` | L69 |
| `[data-text="title"]` | `--ubm-text-2xl` | L68 |
| `[data-text="section"]` | `--ubm-text-xl` | L67 |
| `[data-text="card"]` | `--ubm-text-lg` | L66 |
| `[data-text="body"]` | `--ubm-text-base` | L64 |
| `[data-text="caption"]` | `--ubm-text-sm` / `--ubm-color-text-secondary` | L63, L13 |
| `[data-text="eyebrow"]` | `--ubm-text-xs` / `--ubm-color-text-muted` | L62, L14 |

## 4. 採用しない選択肢

| 選択肢 | 不採用理由 |
|--------|----------|
| class セレクタ `.page-surface` 等で実装 | AppShell 契約は data attribute 主体。class と attribute の二重契約はドリフト源 |
| Tailwind config の `@theme` で page-level を表現 | utility 層に置くと page.tsx ごとに付け忘れリスク。component 層で機械化する方が安全 |
| `tokens.css` に page chrome 値を追加 | tokens は raw value 層。chrome は selector 層の責務 |
| `@layer base` で `[data-route]` を定義 | reset と業務 chrome は分離。component 層に置くことで上書きしやすい |
| dark theme override | MVP 非対応（NFR-04） |

## 5. 既存規則との衝突回避

- [x] 既存 `@layer base` の `body { background: var(--ubm-color-surface-bg) }`（L81）と本 SW の `body` 規則は**同値**になるため衝突しない（component 層が cascade 上後勝ち）
- [x] 既存 parallel-09 規則は `.ui-*` class セレクタ。本 SW は `[data-*]` 属性セレクタ。**名前空間が異なる**ため衝突しない
- [x] 既存 focus-visible / reduced-motion 規則は本 SW の末尾より後ろに維持する

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `2` |
| status | `runtime_pending` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |

## 目的

この Phase は既存本文の内容を、task-specification-creator の共通骨格に沿って実行可能な仕様として扱う。

## 実行タスク

1. 既存本文の Phase 固有タスクを実行する。
2. `apps/web/src/styles/globals.css` の P1-1〜P1-5 selector contract と矛盾しないことを確認する。
3. Phase 11 evidence と Phase 12 strict 7 の境界を `VISUAL_ON_EXECUTION` として維持する。

## 参照資料

- `docs/30-workflows/ui-prototype-design-system-foundation/index.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md`
- `apps/web/src/styles/globals.css`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 成果物

- 本 Phase ファイル
- `outputs/phase-11/` の local selector evidence
- `outputs/phase-12/` の strict 7 files

## 完了条件

- [x] `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm` が error 0 である。
- [x] P1-1〜P1-5 selector が `globals.css` に存在する。
- [x] root workflow 全体の visual runtime evidence は serial-07 に委譲され、parallel-01 は `runtime_pending` として閉じる。

## 統合テスト連携

- CSS selector presence は `outputs/phase-11/section-presence.txt` と `grep-selectors.txt` で確認する。
- visual screenshot は `serial-07-regression-evidence/` の責務として後続 runtime evidence に接続する。
