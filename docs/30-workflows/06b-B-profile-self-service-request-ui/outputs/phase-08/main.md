# Output Phase 8: DRY 化

## status

EXECUTED

## shared abstractions

- `postJson(path, body)` を `me-requests-client.ts` 内で 1 か所に集約。
  visibility と delete の両方が同じ status code → `SelfRequestError` 変換ロジックを通る。
- `errorMessage(SelfRequestError)` は VisibilityRequest / DeleteRequest 両方に同型の `code` 分岐がある。
  - 退会のみ「同じ申請」→「退会申請」と文言を差し替えるため、各コンポーネント内で個別に持つ判断とした
    （文言の DRY 化は将来 i18n 導入時に共通化）

## not refactored (意図)

- `Modal` / `Button` は既存 UI コンポーネントを再利用
- proxy route は admin proxy と構造類似だが、admin は `requireAdmin` + INTERNAL_AUTH_SECRET、
  /me は session forward のみと責務が異なるため共通化していない
