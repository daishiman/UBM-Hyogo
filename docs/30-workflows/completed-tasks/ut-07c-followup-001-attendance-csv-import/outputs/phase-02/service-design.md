# Phase 2 — service 設計

## 関数シグネチャ

```ts
// apps/api/src/use-cases/admin/import-attendance-bulk.ts

export interface AttendanceImportRow {
  memberId?: string;
  email?: string;
}

export type ImportRowStatus =
  | "ok"
  | "duplicate"
  | "deleted_member"
  | "unknown_member"
  | "invalid";

export interface ImportRowResult {
  index: number;
  status: ImportRowStatus;
  memberId?: string;
  message?: string;
}

export interface ImportSummary {
  total: number;
  ok: number;
  duplicate: number;
  deletedMember: number;
  unknownMember: number;
  invalid: number;
}

export interface ImportAttendanceBulkOptions {
  commit: boolean;
  actor: { id: AdminId; email: AdminEmail };
  auditLogProvider: AuditLogProvider;
}

export async function importAttendanceBulk(
  db: DbCtx,
  sessionId: string,
  rows: AttendanceImportRow[],
  options: ImportAttendanceBulkOptions,
): Promise<{ summary: ImportSummary; rows: ImportRowResult[]; committed: boolean }>;
```

## 内部処理ステップ

1. session 存在検証（`SELECT session_id FROM meeting_sessions WHERE session_id=? AND deleted_at IS NULL`）。未存在は `session_not_found` を throw（route が 404 化）
2. `listExistingAttendanceMemberIds(sessionId)` で既存 attendance member set 取得（1 query）
3. 全 member_identities + member_status を 1 query で取得し `email → {memberId, isDeleted}` / `memberId → {isDeleted}` map を作る
4. 行ごとに `classifyImportRow(row, lookupCtx, existingSet)` で判定
5. `commit=true` かつ全行 preflight が `ok` の場合のみ:
   - `member_attendance` への INSERT を `ATTENDANCE_BIND_CHUNK_SIZE = 80` 単位で分割
   - 成功行ごとに `auditLogProvider.append({ action: 'attendance.import.add', ... })` を 1 record
6. summary 集計を返す

## repository 追加

```ts
// apps/api/src/repository/attendance.ts に追加
export async function listExistingAttendanceMemberIds(
  c: DbCtx,
  sessionId: string,
): Promise<Set<MemberId>>;
```

## 判定 helper

```ts
export type LookupCtx = {
  byMemberId: Map<string, { memberId: MemberId; isDeleted: boolean }>;
  byEmail: Map<string, { memberId: MemberId; isDeleted: boolean }>;
};

export function classifyImportRow(
  row: AttendanceImportRow,
  ctx: LookupCtx,
  existing: Set<MemberId>,
): ImportRowResult;
```

判定境界:

| 条件 | 判定 |
| --- | --- |
| `memberId` / `email` どちらも空 | `invalid` |
| `memberId` lookup miss | `unknown_member` |
| `email` lookup miss (memberId なし) | `unknown_member` |
| `memberId` と `email` が別 member を指す | `invalid` + `memberId_email_mismatch` |
| `member_status.is_deleted = 1` | `deleted_member` |
| 既存 attendance あり | `duplicate` |
| 上記以外 | `ok` |

## email 正規化

```ts
// apps/api/src/lib/email.ts (Phase 8 で集約)
export function normalizeEmail(s: string): string {
  return s.normalize("NFKC").trim().toLowerCase();
}
```

## audit_log entry

```ts
{
  actorId: options.actor.id,
  actorEmail: options.actor.email,
  action: auditAction("attendance.import.add"),
  targetType: "meeting",
  targetId: sessionId,
  before: null,
  after: { memberId },
}
```

## 層分離

- Hono `Context` を service 層へ渡さない
- route で `ctx({ DB: c.env.DB })` / `requireProvider(c.var.auditLogProvider, "auditLogProvider")` / `authUser` を解決し、明示依存として渡す
- service 層は D1 / auditLogProvider 以外を直接知らない（テスト容易性）
