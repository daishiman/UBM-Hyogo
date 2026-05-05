# sync-module-design.md（apps/api/src/sync/* モジュール設計）

> 状態: completed-design
> 上位仕様: `../../phase-02.md` / `outputs/phase-02/main.md`
> 関連: `audit-writer-design.md` / `cron-config.md` / `d1-contract-trace.md`

## 1. モジュールツリー

```
apps/api/src/sync/
├── index.ts              # Hono router mount + scheduled export wrapper
├── manual.ts             # POST /admin/sync/run handler（互換: POST /admin/sync）
├── scheduled.ts          # Workers scheduled() handler（全件 upsert sync）
├── backfill.ts           # POST /admin/sync/backfill handler（truncate-and-reload）
├── audit.ts              # sync_audit writer（startRun / finishRun / failRun / skipRun + GET handler）
├── sheets-client.ts      # Workers 互換 fetch + JWT（crypto.subtle）で Sheets API 呼び出し
├── mapping.ts            # Sheets row → stableKey → D1 row への正規化（form_field_aliases 駆動）
├── upsert.ts             # member_responses / member_identities / member_status の upsert 実装
├── mutex.ts              # sync_locks 単文 INSERT 排他（既存 jobs/sync-lock.ts と同等インターフェース）
└── types.ts              # SyncTrigger / AuditRow / DiffSummary / DI 型
```

`apps/api/src/sync/index.ts` の export hub:

```ts
// 概念的な型シグネチャ（実装は後続 Phase）
export { syncRouter } from "./manual"; // と backfill / audit を集約
export { runScheduledSync } from "./scheduled";
export type { SyncTrigger, SyncResult, AuditRow, DiffSummary } from "./types";
```

`apps/api/src/index.ts` への接続（cron-config.md §3）:

```ts
import { syncRouter, runScheduledSync } from "./sync";

app.route("/admin", syncRouter); // /admin/sync/run, /admin/sync/backfill, /admin/sync/audit

export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => {
    ctx.waitUntil(runScheduledSync(env));
  },
};
```

## 2. handler 設計

### 2.1 manual.ts

```ts
// 型シグネチャ（擬似）
export interface ManualSyncDeps {
  db: D1Database;
  sheets: SheetsClient;
  mapping: MappingResolver;
  audit: AuditWriter;
  now: () => Date;
}

export type ManualSyncRequest = { mode?: "delta" | "full" }; // 既定 full
export type ManualSyncResponse =
  | { ok: true; auditId: string; result: SyncResult }
  | { ok: false; error: "unauthorized" | "conflict" | "internal"; auditId?: string };

// route: POST /admin/sync/run
//   1. requireSyncAdmin (SYNC_ADMIN_TOKEN Bearer) を通過
//   2. audit.startRun({ trigger: "manual" }) → auditId 取得 / mutex 取得
//      - 失敗時: 409 + { ok: false, error: "conflict", auditId }
//   3. sheets.fetchAll() (full) または fetchDelta(cursor) (delta) を呼ぶ
//   4. row ごとに mapping → upsert.upsertResponseBundle
//   5. audit.finishRun(auditId, summary) または failRun(auditId, reason)
//   6. 200 { ok: true, auditId, result } を返却
```

互換 mount:
- `POST /admin/sync` も同 handler を mount（既存 e2e / smoke 影響回避）
- Phase 12 で deprecation 通知 → 後続タスクで削除

### 2.2 scheduled.ts

```ts
export interface ScheduledSyncDeps extends ManualSyncDeps {
  cursorReader: () => Promise<string | null>; // sync_job_logs.finished_at(success) max
}

export async function runScheduledSync(env: SyncEnv, deps?: Partial<ScheduledSyncDeps>): Promise<void> {
  // 1. audit.startRun({ trigger: "scheduled" })
  //    - mutex 取得失敗時は skipRun で記録、return
  // 2. cursor = await cursorReader()
  // 3. rows = sheets.fetchDelta(cursor)  // submittedAt >= cursor を含めて取得
  // 4. row ごとに mapping + upsert（manual と同経路）
  // 5. audit.finishRun / failRun
}
```

scheduled handler は HTTP 経路を持たず、Workers の `scheduled` event handler 経由でのみ起動する。

### 2.3 backfill.ts

```ts
export interface BackfillDeps extends ManualSyncDeps {}

// route: POST /admin/sync/backfill
//   1. requireSyncAdmin
//   2. audit.startRun({ trigger: "backfill" })
//   3. db.batch([
//        truncate member_responses,
//        truncate member_identities,
//        // member_status は consent 列のみ後段で reset（admin 列は触らない）
//        ...sheets.fetchAll() の row 群を順次 upsert する prepared statements
//      ])
//   4. consent snapshot を current response から member_status.public_consent / rules_consent に反映
//   5. audit.finishRun / failRun
```

**admin 列ガード**: backfill は `member_status.publish_state` / `is_deleted` / `hidden_reason` / `meeting_sessions` / `member_attendance` / `member_tags` / `tag_assignment_queue` / `magic_tokens` に **書き込みも DELETE も行わない**。upsert.ts の SQL は `INSERT ... ON CONFLICT(member_id) DO UPDATE SET public_consent=..., rules_consent=...` の形で consent 列のみを更新句に含める（Phase 4 で contract test 化）。

D1 batch transaction 制約: D1 は `db.batch([...])` で単一トランザクション化される。`BEGIN/COMMIT` 直書きはサポートされないため、batch API 経由で原子性を担保する。50 名 MVP では数十件規模のため CPU 10ms 内に収まる想定だが、超過する場合は Phase 5 で chunk 分割に変更（Q2 / NO-GO 条件）。

### 2.4 audit.ts（GET handler）

```ts
// route: GET /admin/sync/audit?limit=N (default 20, max 100)
//   1. requireSyncAdmin
//   2. SELECT * FROM sync_job_logs ORDER BY started_at DESC LIMIT :limit
//   3. 200 { items: AuditRow[] }
```

writer 部の詳細は `audit-writer-design.md` 参照。

## 3. upsert.ts（共通 upsert）

```ts
export interface UpsertResponseBundleInput {
  responseId: string;
  responseEmail: string; // 小文字正規化済
  submittedAt: string;
  formId: string;
  revisionId: string;
  schemaHash: string;
  editResponseUrl?: string;
  answersByStableKey: Record<string, unknown>;
  rawAnswersByQuestionId: Record<string, unknown>;
  extraFields: Record<string, unknown>;
  unmappedQuestionIds: string[];
  publicConsent: ConsentStatus;
  rulesConsent: ConsentStatus;
  searchText: string;
}

export type UpsertCounts = {
  inserted: number;
  updated: number;
  skipped: number;
};

export async function upsertResponseBundle(
  db: D1Database,
  input: UpsertResponseBundleInput,
): Promise<UpsertCounts>;
```

実装ポイント:
- `member_responses`: PK=`response_id` の upsert（既存 `apps/api/src/jobs/sync-sheets-to-d1.ts` の `upsertMembers` と同等 SQL）
- `member_identities`: UNIQUE=`response_email`、`current_response_id` は `decideShouldUpdate` 相当（既存 `sync-forms-responses.ts` のロジックを mapping.ts 側で再利用）
- `member_status`: `INSERT ... ON CONFLICT(member_id) DO UPDATE SET public_consent=excluded.public_consent, rules_consent=excluded.rules_consent`（admin 列は更新句に含めない）
- 冪等性: AC-6（responseId upsert）

## 4. sheets-client.ts

```ts
export interface SheetsClient {
  fetchAll(range: string): Promise<SheetsValueRange>;
  fetchDelta(cursor: string | null, range: string): Promise<SheetsValueRange>;
}

export interface SheetsClientDeps {
  spreadsheetId: string;
  serviceAccountJson: string;
  fetchImpl?: typeof fetch;
}

export function createSheetsClient(deps: SheetsClientDeps): SheetsClient;
```

実装ポイント:
- 既存 `apps/api/src/jobs/sheets-fetcher.ts` の `GoogleSheetsFetcher` をベースに、`fetchAll` / `fetchDelta` インターフェースに整える
- `crypto.subtle` RS256 JWT 署名（既存実装で動作実績あり、AC-10）
- `fetchDelta` の差分判定はクライアント側で `submittedAt >= cursor` フィルタ（Sheets API は時刻 query 非対応のため fetch 後に絞り込む。50 名規模では全件 fetch + filter で十分）
- Workers `googleapis` 禁止（不変条件 #6 / AC-10）

## 5. mapping.ts

```ts
export interface MappingResolver {
  mapRow(row: string[], header: string[]): MappedResponse;
}

export interface MappedResponse {
  responseId: string;
  responseEmail: string;
  submittedAt: string;
  answersByStableKey: Record<string, unknown>;
  rawAnswersByQuestionId: Record<string, unknown>;
  extraFields: Record<string, unknown>;
  unmappedQuestionIds: string[];
  publicConsent: ConsentStatus;
  rulesConsent: ConsentStatus;
}

export type ConsentStatus = "consented" | "declined" | "unknown";
```

実装ポイント:
- header → stableKey 変換は `form_field_aliases` テーブル（reader）と `apps/api/src/jobs/mappers/sheets-to-members.ts` の既存 mapping を統合。**コード固定ではなく `form_field_aliases` の alias テーブル駆動**（不変条件 #1）
- 既存 `apps/api/src/jobs/mappers/` の純粋関数を `apps/api/src/sync/mapping.ts` に再構成（コードコピーではなく re-export → Phase 9 で物理移動）
- 未知 questionId は `extraFields` / `unmappedQuestionIds` に退避（schema diff queue 連携は本タスク対象外、03b owner）
- consent は `publicConsent` / `rulesConsent` のみ受理。それ以外は `unknown` に正規化（AC-11）
- `responseEmail` は **小文字正規化**（不変条件 #3 / data-contract.md §3.1）

## 6. error handling / backoff

```ts
export interface BackoffConfig {
  maxRetries: 3;       // AC-12
  baseMs: 500;
  factor: 4;           // 500ms → 2s → 8s
  retryOn: (err: unknown) => boolean; // 429 / 5xx / network
}
```

- Sheets API 429 / 5xx: exponential backoff、最大 3 回（AC-12）
- 超過時: audit row を `failed` で finalize、`failed_reason` に redacted error message を 1000 文字以内で記録
- `try / finally` で audit `running` row を必ず finalize（TECH-M-03）

## 7. 既存 jobs/ との対応（DD-07）

| 既存ファイル | 移行先 | 移行戦略 |
| --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` `runSync` | `apps/api/src/sync/manual.ts` / `scheduled.ts` / `backfill.ts` に責務分離移植 | Phase 5 で新 sync/ を実装、jobs/ は薄い deprecation re-export として 1 phase 維持。Phase 9 で削除候補 |
| `apps/api/src/jobs/sync-lock.ts` | `apps/api/src/sync/mutex.ts` | インターフェース継承、export を mutex.ts に移動 |
| `apps/api/src/jobs/sheets-fetcher.ts` | `apps/api/src/sync/sheets-client.ts` | `GoogleSheetsFetcher` クラスを `createSheetsClient` factory に整形 |
| `apps/api/src/jobs/mappers/sheets-to-members.ts` | `apps/api/src/sync/mapping.ts` | re-export → Phase 9 物理移動 |
| `apps/api/src/jobs/sync-forms-responses.ts` | **対象外**（Forms API 系、独自 ledger）| 触らない（DD-08）|
| `apps/api/src/routes/admin/sync.ts` | `apps/api/src/sync/manual.ts` 経由の `syncRouter` | `/admin/sync` 互換 mount + `/admin/sync/run` 正本（DD-09）|

## 8. AC trace

| AC | 反映箇所 |
| --- | --- |
| AC-1 | §1 |
| AC-2 | §2.1 |
| AC-3 | §2.2 |
| AC-4 | §2.3 admin 列ガード / §3 upsert SQL |
| AC-5 | §2.1〜§2.3 のフロー / audit-writer-design.md |
| AC-6 | §3 upsert（responseId PK）|
| AC-7 | audit-writer-design.md §4（mutex）|
| AC-8 | §5 mapping / d1-contract-trace.md |
| AC-9 | §1（apps/api 配置）|
| AC-10 | §4 sheets-client（fetch + crypto.subtle）|
| AC-11 | §5 consent 正規化 |
| AC-12 | §6 backoff |
