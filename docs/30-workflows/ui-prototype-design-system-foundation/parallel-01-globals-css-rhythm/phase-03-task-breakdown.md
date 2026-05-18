---
phase: 3
title: タスク分解 — rhythm 5 ステップ
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: spec_created
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. ステップ一覧（rhythm 単位）

| Step | ID | 内容 | 対象 selector | 想定 LOC | 依存 |
|------|----|------|--------------|--------|------|
| 1 | P1-1 | Page surface 規則を追加 | `body`, `[data-route]` | 8-12 | なし |
| 2 | P1-2 | Section rhythm を追加 | `[data-section]`, `[data-section-rhythm="compact\|comfortable\|loose"]` | 15-22 | P1-1 |
| 3 | P1-3 | Card chrome を追加 | `[data-card]`, `[data-card-tone="panel\|surface\|emphasis\|flat"]` | 25-35 | P1-1 |
| 4 | P1-4 | Shell surface を追加 | `[data-shell="topbar\|sidebar\|footer"]` | 25-35 | P1-1 |
| 5 | P1-5 | Typography scale を追加 | `[data-text="display\|title\|section\|card\|body\|caption\|eyebrow"]` | 35-50 | P1-1 |

合計想定 LOC: 108-154 行（コメント含む）。

## 2. 各 Step の責務境界

### Step 1 (P1-1) Page surface
- `body` への背景色適用は既存 `@layer base` と重複しても同値なら可
- `[data-route]` に `min-height: 100vh` と背景を再宣言（route group 単位で AppShell が独立する想定）

### Step 2 (P1-2) Section rhythm
- `[data-section]` 既定は `padding-block: var(--ubm-space-8)`
- `compact` = `--ubm-space-4`, `comfortable` = `--ubm-space-8`, `loose` = `--ubm-space-12`
- 隣接 `[data-section] + [data-section]` の上 border は parallel-02 の責務（本 SW では扱わない）

### Step 3 (P1-3) Card chrome
- `[data-card]` 既定 tone は `panel`
- `flat` tone は border のみ・shadow なし（プロトタイプ `.card-flat`）
- `emphasis` tone は shadow `--ubm-shadow-md`
- hover elevation は parallel-02 の責務（本 SW では扱わない）

### Step 4 (P1-4) Shell surface
- `topbar` = sticky + backdrop blur + border-bottom
- `sidebar` = sticky 100vh + border-right
- `footer` = border-top + bg-2 背景
- backdrop-filter は Safari 含めて広くサポート済（プレフィックス追記）

### Step 5 (P1-5) Typography scale
- 7 段階すべて line-height と letter-spacing を含む
- `display`/`title`/`section`/`card` は `font-weight: 600`
- `body` は `font-weight: 400` / `line-height: 1.7`
- `caption`/`eyebrow` は muted 色

## 3. 並列性

5 ステップは globals.css の同一ファイル末尾セクションを編集するため、**実装は同一 PR 内で順次** とし、commit は 1 つにまとめる（コミット粒度は Phase 13 で規定）。

## 4. 変更対象ファイル

| ファイル | 変更種別 | 想定追加行数 |
|---------|--------|------------|
| `apps/web/src/styles/globals.css` | 編集（追加のみ） | 108-154 |

新規ファイルなし。削除なし。

## 5. CONST_007 適合

5 ステップは後続実装プロンプト 1 サイクルで完了する。先送りなし。
