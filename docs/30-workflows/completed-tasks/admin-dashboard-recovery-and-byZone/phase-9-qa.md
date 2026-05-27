# Phase 9 — QA

[実装区分: 実装仕様書]

## 9.1 ローカル QA コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/shared test
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```

`verify-pr-ready.sh` は docs-only gate / `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift を一括検証する。失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の §1〜§5 を参照。

## 9.2 staging 検証 (deploy 後)

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# AC-B1
curl -s -o /tmp/dash.html -w "%{http_code}\n" \
  -H "cookie: $ADMIN_COOKIE" \
  "$WEB_BASE/admin"
# 期待: 200 / 本文に "admin api /admin/dashboard failed: 404" を含まない

# AC-B2 / T-B-08
curl -s -H "cookie: $ADMIN_COOKIE" \
  "$API_BASE/admin/dashboard" \
  | tee /tmp/dash.json \
  | jq '.byZone | length, [.byZone[].key]'
# 期待: 3 / ["0to1","1to10","10to100"]

# AC-B4 / T-B-07
STAGING_ADMIN_COOKIE="$ADMIN_COOKIE" \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  tests/e2e/admin-dashboard-staging.spec.ts
```

## 9.3 CI gate

下記 required check が全て green であること:

- `verify-design-tokens / verify-design-tokens`
- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (chromium, 4 screens)` (本 task では baseline 変更を伴わない)
- `verify-indexes-up-to-date`
- `verify-gate-metadata`
- `verify-phase12-compliance`
- `verify-test-suffix`

## 9.4 検証順序 (推奨)

1. `pnpm verify:vitest-runtime` (Phase 5 前)
2. unit test 群 (shared → api → web の順)
3. typecheck / lint
4. build
5. `scripts/verify-pr-ready.sh`
6. staging deploy
7. staging curl / playwright smoke
8. CI push 後の required check 確認
