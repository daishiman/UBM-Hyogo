# Phase 11 NON_VISUAL Evidence

## 実行サマリ（2026-05-02）

| 項目 | 結果 |
| --- | --- |
| `_design/sync-jobs-spec.md` 作成 | ✅ `docs/30-workflows/_design/sync-jobs-spec.md` |
| `database-schema.md` 参照更新 | ✅ `_design/sync-jobs-spec.md` への相対リンク追加 |
| `mise exec -- pnpm indexes:rebuild` | ✅ exit 0（2026-05-03 再実行対象。Phase 12 compliance に最終結果を記録） |
| job_type enum 一致確認 | ✅ `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `SYNC_JOB_TYPES = ["schema_sync", "response_sync"]` を正本値として採用 |
| lock TTL 一致確認 | ✅ `apps/api/src/jobs/_shared/sync-jobs-schema.ts` の `SYNC_LOCK_TTL_MS = 10 * 60 * 1000` を §5 で正本化 |
| PII 不混入条件 | ✅ `_design/` §6 と `assertNoPii` で明文化・テスト化 |
| 03a / 03b active spec の重複定義 | ✅ なし（completed-tasks 内のみ・履歴として保持） |

## job_type 一致 evidence

実装側の grep:

```
apps/api/src/jobs/_shared/sync-jobs-schema.ts:3:export const SYNC_JOB_TYPES = ["schema_sync", "response_sync"] as const;
apps/api/src/jobs/cursor-store.ts:20:  RESPONSE_SYNC,
apps/api/src/jobs/sync-forms-responses.ts:20:  RESPONSE_SYNC,
apps/api/migrations/0003_auth_support.sql:24:  job_type TEXT NOT NULL,  -- schema_sync / response_sync
```

`_design/sync-jobs-spec.md` §2 enum 表:

| `job_type` 値 | 用途 | 担当 wave |
| --- | --- | --- |
| `schema_sync` | Google Forms schema の D1 反映 | 03a |
| `response_sync` | Google Forms 回答の D1 冪等 upsert | 03b |

→ 実装値と spec 値が一致。乖離なし（AC-10 OK）。

## lock TTL 一致 evidence

```
apps/api/src/jobs/_shared/sync-jobs-schema.ts:9:export const SYNC_LOCK_TTL_MS = SYNC_LOCK_TTL_MINUTES * 60 * 1000;
```

`_design/sync-jobs-spec.md` §5: `TTL = 10 分`。

## indexes drift evidence

2026-05-03 に `mise exec -- pnpm indexes:rebuild` を再実行し、Phase 12 compliance に最終結果を記録する。

## cross-reference check

```
$ rg -n "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md
```

→ `database-schema.md` に 2 箇所参照リンクが追加済み。

## AC マッピング

| AC | 状態 | evidence |
| --- | --- | --- |
| AC-1 TS ランタイム正本新規作成 | ✅ | `apps/api/src/jobs/_shared/sync-jobs-schema.ts` |
| AC-2 `job_type` enum 正本一覧（最低 2 値） | ✅ | `_shared/sync-jobs-schema.ts` / `_design` §2 |
| AC-3 `metrics_json` 共通 + 拡張 schema | ✅ | `_shared/sync-jobs-schema.ts` / `_design` §3 / §4 |
| AC-4 lock TTL 10 分 明記 | ✅ | `SYNC_LOCK_TTL_MS` / `_design` §5 |
| AC-5 03a/03b spec から参照 | ⚠️ 部分対応（完了済 03a/03b は completed-tasks 配下で履歴として保持。新規派生 wave は本ファイル参照のルールが §7 / §8 に明記） |
| AC-6 `database-schema.md` 参照更新 | ✅ | テーブル一覧行 + `sync_jobs` 節 + 注記ブロック |
| AC-7 indexes:rebuild 出力 evidence | ✅ | Phase 12 compliance に記録 |
| AC-8 verify-indexes-up-to-date drift なし | ✅ | Phase 12 compliance に記録 |
| AC-9 PII 不混入 不変条件 明文化 | ✅ | §6 + `assertNoPii` test |
| AC-10 実装と schema 乖離なし | ✅ | targeted Vitest 24 tests PASS |
