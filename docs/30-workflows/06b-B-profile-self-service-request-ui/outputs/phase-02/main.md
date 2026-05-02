# Output Phase 2: 設計

## status

EXECUTED

## design summary

### コンポーネント分割
- `VisibilityRequest.client.tsx`: `publishState` を入力に hidden ⇄ public を切替申請
- `DeleteRequest.client.tsx`: 退会申請（取消不可警告つき）
- 双方とも既存 `Modal` + `Button` を再利用し、編集系 HTML 要素 / submit button を使わない

### API client helper
- `apps/web/src/lib/api/me-requests-client.ts`
  - `requestVisibilityChange({ desiredState, reason? })`
  - `requestAccountDeletion({ reason? })`
  - 401/403/409/422/429 を `SelfRequestError` の `code` に正規化

### proxy
- `apps/web/app/api/me/[...path]/route.ts`
  - cookie を backend `/me/*` に転送
  - 未ログインは 401 で早期 return（proxy で `auth()` を叩く）

### state machine
- `idle → confirm → submitting → accepted | error → idle (close)`
- accepted 時は trigger ボタンを無効化

## boundary check

- `apps/web` から D1 直接 import 禁止（既存 boundary lint が担保）
- `:memberId` を path に書かない（proxy は `[...path]` パススルーのみで session 依存）
