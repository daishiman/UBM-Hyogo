# workflow-task-b-root-page-public-header-async artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-b-root-page-public-header-async/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` |
| parent | `docs/30-workflows/public-header-logged-in-nav-cleanup/` |
| task | Task B: root `/` PublicHeader authView wiring |

## Implementation Artifacts

| Classification | Path |
| --- | --- |
| AuthView helper | `apps/web/src/lib/auth-view/index.ts` |
| PublicHeader auth slot | `apps/web/src/components/public/PublicHeader.tsx` |
| public layout wiring | `apps/web/app/(public)/layout.tsx` |
| root page wiring | `apps/web/app/page.tsx` |

## Test Artifacts

| Classification | Path |
| --- | --- |
| AuthView resolver unit test | `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` |
| PublicHeader component test | `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` |
| root page wiring test | `apps/web/app/__tests__/page.spec.tsx` |

## Evidence

| Classification | Path | Status |
| --- | --- | --- |
| focused Vitest | `docs/30-workflows/completed-tasks/task-b-root-page-public-header-async/outputs/phase-11/evidence/focused-vitest.log` | present |
| typecheck | `docs/30-workflows/completed-tasks/task-b-root-page-public-header-async/outputs/phase-11/evidence/typecheck.log` | present |
| lint | `docs/30-workflows/completed-tasks/task-b-root-page-public-header-async/outputs/phase-11/evidence/web-lint.log` | present |
| web build | `docs/30-workflows/completed-tasks/task-b-root-page-public-header-async/outputs/phase-11/evidence/web-build.log` | present |
| staging runtime | `docs/30-workflows/completed-tasks/task-b-root-page-public-header-async/outputs/phase-11/evidence/staging-root-curl.log` | pending_user_approval |

## Boundary

Cloudflare staging deploy, authenticated `/` curl, wrangler tail clean evidence,
commit, push, and PR are user-gated.

## Lessons Learned

- **L-TBPHA-001 (AuthView source 集約)**: `apps/web` の public 層で session 由来の出し分けを行う component は、各 layout/page で `getSession()` を直接呼ばず `apps/web/src/lib/auth-view/getAuthView()` 経由で `AuthView` (`guest | member | admin`) を取得し props として渡す。これにより `PublicHeader` 等の auth-aware component は async server component かつ純粋に props 配線のみで mount でき、`(public)` route group 外の root `/` も同じ wiring を踏襲できる。
- **L-TBPHA-002 (async PublicHeader と root page の同期境界)**: Task A で `PublicHeader` を `async function({ authView })` 化すると、`(public)` route group 外で `<PublicHeader />` を直接 mount する root page (`apps/web/app/page.tsx`) は型・実行両面で破綻する。`page.tsx` は既に async server component で `getStats` / `listMembersRaw` を `Promise.all` で取得しているため、同 server cycle に `getAuthView()` を 1 行追加する **route 移動なし** が最小差分。route 移動 (`app/page.tsx` → `app/(public)/page.tsx`) は SEO/metadata 影響があるため不採用。
- **L-TBPHA-003 (page.spec.tsx の auth mock 拡張)**: root page の vitest spec は guest / member 2 ケースで `getAuthView` を mock し、`PublicHeader` が受け取る `authView.kind` の境界を assert する。NON_VISUAL workflow は `data-auth-state` 属性 grep + vitest を visual evidence の代替とし、Phase 11 では `static-source-guard.log` で `<PublicHeader />` が直接 mount されていないことを grep gate で固定する。
- **L-TBPHA-004 (`getAuthView()` の fail-closed)**: `getAuthView()` 内部の `getSession()` throw は `try/catch` で `{ kind: "guest" }` にフォールバックする。これは CLAUDE.md invariant #11 (env 不変条件) の `getAuthEnv()` safeParse fail-closed と同じ思想で、auth 境界は **未認証 fallback** を default とし、guard 失敗時に SSR 全体を 500 に巻き込まない。
- **L-TBPHA-005 (parent workflow との境界記録)**: 親 workflow `public-header-logged-in-nav-cleanup` は Task C-G + 横断 Playwright 残のため `spec_created` のまま。Task B standalone workflow が `implemented_local_evidence_captured` に昇格しても、親 index.md の Task B 行のみを更新し、親全体の workflow_state は触らない (`Step 1-A` 限定同期)。
