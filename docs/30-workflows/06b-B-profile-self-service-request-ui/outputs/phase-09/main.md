# Output Phase 9: 品質保証

## status

EXECUTED

## checks

| check | command | result |
| --- | --- | --- |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | pass |
| lint | `pnpm --filter @ubm-hyogo/web lint` | pass |
| unit / component test | `pnpm --filter @ubm-hyogo/web test --run` | 21 files / 125 passing |
| static invariants S-01〜S-04 | 同上 | pass（profile 配下に編集系 HTML 要素なし） |

## evidence pointers

- `apps/web/src/lib/api/__tests__/me-requests-client.test.ts` 7 cases
- `apps/web/app/profile/_components/__tests__/VisibilityRequest.test.tsx` 4 cases
- `apps/web/app/profile/_components/__tests__/DeleteRequest.test.tsx` 3 cases

## remaining gates

- production runtime smoke: 06b-A 後に 06b-C へ
