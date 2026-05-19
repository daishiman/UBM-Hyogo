---
phase: 3
title: タスク分解 — 実装単位と依存関係
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 3: タスク分解

[実装区分: 実装仕様書]

## 1. タスク一覧

| ID | タスク | 種別 | 対象ファイル | 推定行数 | 依存 |
|----|--------|------|--------------|----------|------|
| T-01 | `bg-surface-2` utility 定義確認 / 不足時に最小追加 | grep + (条件付き edit) | `apps/web/src/styles/globals.css` | 0-10 | なし |
| T-02 | `loading.tsx` 新規作成 | create | `apps/web/app/login/loading.tsx` | ~25 | T-01 |
| T-03 | `error.tsx` 改修（focus / aria-live / digest） | modify | `apps/web/app/login/error.tsx` | ~30 | なし |
| T-04 | `loading.spec.tsx` 新規作成 | create | `apps/web/app/login/loading.spec.tsx` | ~20 | T-02 |
| T-05 | `error.spec.tsx` 新規 or 修正 | create/modify | `apps/web/app/login/error.spec.tsx` | ~40 | T-03 |
| T-06 | （任意）jest-axe 1 件追加 | modify | T-04 / T-05 | ~5 | T-04, T-05 |
| T-07 | 検証コマンド一括実行（typecheck / lint / test / build） | verify | — | 0 | T-02..T-05 |

## 2. 並列性

- T-02 と T-03 はファイル独立で**並列可**
- T-04 は T-02 の export 完成後（型確認のため）に着手すると安全
- T-05 は T-03 の props interface 確定後に着手

## 3. 推奨実行順

1. T-01（globals.css 確認）— 後続の token utility 利用前提
2. T-02 / T-03 を**並列**で実装
3. T-04 / T-05 を**並列**で実装
4. T-06（任意）
5. T-07（検証）

## 4. 依存外部要素

| 種別 | 名称 | 状態 |
|------|------|------|
| package | `react` | 既存 |
| package | `@testing-library/react` | 既存（要事前確認） |
| package | `vitest` | 既存 |
| package | `@testing-library/user-event` | 既存（要事前確認） |
| package | `jest-axe` | 任意・既存ならば採用 |
| token | `--ubm-color-surface-bg-2` + `--color-surface-2` bridge | `tokens.css` / `globals.css` に既存（確認済み） |

確認コマンド:

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" list --depth 0 | grep -E "testing-library|vitest|jest-axe"
grep -n "ubm-color-surface-2" apps/web/src/styles/tokens.css
```

## 5. 完了判定

各タスクの DoD は phase-08-dod.md に集約する。Phase 5 着手前に Phase 4（型契約）を確認すること。

## 6. リスク（詳細は Phase 9）

| ID | リスク | 対応タスク |
|----|--------|-----------|
| R-01 | `bg-surface-2` 未定義 | T-01 で最小追加 |
| R-02 | `Card` primitive 不存在 | section 代替で best-effort |
| R-03 | `focus({ preventScroll })` ブラウザ互換 | TypeScript 型は OK、fallback 不要 |


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 3 |
| status | completed |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

/login loading boundary と error focus management を、実装・証跡・仕様の状態語彙が矛盾しない形で完了させる。

## 実行タスク

- 対象 phase の本文に従い、/login の loading / error / test / evidence contract を確認する。
- 実装済み差分と workflow state の整合を維持する。
- Phase 13 の commit / push / PR / runtime screenshot は user approval まで実行しない。

## 参照資料

- docs/30-workflows/parallel-i05-login-loading-and-error-focus/index.md
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/artifacts.json
- docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md

## 成果物

- apps/web/app/login/loading.tsx
- apps/web/app/login/error.tsx
- apps/web/app/login/loading.spec.tsx
- apps/web/app/login/error.spec.tsx
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-11/
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-12/

## 完了条件

- Focused Vitest が exit 0。
- Phase 12 compliance check が exit 0。
- 矛盾なし・漏れなし・整合性あり・依存関係整合の 4 条件が completed。

## 統合テスト連携

Focused Vitest: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/login/error.spec.tsx apps/web/app/login/loading.spec.tsx`。Runtime screenshot は user-gated evidence として Phase 13 境界に残す。
