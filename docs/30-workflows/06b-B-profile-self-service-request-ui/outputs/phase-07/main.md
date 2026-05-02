# Output Phase 7: AC マトリクス

## status

EXECUTED

| AC | 実装証跡 | 自動テスト |
| --- | --- | --- |
| AC1 公開停止/再公開申請を送れる | `VisibilityRequest.client.tsx` + `requestVisibilityChange` | `VisibilityRequest.test.tsx` (public→hidden, hidden→public) |
| AC2 退会申請を送れる | `DeleteRequest.client.tsx` + `requestAccountDeletion` | `DeleteRequest.test.tsx` (accepted) |
| AC3 二重申請 409 を分かる形で表示する | `errorMessage(SelfRequestError)` の DUPLICATE_PENDING_REQUEST 分岐 | `VisibilityRequest.test.tsx` / `DeleteRequest.test.tsx` |
| AC4 本文編集 UI を追加しない | `static-invariants.test.ts` S-04 が pass | `static-invariants.test.ts` |
| AC5 申請 UI screenshot/E2E が保存される | 06b-C handoff（runtime gate 06b-A 待ち） | （06b-C で取得） |

## summary

- 自動テスト: 21 files / 125 passing
- ローカル `pnpm typecheck` / `pnpm lint` 通過
