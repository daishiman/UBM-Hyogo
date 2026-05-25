---
phase: 4
title: 入出力・データ契約 — env 契約 / staging baseURL / snapshot 命名 / wait 条件
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 4 — staging-visual test の入出力契約

[実装区分: 実装仕様書]

## 1. env 入力契約

| env | 値 | 用途 | 出典 |
|-----|-----|------|------|
| `PLAYWRIGHT_STAGING_BASE_URL` | `https://ubm-hyogo-web-staging.daishimanju.workers.dev` | `staging-visual` project の baseURL override | 既存 `staging` project が参照する env を再利用。未指定時は config の staging URL default を使う |
| `PLAYWRIGHT_SKIP_WEB_SERVER` | `1`（staging 実行時） | local webServer 起動を抑止 | `shouldStartLocalServer` (L74) 分岐 |
| `CI` | `true`（CI 実行時） | retries / reporter 切替 | 既存 config 継承 |

> staging 実行では `mockApi` fixture（`MOCK_API_PORT=8787` ローカル HTTP サーバー）を **起動しない / import しない**。`INTERNAL_API_BASE_URL` の差し替えも行わない（SSR は実 staging API に向かう）。

## 2. staging-visual project 契約

| 項目 | 値 | 備考 |
|------|-----|------|
| project name | `staging-visual` | kebab-case（既存命名規則踏襲） |
| testDir | `./playwright/tests/visual-staging` | local `visual/` と物理分離 |
| testMatch | `/visual-staging\/.*\.spec\.ts$/` | local `visual-chromium`（`/visual\/.*/`）と非衝突 |
| baseURL | `PLAYWRIGHT_STAGING_BASE_URL` → `PLAYWRIGHT_BASE_URL` → `https://ubm-hyogo-web-staging.daishimanju.workers.dev` | §1。CI workflow input は `PLAYWRIGHT_STAGING_BASE_URL` に渡す |
| use | `...devices['Desktop Chrome']`, viewport 1280x800 | local visual と同一描画条件 |
| retries | `2` | staging runtime のネットワーク揺れ対策 |
| webServer | 起動しない | `isStagingVisual` 分岐（Phase 5） |

## 3. 4 spec の入出力契約

### 3.1 public-top.spec.ts

| 項目 | 値 |
|------|-----|
| Route | `/` |
| 認証 | 不要（公開） |
| SSR データ | 実 staging API（preview / stats）。空状態も許容 |
| client 安定化 | `page.route('**/api/**', ...)` でクライアント動的 fetch を stub（任意・flake 時のみ） |
| wait condition | `page.locator('main h1').waitFor({ state: 'visible' })` |
| snapshot 名 | `public-top.png` |
| diff threshold | `maxDiffPixelRatio: 0.05` / `fullPage: true` |

### 3.2 login.spec.ts

| 項目 | 値 |
|------|-----|
| Route | `/login` |
| 認証 | 不要（静的 chrome） |
| SSR データ | なし（design system 検証に最適・最安定） |
| client 安定化 | 不要 |
| wait condition | `page.locator('main h1').waitFor({ state: 'visible' })` |
| snapshot 名 | `login.png` |
| diff threshold | `maxDiffPixelRatio: 0.05` / `fullPage: true` |

### 3.3 profile.spec.ts

| 項目 | 値 |
|------|-----|
| Route | `/profile` |
| 認証 | staging では未認証 → middleware redirect / guard 描画 |
| SSR データ | 未認証時の guard / redirect 先（`/login`）の design system 描画を対象 |
| 検証対象外 | 認証後の profile 実データ（§Phase 9 でフォロー候補） |
| wait condition | `page.locator('main h1').waitFor({ state: 'visible' })`（redirect 先の h1） |
| snapshot 名 | `profile.png` |
| diff threshold | `maxDiffPixelRatio: 0.05` / `fullPage: true` |

### 3.4 admin-dashboard.spec.ts

| 項目 | 値 |
|------|-----|
| Route | `/admin` |
| 認証 | staging では未認証 → guard / redirect 描画 |
| SSR データ | 未認証 guard 描画を対象（admin shell の design system 検証に限定） |
| 検証対象外 | 認証後の admin dashboard 実データ |
| wait condition | `page.locator('main h1').waitFor({ state: 'visible' })` |
| snapshot 名 | `admin-dashboard.png` |
| diff threshold | `maxDiffPixelRatio: 0.05` / `fullPage: true` |

## 4. snapshot baseline の保存契約

| 項目 | 値 |
|------|-----|
| 保存先 | `apps/web/playwright/tests/visual-staging/<spec>.spec.ts-snapshots/<name>-staging-visual-chromium-linux.png` |
| 命名規則 | project 名 `staging-visual` が snapshot 名に入るため `{screen}-staging-visual-chromium-linux.png` |
| local baseline との衝突 | なし（local は `{screen}-visual-chromium-linux.png`、別ディレクトリ） |
| 正本 | CI ubuntu-latest 生成の `-staging-visual-chromium-linux.png` |
| macOS 生成 baseline | コミットしない（`-darwin.png` は CI を正本として上書き運用） |
| 更新 trigger | `--update-snapshots` 明示時のみ |

## 5. SSR データ制約の明示（index.md §0.3 再掲）

| 経路 | Playwright 差し替え可否 | 本仕様の扱い |
|------|----------------------|------------|
| Worker サーバーサイド fetch（SSR） | ❌ 不可（`page.route()` はブラウザ fetch のみ intercept） | 実 staging API レスポンスを許容。検証対象は design system 描画 |
| ブラウザ client-side fetch | ✅ 可（`page.route('**/api/**')`） | flake 時のみ stub。SSR shell は実値 |

検証対象は **OpenNext Workers bundle が token / rhythm / primitives を local と等価に描画するか**であり、API データ内容の一致ではない。

## 6. 出力（test 失敗時の artifact）

| artifact | 配置 |
|---------|------|
| test-results | `apps/web/playwright/evidence/test-results/`（既存） |
| playwright-report | `apps/web/playwright/evidence/playwright-report/html/`（既存） |
| screenshot diff | test-results 配下の `<test>-diff.png` |
| evidence ledger | `outputs/phase-11/screenshots/*.png`（成功 baseline を Phase 11 へ複製） |

## 7. 不変条件

- spec は API 直叩きを行わない（`page.goto` 経由のみ）
- spec は D1 を呼ばない
- spec は新規 endpoint を期待しない
- snapshot 名は spec 内に literal で記述（動的生成禁止）
- `mockApi` fixture を import しない（staging では SSR 経路に介入しない）
