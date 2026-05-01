# Output Phase 7: AC マトリクス

## status

EXECUTED

## AC traceability

| AC | 実装 | 検証 | 結果 |
| --- | --- | --- | --- |
| AC-1 route exists | `apps/web/app/api/auth/callback/email/route.ts` GET | route.test.ts AC-1 + 手動 200/302 確認手順 | PASS |
| AC-2 success session | CredentialsProvider(id="magic-link") + signIn callback | route.test.ts: signIn が `verifiedUser` JSON 付きで呼ばれる | PASS |
| AC-3 failure redirect | route 内 query 検証 + mapVerifyReasonToLoginError | route.test.ts × 7 reason | PASS |
| AC-4 no D1 direct | helper は API worker fetch のみ | `node scripts/lint-boundaries.mjs` exit=0 | PASS |
| AC-5 tests added | verify-magic-link.test.ts (15) + route.test.ts (11) | `pnpm --filter @ubm-hyogo/web test` | PASS |

## Traceability

| Source | Trace |
| --- | --- |
| unassigned task | `docs/30-workflows/unassigned-task/task-05b-authjs-callback-route-credentials-provider-001.md` |
| current workflow | `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/` |
| parent 05b | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/` |
| downstream visual | `06b-C-profile-logged-in-visual-evidence` (本タスク完了で unblock) |

## drift 確認

- AC に対応しない実装項目: なし
- 実装項目に対応しない AC: なし
