# Phase 2: 設計

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Phase 1: [`phase-1-requirements.md`](./phase-1-requirements.md)

---

## 1. アーキ概要

```
┌──────────────────────────────────────────────────────────────┐
│ packages/shared/src/zod/                                     │
│  ├── primitives.ts                                           │
│  ├── field.ts                                                │
│  ├── schema.ts                                               │
│  ├── response.ts                                             │
│  ├── identity.ts                                             │
│  ├── viewmodel.ts                                            │
│  ├── sync-log.ts          ← 新規（本タスク）                  │
│  └── index.ts             ← 1 行追加                          │
└──────────────────────────────────────────────────────────────┘
                 │ import { SyncLogRecordZ, ... }
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ apps/api/src/sync/                                           │
│  ├── types.ts             ← shared re-export に置換          │
│  ├── audit.ts             ← lockTriggerOf() 削除             │
│  ├── manual.ts            ← "manual" → "admin"               │
│  ├── scheduled.ts         ← "scheduled" → "cron"             │
│  └── backfill.ts          ← 変更なし（"backfill" 維持）       │
└──────────────────────────────────────────────────────────────┘
                 │ bind() で物理 SQL へ
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ apps/api/migrations/0002_sync_logs_locks.sql                 │
│  - sync_job_logs.status      = 'running'|'success'|'failed'|'skipped' │
│  - sync_job_logs.trigger_type = 'cron'|'admin'|'backfill'    │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. shared schema 設計（`packages/shared/src/zod/sync-log.ts`）

### 2.1 全体構造

```ts
import { z } from "zod";

import { Iso8601Z, NonEmptyStringZ } from "./primitives";

/**
 * sync_job_logs.status の canonical 値（物理 DDL 一致）。
 * 物理 source: apps/api/migrations/0002_sync_logs_locks.sql
 */
export const SyncLogStatusZ = z.enum([
  "running",
  "success",
  "failed",
  "skipped",
]);
export type SyncLogStatus = z.infer<typeof SyncLogStatusZ>;

/**
 * sync_job_logs.trigger_type / sync_locks.trigger_type の canonical 値（物理一致）。
 * cron   = Cloudflare Workers cron triggered
 * admin  = manual via admin route
 * backfill = backfill route
 */
export const SyncTriggerTypeZ = z.enum(["cron", "admin", "backfill"]);
export type SyncTriggerType = z.infer<typeof SyncTriggerTypeZ>;

/**
 * sync_job_logs row schema (snake_case = 物理層に合わせる).
 * D1 read 直後の row を直接 safeParse 可能にする。
 * camelCase 変換は consumer 側 mapper の責務。
 */
export const SyncLogRecordZ = z.object({
  id: z.number().int().positive(),
  run_id: NonEmptyStringZ,
  trigger_type: SyncTriggerTypeZ,
  status: SyncLogStatusZ,
  started_at: Iso8601Z,
  finished_at: Iso8601Z.nullable(),
  fetched_count: z.number().int().nonnegative(),
  upserted_count: z.number().int().nonnegative(),
  failed_count: z.number().int().nonnegative(),
  retry_count: z.number().int().nonnegative(),
  duration_ms: z.number().int().nonnegative().nullable(),
  error_reason: z.string().nullable(),
});
export type SyncLogRecord = z.infer<typeof SyncLogRecordZ>;
```

### 2.2 field 設計の根拠

| field | 物理型 | Zod 制約 | 根拠 |
|------|------|--------|------|
| `id` | `INTEGER AUTOINCREMENT PK` | `z.number().int().positive()` | AUTOINCREMENT は 1 以上を保証 |
| `run_id` | `TEXT UNIQUE NOT NULL` | `NonEmptyStringZ`（既存 primitives 再利用） | UNIQUE + NOT NULL |
| `trigger_type` | `TEXT NOT NULL` | `SyncTriggerTypeZ` | 物理 DDL コメント `cron / admin / backfill` |
| `status` | `TEXT NOT NULL` | `SyncLogStatusZ` | 物理 DDL コメント `running / success / failed / skipped` |
| `started_at` | `TEXT NOT NULL` | `Iso8601Z`（既存 primitives 再利用） | `audit.ts` は ISO8601 で bind |
| `finished_at` | `TEXT NULL` | `Iso8601Z.nullable()` | running 中は NULL |
| `fetched_count` | `INTEGER DEFAULT 0 NOT NULL` | `z.number().int().nonnegative()` | DEFAULT 0 で NULL 不可 |
| `upserted_count` | 同上 | 同上 | 同上 |
| `failed_count` | 同上 | 同上 | 同上 |
| `retry_count` | 同上 | 同上 | 同上 |
| `duration_ms` | `INTEGER NULL` | `z.number().int().nonnegative().nullable()` | running 中は NULL、終了時に bind |
| `error_reason` | `TEXT NULL` | `z.string().nullable()` | 文字数制約は `audit.ts:redact` の `.slice(0,1000)` で application 層が担保 |

### 2.3 既存 primitives 再利用

- `Iso8601Z` = `z.string().datetime({ offset: true })`（`packages/shared/src/zod/primitives.ts:7`）
- `NonEmptyStringZ` = `z.string().min(1)`（同 :3）

新規 primitive は追加しない（既存パターン整合）。

---

## 3. 配置設計

### 3.1 `packages/shared/src/zod/index.ts` diff

```diff
 export * from "./primitives";
 export * from "./field";
 export * from "./schema";
 export * from "./response";
 export * from "./identity";
 export * from "./viewmodel";
+export * from "./sync-log";
```

re-export は **末尾 7 行目に追加**。既存 6 行の順序を入れ替えない。

### 3.2 ファイル命名の根拠

`sync-log.ts`（hyphen-case）を採用。理由:

- 既存 `viewmodel.ts` は 1 単語のため hyphen 無し。`sync-log` は 2 単語のため hyphen-case とする
- `sync.ts` 単独命名を避ける理由: 将来 `sync_jobs`（#195）契約を別ファイル `sync-job.ts` として追加する余地を残すため
- `apps/api/src/sync/audit.ts` の `lockTriggerOf` / `withSyncMutex` 等 application 関数群は `sync-log` 契約と論理一致

---

## 4. consumer 改修設計

### 4.1 `apps/api/src/sync/types.ts` diff

```diff
-// u-04: sync layer 共通型。SyncTrigger は契約論理名 (manual / scheduled / backfill)。
-// audit 物理は sync_job_logs。
-
-export type SyncTrigger = "manual" | "scheduled" | "backfill";
-
-export type AuditStatus = "running" | "success" | "failed" | "skipped";
+// u-04: sync layer 共通型。SyncTrigger / AuditStatus は @ubm-hyogo/shared canonical を参照。
+// 物理は sync_job_logs（apps/api/migrations/0002_sync_logs_locks.sql）。
+
+import type {
+  SyncLogStatus,
+  SyncTriggerType,
+} from "@ubm-hyogo/shared";
+
+// re-export: 既存 import 経路 (`apps/api/src/sync/types`) を破壊しない
+export type SyncTrigger = SyncTriggerType;
+export type AuditStatus = SyncLogStatus;

 export interface DiffSummary { ... }    // 変更なし
 export interface SyncResult extends DiffSummary { ... }   // 変更なし
 export interface AuditDeps { ... }       // 変更なし
 export interface SyncEnvBase { ... }     // 変更なし
```

### 4.2 `apps/api/src/sync/audit.ts` diff

```diff
-function lockTriggerOf(t: SyncTrigger): "cron" | "admin" | "backfill" {
-  if (t === "manual") return "admin";
-  if (t === "scheduled") return "cron";
-  return "backfill";
-}
-
 export async function startRun(
   deps: AuditDeps,
   trigger: SyncTrigger,
   ttlMs: number = DEFAULT_LOCK_TTL_MS,
 ): Promise<{ result: StartRunResult; lock: SyncLock | null }> {
   const auditId = deps.newId();
   const lock = await acquireSyncLock(deps.db, {
     holder: auditId,
-    triggerType: lockTriggerOf(trigger),
+    triggerType: trigger,   // shared canonical = cron|admin|backfill 物理一致
     ttlMs,
     now: deps.now,
   });
```

### 4.3 `apps/api/src/sync/manual.ts` diff

```diff
-  return withSyncMutex(auditDeps, "manual", async () => {
+  return withSyncMutex(auditDeps, "admin", async () => {
```

### 4.4 `apps/api/src/sync/scheduled.ts` diff

```diff
-// cursor = sync_job_logs から trigger_type IN (manual, scheduled, admin, cron) で
-// 最新 success の started_at を採用。
+// cursor = sync_job_logs から trigger_type IN (cron, admin, backfill) で
+// 最新 success の started_at を採用。canonical は物理 DDL 一致 (issue #266)。
 ...
-       WHERE status = 'success' AND trigger_type IN ('manual','scheduled','admin','cron')`,
+       WHERE status = 'success' AND trigger_type IN ('cron','admin','backfill','manual','scheduled')`,
 ...
-  return withSyncMutex(auditDeps, "scheduled", async () => {
+  return withSyncMutex(auditDeps, "cron", async () => {
```

### 4.5 `apps/api/src/sync/backfill.ts`

変更なし。既に `"backfill"` を使用。

### 4.6 `apps/api/src/sync/index.ts`

変更なし。`SyncTrigger` / `AuditStatus` の re-export を維持（types.ts 経由で shared に解決される）。

### 4.7 `apps/api/src/jobs/sync-sheets-to-d1.ts`

`sync_job_logs` への INSERT bind 値（`trigger_type` 引数）が `SyncTrigger` 型を受ける箇所のみ確認。文字列リテラルの直接 bind は無いため、上流 caller が canonical 値を渡せば自動的に整合。

---

## 5. ドリフト解消 mapping

### 5.1 値変換表

| 旧 TS 値（types.ts） | 旧 runtime 経路 | 新 TS 値（shared 由来） | 理由 |
|------|------|------|------|
| `"manual"` | `lockTriggerOf()` → `"admin"` | `"admin"` | 物理 DDL コメント / `audit.ts:27` の mapping 出力一致 |
| `"scheduled"` | `lockTriggerOf()` → `"cron"` | `"cron"` | Cloudflare Workers cron triggered の意味と一致 |
| `"backfill"` | `lockTriggerOf()` → `"backfill"` | `"backfill"` | 既に一致。変換不要 |

### 5.2 status は変換不要

`AuditStatus = "running"|"success"|"failed"|"skipped"` は既に物理一致のため、shared `SyncLogStatus` への置換のみで完了（値変換なし）。

### 5.3 過去 row（D1 既存データ）の扱い

- production / staging D1 で `sync_job_logs.trigger_type` に `"manual"` / `"scheduled"` 値が物理的に書き込まれている可能性は **低い**（`lockTriggerOf()` が常に変換するため）
- ただし `'manual'` 文字列が直接 bind されている経路がもし過去にあれば、`scheduled.ts` cursor SELECT 簡素化により cursor 計算から漏れる
- Phase 5 着手前 gate として `SELECT DISTINCT trigger_type FROM sync_job_logs` を staging で確認する。`cron|admin|backfill` 以外の値が 0 件であれば §4.4 diff を採用、>0 件であれば hybrid IN 句を temporary 維持し fallback retirement task を別途起票する。Phase 11 は同じ結果を evidence として保存する確認フェーズであり、実装判断の初出にしない。

---

## 6. 正本値の決定根拠

### 6.1 3 候補の比較

| canonical 候補 | 物理 DDL 一致 | TS 一致 | 元仕様 U-UT01-10 一致 | 変更コスト |
|------|------|------|------|------|
| **A: 物理 (`cron`/`admin`/`backfill` + `running`/`success`/`failed`/`skipped`)** | ✅ | TS 修正で一致可 | ❌ | TS 修正のみ（低） |
| B: 旧 TS (`manual`/`scheduled`/`backfill` + 同 status) | ❌ | ✅ | 部分一致 | migration 必須（高・破壊的） |
| C: 元仕様 (`manual`/`cron`/`backfill` + `pending`/`in_progress`/`completed`/`failed`) | ❌ | ❌ | ✅ | migration + 全 audit.ts SQL 書換（最高） |

### 6.2 採用: A（物理 canonical）

理由:

1. **migration 不要**: production / staging D1 のデータ移行を伴わない
2. **runtime 影響なし**: `lockTriggerOf()` で既に物理値が出力されているため、D1 への bind 値は変わらない
3. **`apps/web` 後続 UI 連携時の単一 source**: API レスポンス JSON ↔ D1 row ↔ shared schema が 3 者一致
4. **U-8 unassigned task の実質吸収**: 元仕様の値集合は未到達のため、物理を canonical と宣言することで U-8 を「物理採用」として close 可能

### 6.3 元仕様改訂の扱い

`docs/30-workflows/unassigned-task/U-UT01-10-shared-sync-contract-zod.md` の §「含む」記述（`pending`/`in_progress`/...）は **本タスクで上書きしない**。本タスクの index.md / phase-1 を後続の正本とし、unassigned task 原典は historical context として保持する（CONST_005 「真の論点」が原典記述よりも実態に近いため）。

---

## 7. ESLint 経路ガード（grep gate で代替）

### 7.1 本サイクルでは ESLint custom rule を追加しない

理由:

- ESLint plugin の新規作成は本タスクの SRP を超える
- 代替として **CI 上の grep gate** で `apps/api/src/sync/` 配下に独立 literal union 宣言が混入していないか検出

### 7.2 grep gate（後続 CI task 候補・本 PR では実施しない）

```bash
# 想定: .github/workflows/verify-sync-canonical.yml （後続 task で追加）
! grep -rn 'type Sync\(Trigger\|LogStatus\) = "' apps/api/src/ \
  || (echo "Use @ubm-hyogo/shared canonical instead" && exit 1)
```

本 PR では README / Phase 12 documentation で運用ルールを文書化するに留める（grep gate 追加は後続 lint 強化 task）。

---

## 8. test 設計（`packages/shared/src/zod/sync-log.spec.ts`）

### 8.1 vitest 構造

既存 `viewmodel.spec.ts` のパターンを踏襲（`describe` / `it` / `expect`）。

### 8.2 テストケース（8 件）

| # | ケース | 期待 |
|---|------|------|
| 1 | `SyncLogStatusZ.safeParse("running")` | success |
| 2 | `SyncLogStatusZ.safeParse("succeeded")` (typo) | failure |
| 3 | `SyncTriggerTypeZ.safeParse("cron")` | success |
| 4 | `SyncTriggerTypeZ.safeParse("manual")` (旧値) | failure |
| 5 | 完全な 12 カラム row を `SyncLogRecordZ.safeParse` | success |
| 6 | `finished_at: null` / `duration_ms: null` / `error_reason: null` row | success |
| 7 | `retry_count: -1` の row | failure（`nonnegative` 違反） |
| 8 | `status: "unknown"` の row | failure |

### 8.3 型整合 test（追加 1 件、合計 9 件で nice-to-have）

`z.infer<typeof SyncLogRecordZ>` が `SyncLogRecord` 型と構造的等価であることを TypeScript の型推論で固定（`const _check: SyncLogRecord = z.infer<typeof SyncLogRecordZ>` 相当の compile-time check）。

---

## 9. DoD

- [ ] Phase 1 受入条件 AC-1 〜 AC-8 全件 check
- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/shared test` で `sync-log.spec.ts` 8 件以上 green
- [ ] `apps/api` 既存 contract test 全件 green（regression なし）
- [ ] `grep -rn '"manual"\|"scheduled"' apps/api/src/sync/` で sync trigger 文字列リテラルが残らない（コメント文字列は除外）
- [ ] index.md `out of scope` 5 件が PR description に明示される
- [ ] Phase 5 着手前 gate と Phase 11 evidence の双方で staging D1 の `SELECT DISTINCT trigger_type FROM sync_job_logs` 結果が `cron|admin|backfill` の 3 値以内に収まる確認
