# Phase 5: 実装（TDD Green）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |
| Implementation Mode | `new` |

## 1. 新規/修正ファイル一覧

| # | path | 種別 | 状態 | 行数目安 |
|---|------|------|------|---------|
| 1 | `apps/web/playwright/tests/admin-member-delete.spec.ts` | E2E spec | **新規** | 175 |
| 2 | `apps/web/src/lib/admin/server-fetch.ts` | Playwright SSR fixture gate | **修正** | `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` |
| 3 | `apps/web/playwright.config.ts` | evidence dir / dev server env | **修正** | focused run routing |
| 4 | `apps/web/src/components/admin/MembersClient.tsx` / `MemberDrawer.tsx` | 削除後 UI 反映補強 | **修正** | row `isDeleted` optimistic reflection |

`apps/api/src/routes/admin/member-delete.ts` / `apps/api/src/routes/admin/audit.ts` は **参照のみ** で変更禁止（不変条件 7）。Next.js Server Component の初期一覧 / audit fetch は browser `page.route()` では捕捉できないため、2b と同じ env fixture gate を `server-fetch.ts` に追加する。

## 2. ファイル骨格（Green 状態の最終形）

```ts
import { expect } from '@playwright/test'
import { test } from '../fixtures/auth'

// === fixtures ===
const memberListFixture = {
  items: [
    { id: 'mem_001', displayName: '山田太郎', isDeleted: false, /* ... */ },
    { id: 'mem_002', displayName: '佐藤花子', isDeleted: false, /* ... */ },
    { id: 'mem_003', displayName: '鈴木次郎', isDeleted: true,  /* ... */ },
  ],
  nextCursor: null,
}
const memberDeleteResponse = { id: 'mem_001', isDeleted: true, deletedAt: '2026-05-09T00:00:00Z' }
const auditEntry = {
  auditId: 'aud_001',
  actorId: 'admin_001',
  action: 'admin.member.deleted',
  targetId: 'mem_001',
  createdAt: '2026-05-09T00:00:00Z',
}

const fulfillJson = (json: unknown) => async (route: import('@playwright/test').Route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) })

test.describe('/admin/members × delete', () => {
  // test #1 〜 #6（Phase 4 §3 と同一）
})
```

## 3. 関数シグネチャ

| 名前 | shape | 副作用 |
|------|-------|--------|
| `fulfillJson(json: unknown)` | `(route: Route) => Promise<void>` | `route.fulfill` を呼び出すのみ。spec scope 内完結 |

## 4. 入出力

| 項目 | 内容 |
|------|------|
| 入力 | Playwright fixture（`adminPage` / `memberPage` / `anonymousPage`） |
| 出力 | test 実行結果（5 pass + 1 skip）/ `apps/web/playwright-report/` |
| 副作用 | なし（mock 完結。実 fetch・実 D1 書込みなし） |

## 5. 実装手順

1. ファイル新規作成: `apps/web/playwright/tests/admin-member-delete.spec.ts`
2. 冒頭で `import` と fixture 定数（`memberListFixture` / `memberDeleteResponse` / `auditEntry`）と `fulfillJson` helper を定義
3. `test.describe('/admin/members × delete', ...)` 配下に 6 test を Phase 4 §3 のとおり配置
4. test #2 のみ `test.skip(...)` で記述し `// TODO(stage-3)` コメントを付与
5. ローカルで `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium` を実行
6. `pnpm typecheck` / `pnpm lint` を pass
7. mock URL pattern が `**/admin/...` の suffix match である事を grep 確認
8. spec 内 `fetch(` が 0 件であることを grep 確認

## 6. 受け入れ基準（Green 化）

| # | 基準 |
|---|------|
| G1 | active 5 test 全て pass |
| G2 | skip = 1（cascade preview のみ） |
| G3 | `pnpm typecheck` / `pnpm lint` exit 0 |
| G4 | 行数 175（`wc -l` で確認）。小規模 helper 外部抽出なしで単一責務を維持 |
