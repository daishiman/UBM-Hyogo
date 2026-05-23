# Phase 8: 統合確認

## test:alerts 結果

`mise exec -- pnpm test:alerts` → 52 tests / 7 files PASS（KV policy 関連 4 cases 追加分含む）。

CLI 統合テスト (`scripts/__tests__/cf-alerts-cli.spec.ts`) も 14 cases PASS:
- S3 list で 7 policy + 1 webhook が出る
- S4 mock fixture と repo が一致 → no drift
- S10 drift fixture から apply → 7 policy へ収束

## typecheck / lint

- `pnpm typecheck`: PASS（apps/api, apps/web, packages/* すべて clean）
- `pnpm lint`: PASS（boundaries / deps / stablekey / eslint いずれもクリア）

## ローカル `cf:alerts:diff` (read-only)

実 Cloudflare API への接続は user 承認後 Phase 10 で実施。`CF_ALERTS_MOCK_DIR` 経由のテストで apply→diff 収束を確認済み。
