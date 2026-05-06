# Phase 5: 実装

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-5/phase-5.md` |
| 実装区分 | 実装仕様書 |

## 目的
delete request 承認後の物理削除と retention policy を実装する。現行 D1 migration 拡張・retention policy 定義・retention purge ジョブ・Cron Trigger・runbook・ユニットテストまでを含む。

## 実行タスク
詳細は `outputs/phase-5/phase-5.md` を正本とする。

## 統合テスト連携
Phase 8 で miniflare D1 を使った seed → cron tick → dry-run → apply → 復元 round-trip を検証する。

## 参照資料
- `outputs/phase-5/phase-5.md`
- 親タスク: `docs/30-workflows/completed-tasks/task-04b-admin-request-retention-physical-delete-001.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`

## 成果物
- `outputs/phase-5/phase-5.md`
- `apps/api/migrations/deleted-members.ts` (拡張)
- `apps/api/migrations/0NNN_add_deleted_members_retention.sql` (新規 migration)
- `apps/api/src/services/retention-policy.ts` (新規)
- `apps/api/src/jobs/retention-purge.ts` (新規)
- `apps/api/wrangler.toml` (Cron Trigger 追記)
- `apps/api/src/index.ts` (scheduled ハンドラ追記)
- `docs/runbooks/retention-physical-delete.md` (新規)
- `apps/api/src/jobs/retention-purge.test.ts` (新規)

## 完了条件
- Phase 5 正本ファイルが存在する。
- 上記成果物が PR の diff に全て含まれる。
- `pnpm --filter @ubm-hyogo/api typecheck` が PASS する。
