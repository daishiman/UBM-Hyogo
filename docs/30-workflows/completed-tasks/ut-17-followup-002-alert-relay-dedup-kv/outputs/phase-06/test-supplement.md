# Phase 6 — テスト拡充サマリ

## 追加テストケース実装結果

| ID | 目的 | 状態 |
|----|------|------|
| TC-KV-06 | policy_id 欠落時 dedup key fallback | PASS |
| TC-KV-07 | minuteBucket 境界跨ぎ | PASS |
| TC-KV-08 | `deps.dedupeTtlMs` 上書き反映 | PASS |
| TC-KV-09 | KV put throw after Slack success → 200 / `dedupPersisted=false` | PASS |
| TC-KV-05a | Slack 配信失敗後の retry は dedup されず再送を試みる | PASS |
| TC-REG-01 | cf-webhook-auth 失敗 401（既存 ROUTE-01 で被覆） | PASS（ROUTE-01） |
| TC-REG-02 | SLACK_WEBHOOK_URL 未設定 503（既存 ROUTE-03 で被覆） | PASS（ROUTE-03） |

## 件数サマリ

| カテゴリ | 件数 |
|---------|------|
| 既存 ROUTE-* | 9 |
| TC-03 / TC-KV-01〜09 / Slack failure retry | 11 |
| INDEX-01 | 1 |
| **合計** | **21** |

実行: `pnpm exec vitest run apps/api/src/routes/internal/__tests__/alert-relay.test.ts` → 21 PASS / 0 FAIL。

## DoD

- [x] 新規ケースが全 PASS
- [x] 既存テストの期待値・件数は維持
- [x] TC-REG-* は既存 ROUTE-* で被覆済みであることを確認
