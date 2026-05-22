# Phase 2: ドメイン・契約定義

## 2.1 用語

| 用語 | 定義 |
|------|------|
| build-time env | `next build` 実行プロセスの `process.env`。Node プロセス上で評価される |
| runtime env | Cloudflare Workers ランタイムで `getCloudflareContext().env` 経由で得られる binding |
| OpenNext Workers bundle | `@opennextjs/cloudflare build` が生成する Workers 互換 bundle。内部で `next build` を呼ぶ |
| `[vars]` block | `wrangler.toml` の Workers 実行時 env binding。**build 時には適用されない** |
| GitHub Environment | repo > Settings > Environments。`staging` / `production` 単位で Secrets / Variables を保持 |

## 2.2 契約・不変条件（変更禁止）

- C-INV-01: `apps/web` ランタイムでの env 参照は `apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` 経由のみ（CLAUDE.md）。
- C-INV-02: `process.env.*` の直接参照は禁止（CLAUDE.md）。
- C-INV-03: `EnvSchema` は zod 検証し parse 失敗時 throw する設計を維持（catch 握り潰し禁止）。
- C-INV-04: Cloudflare CLI は `scripts/cf.sh` 経由のみ（CLAUDE.md）。
- C-INV-05: `127.0.0.1:8888` 等ローカル限定エンドポイントの `apps/web/src` 焼き込み禁止（task-18 regression smoke gate）。

## 2.3 契約・許容変更（本サイクル対象）

| 項目 | 変更可否 | 備考 |
|------|----------|------|
| `.github/workflows/web-cd.yml` の build step `env:` ブロック追加 | ✅ | placeholder 値のみ注入。runtime 値は wrangler.toml が引き続き正本 |
| `apps/web/src/lib/seo/site-metadata.ts` の build-phase fallback 追加 | △ | C-INV-01/02 を破らない範囲で `getPublicEnv` 呼び出し方を調整する場合のみ。task-01 仕様書で明示判断 |
| Cloudflare API Token 値 | ✅ | rotation 必要 |
| GitHub Environment Secrets (`CLOUDFLARE_API_TOKEN`) | ✅ | 値更新（名称は不変） |

## 2.4 受け入れ条件

| ID | 条件 |
|----|------|
| AC-01 | `dev` 強制 push → `web-cd / deploy-staging` 成功 |
| AC-02 | `dev` 強制 push → `backend-ci / deploy-staging` 全 step 成功 |
| AC-03 | `apps/web` の `process.env.*` 直接参照が追加されていない（grep gate 維持） |
| AC-04 | `pnpm typecheck && pnpm lint` がローカルで pass |
| AC-05 | `apps/web/src/lib/__tests__/env.spec.ts` の既存ケースが pass |
| AC-06 | staging Worker `/` が HTTP 200 を返す |
