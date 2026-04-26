# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

workflow / handler の命名と path を統一し、07a / 07c の同類 workflow との整合を確保する。共通 util（d1Tx, auditLog, errors）を共有する。

## Before / After

| 区分 | Before | After | 理由 |
| --- | --- | --- | --- |
| workflow 関数名 | `applyAlias`, `assignAlias`, `setStableKey` | `schemaAliasAssign` | `<subject><action>` 統一（07a `tagQueueResolve` と整合） |
| 推奨関数名 | `suggestKeys`, `getAliasCandidates` | `recommendAliases` | recommend prefix |
| back-fill 関数名 | `updateOldResponses`, `migrateResponseFields` | `backfillResponseFields` | backfill prefix |
| audit action | `alias_assigned`, `schema.alias.set` | `schema_diff.alias_assigned` | `<entity>.<verb>.<state>` |
| error class | `BadRequest`, `Conflict` | `ConflictError`, `UnprocessableError`, `NotFoundError`, `RetryableError` | suffix `Error` |
| zod schema | inline | `apps/api/src/schemas/schemaAliasAssign.ts` で集約 | 再利用 |
| audit payload | inline JSON | `auditLogHelper.makeSchemaDiffAssigned(...)` | 共通 base |
| tx wrapper | inline batch | `apps/api/src/lib/d1Tx.ts` で wrapper | DRY (07a/c と共有) |
| Levenshtein | inline | `packages/shared/string/levenshtein.ts` | 再利用可能 |

## 共通化対象

| 種別 | path | 用途 |
| --- | --- | --- |
| util | apps/api/src/lib/d1Tx.ts | D1 batch wrapper（07a/b/c で共有） |
| util | apps/api/src/lib/auditLog.ts | audit_log INSERT 共通関数 |
| util | apps/api/src/lib/cpuBudget.ts | CPU 残予算判定（back-fill 中断判定） |
| string util | packages/shared/string/levenshtein.ts | recommendAliases 用 |
| error | apps/api/src/lib/errors.ts | Conflict / NotFound / Unprocessable / Forbidden / Retryable |
| middleware | apps/api/src/middleware/adminGate.ts | 06c phase で確定済み、本タスク参照のみ |
| type | packages/shared/types/admin.ts | SchemaAliasAssignResponse (apply/dryRun union) |

## 命名規則

| 対象 | 規則 |
| --- | --- |
| workflow 関数 | `<subject><Action>` (e.g. `schemaAliasAssign`, `backfillResponseFields`) |
| service 関数 | `<verb><Subject>` (e.g. `recommendAliases`) |
| route file | `apps/api/src/routes/admin/<subject>.ts` |
| schema file | `apps/api/src/schemas/<subjectAction>.ts` |
| audit action | `<entity>.<verb>[.<state>]` |
| dryRun mode | `mode: 'dryRun' \| 'apply'` を return type に明示 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の命名を更新 |
| Phase 9 | typecheck で確認、cpuBudget 性能計測 |
| 07a / 07c | 共通 util を共有 |

## 多角的チェック観点

| 不変条件 | DRY 担保 | 確認 |
| --- | --- | --- |
| #1 | stableKey 文字列定数を grep で検出 0 件 | grep test |
| #5 | d1Tx wrapper / auditLog helper が apps/api 内のみ | grep |
| #14 | UPDATE schema_questions が schemaAliasAssign のみ | grep |
| 監査 | auditLog 共通関数で全 workflow が呼ぶ | grep |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before/After | 8 | pending | 9 行 |
| 2 | 共通化 | 8 | pending | util 7 件 |
| 3 | 命名規則 | 8 | pending | prefix + dryRun union |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | このタスクの scope / AC / 依存関係 |
| 必須 | ../README.md | Wave 全体の実行順と依存関係 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before/After |
| メタ | artifacts.json | Phase 8 を completed |

## 完了条件

- [ ] Before/After 9 行
- [ ] 共通化 7 件
- [ ] 命名規則確定

## タスク100%実行確認

- 全項目記載
- artifacts.json で phase 8 を completed

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ: 命名統一を typecheck で確認
- ブロック条件: 命名揺れ残れば差し戻し

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する
