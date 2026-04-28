# curl レシピ集 — `POST /admin/sync/responses`

> 環境変数として `API_URL`（例: `http://localhost:8787` / `https://api-staging.example.workers.dev`）と
> `SYNC_ADMIN_TOKEN` を export してから実行する。

```bash
export API_URL="http://localhost:8787"            # local
# export API_URL="https://api-staging.<...>.workers.dev"  # staging
export SYNC_ADMIN_TOKEN="$(op read 'op://...')"   # 1Password から注入推奨
```

## Recipe 1: 通常同期（cursor あり）

```bash
curl -i -X POST "$API_URL/admin/sync/responses" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

期待: 200 / `{"ok":true,"result":{"status":"succeeded",...}}`

## Recipe 2: 強制 full sync

```bash
curl -i -X POST "$API_URL/admin/sync/responses?fullSync=true" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

`fullSync=true` で `cursor` を無視して先頭から再取得する（runbook 参照）。

## Recipe 3: 明示 cursor 指定（差分継続）

```bash
curl -i -X POST "$API_URL/admin/sync/responses?cursor=p2" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

ステージング smoke では Recipe 6（pagination 終了確認）の前後で活用する。

## Recipe 4: 認証エラー（401 確認）

```bash
curl -i -X POST "$API_URL/admin/sync/responses"
# Authorization ヘッダなし → 401
curl -i -X POST "$API_URL/admin/sync/responses" -H "Authorization: Bearer wrong"
# 不一致 → 401
```

期待: HTTP 401 / `{"ok":false,"error":"unauthorized"}`

## Recipe 5: 二重起動（409 確認）

```bash
# 並列実行
( curl -s -o /tmp/r1.json -w "%{http_code}\n" -X POST "$API_URL/admin/sync/responses" \
    -H "Authorization: Bearer $SYNC_ADMIN_TOKEN" & )
( curl -s -o /tmp/r2.json -w "%{http_code}\n" -X POST "$API_URL/admin/sync/responses" \
    -H "Authorization: Bearer $SYNC_ADMIN_TOKEN" & )
wait
cat /tmp/r1.json /tmp/r2.json
```

期待: 1 つは 200、もう 1 つは 409（`status=skipped`、`skippedReason=another response_sync is running`）。

## Recipe 6: cursor pagination 終了確認

```bash
# fixture を page1（nextPageToken='p2'）+ page2（nextPageToken=null）に切替
curl -i -X POST "$API_URL/admin/sync/responses?fullSync=true" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

期待: `result.cursor` が末尾 response の `submittedAt|responseId`、`processedCount=10`（page1 5件 + page2 5件）。

## Recipe 7: 設定不備（500 確認）

```bash
# SYNC_ADMIN_TOKEN を Cloudflare Secrets から外した状態で
curl -i -X POST "$API_URL/admin/sync/responses" \
  -H "Authorization: Bearer dummy"
```

期待: HTTP 500 / `{"ok":false,"error":"SYNC_ADMIN_TOKEN not configured"}`
（負例なので staging で常設しないこと。production 試験は禁止。）
