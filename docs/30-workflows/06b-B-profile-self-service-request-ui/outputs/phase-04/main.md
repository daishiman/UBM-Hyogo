# Output Phase 4: テスト戦略

## status

EXECUTED

## test layers

| layer | target | path |
| --- | --- | --- |
| unit | client helper の status code 分岐 | `apps/web/src/lib/api/__tests__/me-requests-client.test.ts` |
| component | VisibilityRequest modal/state 遷移 | `apps/web/app/profile/_components/__tests__/VisibilityRequest.test.tsx` |
| component | DeleteRequest modal/state 遷移 | `apps/web/app/profile/_components/__tests__/DeleteRequest.test.tsx` |
| static-invariants | 編集系 HTML 要素・localStorage 不使用 | `apps/web/src/__tests__/static-invariants.test.ts`（既存 S-01〜S-04 に追加負荷なし） |
| smoke / e2e | production runtime evidence | 06b-A 完了後に 06b-C で実施 |

## scope out

- production の Auth.js session resolver smoke（06b-A の責務）
- queue 処理側のテスト（既存 04b で網羅）
