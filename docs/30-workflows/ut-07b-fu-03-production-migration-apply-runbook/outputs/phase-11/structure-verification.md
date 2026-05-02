# Structure Verification（5 オブジェクト存在確認 + runbook 章立て）

## Scope

(1) F2 `scripts/d1/postcheck.sh` の SQL 期待出力 + (2) Phase 5 runbook 本体の章立て grep を本仕様書で確定する。production への接続は実行しない。

## A. F2 postcheck 期待 SQL 出力

F2 は次の 5 オブジェクトを SELECT のみで存在確認する。

```sql
-- 1. schema_aliases table の存在
SELECT name FROM sqlite_master WHERE type='table' AND name='schema_aliases';
-- expected: schema_aliases

-- 2. UNIQUE index #1
SELECT name FROM sqlite_master
 WHERE type='index' AND name='idx_schema_aliases_revision_stablekey_unique';
-- expected: idx_schema_aliases_revision_stablekey_unique

-- 3. UNIQUE index #2
SELECT name FROM sqlite_master
 WHERE type='index' AND name='idx_schema_aliases_revision_question_unique';
-- expected: idx_schema_aliases_revision_question_unique

-- 4. schema_diff_queue.backfill_cursor 列
SELECT name FROM pragma_table_info('schema_diff_queue') WHERE name='backfill_cursor';
-- expected: backfill_cursor

-- 5. schema_diff_queue.backfill_status 列
SELECT name FROM pragma_table_info('schema_diff_queue') WHERE name='backfill_status';
-- expected: backfill_status
```

期待 exit code: `0`（5 行 hit）。
1 件でも欠落した場合 F2 は `exit=4` を返す。

## destructive SQL 不在の確認

```bash
rg -n "DROP|DELETE|TRUNCATE|UPDATE" scripts/d1/postcheck.sh \
  || echo "PASS: no destructive SQL in postcheck"
```

期待: 0 hit。SELECT のみ。

## B. Phase 5 runbook 章立て grep

```bash
rg "Overview|承認ゲート|Preflight|Apply|Post-check|Evidence|Failure handling|Smoke 制限" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md
```

期待章立て:

- Overview / 適用対象
- 承認ゲート（commit / PR / merge / ユーザー承認 / DRY_RUN=0 明示）
- Preflight（F1 呼び出し）
- Apply 手順（F4 / F5 経由）
- Post-check（F2 呼び出し）
- Evidence 保存（F3 呼び出し）
- Failure handling（exit code → 判断待ち）
- Smoke 制限（read-only / DRY_RUN=1）

## 結果

| 観点 | 判定 |
| --- | --- |
| F2 5 オブジェクト SELECT 仕様 | DOC_PASS（5 SQL 確定） |
| F2 destructive SQL 不在 | DOC_PASS |
| Phase 5 章立て 8 セクション | DOC_PASS |
| 実走 SQL 出力 | NOT_EXECUTED_IN_THIS_REVIEW（operator 実施タスクで取得） |
