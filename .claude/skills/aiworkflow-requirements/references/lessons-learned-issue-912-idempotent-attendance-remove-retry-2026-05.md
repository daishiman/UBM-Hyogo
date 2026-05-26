# Lessons Learned — issue-912 idempotent attendance remove retry

## L-I912-001: Existing idempotent endpoint can be bypassed by combined POST caller

When an admin UI combines add/remove into one POST `mutationFn`, an existing DELETE/PUT idempotent endpoint may remain unused and the `useAdminMutation` retry/idempotency policy becomes a dead path. Compare API route methods with UI caller methods before accepting a future follow-up as still blocked.

## L-I912-002: Retry caller must avoid `mutationFn`

`useAdminMutation` applies timeout / retry / abort / `Idempotency-Key` only on the built-in fetch path. A DELETE caller that keeps `mutationFn` is still non-retriable even if the method is idempotent.

## L-I912-003: Dynamic path callers can use `trigger(payload, endpointOverride)`

For path parameters such as `sessionId` and `memberId`, keep a placeholder endpoint at declaration time and pass the encoded endpoint override at trigger time. Assert the final URL in component tests.

## L-I912-004: DELETE payload must be fixed in the spec

The hook currently serializes `body: JSON.stringify(payload)` for all methods. DELETE callers should choose one payload shape and assert it. For issue-912 the caller uses `payload=null`, resulting in body `"null"`, and the Hono route does not read the body.

## L-I912-005: Idempotency-Key value identity belongs to hook policy, not caller specs

Caller specs should assert header presence on each attempt. Whether retry attempts reuse or regenerate the key is hook policy and should not be contradicted inside a caller workflow.

## L-I912-006: Playwright mock fixture must follow API method/endpoint shape changes

When switching from `POST /attendances` to `DELETE /attendance/:memberId`, `apps/web/playwright/fixtures/auth.ts` mock handlers must be updated in the same PR. The fallback `response(res, 404, { error: 'MOCK_API_NOT_FOUND' })` at the end silently routes the new DELETE call into the idempotent 404 branch, so toast becomes `既に出席解除されています` on the first call and `expect(toast).toContainText('出席を削除しました')` fails. Why: dev-warn fallback responds 404 instead of throwing, masking the missing handler. How to apply: any PR that changes admin API method / path must grep `apps/web/playwright/fixtures/auth.ts` for the old route pattern and add a matching new handler (status 200 on first delete, 404 on second to keep the idempotent retry path testable).
