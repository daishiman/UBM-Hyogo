# Implementation Guide

## Part 1: 概念説明

runtime smoke は staging API に bearer を渡して管理者系 / `/me` 系 endpoint を点検する。
静的 bearer は 24 時間で期限切れになるため、古い bearer に静かに戻ると同じ 401 が再発する。
この改善では、smoke 前に bearer の `exp` を読み、残り 6 時間未満なら実行せず loud fail する。

## Part 2: 技術詳細

`scripts/smoke/bearer-freshness-gate.mts` を追加し、`decodeJwtExp` / `classifyBearerFreshness` / `explainAuthFailureFromBearer` を公開する。
`.github/workflows/runtime-smoke-staging.yml` は `setup-project` を常時実行し、`verify bearer freshness` を smoke 前に挿入する。
`scripts/smoke/runtime-attendance-provider.sh` は 401 を `auth-token-expired` / `auth-secret-drift` に分ける。
`scripts/smoke/mint-staging-bearers.mts` は署名直後に `verifySessionJwt` で自己検証し、不整合なら token を露出せず throw する（AC-4）。
この throw 経路は `scripts/smoke/__tests__/mint-staging-bearers-self-verify.spec.ts`（M-3）で `verifySessionJwt` を null 固定して網羅する。

## Verification Commands

```bash
pnpm exec vitest run scripts/smoke/__tests__   # 13 tests pass (freshness 4 / mint parity 8 / self-verify 1)
bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh   # T-4-1..T-4-9 pass
```

## Visual Evidence

NON_VISUAL task のため screenshot は不要。代替証跡は focused test output と `outputs/phase-11/manual-test-result.md`。
