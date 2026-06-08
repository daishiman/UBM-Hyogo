# Phase 11 手動テスト結果（NON_VISUAL）

## NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | implementation（D1 migration + repository SQL 変更） |
| 視覚分類 | **NON_VISUAL**（API / DB のみ・UI/UX 変更なし） |
| 非視覚的理由 | `GET /admin/audit` の batchId 検索を JSON full scan から index 列走査へ切り替える内部最適化。画面・レスポンス shape は不変（#1079 で確定済み query surface を維持） |
| 証跡の主ソース | 自動テスト（`auditLog.repository.spec.ts` batchId 非退化ケース + 新規 index 走査ケース / `audit.contract.spec.ts`）+ `EXPLAIN QUERY PLAN` 出力 |
| screenshot を作らない理由 | UI 変更が一切ないため。`screenshots/` ディレクトリは作成しない |

## 実行結果（implemented_local_evidence_captured）

本ファイルは local implementation 後の NON_VISUAL 証跡である。コード実装、migration 追加、focused D1 test、`EXPLAIN QUERY PLAN` index assertion を同一サイクルで取得した。

| カテゴリ | 内容 | 状態 |
| --- | --- | --- |
| focused D1 test | `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts apps/api/src/repository/__tests__/auditLog.repository.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` | PASS（3 files / 28 tests） |
| repository 非退化 | after_json / before_json 両方の batchId hit、action AND、cursor pagination、破損 JSON 混在 | PASS |
| index 走査 | `EXPLAIN QUERY PLAN ... WHERE batch_id = ?` が `idx_audit_log_batch_id` を使用し、`SCAN audit_log` が出ない | PASS |
| 環境ブロッカー | なし | — |

## 代替証跡（実行コマンド）

```
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts

# index 走査確認（test 内 assert）
EXPLAIN QUERY PLAN SELECT audit_id FROM audit_log WHERE batch_id = ?1 ORDER BY created_at DESC, audit_id DESC LIMIT ?2;
```

## 既知制限

- 実地操作（管理画面 UI 操作）は本タスクのスコープ外（UI 変更なし）。証跡は自動テスト + EXPLAIN QUERY PLAN に限定する。
- source-level PASS（製品コードの正当性）と環境ブロッカー（esbuild / worktree isolation 等）は別カテゴリで記録する。
