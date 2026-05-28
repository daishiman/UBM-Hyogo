# manual-test-result.md

## 実施情報

| 項目 | 値 |
| --- | --- |
| workflow | `profile-server-components-render-error` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | `implemented_local_evidence_captured`（local 実装・focused Vitest は完了。staging deploy は user-gated pending） |

## NON_VISUAL 宣言

UI 表示物の意匠変更はない。変更対象は `apps/web/src/lib/fetch/authed.ts` の runtime env 解決と `apps/web/app/(member)/profile/page.tsx` の `/me` error handling 整流化であり、スクリーンショットは必須証跡ではない。

## 証跡（主ソース）

| Classification | Path | Status | Result |
| --- | --- | --- | --- |
| focused Vitest | outputs/phase-11/evidence/focused-vitest.log | present | PASS: 3 files / 43 tests |
| static source guard | outputs/phase-11/evidence/static-source-guard.log | present | PASS |
| web typecheck | outputs/phase-11/evidence/typecheck.log | present | PASS: `pnpm --filter @ubm-hyogo/web typecheck` |
| web lint | outputs/phase-11/evidence/web-lint.log | present | PASS: `pnpm --filter @ubm-hyogo/web lint` |
| staging `/profile` curl | outputs/phase-11/evidence/staging-profile-curl.log | pending_user_approval | placeholder |
| `wrangler tail` clean (scope=profile) | outputs/phase-11/evidence/staging-profile-tail.log | pending_user_approval | placeholder |

## 実行記録（実施後に埋める）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  apps/web/src/lib/__tests__/env.spec.ts
```

Result: PASS（3 files / 43 tests）。

```bash
pnpm --filter @ubm-hyogo/web typecheck
```

Result: PASS。

```bash
pnpm --filter @ubm-hyogo/web lint
```

Result: PASS。

```bash
curl -I https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile
```

Result: pending（staging deploy 後に埋める）。

## Runtime Boundary

Cloudflare staging deploy、authenticated `/profile` curl、commit、push、PR はユーザー承認後にのみ実行する。未実施の runtime 証跡を completed と記録しない。
