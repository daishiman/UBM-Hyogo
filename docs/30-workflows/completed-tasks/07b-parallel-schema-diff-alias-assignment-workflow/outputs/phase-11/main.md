# Phase 11: 手動 smoke (API レベル記述のみ)

## 注記

このタスクには UI 成果物がない（artifacts.json `ui_routes: []`）。手動 smoke は curl ベースの API シナリオを記述するに留める。実環境での実行は wrangler dev が立ち上がる別 task で実施。

## smoke シナリオ（記述）

### S1: dryRun 正常系

```bash
curl -X POST 'http://localhost:8787/admin/schema/aliases?dryRun=true' \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"questionId":"q1","stableKey":"full_name"}'
# expected: 200, mode='dryRun', affectedResponseFields=N, conflictExists=false
# 副作用: なし (DB 不変、audit なし)
```

### S2: apply 正常系

```bash
curl -X POST http://localhost:8787/admin/schema/aliases \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"questionId":"q1","stableKey":"full_name"}'
# expected: 200, mode='apply', queueStatus='resolved'
# 副作用: schema_questions.stable_key='full_name', diff resolved, response_fields back-fill, audit_log 1 件
```

### S3: idempotent

```bash
# 同じ apply を 2 回
# expected: 両方 200, audit 1 件のまま
```

### S4: collision 422

```bash
# 既に full_name が q2 で使われている状態で
curl ... -d '{"questionId":"q1","stableKey":"full_name"}'
# expected: 422 + body.existingQuestionIds=['q2']
```

### S5: 認可

```bash
# session なし → 401
curl -X POST http://localhost:8787/admin/schema/aliases -d '{...}'
# 一般 user → 403
```

### S6: GET diff + recommendedStableKeys

```bash
curl -X GET http://localhost:8787/admin/schema/diff -H "Authorization: Bearer <admin-jwt>"
# expected: 200, items[].recommendedStableKeys: string[5]
```

## evidence

vitest test 結果が evidence に相当（Phase 9 参照）。実環境 curl 実行は本タスク外。
