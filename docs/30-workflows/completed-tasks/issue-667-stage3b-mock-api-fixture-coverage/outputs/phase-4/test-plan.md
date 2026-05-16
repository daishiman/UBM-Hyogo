# Phase 4: test plan

## 新規テストファイル

| パス | テスト数 | 目的 |
|------|---------|------|
| packages/contracts/src/index.spec.ts | 21 | zod schema self-test + AC-4 fixtures invariants |
| scripts/__tests__/e2e-mock-api.contract.spec.ts | 28 | mock 起動 + 23 endpoint + 異常系 4 件 |

## RED → GREEN への遷移

仕様書では「Phase 4 終了時点で RED」を想定するが、実装では Phase 4-6 を一気通貫で実装し、
最終的に **49 tests 全 GREEN** を達成。Phase 4 spec の RED 要因（schema 不在 / mock 未対応 endpoint）は
Phase 6 実装で並行解消。

## test glob 包含

ルート `vitest.config.ts` の `include` に以下が含まれる:

- `packages/**/src/**/*.spec.{ts,tsx}` → packages/contracts/src/index.spec.ts を捕捉
- `scripts/**/*.spec.ts` → scripts/__tests__/e2e-mock-api.contract.spec.ts を捕捉

新規 vitest 設定の追加なし。CI workflow の追加なし。`.github/workflows/ci.yml` test job または root `pnpm test` 経路で自動実行。
