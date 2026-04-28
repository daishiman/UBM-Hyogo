# Phase 11: API レスポンス証跡

> **ステータス: NOT EXECUTED (docs-only モード)**
> 実行時は各 smoke の生ログを本書に貼付する。

## 1. S-01: Web Top レスポンスヘッダ

```text
$ curl -sI https://<web-url>
TBD (HTTP/2 200 / レスポンスヘッダ全文)
```

## 2. S-02: API /health body

```text
$ curl -sS https://<api-host>/health
TBD (例: {"status":"healthy","version":"...","time":"..."})
```

## 3. S-03: API /health/db body

```text
$ curl -sS https://<api-host>/health/db
TBD (例: {"status":"healthy","db":"ok","check":"SELECT 1"})
```

## 4. S-04: Web HTML 先頭

```html
TBD (head -n 50 の出力)
```

## 5. S-05: CORS preflight

```text
$ curl -sS -X OPTIONS -H "Origin: https://<web-url>" \
    -H "Access-Control-Request-Method: GET" \
    -i https://<api-host>/health
TBD
```

## 6. S-06: wrangler tail 観察

| 観察開始 | 観察終了 | 期間 | 観察 req 数 | error 件数 | 主要ログ |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD |

## 7. S-07: D1 SELECT 1

```text
$ bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT 1"
TBD
```

## 8. S-08: Web→API XHR (実画面)

- 画面: TBD (例: `/members`)
- 実行操作: TBD
- DevTools Network 観測: TBD (status / latency)
- スクショ: `outputs/phase-11/screenshots/<TS>-s08.png`

## 9. S-09: favicon

```text
$ curl -sI https://<web-url>/favicon.ico
TBD
```

## 10. S-10: API レスポンスヘッダ

```text
$ curl -sI -D - https://<api-host>/health
TBD
```

## 11. 機密情報マスキング方針

- レスポンスに secret / token が含まれる場合は本書貼付前に `***` でマスキング
- IP アドレスはマスキング不要 (CDN edge IP のため非機密)
- ユーザー個人情報を含む API は smoke 対象外 (`/health` `/health/db` のみ smoke 対象)
