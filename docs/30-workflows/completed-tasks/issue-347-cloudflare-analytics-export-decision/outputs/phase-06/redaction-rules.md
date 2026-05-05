# Phase 06 Redaction Rules

state: completed

## 禁止 field

次の field / 値は保存禁止。

- `clientIP`
- `originIP`
- `userAgent`
- `email`
- `memberId`
- `sessionId`
- `token`
- `requestBody`
- `responseBody`
- `query`
- `url`
- `pathWithQuery`

## 許可 field

次の aggregate field のみ保存できる。

- date
- requests
- totalRequests
- errors5xx
- readQueries
- writeQueries
- invocations

## Redaction Check

```bash
SAMPLE=docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.json

grep -iE "clientIP|originIP|userAgent|email|memberId|sessionId|token|requestBody|responseBody|query|pathWithQuery" "$SAMPLE" \
  && echo "FAIL: PII candidate found" \
  || echo "PASS: no PII candidates"

grep -oE '"[^"]*":"[^"]*\\?[^"]*"' "$SAMPLE" \
  && echo "FAIL: URL query found" \
  || echo "PASS: no URL query string"
```

## CSV fallback

CSV fallback を採用する場合は、保存前に列名を列挙し、禁止 field に一致する列を物理削除する。削除前後の列名 diff を redaction-check に記録し、削除前 CSV は repo に保存しない。
