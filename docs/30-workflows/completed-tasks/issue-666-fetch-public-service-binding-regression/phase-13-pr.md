# Phase 13: PR

[実装区分: 実装仕様書]

> Phase: 13 / 13

---

## PR 作成方針

CLAUDE.md「PR 作成の完全自律フロー」に従う。base ブランチは `dev`(本タスクは production リリースではない)。

## ブランチ名

`feat/issue-666-fetch-public-service-binding-regression`

ローカルから派生する場合の起点は `dev` の最新コミット。

## PR タイトル

```
feat(web): fetch/public.ts service binding 環境ガード追加 + regression test (issue-666)
```

## PR 本文テンプレート

```markdown
## Summary

- `apps/web/src/lib/fetch/public.ts` に `isTestOrPlaywright()` 環境ガードを追加し、production / staging Cloudflare Workers runtime で `PUBLIC_API_BASE_URL` の有無に関わらず service binding を最優先する
- `apps/web/src/lib/fetch/public.spec.ts` に AC-R-01..R-05 regression test を追加(production / CI / staging / local dev / Playwright の 5 ケース)
- 3b で導入した HTTP fallback 優先化(`task-e2e-stage3b-e2e-tests-hard-gate-001`)が production に侵食する regression を防止

Refs #666

## Why

3b 実装で `PUBLIC_API_BASE_URL` 明示時に service binding を skip するロジックを追加した。Playwright E2E の mock 差し替えには必要だが、production wrangler.toml に同 env が誤設定された瞬間に:

1. 同一 account workers.dev loopback 404 が再発し公開ディレクトリが degrade
2. CLAUDE.md 不変条件 #5(D1 直接アクセスは `apps/api` に閉じる)が deploy 時 env 設定に暗黙依存

の production-impact regression が発生する。本 PR はこのリスクを `isTestOrPlaywright()` で隔離する。`CI=true` 単独では HTTP fallback を許可しないため、GitHub Actions build/deploy でも service binding 優先を維持する。

## What changed

| ファイル | 変更内容 |
|----------|---------|
| `apps/web/src/lib/fetch/public.ts` | `isTestOrPlaywright()` 追加 / `getServiceBinding()` の早期 return を Vitest/Playwright 環境ガード化 / ファイル冒頭コメント更新 |
| `apps/web/src/lib/fetch/public.spec.ts` | AC-R-02 / AC-R-03 / edge-1 / edge-2 / edge-3 の 5 ケース追加 |
| `docs/30-workflows/issue-666-fetch-public-service-binding-regression/` | Phase 1-13 仕様書群 |

## AC 充足

- [ ] AC-R-01: 環境ガードロジック実装(`isTestOrPlaywright()` 2 種 OR 判定)
- [ ] AC-R-02: production context regression test green
- [ ] AC-R-03: `CI=true` 単独では service binding 優先 test green
- [ ] AC-R-04: `e2e-tests-coverage-gate` が PR で green
- [ ] AC-R-05: `getEnv()` zod schema 不変、新規 test/Playwright 判定キーの `process.env.*` 直参照は `isTestOrPlaywright()` ヘルパ 1 箇所に閉じる

## Test plan

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.spec.ts` green
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] 逆 assertion 妥当性確認(AC-R-02 を一時的逆書き → fail 観測 → 元に戻す)
- [ ] CI 上で `e2e-tests-coverage-gate` job green
- [ ] CI 上で `ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` green

## Evidence

`docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/` に以下を保存:

- `typecheck.txt`
- `lint.txt`
- `unit-test.txt`
- `build.txt`
- `inverse-assertion-fail.txt`
- `grep-process-env.txt`
- `wrangler-env-grep.txt`(任意)

## Hand-off

- `wrangler.toml` の `[env.production.vars]` / `[env.staging.vars]` に `CI` / `NODE_ENV=test` / `PLAYWRIGHT_TEST` が混入していないことを検出する grep gate は `task-18` regression smoke 系列で対応(本 PR では assumption 扱い、phase-9.6 で 0 件確認済み)。

## Invariants(re-confirmed)

- D1 直接アクセス禁止 ✅
- `apps/web` env 不変条件: 新規 test/Playwright 判定キーの `process.env.*` 直参照は `isTestOrPlaywright()` 1 箇所のみ。既存 `PUBLIC_API_BASE_URL` 読み取りは `getBaseUrl` / `getServiceBinding` 内に維持。`CI` は transport 判定に使わない ✅
- `apps/api` endpoint surface 不変 ✅
- `wrangler` 直叩きなし ✅
- `*.spec.ts` 命名遵守 ✅
- PR base = `dev` ✅
```

## 作成コマンド

```bash
gh pr create --base dev --title "feat(web): fetch/public.ts service binding 環境ガード追加 + regression test (issue-666)" --body "$(cat <<'EOF'
...(上記 PR 本文)...
EOF
)"
```

## 完了条件(Phase 13)

1. PR が `--base dev` で作成されている
2. PR 本文に AC 充足 / Test plan / Evidence が記載されている
3. CI gate(`ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`) が green
4. Issue #666 が `Refs #666` で関連付けられている

## 注意

CLAUDE.md「PR 作成の完全自律フロー」記載の通り、本タスクの PR 作成・push 実行は **ユーザー明示指示後** に行うこと。本仕様書群そのものは PR 作成までを含まない(仕様書作成 = Phase 1-13 markdown 整備が完了条件)。
