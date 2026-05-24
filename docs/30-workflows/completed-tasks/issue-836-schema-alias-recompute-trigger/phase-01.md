# Phase 1: 要件定義

[実装区分: 実装仕様書] / implementation_mode: new / タスク種別: implementation / VISUAL

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 名称 | 要件定義（scope・受入条件・inventory 固定 + 命名規則分析） |
| 依存 | なし（起点） |
| 成果物 | 本ファイル（phase-01.md） |
| 状態 | spec_created |

## 目的

Issue #836「schema alias rollback 後の集計再実行トリガー」を最新コードベースに最適化し、「recompute = `response_fields` の reverse-backfill」という根本問題定義を確定する。scope・受入条件・既存コード命名規則・inventory を Phase 2 設計より前に固定する。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の実装 Phase（implementation_mode = new） |
| upstream（dev/main）にマージ済み | No（recompute は未実装） | 未マージとして扱う |
| 前提タスク（Issue #778 rollback / undo）が完了済み | Yes（`schemaAliasRollback.ts` / soft delete migration `0019` / rollback endpoint 実在） | 完了済みを記録し依存チェックを省略。recompute はこの上に積む |

## Issue 鮮度調査（実施済み・結論記録）

> ユーザー依頼「他タスクで解決済みか / issue が古いか」への一次調査結果。詳細は index.md「Issue 鮮度調査結論」を正本とする。

- **recompute 実行 API / workflow / audit action / UI 実行ボタン: いずれも未実装**（warning text `SchemaDiffPanel.tsx:248-250` のみ）。
- `backfill/trigger` endpoint（`schema.ts:316-374`）は Issue #504 の 50k fixture stress 専用で recompute とは別物。
- 他タスク（completed-tasks 配下含む）で recompute を実装したものは存在しない。
- → **本タスクの実施が必要**。CLOSED Issue を最新コードへ最適化して仕様書化する。

## 真の論点（要件レビュー思考法）

1. **真の論点**: rollback で alias を取り消しても `response_fields.stable_key` が `alias.stableKey` のまま残り、集計（response_fields を読む全経路）が汚染される。これを安全（idempotent）・追跡可能（audit）・admin 統制下（明示操作）で整復する。
2. **依存関係・責務境界**: recompute は rollback の後段だが**自動連動させない**（責務分離）。rollback workflow は touch せず、recompute は独立 endpoint / workflow / job として閉じる。
3. **価値とコストの不均衡**: 初回価値は「単一 alias の reverse-backfill + status 追跡」。高コスト部品（Queue fan-out 非同期化・bulk・通知）は初期層から分離する。
4. **改善優先順位**: ① reverse-backfill 正当性 → ② idempotency → ③ audit → ④ UI status 可視化。
5. **4 条件**: 価値性（集計汚染の解消）/ 実現性（backfill の対称実装で実装可能）/ 整合性（job UNIQUE + soft-deleted alias 取得で閉じる）/ 運用性（status バッジ + audit で監査可能）すべて充足。

### 因果ループ

- バランスループ: 「rollback 実行 → recompute 未実行で集計汚染 → admin が再集計実行 → 汚染解消」。recompute job の status が「未実行件数」を可視化し、放置を抑制する。
- 強化ループ（負の制御）: idempotency 欠如時「再集計を複数回押す → 派生件数が二重変動 → さらに汚染」。`(alias_id, stable_key, trigger_key)` UNIQUE でこのループを断つ。

## スコープ（index.md と一致・要約）

- 含む: migration `0020`、recompute endpoint 2 本、`schemaAliasRecompute.ts` workflow、recompute job repository、web helper 2 本、SchemaDiffPanel の recompute UI（warning 置換）、spec 更新 2 本、test 4 系統。
- 含まない: bulk recompute（followup-006）/ 通知（followup-007）/ Queue fan-out 非同期化（将来拡張）/ 派生集計 view 新規作成。CONST_007 例外宣言は index.md 参照。

## 受入条件

AC-1〜AC-13（Local）+ RAC-1〜RAC-3（Runtime）。index.md「受入条件 (AC)」を正本とする。本 Phase では以下を明示確定する:

- recompute の「派生データ」実体は `response_fields.stable_key` であること（派生 view は未実在）。
- reverse-backfill の対象遷移は `alias.stableKey` → `__extra__:{alias.aliasQuestionId}`。
- recompute は admin 明示操作のみ（rollback 自動連動なし）。

## 既存コード命名規則の分析（FB-01 / FB-SDK-07-4 対応）

| 層 | 既存命名パターン | 本タスクの新規命名（一貫性担保） |
| --- | --- | --- |
| workflow function | `schemaAliasRollback` / `backfillResponseFields`（camelCase 動詞 + 名詞） | `schemaAliasRecompute`（workflow）/ `reverseBackfillResponseFields`（内部関数） |
| workflow failure class | `SchemaAliasRollbackFailure`（PascalCase + `Failure`）/ kind union | `SchemaAliasRecomputeFailure` + kind union（`not_found` / `not_rolled_back` / `batch_failed`） |
| repository module | `repository/schemaAliases.ts`（kebab なし camelCase file） | `repository/schemaAliasRecomputeJobs.ts` |
| repository function | `getById` / `buildSoftDeleteStatement` | `createOrGetJob` / `updateJobStatus` / `getLatestJobByAlias` |
| API path | `/schema/aliases/:aliasId/rollback`（kebab path） | `/schema/aliases/:aliasId/recompute` |
| API response field | `affectedResponseCount` / `recomputeRequired` / `relatedAuditId`（camelCase） | `affectedCount` / `processedCount` / `recomputeAuditId` / `relatedRollbackAuditId` |
| web helper | `rollbackSchemaAlias` / `RollbackApiError` / `RollbackSchemaAliasResult` | `recomputeSchemaAlias` / `getSchemaAliasRecomputeStatus` / `RecomputeApiError` / `RecomputeSchemaAliasResult` |
| audit action | `schema_alias.rollback` / `schema_alias.resolve`（dot-namespaced） | `schema_alias.recompute` |
| migration file | `NNNN_snake_case.sql` | `0020_schema_alias_recompute_jobs.sql` |
| DOM data-role | `recompute-required` / `recompute-warning`（kebab） | `recompute-action` / `recompute-status` / `recompute-trigger` |
| test file | `*.spec.{ts,tsx}`（CLAUDE.md #8） | `schema.recompute.spec.ts` / `schemaAliasRecompute.spec.ts` |

## inventory（変更対象ファイル一覧 / 変更種別）

| ファイル | 変更種別 | 概要 |
| --- | --- | --- |
| apps/api/migrations/0020_schema_alias_recompute_jobs.sql | 新規 | recompute job テーブル |
| apps/api/src/workflows/schemaAliasRecompute.ts | 新規 | reverse-backfill workflow |
| apps/api/src/repository/schemaAliasRecomputeJobs.ts | 新規 | job repository |
| apps/api/src/routes/admin/schema.ts | 編集 | recompute endpoint 2 本追加 |
| apps/web/src/lib/admin/api.ts | 編集 | helper 2 本 + `RecomputeApiError` 追加 |
| apps/web/src/components/admin/SchemaDiffPanel.tsx | 編集 | warning → recompute 実行 UI 置換 |
| docs/00-getting-started-manual/specs/11-admin-management.md | 編集 | recompute 操作仕様追記 |
| docs/00-getting-started-manual/specs/01-api-schema.md | 編集 | recompute endpoint 追記 |
| apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts | 新規 | endpoint test |
| apps/api/src/workflows/schemaAliasRecompute.spec.ts | 新規 | workflow test |
| apps/web/src/lib/admin/__tests__/api.spec.ts | 編集 | helper test 追加 |
| apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx | 編集 | UI test 追加 |

## targeted test ファイルリスト（FB-UI-02-2 / メモリ制約対策）

全件 `pnpm test` ではなく、以下を `--filter` / path 指定で targeted run する:

```
apps/api/src/workflows/schemaAliasRecompute.spec.ts
apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts
apps/web/src/lib/admin/__tests__/api.spec.ts
apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
```

## carry-over 確認

直前コミット（`git log --oneline -5`）に Issue #836 の recompute 実装は存在しない。本タスクは新規実装。Issue #778 の rollback / undo 成果物（`schemaAliasRollback.ts` 等）を前提として積む。

## Phase 1 path topology verification

current topology を Phase 1 で確認済み。実装対象は Next.js App Router の現行 root `apps/web/app` と shared component root `apps/web/src/components` / `apps/web/src/lib` に置く。stale `apps/web/src/app` は参照しない。

| Gate | Result | Evidence |
| --- | --- | --- |
| `apps/web/app` current root | OK | admin route group は `apps/web/app/(admin)/...` を正とする |
| stale `apps/web/src/app` reference | OK | 本 workflow の変更対象 inventory に `apps/web/src/app` を含めない |
| admin API route root | OK | `apps/api/src/routes/admin/schema.ts` を endpoint 追加対象とする |
| admin web helper root | OK | `apps/web/src/lib/admin/api.ts` と `apps/web/src/components/admin/SchemaDiffPanel.tsx` を対象とする |

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| admin 管理仕様 | docs/00-getting-started-manual/specs/11-admin-management.md | 操作はすべて API + 監査ログ経由の原則 |
| API schema | docs/00-getting-started-manual/specs/01-api-schema.md | endpoint 一覧・shape |
| DB 構成 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成 |

### コードアンカー

| アンカー | パス | 用途 |
| --- | --- | --- |
| rollback workflow | apps/api/src/workflows/schemaAliasRollback.ts | recompute の起点・`computeImpact` |
| backfill 関数 | apps/api/src/workflows/schemaAliasAssign.ts:192-277 | reverse-backfill の対称元 |
| rollback endpoint | apps/api/src/routes/admin/schema.ts:376-434 | endpoint 追加パターン |
| audit append | apps/api/src/repository/auditLog.ts:101-136 | audit 記録 |
| web helper | apps/web/src/lib/admin/api.ts:155-195 | helper パターン |
| recompute UI 起点 | apps/web/src/components/admin/SchemaDiffPanel.tsx:241-250 | warning 置換対象 |

## 完了条件 (DoD)

- [ ] recompute = `response_fields` reverse-backfill という根本問題定義が確定している
- [ ] AC-1〜AC-13 / RAC-1〜RAC-3 が index.md に列挙されている
- [ ] 既存命名規則と新規命名の対応表が固定されている（FB-01 / FB-SDK-07-4）
- [ ] inventory（変更対象 12 ファイル）が変更種別付きで列挙されている
- [ ] CONST_007 例外（bulk / notification / Queue fan-out）が宣言されている
