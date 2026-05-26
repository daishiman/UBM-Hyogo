---
phase: 8
title: Definition of Done
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 8 — Definition of Done

[実装区分: 実装仕様書]

## 1. 機能 DoD

- [ ] `apps/web/playwright/scripts/mint-staging-storage-state.ts` が実装され、unit test 11 case 全 pass
- [ ] Playwright `setup-authenticated-staging` / `staging-visual-authenticated` / `teardown-authenticated-staging` の 3 project が `playwright.config.ts` に追加されている
- [ ] `profile-authenticated.spec.ts` / `admin-dashboard-authenticated.spec.ts` が認証後本文 visibility assert を含む形で実装されている
- [ ] CI 実行で baseline PNG 2 件が `*-authenticated-staging-visual-chromium-linux.png` suffix で物理生成され、commit されている
- [ ] `outputs/phase-11/screenshots/profile-authenticated.png` / `admin-dashboard-authenticated.png` が evidence として配置されている
- [ ] `apps/web/.gitignore` に storageState 出力除外が追記されている
- [ ] CI workflow（authenticated job）が PR / workflow_dispatch で動作する

## 2. 品質 DoD

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- mint-staging-storage-state` exit 0
- [ ] `mise exec -- pnpm gate-metadata:validate` exit 0
- [ ] `mise exec -- pnpm verify:phase12-compliance` exit 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] visual diff ≤ 5% (`maxDiffPixelRatio: 0.05`)
- [ ] cookie 値 / JWT / `STAGING_AUTH_SECRET` 値が tracked file に 0 hit

## 3. ドキュメント DoD

- [ ] 本 workflow `index.md` / `artifacts.json` / `phase-01..13` / `outputs/phase-11..12` の全ファイル物理存在
- [ ] proto-spec ファイル末尾に `status: consumed` + `canonical_workflow` pointer 追記済
- [ ] 親 `ut-dsf-07-staging-visual-runtime-evidence/phase-09-risks.md` §5（R-03）と `phase-13-commit-pr-draft.md` §7 に解消 cross-ref 追記済
- [ ] `outputs/phase-11/storagestate-generation.md` に cookie マスキング方針 + mint 手順記述

## 4. governance DoD

- [ ] issue #901 を reopen していない
- [ ] PR commit message / body に `Closes #901` が含まれない（`Refs #901` のみ）
- [ ] `profile-authenticated-root` / `admin-dashboard-root` の visibility assert 対象が現コードに存在する。未存在なら Phase 5 で最小 `data-testid` attribute を追加済み
- [ ] storageState JSON が git に commit されていない
- [ ] 新規 API endpoint / D1 schema 変更 / production deploy 0 件

## 5. parent workflow gate 解除条件（Gate-C 配下）

- [ ] 親 workflow `index.md` / `artifacts.json` の `parent_gate` 系状態を `VISUAL_RUNTIME_AUTHENTICATED_OK` に更新（user 明示承認後）

## 6. 受け入れ基準対応表

| AC (Phase 1 §4) | 担当 DoD |
|---|---|
| AC-01 storageState 事前生成方式 | §1 mint CLI + §2 unit test |
| AC-02 / AC-03 baseline 取得 | §1 baseline PNG + screenshot evidence |
| AC-04 guard でない assert | §1 spec 内 toBeVisible |
| AC-05 命名 | §1 baseline PNG suffix |
| AC-06 evidence 配置 | §3 outputs/phase-11 |
| AC-07 parent cross-ref | §3 親 workflow 編集 |
| AC-08 cookie/token grep 0 件 | §2 grep gate |
| AC-09 新規 API/D1/prod 0 件 | §4 governance |
| AC-10 typecheck/lint/verify-pr-ready | §2 |
| AC-11 proto-spec consumed | §3 |
| AC-12 .gitignore | §1 |
