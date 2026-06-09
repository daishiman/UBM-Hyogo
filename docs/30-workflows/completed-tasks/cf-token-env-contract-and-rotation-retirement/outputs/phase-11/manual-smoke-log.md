# Phase 11 manual smoke log — cf-token-env-contract-and-rotation-retirement

> NON_VISUAL / implemented_local_evidence_captured。本ログは source-level 検証の実行結果と、user-gated runtime evidence の境界を記録する。

## source-level 検証（local 実行済み）

| # | コマンド | 期待結果 | 取得状態 |
| --- | --- | --- | --- |
| 1 | `pnpm vitest run scripts/smoke/__tests__/verify-runtime-smoke-secret-contract.spec.ts scripts/smoke/__tests__/verify-mint-env-contract.spec.ts` | 2 files / 14 tests PASS | present |
| 2 | `pnpm exec tsx scripts/smoke/verify-runtime-smoke-secret-contract.mts` | `verify-runtime-smoke-secret-contract: PASS (11 workflow secrets, 8 provisioned secrets)` | present |
| 3 | `actionlint .github/workflows/runtime-smoke-staging.yml .github/workflows/verify-runtime-smoke-secret-contract.yml` | 0 error | present |
| 4 | `bash -n scripts/smoke/provision-staging-secrets.sh` | 構文 OK（exit 0） | present |

## 環境ブロッカー（source-level PASS と分離・WEEKGRD-01）

| ブロッカー | 性質 | 対応 |
| --- | --- | --- |
| staging 実走（G3/G4） | 環境起因（Cloudflare トークン発行・provisioning が前提） | user-gated。runbook B2 手順で解消 |
| 旧トークン失効（G5） | 運用（CF dashboard 操作） | user-gated |

> source-level（製品コードの検証）と環境ブロッカー（トークン未発行等）を別カテゴリで記録している。
