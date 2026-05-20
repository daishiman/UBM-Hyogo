---
phase: 3
title: タスク分解 — rhythm 5 ステップ
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 3: タスク分解

[実装区分: 実装仕様書]

## 1. ステップ一覧（rhythm 単位）

| Step | ID | 内容 | 対象 selector | 想定 LOC | 依存 |
|------|----|------|--------------|--------|------|
| 1 | P1-1 | Page surface 規則を追加 | `body`, `[data-route]` | 8-12 | なし |
| 2 | P1-2 | Section rhythm を追加 | `[data-section]`, `[data-section-rhythm="compact\|comfortable\|loose"]` | 15-22 | P1-1 |
| 3 | P1-3 | Card chrome を追加 | `[data-card]`, `[data-card-tone="panel\|surface\|emphasis\|flat"]` | 25-35 | P1-1 |
| 4 | P1-4 | Shell surface を追加 | `[data-shell="topbar\|sidebar\|footer"]` | 25-35 | P1-1 |
| 5 | P1-5 | Typography scale を追加 | `[data-text="display\|title\|section\|card\|body\|caption\|eyebrow"]` | 35-50 | P1-1 |
| 6 | P1-6 | Admin shell width を selector rhythm に揃える | `md:grid-cols-[272px_1fr]` | 1 | P1-4 |

合計想定 LOC: 108-154 行（コメント含む）。

## 2. 各 Step の責務境界

### Step 1 (P1-1) Page surface
- [x] `body` への背景色適用は既存 `@layer base` と重複しても同値なら可
- [x] `[data-route]` に `min-height: 100vh` と背景を再宣言（route group 単位で AppShell が独立する想定）

### Step 2 (P1-2) Section rhythm
- [x] `[data-section]` 既定は `padding-block: var(--ubm-space-8)`
- [x] `compact` = `--ubm-space-4`, `comfortable` = `--ubm-space-8`, `loose` = `--ubm-space-12`
- [x] 隣接 `[data-section] + [data-section]` の上 border は parallel-02 の責務（本 SW では扱わない）

### Step 3 (P1-3) Card chrome
- [x] `[data-card]` 既定 tone は `panel`
- [x] `flat` tone は border のみ・shadow なし（プロトタイプ `.card-flat`）
- [x] `emphasis` tone は shadow `--ubm-shadow-md`
- [x] hover elevation は parallel-02 の責務（本 SW では扱わない）

### Step 4 (P1-4) Shell surface
- [x] `topbar` = sticky + backdrop blur + border-bottom
- [x] `sidebar` = sticky 100vh + border-right
- [x] `footer` = border-top + bg-2 背景
- [x] backdrop-filter は Safari 含めて広くサポート済（プレフィックス追記）

### Step 5 (P1-5) Typography scale
- [x] 7 段階すべて line-height と letter-spacing を含む
- [x] `display`/`title`/`section`/`card` は `font-weight: 600`
- [x] `body` は `font-weight: 400` / `line-height: 1.7`
- [x] `caption`/`eyebrow` は muted 色

## 3. 並列性

5 ステップは globals.css の同一ファイル末尾セクションを編集するため、**実装は同一 PR 内で順次** とし、commit は 1 つにまとめる（コミット粒度は Phase 13 で規定）。

## 4. 変更対象ファイル

| ファイル | 変更種別 | 想定追加行数 |
|---------|--------|------------|
| `apps/web/src/styles/globals.css` | 編集（追加のみ） | 108-154 |
| `apps/web/app/(admin)/layout.tsx` | 編集（admin grid width の既存値置換のみ） | 0 |

新規ファイルなし。削除なし。

## 5. CONST_007 適合

5 ステップは後続実装プロンプト 1 サイクルで完了する。先送りなし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `3` |
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
