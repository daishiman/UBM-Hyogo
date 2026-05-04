# docs/30-workflows/_design/

ワークフロー横断の **governance / contract / owner** を集約するディレクトリ。
特定 wave 内部の設計は各 wave 配下の `_design/` に置く（例: `02-application-implementation/_design/`）。

## 現在の登録物

- [sync-shared-modules-owner.md](./sync-shared-modules-owner.md) — sync 共通モジュールの owner 表。`apps/api/src/jobs/_shared/*` は実体化済み skeleton / runtime contract 正本であり、既存本体ロジックは `apps/api/src/repository/syncJobs.ts` と `apps/api/src/jobs/sync-forms-responses.ts` に残る。
- [sync-jobs-spec.md](./sync-jobs-spec.md) — `sync_jobs.job_type` / `metrics_json` / lock TTL の論理正本。ADR-001 で runtime SSOT は `apps/api/src/jobs/_shared/sync-jobs-schema.ts` 維持、`packages/shared` 移管なしと決定済み。

## 関連する解消済みタスク

- `sync_jobs` `job_type` enum / `metrics_json` schema 集約タスクは `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/` で実装済み。起票元 `docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md` は resolved。
- `apps/api/src/jobs/_shared/ledger.ts` / `sync-error.ts` の実体作成と既存実装からの移管は、別 implementation task で扱う
