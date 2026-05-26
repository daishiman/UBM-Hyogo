---
phase: 3
title: Task Breakdown
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 3 — Task Breakdown

[実装区分: 実装仕様書]

## 1. SRP 単位の分解（1 ファイル 1 タスク・コミット可能粒度）

| # | タスク | 種別 | 対象ファイル | 想定 diff 行数 | 依存 |
|---|---|---|---|---|---|
| T-01 | storageState mint CLI 実装 | 新規 | `apps/web/playwright/scripts/mint-staging-storage-state.ts` | ~120 | `@ubm-hyogo/shared.signSessionJwt` |
| T-02 | mint CLI unit test | 新規 | `apps/web/playwright/scripts/__tests__/mint-staging-storage-state.spec.ts` | ~110 | T-01 |
| T-03 | Playwright setup project（mint 起動 + assert） | 新規 | `apps/web/playwright/tests/visual-staging-authenticated/setup.staging-auth.ts` | ~50 | T-01 |
| T-04 | Playwright teardown（storageState 削除） | 新規 | `apps/web/playwright/tests/visual-staging-authenticated/teardown.staging-auth.ts` | ~20 | T-03 |
| T-05 | `playwright.config.ts` に setup / authenticated / teardown project 追加 | 編集 | `apps/web/playwright.config.ts` | ~35 | T-03,T-04 |
| T-06 | profile authenticated spec | 新規 | `apps/web/playwright/tests/visual-staging-authenticated/profile-authenticated.spec.ts` | ~50 | T-05 |
| T-06a | profile visibility testid 追加（未存在時のみ） | 編集 | `apps/web/app/profile/page.tsx` | ~3 | T-06 |
| T-07 | admin dashboard authenticated spec | 新規 | `apps/web/playwright/tests/visual-staging-authenticated/admin-dashboard-authenticated.spec.ts` | ~50 | T-05 |
| T-07a | admin dashboard visibility testid 追加（未存在時のみ） | 編集 | `apps/web/app/(admin)/admin/page.tsx` | ~3 | T-07 |
| T-08 | `.gitignore` 追記（`apps/web/playwright/.auth/`） | 編集 | `apps/web/.gitignore` | ~3 | — |
| T-09 | CI workflow（authenticated staging-visual job） | 新規 / 編集 | `.github/workflows/playwright-staging-visual-authenticated.yml`（新設）または `.github/workflows/playwright-visual-baseline-update.yml`（job 追記） | ~80 | T-05..T-08 |
| T-10 | profile.spec.ts / admin-dashboard.spec.ts に cross-ref コメント追記 | 編集 | `apps/web/playwright/tests/visual-staging/{profile,admin-dashboard}.spec.ts` | ~6 | — |
| T-11 | proto-spec consumed pointer 追記 | 編集 | `docs/30-workflows/completed-tasks/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md` | ~10 | recovery §3 |
| T-12 | 親 UT-DSF-07 cross-ref 追記 (R-03 / §5 / §7 解消) | 編集 | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-09-risks.md` / `phase-13-commit-pr-draft.md` | ~12 | — |
| T-13 | storageState 生成手順 evidence | 新規 | `docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/storagestate-generation.md` | ~60 | — |
| T-14 | baseline PNG 物理配置（CI生成→commit） | 新規 | `apps/web/playwright/tests/visual-staging-authenticated/**-snapshots/*.png` + `outputs/phase-11/screenshots/*.png` | bin | T-06,T-07 (Gate-C 配下) |

## 2. 設計レビュー判定

| 観点 | 判定 |
|---|---|
| SRP | ✅ 1 タスク = 1 ファイル責務（mint / setup / teardown / spec を分離） |
| OCP | ✅ 既存 `staging-visual` project / spec / baseline PNG は無変更（cross-ref コメント追加のみ） |
| 後方互換 | ✅ 既存 UT-DSF-07 baseline と命名 namespace を分離（`*-authenticated-*`） |
| CONST_007 | ✅ 全タスク 1 サイクルで完結 |
| 不可逆性 | T-14 のみ runtime cycle 必要（CI gate 通過後のみ生成可能）→ Gate-C 配下に分離 |
| ロールバック | T-01..T-13 は revert 容易（追加 / コメント追記のみ） |

## 3. 実装順序（推奨）

1. T-01 → T-02 (CLI + unit test の TDD)
2. T-03 → T-04 → T-05 (Playwright project 配線)
3. T-06 → T-07 (spec 実装 / local では storageState を手動で mint してテスト)
4. T-08 → T-13 (周辺整備)
5. T-10 → T-11 → T-12 (cross-ref 整合)
6. T-09 → T-14 (CI 配線 + baseline 取得・Gate-C)

## 4. 非タスク化（スコープ外明示）

- 新規 fixture / seed 追加 → 不要（既存 staging seed の `manjumoto.daishi@senpai-lab.com` / `manju.manju.03.28@gmail.com` を利用）
- Magic Link / OAuth E2E → 不要（storageState 直接 mint で代替）
- 認証後画面の API レスポンス内容検証 → 既存 E2E / API テスト責務
- production deploy → 仕様外
