# Phase 12: ドキュメント更新

## 目的

implementation guide / spec sync / 未タスク / feedback を完了する。strict 7 outputs を生成する。

## strict 7 outputs

| # | ファイル | 状態 |
| - | -------- | ---- |
| 1 | `outputs/phase-12/main.md` | 作成済み |
| 2 | `outputs/phase-12/implementation-guide.md` | 作成済み（Part 1 / Part 2、9 canonical heading）|
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 作成済み |
| 4 | `outputs/phase-12/documentation-changelog.md` | 作成済み |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 作成済み（0 件でも出力）|
| 6 | `outputs/phase-12/skill-feedback-report.md` | 作成済み（改善点なしでも出力）|
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 作成済み（9 canonical heading）|

## Step 1-A〜1-C（implemented_local_runtime_pending close-out）

- Step 1-A: 完了タスク記録 — 本タスク root を 30-workflows ledger に implemented_local_runtime_pending で記録（同 wave）。
- Step 1-B: 実装状況テーブル — local implementation complete / real production runtime + regression evidence + branch protection PUT pending。
- Step 1-C: 関連タスクテーブル — 親 #864 の `unassigned-task-detection.md` UT-CANDIDATE-1（production 展開）を「本タスクで formalize」へ更新。

## Step 2: 新規インターフェース（追加あり → 記録必須）

- `resolveEnvPrefix(env: string): string`（`scripts/smoke/mint-staging-session-cookie.mts` 新規 export）
- `runtime-admin-web.sh` の `<staging|production>` 引数受理（既存 CLI surface の拡張）

system-spec-update-summary.md に記録。

## 完了判定

- [x] strict 7 を全て生成
- [x] Step 1-A〜1-C を implemented_local_runtime_pending で close-out
