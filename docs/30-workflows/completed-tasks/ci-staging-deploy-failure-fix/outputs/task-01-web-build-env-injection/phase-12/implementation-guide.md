# task-01-web-build-env-injection — Phase 12 実装ガイド

> runtime evidence: parent workflow `outputs/phase-11/local-verification-summary.md` に集約。CI runtime evidence は Phase 13 user gate 後。

## 1. このタスクで何をするか（中学生にもわかる説明）

ウェブサイトを Cloudflare に公開するとき、Next.js は「下準備（build）」と「実際にお客さんが来たときの応答（runtime）」の 2 段階に分かれている。

このプロジェクトには `wrangler.toml` という設定ファイルがあって、そこに「サイトの環境変数（`ENVIRONMENT` や `NEXT_PUBLIC_API_BASE_URL` など）」が書いてある。でもこれは **runtime 用** の設定で、build 中の Node.js プロセスはこれを読まない。

一方、`apps/web/src/lib/env.ts` には「環境変数が無いとエラーを投げる」という厳しいチェックがある（zod という検証ライブラリ）。これは正しい設計だが、build 中に `/_not-found` ページの中身を組み立てる過程で `getPublicEnv()` が呼ばれて「環境変数が無いよ」と怒り、build 全体が止まっていた。

このタスクでやることは「GitHub Actions の build 手順に `env:` ブロックを足して、`wrangler.toml` と同じ値を build 用に渡してあげる」というだけ。コード側は一切変えない。

## 2. なぜこれが必要か

- `dev` ブランチに push しても staging 環境にデプロイできない状態が続いている（CI が build で止まる）。
- コード側で握り潰す（catch して default 値を返す）と、本来 zod が守ってくれている「envが壊れていたら早期に死ぬ」設計が崩れる（不変条件 C-INV-03 違反）。
- そのため「build 用の env を CI 側から渡す」のが最も安全。

## 3. 変更する場所と理由

| ファイル | 変更内容 | 理由 |
|----------|----------|------|
| `.github/workflows/web-cd.yml` | `Build web app (OpenNext Workers bundle)` step に `env:` ブロックを足す（staging / production 双方） | build プロセスの `process.env` に `wrangler.toml` と同じ値を流し込む |
| `apps/web/src/lib/__tests__/build-time-env.spec.ts` | 実装済 | `wrangler.toml` / `web-cd.yml` / SEO origin の drift を検知し、placeholder env で `getPublicEnv()` / `getEnv()` が通ることを保証する |

`apps/web/src/lib/env.ts` は **無変更**。production origin の実体不整合を解消するため、`apps/web/src/lib/seo/site-metadata.ts` の production URL は `ubm-hyogo-web-production` に同期済み。

## 4. 実装済み内容

1. `.github/workflows/web-cd.yml` の staging / production build step に `env:` ブロックを追加済み。
2. `apps/web/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` と workflow build env を一致させた。
3. production web origin は実在する `https://ubm-hyogo-web-production.daishimanju.workers.dev` に統一済み。
4. `apps/web/src/lib/__tests__/build-time-env.spec.ts` は、workflow env と wrangler vars の一致、`AUTH_URL` と SEO `SITE_URL_MAP` の一致、staging / production の `getPublicEnv()` / `getEnv()` parse 成功を検証する。
5. ローカル検証は親 workflow の Phase 11 summary に記録済み。`dev` push 後の CI runtime evidence は Phase 13 user gate 後に取得する。

## 5. テスト方法

### unit test

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/lib/__tests__/build-time-env.spec.ts
```

4 ケースすべて pass すること:
1. staging placeholder で `getPublicEnv()` 成功
2. production placeholder で `getPublicEnv()` 成功
3. staging placeholder（required key 全部入り）で `getEnv()` 成功
4. production placeholder（required key 全部入り）で `getEnv()` 成功

### build smoke

`spec.md §8` のローカル env 注入コマンドで `pnpm --filter @ubm-hyogo/web build:cloudflare` を実行。`/_not-found` プリレンダリングを通過し、最後まで成功すること。

### CI

PR push 後、`web-cd / deploy-staging` の `Build web app (OpenNext Workers bundle)` step が success（緑）になる。`Deploy to Cloudflare Workers` step は task-02 が未完了であれば fail でも本 task の DoD には影響しない。

## 6. 検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/lib/__tests__/build-time-env.spec.ts

# grep gate（C-INV-02 / C-INV-05 維持確認）
grep -RnE "process\\.env\\." apps/web/src apps/web/app | grep -v "src/lib/env.ts" || true
grep -RnE "127\\.0\\.0\\.1:8888" apps/web/src apps/web/app || true

# build smoke（staging placeholder）
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

## 7. 失敗したらどうするか

| 症状 | 対処 |
|------|------|
| `next build` がまだ ZodError で死ぬ | 追加した env key と `EnvSchema` の required key 一覧を突き合わせる。`apps/web/src/lib/env.ts` の `optional()` が付いていない key は全て注入が必要 |
| `instrumentation.ts` 由来で Sentry SDK 初期化エラー | `SENTRY_DSN_WEB` / `NEXT_PUBLIC_SENTRY_DSN` を `optional` のまま空で渡す。SDK が空 DSN を拒否する場合は spec.md §11 リスク欄に従い `''` ではなく key 自体を渡さない（zod optional が `undefined` を許容） |
| YAML パースエラー | `env:` のインデント（step 配下なので 8 スペース、key は 10 スペース）を確認 |
| unit test の zod parse が失敗 | placeholder URL が `z.string().url()` を満たす形式（`https://...`）であることを確認 |
| `Deploy to Cloudflare Workers` step が fail | これは task-02 のスコープ。本 task の DoD には含まれない |
| ロールバックしたい | spec.md §10 の手順で `env:` ブロック削除 + unit test ファイル削除 |

## 8. Definition of Done

- [x] `.github/workflows/web-cd.yml` の `deploy-staging` / `deploy-production` 両 job の `Build web app` step に `env:` ブロックが追加されている
- [x] 追加した env 値が `apps/web/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` と一致している
- [x] production `AUTH_URL` と SEO site URL が実在する production Worker origin に統一されている
- [x] `apps/web/src/lib/__tests__/build-time-env.spec.ts` が新規作成され vitest で pass
- [x] `pnpm typecheck` / `pnpm lint` が pass（親 Phase 11 記録）
- [x] `apps/web/src` / `apps/web/app` に新規 `process.env.` 直書きが入っていない
- [x] `apps/web/src` / `apps/web/app` に `127.0.0.1:8888` が入っていない
- [x] ローカルで §6 build smoke が成功（親 Phase 11 記録）
- [ ] `dev` への push で `web-cd / deploy-staging` の `Build web app (OpenNext Workers bundle)` step が success（AC-01）

## 9. 参考リンク

- 設計書 index: `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/index.md`
- Phase 1（目的とスコープ）: `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/phase-1/phase-1.md`
- Phase 2（契約定義・不変条件）: `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/phase-2/phase-2.md`
- Phase 3（影響範囲マップ）: `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/phase-3/phase-3.md`
- 本 task の実装仕様書本体: `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/task-01-web-build-env-injection/spec.md`
- env 不変条件: `CLAUDE.md` §「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」
- 先行類似タスク: `docs/30-workflows/task-cf-token-staging-injection-fix-001/`
- env 実装本体（無変更）: `apps/web/src/lib/env.ts`
- wrangler 設定（値の出典）: `apps/web/wrangler.toml`
- workflow 本体: `.github/workflows/web-cd.yml`
