---
phase: 5
title: 実装ガイド — globals.css への追記 CSS 規則
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 5: 実装ガイド

[実装区分: 実装仕様書]

## 1. 対象ファイル

**絶対パス**: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-195609-wt-19/apps/web/src/styles/globals.css`

リポジトリ相対パス: `apps/web/src/styles/globals.css`

補助対象: `apps/web/app/(admin)/layout.tsx`。既存 admin shell の grid
column を `md:grid-cols-[272px_1fr]` に揃えるだけで、layout 構造や
data 属性の追加は行わない。

## 2. 挿入位置

既存ファイルは:

- [x] L1-9: `@import` / `@source` 宣言
- [x] L11-68: `@theme inline` ブロック（Tailwind v4 token bridge）
- [x] L70-114: `@layer base`
- [x] L116-215: `@layer components`
  - L117-145: parallel-09 G9-1 form 規則
  - L147-169: parallel-09 G9-3 pagination 規則
  - L171-175: parallel-09 G9-4 icon 規則
  - L177-195: parallel-09 G9-5 breadcrumb 規則
  - L197-198: parallel-09 G9-6 mobile（コメントのみ）
  - L200-214: parallel-09 G9-7 focus-visible / reduced-motion

**追加位置**: 既存 `ui-prototype-design-system-foundation selector hooks` と G9-6 コメントのあいだ。既に parallel-02 相当の selector hooks が入っている場合は、その直後に本 SW の 5 セクション（P1-1〜P1-5）を挿入する。挿入後の構造:

```
... ui-prototype-design-system-foundation selector hooks (existing)
=== parallel-01 P1-1 page surface ===
=== parallel-01 P1-2 section rhythm ===
=== parallel-01 P1-3 card chrome ===
=== parallel-01 P1-4 shell surface ===
=== parallel-01 P1-5 typography scale ===
... G9-7 focus-visible / reduced-motion (existing)
```

## 3. 追加 CSS（実装サンプル）

下記は実装時に参考とする **指示的サンプル**。最終調整（コメント文面・空行）は実装者に委ねる。

```css
  /* === parallel-01 P1-1 page surface === */
  /* プロトタイプ styles.css L74-83 / L104-107 の翻訳。
     body は @layer base で背景を既に持つが、route group 単位の
     <main data-route> でも min-height と背景を再保証する。 */
  [data-route] {
    background: var(--ubm-color-surface-bg);
    color: var(--ubm-color-text-primary);
    min-height: 100vh;
  }

  /* === parallel-01 P1-2 section rhythm === */
  /* プロトタイプ .content-area padding（L262-268）を section 単位に分解 */
  [data-section] {
    padding-block: var(--ubm-space-8);
  }
  [data-section-rhythm="compact"] {
    padding-block: var(--ubm-space-4);
  }
  [data-section-rhythm="comfortable"] {
    padding-block: var(--ubm-space-8);
  }
  [data-section-rhythm="loose"] {
    padding-block: var(--ubm-space-12);
  }

  /* === parallel-01 P1-3 card chrome === */
  /* プロトタイプ .card / .card-flat（L303-323）の data-card 翻訳 */
  [data-card] {
    background: var(--ubm-color-surface-panel);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg);
    box-shadow: var(--ubm-shadow-xs);
  }
  [data-card-tone="panel"] {
    background: var(--ubm-color-surface-panel);
    border-color: var(--ubm-color-border-default);
    box-shadow: var(--ubm-shadow-xs);
  }
  [data-card-tone="surface"] {
    background: var(--ubm-color-surface-bg-2);
    border-color: var(--ubm-color-border-default);
    box-shadow: none;
    border-radius: var(--ubm-radius-md);
  }
  [data-card-tone="emphasis"] {
    background: var(--ubm-color-surface-panel-2);
    border-color: var(--ubm-color-border-strong);
    box-shadow: var(--ubm-shadow-md);
  }
  [data-card-tone="flat"] {
    background: var(--ubm-color-surface-bg);
    border-color: var(--ubm-color-border-default);
    box-shadow: none;
    border-radius: var(--ubm-radius-md);
  }

  /* === parallel-01 P1-4 shell surface === */
  /* プロトタイプ .topbar / .sidebar / sidebar-footer（L120-260 派生） */
  [data-shell="topbar"] {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: var(--ubm-space-4);
    padding: var(--ubm-space-3) var(--ubm-space-8);
    background: var(--ubm-color-surface-panel);
    border-bottom: 1px solid var(--ubm-color-border-default);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
  }
  [data-shell="sidebar"] {
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-4);
    padding: var(--ubm-space-6) var(--ubm-space-4) var(--ubm-space-4);
    background: var(--ubm-color-surface-panel);
    border-right: 1px solid var(--ubm-color-border-default);
  }
  [data-shell="footer"] {
    padding: var(--ubm-space-8);
    background: var(--ubm-color-surface-bg-2);
    border-top: 1px solid var(--ubm-color-border-default);
    color: var(--ubm-color-text-secondary);
  }

  /* === parallel-01 P1-5 typography scale === */
  /* プロトタイプ .h-page / .h-section / .h-card / .body / .small / .eyebrow（L270-301） */
  [data-text="display"] {
    font-size: var(--ubm-text-3xl);
    line-height: 1.15;
    font-weight: 600;
    color: var(--ubm-color-text-primary);
    margin: 0;
  }
  [data-text="title"] {
    font-size: var(--ubm-text-2xl);
    line-height: 1.2;
    font-weight: 600;
    color: var(--ubm-color-text-primary);
    margin: 0;
  }
  [data-text="section"] {
    font-size: var(--ubm-text-xl);
    line-height: 1.3;
    font-weight: 600;
    color: var(--ubm-color-text-primary);
    margin: 0;
  }
  [data-text="card"] {
    font-size: var(--ubm-text-lg);
    line-height: 1.35;
    font-weight: 600;
    color: var(--ubm-color-text-primary);
    margin: 0;
  }
  [data-text="body"] {
    font-size: var(--ubm-text-base);
    line-height: 1.7;
    font-weight: 400;
    color: var(--ubm-color-text-secondary);
  }
  [data-text="caption"] {
    font-size: var(--ubm-text-sm);
    line-height: 1.5;
    font-weight: 400;
    color: var(--ubm-color-text-secondary);
  }
  [data-text="eyebrow"] {
    font-size: var(--ubm-text-xs);
    line-height: 1.4;
    font-weight: 500;
    text-transform: uppercase;
    color: var(--ubm-color-text-muted);
  }
```

## 4. 行範囲想定（実装後）

挿入後の globals.css 想定:

| 範囲 | 内容 |
|------|------|
| L1-198 | 既存維持 |
| L199-209 | P1-1 page surface |
| L211-227 | P1-2 section rhythm |
| L229-265 | P1-3 card chrome |
| L267-298 | P1-4 shell surface |
| L300-356 | P1-5 typography scale |
| L358-372 | 既存 G9-7 focus-visible / reduced-motion（移動なし、行番号のみ後ろへ） |

最終ファイルサイズは約 372 行（現状 215 行 + 約 157 行）。

## 5. 衝突回避ガイド

- [x] **既存 `@layer base` の `body` 規則（L77-87）と衝突しない**: 本 SW は `[data-route]` を対象とし `body` は触らない
- [x] **既存 parallel-09 規則と衝突しない**: parallel-09 は `.ui-*` class セレクタ、本 SW は `[data-*]` 属性セレクタで名前空間が分離
- [x] **focus-visible 既存規則と衝突しない**: 本 SW より後ろ（L358 以降）に配置し続ける

## 6. 編集禁止箇所

- [x] L1-9 `@import` / `@source`
- [x] L11-68 `@theme inline`
- [x] L70-114 `@layer base`
- [x] L117-198 既存 parallel-09 規則
- [x] L200-214 既存 focus-visible / reduced-motion 規則（行番号は後ろへ移動するが内容は保持）
- [x] `apps/web/src/styles/tokens.css`（全体）

## 7. 動作確認 hint（Phase 10 で具体化）

実装後は `grep-selectors.txt` と build smoke で selector 契約を確認する。
`layout.tsx` の差分は admin sidebar 幅の 1 行に限定し、視覚確認は
serial-07 の Playwright evidence が担当する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `5` |
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
