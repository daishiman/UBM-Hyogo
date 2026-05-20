# Phase 5: 実装

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Phase 4: [`phase-4-test-plan.md`](./phase-4-test-plan.md)
> 本ファイルが **コード実装の正本**。Phase 12 `outputs/phase-12/implementation-guide.md` はこの再構成。

---

## 1. 実装ファイル一覧

| # | パス | 種別 | LoC（目安） |
|---|------|------|----|
| F1 | `packages/shared/src/zod/sync-log.ts` | 新規 | ~60 |
| F2 | `packages/shared/src/zod/index.ts` | 1 行追加 | +1 |
| F3 | `packages/shared/src/zod/sync-log.spec.ts` | 新規（Phase 6 で確定） | ~150 |
| F4 | `apps/api/src/sync/types.ts` | 改修 | ~+5 / -2 |
| F5 | `apps/api/src/sync/audit.ts` | 改修（`lockTriggerOf` 削除） | ~-7 / -修正 |
| F6 | `apps/api/src/sync/manual.ts` | 文字列 1 箇所置換 | ±0 |
| F7 | `apps/api/src/sync/scheduled.ts` | 文字列 1 箇所置換 + SQL IN 句 + コメント | ~-2 / +2 |
| F8 | `apps/api/src/sync/backfill.ts` | 変更なし（確認のみ） | ±0 |
| F9 | `apps/api/src/sync/index.ts` | 変更なし（確認のみ） | ±0 |
| F10 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | `SyncOptions.trigger` を shared 由来へ統合 | ~-1 / +2 |
| F11 | `apps/api/src/sync/audit.contract.spec.ts` | spec 期待値置換 | minimal |
| F12 | `apps/api/src/sync/manual.contract.spec.ts` | spec 期待値置換 | minimal |
| F13 | `apps/api/src/sync/scheduled.contract.spec.ts` | spec 期待値置換 | minimal |

---

## 2. F1: `packages/shared/src/zod/sync-log.ts`（新規・完全実装）

```ts
// issue-266: sync_job_logs 契約の shared 正本。
// 物理 source: apps/api/migrations/0002_sync_logs_locks.sql
// canonical 決定根拠: docs/30-workflows/issue-266-shared-sync-zod-contract/phase-2-design.md §6
//
// 型は z.infer 経由でのみ export する。独立 literal union 宣言は禁止
// （Phase 1 不変条件 #4 / Phase 3 §3）。

import { z } from "zod";

import { Iso8601Z, NonEmptyStringZ } from "./primitives";

/**
 * sync_job_logs.status の canonical 値（物理 DDL 一致）。
 * - running : 実行中
 * - success : 正常終了
 * - failed  : 異常終了
 * - skipped : 別 run が lock 取得中だったためスキップ
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
 * - cron     : Cloudflare Workers cron triggered（旧 TS 値 "scheduled" を物理に揃えた）
 * - admin    : admin route 経由の手動実行（旧 TS 値 "manual" を物理に揃えた）
 * - backfill : backfill route 経由の truncate-and-reload
 */
export const SyncTriggerTypeZ = z.enum(["cron", "admin", "backfill"]);
export type SyncTriggerType = z.infer<typeof SyncTriggerTypeZ>;

/**
 * sync_job_logs row schema (snake_case = 物理層に合わせる).
 * D1 read 直後の row を直接 safeParse 可能にする。
 * camelCase 変換は consumer 側 mapper（apps/api/src/sync/audit.ts:listRecent）の責務。
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

### 2.1 設計上の固定事項

- `Iso8601Z` / `NonEmptyStringZ` は `./primitives` 既存 export を再利用（新規 primitive を生やさない）
- field 順序は物理 DDL `0002_sync_logs_locks.sql` のカラム順と一致
- snake_case を維持（D1 read 直後 row の safeParse 互換性のため）
- `error_reason` は文字数上限を schema で付与しない（application 層 `audit.ts:redact` が `.slice(0,1000)` で担保）

---

## 3. F2: `packages/shared/src/zod/index.ts`（1 行追加）

```diff
 export * from "./primitives";
 export * from "./field";
 export * from "./schema";
 export * from "./response";
 export * from "./identity";
 export * from "./viewmodel";
+export * from "./sync-log";
```

末尾 7 行目に追加。既存 6 行の順序を入れ替えない。

---

## 4. F4: `apps/api/src/sync/types.ts`（改修・完全実装）

### 4.1 改修後の完全コード

```ts
// u-04: sync layer 共通型。SyncTrigger / AuditStatus は @ubm-hyogo/shared canonical を参照。
// 物理は sync_job_logs（apps/api/migrations/0002_sync_logs_locks.sql）。
// canonical 値: trigger_type = cron|admin|backfill / status = running|success|failed|skipped
// canonical 決定根拠: docs/30-workflows/issue-266-shared-sync-zod-contract/phase-2-design.md §6

import type {
  SyncLogStatus,
  SyncTriggerType,
} from "@ubm-hyogo/shared";

// re-export: 既存 import 経路 (`apps/api/src/sync/types`) を破壊しない
export type SyncTrigger = SyncTriggerType;
export type AuditStatus = SyncLogStatus;

export interface DiffSummary {
  fetched: number;
  upserted: number;
  failed: number;
  retryCount: number;
  durationMs: number;
}

export interface SyncResult extends DiffSummary {
  status: "success" | "failed" | "skipped";
  auditId: string;
  errorReason?: string;
}

export interface AuditDeps {
  db: D1Database;
  now: () => Date;
  newId: () => string;
}

export interface SyncEnvBase {
  readonly DB: D1Database;
  readonly GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  readonly GOOGLE_SHEETS_SA_JSON?: string;
  readonly SHEETS_SPREADSHEET_ID?: string;
  readonly SYNC_BATCH_SIZE?: string;
  readonly SYNC_MAX_RETRIES?: string;
  readonly SYNC_RANGE?: string;
  readonly SYNC_ADMIN_TOKEN?: string;
}
```

### 4.2 import 経路の確認

- shared package 名: `@ubm-hyogo/shared`（`packages/shared/package.json#name` 参照、既存 `apps/api/src/jobs/sync-sheets-to-d1.ts:15` の `import { STABLE_KEY } from "@ubm-hyogo/shared"` パターンと整合）
- shared subpath export が `./zod` 単独で許可されていない場合、`@ubm-hyogo/shared` ルート経由とする（index.ts 経由で全 schema が re-export されているため）
- `SyncResult.status` は当面 `"success" | "failed" | "skipped"` literal のまま保持（`SyncLogStatus` の subset = `running` を含まないため、別 alias を作るより明示）

---

## 5. F5: `apps/api/src/sync/audit.ts`（差分）

### 5.1 削除する関数

```diff
-function lockTriggerOf(t: SyncTrigger): "cron" | "admin" | "backfill" {
-  if (t === "manual") return "admin";
-  if (t === "scheduled") return "cron";
-  return "backfill";
-}
```

### 5.2 `startRun` 内の bind 修正

```diff
 export async function startRun(
   deps: AuditDeps,
   trigger: SyncTrigger,
   ttlMs: number = DEFAULT_LOCK_TTL_MS,
 ): Promise<{ result: StartRunResult; lock: SyncLock | null }> {
   const auditId = deps.newId();
   const lock = await acquireSyncLock(deps.db, {
     holder: auditId,
-    triggerType: lockTriggerOf(trigger),
+    triggerType: trigger,   // shared canonical = cron|admin|backfill 物理一致 (issue #266)
     ttlMs,
     now: deps.now,
   });
```

`bind(auditId, trigger, ...)` の INSERT bind 値（`?2` = `trigger_type`）は元から `trigger` を直接 bind しているため変更不要。`lockTriggerOf` を削除しても上流からの canonical 値が `cron|admin|backfill` なので物理 row への書き込み値は不変。

### 5.3 ファイル冒頭コメントの更新

```diff
-// u-04: audit writer + withSyncMutex。物理は sync_job_logs。
-// trigger 値は manual / scheduled / backfill。互換用に外部 'admin' を受けたら manual に正規化。
+// u-04: audit writer + withSyncMutex。物理は sync_job_logs。
+// trigger 値は shared canonical = cron / admin / backfill（物理 DDL 一致）。
+// issue-266 で旧 TS 値 manual / scheduled を物理に揃え、lockTriggerOf 変換を廃止した。
```

---

## 6. F6: `apps/api/src/sync/manual.ts`（差分）

```diff
-  return withSyncMutex(auditDeps, "manual", async () => {
+  return withSyncMutex(auditDeps, "admin", async () => {
     return runFetchMapUpsert(env, deps);
   });
```

1 箇所のみ。`runManualSync` 関数名は API 名として保持（DX のため）。「manual = admin route 経由」という意味は変わらない。

---

## 7. F7: `apps/api/src/sync/scheduled.ts`（差分）

```diff
-// u-04: Workers scheduled handler。
-// cursor = sync_job_logs から trigger_type IN (manual, scheduled, admin, cron) で
-// status='success' の最大 finished_at を取得。
+// u-04: Workers scheduled handler。
+// cursor = sync_job_logs から trigger_type IN (cron, admin, backfill) で
+// status='success' の最大 finished_at を取得。canonical は物理 DDL 一致 (issue #266)。

 import { withSyncMutex } from "./audit";
 import { runFetchMapUpsert, type ManualSyncDeps } from "./manual";
 import type { AuditDeps, SyncEnvBase, SyncResult } from "./types";

 export async function readLastSuccessCursor(
   db: D1Database,
 ): Promise<string | null> {
   const row = await db
     .prepare(
       `SELECT MAX(finished_at) AS cursor FROM sync_job_logs
-       WHERE status = 'success' AND trigger_type IN ('manual','scheduled','admin','cron')`,
+       WHERE status = 'success' AND trigger_type IN ('cron','admin','backfill','manual','scheduled')`,
     )
     .first<{ cursor: string | null }>();
   return row?.cursor ?? null;
 }

 export async function runScheduledSync(
   env: SyncEnvBase,
   deps: ManualSyncDeps & { cursorReader?: (db: D1Database) => Promise<string | null> } = {},
 ): Promise<SyncResult> {
   const auditDeps: AuditDeps = {
     db: env.DB,
     now: deps.now ?? (() => new Date()),
     newId: deps.newId ?? (() => crypto.randomUUID()),
   };
   const cursorReader = deps.cursorReader ?? readLastSuccessCursor;
-  return withSyncMutex(auditDeps, "scheduled", async () => {
+  return withSyncMutex(auditDeps, "cron", async () => {
     await cursorReader(env.DB);
     return runFetchMapUpsert(env, deps, null);
   });
 }
```

> **注意**: cursor IN 句から `'manual'` / `'scheduled'` を削除する影響評価は Phase 5 着手前 gate で実測（Phase 2 §5.3 / Phase 3 §6.3 / Phase 4 §5.3）。staging で旧値 row が 0 件であることを確認してからこの差分を採用し、Phase 11 に同じ結果を evidence 保存する。

---

## 8. F8: `apps/api/src/sync/backfill.ts`（変更なし確認）

```ts
return withSyncMutex(auditDeps, "backfill", async () => { ... });
```

既に canonical `"backfill"` を使用。差分なし。

---

## 9. F9: `apps/api/src/sync/index.ts`（変更なし確認）

```ts
export type {
  SyncTrigger,
  SyncResult,
  AuditStatus,
  DiffSummary,
  AuditDeps,
  SyncEnvBase,
} from "./types";
```

`types.ts` 経由で shared に解決されるため、re-export 行は不変。

---

## 10. F10: `apps/api/src/jobs/sync-sheets-to-d1.ts`（差分）

既存に独立 literal union 宣言が 1 箇所ある。shared に統合する。

```diff
+import type { SyncTriggerType } from "@ubm-hyogo/shared";
+
 export interface SyncOptions {
-  readonly trigger: "cron" | "admin" | "backfill";
+  readonly trigger: SyncTriggerType;
   readonly fetcher?: SheetsFetcher;
   readonly now?: () => Date;
   readonly runId?: string;
   readonly lockTtlMs?: number;
 }
```

import を既存 `import { STABLE_KEY } from "@ubm-hyogo/shared";` と統合してもよい:

```ts
import { STABLE_KEY, type SyncTriggerType } from "@ubm-hyogo/shared";
```

その他の関数シグネチャ（`insertRunningLog` / `finalizeSkipped` の `trigger: string`）は string で受けるため変更不要（型の narrow は SyncOptions 受け口で完結）。

---

## 11. F11-F13: 既存 contract spec の期待値置換

### 11.1 `apps/api/src/sync/audit.contract.spec.ts`

```diff
-  // withSyncMutex を "manual" trigger で起動した case
-  const result = await withSyncMutex(deps, "manual", async () => { ... });
-  expect(rows[0].trigger_type).toBe("admin"); // lockTriggerOf 変換後
+  // withSyncMutex を "admin" trigger（shared canonical）で起動した case
+  const result = await withSyncMutex(deps, "admin", async () => { ... });
+  expect(rows[0].trigger_type).toBe("admin");
```

同様に `"scheduled"` → `"cron"` の置換を該当箇所で行う。Phase 5 実装時に `grep -n '"manual"\|"scheduled"' apps/api/src/sync/audit.contract.spec.ts` で残存を確認。

### 11.2 `apps/api/src/sync/manual.contract.spec.ts`

`runManualSync` を実行した結果の `trigger_type` 期待値が `"admin"` であることを確認。元から物理書き込み値は `"admin"` だったため、spec 側で `"manual"` を期待していた箇所は存在しない可能性が高い（実装時に `grep` で確認）。

### 11.3 `apps/api/src/sync/scheduled.contract.spec.ts`

- `runScheduledSync` 結果の `trigger_type === "cron"` 期待
- `readLastSuccessCursor` の SQL 期待文字列（IN 句）が更新後文字列に一致
- 旧 row（`'manual'` / `'scheduled'`）を投入した fixture があれば、cursor 計算から除外される挙動を確認する補助 it を追加してもよい

### 11.4 listRecent 拡張 it（Phase 4 §3.2 反映）

```ts
import { SyncTriggerTypeZ, SyncLogStatusZ } from "@ubm-hyogo/shared";

it("listRecent rows are shared-canonical parseable", async () => {
  // ...既存セットアップで row 投入...
  const rows = await listRecent(db, 10);
  for (const r of rows) {
    expect(SyncTriggerTypeZ.safeParse(r.trigger).success).toBe(true);
    expect(SyncLogStatusZ.safeParse(r.status).success).toBe(true);
  }
});
```

---

## 12. 実装手順（step-by-step）

### Step 1: shared schema を作る

```bash
# F1: 新規ファイル作成
$EDITOR packages/shared/src/zod/sync-log.ts   # §2 のコードを貼り付け

# F2: index.ts に 1 行追加
$EDITOR packages/shared/src/zod/index.ts      # §3 の diff を適用

# 検証
mise exec -- pnpm --filter @ubm-hyogo/shared typecheck
```

### Step 2: shared spec を作る

```bash
# F3: spec ファイル新規作成（Phase 6 §2 のコードを使用）
$EDITOR packages/shared/src/zod/sync-log.spec.ts

# 検証
mise exec -- pnpm --filter @ubm-hyogo/shared test -- sync-log
```

### Step 3: apps/api の TS 契約を shared に切り替える

```bash
# F4: types.ts 改修
$EDITOR apps/api/src/sync/types.ts            # §4 のコードに置換

# 検証 (この時点で audit.ts / manual.ts / scheduled.ts に type error が出る想定)
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

### Step 4: consumer を canonical 値に揃える

```bash
# F5: audit.ts から lockTriggerOf 削除
$EDITOR apps/api/src/sync/audit.ts            # §5 の diff を適用

# F6: manual.ts の文字列置換
$EDITOR apps/api/src/sync/manual.ts           # §6 の diff を適用

# F7: scheduled.ts の文字列置換 + SQL IN 句
$EDITOR apps/api/src/sync/scheduled.ts        # §7 の diff を適用

# F10: jobs/sync-sheets-to-d1.ts の型統合
$EDITOR apps/api/src/jobs/sync-sheets-to-d1.ts # §10 の diff を適用

# 検証
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

### Step 5: 既存 spec の期待値を置換

```bash
# 該当行を grep
grep -rn '"manual"\|"scheduled"' apps/api/src/sync/*.contract.spec.ts

# F11-F13 の置換を実施
$EDITOR apps/api/src/sync/audit.contract.spec.ts
$EDITOR apps/api/src/sync/manual.contract.spec.ts
$EDITOR apps/api/src/sync/scheduled.contract.spec.ts

# 検証
mise exec -- pnpm --filter @ubm-hyogo/api test
```

### Step 6: 全体 DoD 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/shared test
mise exec -- pnpm --filter @ubm-hyogo/api test
```

全 green になれば Step 完了。

---

## 13. 各 Step 後のローカル検証コマンドまとめ

| Step | コマンド | 期待 |
|------|---------|------|
| 1 | `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` | green |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/shared test -- sync-log` | 8+ 件 green |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | consumer 未改修なら type error 残存（想定内） |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | green |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/api test` | 既存 4 contract spec + 拡張 it green |
| 6 | `mise exec -- pnpm typecheck && pnpm lint && grep gate` | 全て green / 0 件 |

---

## 14. DoD（Phase 5 完了基準）

- [ ] F1 `sync-log.ts` が §2 のコードと一致
- [ ] F2 `index.ts` 末尾に `export * from "./sync-log";` 1 行
- [ ] F4 `types.ts` から独立 literal union 宣言が消えている（`grep -n 'type SyncTrigger = "' apps/api/src/sync/types.ts` が 0 件）
- [ ] F5 `audit.ts` から `lockTriggerOf` 関数が消えている（`grep -n 'lockTriggerOf' apps/api/src/sync/audit.ts` が 0 件）
- [ ] F6 / F7 で `withSyncMutex(deps, "manual" | "scheduled", ...)` の呼び出しが 0 件
- [ ] F10 `sync-sheets-to-d1.ts` `SyncOptions.trigger` が `SyncTriggerType` 由来
- [ ] `mise exec -- pnpm typecheck` green
- [ ] `mise exec -- pnpm lint` green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/shared test` の `sync-log.spec.ts` が 8 件以上 green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` 既存 contract spec 全件 green
- [ ] grep gate（Phase 4 §5.2）が全て 0 件

---

## 15. トラブルシュート

| 症状 | 原因候補 | 対処 |
|------|--------|------|
| `Cannot find module '@ubm-hyogo/shared'` typecheck error | workspace symlink 未生成 | `mise exec -- pnpm install --filter @ubm-hyogo/shared --filter @ubm-hyogo/api` |
| `SyncLogStatusZ` の subpath export not found | `packages/shared/package.json` の `exports` field 制約 | ルート import `@ubm-hyogo/shared` に統一（既存 `STABLE_KEY` import と同じ経路） |
| `withSyncMutex(deps, "manual", ...)` で型エラー | F4 type re-export が反映されていない | `pnpm install --force` で workspace 再 link |
| contract spec が `trigger_type === "manual"` 期待で fail | F11-F13 置換漏れ | `grep '"manual"\|"scheduled"' apps/api/src/sync/*.spec.ts` で残存検出 |
| cursor SELECT が旧 row を読み取れず scheduled が全件 re-fetch | staging D1 に旧値 row が残存 | Phase 11 evidence で確認、必要なら hybrid IN 句で temporary 維持し別 task で cleanup |
