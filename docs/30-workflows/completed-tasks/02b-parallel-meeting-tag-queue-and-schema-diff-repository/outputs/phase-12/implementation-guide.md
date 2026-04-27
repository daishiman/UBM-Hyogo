# 02b implementation-guide

## Part 1: はじめて読む人向け

### なぜ必要か
学校の係活動で、出席表、名札、連絡メモがそれぞれ別の場所に置かれていると、誰がどこを見ればよいか迷う。さらに、同じ人を二重に出席扱いにしたり、消したはずの人をまた名簿に戻したりすると、あとで直す人が困る。

このタスクは、開催、出席、タグ付け待ち、フォーム項目の変更待ちを扱う「保管場所への出入り口」をそろえる。後続タスクは D1 を直接触らず、この出入り口だけを使えばよい。

### 何を作ったか
- 開催一覧と出席登録を扱う repository
- タグ候補を「queued → reviewing → resolved」の順で進める queue
- フォーム項目の変更を見つけ、解決済みにする schema diff queue
- 削除済み会員を出席候補から外し、同じ会員を同じ開催に二重登録しない仕組み

### 画面確認について
本タスクは画面を変更しない repository 層タスクである。Phase 11 はスクリーンショットではなく、typecheck と repository unit test の NON_VISUAL 証跡で確認する。

## Part 2: 開発者向け

### 概要
`apps/api/src/repository/` に開催 / queue / schema 系 7 repository を実装した。後続タスク (03a / 04c / 07a / 07b / 07c / 08a) は本ファイルの公開 API を通して D1 にアクセスする。

## 提供ファイル
| File | 主な責務 |
| --- | --- |
| `_shared/db.ts` | `DbCtx` 型 + `isUniqueConstraintError` / `intToBool` / `boolToInt` |
| `_shared/brand.ts` | branded 型の re-export (`@ubm-hyogo/shared` 経由) |
| `_shared/__fakes__/fakeD1.ts` | unit test 用の in-memory fake D1 |
| `meetings.ts` | meeting_sessions CRUD（read 中心 + admin insert） |
| `attendance.ts` | member_attendance CRUD + 重複防止 + 削除済み除外 |
| `tagDefinitions.ts` | tag 辞書 read（write API 不在: 不変条件 #13） |
| `tagQueue.ts` | tag_assignment_queue 状態遷移 (queued→reviewing→resolved) |
| `schemaVersions.ts` | schema_versions / `getLatestVersion` / `supersede` |
| `schemaQuestions.ts` | schema_questions / `updateStableKey` |
| `schemaDiffQueue.ts` | type: added/changed/removed、status: queued/resolved + `resolve` |

## 後続タスクの主な使い方
### 03a (forms-schema-sync)
- 同期で `schemaVersions.upsertManifest` → 旧版 `supersede`
- field 差分は `schemaQuestions.upsertField` + `schemaDiffQueue.enqueue`

### 04c (admin-backoffice-api)
- `/admin/meetings` → `meetings.list*`
- `/admin/tags/queue` → `tagQueue.listQueue`
- `/admin/schema/diff` → `schemaDiffQueue.list`

### 07a (tag queue resolve workflow)
- `tagQueue.transitionStatus(qid, "reviewing"|"resolved")` を呼ぶ。逆遷移は throw されるので呼び出し側は state 確認をしてから渡す

### 07b (schema diff alias workflow)
- `schemaDiffQueue.findById` → `schemaQuestions.updateStableKey` → `schemaDiffQueue.resolve` の順に実行

### 07c (meeting attendance + audit)
- `attendance.listAttendableMembers(sid)` で削除済み除外済みの候補リスト取得
- `attendance.addAttendance(...)` で重複・削除済み・不在 session の 3 種を `reason` で受ける

### 08a (contract test)
- `_shared/__fakes__/fakeD1.ts` を再利用、または miniflare に切り替えて real D1 を使う（推奨）

## TypeScript 契約

```ts
export interface DbCtx {
  db: D1Database;
}

export type TagQueueStatus = "queued" | "reviewing" | "resolved";
export const ALLOWED_TRANSITIONS: Readonly<Record<TagQueueStatus, readonly TagQueueStatus[]>>;
export function isAllowedTransition(from: TagQueueStatus, to: TagQueueStatus): boolean;
export function transitionStatus(c: DbCtx, queueId: string, next: TagQueueStatus): Promise<TagAssignmentQueueRow>;

export type AddAttendanceResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" | "deleted_member" | "session_not_found" };
export function addAttendance(c: DbCtx, memberId: MemberId, sessionId: string, by: string): Promise<AddAttendanceResult>;
export function listAttendableMembers(c: DbCtx, sessionId: string): Promise<AttendableMember[]>;

export type DiffType = "added" | "changed" | "removed";
export type DiffStatus = "queued" | "resolved";
export function list(c: DbCtx, type?: DiffType): Promise<SchemaDiffQueueRow[]>;
export function resolve(c: DbCtx, diffId: string, by: string): Promise<void>;
```

## API シグネチャと使用例

```ts
const queued = await tagQueue.listQueue(ctx, "queued");
if (queued[0] && tagQueue.isAllowedTransition(queued[0].status, "reviewing")) {
  await tagQueue.transitionStatus(ctx, queued[0].queueId, "reviewing");
}

const result = await attendance.addAttendance(ctx, memberId, sessionId, adminEmail);
if (!result.ok && result.reason === "deleted_member") {
  return new Response("deleted member cannot attend", { status: 409 });
}

const diffs = await schemaDiffQueue.list(ctx);
for (const diff of diffs) {
  await schemaQuestions.updateStableKey(ctx, diff.questionId!, stableKey);
  await schemaDiffQueue.resolve(ctx, diff.diffId, adminEmail);
}
```

## エラーハンドリングとエッジケース

| 対象 | 発生条件 | 呼び出し側の扱い |
| --- | --- | --- |
| `tagQueue.transitionStatus` | 存在しない queue ID | 404 相当へ変換 |
| `tagQueue.transitionStatus` | 逆遷移 / skip 遷移 | `RangeError` を 409 相当へ変換 |
| `attendance.addAttendance` | `(member_id, session_id)` 重複 | `{ ok: false, reason: "duplicate" }` を返す |
| `attendance.addAttendance` | 削除済み会員 | `{ ok: false, reason: "deleted_member" }` を返す |
| `attendance.addAttendance` | 存在しない開催 | `{ ok: false, reason: "session_not_found" }` を返す |
| `schemaDiffQueue.list` | type 未指定 | `status='queued'` のみ `created_at ASC` で返す |
| `schemaDiffQueue.resolve` | 存在しない diffId | not found error を throw |

## 設定可能なパラメータと定数

| 項目 | 値 |
| --- | --- |
| D1 binding | `DB` |
| repository root | `apps/api/src/repository/` |
| tag queue status | `queued` / `reviewing` / `resolved` |
| schema diff type | `added` / `changed` / `removed` |
| schema diff status | `queued` / `resolved` |
| attendance failure reason | `duplicate` / `deleted_member` / `session_not_found` |

## 不変条件マッピング
- #5 D1 直接アクセスは `apps/api/src/repository/` に閉じる
- #13 `tagDefinitions.ts` に write API 無し → tag 直接編集禁止
- #14 schema 系 3 ファイルが単一 source
- #15 attendance は PK + `listAttendableMembers` フィルタで保護

## ローカル検証
```
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm vitest run apps/api/src/repository
```
（43/43 テスト緑）

## スクリーンショット
本タスクは repository 層のため UI 添付なし。
