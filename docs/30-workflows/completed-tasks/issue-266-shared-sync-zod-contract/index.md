# issue-266-shared-sync-zod-contract

> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266) `[U-UT01-10] shared sync 契約型（SyncLogStatus / SyncTriggerType / SyncLogRecord）の Zod schema 化`
> Parent spec: `docs/30-workflows/unassigned-task/U-UT01-10-shared-sync-contract-zod.md`
> implementation_mode: `implemented_local_runtime_pending`
> task classification: code task（TypeScript / Zod schema 新規 + 既存 `apps/api/src/sync/types.ts` の import 経路改修）
> visual classification: NON_VISUAL（UI/UX 変更なし。`packages/shared` の契約面と `apps/api` 内部型のみ）
> 実装区分: **実装仕様書**

---

## 1. 概要

`packages/shared/src/zod/` に `sync-log.ts` を新設し、Sheets→D1 同期ジョブの実行ログ契約（`SyncLogStatus` / `SyncTriggerType` / `SyncLogRecord`）を Zod schema として一意の正本化する。同時に `apps/api/src/sync/types.ts` が独立宣言している `SyncTrigger` / `AuditStatus` を shared 由来へ統合し、`manual|scheduled` → `cron|admin` の表記ドリフトを構造的に解消する。

### 根本最適化方針（CONST_005 §「真の論点」反映）

元仕様 `U-UT01-10` は U-8 canonical を `pending|in_progress|completed|failed` + `manual|cron|backfill` と想定していたが、現コードベースの物理 DDL（`apps/api/migrations/0002_sync_logs_locks.sql`）と稼働中の `apps/api/src/sync/audit.ts` は既に別値（`running|success|failed|skipped` + `cron|admin|backfill`）で出荷済みである。本タスクでは **物理実態を canonical として shared 化** する。Phase 1 §「真の論点」と Phase 2 §「正本値の決定根拠」で migration 回避と契約凍結の理由を明記する。

### in scope（今回サイクル 1 PR で完了させる）

1. `packages/shared/src/zod/sync-log.ts` 新規作成
   - `SyncLogStatusZ = z.enum(["running", "success", "failed", "skipped"])`
   - `SyncTriggerTypeZ = z.enum(["cron", "admin", "backfill"])`
   - `SyncLogRecordZ = z.object({ ... })`（物理 12 カラム = `id` / `run_id` / `trigger_type` / `status` / `started_at` / `finished_at` / `fetched_count` / `upserted_count` / `failed_count` / `retry_count` / `duration_ms` / `error_reason`）
   - `z.infer` 由来で `SyncLogStatus` / `SyncTriggerType` / `SyncLogRecord` を type export
2. `packages/shared/src/zod/index.ts` に `export * from "./sync-log";` を追加（既存 6 行末尾 = 7 行目）
3. `apps/api/src/sync/types.ts` の改修
   - `SyncTrigger` enum を `"manual" | "scheduled" | "backfill"` から `"cron" | "admin" | "backfill"` へ正規化し、shared `SyncTriggerType` を re-export
   - `AuditStatus` を shared `SyncLogStatus` で置換
   - `DiffSummary` / `SyncResult` / `AuditDeps` / `SyncEnvBase` は本タスクのスコープ外として保持
4. consumer 改修（`apps/api/src/sync/audit.ts` / `apps/api/src/sync/manual.ts` / `apps/api/src/sync/scheduled.ts` / `apps/api/src/sync/backfill.ts` / `apps/api/src/jobs/sync-sheets-to-d1.ts`）
   - `withSyncMutex(auditDeps, "manual", ...)` → `withSyncMutex(auditDeps, "admin", ...)`
   - `withSyncMutex(auditDeps, "scheduled", ...)` → `withSyncMutex(auditDeps, "cron", ...)`
   - `audit.ts` 内の `lockTriggerOf()` mapping 関数は不要化し削除
   - `scheduled.ts` の cursor SELECT は local write を canonical 化しつつ、staging D1 distinct evidence 取得まで `WHERE trigger_type IN ('cron','admin','backfill','manual','scheduled')` の互換句を維持
5. unit test 追加 `packages/shared/src/zod/sync-log.spec.ts`（最低 8 ケース）
6. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / 既存 `apps/api` test suite を通過

### out of scope（CONST_007 例外として明示）

| 項目 | 理由 | 実施先 |
|------|------|--------|
| `apps/api/src/repository/syncJobs.ts` の `SyncJobStatus = "running"\|"succeeded"\|"failed"` 統合 | `sync_jobs` テーブル（issue #195 由来）は別契約。`sync_job_logs` と物理テーブル・status enum 値が異なる | 別 issue（#195 系後続 task） |
| 物理テーブル名 `sync_job_logs` → `sync_log` リネーム（U-7） | migration とデータ移行コストが本タスクの SRP を超える | 別 issue（U-7 完了 task） |
| `apps/web` 管理 UI（admin/audit）の shared schema 経由 `safeParse` 強制 | UI 側 fetch hook の改修と E2E test を伴うため別 PR | 別 issue（後続 UI 連携 task） |
| `processed_offset` / `idempotency_key` / `lock_expires_at` 等、`sync_job_logs` に物理存在しないカラムの schema 化 | 物理 DDL に存在しない field の契約化は drift 源 | 別 issue（U-9 完了後の DDL 追加と同 PR で実施） |
| ESLint plugin による `apps/api` 内独立 enum 定義の構造的禁止 | 本 PR では grep gate（CI script）で代替し、ESLint custom rule は次サイクル | 後続 lint 強化 task |

---

## 2. Phase 一覧

| Phase | 名称 | ステータス | 成果物 |
|-------|------|----------|--------|
| 1 | 要件定義 | completed | [`phase-1-requirements.md`](./phase-1-requirements.md) |
| 2 | 設計 | completed | [`phase-2-design.md`](./phase-2-design.md) |
| 3 | 設計レビュー | completed | [`phase-3-design-review.md`](./phase-3-design-review.md) |
| 4 | テスト計画 | completed | `phase-4-test-plan.md` |
| 5 | 実装 | completed | `phase-5-implementation.md` |
| 6 | テスト拡充 | completed | `phase-6-test-additions.md` |
| 7 | カバレッジ確認 | completed | `phase-7-coverage.md` |
| 8 | リファクタリング | completed | `phase-8-refactor.md` |
| 9 | 品質保証 | completed | `phase-9-qa.md` |
| 10 | 最終レビュー | completed | `phase-10-final-review.md` |
| 11 | 手動テスト（NON_VISUAL） | runtime_pending | `phase-11-manual-test.md` |
| 12 | ドキュメント更新 | completed | `phase-12-documentation.md` |
| 13 | PR 作成 | runtime_pending | `phase-13-pr.md` |

---

## 3. 不変条件

1. canonical status 値は **`running` / `success` / `failed` / `skipped`** の 4 値（物理 DDL 一致）
2. canonical trigger 値は **`cron` / `admin` / `backfill`** の 3 値（物理 `sync_locks.trigger_type` コメントと `lockTriggerOf()` 出力一致）
3. `SyncLogRecord` の field 命名は **物理層 snake_case 維持**（D1 read 直後の row を `safeParse` 可能にするため）。camelCase 変換は `apps/api/src/sync/audit.ts:listRecent` の application 層 mapper が責務
4. Zod schema → 型は **`z.infer` 経路のみ**。独立 `type SyncLogRecord = { ... }` 宣言を禁止
5. `apps/api/src/sync/types.ts` から `SyncTrigger` / `AuditStatus` の独立 literal union 宣言を削除し、shared 由来 re-export のみに統一
6. `apps/web` から `apps/api/**` への deep import は引き続き禁止（task-02 不変条件継承）
7. `sync_jobs` テーブル（issue #195）と `sync_job_logs` テーブル（UT-09）は別契約。本タスクは後者のみ
8. 物理 DDL の変更・migration 追加は行わない（DDL drift 解消ではなく TS 契約面の drift 解消が本タスクの SRP）
9. `pnpm typecheck` / `pnpm lint` が green であること（DoD）

---

## 4. 主要関連ファイル

| パス | 役割 |
|------|------|
| `packages/shared/src/zod/sync-log.ts` | **新規作成**。Zod schema + `z.infer` 型 export |
| `packages/shared/src/zod/sync-log.spec.ts` | **新規作成**。8 ケース以上の unit test |
| `packages/shared/src/zod/index.ts` | re-export 行追加（1 行） |
| `apps/api/src/sync/types.ts` | `SyncTrigger` / `AuditStatus` を shared re-export に置換 |
| `apps/api/src/sync/index.ts` | type re-export の参照経路維持確認 |
| `apps/api/src/sync/audit.ts` | `lockTriggerOf()` 削除、trigger 値直接利用 |
| `apps/api/src/sync/manual.ts` | `"manual"` → `"admin"` |
| `apps/api/src/sync/scheduled.ts` | `"scheduled"` → `"cron"`、cursor SELECT 簡素化 |
| `apps/api/src/sync/backfill.ts` | `"backfill"` 維持確認 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | trigger 値 binding 経路の整合確認 |
| `apps/api/migrations/0002_sync_logs_locks.sql` | **参照のみ（変更しない）**。canonical 値の物理 source of truth |

---

## 5. 関連 Issue / PR / Spec

| 種別 | リンク / パス | 状態・関係 |
|------|---------------|-----------|
| 本タスク Issue | [#266](https://github.com/daishiman/UBM-Hyogo/issues/266) | CLOSED（PR 文脈は `Refs #266` のみ。再 close しない） |
| 元仕様（unassigned-task 原典） | `docs/30-workflows/unassigned-task/U-UT01-10-shared-sync-contract-zod.md` | 本タスクで formalize |
| 関連別契約 Issue | [#195](https://github.com/daishiman/UBM-Hyogo/issues/195) `sync_jobs` テーブル | スコープ外。混同防止のため明示 |
| 親 workflow（UT-01） | `docs/30-workflows/ut-01-sheets-d1-sync-design/` | 設計コンテキスト |
| 上流 unassigned task | `docs/30-workflows/unassigned-task/U-UT01-07-sync-log-physical-name.md`（U-7） | 物理名 rename は別 task |
| 上流 unassigned task | `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md`（U-8） | 本タスクで物理実態を canonical 化することで実質吸収 |
| 上流 unassigned task | `docs/30-workflows/unassigned-task/U-UT01-09-retry-offset-resume.md`（U-9） | retry / offset 制約値は本タスクで触らない |
| 既存 Zod 採用先行事例 | `docs/30-workflows/completed-tasks/01b-parallel-zod-view-models-and-google-forms-api-client/index.md` | 配置パターンの模倣元 |

---

## 6. 実装区分判定根拠（CONST_004）

- 本タスクは TypeScript / Zod のコード追加 + 既存 import 経路改修を含む **実装仕様書**。docs-only ではない。
- 元仕様 `U-UT01-10` は `taskType=docs-only-contract` だったが、起票時の前提（U-7/U-8/U-9 未確定）が本タスク時点で「物理 DDL が canonical として既出荷」という事実により実質確定したため、実装着手可能。
- 物理 DDL を canonical として採用することで migration 回避し、`apps/api/src/sync/types.ts` の TS-only 契約面のみを修正する範囲に抑える。

## 7. CONST_007 スコープ判定

- Phase 1-13 を今回の実装プロンプト 1 サイクルで完了する設計。
- `sync_jobs` 統合 / 物理 rename / UI 連携は技術的整合性破綻（別契約 / migration / E2E 影響）に該当するため **未タスク化** へ分離。
- それ以外（shared schema 新規、`apps/api/src/sync/` 配下の trigger 値正規化、unit test、typecheck/lint 通過）は本サイクルで完結。
