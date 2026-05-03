# Phase 3: 実装計画（変更ファイル 4 件 + 順序 + zod 依存確認）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 実装計画 |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (verify suite 設計) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

Phase 2 の API 契約に基づき、変更ファイル 4 件（新規 1 + 編集 3）と新規テスト 1 件、ドキュメント更新 3 件の作業順序・依存関係・前提条件（`zod` 既存導入）を確定する。

## 実行タスク

1. `zod` 依存の existence 確認手順を記述（`apps/api/package.json` を grep）
2. 変更ファイル一覧表の確定
3. 実装順序の確定（API 提供 → call site 差し替え → ドキュメント反映）
4. 各ファイル変更の具体的 diff 設計（リテラル → 共有定数）
5. ローカル実行コマンドの一覧化
6. ロールバック手順（git revert 単位）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/03b-followup-005-sync-jobs-design-spec/phase-02.md | API 契約 |
| 必須 | apps/api/package.json | `zod` 依存確認 |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | 編集対象 1 |
| 必須 | apps/api/src/repository/syncJobs.ts | 編集対象 2 |
| 必須 | apps/api/src/jobs/cursor-store.ts | 編集対象 3 |

## 実行手順

### ステップ 1: zod 依存確認

```bash
rg -n '"zod"' apps/api/package.json
```

- 結果が 1 件以上なら前提充足。0 件の場合のみ:

```bash
mise exec -- pnpm add zod -F @ubm-hyogo/api
```

を実行し、本タスク内で lock を更新する。

### ステップ 2: 変更ファイル一覧

| 種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | apps/api/src/jobs/_shared/sync-jobs-schema.ts | TS ランタイム正本（Phase 2 API 契約準拠） |
| 新規 | apps/api/src/jobs/_shared/sync-jobs-schema.test.ts | vitest（Phase 4 テスト方針準拠） |
| 編集 | apps/api/src/jobs/sync-forms-responses.ts | `DEFAULT_LOCK_TTL_MS` 削除 → `SYNC_LOCK_TTL_MS` import |
| 編集 | apps/api/src/repository/syncJobs.ts | `SyncJobKind` ローカル定義 → re-export |
| 編集 | apps/api/src/jobs/cursor-store.ts | `'response_sync'` リテラル / `JSON.parse as ...` → 共有定数 + `parseMetricsJson` |
| 編集 | docs/30-workflows/_design/sync-jobs-spec.md | TS 正本リンク注記追加（§3 / §5） |
| 編集 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節を `_design/` 参照に統一 |

### ステップ 3: 実装順序

1. Phase 6: `_shared/sync-jobs-schema.ts` 新規作成 + テスト追加（API 提供）
2. Phase 7-1: `repository/syncJobs.ts` の re-export 化（後方互換維持）
3. Phase 7-2: `sync-forms-responses.ts` の `SYNC_LOCK_TTL_MS` 差し替え
4. Phase 7-3: `cursor-store.ts` の `parseMetricsJson` 適用 + 共有定数化
5. Phase 8: ドキュメント更新（`_design/` 注記 / `database-schema.md` 参照統一）
6. Phase 9: indexes 再生成 + 全体 typecheck/lint/test

### ステップ 4: 具体 diff 設計

#### sync-forms-responses.ts

```ts
// 削除
- const DEFAULT_LOCK_TTL_MS = 10 * 60 * 1000;

// 追加
+ import { SYNC_LOCK_TTL_MS, type SyncJobKind } from "./_shared/sync-jobs-schema";
+ const RESPONSE_SYNC: SyncJobKind = "response_sync";

// 利用箇所
- start(dbCtx, "response_sync", ..., DEFAULT_LOCK_TTL_MS)
+ start(dbCtx, RESPONSE_SYNC, ..., SYNC_LOCK_TTL_MS)
```

#### repository/syncJobs.ts

```ts
- export type SyncJobKind = "schema_sync" | "response_sync";
+ export type { SyncJobKind } from "../jobs/_shared/sync-jobs-schema";
```

#### cursor-store.ts

```ts
- const result = await db.prepare("SELECT metrics_json FROM sync_jobs WHERE job_type = 'response_sync' ...")
+ import { SYNC_JOB_TYPES, parseMetricsJson, responseSyncMetricsSchema } from "./_shared/sync-jobs-schema";
+ const RESPONSE_SYNC = SYNC_JOB_TYPES[1]; // "response_sync"
+ const result = await db.prepare(`SELECT metrics_json FROM sync_jobs WHERE job_type = ? ...`).bind(RESPONSE_SYNC) ...

- const parsed = JSON.parse(raw) as { cursor?: string };
- return parsed.cursor ?? null;
+ const parsed = parseMetricsJson(raw, responseSyncMetricsSchema);
+ return parsed?.cursor ?? null;
```

### ステップ 5: ローカル実行コマンド

```bash
mise exec -- pnpm install                                    # zod 追加した場合
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-forms-responses
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-sheets-to-d1
mise exec -- pnpm lint
mise exec -- pnpm indexes:rebuild
```

### ステップ 6: ロールバック手順

- `git revert <commit>` 単位で巻き戻せるよう、Phase 6 / 7 / 8 を**それぞれ別コミット**にする
- 各 commit 後に typecheck を実行し、red→green を保つ

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 変更ファイル一覧 / 順序 / diff 設計 / コマンド集 |
| メタ | artifacts.json | Phase 3 を completed に更新 |

## 統合テスト連携

- Phase 4 の verify suite 設計と本 Phase の実装計画が 1:1 で対応していることを確認
- Phase 9 で全体実行

## 完了条件

- [ ] `zod` 依存確認手順が記述されている
- [ ] 変更ファイル一覧（新規 2 + 編集 5）が表形式で確定
- [ ] 実装順序（Phase 6→7→8→9）が明記
- [ ] 各編集ファイルの diff 設計が記述
- [ ] ローカル実行コマンドが網羅されている
- [ ] ロールバック単位が定義されている

## 次 Phase

- 次: 4（verify suite 設計）
- 引き継ぎ事項: 変更ファイル 7 件 / 実装順序 / コマンド集
- ブロック条件: `zod` 未導入かつ追加禁止 / `SyncJobKind` re-export で既存テスト fail
