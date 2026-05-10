# UT-17 Phase 6: Test Plan (TDD 先行テスト)

Phase 5 で確定したテスト ID 表に従い、以下のテストファイルを実装より先に作成する。
Phase 7 の実装が完了するまでは赤の状態で良いが、本サイクルでは実装と並行して書き、最終的にグリーンへ収束させる。

## 追加テストファイル

| パス | ID 範囲 | 概要 |
| --- | --- | --- |
| `apps/api/src/lib/__tests__/cf-webhook-auth.test.ts` | AUTH-01〜04 | header / secret 検証 4 ケース |
| `apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts` | FMT-01〜08 | metric 分類 + Block Kit 整形 |
| `apps/api/src/lib/__tests__/slack-sender.test.ts` | SEND-01〜05 | retry / 即失敗 / network throw |
| `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | ROUTE-01〜07 | route 統合（401 / 400 / 503 / 200 / 502 / 500） |

## カバレッジ方針

- formatter は payload バリエーション 5 種 + unknown + リンク有無を網羅。
- slack-sender は HTTP 200 / 4xx / 5xx / network error の 4 系統を全て確認。
- route は middleware 経由の 401 を確認することで cf-webhook-auth の Hono integration も同時に検証する。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```
