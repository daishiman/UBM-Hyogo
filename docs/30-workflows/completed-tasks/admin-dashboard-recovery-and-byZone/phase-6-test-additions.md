# Phase 6 — Test Additions

[実装区分: 実装仕様書]

## 6.1 新規テストファイル一覧

| File | 種別 | 対応 |
|------|------|------|
| `apps/api/src/routes/admin/__tests__/dashboard-byZone.spec.ts` | unit (api integration) | T-B-01 / AC-B2 |
| `apps/api/src/routes/admin/_shared/__tests__/byZone.spec.ts` | unit (pure fn) | T-B-01 |
| `packages/shared/src/zod/__tests__/admin-dashboard-view-byZone.spec.ts` | unit (zod) | T-B-02 / AC-B3 |
| `apps/web/src/lib/admin/__tests__/admin-dashboard-ui-byZone.spec.ts` | unit (mapper) | T-B-03 |
| `apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts` | unit (fetch URL) | T-B-04 / H3 回帰防止 |
| `apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts` | unit (normalizeError) | T-B-05 / H2 回帰防止 |
| `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx` | component | T-B-06 / AC-B4 / AC-B5 |
| `apps/web/tests/e2e/admin-dashboard-staging.spec.ts` | playwright staging smoke | T-B-07 / AC-B4 |

> 全 test file は `*.spec.{ts,tsx}` 拡張子 (CLAUDE.md #8)。

## 6.2 必須テストケース

### `byZone.spec.ts` (pure fn)

- raw rows が `[{zone:"0→1",count:3},{zone:"1-10",count:7},{zone:"10to100",count:1}]` のとき length=3 / key 順固定 / 各 count 反映
- raw rows が空 `[]` のとき 3 件全て count=0 を返す
- raw rows に `{zone:"unknown",count:99}` が含まれても無視される
- `tone` が `0to1=info` / `1to10=accent` / `10to100=ok` で固定

### `admin-dashboard-view-byZone.spec.ts` (shared zod)

- `byZone` 未提供時 `safeParse.success === true`
- `byZone` length=3 / 各 key 一致時 success
- `byZone` length=2 のとき success === false
- `tone` enum 外 ("warn" 等) のとき success === false

### `admin-dashboard-ui-byZone.spec.ts` (web mapper)

- 新 shape → `ReadonlyArray<ZoneSlice>` length=3
- 旧 loose shape (`[{zone:"0→1",count:3}]`) → `undefined`
- API が `byZone` 未提供 → `undefined`

### `server-fetch-url.spec.ts` (H3 回帰防止)

- `safeServerFetch("/admin/dashboard")` の組み立て URL が `<resolveApiBase()>/admin/dashboard` と equal
- trailing slash が混入しても二重 slash にならない

### `safe-server-fetch-404-vs-401.spec.ts` (H2 回帰防止)

- mock fetch が 401 を返したとき code === `ADMIN_FETCH_401`
- mock fetch が 404 を返したとき code === `ADMIN_FETCH_404`
- 上記が **混同しないこと** を assert

### `ZoneDistribution.spec.tsx`

- `slices=3 件` の入力で `role="img"` / `aria-label=/zone 別人数/i` visible
- 各 li が `Chip(tone) + label + hint + count(mono) + bar` 構造
- `slices=undefined` で placeholder のみ表示
- `style` に HEX 直書きが含まれないこと (`var(--ubm-color-*)` のみ) を文字列 assertion で検証

### `admin-dashboard-staging.spec.ts` (playwright staging smoke)

- `STAGING_ADMIN_COOKIE` 未設定時は `test.skip()`
- `page.goto(STAGING_WEB_BASE + "/admin")` が 200
- `getByRole('img', { name: /zone 別人数/i })` visible
- `getByRole('region', { name: /KPI/i })` visible
