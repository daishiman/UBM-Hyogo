# Phase 11 Manual Test Result

## Status

`implemented_local_evidence_captured`

Issue #275 の 429 Retry-After UI 復元は本サイクルで実装済み。実 API を使ったブラウザ手動テストは rate limit window と外部メール送信を伴うため user-gated とし、Phase 11 の必須 evidence は deterministic な web Vitest とコード差分で取得した。

## Evidence

| Classification | Path | Status |
| --- | --- | --- |
| client unit test | apps/web/src/lib/auth/magic-link-client.spec.ts | present |
| form component test | apps/web/app/login/_components/MagicLinkForm.component.spec.tsx | present |
| local command output | `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/auth/magic-link-client.spec.ts` | PASS: relevant spec `apps/web/src/lib/auth/magic-link-client.spec.ts` 15 tests passed |
| local command output | `mise exec -- pnpm --filter @ubm-hyogo/web test -- app/login/_components/MagicLinkForm.component.spec.tsx` | PASS: relevant spec `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` 4 tests passed |
| regression test output | `mise exec -- pnpm --filter @ubm-hyogo/web test -- app/login/_components/MagicLinkForm.component.spec.tsx` | PASS: repository script executed full web suite, 154 files / 1126 tests passed, 1 skipped |
| typecheck | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS |
| build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | PASS with existing warnings |

## Test Case 結果

| Test Case | Command / artifact | Status |
| --- | --- | --- |
| TC-1 429 + Retry-After countdown 起動 | `MagicLinkRateLimitedError(45)` mock rejection in component spec | PASS |
| TC-2 countdown 0 で再 enable | existing cooldown component spec | PASS |
| TC-3 200 OK regression | component spec success path | PASS |
| TC-4 非 429 error regression | existing error state component spec | PASS |
| TC-5 typed error 継承確認 | client spec `toBeInstanceOf(MagicLinkRequestError)` | PASS |

## Boundary

No commit, push, PR, deploy verification, production crawler check, or Issue mutation was executed. Real browser/API manual confirmation remains user-gated, but local deterministic evidence is complete for implementation close-out.
