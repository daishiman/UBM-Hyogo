# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

schema alias workflow を curl + wrangler tail で手動 smoke する。dryRun / apply / collision / back-fill を確認。

## 実行タスク

1. ローカル apps/api で `pnpm dev`
2. fixture admin user で session 取得
3. 各シナリオの curl 実行
4. wrangler tail で audit_log 確認
5. D1 で schema_questions / schema_diff_queue / response_fields 状態確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/schema-alias-implementation-runbook.md | 操作対象 |

## smoke シナリオ

### シナリオ 1: dryRun 正常系

```bash
curl -X POST 'http://localhost:8787/admin/schema/aliases?dryRun=true' \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{"questionId":"q_test_001","stableKey":"publicConsent"}'
# expected: 200, mode='dryRun', affectedResponseFields=N, conflictExists=false
# DB 完全に不変、audit_log への INSERT なし
```

### シナリオ 2: apply 正常系

```bash
curl -X POST http://localhost:8787/admin/schema/aliases \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{"questionId":"q_test_001","stableKey":"publicConsent"}'
# expected: 200, mode='apply', queueStatus='resolved'
# schema_questions.stableKey 更新、schema_diff_queue.status='resolved'
# response_fields の対象行が back-fill 済み、audit_log に 1 件
```

### シナリオ 3: idempotent

```bash
# 同じ apply を 2 回
curl ... -d '{"questionId":"q_test_001","stableKey":"publicConsent"}'
curl ... -d '{"questionId":"q_test_001","stableKey":"publicConsent"}'
# expected: 両方 200, audit_log は 1 件のまま（2 回目は idempotent return）
```

### シナリオ 4: collision

```bash
# 既に publicConsent が q_test_002 で使われている状態
curl ... -d '{"questionId":"q_test_001","stableKey":"publicConsent"}'
# expected: 422, error=collision
# DB は完全に不変（pre-check で阻止）
```

### シナリオ 5: dryRun で conflictExists=true

```bash
# 同 schema_version で publicConsent が他 question で使用済
curl -X POST '.../aliases?dryRun=true' \
  -d '{"questionId":"q_test_001","stableKey":"publicConsent"}'
# expected: 200, mode='dryRun', conflictExists=true（warning として UI に表示）
```

### シナリオ 6: 認可

```bash
# session なし
curl -X POST .../aliases -d '{"questionId":"q_test_001","stableKey":"foo"}'
# expected: 401
# 一般 user
curl -H "Cookie: session=non-admin" ... 
# expected: 403
```

### シナリオ 7: 削除済み response の back-fill skip

```bash
# is_deleted=true の response_fields を含む状態で apply
curl ... -d '{"questionId":"q_test_002","stableKey":"newKey"}'
# expected: 200, affectedResponseFields は is_deleted=false の行数のみ
# SQL: SELECT count(*) FROM response_fields WHERE questionId='q_test_002' AND is_deleted=true AND stableKey='newKey' → 0
```

### シナリオ 8: GET /admin/schema/diff で recommendedStableKeys

```bash
curl -X GET http://localhost:8787/admin/schema/diff -H "Cookie: session=..."
# expected: 200, diffs[].recommendedStableKeys が score 上位 5 件
```

### シナリオ 9: back-fill 大量データ

```bash
# fixture: 10000 行 response_fields
curl ... -d '{"questionId":"q_large","stableKey":"largeKey"}'
# expected: 200 in <25s, affectedResponseFields=10000
# wrangler tail で batch loop が観察できる
```

### シナリオ 10: 03a sync で queued 自動投入

- 03a の sync mock を実行 → schema_diff_queue に新 row が追加される
- D1 で `SELECT * FROM schema_diff_queue WHERE status='queued'` で確認

## evidence 一覧

| evidence | path | 種別 |
| --- | --- | --- |
| シナリオ 1 curl | outputs/phase-11/curl/dryRun.txt | text |
| シナリオ 2 curl | outputs/phase-11/curl/apply.txt | text |
| シナリオ 3 curl | outputs/phase-11/curl/idempotent.txt | text |
| シナリオ 4 curl | outputs/phase-11/curl/collision-422.txt | text |
| シナリオ 5 curl | outputs/phase-11/curl/dryRun-conflict.txt | text |
| シナリオ 6 curl | outputs/phase-11/curl/{401,403}.txt | text |
| シナリオ 7 SQL | outputs/phase-11/sql/deleted-skip.sql | text |
| シナリオ 8 curl | outputs/phase-11/curl/diff-recommend.txt | text |
| シナリオ 9 結果 | outputs/phase-11/perf/backfill-10000.txt | text |
| audit_log SQL | outputs/phase-11/sql/audit-after-apply.sql | text |
| schema_questions SQL | outputs/phase-11/sql/stable-key-after-apply.sql | text |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を documentation-changelog へ |
| Phase 13 | PR description |

## 多角的チェック観点

| 不変条件 | 手動確認 | 結果 |
| --- | --- | --- |
| #1 | コード grep で stableKey 文字列 0 件 | grep |
| #5 | curl の host が apps/api のみ | OK |
| #14 | UPDATE schema_questions が apply シナリオでのみ発火 | SQL 確認 |
| 監査 | apply のみ audit_log entry、dryRun は無 | SQL 確認 |
| 認可 | 401 / 403 | curl |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | dryRun 正常系 | 11 | pending | curl |
| 2 | apply 正常系 | 11 | pending | curl |
| 3 | idempotent / collision | 11 | pending | curl |
| 4 | dryRun conflict | 11 | pending | curl |
| 5 | 認可 | 11 | pending | curl |
| 6 | 削除 skip | 11 | pending | SQL |
| 7 | recommend | 11 | pending | curl |
| 8 | back-fill 性能 | 11 | pending | 10000 行 |
| 9 | sync 自動投入 | 11 | pending | mock + SQL |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果 |
| メタ | artifacts.json | Phase 11 を completed |

## 完了条件

- [ ] 10 シナリオすべて期待通り
- [ ] evidence (curl + SQL + perf) が揃う
- [ ] 不変条件 #1, #5, #14 手動確認

## タスク100%実行確認

- 全シナリオに evidence
- artifacts.json で phase 11 を completed

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ: evidence を changelog へ
- ブロック条件: violation あれば差し戻し
