# Phase 1 成果物: 要件定義

本ファイルは `phase-1.md`（仕様）の実行結果サマリ。

## 確定した要件

- **目的**: Free プランの 3MiB 制約を破らずに member 個別の動的 OG 画像を復活させる。
- **アーキテクチャ**: OG 専用 Worker 分離（ユーザー決定済み）。Paid plan は不採用。
- **#1027 判定**: 未解決。緊急回避（静的 OG / size gate / 回帰ガード）は `web-worker-size-limit-fix` で完了済みだが、動的 member OG の再導入は本タスクで実装仕様化する。

## 受け入れ条件

AC-1〜AC-9（`phase-1.md` 参照）を確定。size gate（web/og 双方）、OG 200 image/png、フォールバック、metadata 統合、env アクセサ経由、CI 自動化を網羅。

## P50 / タスク分類

- implementation_mode: `new`。
- task_type: `VISUAL`（OG 画像は視覚成果物 / Phase 11 = VISUAL_ON_EXECUTION）。
- 前提タスク `web-worker-size-limit-fix` 完了済み → 本タスクは「追加」。

## 命名規則

`@ubm-hyogo/og` / `ubm-hyogo-og(-staging|-production)` / `OG_IMAGE_BASE_URL` / `*.spec.ts`。
