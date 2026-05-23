# Phase 7 成果物: fixture 仕様

実体ファイル: `tests/fixtures/cloudflare-alerts/`

| ファイル | 用途 |
| --- | --- |
| `quota-base.json` | quota base snapshot (テスト固定値) |
| `api-list-policies.json` | Cloudflare API GET `/alerting/v3/policies` の mock レスポンス (5 policy + webhook id 直書き) |
| `api-list-webhooks.json` | Cloudflare API GET `/alerting/v3/destinations/webhooks` の mock |
| `api-drift-policies.json` | drift パターン: workers-requests threshold を 80000 → 90000、pages-build entry を削除 |

API レスポンスの url placeholder は `https://relay-worker-host.example.invalid/internal/alert-relay`
を採用 (実 URL を grep で検出させないため `.invalid` TLD を使用)。

`scripts/__tests__/cf-alerts-cli.test.ts` の `makeIsolatedMockDir()` で各テスト用に
fixture を tmpdir に copy し、write-log の相互干渉を避けている。
