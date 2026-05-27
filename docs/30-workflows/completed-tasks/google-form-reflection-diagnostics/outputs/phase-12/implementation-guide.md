# Phase 12 strict — implementation-guide (Phase 5 要約 + PR 素材)

## 1. 実装範囲

| layer | 新規 | 編集 |
| --- | --- | --- |
| apps/api | `diagnostics/forms-pipeline.ts` / `forms-pipeline.contract.spec.ts` / `forms-pipeline.spec.ts` / `member-diagnosis.ts` / `member-diagnosis.contract.spec.ts` | `index.ts` (route mount) |
| apps/web | `app/(admin)/admin/sync-status/page.tsx` / `features/admin/diagnostics/{types,api}.ts` / `features/admin/components/_members/MemberDiagnosticsPanel.tsx` | `features/admin/components/_members/MemberDrawer.tsx` |
| test | `apps/web/playwright/tests/admin/sync-status.spec.ts` | — |

## 2. 関数 surface

- `getFormsPipelineSnapshot(env): Promise<FormsPipelineSnapshot>`
- `getMemberDiagnosis(env, memberId): Promise<MemberDiagnosis | null>`
- `createDiagnosticsRouter(): Hono<{ Bindings: ApiEnv }>`
- web 側: `safeServerFetch('/admin/diagnostics/forms-pipeline')` / `fetchMemberDiagnosis(memberId)`

## 3. データ契約 (要約)

`FormsPipelineSnapshot` = `{ capturedAt, counts, latestSyncRuns[≤10], secretsReadiness(boolean only), aliasPendingCount, publicVisibility, identityHealth, hypothesisFlags(H1-H4) }`

`MemberDiagnosis` = `{ capturedAt, memberId, identityMatches, responseFieldCount, expectedFieldCount(31), missingFieldKeys(key only), consent, publishState, hypothesisFlags(H2-H4) }`

## 4. 不変条件 (PR 本文に転記)

- D1 直接アクセス禁止 (`apps/web` → `apps/api` 経由のみ)
- `*.spec.ts` 厳守
- secrets boolean only readiness
- read-only SELECT (write 禁止)
- `getEnv()` 経由 (`process.env` 直接禁止 in apps/web)

## 5. 主要コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/diagnostics/forms-pipeline.spec.ts apps/api/src/diagnostics/forms-pipeline.contract.spec.ts apps/api/src/diagnostics/member-diagnosis.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm indexes:rebuild
```

## 6. DoD (Phase 8 要約)

13 ファイル変更完了 + 全 quality gate green + staging で H1-H4 判別可能 + Spec-B 起票準備完了。詳細は Phase 8 を参照。

## 7. Screenshot references

- `/admin/sync-status`: `outputs/phase-11/screenshots/sync-status-screen.png` (staging runtime evidence; user-gated)
- Member Drawer diagnostics: `outputs/phase-11/screenshots/member-diag-drawer.png` (staging runtime evidence; user-gated)
