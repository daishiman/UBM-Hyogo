# Phase 5 正本: retention purge job 実装手順

## 目的

delete request 承認後に `deleted_members` に積まれた行を、既存 `deleted_at` から 180 日経過後に purge 対象化する。現行 D1 schema と package scripts に合わせ、現行 D1 migration 前提や存在しない table は使わない。

## Canonical Contract

| 項目 | 正本 |
| --- | --- |
| 対象 package | `@ubm-hyogo/api` |
| migration path | `apps/api/migrations/00XX_add_deleted_members_purge_metadata.sql` |
| retention 起点 | `deleted_members.deleted_at` |
| 対象条件 | `datetime(deleted_at, '+180 days') <= datetime('now') AND purged_at IS NULL` |
| 対象 table | `member_responses` / `member_identities` / `member_status` |
| tombstone | `deleted_members` は削除せず `purged_at` / `retention_policy_version` を更新 |
| cron | 既存 `0 18 * * *` daily branch を再利用。cron 本数追加なし |

## 5-A. Migration

```sql
-- apps/api/migrations/00XX_add_deleted_members_purge_metadata.sql
ALTER TABLE deleted_members ADD COLUMN purged_at TEXT;
ALTER TABLE deleted_members ADD COLUMN retention_policy_version TEXT;
CREATE INDEX IF NOT EXISTS idx_deleted_members_purge_due
  ON deleted_members (deleted_at, purged_at);
```

`purged_at` は nullable にし、既存行を即 purge 済みにしない。`DEFAULT 0` は既存行を誤対象化し得るため禁止する。

## 5-B. retention policy

新規ファイル: `apps/api/src/services/retention-policy.ts`

```ts
export const RETENTION_POLICY_VERSION = "v1-2026-05";
export const RETENTION_DAYS = 180;

export const PURGE_TARGET_TABLES = [
  "member_responses",
  "member_identities",
  "member_status",
] as const;
```

`deleted_members` は audit minimum (`member_id`, `deleted_by`, `deleted_at`, `reason`) を保持する tombstone として扱う。

## 5-C. purge job

新規ファイル: `apps/api/src/jobs/retention-purge.ts`

```ts
export type RetentionPurgeMode = "dry-run" | "apply";

export type RetentionPurgeReport = {
  mode: RetentionPurgeMode;
  scannedAt: string;
  policyVersion: string;
  targets: Array<{
    memberId: string;
    deletedAt: string;
    deletedAtPlus180DaysAt: string;
    childCounts: {
      memberResponses: number;
      memberIdentities: number;
      memberStatus: number;
    };
  }>;
  applied: Array<{ memberId: string; purgedAt: string }>;
  errors: Array<{ memberId: string; message: string }>;
};

export async function runRetentionPurge(
  env: ApiEnv,
  opts: { mode: RetentionPurgeMode; limit?: number; now?: Date },
): Promise<RetentionPurgeReport>;
```

処理は member 単位で原子的に扱う。`dry-run` は SELECT と count のみで副作用 0。`apply` は `member_responses` → `member_identities` → `member_status` の順で DELETE し、最後に `deleted_members.purged_at` と `retention_policy_version` を UPDATE する。

## 5-D. scheduled handler

`apps/api/wrangler.toml` の cron は既存 3 本上限を維持する。

```toml
[triggers]
crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]
```

`apps/api/src/index.ts` の scheduled handler で `event.cron === "0 18 * * *"` の daily branch から retention purge を呼ぶ。既存 schema sync daily job と共存する場合は同一 branch 内で順序を固定し、D1 write queue / retry 方針に従う。

## 5-E. runbook

新規ファイル: `docs/runbooks/retention-physical-delete.md`

- 事前確認: `SELECT COUNT(*) FROM deleted_members WHERE datetime(deleted_at, '+180 days') <= datetime('now') AND purged_at IS NULL`
- dry-run: `RETENTION_PURGE_MODE=dry-run` の状態で `bash scripts/cf.sh wrangler triggers cron --config apps/api/wrangler.toml --env staging`
- apply: user-gated で `RETENTION_PURGE_MODE=apply` / `RETENTION_PURGE_LIMIT=1` を一時設定し、同 cron trigger を実行
- rollback: 物理削除前は `deleted_members.deleted_at` の補正または restore operation で停止。物理削除後は D1 PITR bookmark から復旧。運用受付境界は 7 日。

## 5-F. テスト

テスト配置は現行構成に合わせ、`apps/api/src/jobs/retention-purge.test.ts` とする。

| # | ケース | 期待 |
| --- | --- | --- |
| 1 | dry-run | DB 行数不変、対象 count だけ返る |
| 2 | 180 日経過済み | apply で 3 table の対象 row が DELETE される |
| 3 | 180 日未経過 | dry-run / apply とも対象外 |
| 4 | tombstone | `deleted_members` 行は残り `purged_at` が入る |
| 5 | audit | `audit_log` 差分行に PII を含まない |
| 6 | error | member 単位で rollback し、`errors[]` に記録 |

## 動作確認チェックリスト

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- retention-purge` PASS
- [ ] `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "PRAGMA table_info(deleted_members);"` で `purged_at` / `retention_policy_version` を確認
- [ ] dry-run / apply CLI が `RetentionPurgeReport` を JSON で stdout に出力
