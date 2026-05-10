# Implementation Guide

## Part 1: 中学生レベル

学校で同じ人の名札が二枚できてしまったとき、先生は「どちらを残すか」「まちがいなら片方をしまうか」を確認します。このテストは、管理画面でも同じ確認が安全にできるかを見るためのものです。

今回作るものは、本物の名簿を書き換える作業ではありません。画面に用意した見本データを使い、管理者だけが「まとめる」「見送る」を押せること、会員や未ログインの人は入れないことを確かめます。

| 用語 | 言い換え |
| --- | --- |
| E2E | 画面を実際に動かす確認 |
| mock | 本物の代わりに使う見本 |
| endpoint | データの出入口 |
| schema | データの形の決まり |
| fixture | テスト用の役割つき入口 |

## Part 2: 技術者レベル

対象は `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` の新規 Playwright spec。`test` / `expect` を `apps/web/playwright/fixtures/auth.ts` から import し、`adminPage` / `memberPage` / `anonymousPage` は test callback 引数から受ける。named export として import してはならない。

### API contract

| API | Request | Response |
| --- | --- | --- |
| server-side `GET /admin/identity-conflicts` | query `status? / cursor?` | `ListIdentityConflictsResponseZ` |
| browser-side `POST /api/admin/identity-conflicts/:id/merge` | `MergeIdentityRequestZ` `{ targetMemberId, reason }` | `MergeIdentityResponseZ` `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` |
| browser-side `POST /api/admin/identity-conflicts/:id/dismiss` | `DismissIdentityConflictRequestZ` `{ reason }` | `DismissIdentityConflictResponseZ` |

### Mock boundary

Initial list data is fetched by a Server Component through `fetchAdmin()`, so browser `page.route()` cannot intercept it. Provide list data through the non-production `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1` gate in `server-fetch.ts` and parse it with `ListIdentityConflictsResponseZ`. Use browser `page.route()` only for `/api/admin/identity-conflicts/*/{merge,dismiss}` and negative observation of `/api/admin/members/*`.

### Required tests

1. list renders two pending conflicts using `conflictId`, source/target ids, masked email, and matched fields.
2. merge sends `{ targetMemberId, reason }`, parses shared schema, and refreshes.
3. dismiss sends `{ reason }`, parses shared schema, and refreshes.
4. merge success triggers refresh boundary without expecting `/admin/members/:id`.
5. member role cannot access admin-only content.
6. anonymous role redirects to login.
