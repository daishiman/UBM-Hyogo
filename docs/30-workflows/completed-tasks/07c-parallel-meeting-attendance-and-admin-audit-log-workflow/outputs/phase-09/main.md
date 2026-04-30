# Phase 9: 品質保証

## Checks

| 観点 | 結果 |
| --- | --- |
| free tier | 1 成功操作あたり attendance/audit の最大 2 writes。十分余裕あり |
| secrets | 新規 secret なし |
| types | `MemberId` brand と repository row 型を維持 |
| auth | `requireAdmin` を全 route に適用 |
| a11y | UI 変更なし。06c/08b に委譲 |
| tests | 対象 2 suite 16 tests PASS |

## Verification Command

```bash
pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/routes/admin/attendance.test.ts apps/api/src/repository/attendance.test.ts
```
