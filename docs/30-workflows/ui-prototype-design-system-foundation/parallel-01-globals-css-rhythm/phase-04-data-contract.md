---
phase: 4
title: 入出力契約 — HTML attribute と CSS 変数の対応表
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 4: 入出力・データ契約

[実装区分: 実装仕様書]

## 1. 契約形式

本 SW の主契約は CSS selector であり、データ契約は **「HTML attribute（入力） → CSS 変数経由のスタイル（出力）」** の対応表として規定する。加えて、既存 admin shell の grid column 幅を `272px` に揃える layout 実装契約を 1 件だけ含む。

## 2. attribute 契約

### 2.1 `data-route`

| 値 | 用途 | 適用要素 | 適用 layout |
|----|------|---------|------------|
| `public` | 公開系 route | `<main>` または route group root | `app/(public)/layout.tsx` |
| `member` | 会員系 route | 同上 | `app/(member)/layout.tsx` |
| `admin` | 管理系 route | 同上 | `app/(admin)/layout.tsx` |

任意属性。未指定でも `body` 既定が cascade される。

### 2.2 `data-section` / `data-section-rhythm`

| `data-section-rhythm` | 縦余白 (`padding-block`) | 用途 |
|---------------------|--------------------------|------|
| 未指定（既定） | `var(--ubm-space-8)` (32px) | 通常 section |
| `compact` | `var(--ubm-space-4)` (16px) | 高密度（管理画面 table 周辺） |
| `comfortable` | `var(--ubm-space-8)` (32px) | 通常 |
| `loose` | `var(--ubm-space-12)` (48px) | Hero / Feature 強調 |

`data-section` 単独でも既定値が適用される。

### 2.3 `data-card` / `data-card-tone`

| `data-card-tone` | background | border | shadow | radius |
|-----------------|-----------|--------|--------|--------|
| 未指定（既定 = `panel`） | `--ubm-color-surface-panel` | `--ubm-color-border-default` | `--ubm-shadow-xs` | `--ubm-radius-lg` |
| `panel` | 同上 | 同上 | 同上 | 同上 |
| `surface` | `--ubm-color-surface-bg-2` | `--ubm-color-border-default` | none | `--ubm-radius-md` |
| `emphasis` | `--ubm-color-surface-panel-2` | `--ubm-color-border-strong` | `--ubm-shadow-md` | `--ubm-radius-lg` |
| `flat` | `--ubm-color-surface-bg` | `--ubm-color-border-default` | none | `--ubm-radius-md` |

### 2.4 `data-shell`

| 値 | 主要スタイル | 由来（プロトタイプ） |
|----|------------|--------------------|
| `topbar` | position: sticky / top: 0 / z-index: 10 / bg: panel / border-bottom / backdrop-filter: blur(12px) / padding: `--ubm-space-3 --ubm-space-8` | styles.css L238-249 |
| `sidebar` | position: sticky / top: 0 / height: 100vh / bg: panel / border-right / padding: `--ubm-space-6 --ubm-space-4` | styles.css L120-130 |
| `footer` | bg: surface-bg-2 / border-top / padding: `--ubm-space-8` | styles.css L216-223 派生 |

### 2.5 `data-text`

| 値 | font-size | font-weight | line-height | letter-spacing | color |
|----|----------|------------|-------------|----------------|-------|
| `display` | `--ubm-text-3xl` (32px) | 600 | 1.15 | 0 | `--ubm-color-text-primary` |
| `title` | `--ubm-text-2xl` (24px) | 600 | 1.2 | 0 | `--ubm-color-text-primary` |
| `section` | `--ubm-text-xl` (20px) | 600 | 1.3 | 0 | `--ubm-color-text-primary` |
| `card` | `--ubm-text-lg` (16px) | 600 | 1.35 | 0 | `--ubm-color-text-primary` |
| `body` | `--ubm-text-base` (13.5px) | 400 | 1.7 | 0 | `--ubm-color-text-secondary` |
| `caption` | `--ubm-text-sm` (12.5px) | 400 | 1.5 | 0 | `--ubm-color-text-secondary` |
| `eyebrow` | `--ubm-text-xs` (11px) | 500 | 1.4 | 0 | `--ubm-color-text-muted` |

### 2.6 admin shell grid width

| 対象 | 契約 | 理由 |
| --- | --- | --- |
| `apps/web/app/(admin)/layout.tsx` | `md:grid-cols-[272px_1fr]` | `[data-shell="sidebar"]` の prototype sidebar rhythm と管理画面の実幅を揃える |

## 3. CSS 変数依存表（出力）

本 SW 内で参照する `--ubm-*` トークンの最終一覧:

```
--ubm-color-surface-bg
--ubm-color-surface-bg-2
--ubm-color-surface-panel
--ubm-color-surface-panel-2
--ubm-color-text-primary
--ubm-color-text-secondary
--ubm-color-text-muted
--ubm-color-border-default
--ubm-color-border-strong
--ubm-radius-md
--ubm-radius-lg
--ubm-shadow-xs
--ubm-shadow-md
--ubm-space-3
--ubm-space-4
--ubm-space-6
--ubm-space-8
--ubm-space-12
--ubm-text-xs
--ubm-text-sm
--ubm-text-base
--ubm-text-lg
--ubm-text-xl
--ubm-text-2xl
--ubm-text-3xl
```

すべて `apps/web/src/styles/tokens.css` で定義済。新規トークン追加は本 SW では行わない。

## 4. cascade 互換性

| 後段で上書きされる可能性 | 緩和策 |
|-----------------------|--------|
| Tailwind utility（`bg-surface` 等）が同 specificity で適用 | cascade 順で後勝ちにより自然に調整。`!important` 不要 |
| parallel-02 の動的規則（`:hover`, `[aria-selected]`） | 本 SW 側は base state のみ、動的状態は parallel-02 が同 selector に追加 |
| parallel-03 の AppShell layout が `data-shell` 属性を付与 | layout 側が attribute を付ければ自動適用 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `4` |
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
