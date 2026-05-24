---
phase: 9
title: リスクと代替案 — deploy 失敗 / SSR データ揺れ / 認証画面 / baseline drift
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 9 — リスクと代替案

[実装区分: 実装仕様書]

## 1. 主要リスク

| # | リスク | 影響 | 発生条件 |
|---|------|-----|---------|
| R-01 | staging deploy 失敗（secrets 不足 / OpenNext bundle エラー） | 4 screens 取得不可 → タスク全停止 | `cf.sh secret put` 未投入 / `[project]/...` 仮想 module 混入 |
| R-02 | SSR データ揺れ（件数変動 / 空状態）による過剰 diff fail | public-top で flake | staging API データが取得毎に変動 |
| R-03 | profile / admin が未認証で redirect → 想定画面と異なる描画 | baseline が guard 画面になる | middleware redirect 仕様変更時 |
| R-04 | snapshot baseline drift（CI runner の font / chromium バージョン更新） | staging visual gate 継続 fail | chromium / runner OS 更新時 |
| R-05 | macOS local と CI ubuntu の rendering 差 | local で pass / CI で fail | font hinting / antialias 差 |
| R-06 | staging URL が deploy 未済 / 旧 bundle のまま | 古い描画で baseline 取得 | deploy 前に visual 実行 |
| R-07 | `page.route()` が SSR fetch を intercept できると誤解 | SSR データを stub したつもりが効かない | index.md §0.3 未読 |

## 2. 代替案（不採用含む）

| 案 | 採否 | 理由 |
|----|-----|------|
| SSR データを mock 化して認証後画面を取得 | 不採用 | Worker サーバー fetch は `page.route()` で差し替え不可（技術的に不可能 / index.md §0.3） |
| staging に認証 session を張って profile/admin 実画面を取得 | 不採用（フォロー候補） | secrets / 認証フロー / seed を伴い「新規 fixture/seed 追加なし」スコープと衝突。§5 にフォロー記録 |
| 既存 `staging` project を直接使い visual spec を兼用 | 不採用 | `staging` project は testMatch 無指定で全 spec 対象になりうる。visual 専用 project で責務分離 |
| baseline を CI artifact のみで管理 | 不採用 | regression を git diff で検出する設計を維持（local と同方針） |
| local baseline を staging baseline に流用 | 不採用 | OpenNext bundle 描画と dev server 描画の等価性こそが検証対象（流用は目的を無効化） |

## 3. deploy 失敗（R-01）の fallback

### 3.1 検出

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build   # 先に local build 健全性
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

### 3.2 fallback フロー

1. `outputs/phase-11/build.log` / `staging-deploy.log` でエラー特定。
2. `[project]/...` 仮想 module 混入なら `next build --webpack` 経路を確認（Turbopack 混入禁止 / CLAUDE.md）。
3. secrets 不足なら `bash scripts/cf.sh secret put` で投入（実値は op 参照・ログ転記禁止）。
4. 復旧後に再 deploy。

### 3.3 禁止する fallback

- `wrangler` 直接実行（`cf.sh` 経由のみ）。
- API Token / OAuth トークン値の log / ドキュメント転記。
- local dev server baseline での代替（production-equivalent 要件違反）。

## 4. リスク軽減策（実装時に適用）

| リスク | 軽減策 |
|-------|------|
| R-02 | data 非依存画面（login）を最安定 baseline とし、`maxDiffPixelRatio: 0.05` に緩和。public-top は `page.route()` で client 動的要素を stub |
| R-03 | profile / admin は「未認証 guard / redirect 画面の design system 描画」を明示的検証対象とする（Phase 4 §3.3/3.4） |
| R-04 | chromium バージョンを `@playwright/test` で固定。bump 時は同一更新サイクルで baseline 更新 |
| R-05 | baseline は CI 生成 `-staging-visual-chromium-linux.png` を正本。macOS 生成 `-darwin.png` はコミットしない |
| R-06 | visual 実行前に必ず `cf.sh deploy --env staging` を実行（Phase 7 §4 の順序固定） |
| R-07 | index.md §0.3 / Phase 4 §5 を実装者必読とし、`page.route` を client 経路限定と spec コメントに明記 |

## 5. 残留リスクの受容 / フォロー候補

| 残留リスク | 受容理由 / フォロー |
|----------|-------------------|
| 認証後 profile / admin の runtime 描画は未検証 | 未認証 guard 描画で design system shell は担保。認証後画面の staging visual は別タスク（フォロー候補・未タスク化を Phase 12 で判定） |
| SSR データ内容の正しさは検証対象外 | 本タスクの目的は design system 描画の production-equivalent 検証（index.md §0.3）。データ正しさは既存 E2E / API テストの責務 |
| chromium minor bump による font diff | bump 頻度低・同一更新サイクルで baseline 更新して吸収 |
