---
phase: 2
title: アーキテクチャ — staging-visual project / route-mock / deploy フロー
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 2 — 設計

[実装区分: 実装仕様書]

## 1. 全体トポロジ

```
[1] cf.sh deploy --env staging
        │  (next build --webpack → OpenNext bundle → Workers)
        ▼
[2] ubm-hyogo-web-staging.daishimanju.workers.dev  ← production-equivalent runtime
        │  HTML/CSS/JS は OpenNext bundle 由来（design system 検証対象）
        │  SSR データは実 staging API（page.route で差し替え不可）
        ▼
[3] Playwright project=staging-visual  (baseURL = PLAYWRIGHT_STAGING_BASE_URL)
        │  page.route() でクライアントサイド動的 fetch を安定化
        │  animation/transition/caret-color を disable
        ▼
[4] toHaveScreenshot('{screen}.png')  → {screen}-staging-chromium-linux.png
        ▼
[5] outputs/phase-11/screenshots/{screen}.png に複製配置
        ▼
[6] parent root workflow: VISUAL_RUNTIME_PENDING → VISUAL_RUNTIME_OK / Gate-B,C passed
```

## 2. 既存コードとの接続点（最小変更原則）

| 既存要素 | 現状 | 本タスクでの扱い |
|---------|------|----------------|
| `playwright.config.ts` `staging` project (L209-216) | `baseURL = PLAYWRIGHT_STAGING_BASE_URL ?? PLAYWRIGHT_BASE_URL`、testMatch 指定なし（全 spec 対象になりうる） | これを土台に **`staging-visual` project** を新設（testDir を staging 用 visual spec に限定） |
| `visual-chromium` project (L168-171) | `testMatch: /visual\/.*\.spec\.ts$/`、local webServer 起動 | **変更しない**（local baseline 維持） |
| `shouldStartLocalServer` (L74) | `!isStagingSmoke && PLAYWRIGHT_SKIP_WEB_SERVER !== '1'` | staging-visual 実行時は **local webServer を起動しない**フラグ分岐を追加（`isStagingVisual`） |
| `mockApi` fixture (`fixtures/auth.ts`) | `MOCK_API_PORT=8787` のローカル HTTP サーバー（SSR 経路） | staging では使わない。staging-visual spec は **fixture を import せず** `page.route()` のみ使用 |

## 3. staging-visual project の設計

```
project: staging-visual
  testDir:   ./playwright/tests/visual-staging
  testMatch: /visual-staging\/.*\.spec\.ts$/
  baseURL:   process.env.PLAYWRIGHT_STAGING_BASE_URL
  use:       Desktop Chrome, viewport 1280x800（local visual と同一）
  retries:   2（staging runtime のネットワーク揺れ対策）
```

- `webServer` は staging-visual 実行時に**起動しない**（`shouldStartLocalServer` 分岐に `isStagingVisual` を追加）。
- snapshot 命名は project 名が `staging-visual` のため `{screen}-staging-visual-chromium-linux.png` となる。local の `{screen}-visual-chromium-linux.png` と衝突しない。

## 4. staging visual spec の設計（4 screens）

| screen | route | 認証 | データ依存 | route-mock 方針 |
|--------|-------|------|----------|----------------|
| public-top | `/` | 不要 | 一部（preview/stats） | client fetch を `page.route('**/api/**')` で安定 stub。SSR shell は staging 実値 |
| login | `/login` | 不要 | なし（静的 chrome） | mock 不要。design system 検証に最適（最も安定） |
| profile | `/profile` | 要（session cookie） | 高 | staging では未認証だと redirect。**認証 chrome（未ログイン状態）の描画**を対象とし、認証必須データは検証対象外と明記 |
| admin-dashboard | `/admin` | 要（admin session） | 高 | profile と同様、未認証時の redirect/guard 描画を対象。design system shell の検証に限定 |

> **重要設計判断（SSR データ制約）**: profile / admin は本来 session が要る。staging で session を張るのは secrets / 認証フローを伴い複雑（issue「含まない: 新規 fixture/seed」と衝突）。本タスクでは **未認証時に表示される login redirect / guard 画面の design system 描画**を production-equivalent evidence とする。これは「OpenNext bundle が token/rhythm/primitives を正しく描画するか」という真の目的（index.md §0.3）を満たす。認証後画面の runtime 検証は §Phase 9 でフォロー候補として記録。

## 5. deploy フロー（FR-01）

```bash
# 1. build 健全性を local で先に確認
mise exec -- pnpm --filter @ubm-hyogo/web build      # next build --webpack
# 2. staging deploy（op 経由で secrets 動的注入）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
# 3. deploy 後の URL を取得（wrangler 出力 / wrangler.toml の routes）
#    target: ubm-hyogo-web-staging.daishimanju.workers.dev
```

- deploy は `scripts/cf.sh` 経由のみ（`wrangler` 直接実行禁止 / CLAUDE.md）。
- staging URL は `PLAYWRIGHT_STAGING_BASE_URL` env で Playwright に渡す。

## 6. 責務境界（状態所有権）

| レイヤ | 責務 | 所有する状態 |
|--------|------|------------|
| `cf.sh` / wrangler | staging へ bundle を配備 | deploy version |
| Workers runtime | OpenNext bundle を実行し HTML を返す | SSR 描画（design system 由来 + staging データ） |
| Playwright `staging-visual` | staging URL を開き screenshot 取得 | baseline PNG |
| `page.route()` | client-side 動的 fetch の安定化 | stub レスポンス（client 経路のみ） |
| `outputs/phase-11/` | evidence 物理配置 | inventory ledger |
| parent `artifacts.json` | gate 状態 | VISUAL_RUNTIME / Gate-B,C |

`mockApi` fixture（local SSR 経路）と `page.route()`（staging client 経路）の責務を混在させない。

## 7. 因果ループ

- 強化ループ: staging visual baseline をコミット → 後続 PR で staging 描画 drift を検出 → design system regression を早期発見 → bundle 健全性が維持される。
- バランスループ: SSR データ揺れ → 過剰な diff fail → `maxDiffPixelRatio` 緩和 + データ非依存画面（login）優先 → flake を抑制。

## 8. 既存コンポーネント再利用可否（FB-SDK-07-1）

- visual spec の共通パターン（`addStyleTag` で animation disable / `toHaveScreenshot` / `maxDiffPixelRatio`）は既存 `public-top.spec.ts` を再利用。
- 認証 chrome のレンダリングは既存 `apps/web/src/app/login` / middleware redirect をそのまま利用（新規 UI 実装ゼロ）。
- 新規 primitive / コンポーネントは作らない（parent 不変条件 #3）。

## 9. 参照

- `apps/web/playwright.config.ts`（L4 `isStagingSmoke` / L74 `shouldStartLocalServer` / L168 `visual-chromium` / L209 `staging`）
- `apps/web/playwright/tests/visual/public-top.spec.ts`
- `apps/web/wrangler.toml`（`[env.staging]`）
- `scripts/cf.sh`
- `docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json`
