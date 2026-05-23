# Phase 5 — 実装ガイド（test 構造 / mock pattern）

## 1. test 構造表（6 ケース、skip 0）

| # | test 名 | fixture | 主目的 | 主 assertion |
|---|---------|---------|--------|-------------|
| 1 | 成功系: 一覧表示 | `adminPage` | server-side fetch 済みの一覧描画 | `conflictId` 2 件、source/target id、masked email、matched fields が可視 |
| 2 | 成功系: merge | `adminPage` | client mutation 経路 | 二段階確認 → POST `/api/admin/identity-conflicts/:id/merge` request body が `{ targetMemberId, reason }` shape、200 後に `router.refresh()` |
| 3 | 成功系: dismiss | `adminPage` | client mutation 経路 | dismiss ボタン → POST `/api/admin/identity-conflicts/:id/dismiss` body が `{ reason }`、200 後に `router.refresh()` |
| 4 | refresh 境界: merge 後に一覧再取得 | `adminPage` | server refresh 境界 | merge 200 → `router.refresh()` により server-side list fetch が再実行される。`/admin/members/:id` 明示 fetch は期待しない |
| 5 | 認可: member は 403 | `memberPage` | admin-only 境界 | 直接遷移 → API 403 → admin layout 内 403 表示 or `/profile` redirect |
| 6 | 認可: anonymous は `/login` redirect | `anonymousPage` | unauth 境界 | `page.url()` が `/login` を含む |

## 2. API mock pattern（server fetch と browser fetch を分離）

`/admin/identity-conflicts` 初期一覧は Server Component の `fetchAdmin()` が server-side で `INTERNAL_API_BASE_URL` へ fetch するため、ブラウザ側 route interception では捕捉できない。実装は次のどちらかを採用する:

1. Playwright webServer 起動時に test 用 `INTERNAL_API_BASE_URL` を mock API server へ向ける。
2. 既存 E2E 環境が実 API fixture DB を使う場合は、初期一覧だけ実 API fixture で用意し、client mutation のみ `page.route()` で `/api/admin/...` を捕捉する。

今回の spec では **初期一覧を `page.route()` で完全 mock する前提は禁止**。`page.route()` の対象は browser-side fetch である merge / dismiss の `/api/admin/...` に限定する。

| # | endpoint | URL pattern | method | 戦略 |
|---|----------|------------|--------|------|
| M1 | GET list | server-side `GET /admin/identity-conflicts` | GET | mock API server または実 API fixture DB で用意。browser `page.route()` 禁止 |
| M2 | POST merge | `**/api/admin/identity-conflicts/*/merge` | POST | request body を `route.request().postDataJSON()` で取得し `MergeIdentityRequestZ.parse()` 通過必須。response は `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` を 200 |
| M3 | POST dismiss | `**/api/admin/identity-conflicts/*/dismiss` | POST | body `{ reason }` を `DismissIdentityConflictRequestZ.parse()` 通過必須。response 200 `{ dismissedAt }` |
| M4 | refresh list | server-side `GET /admin/identity-conflicts` | GET | merge / dismiss 後の `router.refresh()` で再取得。`/admin/members/:id` 明示 fetch は期待しない |
| M5 | unauth GET list | `**/admin/identity-conflicts*` | GET | memberPage → 403 / anonymousPage → 401 |

mock 上書きルール:
- 共通 GET (M1) は browser `page.route()` に置かない。M2-M3 は test 内で `await page.route('**/api/admin/...')` で追加設定
- counter は本 spec では不要（race 検証は 2a の責務）
- D1 への直接アクセスは行わない（不変条件 5 維持）
- `page.unroute()` は `afterEach` で明示 cleanup（必要時）

## 3. 実装擬似コード（参考）

```ts
import { test, expect } from '../fixtures/auth';
import {
  MergeIdentityRequestZ,
  DismissIdentityConflictRequestZ,
} from '@ubm-hyogo/shared/schemas/identity-conflict';

const identityConflictItems = [
  { conflictId: 'cf_001', sourceMemberId: 'm_src_01', candidateTargetMemberId: 'm_dst_01',
    matchedFields: ['name', 'affiliation'], detectedAt: '2026-05-08T00:00:00Z',
    responseEmailMasked: 't***@example.com', syncJobId: 'sync_001' },
  { conflictId: 'cf_002', sourceMemberId: 'm_src_02', candidateTargetMemberId: 'm_dst_02',
    matchedFields: ['name'], detectedAt: '2026-05-08T01:00:00Z',
    responseEmailMasked: 'h***@example.com', syncJobId: null },
];

const mergeResponse = {
  targetMemberId: 'm_dst_01',
  archivedSourceMemberId: 'm_src_01',
  mergedAt: '2026-05-09T00:00:00Z',
  auditId: 'aud_merge_001',
};

test.describe('/admin/identity-conflicts × mutation', () => {
  test('成功系: 一覧表示', async ({ adminPage: page }) => { /* ... */ });
  test('成功系: merge', async ({ adminPage: page }) => {
    await page.route('**/api/admin/identity-conflicts/*/merge', (route) => {
      const body = route.request().postDataJSON();
      MergeIdentityRequestZ.parse(body);
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(mergeResponse) });
    });
    /* ... */
  });
  /* dismiss / refresh 境界 同様 */
});

test.describe('/admin/identity-conflicts × authz', () => {
  test('認可: member は 403 page', async ({ memberPage: page }) => { /* ... */ });
  test('認可: anonymous は /login redirect', async ({ anonymousPage: page }) => { /* ... */ });
});
```

> 上記は構造ガイド。最終形は §1 / §2 と Phase 6/7 の規約に従って 200-240 行に収める。
