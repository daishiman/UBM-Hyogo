# Phase 1: 要件定義 / スコープ確定 / 既存実装インベントリ

## 0. メタ情報

| key | value |
|---|---|
| workflow root | `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| implementation_mode | `existing-route-alignment-and-runtime-recovery` |
| primary source (A UI) | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` `AdminMembersPage` / `AdminTagsPage`（identity-conflicts 専用ページは未掲載・最近接規範を採用） |
| primary source (B 404) | `apps/api/src/routes/admin/identity-conflicts.ts` / `apps/api/src/index.ts:283` / `apps/web/app/api/admin/[...path]/route.ts` / Cloudflare staging deploy artifact |
| 現行 UI | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` (71 行・Tailwind 直書き) + `apps/web/src/components/admin/IdentityConflictRow.tsx` (236 行・Tailwind 手書き) |
| 状態 | `spec_created` |

## 1. 背景

`/admin/identity-conflicts` は serial-05 / issue-194-03b で機能実装（list + 二段階 merge + dismiss + 二段階確認 modal）が既に完了している。一方で:

1. **UI 表現**: 他 admin 画面（members / meetings / tags）は 2026-05 の admin-ui-prototype-alignment workflow 群で既に `AdminPageHeader` + admin primitives（card / card-pad-lg / page-head / eyebrow / Chip / Button variant 等）に揃ったが、`identity-conflicts` は **alignment 対象外として取り残されており**、Tailwind 直書きの古い構造 (`<main className="mx-auto max-w-5xl px-6 py-8">` + `<header>` + `<ul className="divide-y...">`) のままになっている。
2. **runtime 不全**: staging 環境で本 route を開くと、`safeServerFetch("/admin/identity-conflicts")` が 404 を返し、`AdminSectionErrorClient` が `ADMIN_FETCH_404` セクションエラーを表示するスクリーンショットが確認されている（local では 200 で動作）。原因は未確定で H1〜H5 の 5 仮説を Phase 4 で順次切り分ける。

本ワークフローは **API endpoint / D1 schema / requireAdmin 不変条件を一切変更せず**、(A) UI を他 admin alignment 同等まで整え、(B) staging 404 の root-cause を特定して最小 fix を当てる、2 系統の **1 サイクル完了** タスクである。

## 2. 現状コードインベントリ（実測）

### A 系統（UI）

| path | 役割 | 改修方針 |
|---|---|---|
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` (71 行) | Server Component。`safeServerFetch` → `<main>` + `<Breadcrumb>` + `<header>` + `<ul divide-y>` で list 描画 | **`AdminPageHeader` 導入 + `<main>` wrapper を admin 標準（layout.tsx 提供前提）に揃え + 一覧 wrapper を admin primitives（card / card-pad-lg）に置換** |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` (236 行) | Client Component。行内に group-by-key + 候補 sublist + 二段階 merge modal (Step1 確認 / Step2 reason) + dismiss modal | **Tailwind 手書きを admin primitives + tokens に置換。modal は既存ロジックを維持しつつ surface を `card-pad-lg` + Chip(tone) + Button(variant) で再構成** |
| `apps/web/src/components/admin/Breadcrumb.tsx` | 既存 admin breadcrumb | **無改変**（`AdminPageHeader` の `breadcrumbs` prop 経由で利用） |
| `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` | 既存 page header primitive | **無改変** |
| `apps/web/src/components/ui/EmptyState.tsx` | EmptyState primitive | **無改変** |
| `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx` | section error 表示 | **無改変**（B 系統の 404 修復後も hook の最後の安全弁として残す） |
| `apps/web/src/styles/tokens.css` | OKLch token 正本 | **無改変**。`var(--ubm-color-*)` を引用 |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | `safeServerFetch` wrapper | **無改変** |

### B 系統（runtime / proxy / api）

| path | 役割 | 改修方針 |
|---|---|---|
| `apps/api/src/routes/admin/identity-conflicts.ts` (113 行) | Hono route。`GET /admin/identity-conflicts` / `POST /:id/merge` / `POST /:id/dismiss`。`requireAdmin` middleware 適用済 | **無改変**（route は実在し正しく実装済。404 原因の H1〜H5 で何が hit しているかを Phase 4 で切り分け、必要時のみ最小 patch） |
| `apps/api/src/index.ts:283` | mount: `app.route("/admin", createAdminIdentityConflictsRoute())` | **無改変**（mount は完了済） |
| `apps/web/app/api/admin/[...path]/route.ts` (67 行) | `/api/admin/*` → `INTERNAL_API_BASE_URL/admin/*` proxy。`requireAdmin` (Auth.js session) で 403、`x-internal-auth` secret 注入 | **基本無改変**。H5 (proxy path strip) 切り分けで問題ありの場合のみ最小 patch |
| `apps/web/src/lib/admin/server-fetch.ts` (412 行) | `fetchAdmin` / `safeServerFetch` 実装 | **無改変** |
| `apps/web/src/lib/env.ts` `getApiBaseEnv()` | env 解決 | **無改変**。staging で `INTERNAL_API_BASE_URL` が正しい origin を指しているかを Phase 4 ops 手順で read-only 検証 |
| staging Cloudflare deploy artifact | 最新 dev build に identity-conflicts route が含まれているか | **read-only 検証**（`bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging`） |
| staging D1 (`ubm-hyogo-db-staging`) | `member_identities` / `identity_aliases` / `identity_conflict_dismissals` 適用状態 | **read-only 検証**（`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging`） |

## 3. 機能要件

### A 系統 — UI 整合

| ID | 要件 |
|---|---|
| FR-A1 | `/admin/identity-conflicts` の page を `<AdminPageHeader title="Identity 重複候補" description="..." breadcrumbs={[{label: 'Identity 重複候補'}]} />` で構成する |
| FR-A2 | list wrapper を `<section class="card card-pad-lg">` + `<ul class="stack">` 構造に置換。`divide-y` 直書きは廃止し、admin token-aware border に整える |
| FR-A3 | 各行の `IdentityConflictRow` 内部 surface を admin primitives（`card` / `card-pad-md`）+ `Chip(tone="warn")` + `Button(variant="primary|ghost", size="sm")` で再構成 |
| FR-A4 | 二段階 merge modal の Step1 / Step2 / dismiss modal を、admin 既存 modal primitives もしくは tokens 経由の最小 surface に整える（modal 自体の機能挙動は無改変） |
| FR-A5 | empty / error / loading の 3 状態を members / tags と同等の表現に揃える（EmptyState は既に共通、error は `AdminSectionErrorClient` を引き続き利用） |
| FR-A6 | 色は `apps/web/src/styles/tokens.css` の `--ubm-color-*` 経由のみ。HEX 直書きと `bg-[#xxx]` / `text-[#xxx]` 直書きは全廃 |

### B 系統 — 404 復旧

| ID | 要件 |
|---|---|
| FR-B1 | staging で `/admin/identity-conflicts` を開いた authenticated admin が `ADMIN_FETCH_404` セクションエラーを見ない（200 OK で list / empty / error のいずれかが描画される） |
| FR-B2 | H1〜H5 のどの仮説が hit したかを `phase-11/evidence/root-cause-triage.md`（後続 Phase で生成）に記録する |
| FR-B3 | コード変更で復旧する場合（H5 のみ該当しうる）は、変更を最小差分で当て、回帰テストを `apps/web` 側 vitest として追加する |
| FR-B4 | ops 操作で復旧する場合（H1 / H2 / H3 / H4）は、復旧手順を Phase 4 ops table に書ききり、Gate-C user 承認後に `bash scripts/cf.sh` 経由で実行する |

## 4. 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | HEX 直書き禁止。`verify-design-tokens` CI gate を通過すること |
| NFR-2 | `apps/web` からの D1 直接アクセス禁止（既存 proxy `/api/admin/*` 経由のみ） |
| NFR-3 | 新規 API endpoint 追加禁止 |
| NFR-4 | Server Component / Client Component 境界は現行構造を維持（`page.tsx` Server、`IdentityConflictRow` Client） |
| NFR-5 | a11y: modal の `role="dialog"`, focus trap, ESC close、Chip / Button の aria-label を維持 |
| NFR-6 | 1 サイクル内完了（CONST_007）。A と B を分離した別 PR にしない |
| NFR-7 | OpenNext Cloudflare Workers build で動作する範囲のみ。staging deploy bundle に node-only API を増やさない |
| NFR-8 | `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` の実値を docs / logs / PR 本文に書き出さない（`op://Vault/Item/Field` 参照のみ） |

## 5. 受け入れ基準（AC）

### A 系統

- AC-A1: `/admin/identity-conflicts` の DOM に `<header>` 直配置ではなく `<header>` 配下 `AdminPageHeader` の breadcrumb + h1 + description 構造が render される
- AC-A2: list が `<ul class="divide-y divide-zinc-200 rounded-md border border-zinc-200">` ではなく `card card-pad-lg` + `stack` 構造で描画される
- AC-A3: 各 `IdentityConflictRow` 内に `Chip` と `Button` primitive が利用され、Tailwind 色 utility (`text-blue-600` 等) が 0 件になる
- AC-A4: `verify-design-tokens` が 0 件 fail で PASS
- AC-A5: `pnpm typecheck` / `pnpm --filter web lint` / `pnpm --filter web vitest run -- IdentityConflictRow` が全て PASS
- AC-A6: 既存 Playwright `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` が（selector 微更新を除き）PASS

### B 系統

- AC-B1: staging で admin session が認証済の状態で `/admin/identity-conflicts` GET が 200 を返し、`AdminSectionErrorClient` の `ADMIN_FETCH_404` が描画されない
- AC-B2: H1〜H5 のどの仮説が hit したか、および採用した復旧手段（ops or code）が `phase-11/evidence/root-cause-triage.md` に記録される
- AC-B3: コード変更を伴う場合、`apps/web/src/lib/admin/__tests__/*.spec.ts` 配下に proxy path strip 回帰テストが追加される
- AC-B4: 復旧後 24h 以内に再発しないことを確認する手順（`curl` + tail）が Phase 7 テスト戦略に明記される

## 6. スコープ確定

### 含む

- `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` の AdminPageHeader 配線 + list wrapper 置換
- `apps/web/src/components/admin/IdentityConflictRow.tsx` の primitives + tokens 置換（modal ロジック無改変）
- focused vitest spec 更新（snapshot / classNames）
- staging 404 の root-cause 切り分け evidence 取得（read-only）
- 切り分け結果に応じた最小 fix（多くは ops、必要時のみ code）
- Phase 11 で local screenshot 取得（list / empty / merge-modal）
- Phase 11 で staging 200 OK 復元の curl evidence 取得

### 含まない

- `apps/api/src/routes/admin/identity-conflicts.ts` の機能変更
- D1 schema 変更 / 新規 migration
- 二段階 merge / dismiss の業務ロジック変更
- Auth.js session / cookie / OAuth scope 変更
- 他 admin route の追加 alignment（既に完了済）
- `apps/api` 全体の deploy 戦略変更（staging 復旧で `bash scripts/cf.sh deploy` を 1 回実行する場合は Gate-C で user-gated）

### 正本順位

1. 本ワークフローの phase-1〜phase-7 ファイル
2. `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` の `AdminMembersPage` / `AdminTagsPage`
3. `apps/web/src/styles/tokens.css`
4. 他 admin alignment workflow の確定パターン（completed-tasks 配下 admin-meetings / members / tags）
5. `apps/api/src/routes/admin/identity-conflicts.ts`（contract 観測対象として read-only）

## 7. 既存実装との差分サマリー（プロトタイプ規範 → 現状）

| 観点 | 規範（members / tags alignment 後） | 現状 identity-conflicts | 差分 |
|---|---|---|---|
| page header | `<AdminPageHeader title description breadcrumbs />` | `<Breadcrumb />` + 手書き `<header><h1><p>` | **AdminPageHeader 未使用** |
| `<main>` wrapper | layout.tsx 側で提供 | `<main className="mx-auto max-w-5xl px-6 py-8">` 直書き | **重複 main 構造** |
| list surface | `card card-pad-lg` + `stack` | `ul.divide-y.rounded-md.border` | **primitive 未利用** |
| 色 | `var(--ubm-color-*)` 経由 | `text-zinc-600` / `text-blue-600` / `divide-zinc-200` 等 Tailwind 色 utility | **token 未経由** |
| Button | `Button variant size leftIcon` primitive | row 内に手書き button | **primitive 未利用** |
| modal | admin tokens 経由の panel surface | 全 Tailwind 手書き | **token / primitive 未利用** |
| section error | `AdminSectionErrorClient` | 同 | **整合済（B 系統で 404 を出さなくする方向に修正）** |

## 8. 実装モード判定の根拠

- route / page / row component / API / D1 すべて実在 → `new` ではなく `existing-*`
- A は UI 表現のみ差し替え → `existing-route-alignment`
- B は runtime 復旧 / ops 主体（コード変更は最小 or 0 件）→ `runtime-recovery`
- 2 系統を 1 サイクルで扱うため複合モード `existing-route-alignment-and-runtime-recovery` を採用

## 9. リスクと初期対策

| リスク | 影響 | 対策 |
|---|---|---|
| modal 再構成で focus trap / ESC close が壊れる | a11y 退行 | 既存 e2e (`admin-identity-conflicts.spec.ts`) を Phase 11 まで実行し緑を維持 |
| staging 404 が H1 (build 未配置) だった場合の deploy が他コミットを巻き込む | 他 work-in-progress を staging に引っ張る | `bash scripts/cf.sh deployments list` で現 staging HEAD を確認後、`origin/dev` HEAD を確実に揃えてから deploy（Gate-C） |
| H4 (auth session 失効) の場合に修正対象が UI 側でなく Auth.js 側に飛び火 | スコープ拡大 | H4 hit 時は本 workflow では「session 復旧で 404 が消えること」を確認するに留め、Auth.js の構造的修正は別 issue 起票 |
| primitives 置換で既存 e2e の selector が破壊 | e2e fail | data-* attribute（`data-conflict-id` 等）は維持。class 依存 selector は phase 7 で洗い直し |
| token 置換時の contrast 退行 | a11y AA 不達 | members alignment 同様に最暗 surface で axe 検証（local で `pnpm exec playwright test --grep axe` を想定） |

## 10. aiworkflow-requirements skill 参照表

| ref file | 利用目的 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | admin proxy 経路と requireAdmin 境界の確認 |
| `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md` | D1 直接アクセス禁止と repository 境界の確認 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-194-identity-merge-2026-05.md` | identity merge UX の lesson（二段階確認 / reason 必須） |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-admin-ui-prototype-alignment-2026-05.md` | admin UI alignment の汎化パターン（primitives / tokens 置換手順） |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-06c-B-admin-members-2026-05.md` | members alignment で確立した AdminPageHeader 配線パターン |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-06c-C-admin-tags-2026-05.md` | tags alignment の card-pad-lg + stack 構造パターン |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-06c-E-admin-meetings-2026-05.md` | meetings alignment の queue surface パターン（list 行構成の規範） |

## 11. Phase 1 完了条件

- [x] taskType / visualEvidence / implementation_mode を確定
- [x] A / B 両系統の既存ファイルインベントリと改修方針を明示
- [x] FR-A1..A6 / FR-B1..B4 / NFR-1..8 / AC-A1..A6 / AC-B1..B4 を列挙
- [x] スコープの「含む」「含まない」を明示
- [x] 正本順位を確定
- [x] 規範 → 現状の差分 7 観点を表化
- [x] 実装モードを `existing-route-alignment-and-runtime-recovery` と判定し根拠を記載
- [x] 初期リスク 5 件と対策を列挙
- [x] aiworkflow-requirements skill 参照表を 7 件明示
