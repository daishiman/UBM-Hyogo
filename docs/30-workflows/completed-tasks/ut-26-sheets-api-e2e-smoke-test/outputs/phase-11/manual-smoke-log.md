# Manual Smoke Log

## 状態

implemented (vitest 10 ケース全 pass) / live wrangler 実行 pending。

## エビデンス表

| シナリオ | 期待される証跡 | 状態 |
| --- | --- | --- |
| vitest unit / contract | smoke-sheets.test.ts 10 ケース全 pass | done（242 件中 10 件が UT-26 関連、全 pass） |
| local wrangler dev smoke | HTTP 200 + redacted summary | pending（`.dev.vars` 配置後に実施） |
| staging smoke | HTTP 200 + redacted summary | pending（staging deploy + SA 共有後に実施） |
| cache hit check | `tokenFetchesDuringSmoke=1` / cacheHit=true | mock で検証済（test case 4）/ live 実行で再確認 |
| 401 / 403 / 429 分類 | errorCode に AUTH_INVALID / PERMISSION_DENIED / RATE_LIMITED | mock で検証済（test case 5/6/7）/ live 観測時に追記 |
| CONFIG_MISSING | env 未設定で errorCode='CONFIG_MISSING' | mock で検証済（test case 8/9） |

## live 実行手順（実施待ち）

```bash
# 1. ローカル wrangler dev (.dev.vars に SMOKE_ADMIN_TOKEN / GOOGLE_SHEETS_SA_JSON / SHEETS_SPREADSHEET_ID を 1Password 参照経由で配置)
bash scripts/with-env.sh mise exec -- pnpm --filter @ubm-hyogo/api dev

# 2. curl 疎通（トークンは redact、レスポンスは spreadsheetId が redact 済み）
curl -i -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  "http://127.0.0.1:8787/admin/smoke/sheets?range=Sheet1!A1:B2"

# 3. staging deploy 後の確認
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
curl -i -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  "https://<staging-host>/admin/smoke/sheets?range=Sheet1!A1:B2"
```

## 結果記録テンプレ（実施時に埋める）

```
date: YYYY-MM-DD HH:MM (JST)
env: staging | local
http_status: 200 | 401 | 403 | 429 | 5xx
firstCall.latencyMs: <int>
secondCall.latencyMs: <int>
tokenFetchesDuringSmoke: 1
cacheHit: true | false
rangeRequested: Sheet1!A1:B2
spreadsheetIdRedacted: 119e***dtVQ  # 先頭4 + *** + 末尾4
sampleRowCount: <int>
errorCode: <enum or n/a>
notes: <free text, secrets 禁止>
```

## redact ルール

以下は決して記録しない:
- Service Account JSON 全文
- access_token / bearer token
- private_key / client_email
- spreadsheetId 全文（先頭4 + *** + 末尾4 のみ可）
- Authorization ヘッダ値

## next: Phase 12 implementation-guide.md へ live 実行結果を転記する（実施後）
