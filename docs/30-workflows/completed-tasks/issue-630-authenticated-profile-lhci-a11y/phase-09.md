# Phase 9 — 実装手順

## ステップ 1: storageState 生成 script

```bash
mkdir -p apps/web/scripts/__tests__ apps/web/lhci
```

`apps/web/scripts/lhci-auth-storage.ts` を Phase 4 のコード通りに作成。

## ステップ 2: unit test

`apps/web/scripts/__tests__/lhci-auth-storage.spec.ts` を Phase 5 のコード通りに作成。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- scripts/__tests__/lhci-auth-storage.spec.ts
```

期待: 2 テストが pass。

## ステップ 3: `.gitignore` 更新

末尾に以下を追加。

```
apps/web/.lhci/
apps/web/.lighthouseci/
apps/web/.lighthouseci-authenticated/
```

## ステップ 4: puppeteer pre-script

`apps/web/lhci/lhci-auth.cjs` を Phase 4 のコード通りに作成。

## ステップ 5: mock API

`apps/web/scripts/lhci-profile-mock-api.ts` を作成し、`GET /health` / `/me` / `/me/profile` / `/me/attendance` を test session JWT 検証付きで返す。

## ステップ 6: authenticated LHCI config

リポジトリルートに `lighthouserc.authenticated.json` を Phase 4 の内容で作成。

## ステップ 7: 既存 LHCI config から `/profile` 除外

`lighthouserc.json` の `ci.collect.url` から `"http://localhost:3000/profile"` を削除。

## ステップ 8: package.json script

`tsx` が未登録のため、先に devDependency を追加する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web add -D tsx
```

`apps/web/package.json` の `scripts` に以下を追加。

```json
"lhci:auth-storage": "tsx scripts/lhci-auth-storage.ts",
"lhci:profile-mock-api": "tsx scripts/lhci-profile-mock-api.ts"
```

## ステップ 9: ローカル smoke

```bash
export AUTH_SECRET=test-secret-32-bytes-padding-xxx
export INTERNAL_API_BASE_URL=http://127.0.0.1:8787
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web start &
SERVER_PID=$!
sleep 8
mise exec -- pnpm --filter @ubm-hyogo/web lhci:auth-storage
mise exec -- pnpm --filter @ubm-hyogo/web lhci:profile-mock-api &
MOCK_API_PID=$!
curl -fsS http://127.0.0.1:8787/health
mise exec -- pnpm --filter @ubm-hyogo/web exec lhci autorun --config=../../lighthouserc.authenticated.json
kill $MOCK_API_PID
kill $SERVER_PID
unset AUTH_SECRET INTERNAL_API_BASE_URL
```

期待: `categories:accessibility` >= 0.90 で exit 0。`apps/web/.lighthouseci-authenticated/` に report が生成される。

## ステップ 10: workflow 更新

`.github/workflows/lighthouse.yml` に Phase 7 の YAML を追加。

## ステップ 11: SSOT 更新

- `docs/00-getting-started-manual/specs/02-auth.md` に「LHCI test session JWT」セクションを追記
  （目的・cookie name・TTL・secret 注入方法）。
- `docs/30-workflows/e2e-quality-uplift/backlog.md` の EXT-X1 行を `closed-by-issue #630 / implemented-local-runtime-pending successor` に更新。

## ステップ 12: 型・lint 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: 全 pass。

## ステップ 13: GitHub Secrets 投入（Phase 13 と連動）

PR push 前に repository secret `AUTH_SECRET` を 1Password 経由で投入する。値は既存 Cloudflare 用と同一でよい（test 限定なので別値でも可）。投入は ` gh secret set AUTH_SECRET --body "$(op read 'op://Employee/ubm-hyogo-env/AUTH_SECRET')"`。
