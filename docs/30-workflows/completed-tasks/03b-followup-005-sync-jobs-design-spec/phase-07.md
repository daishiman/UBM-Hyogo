# Phase 7: `sync-forms-responses.ts` / `syncJobs.ts` / `cursor-store.ts` の差し替え

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 既存 3 ファイルの共有 module 経由参照への差し替え |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 6 (`_shared/sync-jobs-schema.ts` 実装) |
| 次 Phase | 8 (`database-schema.md` の参照更新 + 03a/03b spec 参照確認) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

Phase 6 で提供した `_shared/sync-jobs-schema.ts` を call site から参照させる。リテラル散在 3 件を共有定数に置換し、既存テストが破壊されないこと（INV-5）を確認する。

## 実行タスク

1. 7-1: `apps/api/src/repository/syncJobs.ts` の `SyncJobKind` を re-export 化
2. 7-2: `apps/api/src/jobs/sync-forms-responses.ts` の `DEFAULT_LOCK_TTL_MS` を削除し `SYNC_LOCK_TTL_MS` に差し替え
3. 7-3: `apps/api/src/jobs/cursor-store.ts` の `'response_sync'` リテラル + `JSON.parse(...) as ...` を共有 module 経由参照に置換
4. 各 sub-step ごとに `typecheck` + 関連 test を実行し PASS を保つ
5. 既存テスト 3 件（`sync-forms-responses.test.ts` / `sync-sheets-to-d1.test.ts` / `sync-forms-responses.types.test.ts`）の全件 PASS を確認

## 変更対象ファイル

| 種別 | パス | 変更概要 |
| --- | --- | --- |
| 編集 | apps/api/src/repository/syncJobs.ts | `SyncJobKind` ローカル定義を re-export に置換 |
| 編集 | apps/api/src/jobs/sync-forms-responses.ts | `DEFAULT_LOCK_TTL_MS` 削除 / `SYNC_LOCK_TTL_MS` import / `RESPONSE_SYNC` 定数化 |
| 編集 | apps/api/src/jobs/cursor-store.ts | 共有定数化 + `parseMetricsJson` 適用 |

## 詳細手順

### 7-1: `repository/syncJobs.ts`

**Before（line 6 付近）**

```ts
export type SyncJobKind = "schema_sync" | "response_sync";
```

**After**

```ts
export type { SyncJobKind } from "../jobs/_shared/sync-jobs-schema";
```

**検証**

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
rg -n "SyncJobKind" apps/api/src   # 利用箇所が compile error にならないこと
```

### 7-2: `sync-forms-responses.ts`

**Before（line 80 付近）**

```ts
const DEFAULT_LOCK_TTL_MS = 10 * 60 * 1000;
```

**After**

```ts
import {
  SYNC_LOCK_TTL_MS,
  type SyncJobKind,
} from "./_shared/sync-jobs-schema";

const RESPONSE_SYNC: SyncJobKind = "response_sync";
```

`start(dbCtx, "response_sync", ..., DEFAULT_LOCK_TTL_MS)` などの呼び出しを `start(dbCtx, RESPONSE_SYNC, ..., SYNC_LOCK_TTL_MS)` に置換。

**検証**

```bash
rg -n "DEFAULT_LOCK_TTL_MS" apps/api/src/jobs/sync-forms-responses.ts # 0 件
rg -n "SYNC_LOCK_TTL_MS" apps/api/src/jobs/sync-forms-responses.ts  # 1+ 件
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-forms-responses
```

### 7-3: `cursor-store.ts`

**Before（line 19 付近）**

```ts
const result = await db
  .prepare("SELECT metrics_json FROM sync_jobs WHERE job_type = 'response_sync' ORDER BY ...")
  .first<{ metrics_json: string | null }>();
const raw = result?.metrics_json;
const parsed = raw ? (JSON.parse(raw) as { cursor?: string }) : null;
return parsed?.cursor ?? null;
```

**After**

```ts
import {
  SYNC_JOB_TYPES,
  parseMetricsJson,
  responseSyncMetricsSchema,
} from "./_shared/sync-jobs-schema";

const RESPONSE_SYNC = "response_sync" satisfies (typeof SYNC_JOB_TYPES)[number];

const result = await db
  .prepare("SELECT metrics_json FROM sync_jobs WHERE job_type = ? ORDER BY ...")
  .bind(RESPONSE_SYNC)
  .first<{ metrics_json: string | null }>();
const parsed = parseMetricsJson(result?.metrics_json, responseSyncMetricsSchema);
return parsed?.cursor ?? null;
```

**検証**

```bash
rg -n "'response_sync'" apps/api/src/jobs/cursor-store.ts   # 0 件
rg -n "parseMetricsJson" apps/api/src/jobs/cursor-store.ts  # 1+ 件
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-sheets-to-d1
```

## 既存テストの import 経路

- `sync-forms-responses.test.ts` が `DEFAULT_LOCK_TTL_MS` を import している場合は `SYNC_LOCK_TTL_MS` への変更が必要（Phase 5 棚卸し結果に従う）
- `sync-forms-responses.types.test.ts` の `SyncJobKind` 経路は `repository/syncJobs.ts` 経由で互換維持

## 不変条件

- INV-5 既存テスト破壊禁止 → 各 sub-step 後に `pnpm test` を実行
- INV-6 `SyncJobKind` の文字列値（`schema_sync` / `response_sync`）は変更しない

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm lint
```

## DoD

- [ ] `DEFAULT_LOCK_TTL_MS` が `apps/api/src/jobs/sync-forms-responses.ts` で 0 件
- [ ] `SYNC_LOCK_TTL_MS` が `sync-forms-responses.ts` で利用されている
- [ ] `repository/syncJobs.ts` が `_shared/sync-jobs-schema` から re-export している
- [ ] `cursor-store.ts` が `parseMetricsJson` を経由する
- [ ] 既存テスト 3 件全件 PASS
- [ ] typecheck / lint PASS

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | 各 sub-step の diff / test 出力 |
| メタ | artifacts.json | Phase 7 を completed に更新 |

## 統合テスト連携

- 各 sub-step 後に `pnpm test` で回帰確認
- Phase 9 で全体ドライラン

## 完了条件

- [ ] 3 ファイルすべて差し替え完了
- [ ] grep evidence で AC-3 / AC-4 / AC-5 が PASS
- [ ] 既存テスト全 PASS
- [ ] 1 commit（または sub-step 単位 3 commit）にまとまっている

## 次 Phase

- 次: 8（`database-schema.md` 参照更新 + 03a/03b spec 参照確認）
- 引き継ぎ事項: コード差し替え完了状態 / 既存テスト緑
- ブロック条件: 既存テスト fail / 想定外 import 経路の発覚
