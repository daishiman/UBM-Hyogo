# 2026-05-11 task-15 admin dashboard and members post-merge CI fixes

## Summary

PR #677 (`6c511528`) を `dev` に merge した直後、`dev` 側差分の取り込みで露呈した CI failure 群を 5 commit で修正し、`task-15-admin-dashboard-and-members` を `merged-to-dev / implementation / VISUAL_ON_EXECUTION` で安定化した。Phase-11/12 ドキュメントには含まれない post-merge 限定の知見として、`lessons-learned-task-15-admin-dashboard-and-members-2026-05.md` §L-TASK15-006..010 と artifact inventory §Post-merge CI fixes に同期。

## Fixes

| Commit | 内容 |
| --- | --- |
| `c6465df6` | `apps/web/src/styles/globals.css` を Tailwind v4 `@import "tailwindcss" source(none);` 化し、必要 path のみ `@source` で明示列挙。docs HTML（Next.js streaming chunks 含む）が class 候補スキャンに混入し PostCSS が爆発する事故を抑止 |
| `f1e5b3cd` | `AdminDashboardPage` の testid を `[data-testid^="admin-kpi-card-"]` に追従し、`setAdminDashboardUnresolvedSchema` を `Promise<void>` 化して test 側で `await`。fixture と実装の selector / state drift を解消 |
| `566ae824` | `scripts/e2e-mock-api.mjs` に `/__test__/admin-dashboard` 制御 endpoint を追加し、SSR fetch に test seed を伝搬。`adminMembers` を 3-fixture 化して fixture 内蔵 mock との二重実装を解消 |
| `f4219c36` | `MemberTable` test fixture を `exactOptionalPropertyTypes: true` 整合に修正（`undefined` 代入を避ける型安全 builder） |
| `80831cdf` | dev merge で削除された `MemberDrawer` / `MembersClient` 等 9 コンポーネントに test 23 件を追加し、`apps/web` coverage を 76.73% → 82.73% へ復帰させ gate (80%) を通過 |

## Lessons (詳細は lessons-learned 参照)

- L-TASK15-006: Tailwind v4 auto-source は monorepo + docs HTML を巻き込む → `source(none)` を既定化
- L-TASK15-007: e2e mock の二重実装 drift → standalone HTTP control endpoint を唯一の seed 経路に
- L-TASK15-008: page-object と実装 testid の drift → `data-testid` は kebab + 機能 prefix で統一し prefix-match を優先
- L-TASK15-009: dev merge 後の coverage drop → merge 後に必ず coverage 確認、`exactOptionalPropertyTypes` 環境は key omit 型 helper で統一
- L-TASK15-010: next-auth dynamic import × Turbopack の散発エラー → production build は `next build --webpack` を正本維持

## Boundary

- production-like staging schema-alert recapture と `dev → main` 反映は user-gated
- shared schema / `apps/api` endpoint surface / D1 schema は不変
