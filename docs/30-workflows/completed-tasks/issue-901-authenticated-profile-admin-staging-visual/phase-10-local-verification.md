---
phase: 10
title: Local Verification
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 10 — Local Verification

[実装区分: 実装仕様書]

## 1. 事前確認（read-only / Gate-A 前でも可）

```bash
# CI secrets が GitHub 側に登録済か
gh secret list --repo daishiman/UBM-Hyogo | grep -E 'STAGING_AUTH_SECRET|STAGING_ADMIN_|STAGING_ME_'

# staging Worker の AUTH_SECRET 存在確認（値は表示されない）
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging | grep AUTH_SECRET
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep AUTH_SECRET
```

## 2. staging seed の事前確認（read-only）

```bash
# admin / member アカウントが seed に存在し条件を満たすか
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command \
  "SELECT count(*) FROM admin_users WHERE active=1;"
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command \
  "SELECT count(*) FROM members WHERE response_email IS NOT NULL AND rules_consent='consented' AND is_deleted=0;"
```

## 3. cookie name 一次根拠取得（read-only）

```bash
# staging Worker の Set-Cookie を tail し、authjs.session-token / __Secure-authjs.session-token を確定
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging --format=pretty &
# 別ターミナルで:
#   1) staging login 画面に手動アクセス → Magic Link or Google でログイン
#   2) Set-Cookie ヘッダの実際の name prefix を確認
```

## 4. local 実行手順（実装サイクル時）

```bash
# (a) 依存
mise exec -- pnpm install --force

# (b) typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# (c) mint CLI unit test
mise exec -- pnpm --filter @ubm-hyogo/web test -- playwright/scripts/__tests__/mint-staging-storage-state.spec.ts

# (d) storageState 生成（1Password 経由・実値はメモリ上のみ）
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec tsx playwright/scripts/mint-staging-storage-state.ts --role=member --out=playwright/.auth/member.storageState.json
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec tsx playwright/scripts/mint-staging-storage-state.ts --role=admin --out=playwright/.auth/admin.storageState.json

# (e) Playwright authenticated baseline 取得
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --update-snapshots

# (f) baseline を evidence に copy
mkdir -p docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/screenshots
cp apps/web/playwright/tests/visual-staging-authenticated/profile-authenticated.spec.ts-snapshots/*-authenticated-staging-visual-chromium-linux.png \
   docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/screenshots/profile-authenticated.png
cp apps/web/playwright/tests/visual-staging-authenticated/admin-dashboard-authenticated.spec.ts-snapshots/*-authenticated-staging-visual-chromium-linux.png \
   docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/screenshots/admin-dashboard-authenticated.png

# (g) 後始末（必ず実行）
rm -rf apps/web/playwright/.auth

# (h) PR pre-flight
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm indexes:rebuild   # diff 0 期待
bash scripts/verify-pr-ready.sh
bash scripts/lib/grep-no-auth-leak.sh  # Phase 7 §3 新設
```

## 5. CI 経路（実装サイクル時）

`workflow_dispatch` で `.github/workflows/playwright-staging-visual-authenticated.yml` を手動 trigger → artifact (HTML report + diff PNG) を確認 → baseline 差分があれば `--update-snapshots` 付きの自動 commit step で baseline 再生成 → 空コミットで required check 再トリガー（既知 GITHUB_TOKEN 非発火対応）。

## 6. 検証完了判定

| 観点 | 期待 |
|---|---|
| step (d) | storageState 2 ファイルが mode 0600 で生成・JSON parse 可能・cookie 1 件含む |
| step (e) | 2 spec とも pass（visibility assert + screenshot capture） |
| step (f) | PNG 2 件が evidence path に物理存在・サイズ > 10KB |
| step (h) | 全 gate exit 0、grep 0 hit |
| step (g) | `apps/web/playwright/.auth` ディレクトリ不在 |
