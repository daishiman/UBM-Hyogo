# Phase 2: retention policy 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | spec_created |

## 目的

Phase 1 で確定した方針（180 日 / 既存 D1 table への最小追加 / audit minimum 6 列）を実装可能な policy 定義 / schema 拡張 / Cron スケジュールに落とし込む。

## table 別 retention policy 表（policy version v1-2026-05）

| table | mode | retentionDays | cutoffColumn | 対象 | 保持する情報 | 削除順序 |
| --- | --- | --- | --- | --- | --- | --- |
| `member_responses` | physical_delete | 180 | `deleted_members.deleted_at` (JOIN) | 対象 member の履歴回答行 | なし | 1（最初） |
| `member_identities` | physical_delete | 180 | 同上 | 対象 member の identity 行 | なし | 2 |
| `member_status` | physical_delete | 180 | 同上 | 対象 member の status 行 | なし | 3 |
| `deleted_members` | tombstone_update | 180 | `deleted_at` | 既存 tombstone 行 | `member_id`, `deleted_by`, `deleted_at`, `reason`, `purged_at`, `retention_policy_version` | 4（最後） |

> 削除順序根拠: 現行 D1 schema は `member_responses` / `member_identities` / `member_status` / `deleted_members` が正本であり、`form_responses` / `member_consents` / `member_sessions` は存在しない。D1 は cross-table cascade 不在のため、本文・identity・status を削除してから tombstone に purge 完了時刻だけを記録する。

## 物理削除 vs 匿名化 判断ツリー

```
現行 table か？
├─ `member_responses` / `member_identities` / `member_status`
│  └─ retention 経過後に member_id 一致行を DELETE
└─ `deleted_members`
   └─ 行は accountability の tombstone として残し、`purged_at` / `retention_policy_version` のみ UPDATE
```

## `deleted_members` schema 拡張案（現行 D1 SQL）

```sql
CREATE TABLE IF NOT EXISTS deleted_members (
  member_id TEXT PRIMARY KEY,
  deleted_by TEXT NOT NULL,
  deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT NOT NULL DEFAULT '',
  purged_at TEXT,
  retention_policy_version TEXT
);
```

## migration（D1 SQL 草案）

```sql
-- apps/api/migrations/NNNN_retention_metadata.sql
ALTER TABLE deleted_members ADD COLUMN purged_at TEXT;
ALTER TABLE deleted_members ADD COLUMN retention_policy_version TEXT;
CREATE INDEX IF NOT EXISTS idx_deleted_members_purge_due
  ON deleted_members (deleted_at, purged_at);
```

## Cron スケジュール案

| 候補 | cron 式 (UTC) | 実時刻 (JST) | 採用判定 |
| --- | --- | --- | --- |
| 毎日 03:00 JST | `0 18 * * *` | 03:00 | **採用** — 利用者影響最小、Workers Cron 無料枠内 |
| 毎週日曜 03:00 JST | `0 18 * * 0` | 日曜 03:00 | DEFERRED — purge 遅延が最大 7 日になる |
| 毎時 | `0 * * * *` | 毎時 | NOT RECOMMENDED — 監査ログが氾濫 |

`apps/api/wrangler.toml` 追記:

```toml
[triggers]
crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]
```

既存 production/staging cron は 3 本上限で運用中。retention purge は既存 daily `0 18 * * *` scheduled handler に分岐追加し、cron 本数を増やさない。

## 関数シグネチャ（Phase 3 で実装詳細）

```ts
// apps/api/src/services/retention-policy.ts
export const RETENTION_POLICY_V1: RetentionPolicy = {
  version: 'v1-2026-05',
  defaultRetentionDays: 180,
  tables: [
    { table: 'member_responses',  retentionDays: 180, mode: 'physical_delete', pkColumn: 'member_id', cutoffColumn: 'deleted_members.deleted_at' },
    { table: 'member_identities', retentionDays: 180, mode: 'physical_delete', pkColumn: 'member_id', cutoffColumn: 'deleted_members.deleted_at' },
    { table: 'member_status',     retentionDays: 180, mode: 'physical_delete', pkColumn: 'member_id', cutoffColumn: 'deleted_members.deleted_at' },
    { table: 'deleted_members',   retentionDays: 180, mode: 'tombstone_update', pkColumn: 'member_id', cutoffColumn: 'deleted_at' },
  ],
};

export async function applyRetentionPolicy(
  db: D1Database,
  policy: RetentionPolicy,
  dryRun: boolean,
  now: Date
): Promise<TableDeletionSummary[]> { /* ... */ }
```

## 成果物

- `outputs/phase-2/phase-2.md`
- `outputs/phase-2/policy-table.md`（table 別表のスナップショット）
- `outputs/phase-2/schema-diff.sql`（migration 草案）
