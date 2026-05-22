---
phase: 6
title: テスト方針 — grep gate と visual regression
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: runtime_pending
---

# Phase 6: テスト方針

[実装区分: 実装仕様書]

## 1. テスト戦略

CSS selector と admin shell width の小変更だけを扱う SW のため、テストは次の 3 層で構成する:

| 層 | 種別 | 責務 | 実行コマンド |
|----|------|------|------------|
| L1 静的 grep | 自動 | HEX 直書き / `bg-[#` / `text-[#` の 0 件確認 | grep |
| L2 build smoke | 自動 | `next build --webpack` が exit 0 | `pnpm build` |
| L3 visual regression | 手動 + Playwright（serial-07） | レイアウト崩れ・色ドリフトの目視・snapshot 比較 | `pnpm exec playwright test` |

本 SW では L1 と L2 を必須、L3 は serial-07 で実施する想定で **本 SW では新規 spec ファイルを追加しない**。

## 2. L1: grep gate

### 2.1 検査対象

- [x] `apps/web/src/styles/globals.css`（本 SW 編集対象）
- [x] `apps/web/app/(admin)/layout.tsx`（admin width 1 行の差分確認）

### 2.2 検査コマンド

```bash
# HEX 直書き（既存 tokens.css は除外）
grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/globals.css

# bg-[# / text-[# 直書き
grep -nE '\b(bg|text)-\[#' apps/web/src/styles/globals.css

# px / rem の絶対値（typography letter-spacing 等を除く参考確認）
grep -nE ':\s*[0-9]+(px|rem)' apps/web/src/styles/globals.css
```

期待結果:

| 検査 | 期待 |
|------|------|
| HEX 直書き | 0 件（既存 L211 `var(--ubm-color-accent)` のみ。本 SW 追加分で HEX は 0） |
| `bg-[#` / `text-[#` | 0 件 |
| px / rem 絶対値 | typography の letter-spacing (`em`) / line-height（無単位）以外で本 SW 追加分は **0 件** |

### 2.3 CI 連携

`verify-design-tokens`（既存 CI gate）が `apps/web/src/styles/globals.css` を含めて検査する。本 SW 完了時に green であることを Phase 11 evidence に記録する。

## 3. L2: build smoke

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web build
```

期待: 全て exit 0。CSS シンタックスエラー / 未定義 `--ubm-*` 参照は build 失敗で検出される。

## 4. L3: visual regression（参考・serial-07 で実施）

本 SW 完了の確認は serial-07 で Playwright snapshot により担保される。snapshot 取得対象画面（serial-07 で実施）:

- [x] `/`（top）
- [x] `/(public)/members`
- [x] `/(public)/members/[id]`
- [x] `/(admin)/admin`

本 SW で確認するべきポイント（snapshot diff の観点）:

| 観点 | 期待 |
|------|------|
| body 背景色 | `--ubm-color-surface-bg`（stone bg）が適用 |
| card 陰影 | `--ubm-shadow-xs` 相当の subtle elevation |
| topbar sticky | scroll 時に topbar が画面上端に固定 |
| typography 階層 | display > title > section > card > body の視覚的階層が成立 |

## 5. 既存テストへの影響

| 既存テスト | 影響 | 対応 |
|-----------|------|------|
| `apps/web/src/__tests__/**/*.spec.{ts,tsx}` | 無影響（CSS は unit test 対象外） | なし |
| `apps/web/playwright/**/*.spec.ts` | snapshot が更新される可能性 | serial-07 で snapshot baseline 更新 |
| `verify-design-tokens` CI | 本 SW 追加 CSS を新規検査対象として通過必要 | 本 SW で対応（grep 0 件） |

## 6. テスト suffix 規約

新規テストファイルは追加しない。仮に追加する場合は `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止、CLAUDE.md 不変条件 8）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `ui-prototype-design-system-foundation` |
| sub_workflow | `parallel-01-globals-css-rhythm` |
| phase | `6` |
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
