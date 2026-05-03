# Phase 2: 設計（_shared/sync-jobs-schema.ts API + _design schema 設計）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（`_shared/sync-jobs-schema.ts` API + `_design/sync-jobs-spec.md` schema 設計） |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (実装計画) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

`apps/api/src/jobs/_shared/sync-jobs-schema.ts` の export 一覧・関数シグネチャ・入出力契約と、`_design/sync-jobs-spec.md` 側の章立て / schema 設計を確定する。実体ファイルは Phase 6 で初版作成するため、本 Phase は設計のみ。

## 実行タスク

1. `_shared/sync-jobs-schema.ts` の export 一覧（const / type / schema / function）確定
2. 各 export の関数シグネチャ・入出力・例外契約を記述
3. `_design/sync-jobs-spec.md` 章立てと TS 正本リンク注記の差分確定
4. PII 検出ロジック（`PII_FORBIDDEN_KEYS` + email 形式値検出）の判定基準確定
5. `parseMetricsJson` の失敗時挙動（null fallback）と利用ガイド確定
6. 既存 import 経路（`SyncJobKind`）の後方互換戦略確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/03b-followup-005-sync-jobs-design-spec/phase-01.md | AC 11 件 / 不変条件 6 件 |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | `DEFAULT_LOCK_TTL_MS` の値（10*60*1000） |
| 必須 | apps/api/src/repository/syncJobs.ts | `SyncJobKind = "schema_sync" \| "response_sync"` |
| 必須 | apps/api/src/jobs/cursor-store.ts | metrics_json 読み取り箇所 |
| 必須 | apps/api/package.json | `zod` 既存導入の確認 |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | markdown 論理正本（章立て準拠） |

## 設計

### `apps/api/src/jobs/_shared/sync-jobs-schema.ts` API 契約

```ts
import { z } from "zod";

// ── job_type enum 正本 ──────────────────────────
export const SYNC_JOB_TYPES = ["schema_sync", "response_sync"] as const;
export type SyncJobKind = (typeof SYNC_JOB_TYPES)[number];

// ── lock TTL 正本 ──────────────────────────────
export const SYNC_LOCK_TTL_MINUTES = 10;
export const SYNC_LOCK_TTL_MS = SYNC_LOCK_TTL_MINUTES * 60 * 1000; // 600_000

// ── metrics_json 共通 schema ───────────────────
export const metricsJsonBaseSchema = z
  .object({
    cursor: z.string().optional(),
    processed_count: z.number().int().nonnegative().optional(),
    write_count: z.number().int().nonnegative().optional(),
    error_count: z.number().int().nonnegative().optional(),
    skipped: z.union([z.literal(0), z.literal(1)]).optional(),
    lock_acquired_at: z.string().optional(),
  })
  .passthrough();

export const schemaSyncMetricsSchema = metricsJsonBaseSchema.extend({
  write_count: z.number().int().nonnegative(),
});

export const responseSyncMetricsSchema = metricsJsonBaseSchema.extend({
  cursor: z.string(),
});

// ── PII 不混入ガード ───────────────────────────
export const PII_FORBIDDEN_KEYS = [
  "email",
  "responseEmail",
  "name",
  "fullName",
  "phone",
  "address",
  "answers",
  "raw",
  "value",
] as const;

export function assertNoPii(metrics: Record<string, unknown>): void;

// ── metrics_json パース ─────────────────────────
export function parseMetricsJson<S extends z.ZodTypeAny>(
  raw: string | null | undefined,
  schema: S,
): z.infer<S> | null;
```

### 関数契約

#### `assertNoPii(metrics)`

- 入力: `Record<string, unknown>`（`metrics_json` パース後オブジェクト）
- 例外: 以下いずれかで `Error` を throw
  - キーが `PII_FORBIDDEN_KEYS` に含まれる
  - 値が文字列で email 形式（`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`）に一致
- 戻り値: `void`（成功時は何も返さない）

#### `parseMetricsJson(raw, schema)`

- 入力: `raw: string | null | undefined`、`schema: z.ZodTypeAny`
- 処理: `JSON.parse` で例外発生 → `null`、`schema.safeParse` 失敗 → `null`
- 戻り値: 成功時は `z.infer<S>`、失敗時 `null`
- 副作用: なし（throw しない）

### `_design/sync-jobs-spec.md` 差分追記設計

- §3（job_type enum）末尾に追記:
  > **TS ランタイム正本**: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `SYNC_JOB_TYPES` を一次正本とする。enum 追加時は本ファイル → TS 正本の順で同期する。
- §5（metrics_json schema）末尾に追記:
  > **TS ランタイム正本**: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `metricsJsonBaseSchema` / `schemaSyncMetricsSchema` / `responseSyncMetricsSchema`。本 markdown を論理正本、TS を実装正本とし、差分が出たら markdown → TS の順で同期する。
- lock TTL 章: `SYNC_LOCK_TTL_MS = 10 * 60 * 1000`（`SYNC_LOCK_TTL_MINUTES = 10`）を TS 正本として明記。

### 既存 `SyncJobKind` の後方互換戦略

- `apps/api/src/repository/syncJobs.ts` から `SyncJobKind` を delete し、`export type { SyncJobKind } from "../jobs/_shared/sync-jobs-schema";` に置換
- 既存 import 経路（`from "../repository/syncJobs"`）はそのまま維持されるため、call site の編集不要

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | API 契約 / `_design/` 注記 / 後方互換戦略 |
| メタ | artifacts.json | Phase 2 を completed に更新 |

## 統合テスト連携

- Phase 6 で実装後に `vitest` で `_shared/sync-jobs-schema.test.ts` を実行する設計を記述
- Phase 9 で全体 typecheck / lint / test を実行

## 完了条件

- [ ] `_shared/sync-jobs-schema.ts` の export 一覧と契約が確定
- [ ] `assertNoPii` / `parseMetricsJson` のシグネチャ・例外契約が確定
- [ ] `_design/sync-jobs-spec.md` への差分追記文面が確定
- [ ] `SyncJobKind` 後方互換戦略が記述されている
- [ ] PII 検出基準（禁止キー + email 値）が確定

## 次 Phase

- 次: 3（実装計画 — 変更ファイル 4 件 + 順序 + zod 依存確認）
- 引き継ぎ事項: API 契約 / `_design/` 差分文面 / 後方互換戦略
- ブロック条件: zod が未導入かつ追加が許可されない / `SyncJobKind` の値が後方互換できない
