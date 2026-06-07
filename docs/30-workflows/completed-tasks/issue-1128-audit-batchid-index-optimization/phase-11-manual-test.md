# Phase 11: 手動テスト / NON_VISUAL 証跡

## NON_VISUAL 宣言（WEEKGRD-03）

| 項目 | 内容 |
| --- | --- |
| タスク種別 | API / DB（D1 migration + `apps/api` repository SQL 変更） |
| 視覚分類 | **NON_VISUAL** |
| 非視覚的である理由 | 変更対象は D1 schema（`0026` migration の相関列 + index）と `auditLog.ts` の `listFiltered` batchId 検索 SQL のみ。`GET /admin/audit` の query surface・返却 shape は不変（#1079 確定済み）であり、レンダリング・UI/UX・画面遷移に一切影響しない。表示結果は切替前と同一（AC-5 非退化）であり、視覚的差分は原理的に発生しない |
| 代替証跡 | (1) D1 targeted 自動テスト（spec 名 + 件数）、(2) `EXPLAIN QUERY PLAN` 出力（index 走査の実証） |

## 実地操作の可否（Before-Quit-001）

実地のブラウザ操作・手動 UI クリックは **不可 / 不要**。理由:

- 本タスクは UI を持たない（API/DB 層）。手動操作で観測できる視覚的変化が存在しない。
- 振る舞いの正しさは「batchId フィルタ返却の非退化」と「index 列走査になったこと」で定義され、
  いずれも自動テスト + `EXPLAIN QUERY PLAN` で機械的に実証できる。
- production / staging への migration apply は user-gated（Phase 13 以降・本 Phase では実施しない）。

→ 実地操作の代替として、下記「自動テスト結果」と「EXPLAIN QUERY PLAN 出力」+「既知制限」を証跡とする。

## 代替証跡 1: 自動テスト（spec 名 / 件数）

> source-level（コードに存在する spec / assertion）と環境ブロッカー（ローカル実行不可事由）を
> 別カテゴリで記録する（WEEKGRD-01）。実行結果（PASS/FAIL・件数）は Phase 9 実行後に追記する。

### source-level（spec 定義の存在）

| spec ファイル | カバー AC | 主な assertion |
| --- | --- | --- |
| `apps/api/src/repository/__tests__/auditLog.repository.spec.ts`（batchId ケース `:122-235`） | AC-3 / AC-4 / AC-5 | after_json 由来 / before_json 由来双方が同一 batchId で 1 検索にヒット（COALESCE）。既存行ヒット。返却 shape 非退化 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | AC-5 | route 契約（query surface・返却 shape）非退化 |
| `apps/api/migrations/__tests__/0026_audit_log_batchid_index.spec.ts`（新規作成時） | AC-1 / AC-2 | `PRAGMA table_info` で相関列存在 / `EXPLAIN QUERY PLAN` で index 走査 |

### 環境ブロッカー（別カテゴリ・あれば記録）

| ブロッカー | 影響 | 回避 |
| --- | --- | --- |
| （例: Miniflare D1 が VIRTUAL 列 index を拒否） | AC-2 が方式 A で実証不可 | 方式 B（plain `correlation_id`）へ fallback（Phase 2 ゲート）。fallback 後に同 spec で再実証 |
| （例: esbuild / worktree isolation での vitest 起動失敗） | テスト実行自体が不可 | `pnpm verify:vitest-runtime` で復旧（CLAUDE.md 参照）。これは source-level PASS とは別カテゴリの環境事由として記録 |

> 実行が成功した場合は「N spec / M tests PASS」を本セクションに事実として追記する。

## 代替証跡 2: EXPLAIN QUERY PLAN 出力（AC-2 の核心）

batchId 検索が full scan から index 列走査へ変わったことを実測する。spec 内 or 使い捨て検証で取得し出力を貼る。

```sql
EXPLAIN QUERY PLAN
SELECT audit_id FROM audit_log
WHERE batch_id = 'batch-1079';   -- 方式 B 採用時は correlation_id = ...
```

| 観点 | 期待出力 | 判定 |
| --- | --- | --- |
| 切替後 | `SEARCH audit_log USING INDEX idx_audit_log_batch_id`（方式 B=`idx_audit_log_correlation_id`） | index 走査 = PASS |
| NG パターン | `SCAN audit_log` のまま | full scan = FAIL → 方式 fallback 判断 |

> 実際の `EXPLAIN QUERY PLAN` 出力テキストを Phase 9 実行後にここへ貼り付け、source-level PASS の確証とする。

## screenshot 方針

- **`outputs/phase-11/screenshots/.gitkeep` は削除する**（screenshot ディレクトリ自体を作らない / 残さない）。
- 理由: NON_VISUAL タスクのため screenshot 証跡は不要。視覚的差分が存在しないため画像は撮らない。
- PR 本文にも screenshot 専用セクションを作らない（自動テスト + EXPLAIN QUERY PLAN を主証跡とする）。

## manual-test-result.md メタ（Feedback 4）

`outputs/phase-11/manual-test-result.md` を作成する場合、冒頭メタに以下を必ず明記する:

| メタ項目 | 値 |
| --- | --- |
| 証跡の主ソース | D1 targeted 自動テスト（`auditLog.repository.spec.ts` の batchId ケース + `audit.contract.spec.ts`）と `EXPLAIN QUERY PLAN` 出力 |
| screenshot を作らない理由 | NON_VISUAL（API/DB 層）・UI 変更なし・query surface / 返却 shape 不変で視覚的差分が原理的に発生しないため |
| 実地操作の可否 | 不可 / 不要（UI を持たない層）。自動テスト + EXPLAIN QUERY PLAN + 既知制限で代替 |

## 完了条件

- source-level 証跡（spec 名 / 件数）と EXPLAIN QUERY PLAN 出力が記録されている。
- 環境ブロッカーがあれば source-level PASS と分離して記録されている。
- `outputs/phase-11/screenshots/.gitkeep` が削除され、screenshot 専用セクションが残っていない。
