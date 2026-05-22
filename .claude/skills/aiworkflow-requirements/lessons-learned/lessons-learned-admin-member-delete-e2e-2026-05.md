# Lessons Learned: admin-member-delete E2E spec

## L-2C-001: Server Component fetch requires a server-side fixture gate

`page.route()` cannot intercept the initial `/admin/members` and `/admin/audit` fetches because they are executed through Server Components. Focused E2E specs must either use a mock API reachable by the server or an explicit non-production env fixture gate.

## L-2C-002: Mutation success must assert an observable UI result

Verifying only the POST body and drawer close is too weak for delete flows. The test now verifies that the affected row changes to `削除済み`, so a broken refresh/reflection path fails locally.

## L-2C-003: Audit linkage must include the causative mutation

An audit page fixture by itself proves display, not linkage. The audit test first performs the delete mutation, verifies the POST call count, and then checks `/admin/audit?action=admin.member.deleted`.

## L-2C-004: Reason validation belongs to two different contracts

The UI E2E owns disabled state and API call prevention for blank reasons. Backend contract tests own `DeleteBodyZ` 422 parsing. Recording that split avoids duplicate, brittle E2E assertions.

## L-2C-005: Grep gates must name their scope

`fetch count: 0` was ambiguous because the product UI uses fetch internally. The evidence now says `spec direct fetch count`, meaning the Playwright spec itself does not perform direct fetches.
