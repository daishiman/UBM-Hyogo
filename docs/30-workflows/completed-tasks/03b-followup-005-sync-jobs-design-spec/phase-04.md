# Phase 4: verify suite 設計（typecheck / vitest / grep / indexes drift）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 4 / 13 |
| Phase 名称 | verify suite 設計 |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 3 (実装計画) |
| 次 Phase | 5 (既存定義棚卸し) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

AC-1〜AC-11 を機械検証可能にするため、typecheck / vitest / grep / indexes drift の 4 系統 verify suite を設計し、各 AC との対応表を確定する。

## 実行タスク

1. AC × verify command 対応表
2. `_shared/sync-jobs-schema.test.ts` のテストケース 9 件を確定
3. grep 系 evidence コマンド集（不在確認 / 存在確認）
4. indexes drift 検証手順
5. 既存テスト回帰確認の対象ファイル一覧

## AC × verify 対応表

| AC | 検証手段 | コマンド |
| --- | --- | --- |
| AC-1 | grep（export 存在確認） | `rg -n "export (const SYNC_JOB_TYPES\|const SYNC_LOCK_TTL_MS\|function assertNoPii\|function parseMetricsJson)" apps/api/src/jobs/_shared/sync-jobs-schema.ts` |
| AC-2 | vitest | `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test` |
| AC-3 | grep（不在 + 存在） | `rg -n "DEFAULT_LOCK_TTL_MS" apps/api/src/jobs/sync-forms-responses.ts` (0 件) / `rg -n "SYNC_LOCK_TTL_MS" apps/api/src/jobs/sync-forms-responses.ts` (1+ 件) |
| AC-4 | grep | `rg -n "SyncJobKind" apps/api/src/repository/syncJobs.ts` で `export type {` を確認 |
| AC-5 | grep | `rg -n "parseMetricsJson" apps/api/src/jobs/cursor-store.ts` (1+ 件) / `rg -n "'response_sync'" apps/api/src/jobs/cursor-store.ts` (0 件) |
| AC-6 | vitest | `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-forms-responses sync-sheets-to-d1` |
| AC-7 | grep | `rg -n "_shared/sync-jobs-schema" docs/30-workflows/_design/sync-jobs-spec.md` (2+ 件) |
| AC-8 | grep | `rg -n "_design/sync-jobs-spec" .claude/skills/aiworkflow-requirements/references/database-schema.md` (1+ 件) |
| AC-9 | indexes | `mise exec -- pnpm indexes:rebuild` 後 `git status` がクリーン |
| AC-10 | typecheck/lint | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` |
| AC-11 | vitest + 文書 | `assertNoPii` テスト PASS + `syncJobs.succeed()` の metrics_json 書き込み前検証 + `outputs/phase-12/unassigned-task-detection.md` に未タスク 0 件理由を記載 |

## `_shared/sync-jobs-schema.test.ts` テストケース

| # | describe | it | 期待 |
| --- | --- | --- | --- |
| 1 | SYNC_JOB_TYPES | contains schema_sync and response_sync | `expect(SYNC_JOB_TYPES).toEqual(["schema_sync", "response_sync"])` |
| 2 | SYNC_LOCK_TTL_MS | equals 600_000 | `expect(SYNC_LOCK_TTL_MS).toBe(600_000)` |
| 3 | metricsJsonBaseSchema | parses empty object | `metricsJsonBaseSchema.parse({})` 成功 |
| 4 | responseSyncMetricsSchema | parses cursor | `responseSyncMetricsSchema.parse({ cursor: "2026-01-01T00:00:00Z\|abc" })` 成功 |
| 5 | responseSyncMetricsSchema | rejects empty | `responseSyncMetricsSchema.safeParse({}).success === false` |
| 6 | assertNoPii | throws on responseEmail key | `expect(() => assertNoPii({ responseEmail: "x@y.z" })).toThrow()` |
| 7 | assertNoPii | throws on email key | `expect(() => assertNoPii({ email: "x@y.z" })).toThrow()` |
| 8 | assertNoPii | throws on email-shaped value | `expect(() => assertNoPii({ comment: "x@y.z" })).toThrow()` |
| 9 | assertNoPii | passes on cursor | `expect(() => assertNoPii({ cursor: "2026..." })).not.toThrow()` |
| 10 | parseMetricsJson | returns null on invalid | `expect(parseMetricsJson("invalid", responseSyncMetricsSchema)).toBeNull()` |

## indexes drift 検証

```bash
mise exec -- pnpm indexes:rebuild
git status --porcelain .claude/skills/aiworkflow-requirements/indexes
# 出力 0 行で PASS
```

## 既存テスト回帰確認

- `apps/api/src/jobs/sync-forms-responses.test.ts`
- `apps/api/src/jobs/sync-sheets-to-d1.test.ts`
- `apps/api/src/jobs/sync-forms-responses.types.test.ts`

すべて `mise exec -- pnpm --filter @ubm-hyogo/api test` で実行。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | AC × verify 対応表 / テストケース表 |
| メタ | artifacts.json | Phase 4 を completed に更新 |

## 統合テスト連携

- Phase 11 evidence 収集と本 Phase の verify command が 1:1 対応
- Phase 9 でドライラン

## 完了条件

- [ ] AC × verify command 対応表が AC-1〜AC-11 を網羅
- [ ] `_shared/sync-jobs-schema.test.ts` テストケースが 9〜10 件記述
- [ ] indexes drift 検証手順が記述
- [ ] 既存テスト回帰対象が一覧化

## 次 Phase

- 次: 5（既存定義棚卸し）
- 引き継ぎ事項: AC × verify 対応表 / テストケース 10 件 / indexes 検証コマンド
- ブロック条件: AC のいずれかに verify 手段が紐付かない
