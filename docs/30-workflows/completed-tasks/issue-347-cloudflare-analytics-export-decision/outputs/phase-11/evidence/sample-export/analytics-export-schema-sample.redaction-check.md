# Redaction Check

state: PASS

sample: `analytics-export-schema-sample.json`

## Commands

```bash
grep -iE "clientIP|originIP|userAgent|email|memberId|sessionId|token|requestBody|responseBody|query|pathWithQuery" \
  docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.json
```

Result: no matches.

```bash
grep -oE '"[^"]*":"[^"]*\\?[^"]*"' \
  docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-11/evidence/sample-export/analytics-export-schema-sample.json
```

Result: no matches.

## Stored fields

- date
- requests
- totalRequests
- errors5xx
- errorRate
- readQueries
- writeQueries
- invocations

No URL query, request body, response body, IP address, User-Agent, email, member ID, or session token is present.
