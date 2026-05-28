# Phase 4 — Test Plan

[実装区分: 実装仕様書]

## 4.1 テスト一覧

| ID | 種別 | 対象 | 内容 | 期待 |
|----|------|------|------|------|
| T-B-01 | unit (api) | `apps/api/src/routes/admin/dashboard.ts` + `_shared/byZone.ts` | `byZone` が 3 key 固定で返ること (fixture: zone 値混在 / 空 / 範囲外) | 配列 length=3 / key 順序固定 / unknown 行が混入しても捨てられる |
| T-B-02 | unit (shared) | `packages/shared/src/zod/viewmodel.ts` | `AdminDashboardViewZ` が `byZone` なしも `byZone` ありも両方 parse 成功 | safeParse.success === true 双方 |
| T-B-03 | unit (web mapper) | `apps/web/src/lib/admin/admin-dashboard-ui.ts` | `parseZoneSlices` が新 shape を通し、旧 shape を `undefined` に落とす | 新 shape→`ZoneSlice[]` / 旧 shape→`undefined` |
| T-B-04 | unit (web fetch) | `apps/web/src/lib/admin/server-fetch.ts` | URL 組み立てが `${resolveApiBase()}/admin/dashboard` に一致 (H3 回帰防止) | 期待 URL string と equal |
| T-B-05 | unit (web safe) | `apps/web/src/lib/admin/safe-server-fetch.ts` | 401 と 404 を別 code に正規化 (`ADMIN_FETCH_401` / `ADMIN_FETCH_404`) | code が混同しない (H2 回帰防止) |
| T-B-06 | component (web) | `_dashboard/ZoneDistribution.spec.tsx` | `slices=3 件` で `Chip + label + hint + count + bar` DOM が一致 / `slices=undefined` で placeholder | DOM snapshot 一致 / role="img" / aria-label visible |
| T-B-07 | smoke (playwright staging) | `apps/web/tests/e2e/admin-dashboard-staging.spec.ts` | `/admin` 200 + `zone 別人数` aria-label visible + KPI 4 件 visible | playwright assertion 全通 |
| T-B-08 | curl (staging) | `GET /admin/dashboard` admin cookie | `byZone` 配列長 3・各 key in enum | `jq '.byZone\|length, [.byZone[].key]'` が `3 / ["0to1","1to10","10to100"]` |

## 4.2 命名・配置規約

- 全 test ファイルは `*.spec.{ts,tsx}` (CLAUDE.md #8)。`*.test.{ts,tsx}` は禁止。
- 配置は対象モジュールに最近接の `__tests__/` ディレクトリ:
  - api: `apps/api/src/routes/admin/__tests__/`
  - shared: `packages/shared/src/zod/__tests__/`
  - web lib: `apps/web/src/lib/admin/__tests__/`
  - web component: `apps/web/src/features/admin/components/_dashboard/__tests__/`
  - e2e: `apps/web/tests/e2e/`

## 4.3 fixture 戦略

- T-B-01: `buildByZoneSlices` を pure function として直接テスト。raw rows は `[{zone:"0→1",count:3},{zone:"1-10",count:7},{zone:"10to100",count:1},{zone:"unknown",count:99}]` の混在 fixture で正規化挙動を検証。
- T-B-02: `byZone` ありの fixture と `byZone` なしの既存 fixture (snapshot 流用) の 2 ケース。
- T-B-05: `fetch` を mock し、401 / 404 / 200 の 3 status code 経路で `code` field を assert。
- T-B-07: `STAGING_ADMIN_COOKIE` を env 経由で playwright に渡し、`process.env.STAGING_ADMIN_COOKIE` 未設定時は `test.skip()`。
