---
phase: 1
title: 要件定義 — staging runtime visual evidence と root gate 解除
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: new
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

> **前提**: parent workflow `ui-prototype-design-system-foundation` の serial-00〜serial-07（local 実装 + local visual baseline）が green に到達済みであること。local baseline は task-18-w7（PR #697）で確立済み（`apps/web/playwright/tests/visual/*.spec.ts-snapshots/*-visual-chromium-linux.png` 4 枚が物理存在）。本タスクはその **staging runtime 継続**であり、local 実装の再変更は行わない。

## 1. 解決すべき要件

local dev server（`next dev:webpack`）で取得した visual baseline は、Cloudflare Workers staging（`next build --webpack` の OpenNext bundle + Workers ランタイム）での描画と**完全一致する保証がない**。本タスクは production-equivalent runtime での visual evidence を取得し、parent root workflow の `VISUAL_RUNTIME_PENDING` を解除する。

真の検証対象は **「OpenNext Workers bundle が design system（CSS `@layer components` / OKLch token / typography rhythm / primitives）を local と等価に描画するか」**であり、API データ内容の一致ではない（index.md §0.3）。

### 1.1 機能要件

| ID | 要件 | 根拠 |
|----|------|------|
| FR-01 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` で staging に最新 build を deploy する | CLAUDE.md Cloudflare CLI 実行ルール / `apps/web/wrangler.toml` `[env.staging]` |
| FR-02 | staging URL に対する Playwright visual screenshot を **4 screens** で取得する（`/`=public-top / `/login`=login / `/profile`=profile / `/admin`=admin-dashboard） | index.md §0.2（現コード実装済み spec に整合） |
| FR-03 | staging 用 visual 取得は **baseURL=staging** の専用 Playwright project / spec で行い、local baseline（`visual-chromium` project）と混在させない | `apps/web/playwright.config.ts` L209-216 既存 `staging` project を拡張 |
| FR-04 | クライアントサイド動的 fetch は `page.route()` で安定化し、flake を抑える。SSR データは staging 実値（空状態含む）を許容する | index.md §0.3 / mockApi が SSR 経路の HTTP サーバーである制約 |
| FR-05 | 取得 screenshot を `outputs/phase-11/screenshots/` に物理配置し、inventory ledger（Phase 11 表）と整合させる | phase-11-screenshot-guide / evidence existence validator |
| FR-06 | parent root workflow `index.md` / `artifacts.json` の `VISUAL_RUNTIME_PENDING` を `VISUAL_RUNTIME_OK` へ解除し、Gate-B / Gate-C を `passed` に更新する | parent `artifacts.json` gates[] |
| FR-07 | `bash scripts/verify-pr-ready.sh` が exit 0（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift なし） | CLAUDE.md PR pre-flight |
| FR-08 | required status check 候補を Phase 13 PR draft に明記 | CLAUDE.md branch protection note |

### 1.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | staging visual の baseline は CI runner（`ubuntu-latest`）と staging Workers の HTML 描画に依存する。Playwright 実行環境は `ubuntu-latest` に固定し、`*-staging-chromium-linux.png` 系の命名で local baseline と分離する |
| NFR-02 | flake 防止: `animation` / `transition` / `caret-color` を spec 内で disable（既存 `public-top.spec.ts` パターン踏襲）。SSR データ揺れに備え `maxDiffPixelRatio` を local より緩める（§Phase 6 で 0.05 を上限候補） |
| NFR-03 | 新規 test ファイルは `*.spec.ts` のみ。`*.test.ts` 禁止（CLAUDE.md 不変条件 #8） |
| NFR-04 | 新規 API endpoint / D1 schema / Google Form 仕様変更 0 件 |
| NFR-05 | `apps/web/src/` の env 参照は `getEnv()` / `getPublicEnv()` 経由のみ。`process.env.*` 直接参照 0 件 |
| NFR-06 | `apps/web/src/` に `127.0.0.1:8888` / HEX 直書き / `bg-[#xxx]` 焼き込み 0 件（既存 regression gate と整合） |
| NFR-07 | OpenNext Workers bundle に `[project]/...` 仮想 module specifier 混入 0 件 |
| NFR-08 | staging secrets が `bash scripts/cf.sh secret put` で投入済み。`.dev.vars.example` の `op://` 参照と drift なし。実値は出力・ドキュメントに転記しない |

## 2. 最小 gate の固定

| # | Gate | local / CI 実行 |
|---|------|----------------|
| G1 | staging deploy 成功 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` |
| G2 | staging visual 4 screens 取得 | `PLAYWRIGHT_STAGING_BASE_URL=<staging-url> mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual` |
| G3 | typecheck | `mise exec -- pnpm typecheck` |
| G4 | lint | `mise exec -- pnpm lint` |
| G5 | build (`next build --webpack`) | `mise exec -- pnpm --filter @ubm-hyogo/web build` |
| G6 | verify-pr-ready | `bash scripts/verify-pr-ready.sh` |
| G7 | root VISUAL_RUNTIME_OK 解除整合 | parent `index.md` / `artifacts.json` の `VISUAL_RUNTIME_OK` + Gate-B/C `passed` |

すべて exit 0 / 解除完了を DoD とする（Phase 8 で再掲）。

## 3. 既存コード命名規則の分析（FB-01 / FB-SDK-07-4）

| 対象 | 現行命名 | 本タスクでの新規命名 |
|------|---------|------------------|
| Playwright project | `desktop-chromium` / `visual-chromium` / `staging` / `staging-smoke`（kebab-case） | `staging-visual`（kebab-case 一貫） |
| visual spec ファイル | `visual/{public-top,login,profile,admin-dashboard}.spec.ts` | staging 版は `visual-staging/{public-top,login,profile,admin-dashboard}.spec.ts` または既存 spec の baseURL 切替（Phase 2 で決定） |
| screenshot 名 | `{screen}.png` → snapshot `{screen}-visual-chromium-linux.png` | staging 版 `{screen}-staging-chromium-linux.png` |
| env | `PLAYWRIGHT_STAGING_BASE_URL`（既存 `staging` project が参照） | 同名を再利用（新規 env を増やさない） |

## 4. スコープ境界

### IN

- `apps/web/playwright.config.ts` の `staging-visual` project 追加 / 既存 `staging` project 拡張
- staging 用 visual spec（4 screens, baseURL=staging, `page.route()` 安定化）
- `apps/web/package.json` に `e2e:visual:staging` script 追加
- staging deploy（`scripts/cf.sh`）
- `outputs/phase-11/` evidence 物理配置
- parent root workflow の gate 解除（`index.md` / `artifacts.json`）
- `.github/workflows/playwright-smoke.yml` の staging visual 配線（必要時のみ・既存 workflow 拡張）
- Phase 13 PR draft / required status check 候補

### OUT

- members-list / member-detail の新規 visual spec（index.md §0.2）
- local visual baseline の取り直し（task-18-w7 確立済み）
- production deploy
- 新規 API endpoint / D1 schema / Google Form 仕様変更
- 新規 mock fixture / seed 追加
- 新規 CI workflow ファイル作成
- branch protection の `gh api -X PUT`（user 明示承認待ち）

## 5. 受け入れ条件

index.md §1 の目的を満たし、§2 の G1〜G7 が全 green / 解除完了。詳細は Phase 8 DoD で再掲。

## 6. 参照

- `docs/30-workflows/ui-prototype-design-system-foundation/{index.md,artifacts.json,SCOPE.md}`
- `docs/30-workflows/unassigned-task/UT-DSF-07-visual-runtime-production-equivalent-screenshots.md`（旧 spec）
- `apps/web/playwright.config.ts`（L209-216 `staging` project / L168-171 `visual-chromium`）
- `apps/web/playwright/tests/visual/{public-top,login,profile,admin-dashboard}.spec.ts`
- `apps/web/playwright/fixtures/auth.ts`（`mockApi` / `MOCK_API_PORT = 8787`）
- `apps/web/wrangler.toml`（`[env.staging]`）
- `scripts/cf.sh` / `scripts/verify-pr-ready.sh`
- `.github/workflows/{playwright-smoke,web-cd}.yml`
- CLAUDE.md（apps/web env アクセス不変条件 / Cloudflare CLI 実行ルール）
