# Implementation Guide — issue-266 shared sync Zod 契約

> 本ファイルは **PR 本文ソース**（`.claude/commands/ai/diff-to-pr.md` が参照）。
> Phase 5 `phase-5-implementation.md` の再構成。実装者がこのファイルだけ読んで一発実装できる粒度に統合。
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)

---

## Part 1: 中学生向けの説明

### なぜ必要か

同じ出来事を人によって別の言い方で書くと、あとで名簿を見た人が困ります。たとえば学校の出欠表で、ある先生は「出席」、別の先生は「来た」、また別の先生は「OK」と書いたら、集計するときにどれが同じ意味なのか迷います。

このタスクで起きていた問題も同じです。同期ログの「状態」や「きっかけ」の名前が、仕様書、コード、データベースで少しずつ違っていました。だから、先に「この言い方を正式な名前にする」と決めておく必要があります。

### 何をするか

正式な名前は、すでに実際のデータベースで使われている名前に合わせます。データベースを書き換えるより、コード側の呼び方を合わせる方が安全だからです。

### 今回作ったもの

| 作るもの | やさしい説明 |
| --- | --- |
| `SyncLogStatus` | 同期ログの状態を表す正式な名前リスト |
| `SyncTriggerType` | 同期が始まったきっかけを表す正式な名前リスト |
| `SyncLogRecord` | 同期ログ 1 行ぶんの形 |
| `sync-log.ts` | その 3 つを置く共有の置き場所 |

### 専門用語の言い換え

| 用語 | 言い換え |
| --- | --- |
| Zod schema | 書かれた内容がルールどおりか確認する表 |
| TypeScript 型 | コードを書くときの名札 |
| canonical | 正式な言い方 |
| D1 | データを入れる箱 |
| runtime | プログラムが動いている時間 |

## Part 2: 技術者向け実装ガイド

### 1. 背景（なぜ本タスクが必要か）

`apps/api/src/sync/types.ts` の `SyncTrigger` (`manual|scheduled|backfill`) と `apps/api/src/sync/audit.ts` の `AuditStatus` (`running|success|failed|skipped`) は **独立 literal union として宣言**されており、物理 DDL（`apps/api/migrations/0002_sync_logs_locks.sql`）とは別表記の状態だった。

物理 row に書き込まれる値は `apps/api/src/sync/audit.ts` の `lockTriggerOf()` 関数が runtime 変換していたため、TS 値と物理値が次のようにずれていた:

| 経路 | trigger 値の集合 | status 値の集合 |
|------|-----------------|----------------|
| TS（`types.ts`） | `manual` / `scheduled` / `backfill` | `running` / `success` / `failed` / `skipped` |
| 物理（D1 row） | `cron` / `admin` / `backfill` | 同上 |
| 元仕様（U-UT01-10） | `manual` / `cron` / `backfill` | `pending` / `in_progress` / `completed` / `failed` |

3 系統の値が混在していると、`apps/web` 側で sync log を表示する後続 task で「どの値に合わせるか」が自明にならない。また `lockTriggerOf()` の存在自体が「TS と物理の不一致を runtime で吸収している」構造的負債のシグナルだった。

本タスクは **物理 DDL を canonical として shared 化** し、TS = shared = 物理 の 3 者一致を実現する。

---

### 2. canonical 決定（必読）

| 種別 | canonical 値 |
|------|------------|
| `SyncLogStatus` | `running` / `success` / `failed` / `skipped` |
| `SyncTriggerType` | `cron` / `admin` / `backfill` |

### 2.1 旧 TS 値からの mapping

| 旧 TS | 新 canonical | 意味 |
|------|------------|------|
| `manual` | `admin` | admin route 経由の手動実行 |
| `scheduled` | `cron` | Cloudflare Workers cron triggered |
| `backfill` | `backfill` | backfill route 経由 |

### 2.2 採用根拠（簡潔）

- 物理 DDL は production / staging で既に走っており、変更には migration が必要（破壊的）
- TS-only の `SyncTrigger` は runtime 到達前に `lockTriggerOf()` で変換されるため、変更は内部的かつ非破壊
- 元仕様の値集合は **どの runtime にも未到達**

「変えるなら安い方を変える」の原則で TS 側を物理に寄せる。

---

### 3. ファイル別変更指示

### 3.1 [新規] `packages/shared/src/zod/sync-log.ts`

```ts
// issue-266: sync_job_logs 契約の shared 正本。
// 物理 source: apps/api/migrations/0002_sync_logs_locks.sql
// 型は z.infer 経由でのみ export する。独立 literal union 宣言は禁止。

import { z } from "zod";

import { Iso8601Z, NonEmptyStringZ } from "./primitives";

export const SyncLogStatusZ = z.enum([
  "running",
  "success",
  "failed",
  "skipped",
]);
export type SyncLogStatus = z.infer<typeof SyncLogStatusZ>;

export const SyncTriggerTypeZ = z.enum(["cron", "admin", "backfill"]);
export type SyncTriggerType = z.infer<typeof SyncTriggerTypeZ>;

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

### 3.2 [編集] `packages/shared/src/zod/index.ts`

末尾に 1 行追加:

```diff
 export * from "./viewmodel";
+export * from "./sync-log";
```

### 3.3 [新規] `packages/shared/src/zod/sync-log.spec.ts`

Phase 6 §2 の完全コードをそのまま配置。20 ケース（it.each 展開込み）。

### 3.4 [編集] `apps/api/src/sync/types.ts`

完全置換:

```ts
// u-04: sync layer 共通型。SyncTrigger / AuditStatus は @ubm-hyogo/shared canonical を参照。
// 物理は sync_job_logs。canonical: trigger_type = cron|admin|backfill / status = running|success|failed|skipped

import type {
  SyncLogStatus,
  SyncTriggerType,
} from "@ubm-hyogo/shared";

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

### 3.5 [編集] `apps/api/src/sync/audit.ts`

(a) ファイル冒頭コメント置換:

```diff
-// u-04: audit writer + withSyncMutex。物理は sync_job_logs。
-// trigger 値は manual / scheduled / backfill。互換用に外部 'admin' を受けたら manual に正規化。
+// u-04: audit writer + withSyncMutex。物理は sync_job_logs。
+// trigger 値は shared canonical = cron / admin / backfill（物理 DDL 一致）。
+// issue-266 で旧 TS 値 manual / scheduled を物理に揃え、lockTriggerOf 変換を廃止した。
```

(b) `lockTriggerOf` 関数を削除（7 行）

(c) `startRun` 内の bind 修正:

```diff
   const lock = await acquireSyncLock(deps.db, {
     holder: auditId,
-    triggerType: lockTriggerOf(trigger),
+    triggerType: trigger,
     ttlMs,
     now: deps.now,
   });
```

### 3.6 [編集] `apps/api/src/sync/manual.ts`

```diff
-  return withSyncMutex(auditDeps, "manual", async () => {
+  return withSyncMutex(auditDeps, "admin", async () => {
```

### 3.7 [編集] `apps/api/src/sync/scheduled.ts`

(a) ファイル冒頭コメント:

```diff
-// cursor = sync_job_logs から trigger_type IN (manual, scheduled, admin, cron) で
-// status='success' の最大 finished_at を取得。
+// cursor = sync_job_logs から trigger_type IN (cron, admin, backfill) で
+// status='success' の最大 finished_at を取得。canonical は物理 DDL 一致 (issue #266)。
```

(b) `readLastSuccessCursor` SQL の IN 句:

```diff
-       WHERE status = 'success' AND trigger_type IN ('manual','scheduled','admin','cron')`,
+       WHERE status = 'success' AND trigger_type IN ('cron','admin','backfill','manual','scheduled')`,
```

(c) `withSyncMutex` 引数:

```diff
-  return withSyncMutex(auditDeps, "scheduled", async () => {
+  return withSyncMutex(auditDeps, "cron", async () => {
```

### 3.8 [編集] `apps/api/src/jobs/sync-sheets-to-d1.ts`

独立 literal を shared 由来に統合:

```diff
-import { STABLE_KEY } from "@ubm-hyogo/shared";
+import { STABLE_KEY, type SyncTriggerType } from "@ubm-hyogo/shared";
...
 export interface SyncOptions {
-  readonly trigger: "cron" | "admin" | "backfill";
+  readonly trigger: SyncTriggerType;
   readonly fetcher?: SheetsFetcher;
   readonly now?: () => Date;
   readonly runId?: string;
   readonly lockTtlMs?: number;
 }
```

### 3.9 [編集] 既存 contract spec の期待値置換

| ファイル | 操作 |
|---------|------|
| `apps/api/src/sync/audit.contract.spec.ts` | `withSyncMutex(*, "manual"`→`"admin"` / `"scheduled"`→`"cron"` を全箇所置換。末尾に Phase 6 §3 の shared canonical 整合 it を append |
| `apps/api/src/sync/manual.contract.spec.ts` | trigger 期待値 `"manual"`→`"admin"` |
| `apps/api/src/sync/scheduled.contract.spec.ts` | trigger 期待値 `"scheduled"`→`"cron"`、cursor SQL 期待文字列を IN 句新形に更新 |
| `apps/api/src/sync/backfill.contract.spec.ts` | 変更不要 |

実装時に必ず `grep -n '"manual"\|"scheduled"' apps/api/src/sync/*.spec.ts` で残存を確認。

---

### APIシグネチャ

```ts
export const SyncLogStatusZ: z.ZodEnum<["running", "success", "failed", "skipped"]>;
export type SyncLogStatus = z.infer<typeof SyncLogStatusZ>;

export const SyncTriggerTypeZ: z.ZodEnum<["cron", "admin", "backfill"]>;
export type SyncTriggerType = z.infer<typeof SyncTriggerTypeZ>;

export const SyncLogRecordZ: z.ZodObject<{
  id: z.ZodNumber;
  run_id: typeof NonEmptyStringZ;
  trigger_type: typeof SyncTriggerTypeZ;
  status: typeof SyncLogStatusZ;
  started_at: typeof Iso8601Z;
  finished_at: z.ZodNullable<typeof Iso8601Z>;
  fetched_count: z.ZodNumber;
  upserted_count: z.ZodNumber;
  failed_count: z.ZodNumber;
  retry_count: z.ZodNumber;
  duration_ms: z.ZodNullable<z.ZodNumber>;
  error_reason: z.ZodNullable<z.ZodString>;
}>;
export type SyncLogRecord = z.infer<typeof SyncLogRecordZ>;
```

### 使用例

```ts
import { SyncLogRecordZ, type SyncTriggerType } from "@ubm-hyogo/shared";

const trigger: SyncTriggerType = "cron";
const parsed = SyncLogRecordZ.safeParse(rowFromD1);

if (!parsed.success) {
  throw new Error("sync_job_logs row does not match shared contract");
}
```

### エラーハンドリング

- `SyncLogRecordZ.safeParse()` が失敗した場合、D1 row と shared contract の drift として扱う。
- API handler で parse failure を握りつぶさず、既存 error handler へ渡す。
- `error_reason` は `null` または文字列を許容し、秘匿情報の redact は existing `audit.ts` 側の責務とする。

### エッジケース

- `finished_at` / `duration_ms` は running 中に `null` になり得る。
- `trigger_type` に旧 TS 値 `manual` / `scheduled` が入った row は parse failure とする。
- `sync_jobs` の `succeeded` と `sync_job_logs` の `success` は別契約として扱う。

### 設定項目と定数一覧

| 定数 / 値 | 内容 |
| --- | --- |
| `SyncLogStatusZ` | `running` / `success` / `failed` / `skipped` |
| `SyncTriggerTypeZ` | `cron` / `admin` / `backfill` |
| `DEFAULT_LOCK_TTL_MS` | 既存 `audit.ts` の lock TTL。今回変更しない |
| `SYNC_BATCH_SIZE` | 既存 sync env。今回変更しない |

### テスト構成

| Test | 目的 |
| --- | --- |
| `packages/shared/src/zod/sync-log.spec.ts` | canonical 値、nullable、negative case を固定 |
| `apps/api/src/sync/audit.contract.spec.ts` | `startRun` / `withSyncMutex` が canonical trigger を使うことを確認 |
| `apps/api/src/sync/manual.contract.spec.ts` | manual route が `admin` trigger を使うことを確認 |
| `apps/api/src/sync/scheduled.contract.spec.ts` | scheduled path が `cron` trigger と canonical cursor IN 句を使うことを確認 |

---

### 4. 実行コマンド（step-by-step）

```bash
# Step 1: shared schema
$EDITOR packages/shared/src/zod/sync-log.ts
$EDITOR packages/shared/src/zod/index.ts
mise exec -- pnpm --filter @ubm-hyogo/shared typecheck

# Step 2: shared spec
$EDITOR packages/shared/src/zod/sync-log.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/shared test -- sync-log

# Step 3: apps/api 契約切替
$EDITOR apps/api/src/sync/types.ts

# Step 4: consumer
$EDITOR apps/api/src/sync/audit.ts
$EDITOR apps/api/src/sync/manual.ts
$EDITOR apps/api/src/sync/scheduled.ts
$EDITOR apps/api/src/jobs/sync-sheets-to-d1.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# Step 5: 既存 spec 期待値
$EDITOR apps/api/src/sync/audit.contract.spec.ts
$EDITOR apps/api/src/sync/manual.contract.spec.ts
$EDITOR apps/api/src/sync/scheduled.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync/

# Step 6: 全体 DoD
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/grep-gate.sh
```

---

### 5. DoD（実装完了基準）

- [ ] `sync-log.ts` が §3.1 のコードに一致
- [ ] `index.ts` 末尾に `export * from "./sync-log";`
- [ ] `apps/api/src/sync/types.ts` から独立 literal union 宣言が消滅
- [ ] `audit.ts` から `lockTriggerOf` 削除
- [ ] `manual.ts` / `scheduled.ts` で `withSyncMutex(*, "manual"|"scheduled", ...)` が 0 件
- [ ] `apps/api/src/jobs/sync-sheets-to-d1.ts` の `SyncOptions.trigger` が `SyncTriggerType` 由来
- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm --filter @ubm-hyogo/shared test` で sync-log 20+ 件 green
- [ ] `pnpm --filter @ubm-hyogo/api test -- sync/` 既存 contract spec + 1 拡張 it green
- [ ] grep gate 全 4 種 0 件（Phase 11 §2.5）
- [ ] staging D1 evidence で `trigger_type` ∈ {cron, admin, backfill}（Phase 11 §2.6）

---

### 6. Out of scope（CONST_007）

| 項目 | 分離先 |
|------|-------|
| `sync_jobs`（#195）契約 | 別 issue |
| `sync_job_logs` 物理 rename（U-7） | U-7 別 task |
| `apps/web` admin/audit の shared schema 適用 | 後続 UI 連携 task |
| ESLint custom rule 追加 | 後続 lint 強化 task |
| 物理 DDL 変更 / migration 追加 | 禁止（不変条件 #8） |

---

### 7. トラブルシュート

| 症状 | 対処 |
|------|------|
| `Cannot find module '@ubm-hyogo/shared'` | `mise exec -- pnpm install --filter @ubm-hyogo/shared --filter @ubm-hyogo/api` |
| `SyncLogStatusZ` の subpath export not found | ルート import `@ubm-hyogo/shared` に統一 |
| `withSyncMutex(deps, "manual", ...)` 型エラー | types.ts re-export 反映を確認、必要なら `pnpm install --force` |
| contract spec が `trigger_type === "manual"` 期待で fail | §3.9 置換漏れ。`grep '"manual"\|"scheduled"' apps/api/src/sync/*.spec.ts` で残存検出 |
| cursor SELECT が旧 row を読めず scheduled が全件 re-fetch | staging D1 旧値 row 残存。Phase 11 §5 fallback hybrid IN 句を temporary 適用し、別 task で cleanup |

---

### 8. PR 作成

```bash
gh pr create \
  --base dev \
  --title "feat(issue-266): shared sync 契約型 (SyncLogStatus/SyncTriggerType/SyncLogRecord) の Zod schema 化" \
  --body-file docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-13/pr-body.md
```

Refs #266 / Refs U-UT01-08, U-UT01-10。
