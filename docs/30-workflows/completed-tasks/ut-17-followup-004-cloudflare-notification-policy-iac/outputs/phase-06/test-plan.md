# Phase 6 成果物: テスト戦略

Phase 6 spec: `../../phase-06.md`

## 4 層テスト構造

| 層 | 対象 | フレームワーク | 件数 |
| --- | --- | --- | --- |
| 正規化 | canonicalizePolicy / canonicalizeWebhook | vitest | C1〜C8 (8) |
| diff | diffPolicy / diffWebhook | vitest | D1〜D8 (8) |
| 解決 / 算出 | resolveWebhookId / computeThreshold / applyQuotaBase | vitest | R1〜R6 + Q1〜Q6 (12) |
| CLI 統合 | `cf.sh alerts {list,diff,plan,apply}` | vitest + child_process (bats 代替) | S1〜S13 (13) |
| load 補助 | loadExpected | vitest | 3 |

合計: 44 tests。

## stub 戦略

- API stub: `CF_ALERTS_MOCK_DIR` を fixture dir に向けると `api-client.ts` が fixture を返す経路に切り替わる
- op:// stub: `CF_ALERTS_MOCK_DIR` 設定時は `resolveRef` がダミー値 (`mock:op://...`) を返す
- token stub: テスト env で `CLOUDFLARE_API_TOKEN=test-token` / `CLOUDFLARE_ACCOUNT_ID=test-account` をダミー値で渡す

## bats vs vitest+child_process

Phase 7 §7-5 では bats-core を採用予定だったが、CI 追加コスト回避のため
**vitest + child_process** で同等カバレッジを実現した (`scripts/__tests__/cf-alerts-cli.test.ts`)。
S1〜S13 は全て vitest で実行可能。bats-core dev dep 追加は不要。

## 実行コマンド

```bash
mise exec -- pnpm test:alerts
# = vitest run infra/cloudflare-alerts/lib/__tests__ scripts/__tests__/cf-alerts-cli.test.ts
```
