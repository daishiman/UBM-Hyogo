---
phase: 3
title: タスク分解と設計レビュー判定
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 3 — タスク分解 / 設計レビューゲート

[実装区分: 実装仕様書]

## 1. 単一責務タスク分解（実装サイクル順）

| # | タスク | 単一責務 | 主な変更ファイル | 依存 |
|---|-------|---------|----------------|------|
| T-01 | staging-visual project 追加 | Playwright config に staging 専用 visual project と server 起動分岐を足す | `apps/web/playwright.config.ts` | なし |
| T-02 | staging visual spec 実装 | 4 screens の staging spec（baseURL=staging / route 安定化）を追加 | `apps/web/playwright/tests/visual-staging/{public-top,login,profile,admin-dashboard}.spec.ts` | T-01 |
| T-03 | npm script 追加 | `e2e:visual:staging` を package.json に追加 | `apps/web/package.json` | T-01 |
| T-04 | staging deploy | 最新 build を staging に配備 | （操作のみ、コード変更なし） | T-01..T-03 |
| T-05 | staging screenshot 取得 | staging URL に対し 4 screens baseline を生成 | snapshot PNG（`visual-staging/*-snapshots/`） | T-02, T-04 |
| T-06 | evidence 配置 | `outputs/phase-11/` に screenshot + log + metadata を物理配置 | `outputs/phase-11/**` | T-05 |
| T-07 | root gate 解除 | parent `index.md` / `artifacts.json` の VISUAL_RUNTIME / Gate-B,C 更新 | parent workflow 2 ファイル | T-06 |
| T-08 | CI 配線（任意） | `playwright-smoke.yml` に staging visual step を追加（既存拡張のみ） | `.github/workflows/playwright-smoke.yml` | T-02 |
| T-09 | verify-pr-ready green | 3 gate を local 先回り検証 | （検証のみ） | T-06, T-07 |

## 2. 並列 / 直列

- 直列必須: T-01 → T-02 → (T-04 deploy) → T-05 → T-06 → T-07 → T-09
- 並列可: T-03（script 追加）は T-01 後いつでも。T-08（CI 配線）は T-02 後に独立で着手可。

## 3. 設計レビュー判定（Phase 4 へ進めるか）

| 観点 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | production-equivalent runtime で design system 描画を保証し、parent gate を解除する明確な価値 |
| 実現性 | PASS | 既存 `staging` project / `cf.sh` / wrangler `[env.staging]` を再利用。新規 endpoint/schema なし。1 サイクルで完了可能 |
| 整合性 | PASS | SSR データ制約（page.route で SSR 差し替え不可）を §2 で明示し、検証対象を design system 描画に限定して責務を閉じた |
| 運用性 | PASS | staging baseline を別命名（`-staging-*`）で分離し、local baseline との衝突を回避。CI 拡張は既存 workflow に閉じる |

判定: **Phase 4 へ進行可（GO）**。

## 4. 未確定事項（Phase 4-6 で確定）

| 項目 | 確定先 |
|------|-------|
| `maxDiffPixelRatio` の staging 上限値（0.02 → 緩和可否） | Phase 6 |
| profile / admin の未認証 redirect 画面を baseline とするか、認証 chrome を別途用意するか | Phase 6（デフォルト: 未認証 guard 画面） |
| `playwright-smoke.yml` への staging visual step 追加要否（手動 deploy 後の `workflow_dispatch` で渡すか） | Phase 7 |

## 5. 参照

- `phase-02-architecture.md`
- `apps/web/playwright.config.ts`
- `docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json`
