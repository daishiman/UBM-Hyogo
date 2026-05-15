# Phase 5: local smoke (`/health`)

```bash
$ E2E_MOCK_API_PORT=38787 node scripts/e2e-mock-api.mjs &
$ curl -sf http://127.0.0.1:38787/health
{"ok":true,"status":"ok","ts":"2026-05-09T00:00:00.000Z"} ok attempt=2
```

readiness wait は attempt=2 で 200 返却。CI step `Wait for mock API readiness` のローカル等価動作を担保。
