# sync 共通モジュール owner 表

本ファイルは sync 共通モジュールについて、正本実装責務を持つ task（owner）と consumer 兼同意権を持つ task（co-owner）を明文化する。03a / 03b 並列 wave で確立し、以後の sync 系並列開発でも本表を必ず通す。

owner = 主担当 / co-owner = サブ担当。

`apps/api/src/jobs/_shared/ledger.ts` と `apps/api/src/jobs/_shared/sync-error.ts` は本タスク（issue-195-03b-followup-002）で実体化済みの skeleton モジュールである。中身は当面 thin facade（re-export と最小型定義）であり、本体ロジックの物理移管は後続タスク（バックログ送り）で段階的に実施する。実体化したファイルの owner ガバナンスを本表で運用する。

`apps/api/src/jobs/_shared/sync-jobs-schema.ts` は 03b-followup-005 (Issue #198) で実体化済みの runtime contract 正本モジュールである。issue-195 / #435 で本表に owner / co-owner を登録し、markdown 論理正本 `docs/30-workflows/_design/sync-jobs-spec.md` と 1-hop で相互参照する。

## owner / co-owner 表

| ファイル | owner task | co-owner task | 変更時の必須レビュアー | 備考 |
| --- | --- | --- | --- | --- |
| `apps/api/src/jobs/_shared/ledger.ts` | 03a | 03b | 03a / 03b | sync_jobs ledger 正本（thin facade）。`apps/api/src/repository/syncJobs.ts` の `start` / `succeed` / `fail` / `findLatest` / `listRecent` / `IllegalStateTransition` / `SyncJobNotFound` / `SyncJobRow` / `SyncJobKind` / `SyncJobStatus` / `ALLOWED_TRANSITIONS` を re-export。物理移管は後続タスク。 |
| `apps/api/src/jobs/_shared/sync-error.ts` | 03a | 03b | 03a / 03b | sync 系 error code 正本。`SyncErrorCode` union と `classifySyncError` / `redactMetricsJson` を提供。`sync-forms-responses.ts` 内 `classifyError` の置換は後続タスク。 |
| `apps/api/src/jobs/_shared/index.ts` | 03a | 03b | 03a / 03b | barrel export。 |
| `apps/api/src/jobs/_shared/sync-jobs-schema.ts` | 03a | 03b | 03a / 03b | sync_jobs runtime contract 正本（`SYNC_JOB_TYPES` / `SYNC_LOCK_TTL_MS` / `metricsJsonBaseSchema` / `assertNoPii` / `parseMetricsJson` 他）。issue-195 / #435 で本表に登録。markdown 論理正本: `docs/30-workflows/_design/sync-jobs-spec.md`。 |

## 変更ルール

1. 上表のファイルを変更する PR は **owner task** の Phase 13 PR description に「co-owner への通知」セクションを必須で含める
2. PR の reviewer に owner / co-owner 双方を必ず指定する（solo 開発でも PR 本文に co-owner task ID を明示）
3. consumer task は変更提案を直接コミットせず、owner task で PR を起票して合意を取る
4. 新規 `_shared/` モジュールを追加する場合は **本表に行を追加する PR を先行** させる

## 後続 sync 系タスクの参加手順

1. 本表を参照し、利用予定モジュールの owner / co-owner を特定
2. consumer として参加する場合は co-owner 列に自タスク ID を追記する PR を起票
3. 新規モジュールが必要な場合は owner / co-owner 候補を起票時に決定し、本表に行を追加

## 解消済み未割当タスク

- `sync_jobs` `job_type` enum / `metrics_json` schema 集約タスクは `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/` で owner 表登録、runtime SSOT 配置 ADR、contract test 補強へ昇格済み。
