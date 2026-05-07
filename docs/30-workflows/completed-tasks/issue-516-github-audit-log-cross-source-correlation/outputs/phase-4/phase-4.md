# Phase 4 出力: テスト設計

## 追加テストファイル

| ファイル | framework |
| --- | --- |
| `apps/api/src/audit-correlation/__tests__/redact.test.ts` | vitest |
| `apps/api/src/audit-correlation/__tests__/correlate.test.ts` | vitest |
| `apps/api/src/audit-correlation/__tests__/github-fetch.test.ts` | vitest (vi.fn fetch stub) |
| `apps/api/src/audit-correlation/__tests__/contract.test.ts` | vitest (expectTypeOf) |
| `scripts/audit-correlation/__tests__/grep-gate.bats` | bats |
| `scripts/audit-correlation/__tests__/runner-determinism.bats` | bats |

> 注: 仕様書では msw 利用を想定していたが、本リポジトリに msw が未導入のため、`vi.fn()` で `fetch` をスタブする方針に置き換えた（契約レベルの検証としては同等）。

## TC-RED-NN マッピング

| ID | テスト |
| --- | --- |
| TC-RED-01 | redact.test.ts: deterministic hash |
| TC-RED-02 | redact.test.ts: different salt |
| TC-RED-03 | redact.test.ts: empty input throws |
| TC-RED-04 | redact.test.ts: actor_ip not in output |
| TC-RED-05 | redact.test.ts: user_agent not in output |
| TC-RED-06 | redact.test.ts: cloudflare email full not in output |
| TC-RED-07 | correlate.test.ts: same fingerprint merge |
| TC-RED-08 | correlate.test.ts: different fingerprints |
| TC-RED-09 | github-fetch.test.ts: 401 → AuditFetchAuthError |
| TC-RED-10 | github-fetch.test.ts: 429 backoff success |
| TC-RED-11 | correlate.test.ts: HIGH severity |
| TC-RED-12〜14 | bats grep-gate.bats |

## fixture 一覧
`scripts/audit-correlation/fixtures/` に 6 種類:
- github-workflow-run-success.json
- github-org-update-member.json
- cloudflare-login-fail.json
- cloudflare-token-rotate.json
- edge-empty.json
- edge-rate-limit.json

## grep gate 禁止パターン
- `\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b`（完全 IPv4）
- `User-Agent: .+`（完全 UA 文字列）
- `(ghp_|github_pat_)[A-Za-z0-9_]+`（GitHub PAT）
