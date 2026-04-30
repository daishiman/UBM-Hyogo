# Phase 11: manual smoke log

> 実 Google Sheets API smoke は UT-26 で実機記録する。redact 済の出力のみを記録する。

## ログテンプレ

```
[YYYY-MM-DDThh:mm:ss+09:00] $ bash scripts/cf.sh dev --config apps/api/wrangler.toml
... wrangler dev started on http://localhost:8787

[YYYY-MM-DDThh:mm:ss+09:00] $ curl -s http://localhost:8787/admin/sheets-auth-debug -H "Authorization: Bearer ***"
{ "tokenAcquired": true, "expiresAt": "***" }

[YYYY-MM-DDThh:mm:ss+09:00] $ curl -s https://sheets.googleapis.com/v4/spreadsheets/.../values/A1:Z1 -H "Authorization: Bearer ***"
{ "values": [["timestamp","email","name", ...]] }

[YYYY-MM-DDThh:mm:ss+09:00] redact verified — no PRIVATE KEY / token leaked
```
