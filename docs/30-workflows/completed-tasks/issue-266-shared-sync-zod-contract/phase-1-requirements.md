# Phase 1: 要件定義

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Parent spec: `docs/30-workflows/unassigned-task/U-UT01-10-shared-sync-contract-zod.md`
> visual classification: NON_VISUAL

---

## 1. 真の論点（CONST_005 必須）

### 1.1 表面的な論点

「`packages/shared` に sync 契約型を Zod schema として配置する」。これは元仕様 `U-UT01-10` の見出しそのもので、書けば終わる作業に見える。

### 1.2 実際の論点（本タスクで決着させる本質）

**「shared に置く前に、どの canonical 値を正本として固定するか」** が本タスクの核心。

現コードベースには 2 つの drift が併存する:

1. **物理 vs TS の drift**: 物理 DDL（`apps/api/migrations/0002_sync_logs_locks.sql`）と `apps/api/src/sync/audit.ts` の SQL bind は **`cron|admin|backfill` + `running|success|failed|skipped`** で出荷済み。一方 `apps/api/src/sync/types.ts` の TS `SyncTrigger` は **`manual|scheduled|backfill`** を宣言し、`audit.ts:lockTriggerOf()` で TS→物理に runtime mapping している。
2. **仕様 vs 物理の drift**: 元仕様 `U-UT01-10` は U-8 canonical を **`pending|in_progress|completed|failed` + `manual|cron|backfill`** と想定。物理とも TS とも一致しない。

3 つの値集合が混在する状態で shared 化を進めると、どれを literal union に書いても残り 2 つが drift 源として残る。

### 1.3 本タスクの決着方針

**物理 DDL を canonical として固定する**。理由:

- 物理 DDL は staging / production で既に走っており、変更には migration / データ移行が必要（破壊的変更）
- `apps/api/src/sync/audit.ts` の SQL bind 値（`'running'` / `'success'` / `'failed'` / `'skipped'` の文字列リテラル）も物理一致で既出荷
- TS-only の `SyncTrigger = "manual"|"scheduled"|"backfill"` は **runtime に到達する前に `lockTriggerOf()` で変換**されるため、変更は内部的かつ非破壊
- 元仕様の想定値（`pending`/`in_progress`/...）は **どの runtime にも未到達**で、固定化コストは仕様書改訂のみ

つまり「物理を変えるか TS を変えるか」の選択で、**TS を変えるのが圧倒的に低コストかつ安全**。本タスクは TS 側を物理 canonical に寄せる方向で確定する。

### 1.4 副次論点

- `sync_jobs`（#195）と `sync_job_logs`（UT-09）は **別契約 / 別テーブル / 別 status 集合**。混同しないこと（`sync_jobs.status = "succeeded"` ≠ `sync_job_logs.status = "success"`）
- shared schema 配置は既存 6 ファイル（`primitives` / `field` / `schema` / `response` / `identity` / `viewmodel`）と同列の 7 件目として `sync-log.ts` を新設する。命名 `sync` ではなく `sync-log` にする理由は「`sync_jobs` 契約と将来共存する余地を残す」（拡張時 `sync-job.ts` を別ファイル化可能）

---

## 2. P50 チェック（CONST_005 必須）

> 一般中堅エンジニア（P50）が独力で本仕様書のみから着手できる粒度か。

| 観点 | 判定 | 根拠 |
|------|------|------|
| canonical 値が一意に決まっているか | OK | Phase 1 §1.3 で「物理 DDL を canonical」と確定。Phase 2 §6 で対応表を提示 |
| 修正対象ファイルが列挙されているか | OK | index.md §4 に 11 ファイル列挙 |
| import 経路の置換ルールが明文化されているか | OK | Phase 2 §4 で diff イメージを TypeScript fenced block で提示 |
| ドリフト解消の mapping table が一意か | OK | Phase 2 §5 に `manual→admin` / `scheduled→cron` / `backfill→backfill` を明示 |
| test 観点が網羅されているか | OK | Phase 2 §8 に 8 ケース以上の test 構造を提示 |
| DoD コマンドが具体か | OK | `mise exec -- pnpm typecheck && mise exec -- pnpm lint && mise exec -- pnpm --filter @ubm-hyogo/shared test` |

---

## 3. 背景

### 3.1 現状

`apps/api/src/sync/types.ts` が `SyncTrigger` / `AuditStatus` を独立宣言し、`apps/api/src/sync/audit.ts` 内の `lockTriggerOf()` 関数で `"manual" → "admin"` / `"scheduled" → "cron"` を runtime 変換している。`apps/api/src/sync/scheduled.ts:15` の cursor SELECT では `WHERE trigger_type IN ('manual','scheduled','admin','cron')` という 4 値ハイブリッドの防御的 IN 句が存在し、過去の表記揺れを runtime で吸収している。

### 3.2 問題

- TS 契約と物理 SQL bind 値が一致しないため、新規開発者が `SyncTrigger` を見て「物理 DB にも `manual` / `scheduled` が入っている」と誤解する余地が残る
- `apps/web` 側で sync log を表示する後続タスクが、TS canonical（`manual|scheduled`）と物理 row（`admin|cron`）のどちらに合わせるか自明でない
- `lockTriggerOf()` の存在自体が「TS と物理の不一致を runtime で吸収している」という構造的負債のシグナル

### 3.3 解決の方向性

shared に Zod schema を配置し、**物理 canonical 値**を `SyncLogStatus` / `SyncTriggerType` literal union として固定する。`apps/api/src/sync/types.ts` を shared re-export に置換し、`lockTriggerOf()` を削除する。これにより:

- TS 型 = 物理 SQL bind = shared schema の 3 者一致
- `apps/web` 後続 UI 連携時、shared `SyncLogRecordZ.safeParse(apiResponse)` の単一経路で contract test 可能

---

## 4. ステークホルダー

| 役割 | 関与内容 |
|------|---------|
| 開発者（本タスク実装担当） | Phase 5 で実装、Phase 9 で typecheck / lint / test 通過確認 |
| `apps/api` sync 周辺の後続改修者 | shared `SyncTriggerType` / `SyncLogStatus` を import する経路に統一 |
| `apps/web` admin/audit 画面実装者（後続別 task） | `@ubm-hyogo/shared` 経由で `SyncLogRecordZ.safeParse(apiResponse)` を実施 |
| `sync_jobs`（#195）担当者 | 別契約であることを `out of scope` 明示で confirm |

---

## 5. 機能要件

### FR-1: shared schema 新設

`packages/shared/src/zod/sync-log.ts` を新規作成し、以下 3 種を export:

- `SyncLogStatusZ` = `z.enum(["running", "success", "failed", "skipped"])`
- `SyncTriggerTypeZ` = `z.enum(["cron", "admin", "backfill"])`
- `SyncLogRecordZ` = `z.object({ ... })`（物理 12 カラム）

### FR-2: 型 export は `z.infer` 経路のみ

`type SyncLogStatus = z.infer<typeof SyncLogStatusZ>` 形式で type export し、独立 `type ... = "running" | ...` 宣言を禁止する。

### FR-3: shared `index.ts` への re-export

`packages/shared/src/zod/index.ts` の末尾（7 行目）に `export * from "./sync-log";` を追加。

### FR-4: `apps/api/src/sync/types.ts` の正規化

- `SyncTrigger` を `"cron" | "admin" | "backfill"` へ正規化し、shared `SyncTriggerType` を re-export
- `AuditStatus` を shared `SyncLogStatus` で置換
- `DiffSummary` / `SyncResult` / `AuditDeps` / `SyncEnvBase` は変更しない

### FR-5: consumer 改修

- `apps/api/src/sync/manual.ts`: `withSyncMutex(deps, "manual", ...)` → `withSyncMutex(deps, "admin", ...)`
- `apps/api/src/sync/scheduled.ts`: `withSyncMutex(deps, "scheduled", ...)` → `withSyncMutex(deps, "cron", ...)`、cursor SELECT を `IN ('cron','admin','backfill')` へ簡素化
- `apps/api/src/sync/audit.ts`: `lockTriggerOf()` 関数削除、`startRun` / `withSyncMutex` の `trigger` 引数を直接 bind
- `apps/api/src/sync/index.ts`: re-export 形は変えない（`SyncTrigger` / `AuditStatus` は引き続き読める）

### FR-6: unit test

`packages/shared/src/zod/sync-log.spec.ts` を新規作成し、最低 8 ケースを `vitest` で固定（Phase 2 §8 に詳細）。

---

## 6. 非機能要件

| 項目 | 要件 |
|------|------|
| typecheck | `mise exec -- pnpm typecheck` が green |
| lint | `mise exec -- pnpm lint` が green |
| 既存 test | `apps/api` 既存 test suite が regression を起こさない |
| 新規 test | shared 新規 spec が 8 ケース以上 green |
| Zod overhead | `safeParse` は D1 read 直後（`listRecent`）と境界のみで実施し、内部 pass-through では型のみ使用 |
| 互換性 | runtime に `"manual"` / `"scheduled"` 文字列が D1 binding として残らないこと（grep gate 候補） |

---

## 7. 制約

1. 物理 DDL は **変更しない**（migration 追加禁止）
2. `sync_jobs`（#195）への影響なし。本タスクで `apps/api/src/repository/syncJobs.ts` を触らない
3. `apps/web` 配下を本タスクで触らない（後続 UI 連携 task のスコープ）
4. shared `index.ts` の re-export 順序は既存 6 行末尾に 1 行追加するのみ（既存順序を入れ替えない）
5. test ファイル拡張子は `*.spec.ts` のみ（CLAUDE.md 不変条件 #8）

---

## 8. 受入条件

- [ ] **AC-1**: `packages/shared/src/zod/sync-log.ts` が新規作成され、`SyncLogStatusZ` / `SyncTriggerTypeZ` / `SyncLogRecordZ` の 3 schema と `z.infer` 由来 3 型を export している
- [ ] **AC-2**: `packages/shared/src/zod/index.ts` が `export * from "./sync-log";` を含む（7 行目）
- [ ] **AC-3**: `apps/api/src/sync/types.ts` の `SyncTrigger` / `AuditStatus` が shared re-export に置換され、独立 literal union 宣言が消えている
- [ ] **AC-4**: `apps/api/src/sync/audit.ts` から `lockTriggerOf()` 関数が削除され、`startRun` / `withSyncMutex` が trigger 値を直接 bind している
- [ ] **AC-5**: `apps/api/src/sync/manual.ts` / `scheduled.ts` が `"admin"` / `"cron"` 値を使用している（grep で `"manual"` / `"scheduled"` が runtime 経路に残らない）
- [ ] **AC-6**: `packages/shared/src/zod/sync-log.spec.ts` が 8 ケース以上を含み、`pnpm --filter @ubm-hyogo/shared test` で全件 green
- [ ] **AC-7**: `mise exec -- pnpm typecheck && mise exec -- pnpm lint` が green
- [ ] **AC-8**: `apps/api` 既存 contract test（`audit.contract.spec.ts` / `manual.contract.spec.ts` / `scheduled.contract.spec.ts` / `backfill.contract.spec.ts`）が regression なく green

---

## 9. リスク

| リスク | 影響 | 対策 |
|------|------|------|
| `scheduled.ts` cursor SELECT を `IN ('cron','admin','backfill')` に簡素化した結果、過去 row（`'manual'` / `'scheduled'` 値）が cursor 計算から漏れる | scheduled 同期の cursor が古い row を読み戻し、過剰再 fetch | staging D1 で `SELECT DISTINCT trigger_type FROM sync_job_logs` を Phase 11 手動 test で確認。古い値が残っていれば `IN ('cron','admin','backfill','manual','scheduled')` の hybrid を temporary 維持し、後続 task で cleanup |
| `lockTriggerOf()` 削除により、外部呼び出し元が `"manual"` を渡したケースが silent fail | `withSyncMutex` 呼び出しで型エラー | TS 側で `SyncTrigger` literal union 制約により compile-time 検出。外部 admin route が JSON body から trigger 値を受ける箇所は zod parse で reject |
| shared schema の `SyncLogRecordZ` が物理 row と field 名・null 許容で不一致 | `listRecent` の `safeParse` が production で failure | Phase 2 §2 で物理 DDL 12 カラムと 1:1 写像、null 許容を `finished_at` / `duration_ms` / `error_reason` の 3 件に限定 |
| `z.infer` 由来型と既存 `AuditRow` / `SyncResult` 型の構造ずれ | typecheck error | `AuditRow` は application 層 camelCase であり、shared `SyncLogRecord` は物理 snake_case。両者を区別して保持（Phase 2 §3 で配置設計） |
| `sync_jobs`（#195）担当者が本タスクの shared schema を誤って流用 | 別契約の drift | index.md `out of scope` 明示 + Phase 1 §1.4 副次論点で警告 |
| pnpm workspace の `@ubm-hyogo/shared` ↔ `apps/api` 間の型解決遅延 | typecheck で stale cache | DoD で `pnpm install --force` を実施しない方針だが、CI 上 `pnpm install` が走るため問題なし |
