# Phase 12 Main

## Summary

Issue #275 Magic Link 429 Retry-After UI 復元は、仕様作成だけで止めず同一サイクルで apps/web 実装・focused specs・aiworkflow 正本同期まで完了した。

## Implementation

- `apps/web/src/lib/auth/magic-link-client.ts`: `MagicLinkRateLimitedError extends MagicLinkRequestError` を追加し、HTTP 429 を `Retry-After` header → body `retryAfterSec` → default 60 の順で解決する typed error にした。
- `apps/web/app/login/_components/MagicLinkForm.client.tsx`: typed error を catch し、URL を error/sent に遷移させず server-truth 秒数で cooldown を開始する。
- `apps/web/src/lib/auth/magic-link-client.spec.ts`: 429 header/body/default/invalid JSON と subclass contract を検証。
- `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx`: 429 countdown と 200 OK regression を検証。

## Evidence

- `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/auth/magic-link-client.spec.ts`
  - relevant spec: `apps/web/src/lib/auth/magic-link-client.spec.ts` 15 tests PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web test -- app/login/_components/MagicLinkForm.component.spec.tsx`
  - relevant spec: `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` 4 tests PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web test -- app/login/_components/MagicLinkForm.component.spec.tsx`
  - repository script executed full web suite: 154 files / 1126 tests PASS, 1 skipped
- `mise exec -- pnpm typecheck`: PASS
- `mise exec -- pnpm lint`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web build`: PASS with existing warnings
- `bash scripts/verify-pr-ready.sh`: Phase 12 compliance PASS and gate metadata PASS; final command status FAIL only on uncommitted regenerated index drift, which is expected before user-approved commit

## Boundary

Commit, push, PR, deploy verification, real browser/API manual smoke, and Issue #275 mutation were not executed. Those remain user-gated.
