# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | meeting-tag-queue-and-schema-diff-repository |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 4 |
| 下流 | Phase 6 |
| 状態 | completed |

## 目的

7 ファイルの実装手順 + コード placeholder + sanity check を runbook 化する。

## runbook

### Step 0: 前提
```bash
test -f apps/api/src/repository/_shared/db.ts || exit 1   # 02a 完了
test -f apps/api/src/repository/_shared/brand.ts || exit 1 # 02a 完了
test -f apps/api/db/migrations/0001_init.sql || exit 1   # 01a 完了
```

### Step 1: ディレクトリ
```bash
# repository/ は 02a と共有、新規ファイルだけ追加
ls apps/api/src/repository/  # 02a 配下を確認
mkdir -p apps/api/src/repository/__fixtures__
mkdir -p apps/api/src/repository/__tests__
```

### Step 2: meetings.ts
```ts
// apps/api/src/repository/meetings.ts （placeholder）
import type { DbCtx } from "./_shared/db.ts";

export interface MeetingSessionRow {
  sessionId: string;
  title: string;
  heldOn: string; // ISO date
  note: string | null;
  createdAt: string;
  createdBy: string;
}

export const findMeetingById = async (c: DbCtx, id: string): Promise<MeetingSessionRow | null> => {
  return await c.db.prepare("SELECT * FROM meeting_sessions WHERE session_id = ?1 LIMIT 1").bind(id).first<MeetingSessionRow>();
};

export const listMeetings = async (c: DbCtx, limit: number, offset: number): Promise<MeetingSessionRow[]> => {
  const r = await c.db.prepare("SELECT * FROM meeting_sessions ORDER BY held_on DESC LIMIT ?1 OFFSET ?2").bind(limit, offset).all<MeetingSessionRow>();
  return r.results;
};

export const listRecentMeetings = async (c: DbCtx, n: number): Promise<MeetingSessionRow[]> => {
  return (await listMeetings(c, n, 0));
};

export const insertMeeting = async (c: DbCtx, row: NewMeetingSessionRow): Promise<MeetingSessionRow> => {
  await c.db.prepare("INSERT INTO meeting_sessions (session_id, title, held_on, note, created_by) VALUES (?1, ?2, ?3, ?4, ?5)")
    .bind(row.sessionId, row.title, row.heldOn, row.note, row.createdBy).run();
  return (await findMeetingById(c, row.sessionId))!;
};
```

### Step 3: attendance.ts （重複防止 / 削除済み除外がコア）
```ts
// apps/api/src/repository/attendance.ts （placeholder）
import type { DbCtx } from "./_shared/db.ts";
import type { MemberId } from "./_shared/brand.ts";

export interface MemberAttendanceRow {
  memberId: MemberId;
  sessionId: string;
  assignedAt: string;
  assignedBy: string;
}

export const listAttendanceByMember = async (c: DbCtx, mid: MemberId): Promise<MemberAttendanceRow[]> => {
  const r = await c.db.prepare("SELECT * FROM member_attendance WHERE member_id = ?1 ORDER BY assigned_at DESC").bind(mid).all<MemberAttendanceRow>();
  return r.results;
};

export const listAttendanceBySession = async (c: DbCtx, sid: string): Promise<MemberAttendanceRow[]> => {
  const r = await c.db.prepare("SELECT * FROM member_attendance WHERE session_id = ?1").bind(sid).all<MemberAttendanceRow>();
  return r.results;
};

export type AddAttendanceResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" | "deleted_member" | "session_not_found" };

export const addAttendance = async (c: DbCtx, mid: MemberId, sid: string, by: string): Promise<AddAttendanceResult> => {
  // 1. session 存在確認
  const session = await c.db.prepare("SELECT 1 FROM meeting_sessions WHERE session_id = ?1").bind(sid).first();
  if (!session) return { ok: false, reason: "session_not_found" };
  // 2. 削除済み確認（不変条件 #15）
  const status = await c.db.prepare("SELECT is_deleted FROM member_status WHERE member_id = ?1").bind(mid).first<{ is_deleted: number }>();
  if (status && status.is_deleted === 1) return { ok: false, reason: "deleted_member" };
  // 3. INSERT、PK 制約で重複は throw → catch で reason 返却
  try {
    await c.db.prepare("INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES (?1, ?2, ?3)")
      .bind(mid, sid, by).run();
    return { ok: true };
  } catch (e) {
    if (String(e).includes("UNIQUE") || String(e).includes("PRIMARY KEY")) return { ok: false, reason: "duplicate" };
    throw e;
  }
};

export const removeAttendance = async (c: DbCtx, mid: MemberId, sid: string): Promise<void> => {
  await c.db.prepare("DELETE FROM member_attendance WHERE member_id = ?1 AND session_id = ?2").bind(mid, sid).run();
};

export const listAttendableMembers = async (c: DbCtx, sid: string): Promise<Array<{ memberId: MemberId; fullName: string; occupation: string }>> => {
  // 削除済み除外 + 既に attendance 済みも除外
  const r = await c.db.prepare(`
    SELECT mi.member_id as memberId, /* 名前 / 職業は current response から派生 */ ...
    FROM member_identities mi
    INNER JOIN member_status ms ON ms.member_id = mi.member_id
    WHERE ms.is_deleted = 0
      AND mi.member_id NOT IN (SELECT member_id FROM member_attendance WHERE session_id = ?1)
  `).bind(sid).all();
  return r.results as Array<{ memberId: MemberId; fullName: string; occupation: string }>;
};
```

### Step 4: tagDefinitions.ts （read-only、不変条件 #13）
```ts
// apps/api/src/repository/tagDefinitions.ts （placeholder、write API 不在）
export interface TagDefinitionRow {
  tagId: string;
  code: string;
  label: string;
  category: string;
  sourceStableKeysJson: string;
  active: boolean;
}

export const listAllTagDefinitions = async (c: DbCtx): Promise<TagDefinitionRow[]> => {
  const r = await c.db.prepare("SELECT * FROM tag_definitions WHERE active = 1 ORDER BY category, position").all<TagDefinitionRow>();
  return r.results;
};

export const listByCategory = async (c: DbCtx, category: string): Promise<TagDefinitionRow[]> => {
  const r = await c.db.prepare("SELECT * FROM tag_definitions WHERE category = ?1 AND active = 1 ORDER BY position").bind(category).all<TagDefinitionRow>();
  return r.results;
};

export const findByCode = async (c: DbCtx, code: string): Promise<TagDefinitionRow | null> => {
  return await c.db.prepare("SELECT * FROM tag_definitions WHERE code = ?1 LIMIT 1").bind(code).first<TagDefinitionRow>();
};
// 不変条件 #13: write API 不在。tag 辞書の追加・編集は 01a seed のみ
```

### Step 5: tagQueue.ts （状態遷移）
```ts
// apps/api/src/repository/tagQueue.ts （placeholder）
import type { MemberId, ResponseId } from "./_shared/brand.ts";

export type TagQueueStatus = "queued" | "reviewing" | "resolved";

const ALLOWED_TRANSITIONS: Record<TagQueueStatus, TagQueueStatus[]> = {
  queued:    ["reviewing"],
  reviewing: ["resolved"],
  resolved:  [],
};

export class IllegalStateTransition extends Error {
  constructor(from: TagQueueStatus, to: TagQueueStatus) {
    super(`tagQueue: cannot transition ${from} -> ${to}`);
  }
}

export interface TagAssignmentQueueRow {
  queueId: string;
  memberId: MemberId;
  responseId: ResponseId;
  status: TagQueueStatus;
  suggestedTagsJson: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export const enqueue = async (c: DbCtx, row: NewTagAssignmentQueueRow): Promise<TagAssignmentQueueRow> => {
  await c.db.prepare("INSERT OR REPLACE INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json, reason) VALUES (?1, ?2, ?3, 'queued', ?4, ?5)")
    .bind(row.queueId, row.memberId, row.responseId, row.suggestedTagsJson, row.reason).run();
  return (await findQueueById(c, row.queueId))!;
};

export const transitionStatus = async (c: DbCtx, qid: string, next: TagQueueStatus): Promise<TagAssignmentQueueRow> => {
  const current = await findQueueById(c, qid);
  if (!current) throw new Error("queue not found");
  const allowed = ALLOWED_TRANSITIONS[current.status];
  if (!allowed.includes(next)) throw new IllegalStateTransition(current.status, next);
  await c.db.prepare("UPDATE tag_assignment_queue SET status = ?1, updated_at = datetime('now') WHERE queue_id = ?2")
    .bind(next, qid).run();
  return (await findQueueById(c, qid))!;
};
```

### Step 6: schemaVersions.ts / schemaQuestions.ts / schemaDiffQueue.ts

```ts
// schemaVersions.ts （placeholder）
export const getLatestVersion = async (c: DbCtx, formId: string): Promise<FormManifestRow | null> => {
  return await c.db.prepare("SELECT * FROM schema_versions WHERE form_id = ?1 AND state = 'active' LIMIT 1").bind(formId).first<FormManifestRow>();
};

export const upsertManifest = async (c: DbCtx, row: NewFormManifestRow): Promise<FormManifestRow> => {
  // 既存 active を superseded に → 新規を active で INSERT （atomicity は 03a sync の責務）
};

export const supersede = async (c: DbCtx, formId: string, oldRevisionId: string): Promise<void> => {
  await c.db.prepare("UPDATE schema_versions SET state = 'superseded' WHERE form_id = ?1 AND revision_id = ?2").bind(formId, oldRevisionId).run();
};
```

```ts
// schemaQuestions.ts （placeholder）
export const updateStableKey = async (c: DbCtx, questionId: string, newSk: StableKey): Promise<void> => {
  // 07b alias workflow から呼ばれる。questionId 単位で stableKey を更新
  await c.db.prepare("UPDATE schema_questions SET stable_key = ?1 WHERE question_id = ?2").bind(newSk, questionId).run();
};
```

```ts
// schemaDiffQueue.ts （placeholder）
export const list = async (c: DbCtx, type?: DiffType): Promise<SchemaDiffQueueRow[]> => {
  const sql = type
    ? "SELECT * FROM schema_diff_queue WHERE type = ?1 AND resolved_at IS NULL ORDER BY created_at ASC"
    : "SELECT * FROM schema_diff_queue WHERE resolved_at IS NULL ORDER BY created_at ASC";
  const r = type
    ? await c.db.prepare(sql).bind(type).all<SchemaDiffQueueRow>()
    : await c.db.prepare(sql).all<SchemaDiffQueueRow>();
  return r.results;
};

export const resolve = async (c: DbCtx, did: string, by: string): Promise<void> => {
  await c.db.prepare("UPDATE schema_diff_queue SET resolved_at = datetime('now') WHERE diff_id = ?1").bind(did).run();
};
```

### Step 7: fixture / test 配置
```bash
touch apps/api/src/repository/__fixtures__/{meetings,attendance,tagQueue,schemaDiff}.fixture.ts
touch apps/api/src/repository/__tests__/{meetings,attendance,tagDefinitions,tagQueue,schemaVersions,schemaQuestions,schemaDiffQueue}.test.ts
```

### Step 8: sanity check
```bash
pnpm --filter @ubm-hyogo/api typecheck
pnpm vitest run apps/api/src/repository
pnpm depcruise apps/api
```

## sanity check 一覧

| # | 項目 | コマンド | 期待 |
| --- | --- | --- | --- |
| 1 | TS | `pnpm --filter @ubm-hyogo/api typecheck` | 0 error |
| 2 | unit | `pnpm vitest run apps/api/src/repository` | pass |
| 3 | DB 制約 test | `pnpm test attendance` | DB-1〜DB-6 pass |
| 4 | 状態遷移 test | `pnpm test tagQueue` | ST-1〜ST-5 pass |
| 5 | depcruise | `pnpm depcruise apps/api` | 0 violation |
| 6 | bundle size | `du -sh dist/` | < 1MB |

## 実行タスク

1. runbook を `outputs/phase-05/runbook.md` に
2. placeholder を `outputs/phase-05/main.md` に整理
3. sanity check 表を main.md

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 4 verify-suite.md | 実装到達目標 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | DDL |
| 必須 | docs/02-application-implementation/02a-... | _shared/ 共有 |

## 統合テスト連携

| 連携先 | 連携 |
| --- | --- |
| Phase 6 | runbook の異常系叩き |
| 03a / 04c / 07a/b/c / 08a | runbook interface 再利用 |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| attendance 重複 | #15 | Step 3 の PK 制約 try/catch |
| 削除済み除外 | #15 | Step 3 の status 確認 |
| tag 直接編集 | #13 | Step 4 write API 不在コメント明示 |
| schema 集約 | #14 | Step 6 schemaDiffQueue が単一 source |
| 状態遷移 | — | Step 5 ALLOWED_TRANSITIONS |
| boundary | #5 | depcruise sanity check |

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | runbook | completed |
| 2 | placeholder 整理 | completed |
| 3 | sanity check | completed |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-05/main.md | placeholder 整理 + sanity check |
| outputs/phase-05/runbook.md | 8 step runbook |

## 完了条件

- [ ] 8 step runbook 完成
- [ ] placeholder 7 ファイル分
- [ ] sanity check 6 項目

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜3 completed
- [ ] outputs/phase-05/* 配置済み
- [ ] artifacts.json の Phase 5 を completed

## 次 Phase

- 次: Phase 6
- 引き継ぎ事項: runbook + placeholder
- ブロック条件: placeholder 7 ファイル不足なら Phase 6 進めない
