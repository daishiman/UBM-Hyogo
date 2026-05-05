# Phase 4: 実装計画（コード + ドキュメント編集計画）

[実装区分: 実装仕様書]
判定根拠: 今回サイクルでコード追加（`apps/api/src/jobs/_shared/` skeleton + tests + CODEOWNERS 行）を含むため、計画 Phase もこれを反映する。

## メタ情報

| Phase | 4 / 13 |
| --- | --- |
| 前 Phase | 3（設計レビュー） |
| 次 Phase | 5（実装＝コード + ドキュメント編集） |
| 状態 | completed |

## サブタスク分解

| ID | 名称 | 種別 | 対象パス | 依存 |
| --- | --- | --- | --- | --- |
| T1 | `apps/api/src/jobs/_shared/` ディレクトリ作成 | mkdir | `apps/api/src/jobs/_shared/` | なし |
| T2 | `ledger.ts` 作成（re-export facade） | new file | `apps/api/src/jobs/_shared/ledger.ts` | T1 |
| T3 | `sync-error.ts` 作成（union 型 + 関数 2 個） | new file | `apps/api/src/jobs/_shared/sync-error.ts` | T1 |
| T4 | `index.ts` 作成（barrel） | new file | `apps/api/src/jobs/_shared/index.ts` | T2, T3 |
| T5 | `__tests__/ledger.test.ts` 作成 | new file | `apps/api/src/jobs/_shared/__tests__/ledger.test.ts` | T2 |
| T6 | `__tests__/sync-error.test.ts` 作成 | new file | `apps/api/src/jobs/_shared/__tests__/sync-error.test.ts` | T3 |
| T7 | `.github/CODEOWNERS` 編集（path 行追加） | edit | `.github/CODEOWNERS` | T1 |
| T8 | owner 表 markdown 表現更新 | edit | `docs/30-workflows/_design/sync-shared-modules-owner.md` | T2, T3, T4 |
| T9 | 03a index.md にリンク追記（既存維持） | edit | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | T8 |
| T10 | 03b index.md にリンク追記（既存維持） | edit | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | T8 |

## CONST_005 必須項目（実装計画）

### 変更対象ファイル一覧と種別

上記サブタスク表参照。新規 5、編集 4（CODEOWNERS / owner 表 / 03a / 03b）。

### 関数・型シグネチャ

`ledger.ts`:

```ts
/**
 * sync_jobs ledger 共有ファサード。
 * owner: 03a / co-owner: 03b
 * owner 表: docs/30-workflows/_design/sync-shared-modules-owner.md
 * 本体実装は apps/api/src/repository/syncJobs.ts に存在。
 */
export {
  start, succeed, fail, findLatest, listRecent,
  IllegalStateTransition, SyncJobNotFound,
  ALLOWED_TRANSITIONS,
} from "../../repository/syncJobs";
export type {
  SyncJobKind, SyncJobStatus, SyncJobRow,
} from "../../repository/syncJobs";
```

`sync-error.ts`:

```ts
/**
 * sync 系 error code 正本。
 * owner: 03a / co-owner: 03b
 * owner 表: docs/30-workflows/_design/sync-shared-modules-owner.md
 */
export type SyncErrorCode =
  | "lock-conflict"
  | "fetch-failed"
  | "d1-write-failed"
  | "unknown";

export function classifySyncError(err: unknown): SyncErrorCode {
  const msg = err instanceof Error ? err.message : String(err);
  if (/lock|conflict|already running/i.test(msg)) return "lock-conflict";
  if (/429|5\d\d|fetch|network|timeout|quota/i.test(msg)) return "fetch-failed";
  if (/UNIQUE|constraint|D1|sqlite/i.test(msg)) return "d1-write-failed";
  return "unknown";
}

const PII_KEYS = new Set(["responseEmail", "email", "responseId"]);
export function redactMetricsJson(json: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(json)) {
    if (PII_KEYS.has(k)) continue;
    out[k] = v;
  }
  return out;
}
```

`index.ts`:

```ts
/**
 * _shared/ barrel export.
 * owner 表: docs/30-workflows/_design/sync-shared-modules-owner.md
 */
export * from "./ledger";
export * from "./sync-error";
```

### 入出力 / 副作用

- すべて pure。`ledger.ts` は import 経由で `repository/syncJobs.ts` の D1 binding 関数を expose するが、新規 D1 access の追加はない（不変条件 #5 遵守）。

### テスト方針

- `ledger.test.ts`: `import * as L from "../ledger"` の smoke import + `typeof L.start === 'function'` 等の型 assert。
- `sync-error.test.ts`: 4 ケース以上（lock / fetch / d1 / unknown）+ `redactMetricsJson` の PII drop 1 ケース。

### 実行コマンド（DoD 検証）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
grep -l 'sync-shared-modules-owner' apps/api/src/jobs/_shared/*.ts
```

### DoD

AC-1 〜 AC-12 全 PASS。

## CODEOWNERS 編集方針

`.github/CODEOWNERS` の `apps/api/** @daishiman` 行より後ろに以下を追加（最終マッチ勝ち仕様で具体度高を後ろに置く CLAUDE.md の規約に従う）:

```text
# sync 共通モジュール owner 表: docs/30-workflows/_design/sync-shared-modules-owner.md
apps/api/src/jobs/_shared/** @daishiman
```

## owner 表 markdown 更新方針

`docs/30-workflows/_design/sync-shared-modules-owner.md` の「未作成の将来正本」表現を「実体化済み skeleton」に書き換え、備考列を JSDoc 一致内容に更新する。`index.ts` 行を新たに追加する。

## 検証コマンド計画（Phase 6-9 で実行）

| Phase | コマンド | 期待結果 |
| --- | --- | --- |
| 6 | `mise exec -- pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared` | 全テスト PASS |
| 6 | `find apps/api/src/jobs/_shared -type f` | 5 ファイル hit（実装 3 + tests 2） |
| 7 | `grep -l 'sync-shared-modules-owner' apps/api/src/jobs/_shared/*.ts` | 3 件 hit |
| 7 | `grep -l 'sync-shared-modules-owner' docs/30-workflows/completed-tasks/03a*/index.md docs/30-workflows/completed-tasks/03b*/index.md` | 2 件 hit |
| 7 | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` | `{"errors":[]}` |
| 9 | `mise exec -- pnpm typecheck` | exit 0 |
| 9 | `mise exec -- pnpm lint` | exit 0 |
| 9 | `grep -rE 'CLOUDFLARE_API_TOKEN=\|OAUTH_SECRET=\|sk-[A-Za-z0-9]{20,}' apps/api/src/jobs/_shared docs/30-workflows/_design/` | 0 件 |

## 後続タスク化（CONST_007）

以下は本サイクル out of scope。`docs/30-workflows/unassigned-task/` に別タスクとして起票する:

- `apps/api/src/repository/syncJobs.ts` の物理移動 / 削除
- `apps/api/src/jobs/sync-forms-responses.ts` 内 `classifyError` の `_shared/sync-error.ts` 置換
- `sync_jobs` テーブル DDL 変更 / `job_type` enum / `metrics_json` schema 集約

## 完了条件

- 10 サブタスクのパスと差分方針が確定
- CONST_005 必須項目すべてが本ファイルに含まれる
- 検証コマンド一覧が Phase 6-9 にトレース可能

## 成果物

- `outputs/phase-04/subtasks.md`

## 目的

本 Phase の目的は、issue-195 follow-up 002 を code / NON_VISUAL workflow として矛盾なく完了させるための判断・作業・検証を記録すること。

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
