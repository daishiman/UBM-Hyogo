---
phase: 11
title: Evidence Inventory
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 11 — Evidence Inventory

[実装区分: 実装仕様書]

## 1. inventory ledger

| # | classification | path | status (spec_created → runtime) |
|---|---|---|---|
| E-01 | contract index | `outputs/phase-11/main.md` | present |
| E-02 | screenshot plan | `outputs/phase-11/screenshot-plan.json` | present |
| E-03 | storagestate 生成手順 | `outputs/phase-11/storagestate-generation.md` | present |
| E-03a | canonical paths manifest | `outputs/phase-11/canonical-paths.json` | present |
| E-04 | typecheck log | `outputs/phase-11/evidence/typecheck.log` | pending |
| E-05 | lint log | `outputs/phase-11/evidence/lint.log` | pending |
| E-06 | unit test log (mint CLI) | `outputs/phase-11/evidence/mint-cli-unit.log` | pending |
| E-07 | staging visual authenticated log | `outputs/phase-11/evidence/playwright-staging-visual-authenticated.log` | pending |
| E-08 | grep gate log | `outputs/phase-11/evidence/grep-no-auth-leak.log` | pending |
| E-09 | verify-pr-ready log | `outputs/phase-11/evidence/verify-pr-ready.log` | pending |
| E-10 | verify-phase12 log | `outputs/phase-11/evidence/verify-phase12-compliance.log` | pending |
| E-11 | profile authenticated screenshot | `outputs/phase-11/screenshots/profile-authenticated.png` | pending |
| E-12 | admin dashboard authenticated screenshot | `outputs/phase-11/screenshots/admin-dashboard-authenticated.png` | pending |
| E-13 | baseline source (profile) | `apps/web/playwright/tests/visual-staging-authenticated/profile-authenticated.spec.ts-snapshots/*-authenticated-staging-visual-chromium-linux.png` | pending |
| E-14 | baseline source (admin) | `apps/web/playwright/tests/visual-staging-authenticated/admin-dashboard-authenticated.spec.ts-snapshots/*-authenticated-staging-visual-chromium-linux.png` | pending |
| E-15 | parent gate release record | `outputs/phase-11/parent-gate-release.md` | pending |

## 2. 取得経路

| evidence | 取得経路 |
|---|---|
| E-04..E-10 | Phase 10 §4 step (b)/(c)/(e)/(h) の log 保存 |
| E-11..E-12 | Phase 10 §4 step (f) の copy |
| E-13..E-14 | CI step `playwright test --update-snapshots` で生成 → commit |
| E-15 | user 明示承認後、親 workflow の `parent_gate` 解除を記録 |

## 3. evidence schema

```json
// outputs/phase-11/screenshot-plan.json
{
  "workflow_id": "issue-901-authenticated-profile-admin-staging-visual",
  "screenshots": [
    {
      "id": "profile-authenticated",
      "spec": "apps/web/playwright/tests/visual-staging-authenticated/profile-authenticated.spec.ts",
      "url_pattern": "/profile",
      "auth_role": "member",
      "baseline_suffix": "-authenticated-staging-visual-chromium-linux.png",
      "evidence_path": "outputs/phase-11/screenshots/profile-authenticated.png"
    },
    {
      "id": "admin-dashboard-authenticated",
      "spec": "apps/web/playwright/tests/visual-staging-authenticated/admin-dashboard-authenticated.spec.ts",
      "url_pattern": "/admin",
      "auth_role": "admin",
      "baseline_suffix": "-authenticated-staging-visual-chromium-linux.png",
      "evidence_path": "outputs/phase-11/screenshots/admin-dashboard-authenticated.png"
    }
  ]
}
```

## 4. ledger 更新箇所（external）

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` — issue-901 行追加
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` — workflow path 行追加
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` — parent context 追記
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-901-authenticated-profile-admin-staging-visual-artifact-inventory.md` — 新規作成
- `.claude/skills/aiworkflow-requirements/changelog/20260525-issue-901-authenticated-profile-admin-staging-visual.md` — 同 wave changelog
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` / `SKILL-changelog.md` — 同 wave 履歴

## 5. cookie マスキング方針

- storageState JSON は CI 内 ephemeral 生成。git 非コミット（`.gitignore` 強制）
- screenshot に cookie 値が描画される画面は存在しないが、念のため devtools 開いた状態を撮らない
- log 出力は env 名のみ（値非表示）。mint CLI summary は `{ role, sub, exp, isAdmin }` のみ
- 万一 commit に混入した場合の対応: `git filter-repo` での履歴削除 + `STAGING_AUTH_SECRET` rotation + 全 staging cookie の無効化（KV ベース revocation は MVP 不採用のため、`AUTH_SECRET` rotation が唯一の手段）
