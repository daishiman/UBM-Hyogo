# Phase 11 — 手動 smoke

## scope 判定

本タスクは **API endpoint のみ**（UI なし）。視覚的検証（スクリーンショット）は対象外。
06c admin pages タスクで UI 統合後に Apple UI/UX 観点の screenshot 検証を行う。

## smoke evidence（curl / wrangler を用いた擬似手順）

実機での実行は dev/staging への deploy 後（本タスクは local 検証のみ）。本ファイルは**実行コマンド集**として残す。

### 前提

```sh
export ADMIN_TOKEN=<SYNC_ADMIN_TOKEN>
export BASE=http://127.0.0.1:8787
```

### 1. authz

```sh
curl -i $BASE/admin/dashboard                                  # 401
curl -i $BASE/admin/dashboard -H "Authorization: Bearer wrong" # 403
curl -i $BASE/admin/dashboard -H "Authorization: Bearer $ADMIN_TOKEN" # 200
```

### 2. members

```sh
curl -s $BASE/admin/members -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
curl -s "$BASE/admin/members?filter=deleted" -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
curl -s $BASE/admin/members/<memberId> -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

### 3. status / notes / delete-restore

```sh
curl -X PATCH $BASE/admin/members/<id>/status -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" -d '{"publishState":"public"}'
curl -X POST $BASE/admin/members/<id>/notes -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" -d '{"body":"test note"}'
curl -X POST $BASE/admin/members/<id>/delete -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" -d '{"reason":"smoke"}'
curl -X POST $BASE/admin/members/<id>/restore -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 4. tags / schema

```sh
curl -s $BASE/admin/tags/queue -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
curl -X POST $BASE/admin/tags/queue/<queueId>/resolve -H "Authorization: Bearer $ADMIN_TOKEN"
curl -s $BASE/admin/schema/diff -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
curl -X POST $BASE/admin/schema/aliases -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" -d '{"questionId":"q1","stableKey":"new_key"}'
```

### 5. meetings / attendance

```sh
curl -s $BASE/admin/meetings -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
curl -X POST $BASE/admin/meetings -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" -d '{"title":"4月例会","heldOn":"2026-04-30"}'
curl -X POST $BASE/admin/meetings/<sid>/attendance -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" -d '{"memberId":"<mid>"}'
# 二重 → 409
curl -X POST $BASE/admin/meetings/<sid>/attendance -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" -d '{"memberId":"<mid>"}'
```

## evidence

automated test (vitest) 251 passed が代替エビデンス。dev deploy 後に上記 curl を実行して main.md を更新する運用。
