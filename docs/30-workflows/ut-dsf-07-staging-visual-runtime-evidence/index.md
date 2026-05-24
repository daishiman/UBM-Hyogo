---
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
workflow_state: spec_created
created_at: 2026-05-23
owner: daishiman
taskType: implementation
visualEvidence: VISUAL
implementation_mode: new
source_issue: 829
source_issue_state: CLOSED
parent_workflow: ui-prototype-design-system-foundation
parent_gate: VISUAL_RUNTIME_PENDING
---

# UT-DSF-07 — production-equivalent (Cloudflare Workers staging) visual runtime evidence

[実装区分: 実装仕様書]

## 0. 本仕様書の位置づけと issue 最適化判定

本ワークフローは GitHub issue [#829](https://github.com/daishiman/UBM-Hyogo/issues/829)（`[UT-DSF-07]`, state: **CLOSED**）を、**現在のコードベースに最適化して根本解決する**ための実装タスク仕様書である。issue は CLOSED のままで運用する（再オープンしない）。

### 0.1 調査結論: 本タスクは依然として必要（別タスクで未解決）

| 確認軸 | 状態 | 根拠 |
|--------|------|------|
| インフラ（staging deploy / playwright staging project / wrangler [env.staging]） | ✅ 既存 | `scripts/cf.sh` / `apps/web/wrangler.toml` `[env.staging]` / `apps/web/playwright.config.ts` L209-216 `staging` project / `.github/workflows/web-cd.yml` |
| local visual baseline 4 screens | ✅ 既存（task-18-w7 / PR #697） | `apps/web/playwright/tests/visual/{public-top,login,profile,admin-dashboard}.spec.ts` + `*-visual-chromium-linux.png` |
| **staging runtime での visual evidence 取得** | ❌ 未実施 | `playwright-smoke.yml` は `base_url` input を渡さず localhost のみ実行 |
| **root workflow `VISUAL_RUNTIME_PENDING` 解除** | ❌ 未解除 | `docs/30-workflows/ui-prototype-design-system-foundation/index.md` L7 / `artifacts.json` L6 とも `VISUAL_RUNTIME_PENDING` |
| **Gate-B / Gate-C 通過** | ❌ pending | 同 `artifacts.json` gates[] |

> task-18-w7（PR #697）は **localhost dev server に対する** local visual baseline 機能を構築したのみ。Cloudflare Workers staging runtime での screenshot 取得・gate 解除は未着手で、別タスクでも解決されていない。よって本タスクは実施が必要。

### 0.2 issue 原文からの最適化（現コードとの乖離解消）

| 項目 | issue 原文 (2026-05-18) | 現コード実態 | 本仕様の採用 |
|------|----------------------|------------|------------|
| visual 対象 4 screens | top / public members list / public member detail / admin dashboard | 実装済み visual spec は `/`(public-top) / `/login` / `/profile` / `/admin` | **現コードの実装済み spec に合わせる**（public-top / login / profile / admin-dashboard）。members-list / member-detail の新規 visual spec は作らない（スコープ膨張回避） |
| staging への向け方 | 「`BASE_URL` env で staging に向けるだけ」 | visual spec は `mockApi` fixture（`127.0.0.1:8787` の **ローカル HTTP サーバー**）を SSR fetch 経路に注入する構造 | **`page.route()` を staging baseURL に対しても適用**してクライアントサイド動的要素を安定化。SSR データは実 staging データを許容（§0.3 参照） |

### 0.3 根本問題（最適化の核心）と本仕様の解法

issue 原文の前提「Playwright config を staging URL に向ければ済む」は現コードでは**成立しない**。理由と解法:

1. **mockApi fixture は `page.route()` ではなくローカル HTTP サーバー**（`apps/web/playwright/fixtures/auth.ts` の `MOCK_API_PORT = 8787`）。local dev では Next dev server が `INTERNAL_API_BASE_URL=http://127.0.0.1:8787` 経由でこのモックを SSR fetch する。
2. **Cloudflare Workers staging では Worker のサーバーサイド fetch を Playwright で差し替えできない**（`page.route()` はブラウザが発行する fetch のみ intercept）。よって SSR でレンダリングされる内容は **実 staging API のレスポンス**になる。
3. **本タスクの真の目的は「OpenNext Workers bundle が design system（CSS `@layer` / OKLch token / rhythm / primitives）を local と等価に描画するか」の production-equivalent 検証**であり、API データの内容一致ではない。レイアウト・配色・余白・タイポグラフィは bundle 由来で、データ内容に依存しない。
4. したがって本仕様は **(a) baseURL を staging に向ける専用 Playwright project / spec を新設**し、**(b) `page.route()` でクライアントサイド動的 fetch を安定化**しつつ、**(c) SSR データは staging 実値（空状態含む）を許容**する。screenshot は staging baseline として **local baseline とは別ディレクトリ**で管理し、design-system 描画差分の検出に用いる。

## 1. 目的

`ui-prototype-design-system-foundation` root workflow の Gate-B / Gate-C が要求する **production-equivalent runtime（Cloudflare Workers staging）での visual evidence** を確立し、root workflow の `VISUAL_RUNTIME_PENDING` を `VISUAL_RUNTIME_OK` へ解除する。

## 2. スコープ

| 含む | 含まない |
|------|---------|
| `apps/web/playwright.config.ts` に staging-visual project / env 配線を追加 | 新規 API endpoint 追加・D1 schema 変更・Google Form 仕様変更 |
| staging 用 visual spec（baseURL=staging, `page.route()` でクライアント動的要素安定化）の追加 | local visual baseline の取り直し（task-18-w7 で確立済み） |
| `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` での staging deploy | production 環境への deploy |
| 4 screens（public-top / login / profile / admin-dashboard）の staging screenshot 取得 | members-list / member-detail の新規 visual spec |
| `outputs/phase-11/` への evidence 物理配置 + inventory ledger | 新規 mock fixture / seed の追加 |
| root workflow `index.md` / `artifacts.json` の `VISUAL_RUNTIME_PENDING` → `VISUAL_RUNTIME_OK` 解除 + Gate-B/C 通過 | branch protection の `gh api -X PUT`（user 明示承認待ち） |
| `bash scripts/verify-pr-ready.sh` 全 green | 新規 CI workflow ファイルの作成（既存 `playwright-smoke.yml` の拡張に留める） |

## 3. 不変条件（CLAUDE.md / parent workflow 継承）

1. 既存 API endpoint surface のみ接続。新規 endpoint / D1 schema / Google Form 仕様変更 0 件。
2. OKLch トークン正本化。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate）。
3. `apps/web` の env 参照は `getEnv()` / `getPublicEnv()` 経由のみ。`process.env.*` 直接参照禁止。
4. `apps/web/src/` 配下に `127.0.0.1:8888` 等のローカル限定 endpoint を焼き込まない。
5. production build は `next build --webpack`（OpenNext Workers 互換）。`[project]/...` 仮想 module specifier を bundle に混入させない。
6. Cloudflare CLI は `scripts/cf.sh` 経由のみ（`wrangler` 直接実行禁止）。
7. 新規 test ファイルは `*.spec.ts` のみ（`*.test.ts` 禁止）。

## 4. CONST_007 適合宣言

本ワークフローの全 Phase は、後続の実装プロンプト（`03.実装.md`）の **1 サイクル内で完了**できるスコープに収めている。先送り前提の Phase / 別 PR 切り出しは存在しない。staging deploy・screenshot 取得・gate 解除・evidence 配置・PR draft までを 1 サイクルで完結させる。

## 5. Phase 構成

| Phase | ファイル | 責務 |
|-------|---------|------|
| 1 | `phase-01-requirements.md` | 要件定義（FR/NFR・最小 gate・staging visual の真の目的固定） |
| 2 | `phase-02-architecture.md` | アーキ（staging-visual project / route-mock 配線 / deploy フロー / SSR データ方針） |
| 3 | `phase-03-task-breakdown.md` | タスク分解と設計レビュー判定 |
| 4 | `phase-04-data-contract.md` | env 契約・screenshot 命名契約・artifacts schema |
| 5 | `phase-05-implementation-guide.md` | 変更ファイル一覧・関数/設定シグネチャ・差分方針 |
| 6 | `phase-06-test-strategy.md` | テスト方針（staging-visual spec のケース・期待値） |
| 7 | `phase-07-quality-gates.md` | 品質ゲート（最小 gate と CI context） |
| 8 | `phase-08-dod.md` | Definition of Done |
| 9 | `phase-09-risks.md` | リスク・フォールバック（deploy 失敗 / flake / SSR データ揺れ） |
| 10 | `phase-10-local-verification.md` | ローカル/CI 実行・検証コマンド |
| 11 | `phase-11-evidence-inventory.md` | evidence inventory ledger（canonical path） |
| 12 | `phase-12-compliance.md` | compliance check（canonical 9 headings） |
| 13 | `phase-13-commit-pr-draft.md` | commit / PR draft / required status check 候補 |

## 6. 正本順位

1. 本 `index.md`（issue 最適化判定 §0 を含む）
2. `docs/30-workflows/ui-prototype-design-system-foundation/`（parent workflow: `SCOPE.md` / `index.md` / `artifacts.json`）
3. 現コード実態（`apps/web/playwright.config.ts` / `apps/web/playwright/tests/visual/*.spec.ts` / `apps/web/playwright/fixtures/auth.ts`）
4. `docs/00-getting-started-manual/specs/*.md`

衝突時は上位を優先する。特に「issue 原文」と「現コード実態」が衝突する場合は §0.2 / §0.3 の最適化判定に従う。

## 7. 参照

- parent: `docs/30-workflows/ui-prototype-design-system-foundation/{index.md,artifacts.json,SCOPE.md}`
- 旧 spec: `docs/30-workflows/unassigned-task/UT-DSF-07-visual-runtime-production-equivalent-screenshots.md`
- code: `apps/web/playwright.config.ts` / `apps/web/playwright/tests/visual/*.spec.ts` / `apps/web/playwright/fixtures/auth.ts` / `apps/web/wrangler.toml`
- ops: `scripts/cf.sh` / `scripts/verify-pr-ready.sh` / `.github/workflows/{playwright-smoke,web-cd}.yml`
- CLAUDE.md（apps/web env アクセス不変条件 / Cloudflare CLI 実行ルール / UI prototype alignment）
