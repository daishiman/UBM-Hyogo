# Output Phase 5: 実装ランブック

## status

EXECUTED

## new files

- `apps/web/app/api/me/[...path]/route.ts` — `/api/me/*` proxy（cookie 転送 + 401 早期 return）
- `apps/web/src/lib/api/me-requests-client.ts` — `requestVisibilityChange` / `requestAccountDeletion` + `SelfRequestError`
- `apps/web/app/profile/_components/VisibilityRequest.client.tsx`
- `apps/web/app/profile/_components/DeleteRequest.client.tsx`
- 関連 unit / component テスト

## edited files

- `apps/web/app/profile/page.tsx` — VisibilityRequest / DeleteRequest を `EditCta` の下に追加。`authGateState !== "active"` の場合は disabled 表示

## implementation sequence (実施結果)

| step | result |
| --- | --- |
| 1. /profile 既存 UI 探索 | `StatusSummary` `ProfileFields` `EditCta` `AttendanceList` を維持 |
| 2. API client helper | `/api/me/visibility-request` / `/api/me/delete-request` のみを叩く |
| 3. Request UI component | publishState で文言切替（公開停止/再公開） |
| 4. Delete confirm | 取消不可警告 + 二段確認 |
| 5. Tests / static invariants | unit 7、component 7、S-04 合格 |
| 6. Handoff | screenshot target は 06b-C へ |

## remaining

- runtime smoke（06b-A 完了後 / 06b-C 担当）
