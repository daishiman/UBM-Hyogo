# Output Phase 6: 異常系検証

## status

EXECUTED

## error matrix

| status | api code | UI message |
| --- | --- | --- |
| 401 | UNAUTHENTICATED | 「セッションが切れました。再ログインしてください。」 |
| 403 | RULES_CONSENT_REQUIRED | 「利用規約への同意が必要です。最新の Google Form から再同意してください。」 |
| 409 | DUPLICATE_PENDING_REQUEST | 「既に同じ申請を受け付け中です。」 / 退会は専用文言 |
| 422 | INVALID_REQUEST | 「申請内容に不備があります。」 |
| 429 | (rate limit) | 「短時間に申請が集中しました。しばらく待って再度お試しください。」 |
| その他 | UNKNOWN | 「申請に失敗しました。時間を置いて再度お試しください。」 |

## tests covering

- `me-requests-client.test.ts` — 401/403/409 の `code` 正規化を検証
- `VisibilityRequest.test.tsx` — 409 文言のレンダリング確認
- `DeleteRequest.test.tsx` — 409 + キャンセル動作

## not covered (意図的)

- network 失敗（`fetch` 例外）の専用文言: UNKNOWN にフォールバックして UX を統一
