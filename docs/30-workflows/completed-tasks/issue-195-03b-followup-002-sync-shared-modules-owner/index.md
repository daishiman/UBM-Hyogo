# issue-195-03b-followup-002-sync-shared-modules-owner — タスク仕様書 index

[実装区分: 実装仕様書]
判定根拠（CONST_004）: ユーザー方針変更により、本サイクルで owner 表を運用化するための **コード変更を含む最小スコープ** を実装する。具体的には `apps/api/src/jobs/_shared/{ledger,sync-error,index}.ts` の skeleton 実装、対応 unit test 追加、`.github/CODEOWNERS` への path 行追加、owner 表 markdown の表現更新を含むため `[実装区分: 実装仕様書]` とする。既存実装ロジックの物理移管・置換は今回サイクル out of scope（後続タスク化）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-03b-followup-002-sync-shared-modules-owner |
| ディレクトリ | docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner |
| Issue | #195 (CLOSED — 仕様書作成時点で既に close 済) |
| 親タスク | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue / 03b-parallel-forms-response-sync-and-current-response-resolver |
| Wave | governance + foundation (code skeleton) |
| 実行種別 | sequential |
| 作成日 | 2026-05-02（再構成: 2026-05-03） |
| 担当 | 03a / 03b 共同保守 + docs-governance |
| 状態 | completed / Phase 1-12 = completed / Phase 13 = pending_user_approval |
| タスク種別 | code / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| artifacts | root `artifacts.json` + `outputs/artifacts.json`（実装サイクルで再生成） |
| 優先度 | medium |
| 規模 | small |
| 発見元 | 03b Phase 12 unassigned-task-detection #3 |

## purpose

03a / 03b が共有する sync 共通モジュールの owner / co-owner を `docs/30-workflows/_design/sync-shared-modules-owner.md` に明文化し、その表で「正本」と宣言する `apps/api/src/jobs/_shared/{ledger,sync-error,index}.ts` を **本サイクルで skeleton として実体化** する。これにより owner 表が紙の上の宣言で終わらず、ファイル実体の存在 + CODEOWNERS path 行 + JSDoc cross-link によって運用可能なガバナンスとして成立する。

## scope in / out

### scope in

- `apps/api/src/jobs/_shared/ledger.ts` 新規作成（`apps/api/src/repository/syncJobs.ts` から symbol を re-export する thin facade。冒頭 JSDoc に owner 表 path を記述）
- `apps/api/src/jobs/_shared/sync-error.ts` 新規作成（`SyncErrorCode` union と `classifySyncError` / `redactMetricsJson` の最小実装。冒頭 JSDoc に owner 表 path を記述）
- `apps/api/src/jobs/_shared/index.ts` 新規作成（barrel export）
- `apps/api/src/jobs/_shared/__tests__/ledger.test.ts` 新規作成（import smoke test）
- `apps/api/src/jobs/_shared/__tests__/sync-error.test.ts` 新規作成（境界値テスト 4 ケース以上）
- `.github/CODEOWNERS` 編集（`apps/api/src/jobs/_shared/** @daishiman` を `apps/api/** @daishiman` 行より後ろに追加し、コメントで owner 表 path を記述）
- `docs/30-workflows/_design/sync-shared-modules-owner.md` 表現更新（「未作成の将来正本」→「実体化済み skeleton」へ）
- `docs/30-workflows/completed-tasks/03a*/index.md` と `03b*/index.md` から owner 表へのリンク追記（既存ステップ維持）

### scope out（後続タスク化・本サイクルでは触らない）

- 既存 `apps/api/src/repository/syncJobs.ts` の物理移動 / 削除
- `apps/api/src/jobs/sync-forms-responses.ts` 内 `classifyError` の `_shared/sync-error.ts` への置換（互換破壊回避）
- `sync_jobs` テーブル DDL 変更（01a 責務）
- `job_type` enum 追加 / `metrics_json` schema 集約
- task-specification-creator skill 本体改修
- GAS prototype 昇格（不変条件 #6）

## CONST_005 必須項目（実装仕様書）

### 変更対象ファイル一覧と種別

| 種別 | ファイル | 内容 |
| --- | --- | --- |
| 新規 | `apps/api/src/jobs/_shared/ledger.ts` | re-export facade |
| 新規 | `apps/api/src/jobs/_shared/sync-error.ts` | union 型 + 関数 2 個 |
| 新規 | `apps/api/src/jobs/_shared/index.ts` | barrel |
| 新規 | `apps/api/src/jobs/_shared/__tests__/ledger.test.ts` | import smoke test |
| 新規 | `apps/api/src/jobs/_shared/__tests__/sync-error.test.ts` | 境界値テスト |
| 編集 | `.github/CODEOWNERS` | path 行追加 |
| 編集 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | 表現更新 |
| 編集 | `docs/30-workflows/completed-tasks/03a*/index.md` | owner 表リンク追記（既存維持） |
| 編集 | `docs/30-workflows/completed-tasks/03b*/index.md` | owner 表リンク追記（既存維持） |

### 関数 / 型シグネチャ

`apps/api/src/jobs/_shared/ledger.ts`:

```ts
// re-export only; no new logic.
export {
  start, succeed, fail, findLatest, listRecent,
  IllegalStateTransition, SyncJobNotFound,
  ALLOWED_TRANSITIONS,
} from "../../repository/syncJobs";
export type {
  SyncJobKind, SyncJobStatus, SyncJobRow,
} from "../../repository/syncJobs";
```

`apps/api/src/jobs/_shared/sync-error.ts`:

```ts
export type SyncErrorCode =
  | "lock-conflict"
  | "fetch-failed"
  | "d1-write-failed"
  | "unknown";

export function classifySyncError(err: unknown): SyncErrorCode;
export function redactMetricsJson(json: Record<string, unknown>): Record<string, unknown>;
```

`apps/api/src/jobs/_shared/index.ts`:

```ts
export * from "./ledger";
export * from "./sync-error";
```

### 入出力 / 副作用

- すべての新規ファイルは pure（副作用なし）。`ledger.ts` は import 経由で `repository/syncJobs.ts` の D1 binding に依存するが、本タスクで新たな D1 access は追加しない（不変条件 #5 遵守）。
- `classifySyncError` は `err: unknown` を受けて固定 union を返す純関数。
- `redactMetricsJson` は入力 object をシャローコピーし、PII キー（`responseEmail` / `responseId` / `email` 等）をドロップする純関数。

### テスト方針

- `ledger.test.ts`: `import * as L from "../ledger"` で smoke import し、`L.start` / `L.succeed` / `L.fail` / `L.findLatest` / `L.listRecent` が `function` 型であることを assert。
- `sync-error.test.ts`: `classifySyncError` に対し最低 4 ケース（`lock` 系 / `fetch`/`5xx` 系 / `D1`/`UNIQUE` 系 / 未分類）を assert。`redactMetricsJson` は PII キーをドロップすることを assert。

### 実行コマンド（DoD 検証）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
grep -l 'sync-shared-modules-owner' apps/api/src/jobs/_shared/*.ts
```

### DoD

AC-1 〜 AC-12 全て PASS。

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流参照 | `apps/api/src/repository/syncJobs.ts` | re-export 元 |
| 上流参照 | `apps/api/src/jobs/sync-forms-responses.ts` | `classifyError` を参考に最小分類設計 |
| 上流参照 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | 実体化対象の宣言元 |
| 上流参照 | `docs/30-workflows/completed-tasks/03a*/index.md` | owner 表リンク追記対象 |
| 上流参照 | `docs/30-workflows/completed-tasks/03b*/index.md` | owner 表リンク追記対象 |
| 上流参照 | `.github/CODEOWNERS` | path 行追加対象 |
| 後続 | `_shared/` への本体ロジック物理移管タスク | 別タスク化（バックログ） |
| 後続 | `sync-forms-responses.ts` の `classifyError` 置換タスク | 別タスク化（バックログ） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-002-sync-shared-modules-owner.md` | 既存 draft（再利用元） |
| 必須 | `apps/api/src/repository/syncJobs.ts` | re-export 元シグネチャ |
| 必須 | `apps/api/src/jobs/sync-forms-responses.ts` | `classifyError` 参照元 |
| 参考 | `docs/00-getting-started-manual/specs/00-overview.md` | 不変条件 #5 / #6 |

## AC（Acceptance Criteria）

- AC-1: `docs/30-workflows/_design/sync-shared-modules-owner.md` が存在し owner 表を持つ
- AC-2: 表に「ファイル / owner task / co-owner task / 変更時の必須レビュアー / 備考」5 列が揃う
- AC-3: 表に `apps/api/src/jobs/_shared/ledger.ts` / `sync-error.ts` / `index.ts` の 3 行が含まれる
- AC-4: 03a / 03b の `index.md`（completed-tasks 配下含む）から owner 表へのリンクが 1 ホップで到達できる（`grep -l 'sync-shared-modules-owner' docs/30-workflows/completed-tasks/03a*/index.md docs/30-workflows/completed-tasks/03b*/index.md` で 2 件以上 hit）
- AC-5: 変更ルール（PR 起票義務 / 必須レビュアー / co-owner 通知）が owner 表本文に箇条書きで記述されている
- AC-6: 関連未割当タスク（job_type / metrics_json schema 集約）への前提関係が owner 表末尾に明示されている
- AC-7: secret 値が新規追加 markdown のいずれにも含まれない（`outputs/phase-09/secret-hygiene-grep.log` PASS）
- AC-8: `apps/api/src/jobs/_shared/{ledger,sync-error,index}.ts` の 3 ファイルが新規存在する
- AC-9: 上記 3 ファイル冒頭 JSDoc に owner 表パス文字列が含まれる（`grep -l 'sync-shared-modules-owner' apps/api/src/jobs/_shared/*.ts` で 3 件以上 hit）
- AC-10: `apps/api/src/jobs/_shared/__tests__/ledger.test.ts` と `sync-error.test.ts` が `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared` で PASS
- AC-11: `.github/CODEOWNERS` に `apps/api/src/jobs/_shared/**` 行が存在し、`gh api repos/daishiman/UBM-Hyogo/codeowners/errors` が `{"errors":[]}` を返す
- AC-12: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が PASS

## 13 phases

| Phase | 名称 | ファイル | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed |
| 2 | 設計 | phase-02.md | completed |
| 3 | 設計レビュー | phase-03.md | completed |
| 4 | 実装計画 | phase-04.md | completed |
| 5 | 実装（コード + ドキュメント） | phase-05.md | completed |
| 6 | ユニット相当検証（vitest） | phase-06.md | completed |
| 7 | 統合相当検証（cross-ref + CODEOWNERS） | phase-07.md | completed |
| 8 | 受け入れテスト（AC 検証） | phase-08.md | completed |
| 9 | 品質ゲート（secret hygiene / typecheck / lint） | phase-09.md | completed |
| 10 | 設計レビュー記録 | phase-10.md | completed |
| 11 | NON_VISUAL evidence | phase-11.md | completed |
| 12 | ドキュメント更新 / 未タスク検出 / skill feedback | phase-12.md | completed |
| 13 | PR 作成 | phase-13.md | pending_user_approval |

## taskType / visualEvidence

- taskType: `code`
- visualEvidence: `NON_VISUAL`（API 内部モジュールの thin facade 追加であり UI 影響なし）
- workflow_state: `completed`

## 不変条件再確認

- #5（D1 直接アクセスは `apps/api` 内のみ）: 新モジュールは `apps/api/src/jobs/_shared/` 配下にあり遵守。
- #6（GAS prototype 非昇格）: 本タスクは GAS に触れないため非該当。
- 他不変条件にも違反なし。
