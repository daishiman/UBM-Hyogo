# Phase 3 — アーキテクチャ・モジュール設計

## 1. ファイル構造

```
apps/web/playwright/tests/admin-identity-conflicts.spec.ts  # primary spec
├── import: ../fixtures/auth (test / expect; adminPage / memberPage / anonymousPage are callback fixtures)
├── import: @ubm-hyogo/shared (MergeIdentityRequestZ / DismissIdentityConflictRequestZ)
├── const FIXTURES (inline)
│   ├── mergeResponse
│   ├── dismissResponse
├── describe('/admin/identity-conflicts × mutation')
│   ├── test('成功系: 一覧表示')
│   ├── test('成功系: merge')
│   ├── test('成功系: dismiss')
│   └── test('refresh 境界: router.refresh() のみで members 詳細 fetch なし')
└── describe('/admin/identity-conflicts × authz')
    ├── test('認可: member は 403 page')
    └── test('認可: anonymous は /login redirect')
```

## 2. mock layering

```
Server fixture layer
├── `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1`
│   └── `fetchAdmin('/admin/identity-conflicts')` → `ListIdentityConflictsResponseZ.parse(...)`
Network layer (page.route())
├── test('merge') 内
│   ├── M2: POST /admin/identity-conflicts/:id/merge
│   │       (request body parse: MergeIdentityRequestZ)
│   │       → 200 { mergedAt, targetMemberId, archivedSourceMemberId, auditId }
├── test('dismiss') 内
│   ├── M3: POST /admin/identity-conflicts/:id/dismiss
│   │       (request body parse: DismissIdentityConflictRequestZ)
│   │       → 200 { dismissedAt }
├── test('refresh 境界') 内
│   ├── M2 (merge)
│   └── M4: GET /admin/members/:id を捕捉し、0 call を assert
└── authz describe
    ├── memberPage: M5 GET → 403
    └── anonymousPage: 既定 redirect → /login
```

## 3. 入出力境界

| 境界 | in | out |
|------|----|----|
| spec → Playwright runtime | 6 test definitions | test report (6 PASS) |
| server-fetch fixture → shared schema | list fixture | `ListIdentityConflictsResponseZ.parse()` 例外なし |
| spec → page.route handlers | mutation URL pattern + method | mock response |
| spec ↔ fixture | role context | authenticated `Page` instance |
| spec → shared schema | mock handler | `parse()` 例外なし |

## 4. 設計判断

| 判断 | 理由 |
|------|------|
| server-side inline fixture（production gate 付き） | Server Component の `fetchAdmin()` は browser `page.route()` で捕捉できないため |
| mutation は `page.route()`、実 API/D1 不使用 | 不変条件 4 / 環境非依存 / flaky 排除 |
| `getByRole` / `getByTestId` 優先 | OKLch 不変条件 2 / class 依存排除 |
| ISO8601 固定値 | flaky 防止 |
| 6 test 1 ファイル / 2 describe 分割 | mutation / authz の関心分離 |
