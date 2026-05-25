# Phase 8: Refactoring

## メタ情報

| Key | Value |
| --- | --- |
| workflow | `issue-837-schema-alias-bulk-rollback` |
| 入力 | `phase-06-test-expansion.md`（Green 状態）/ `phase-03-design-review.md`（R-8 MINOR 指摘） |
| 目的 | green 状態を維持しつつ、`runWithConcurrency` の SSOT 化・命名整合・型安全を整える |

## リファクタ対象テーブル

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| RF-1 | `runWithConcurrency`（`apps/web/src/lib/admin/api.ts`） | `private` 関数として同ファイル内にのみ存在（`postSchemaAliasBulk` からのみ参照） | `export` に変更し、`rollbackSchemaAliasBulk` も同一定義を参照する形に SSOT 化 | Phase 3 R-8 MINOR 指摘。bulk resolve / bulk rollback で同じ並列実行ロジックが重複定義されることを防ぐ。`grep -rn "runWithConcurrency" apps/web/src/` で定義が 1 箇所のみであることを確認する |
| RF-2 | `SchemaAliasRollbackBulkRowResult` 型（`apps/web/src/lib/admin/api.ts`） | automation-30 実装で `api.ts` に export 済み | `export interface` として明示 export し、modal / hook / test ファイルから import できる | 型が 3 ファイル（api.ts / hook / modal）をまたぐため、重複 inline 定義や `as` キャストが発生しないよう SSOT 化済み |
| RF-3 | `SchemaAliasRollbackBulkOptions` 型（`apps/web/src/lib/admin/api.ts`） | automation-30 実装で `api.ts` に export 済み | `export interface` として明示 export | 同上。`rollbackSchemaAliasBulk` 呼び出し側（hook）が型付きで `onRowResult` を参照できる |
| RF-4 | `BulkRollbackSubmitStatus` 型（hook / modal 間の row status 値） | `"idle" \| "pending" \| "success" \| "error"` を hook が export し modal が型参照 | 既に `useSchemaDiffBulkRollbackSelection.ts` で `BulkRollbackSubmitStatus` を export 済み。専用 types ファイルへの分離は不要 | 文字列リテラルは 1 箇所に集約済みで、追加抽象は過剰 |
| RF-5 | `BULK_ROLLBACK_MAX_ROWS` 定数の参照 | Phase 5 時点では `api.ts` で定義後、hook / UI 側で magic number `50` を直書きしている可能性がある | `BULK_ROLLBACK_MAX_ROWS` を `api.ts` から import して参照する形に統一 | magic number の排除。`#776` の `BULK_RESOLVE_MAX_ROWS`（または同等定数）との命名対称性を維持する |
| RF-6 | `SchemaDiffBulkRollbackModal` の summary バナー分岐（`all-success` / `partial` / `all-failed`） | 条件式が modal コンポーネント内に散在している場合、if-else のネストが深くなる可能性がある | `summary` から集計関数 `deriveBulkRollbackSummaryKind(summary): "all-success" \| "partial" \| "all-failed"` を抽出し、modal 内の分岐を簡素化 | AC-4「全成功・部分成功・全失敗を明示的に区別」のロジックを単一関数にまとめ、テストしやすくする（Phase 6 FP-B-04 / FP-C-02 の spec が当該関数を直接テストできる） |
| RF-7 | `useSchemaDiffBulkRollbackSelection` の `submit` 関数 | 行数が 80 行を超える場合に「selection state 更新」と「HTTP fan-out」が混在している可能性がある | 行数が 80 行以下であれば分割しない（過剰抽象化回避）。80 行を超えた場合のみ `_runBulkRollback` 内部ヘルパに fan-out 部分を切り出す | YAGNI。bulk resolve hook（`useSchemaDiffBulkSelection`）と同等の判断基準を適用する |
| RF-8 | navigation / import パス | Phase 5 実装中に `../../lib/admin/api` のような相対 import が混在する可能性がある | `@/lib/admin/api` / `@/components/admin/...` のエイリアス import に統一 | `tsconfig.paths` が `@/` を解決しており、相対パスの深さに依存しない import にする |

## `runWithConcurrency` SSOT 化の確認手順（RF-1）

Phase 8 完了後、以下の `grep` コマンドで重複定義がないことを確認する。

```bash
# 定義が 1 箇所（api.ts）のみであることを確認
grep -rn "runWithConcurrency" apps/web/src/ --include="*.ts" --include="*.tsx"
# 期待: "apps/web/src/lib/admin/api.ts" 1 行の定義 + 各 helper からの呼び出し行のみ
# "function runWithConcurrency" または "const runWithConcurrency" が 1 件であること
grep -rn "function runWithConcurrency\|const runWithConcurrency" apps/web/src/
```

## 横展開メモ（本サイクル外）

- bulk 操作 hook パターン（selection / fan-out / phase 管理）は admin 系他画面（members / tags / requests）で再利用余地あるが、本サイクルでは `_shared/` への抽出は行わない（CONST_007「先送り NG」だが、これは将来 followup として親 backlog に既に存在し、本タスクの完了条件ではない）。
- URL search param による bulk rollback mode 永続化は本サイクルでは local state のみ（followup 候補として `index.md` 「含まないもの」に追記可）。

## 完了条件

- [ ] `runWithConcurrency` の定義が `apps/web/src/lib/admin/api.ts` に 1 箇所のみ（`grep` で確認）
- [ ] `SchemaAliasRollbackBulkRowResult` / `SchemaAliasRollbackBulkOptions` / `BulkRollbackPhase` が `export` で明示公開されている
- [ ] `BULK_ROLLBACK_MAX_ROWS` を参照する箇所で magic number `50` が直書きされていない
- [ ] Phase 6 の全テストが green のままである（リファクタで退行なし）
- [ ] 型 export / import 経路に `as unknown as` のような強制キャストがない
- [ ] 過剰抽象化を行っていない（`submit` 関数が 80 行以下であれば分割しない）
