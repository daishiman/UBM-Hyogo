# Phase 11 — Manual Smoke Evidence

> 注: 本タスクは UI なしの API のため、スクリーンショットを取得しない。代わりに curl trace と
> wrangler dev 出力 placeholder で代替する。実環境での実行は本タスクスコープ外。

## 前提

- session resolver: MVP では `Authorization: Bearer session:<email>:<memberId>`
- 05a/b 実装後は Auth.js cookie に置換（本タスクでは触らない）

## curl サンプル

### 1) GET /me

```
curl -s -H 'x-ubm-dev-session: 1' \
  -H 'Authorization: Bearer session:user1@example.com:m_001' \
  http://localhost:8787/me
```

期待 (200):
```json
{
  "user": {
    "memberId": "m_001",
    "responseId": "r_001",
    "email": "user1@example.com",
    "isAdmin": false,
    "authGateState": "active"
  },
  "authGateState": "active"
}
```

### 2) GET /me/profile

```
curl -s -H 'x-ubm-dev-session: 1' \
  -H 'Authorization: Bearer session:user1@example.com:m_001' \
  http://localhost:8787/me/profile
```

期待: `MeProfileResponseZ` に一致。`editResponseUrl` が null の場合は `fallbackResponderUrl` を返す。

### 3) POST /me/visibility-request

```
curl -s -X POST \
  -H 'x-ubm-dev-session: 1' \
  -H 'Authorization: Bearer session:user1@example.com:m_001' \
  -H 'Content-Type: application/json' \
  -d '{"desiredState":"hidden","reason":"一時的に"}' \
  http://localhost:8787/me/visibility-request
```

期待 (202): `{"queueId":"...", "type":"visibility_request","status":"pending","createdAt":"..."}`
2 回連続実行で 2 回目は 409 DUPLICATE_PENDING_REQUEST。

### 4) POST /me/delete-request

```
curl -s -X POST \
  -H 'x-ubm-dev-session: 1' \
  -H 'Authorization: Bearer session:user1@example.com:m_001' \
  -H 'Content-Type: application/json' \
  -d '{"reason":"退会"}' \
  http://localhost:8787/me/delete-request
```

期待 (202): `{"queueId":"...", "type":"delete_request","status":"pending","createdAt":"..."}`

### 5) 401 確認

```
curl -i http://localhost:8787/me
```

期待: HTTP 401 + `{"code":"UNAUTHENTICATED"}`。レスポンス本文に memberId 文字列を含まない。

## wrangler dev 出力 placeholder

```
[wrangler:dev] Ready on http://127.0.0.1:8787
GET /me 200 in 24 ms
GET /me/profile 200 in 31 ms
POST /me/visibility-request 202 in 28 ms
POST /me/visibility-request 409 in 19 ms  # 二重申請
POST /me/delete-request 202 in 27 ms
GET /me 401 in 5 ms                       # 認証ヘッダなし
```

実機録画は 05a/b 後の e2e smoke で取得する。
