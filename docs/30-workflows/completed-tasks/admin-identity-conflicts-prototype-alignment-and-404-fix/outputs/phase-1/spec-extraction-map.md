# Spec Extraction Map — admin-identity-conflicts

system spec → current code anchor の 4 系統 mapping。Phase 4 の root-cause 切り分けと UI 整合で参照する。

## 1. Route Owner

| 系統 | spec source | 実装 anchor | 状態 |
|---|---|---|---|
| GET list | `apps/api/src/routes/admin/identity-conflicts.ts` L20-50 周辺の `app.get("/identity-conflicts", ...)` | 同上 | 実在・実装済 |
| POST merge | 同 L50-80 `app.post("/identity-conflicts/:id/merge", ...)` | 同上 | 実在・実装済 |
| POST dismiss | 同 L80-113 `app.post("/identity-conflicts/:id/dismiss", ...)` | 同上 | 実在・実装済 |
| mount | `apps/api/src/index.ts:283` `app.route("/admin", createAdminIdentityConflictsRoute())` | 同上 | mount 済 |

> 重要: route prefix は `/admin` で mount され、route 内部は `/identity-conflicts` から書き始める設計。最終 URL は `/admin/identity-conflicts` になる。**`/admin/admin/identity-conflicts` のような二重 prefix にはなっていない**ことを Phase 4 H5 切り分けで確認する。

## 2. Handoff 実装（proxy / fetch wrapper）

| 系統 | spec source | 実装 anchor | 状態 |
|---|---|---|---|
| web → api proxy | `apps/web/app/api/admin/[...path]/route.ts` | `proxy()` 関数: `${apiBase()}/admin/${path.join("/")}${url.search}` | path 連結ロジックを Phase 4 H5 で再検証 |
| env 解決 | `apps/web/app/api/admin/[...path]/route.ts` `apiBase()` | `process.env["INTERNAL_API_BASE_URL"] || "http://127.0.0.1:8787"` | fallback が staging に hit していないか Phase 4 H2 で検証 |
| requireAdmin proxy 側 | 同 file `requireAdmin()` | `session?.user.isAdmin !== true` で 403 を返す | 401/403 が 404 にすり替わっていないか Phase 4 H4 で検証 |
| internal auth secret 注入 | 同 file | `x-internal-auth: INTERNAL_AUTH_SECRET` header | staging で secret 投入済か Phase 4 ops で read-only 確認 |
| server-side safeServerFetch | `apps/web/src/lib/admin/safe-server-fetch.ts` / `apps/web/src/lib/admin/server-fetch.ts` | `fetchAdmin("/admin/identity-conflicts")` | path 先頭 `/admin/` を proxy が二重化していないかを Phase 4 H5 で `curl -v` で確認 |

## 3. 状態 (D1) Owner

| table | spec source | apps/api anchor | staging 適用要 |
|---|---|---|---|
| `member_identities` | `apps/api/migrations/*member_identities*.sql` | identity-conflict.repository.ts で SELECT/UPDATE | Phase 4 H3 で `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` で適用状態確認 |
| `identity_aliases` | 同上 | repository で参照 | 同上 |
| `identity_conflict_dismissals` | 同上 | repository で SELECT/INSERT | 同上 |
| binding | `apps/api/wrangler.toml` `[env.staging.d1_databases]` | `DB` binding | binding 名と DB name が staging で一致するか read-only 確認 |

> 重要: 404 の原因がもし 500 のすり替えだった場合、tail で error 種別を Phase 4 H3 切り分けで確認する。

## 4. 対象 View（4 系統）

| view | path | owner | 改修方針 |
|---|---|---|---|
| list page | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | apps/web (Server) | AdminPageHeader + card primitives に置換 |
| row (group + sublist + modals) | `apps/web/src/components/admin/IdentityConflictRow.tsx` | apps/web (Client) | tokens + primitives 置換、modal ロジック無改変 |
| section error fallback | `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx` | apps/web (Client) | 無改変（B 系統で 404 を出さない方向に修正） |
| empty | `apps/web/src/components/ui/EmptyState.tsx` | apps/web | 無改変 |

## 5. Cross-cut（404 切り分け視点）

| 仮説 | 観測点 | 観測コマンド（read-only） |
|---|---|---|
| H1: build 未配置 | staging Workers の最新 deploy bundle に identity-conflicts route が含まれるか | `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging` + `curl https://<staging-api-origin>/admin/identity-conflicts -H "x-internal-auth: <op://...>"` で 404 か 401 か |
| H2: env mismatch | `apps/web` の `INTERNAL_API_BASE_URL` が staging で正しい origin を指すか | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging`（key 存在のみ）+ wrangler.toml の `[env.staging.vars]` の `INTERNAL_API_BASE_URL` 値を git で確認 |
| H3: D1 migration 未適用 | `member_identities` 等が staging D1 に存在するか | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` |
| H4: session 失効 | proxy `requireAdmin()` が 403 を返し、後段で 404 に化けていないか | Chrome devtools network で `/api/admin/identity-conflicts` の response status を確認、`set-cookie` 期限を観測 |
| H5: proxy path strip | proxy が `/admin/identity-conflicts` を正しく upstream へ転送しているか | local で `curl -v http://localhost:3000/api/admin/identity-conflicts` を打ち、upstream に届く `/admin/identity-conflicts` がそのまま hit するか tail で確認 |
