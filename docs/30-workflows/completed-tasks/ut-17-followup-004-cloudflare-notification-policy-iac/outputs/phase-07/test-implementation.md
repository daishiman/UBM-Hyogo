# Phase 7 成果物: テスト実装

Phase 7 spec: `../../phase-07.md`

## 配置済みテストファイル

| パス | テスト数 | ケース |
| --- | --- | --- |
| `infra/cloudflare-alerts/lib/__tests__/canonicalize.test.ts` | 8 | C1〜C8 |
| `infra/cloudflare-alerts/lib/__tests__/diff.test.ts` | 8 | D1〜D8 |
| `infra/cloudflare-alerts/lib/__tests__/resolve.test.ts` | 6 | R1〜R6 |
| `infra/cloudflare-alerts/lib/__tests__/quota-base.test.ts` | 6 | Q1〜Q6 |
| `infra/cloudflare-alerts/lib/__tests__/load.test.ts` | 3 | load 健全性 |
| `scripts/__tests__/cf-alerts-cli.test.ts` | 13 | S1〜S13 (vitest+child_process) |

## 配置済み fixture

- `tests/fixtures/cloudflare-alerts/quota-base.json`
- `tests/fixtures/cloudflare-alerts/api-list-policies.json` (5 policy + webhook id 直書き形式)
- `tests/fixtures/cloudflare-alerts/api-drift-policies.json` (workers threshold 改竄 + pages-build 削除)
- `tests/fixtures/cloudflare-alerts/api-list-webhooks.json`

## 実行結果

```
Test Files  6 passed (6)
     Tests  44 passed (44)
```

## bats 採用判断

Phase 7 §7-5 は bats-core を採用予定だったが、CI 追加コスト + dev dep 増加回避のため
**vitest + child_process** で代替。S1〜S13 のシナリオは全て `scripts/__tests__/cf-alerts-cli.test.ts` で実装。
bats-core を root devDependencies に追加していない。
