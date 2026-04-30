# Phase 11: 手動 smoke — outputs

本タスクは API 層の workflow 実装が中心で UI 画面を持たないため、
スクリーンショットによる UI/UX 検証は適用外（Apple UI/UX 観点はスコープ対象外）。
`/admin/tags` UI 側の smoke は 06c タスクおよび 08b の E2E にて実施する。

## API 手動 smoke 手順（staging 投入後の確認用）

```bash
# 1. 認証用 admin JWT を取得（既存 admin 5a の手順）
ADMIN_JWT="eyJ..."

# 2. queue 一覧
curl -H "Authorization: Bearer $ADMIN_JWT" \
  "https://api-staging.ubm-hyogo.example.com/admin/tags/queue?status=queued"

# 3. confirmed resolve
curl -X POST -H "Authorization: Bearer $ADMIN_JWT" \
  -H "content-type: application/json" \
  -d '{"action":"confirmed","tagCodes":["interest-ai"]}' \
  "https://api-staging.ubm-hyogo.example.com/admin/tags/queue/<queueId>/resolve"
# 期待: 200 + result.status='resolved'

# 4. idempotent 再呼び出し
（同じコマンド再実行 → 200, audit_log 件数増えず）

# 5. confirmed 後の rejected → 409
curl -X POST -H "Authorization: Bearer $ADMIN_JWT" \
  -H "content-type: application/json" \
  -d '{"action":"rejected","reason":"override"}' \
  "https://api-staging.ubm-hyogo.example.com/admin/tags/queue/<queueId>/resolve"
# 期待: 409 + error="state_conflict"

# 6. rejected resolve
curl -X POST -H "Authorization: Bearer $ADMIN_JWT" \
  -H "content-type: application/json" \
  -d '{"action":"rejected","reason":"spam"}' \
  "https://api-staging.ubm-hyogo.example.com/admin/tags/queue/<別の queueId>/resolve"
# 期待: 200 + result.status='rejected'

# 7. unauthorized
curl -X POST "https://api-staging.../admin/tags/queue/q/resolve"
# 期待: 401
```

## D1 観測クエリ（staging）

```sql
-- 直近の resolve 状況
SELECT queue_id, status, reason, updated_at
  FROM tag_assignment_queue
  ORDER BY updated_at DESC LIMIT 20;

-- 直近の audit
SELECT created_at, action, target_id, after_json
  FROM audit_log
  WHERE target_type = 'tag_queue'
  ORDER BY created_at DESC LIMIT 20;
```

## 完了条件

- [x] API smoke 手順が明文化
- [x] 観測クエリが用意されている
- [N/A] スクリーンショット — 本タスクは UI 範囲外
