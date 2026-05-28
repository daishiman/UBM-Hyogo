# Task B: /admin/audit API 404 切り分け + 修復

> workflow: admin-audit-prototype-alignment
> task_id: task-B
> taskType: implementation / API recovery
> implementation_mode: api-route-recovery

## B.0 実装区分

`[実装区分: 実装仕様書]` — `apps/api/src/index.ts` の検証 + 必要なら mount 順序修正、`apps/web/src/lib/admin/server-fetch.ts` の error 構造化（必要時のみ）、`apps/api` 側 contract / index spec の追加、staging env 検証手順の明文化。CONST_004 のデフォルトに従う。

## B.1 ゴール

staging で発生している `admin api /admin/audit?limit=50 failed: 404` を仮説 H1〜H5 のいずれが真因かを切り分けて根本修復する。`AdminAuditListResponseZ` / `requireAdmin` / cursor encode は一切変更しない。

## B.2 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/api/src/index.ts` | 編集（仮説 H2 真の場合） | `app.route("/admin", adminAuditRoute)` の mount 順を検証し、必要なら他 `/admin/*` route より前に移動 |
| `apps/web/wrangler.toml` または Cloudflare staging vars | 編集（仮説 H1 真の場合） | `[env.staging.vars] INTERNAL_API_BASE_URL` を正しい API Workers URL に修正 |
| `apps/web/src/lib/admin/server-fetch.ts` | 編集（必要時のみ） | `fetchAdmin` の error message に request URL + status を構造化（既存 message 形式 `admin api ${path} failed: ${status}` は維持。status を別フィールドに保持する場合は `AdminFetchError extends Error` を導入） |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 編集 | `app.route("/admin", adminAuditRoute)` 経由で 200 を返す回帰ケース追加 |
| `apps/api/src/index.spec.ts` | 新規 / 編集 | root app に `/admin/audit?limit=1` を投げ 401（auth 不在）= mount OK の回帰ケース。`requireAdmin` の admin session stub も併設 |
| 本 spec ファイル | 編集（実装後） | B.6 の「確定原因」セクションに H1〜H5 のどれが真因だったか、適用した修復を追記 |

## B.3 切り分けプロトコル（実装着手前に必ず実行）

順序: **読取専用の証拠収集 → 修復 → 回帰テスト**。

### B.3.1 Step 1 — staging 値の存在検証（H1 / H5）

```bash
# 1) staging secrets 一覧（値は表示されない／list のみ）
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging

# 2) apps/web の vars（INTERNAL_API_BASE_URL）
grep -A30 "\[env.staging" apps/web/wrangler.toml
```

期待: 両 Workers に `INTERNAL_AUTH_SECRET` 同名 secret が存在し、`INTERNAL_API_BASE_URL` が API Workers の staging URL（例: `https://ubm-hyogo-api-staging.daishimanju.workers.dev`）と一致。

### B.3.2 Step 2 — staging API への直接 curl（H1 / H3 / H5）

```bash
# 値は op run 経由でのみ揮発的に注入。Claude 側では echo / cat しない。
# INTERNAL_API_BASE_URL は Step 1 で確認した staging web Worker の deployed var
# と一致させる。ローカル .env の値だけで H1 を否定しない。
op run --env-file=.env -- bash -c '
  curl -sS -i "$INTERNAL_API_BASE_URL/admin/audit?limit=1" \
    -H "x-internal-auth: $INTERNAL_AUTH_SECRET" \
    -H "cookie: <staging-admin-session>"
'
```

- `200 OK` → **curl 対象 URL が staging web Worker の deployed `INTERNAL_API_BASE_URL` と一致する場合に限り** H1/H2/H3/H5 否定。残るは web 側の経路問題（`fetchAdmin` の path 組立 or cookie 引き継ぎ）。
- `404` → H1（base URL 末尾に `/admin` 等の二重 prefix）または H3（deploy stale）。
- `401/403` → mount OK（H4 否定）。cookie / session 不足を疑う。

### B.3.3 Step 3 — index.ts の mount 順序確認（H2）

`apps/api/src/index.ts` で `app.route("/admin", adminAuditRoute)` (L278) の前後にある `/admin` mount を読み、`*` matcher を持つ sub-router がないことを確認。Hono の各 sub-router は明示パスのみ matching するため、原理的には audit を奪う route は無いはず。

### B.3.4 Step 4 — deploy 確認（H3）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run
# wrangler version listing で最新 deploy timestamp を確認（ユーザー手元のみ）
```

`wrangler tail` で `/admin/audit` への request が API Workers に到達しているかを観測:

```bash
op run --env-file=.env -- wrangler tail --config apps/api/wrangler.toml --env staging --format pretty
```

- 到達している場合 → 404 は API 内部から。H4 を再確認。
- 到達していない場合 → web 側の URL 組立 or DNS / Worker routing 不一致（H1）。

### B.3.5 Step 5 — 真因確定 → 修復

| 真因 | 修復 |
|------|------|
| H1 | `apps/web/wrangler.toml` の `[env.staging.vars] INTERNAL_API_BASE_URL` を修正し再 deploy |
| H2 | `apps/api/src/index.ts` の `app.route("/admin", adminAuditRoute)` を `/admin/*` 群のなかで衝突しない位置（既存通り L278）に維持。実問題は他の route ではなく H2 否定の可能性が高い |
| H3 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` を user-gated 実行 |
| H4 | `requireAdmin` のコードを読み直し（401/403 が正で 404 は想定外）。万一 404 を返している箇所があれば 401/403 に揃える |
| H5 | `INTERNAL_AUTH_SECRET` を `bash scripts/cf.sh secret put` で web/api 両側に再投入し、値の一致を担保 |

## B.4 関数・型・モジュールのシグネチャ（必要時のみ追加）

### B.4.1 `AdminFetchError`（必要時のみ）

既存の error message regex（`/\bfailed:?\b.*\b(\d{3})\b/` in `safe-fetch.ts`）で `ADMIN_FETCH_404` を抽出できているため、**通常はコード変更不要**。

ただし切り分け強化のため `apps/web/src/lib/admin/server-fetch.ts` に以下を追加することを推奨:

```ts
export class AdminFetchError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly responseBodySnippet: string,
  ) {
    super(`admin api ${path} failed: ${status}`);
    this.name = "AdminFetchError";
  }
}
```

`fetchAdmin` の 404 throw を `throw new AdminFetchError(res.status, path, await res.text().catch(() => ""))` に置換。message 文字列は既存維持（regex 互換）。`responseBodySnippet` は 500 文字までに切る（PII 流入防止）。

### B.4.2 `apps/api/src/index.spec.ts` 追加ケース（疑似コード）

```ts
import { describe, it, expect } from "vitest";
import { createApp } from "./index"; // 既存 export がなければ最小 wrapper を export
describe("/admin/audit mount", () => {
  it("returns 401 (not 404) when unauthenticated — mount is alive", async () => {
    const app = createApp(/* test env */);
    const res = await app.request("/admin/audit?limit=1");
    expect([401, 403]).toContain(res.status); // 404 でないことが回帰対象
  });
});
```

`createApp` を export していない場合は、`adminAuditRoute` を直接 `new Hono().route("/admin", adminAuditRoute).request("/admin/audit?limit=1")` で wrap して 401/403 確認する形でも可。

## B.5 入力・出力・副作用

- 入力: なし（コード変更 + staging 検証）
- 出力: `200 OK` を返す `/admin/audit` endpoint（修復後）
- 副作用: staging Workers への deploy（user-gated）/ secret 投入（user-gated）

## B.6 確定原因（実装後に追記）

```
真因（コード側）: H2 否定（mount 順序衝突は確認されず）
証拠:
  - `apps/api/src/index.ts` L255-L283 で `app.route("/admin", adminAuditRoute)` (L278)
    は他 admin route と同列に配置されており、`*` matcher の sub-router は存在しない。
  - 追加した `apps/api/src/index.spec.ts` の root mount 経由 request で status=401（404 ではない）。
  - 追加した `audit.contract.spec.ts` の `GET /admin/audit: routed via root mount returns 200`
    で D1 シード後の root mount request が 200 を返す。
適用した修復:
  - コード側: 回帰テスト 2 件（root mount 401 / root mount 200）を追加し、mount 漏れ
    （H2）と requireAdmin 不整合（H4）の再発を CI で検知する。
  - staging 側 H1 / H3 / H5（env / deploy / secret）の切り分けは user-gated。
    `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging`、
    `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging`、
    `grep -A30 "\[env.staging" apps/web/wrangler.toml` をユーザーが実行して
    `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` の deployed 値を確認する。
再発防止:
  - `apps/api/src/index.spec.ts` — root mount alive (401)
  - `apps/api/src/routes/admin/audit.contract.spec.ts` — `GET /admin/audit: routed via root mount returns 200`
```

> 本セクションは実装 phase で必ず埋める。空のままマージしない。証拠ログは status / request path / Worker 到達有無 / deploy timestamp のみに redaction して貼る。cookie、secret、response body、個人情報、token hash は貼らない。

## B.7 テスト方針

| ケース | 配置 |
|--------|------|
| `audit.contract.spec.ts` — `app.route("/admin", adminAuditRoute)` 経由で 200 | `apps/api/src/routes/admin/audit.contract.spec.ts`（既存に追記） |
| `index.spec.ts` — root app で `/admin/audit?limit=1` が 401（404 でない） | `apps/api/src/index.spec.ts`（新規 or 既存に追記） |
| `safe-server-fetch.spec.ts` — 404 throw → `ADMIN_FETCH_404` reason | `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts`（既存に追記） |

## B.8 ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter api test -- src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm --filter api test -- src/index.spec.ts
mise exec -- pnpm --filter web test -- src/lib/admin/__tests__/safe-server-fetch.spec.ts
```

## B.9 DoD（Definition of Done）

- AC-B1〜B6（Phase 1）すべて満たす
- Step 1-5 の切り分けログが `B.6 確定原因` に記録されている
- 全 unit / contract / index spec が green
- `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` green
- staging で admin セッションを使い `/admin/audit?limit=50` を開いて `200 OK` で audit データが描画される（user-gated 検証）

## B.10 ロールバック / 安全性

- `apps/api/src/index.ts` の mount 順序変更は最小差分（1 行移動）に留め、他 sub-router の relative 順序を変えない
- secret / env 変更は user-gated（`bash scripts/cf.sh secret put` 直接実行は本仕様書では指示しない）
- deploy も user-gated
- 万一修復で他 admin route が壊れた場合、`apps/api/src/index.spec.ts` の追加ケースが先に fail するため CI で検知される
