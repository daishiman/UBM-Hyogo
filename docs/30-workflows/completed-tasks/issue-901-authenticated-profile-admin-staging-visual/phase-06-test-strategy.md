---
phase: 6
title: Test Strategy
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 6 — Test Strategy

[実装区分: 実装仕様書]

## 1. テストレイヤと責務

| Layer | 対象 | フレームワーク | 配置 |
|---|---|---|---|
| Unit | mint CLI (`mint-staging-storage-state.ts`) | vitest | `apps/web/playwright/scripts/__tests__/mint-staging-storage-state.spec.ts` |
| Setup | storageState 生成・構造 assert | Playwright setup project | `apps/web/playwright/tests/visual-staging-authenticated/setup.staging-auth.ts` |
| Visual E2E | 認証後 profile / admin baseline | Playwright `staging-visual-authenticated` project | `*-authenticated.spec.ts` |
| Gate (grep) | cookie 値 / token 値混入検査 | bash grep | CI step |
| Gate (typecheck/lint) | 型 / lint | pnpm | CI step |

## 2. Unit test ケース

| Case ID | 検証内容 | 期待 |
|---|---|---|
| U-01 | role=member / 必須 env 揃い → cookie 1 件・`name='authjs.session-token'`・`expires=iat+600`・`secure=true`・`httpOnly=true`・`sameSite='Lax'` | pass |
| U-02 | role=admin → claim の `isAdmin=true` | pass（`verifySessionJwt` で復号して assert） |
| U-03 | role=member → claim の `isAdmin=false` | pass |
| U-04 | `STAGING_AUTH_SECRET` 不在 → exit 1 + stderr に env 名のみ・値 0 hit | pass |
| U-05 | invalid email → ZodError throw | pass |
| U-06 | `--ttl-sec=300` → `expires=iat+300` | pass |
| U-07 | `--dry-run` → ファイル書き出しなし・summary のみ | pass |
| U-08 | summary に cookie 値 / token 値が含まれない（return 値の文字列化を grep） | pass |
| U-09 | out file の mode = 0o600 | pass（fs.stat） |
| U-10 | domain が URL scheme を含む場合 → ZodError | pass |

## 3. Visual E2E ケース

| Case ID | spec | 検証 | 期待 |
|---|---|---|---|
| V-01 | profile-authenticated | URL が `/profile` のまま（guard redirect されない） | pass |
| V-02 | profile-authenticated | `profile-authenticated-root` testid 要素が可視 | pass |
| V-03 | profile-authenticated | screenshot diff ≤ 5% | pass |
| V-04 | admin-dashboard-authenticated | URL が `/admin` のまま | pass |
| V-05 | admin-dashboard-authenticated | `admin-dashboard-root` testid 要素が可視 | pass |
| V-06 | admin-dashboard-authenticated | screenshot diff ≤ 5% | pass |

## 4. Grep gate ケース

| Case ID | 対象 | 検出 pattern | 期待 |
|---|---|---|---|
| G-01 | `apps/web/playwright/.auth/` 以外の全コミット対象 | `authjs.session-token=` 値文字列 | 0 hit |
| G-02 | `outputs/phase-11/` 配下全ファイル | JWT 形式 (`eyJ`) | 0 hit |
| G-03 | git tracked files 全体 | `STAGING_AUTH_SECRET=` の value 露出 | 0 hit（env 名のみ可） |
| G-04 | spec / docs / config | `127.0.0.1` の `apps/web/src/` 配下焼き込み | 0 hit（Playwright 配下は除外） |

## 5. CI matrix

| job | runner | trigger | 必須 status check 候補 |
|---|---|---|---|
| unit (mint CLI) | ubuntu-latest | PR | `web-unit / mint-staging-storage-state` |
| visual authenticated | ubuntu-latest | workflow_dispatch + PR (path filter) | `playwright-staging-visual-authenticated / authenticated (chromium)` |
| grep gate | ubuntu-latest | PR | `verify-no-auth-secret-leak / grep` |

## 6. Flake 対策

- `await page.waitForLoadState('networkidle')` を `goto` の `waitUntil` で代替
- testid 要素の `toBeVisible({ timeout: 10_000 })` で SSR 完了待ち
- `animations: 'disabled'` / `caret: 'hide'` / `maxDiffPixelRatio: 0.05` で差分許容
- データ揺れ領域（KPI 数値 / 最新日付）は spec 内で `mask: [page.getByTestId('kpi-volatile')]` で除外
- JWT TTL=600s + CI step タイムアウト ≤ 8min で expire を回避

## 7. ロールバック試験

| 観点 | 手順 |
|---|---|
| spec 削除耐性 | 本タスクで追加する 2 spec / config 差分を revert → 既存 `staging-visual` 4 spec の CI が green を維持 |
| baseline 削除耐性 | 認証後 baseline PNG を物理削除 → CI が `--update-snapshots` 無しで fail（期待 fail） |
| storageState 不在耐性 | setup project skip → authenticated project が `ENOENT` で fail（明示 fail） |

## 8. 参照

- 親 phase-06: `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-06-test-strategy.md`
- runtime smoke 既存テスト規約: `apps/api/__tests__/...`（参考）
