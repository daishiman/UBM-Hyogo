# Phase 7: Coverage Check

## メタ情報

| Key | Value |
| --- | --- |
| workflow | `issue-837-schema-alias-bulk-rollback` |
| 入力 | `phase-06-test-expansion.md`（Phase 6 補強テスト完了後） |
| 目的 | 本 PR で変更したファイル / 関数の line / branch coverage を確認する。全体 coverage を指標にせず、**変更行に限定**した実測値を証跡として残す |

## 計測スコープ（変更ファイルのみ）

以下のファイルおよび差分範囲のみを計測対象とする。既存ファイルのうち本 PR で一切変更していない行は対象外とし、「全体 X%」のような広域指定は行わない。

| ファイル | 変更区分 | 計測対象関数 / 差分ブロック |
| --- | --- | --- |
| `apps/web/src/lib/admin/api.ts` | 追記（新関数） | `rollbackSchemaAliasBulk`（全行）/ `runWithConcurrency`（export 変更後の全行）/ error.kind マッピング分岐 |
| `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts` | 新規 | ファイル全体（`toggle` / `selectAll` / `clearSelection` / `openModal` / `submit` / `isSubmitting` 解放 / `summary` 集計） |
| `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx` | 新規 | ファイル全体（idle / submitting / done フェーズ分岐 / summary バナー分岐 / 失敗再 submit ボタン表示分岐） |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 追記（差分のみ） | bulk rollback mode トグル処理 / `useSchemaDiffBulkRollbackSelection` 呼び出し / `SchemaDiffBulkRollbackModal` 条件 mount / 50 件超 alert 分岐 |

## 計測対象外（明示除外）

| ファイル / 区分 | 除外理由 |
| --- | --- |
| `apps/web/src/lib/admin/api.ts` の **既存**関数（`rollbackSchemaAlias` / `postSchemaAliasBulk` / `postSchemaAlias` 等） | 本 PR で変更なし。既存 spec で維持済み |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` の **既存** HistoryPane 行（single rollback UI / undo toast 等） | 本 PR で変更なし |
| `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx` | 本 PR で変更なし |
| `apps/web/src/components/admin/hooks/useSchemaDiffBulkSelection.ts` | 本 PR で変更なし |
| `playwright/tests/issue837-schema-bulk-rollback.spec.ts` | テストファイル自体は計測対象外 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | ドキュメントのみ。coverage 計測対象外 |

## カバレッジ閾値

変更ファイルの **差分行（追加・変更行）** に対して以下を要求する。

| 対象 | line coverage | branch coverage |
| --- | --- | --- |
| `rollbackSchemaAliasBulk`（api.ts 差分） | 100% | ≥ 90% |
| `runWithConcurrency`（export 変更部分） | 100% | 100% |
| `useSchemaDiffBulkRollbackSelection.ts`（新規ファイル全体） | ≥ 90% | ≥ 85% |
| `SchemaDiffBulkRollbackModal.tsx`（新規ファイル全体） | ≥ 85% | ≥ 75% |
| `SchemaDiffPanel.tsx` の bulk rollback 追記差分 | ≥ 80% | ≥ 70% |

> **根拠**: `rollbackSchemaAliasBulk` と `runWithConcurrency` は純粋なロジック関数であり、Phase 6 のテストケース（FP-A / FP-B / FP-C / FP-D / FP-F）で全分岐をカバーできるため 100% / ≥ 90% を要求する。modal / panel の branch 閾値が低めなのは、Jest での focus trap / Escape key ハンドラの環境依存部分をカウント外とするため。

## 計測手順

### 1. coverage 計測実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web vitest run --coverage \
  "src/lib/admin/__tests__/api.spec.ts" \
  "src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx" \
  "src/components/admin/__tests__/SchemaDiffBulkRollbackModal.spec.tsx" \
  "src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx"
```

### 2. レポート確認

```bash
# HTML レポートで変更ファイルごとの行率・分岐率を確認
open apps/web/coverage/lcov-report/index.html
```

`coverage/lcov-report/` の各ファイルページで、**未到達行（赤ハイライト）を直接スクリーンショット**して Phase 11 evidence ディレクトリに保存する。未到達分岐が残る場合は以下のいずれかを選択する。

- テスト追加（Phase 6 にフィードバック）
- 「テスト対象外」として理由をこのファイルの **未到達分岐メモ** セクションに記録する

### 3. 変更行の実測を証跡として残す

`lcov.info` から対象ファイルの差分行番号を抽出し、行番号 / hit count をテーブルで記録する。

```bash
# lcov.info から対象ファイルの行 hit を抽出（例: api.ts の rollbackSchemaAliasBulk 範囲）
grep -A 200 "SF:.*api.ts" apps/web/coverage/lcov.info | grep "^DA:" | head -80
```

> **ポイント**: 「全体 X%」ではなく差分行の hit count を証跡にすることで、他ファイルの既存 coverage を混在させない（FB Feedback 5 対応）。

## 未到達分岐メモ（実装後に記入）

> 実装後、未到達分岐が判明した場合はここに記録する。

| ファイル | 行番号（目安） | 未到達理由 | 判断（テスト追加 / 対象外） |
| --- | --- | --- | --- |
| （実装後に記入） | — | — | — |

## 完了条件

- [ ] 計測対象ファイルが上表の閾値を満たす
- [ ] 未到達分岐がすべて「テスト追加済み」または「対象外（理由記録済み）」である
- [ ] `lcov.info` / HTML レポートの証跡スクリーンショットまたは DA 抽出結果を Phase 11 evidence に含める
- [ ] 計測対象外ファイルの coverage が本 PR 前後で低下していない（既存 spec が全件 green であること）
