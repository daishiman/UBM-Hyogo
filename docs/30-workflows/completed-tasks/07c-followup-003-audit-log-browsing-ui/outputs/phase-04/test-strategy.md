# Phase 4 Test Strategy

## Scope

`/admin/audit` is verified as a read-only admin audit browser. Tests cover repository filtering, API contract, web state, PII masking, timezone conversion, pagination, and visual smoke.

## Test Matrix

| TC | Layer | AC | Scenario | Expected evidence |
| --- | --- | --- | --- | --- |
| TC-01 | repository/API | AC-2 | `action=attendance.add` | only matching action rows |
| TC-02 | repository/API | AC-3 | actorEmail / targetType / targetId filters | each single filter narrows rows |
| TC-03 | repository/API | AC-4 | JST `from` / `to` range | UTC converted boundary rows are included/excluded correctly |
| TC-04 | API | AC-8 | `limit > 100`, `limit < 1` | validation error or capped behavior, documented in route test |
| TC-05 | API | AC-8 | malformed cursor | 400 response |
| TC-06 | API | AC-1 | non-admin request | existing admin gate returns 401/403 |
| TC-07 | API | AC-6 | before/after JSON contains email/phone/name/address | response exposes maskedBefore/maskedAfter only |
| TC-08 | API | AC-9 | broken JSON in audit row | list request succeeds with `parseError: true` and raw JSON omitted |
| TC-11 | Web | AC-5 | initial `/admin/audit` render | filters and table are visible |
| TC-12 | Web | AC-7 | submit filters and follow next cursor | query/filter state remains visible |
| TC-13 | Web | AC-5/AC-6 | JSON collapsed by default | raw PII text is absent before expansion |
| TC-14 | Web | AC-6 | JSON expanded | only masked values are present |
| TC-15 | Web | AC-9 | empty/error data | layout remains readable and no crash |
| TC-16 | Web | AC-10 | DOM read-only scan | no edit/delete/run mutation controls |
| TC-17 | Visual | AC-5/AC-6/AC-10 | desktop and mobile screenshots | no overlap, raw PII absent, read-only UI |

## Negative Cases

- Raw `before_json` / `after_json` fields must not appear in the API response shape.
- Raw email, phone, address, and name-like values must not appear in masked API payloads or the rendered DOM.
- Invalid cursors and invalid date ordering must not silently return misleading data.
- `/admin/audit` must not introduce any mutation helper, edit button, delete button, export side effect, or D1 direct access from apps/web.

## Commands

The exact commands are confirmed in Phase 9 from `package.json`. Planned minimum:

- `pnpm --filter @repo/api test:run`
- `pnpm --filter @repo/web test:run`
- `pnpm typecheck`
- `pnpm lint`
- Playwright/admin visual smoke if the local auth fixture can run in this worktree.
