# Phase 6: テスト拡充（fail path / 回帰 guard）

Phase 4 の主要 happy-path / 後方互換ケースに加え、fail path と回帰 guard を追加する。
対象ファイルは Phase 4 と同じ（repository spec / contract spec / migration spec）。

## 1. fail path

| ID | 目的 | 入力 | 期待値 | 配置 |
| --- | --- | --- | --- | --- |
| **TC-F01** | 空文字 batchId は route zod で弾かれる（既存挙動維持） | `GET /audit?batchId=`（空文字） | route の `ListAuditQueryZ` が `batchId` を `min(1)` で reject（400 / バリデーションエラー）。repository まで到達しない。 | `audit.contract.spec.ts` |
| **TC-F02** | 存在しない batchId は空配列（エラーにしない） | `listFiltered({ batchId: "no-such-batch", limit: 10 })` | `[]`（0 件）。例外を投げない。 | `auditLog.repository.spec.ts` |
| **TC-F03** | 不正 JSON 行が batchId 検索を壊さない（回帰） | 壊れた `after_json`（`'{broken'`）を含む状態で `listFiltered({ batchId, limit })` | 正常行のみヒットし、壊れ行は誤ヒット・例外いずれも起こさない。 | `auditLog.repository.spec.ts`（既存 `:152` 行の壊れ JSON 行を再利用） |

> 注: TC-F01 の `min(1)` 挙動は #1079 で確定済みの既存仕様。本タスクは query surface を変更しないため、空文字の扱いを repository では再現せず route 層で担保することを明記する（防御の責務境界）。

## 2. 回帰 guard

| ID | 目的 | 入力 | 期待値 | 配置 |
| --- | --- | --- | --- | --- |
| **TC-R01** | cursor pagination + batchId 併用（既存ケースの保持確認） | `:198-233` の既存ケース | 切替後も `m_bulk_1` → `m_bulk_2` の順でページングできる。 | 既存ケース無改修保持で担保 |
| **TC-R02** | action AND batchId 併用（既存ケースの保持確認） | `:168-196` の既存ケース | `batchId` + `action` の AND が `add()` 経由で成立。 | 既存ケース無改修保持で担保 |
| **TC-R03** | after/before 両方向 COALESCE（既存ケースの保持確認） | `:122-166` の既存ケース | after 由来・before 由来の両方がヒットし続ける。 | 既存ケース無改修保持で担保 |

## 3. index 走査の回帰 guard（test 化方針）

`EXPLAIN QUERY PLAN` の assertion を **永続的な回帰テスト** として残す（TC-01 を migration spec に常設）。これにより、将来 `listFiltered` の batchId 句が `json_extract`（full scan）へ巻き戻された場合に CI で検出できる。

- assertion 方針: プラン `detail` 群に `idx_audit_log_batch_id`（方式B: `idx_audit_log_correlation_id`）が含まれること、かつ `SCAN audit_log`（full scan）が含まれないことの **両方** を assert する（index 名 present だけだと部分 scan を見逃すため二重 guard）。
- 実装は repository SQL の文字列ではなく `EXPLAIN QUERY PLAN` の実行結果を観測する（実装差し替え耐性）。
- migration spec は `_setup.ts` が `0027` を自動適用するため、追加 DDL なしでプランを取得できる。

## 4. 補助コマンド

```bash
# fail path / 回帰 guard を含む全 targeted run
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts \
  apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts

# EXPLAIN QUERY PLAN guard 単体（migration spec のみ）
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/migrations/__tests__/0027_audit_log_batchid_index.spec.ts -t "index"
```

## 5. DoD

- [ ] TC-F01 / TC-F02 / TC-F03 を追加し PASS。
- [ ] TC-R01〜R03 の既存ケースが無改修で PASS（回帰なし）。
- [ ] index 走査の `EXPLAIN QUERY PLAN` guard が常設テストとして残り PASS。
