[実装区分: 実装仕様書]

# task-01-web-build-env-injection — 実装仕様書

## 1. 背景と現象（CI ログ要点）

PR #815 マージ後、`dev` ブランチへの push で `web-cd / deploy-staging` の `Build web app (OpenNext Workers bundle)` step が継続的に失敗している。

CI ログの要点:

- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` 実行中、Next.js 16 の `next build --webpack` 段階で `/_not-found` ルートのプリレンダリング時に ZodError が throw されてプロセスが exit code 1。
- スタックトレースは `apps/web/src/lib/seo/site-metadata.ts:21` で `getPublicEnv()` を呼び出した際に `EnvSchema.parse` 失敗（`ENVIRONMENT` および `NEXT_PUBLIC_API_BASE_URL` が `undefined` で zod の `enum` / `url` 制約を満たさず）。
- ローカル / preview build 時にも、`wrangler.toml [vars]` を読まないため再現可能（GitHub Actions 上は GitHub Environment `staging` の Secrets/Variables も build step に明示注入されていない）。

## 2. 根本原因

`next build` は Node プロセス上で実行される build-time の処理であり、`process.env` のみを env ソースとして参照する。一方 `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` は **Cloudflare Workers runtime の binding 注入仕様** であり、build 時の Node プロセスには反映されない。

`apps/web/src/lib/env.ts` の `getPublicEnv()` は `EnvSchema.pick({ ENVIRONMENT, NEXT_PUBLIC_API_BASE_URL })` を `parse` するが、build-time の `process.env` には両者が存在しないため必ず throw する。`getPublicEnv()` は `apps/web/src/lib/seo/site-metadata.ts:21` から metadata 生成経路で呼ばれ、`/_not-found` などの static prerender 対象ルートが build 時に呼び出すため、build 全体が fail する。

build-time の env 呼び出し経路（main で grep 済み）:
- `apps/web/app/robots.ts`
- `apps/web/app/sitemap.ts`
- `apps/web/src/lib/seo/site-metadata.ts`
- `apps/web/src/instrumentation.ts`

このうち `getPublicEnv()` を build 時に呼ぶのは `site-metadata.ts` / `robots.ts` / `sitemap.ts`。`instrumentation.ts` は `getEnv()` を runtime で呼ぶ経路だが、Sentry SDK の初期化が build 時にも triggered される可能性は §11 リスクで言及する。

## 3. 解決方針

### 採用案: workflow build step に build-time placeholder env を `env:` で注入する

`.github/workflows/web-cd.yml` の `Build web app (OpenNext Workers bundle)` step に `env:` ブロックを追加し、`apps/web/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` と同一値を build-time env として渡す。これにより `next build` プロセスの `process.env` に必要な値が入り、`EnvSchema.parse` が成功する。

採用理由:
- C-INV-01..03 を破らない（コード側の `getPublicEnv()` / `EnvSchema` / throw 設計は不変）。
- C-INV-05 を破らない（`apps/web/src` 配下に URL 焼き込みが入らない）。
- runtime 値の正本は引き続き `wrangler.toml`（同一 URL を流し込むだけで、build 用と runtime 用の正本は分離されたまま）。
- 影響範囲が workflow YAML に閉じ、rollback が `env:` ブロック削除のみで完結する。
- 既存 spec（task-cf-token-staging-injection-fix-001 系列）の「step-scoped env 注入」運用と整合する。

### 却下案

| 案 | 却下理由 |
|----|----------|
| (A) `site-metadata.ts` 側で `getPublicEnv()` を `try/catch` し fallback 値を返す | C-INV-03（catch 握り潰し禁止 / throw 設計維持）に違反。zod parse 失敗は本来 boundary で検知すべき設計を build-time のためだけに緩めることになる。 |
| (B) 影響ルートに `export const dynamic = 'force-dynamic'` を付与し prerender を回避 | `/_not-found` / `robots.ts` / `sitemap.ts` は static 配信が本来仕様。SEO/CDN 効率の悪化と product 仕様変更を伴うため、CI 通すためだけに採用するのは PoLP 違反。 |
| (C) `env.ts` 内で `NEXT_PHASE === 'phase-production-build'` を判定して build 時のみ default を返す | コード側に build-time 分岐ロジックが入り、`process.env` 直接参照（C-INV-02）に近い anti-pattern。zod schema の責務（runtime 検証）を曖昧にする。 |
| (D) wrangler.toml をパースして build step で env を生成する shell pipeline | toml パーサ依存と保守性低下。values は数項目で変動も稀なため YAML 直書きで十分。 |

## 4. 変更対象ファイル一覧

| パス | 変更種別 | 概要 |
|------|----------|------|
| `.github/workflows/web-cd.yml` | 編集 | `Build web app (OpenNext Workers bundle)` step（staging / production 双方）に `env:` ブロックを追加 |
| `apps/web/src/lib/__tests__/build-time-env.spec.ts` | 新規 | placeholder env で `getPublicEnv()` / `getEnv()` が成功することの unit test |

> `apps/web/src/lib/env.ts` 本体は無変更。`apps/web/src/lib/seo/site-metadata.ts` も無変更（Phase 2 の "条件付き編集" は不要と判断: 呼び出し経路は既に metadata 関数内に閉じている）。

## 5. 各ファイルへの差分方針

### 5.1 `.github/workflows/web-cd.yml`

#### 5.1.1 `deploy-staging` job の `Build web app` step（行 38-39）

`run:` の前に `env:` ブロックを追加する。値の出典は `apps/web/wrangler.toml` の `[env.staging.vars]`（行 28-37）。

注入する key と値（全て build-time placeholder。runtime 値の正本は wrangler.toml）:

| key | 値 | 出典 |
|-----|----|------|
| `ENVIRONMENT` | `staging` | wrangler.toml L29 |
| `NEXT_PUBLIC_API_BASE_URL` | `https://ubm-hyogo-api-staging.daishimanju.workers.dev` | wrangler.toml L30 |
| `PUBLIC_API_BASE_URL` | `https://ubm-hyogo-api-staging.daishimanju.workers.dev` | wrangler.toml L31 |
| `INTERNAL_API_BASE_URL` | `https://ubm-hyogo-api-staging.daishimanju.workers.dev` | wrangler.toml L32 |
| `AUTH_URL` | `https://ubm-hyogo-web-staging.daishimanju.workers.dev` | wrangler.toml L33 |
| `SENTRY_ENVIRONMENT` | `staging` | wrangler.toml L34 |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `staging` | wrangler.toml L35 |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.2` | wrangler.toml L36 |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | `0.2` | wrangler.toml L37 |

> `getPublicEnv()` の build 時 throw を解消するだけなら `ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL` の 2 key で十分。ただし `apps/web/app/sitemap.ts` / `apps/web/app/robots.ts` / `apps/web/src/instrumentation.ts` が build 時に `getEnv()` を呼ぶ可能性を排除するため、`EnvSchema` の required key（`PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` / `AUTH_URL` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE`）も同時に注入し、防御的に揃える。`SENTRY_DSN_WEB` / `NEXT_PUBLIC_SENTRY_DSN` / `AUTH_SECRET` は `optional` のため build-time 注入不要。`NEXT_PUBLIC_SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` も optional だが、wrangler.toml と整合させるため揃える。

step 直前コメントとして `# NOTE: build-time placeholder env. Runtime values are bound from apps/web/wrangler.toml [env.staging.vars] at Workers execution.` を追加し、正本が wrangler.toml であることを明示する。

#### 5.1.2 `deploy-production` job の `Build web app` step（行 86-87）

同様に `env:` ブロックを追加。値の出典は `apps/web/wrangler.toml` の `[env.production.vars]`（行 54-63）。

| key | 値 |
|-----|----|
| `ENVIRONMENT` | `production` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://ubm-hyogo-api.daishimanju.workers.dev` |
| `PUBLIC_API_BASE_URL` | `https://ubm-hyogo-api.daishimanju.workers.dev` |
| `INTERNAL_API_BASE_URL` | `https://ubm-hyogo-api.daishimanju.workers.dev` |
| `AUTH_URL` | `https://ubm-hyogo-web-production.daishimanju.workers.dev` |
| `SENTRY_ENVIRONMENT` | `production` |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `production` |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | `0.1` |

### 5.2 `apps/web/src/lib/__tests__/build-time-env.spec.ts`（新規）

> 既存の `env.spec.ts` への追記ではなく **独立ファイル新規** とする。理由: build-time env 注入の regression を局所化し、failure 時に grep で発見しやすくするため。

テスト関数シグネチャ（vitest）:

```ts
describe("build-time env injection contract", () => {
  it("getPublicEnv() succeeds with staging placeholder env", () => { ... });
  it("getPublicEnv() succeeds with production placeholder env", () => { ... });
  it("getEnv() succeeds with full EnvSchema-required keys (staging placeholder)", () => { ... });
  it("getEnv() succeeds with full EnvSchema-required keys (production placeholder)", () => { ... });
});
```

実装方針:
- `apps/web/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` と `.github/workflows/web-cd.yml` の build step `env:` を読み取り、required build-time keys が一致することを assert。
- 一致確認後の workflow env を `getPublicEnv(rawEnv)` / `getEnv(rawEnv)` に渡し、staging / production 双方の parse 成功を assert。
- `process.env` mutation はしない（test 並列性を壊さないため）。
- placeholder 値の正本は `apps/web/wrangler.toml` とし、workflow YAML 側の build-time env が drift した場合に test が fail する anchor とする。

## 6. 入出力・副作用の定義

| 観点 | 内容 |
|------|------|
| 入力 | GitHub Actions runner の env（step-scoped） |
| 出力 | `next build` プロセスの `process.env` への placeholder 値伝播 |
| 副作用 | step 内で起動する Node プロセスのみに env が伝播。後続 `Deploy to Cloudflare Workers` step には影響しない（step-scoped env のため） |
| ランタイム影響 | なし。Workers runtime は wrangler.toml の binding 値を引き続き使用 |
| ログ影響 | build log に env 値（URL）が表示される可能性。値は public URL のみで secret を含まないため OK |

## 7. テスト方針

### 7.1 unit

- 新規 `apps/web/src/lib/__tests__/build-time-env.spec.ts` を vitest で実行。
- 既存 `apps/web/src/lib/__tests__/env.spec.ts` への regression がないこと。

### 7.2 lint / typecheck

- `pnpm typecheck` / `pnpm lint` が pass。
- workflow YAML lint（actionlint が CI gate にあれば pass）。

### 7.3 受け入れ（AC-01 / AC-03 / AC-04 / AC-05）

- ローカルで env 注入した状態で `pnpm --filter @ubm-hyogo/web build:cloudflare` が成功。
- `dev` への push で `web-cd / deploy-staging` の `Build web app` step が success。
- `grep -RnE "process\\.env\\." apps/web/src apps/web/app` の結果が本 task で増えていない（C-INV-02 維持）。
- `grep -RnE "127\\.0\\.0\\.1:8888" apps/web/src apps/web/app` が空（C-INV-05 維持）。

## 8. ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/lib/__tests__/build-time-env.spec.ts

# build-time env 注入の手元再現（1Password 不要・wrangler.toml staging vars と同等の placeholder）
ENVIRONMENT=staging \
NEXT_PUBLIC_API_BASE_URL=https://ubm-hyogo-api-staging.daishimanju.workers.dev \
PUBLIC_API_BASE_URL=https://ubm-hyogo-api-staging.daishimanju.workers.dev \
INTERNAL_API_BASE_URL=https://ubm-hyogo-api-staging.daishimanju.workers.dev \
AUTH_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
SENTRY_ENVIRONMENT=staging \
NEXT_PUBLIC_SENTRY_ENVIRONMENT=staging \
SENTRY_TRACES_SAMPLE_RATE=0.2 \
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.2 \
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

> 注: 上記 placeholder 値は **build を通すための値** であり、ローカル動作時のランタイム挙動を検証するものではない（ローカル dev では `wrangler dev` 経由で wrangler.toml が runtime に効く）。

## 9. DoD

- [ ] `next build`（`build:cloudflare`）が §8 のローカル env 注入コマンドで成功する。
- [ ] `pnpm typecheck` / `pnpm lint` / 新規 unit test がローカルで pass。
- [ ] `apps/web/src` 配下に新規 `process.env.` 直書きが入っていない（grep で確認）。
- [ ] `apps/web/src` 配下に `127.0.0.1:8888` 焼き込みが入っていない（grep で確認）。
- [ ] `dev` push で `web-cd / deploy-staging` の `Build web app (OpenNext Workers bundle)` step が success（AC-01）。
- [ ] `web-cd / deploy-staging` の `Deploy to Cloudflare Workers` step は task-02 完了後に成功すれば良い（本 task の DoD は build step success まで）。

## 10. ロールバック手順

1. `.github/workflows/web-cd.yml` の `Build web app (OpenNext Workers bundle)` step に追加した `env:` ブロックを削除（staging / production 双方）。
2. `git revert` または該当 commit を差し戻す PR を作成。
3. 新規 unit test ファイル `apps/web/src/lib/__tests__/build-time-env.spec.ts` も同時に削除（残しても害は無いが、整合性のため）。

## 11. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| placeholder URL が誤って "build 時のための fallback" として runtime にも適用される誤解 | step 直前コメントで「正本は wrangler.toml」と明記。spec.md §5.1.1 で値出典を wrangler.toml の行番号付きで明示。 |
| Sentry instrumentation (`apps/web/src/instrumentation.ts`) が build 時にさらなる env（例: `SENTRY_DSN_WEB`）を要求 | `SENTRY_DSN_WEB` / `NEXT_PUBLIC_SENTRY_DSN` は `EnvSchema` で `optional` のため build-time throw しない。万一 instrumentation の SDK 初期化で additional throw が出た場合は §3 採用案の延長で workflow env に追加（コード側は無変更）。 |
| wrangler.toml と workflow YAML の drift | 新規 unit test が `wrangler.toml` と workflow YAML を読み取り、required build-time keys の一致を検証するため、片側変更時に test が fail する anchor になる。長期的には `pnpm sync:check` の延長で drift detector を追加する案を別 issue へ。 |
| build log に URL が露出 | URL は全て public Workers endpoint で secret 性なし。`scripts/redaction-check.sh` の対象は Cloudflare account ID 等であり影響しない。 |
| `EnvSchema` が将来 required key を追加した場合 build が再 fail | 新規 unit test が `EnvSchema-required keys` を明示 assert しているため、schema 変更時に test 側で先に検知できる。 |

## 12. 並列性

- task-02-cf-api-token-d1-permission-restore と独立リソース。並列実行可能。
- task-02 が完了するまで `Deploy to Cloudflare Workers` step は失敗するが、本 task の DoD は build step success までであり影響しない。
