---
phase: 6
title: テスト方針 — staging-visual spec が runtime 検証・flake 防止
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 6 — テスト方針

[実装区分: 実装仕様書]

## 1. 本タスクにおけるテストの位置づけ

本タスクの **「実装」は staging-visual の Playwright spec ファイル自体**。spec が production-equivalent runtime（Cloudflare Workers staging）での design system 描画 regression を検出する。追加の unit / integration test は新規作成しない。

| 種別 | 本タスクでの扱い |
|------|--------------|
| Unit test | 追加なし |
| Integration test | 追加なし |
| E2E (non-visual) | 追加なし |
| local visual regression | 変更なし（task-18-w7 / `visual-chromium` で確立済） |
| **staging visual regression** | **本タスクの中核**。4 spec を新規（`staging-visual` project） |
| A11y / Lighthouse | 範囲外 |

## 2. flake 防止戦略

### 2.1 必須対策（4 spec すべてに適用）

| # | 対策 | 実装 |
|---|------|------|
| 1 | animation / transition / caret 停止 | `page.addStyleTag`（既存 spec パターン） |
| 2 | DOM ready の明示 wait | `page.locator('main h1').waitFor({ state: 'visible' })` |
| 3 | client-side 動的 fetch の安定化 | `page.route('**/api/**', ...)`（public-top のみ・flake 時） |
| 4 | font rendering 統一 | CI runner を `ubuntu-latest` に固定、baseline は `-staging-visual-chromium-linux.png` を正本 |
| 5 | retries | `staging-visual` project に `retries: 2`（staging ネットワーク揺れ対策） |

### 2.2 maxDiffPixelRatio

`0.05`（5%）。local visual（`0.02`）より緩める。理由: staging SSR データが実値で揺れる（空状態 / 件数変動）ため、design system 描画差分のみを検出する閾値に調整。data 非依存画面（login / 未認証 guard）は実質ほぼ 0% 差分になる。

### 2.3 fullPage: true

4 spec すべて `fullPage: true`。page-level rhythm（縦リズム / セクション余白）を担保。

## 3. test 実行モード

### 3.1 ローカル（macOS, staging URL に対して）

```bash
# staging URL に対し diff fail 検出（baseline コミット済の場合）
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging

# baseline 更新（CI 正本 / macOS では原則実行しない）
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging --update-snapshots
```

### 3.2 CI（ubuntu-latest）

`playwright-smoke.yml` の `workflow_dispatch` で `staging_visual_base_url` に staging URL を渡し、`staging-visual` project を実行（任意拡張）。baseline 正本は CI 生成 `-staging-visual-chromium-linux.png`。

## 4. 期待される test 結果

| 段階 | 期待挙動 |
|------|---------|
| 初回（baseline 不在） | baseline 生成 fail → `-staging-visual-chromium-linux.png` を取得しコミット |
| 2 回目（baseline コミット済） | 全 spec pass / diff < 5% |
| OpenNext bundle が token/rhythm を local と乖離描画 | spec が diff fail → bundle 不全を検出 |
| staging SSR データ揺れのみ（design system は不変） | `maxDiffPixelRatio: 0.05` 内に収まり pass |

## 5. test を増やさない判断

| 検討案 | 不採用理由 |
|--------|----------|
| members-list / member-detail の staging visual 追加 | index.md §0.2 スコープ外（現コード実装済み 4 spec に合わせる） |
| 認証後 profile / admin の staging visual | secrets / 認証フローを伴い「新規 fixture/seed 追加」と衝突。§Phase 9 でフォロー候補 |
| viewport × 3 展開 | local `visual-full` 相当は別運用。本タスクは desktop 1 viewport |
| SSR データの mock 化 | Worker サーバー fetch は `page.route()` で差し替え不可（index.md §0.3）。技術的に不可能 |

## 6. test 失敗時の対応フロー

1. CI / local で diff fail。
2. diff artifact を確認。
3. **design system 退行**（token / rhythm / primitive 描画差）: `apps/web/src/styles` / コンポーネント実装の退行を疑い、該当 PR にバックポート（本タスクで `apps/web/src` は変更しない）。
4. **SSR データ揺れのみ**: `maxDiffPixelRatio` 調整 or data 非依存画面（login）を優先 baseline とする。
5. **意図したデザイン更新**: `--update-snapshots` で新 baseline をコミット。

## 7. 未確定事項の確定（Phase 3 §4 から）

| 項目 | 確定 |
|------|------|
| `maxDiffPixelRatio` staging 上限 | `0.05`（§2.2） |
| profile / admin の baseline | 未認証 guard / redirect 画面（§Phase 5 §3.3/3.4） |
