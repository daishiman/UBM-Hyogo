# Phase 5: 実装

## メタ情報
正本: `outputs/phase-5/phase-5.md`

## 目的
実装手順インデックスとタスク本体（T01-T04）を固定する。

## 実行タスク
1. 正本ファイル `outputs/phase-5/phase-5.md` を参照する。

## 統合テスト連携
正本ファイルの統合テスト連携を参照する。

## 参照資料
- `_shared-context.md`（SSOT）
- `outputs/phase-5/phase-5.md`

## 成果物
- `outputs/phase-5/phase-5.md`
- `outputs/phase-5/task-01-me-profile-pending-requests-fail-soft.md`
- `outputs/phase-5/task-02-primary-d1-exception-classification.md`
- `outputs/phase-5/task-03-me-5xx-contract-tests.md`
- `outputs/phase-5/task-04-issue-1190-modernization-draft.md`

## 完了条件
- [x] 正本が存在する。

## 次 Phase への引き継ぎ
- 実装順は T02 → T01（同一ファイル `routes/me/index.ts` を触るため直列）→ T03 → T04。T04（docs）は独立並列可。
- Phase 6 は TC-1〜TC-4 に対する回帰 guard・境界ケースを拡充する。
