# Phase 1: 要件定義

## タスク分類

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation task（コード変更を伴う） |
| 視覚分類 | **NON_VISUAL**（API / DB のみ。UI/UX 変更なし） |
| implementation_mode | `new`（新規 migration + repository SQL 変更。current branch に既存実装なし＝P50 チェック「No」） |
| 領域 | `apps/api` のみ（D1 直接アクセスは apps/api に閉じる＝CLAUDE.md 不変条件） |
| 規模 | 中規模（migration 1 本 + repository 1 ファイル + test） |

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | 通常の実装 Phase（RED/GREEN）とする |
| upstream（dev/main）にマージ済み | No | 未マージ。`grep batchId\|correlation_id apps/api/migrations/` = 0 件で確認済み |
| 前提タスク（依存）が完了済み | Yes | #1079（batchId filter）/ #1036（bulk tag assign）は CLOSED・実装済み。本タスクはその上の index 最適化 |

## スコープ（含む / 含まない）

`index.md` の「スコープ」節を正本とする。要約:

- **含む**: `0027` migration（相関列 + index、fallback 採用時 backfill UPDATE）/ `auditLog.ts` の batchId 検索切替（fallback 採用時 `append` write 拡張）/ rollback 手順 / 非退化 + index 走査 test。
- **含まない**: query surface 変更（#1079 確定済み）/ bulk write 変更（#1036）/ migration apply・deploy・commit・PR（user-gated）。

## 受け入れ基準

`index.md` の AC-1〜AC-7 を継承する。

## 既存コードの命名規則分析（FB-01 / FB-SDK-07-4 準拠）

| 観点 | 既存規則 | 本タスクでの遵守 |
| --- | --- | --- |
| migration ファイル名 | `NNNN_snake_case.sql`（`apps/api/migrations/README.md` の sequence guard） | `0027_audit_log_batchid_index.sql` |
| SQL 列名 | `snake_case`（`audit_id` / `actor_email` / `before_json`） | 新規列も `snake_case`（`batch_id` または `correlation_id`） |
| repository 関数 | camelCase（`listFiltered` / `append`） | 新規関数は作らず既存を改修。SELECT エイリアスは既存 `SELECT_COLS` の `snake AS camel` 規則に従う |
| index 名 | `idx_<table>_<columns>`（`idx_audit_log_target`） | `idx_audit_log_batch_id`（または `idx_audit_log_correlation_id`） |
| 列方式 | — | Phase 2 で VIRTUAL generated / plain 列を実測決定 |

## inventory（変更対象ファイル候補）

| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `apps/api/migrations/0027_audit_log_batchid_index.sql` | 新規 | 相関列 + index 追加（+ fallback 時 backfill） |
| `apps/api/src/repository/auditLog.ts` | 編集 | `listFiltered` batchId 分岐の SQL 切替（+ fallback 時 `append` write 拡張・`SELECT_COLS` は不変想定） |
| `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | 編集 | 非退化担保（既存ケース維持）+ index 走査 / 後方互換ケース追加 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 編集（必要時） | route 契約非退化確認 |
| `apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts` | 新規（任意） | migration 単体（列・index 存在 + EXPLAIN QUERY PLAN） |
| `apps/api/migrations/sequence-exceptions.json` | 不変 | `0027` は重複しないので登録不要 |

## targeted test ファイルリスト（FB-UI-02-2: 全件 test 回避）

D1 group は `vitest.d1.config.ts`（`singleFork`）で実行する。targeted run:

```
apps/api/src/repository/__tests__/auditLog.repository.spec.ts
apps/api/src/routes/admin/audit.contract.spec.ts
apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts   # 新規作成時
```

## carry-over 確認

`git log --oneline -5` の直近コミット（#1151 identity-conflicts / #1150 backfill preview 等）は本タスクと無関係。本タスクは新規 workflow であり carry-over 成果物なし。

## 不変条件（本タスク固有）

1. **append-only 維持**: `auditLog.ts` から UPDATE/DELETE 関数を新規 export しない（`auditLog.ts:228-229` の設計を維持）。backfill が必要な場合も migration 内 SQL に限定し、アプリ API には足さない（AC-7）。
2. **query surface 不変**: `ListAuditQueryZ`（`audit.ts:15-25`）/ `AdminAuditListResponseZ` は変更しない（#1079 確定済み）。
3. **D1 直接アクセスは apps/api に閉じる**: apps/web 変更なし。
4. **テスト migration 互換**: `_setup.ts` は `--` 除去 + `;` 分割で適用するため、`0027` は単文 DDL のみ（`BEGIN...END` / トリガ不使用）。
