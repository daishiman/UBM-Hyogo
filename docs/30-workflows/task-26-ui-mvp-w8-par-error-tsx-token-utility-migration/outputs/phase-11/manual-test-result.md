# Phase 11 — 手動テスト

## 証跡メタ情報（FB-4）

- **証跡の主ソース**: 自動テスト（grep gate / typecheck / lint / build / task-18 visual baseline）
- **スクリーンショットを作らない理由**: 本 task は className リテラルの置換のみで render 結果に視覚差を発生させない（design-token bridge を介した同一の OKLch 値に解決される）。task-18 の playwright-smoke / visual baseline で diff 0 を確認することを VISUAL evidence の代替とする
- **タスク分類**: UI task / VISUAL-equivalent（既存 baseline 比較で代替）

## 実施項目

| # | 検証 | 手段 | 期待 |
|---|------|------|------|
| MT-01 | error.tsx render の見た目が変わらない | task-18 playwright-smoke `/error` route screenshot baseline 比較 | diff 0 |
| MT-02 | theme switch（warm / cool）で色が正しく追従 | data-theme 切替 + 再 render | bridge 経由なので追従する |
| MT-03 | error message readability | a11y contrast (text on bg) | task-09 baseline と同等 |
| MT-04 | grep gate（手動） | `grep -nE 'text-\[var\(' apps/web/src/app/error.tsx` | 0 件 |
| MT-05 | typecheck / lint / build | `pnpm --filter @ubm-hyogo/web {typecheck,lint,build}` | PASS |

## 実施記録テンプレ

実施日: ____
実施者: ____
ブランチ: ____
コミット: ____

| # | 結果 | メモ |
|---|------|------|
| MT-01 | PASS / FAIL | |
| MT-02 | PASS / FAIL | |
| MT-03 | PASS / FAIL | |
| MT-04 | PASS / FAIL | |
| MT-05 | PASS / FAIL | |

## NON_VISUAL 宣言（WEEKGRD-03 準拠）

本 task は className リテラルのみの変更で視覚差を生まないため、新規 screenshot は不要。代替証跡:

1. task-18 visual baseline（既存）の diff 0 件確認
2. `phase-9/qa-result.md` の grep gate / build PASS
3. `phase-10/final-review.md` の受入条件マッチ

`screenshots/.gitkeep` は不要のため作成しない。
