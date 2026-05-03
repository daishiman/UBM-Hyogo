# docs/30-workflows/_design/

ワークフロー横断の **governance / contract / owner** を集約するディレクトリ。
特定 wave 内部の設計は各 wave 配下の `_design/` に置く（例: `02-application-implementation/_design/`）。

## 現在の登録物

- [sync-shared-modules-owner.md](./sync-shared-modules-owner.md) — sync 共通モジュールの owner 表。`apps/api/src/jobs/_shared/*` は実体化済み skeleton であり、既存本体ロジックは `apps/api/src/repository/syncJobs.ts` と `apps/api/src/jobs/sync-forms-responses.ts` に残る。

## 関連する未割当タスク

- `sync_jobs` `job_type` enum / `metrics_json` schema 集約タスクは本ディレクトリの owner 表を foundation として起票予定
- `apps/api/src/jobs/_shared/ledger.ts` / `sync-error.ts` の実体作成と既存実装からの移管は、別 implementation task で扱う
