// Issue #402: retention policy SSOT。
// deleted_members.deleted_at から RETENTION_DAYS 経過した row を物理削除対象とする。
// 削除順序は子 → 親（D1 は外部キー cascade 非対応）。

export const RETENTION_POLICY_VERSION = "v1-2026-05";
export const RETENTION_DAYS = 180;

// 仕様書 (issue-402 phase-5) の対象テーブル。member 単位で物理削除する。
// 配列順は意味を持たない（実 DELETE 順は retention-purge.ts 側で固定）。
export const PURGE_TARGET_TABLES = [
  "member_responses",
  "member_identities",
  "member_status",
] as const;

export type PurgeTargetTable = (typeof PURGE_TARGET_TABLES)[number];

export interface RetentionPolicy {
  readonly version: string;
  readonly retentionDays: number;
  readonly targetTables: ReadonlyArray<PurgeTargetTable>;
}

export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  version: RETENTION_POLICY_VERSION,
  retentionDays: RETENTION_DAYS,
  targetTables: PURGE_TARGET_TABLES,
};

// retention 期限到来判定用の SQL fragment。purge job / dry-run / count 用に共有。
export const PURGE_DUE_WHERE_CLAUSE =
  "datetime(deleted_at, '+' || ?1 || ' days') <= datetime(?2) AND purged_at IS NULL";
