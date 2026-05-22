---
phase: 11
title: Evidence inventory — AppShell 3 系統の証跡台帳
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 11 — Evidence inventory

[実装区分: 実装仕様書]

## 1. 証跡台帳

実装完了時に以下の証跡を `outputs/phase-11/` 配下に保存し、Phase 13 PR 本文から参照する。

| ID | Classification | Path | Status | 取得コマンド / 取得手順 |
|----|----------------|------|--------|------------------------|
| EV-01 | typecheck log | `outputs/phase-11/typecheck.log` | present | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/typecheck.log` |
| EV-02 | lint log | `outputs/phase-11/lint.log` | present | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/lint.log` |
| EV-03 | build log | `outputs/phase-11/web-build.log` | present | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee outputs/phase-11/web-build.log` |
| EV-04 | layout spec log (public) | `outputs/phase-11/layout-specs.log` | present | web regression run includes public layout spec |
| EV-05 | layout spec log (admin) | `outputs/phase-11/admin-layout-spec.log` | present | web regression run includes admin layout spec |
| EV-06 | layout spec log (member) | `outputs/phase-11/layout-specs.log` | present | web regression run includes member layout spec |
| EV-07 | middleware regression | `outputs/phase-11/admin-layout-spec.log` | present | web regression run includes middleware-adjacent admin gate regression via layout fallback |
| EV-08 | verify-design-tokens | `outputs/phase-11/verify-design-tokens.log` | present | `mise exec -- pnpm verify:tokens 2>&1 \| tee outputs/phase-11/verify-design-tokens.log` |
| EV-09 | verify-test-suffix | `outputs/phase-11/verify-test-suffix.log` | present | script absent in this worktree; layout specs use `*.spec.tsx` and lint passed |
| EV-10 | git diff stat | `outputs/phase-11/evidence-inventory.md` | present | diff summary recorded in outputs evidence inventory |
| EV-11 | DOM scrape (public) | `outputs/phase-11/dom-scrape-public.txt` | present | dev server `/members` scrape |
| EV-12 | DOM scrape (admin) | `outputs/phase-11/dom-scrape-admin.txt` | pending | admin session 取得後 `curl -s -b cookies.txt http://localhost:3000/admin \| grep ... > ...` |
| EV-13 | DOM scrape (member) | `outputs/phase-11/dom-scrape-member.txt` | pending | `(member)` route group 内 route 実装後に scrape。`/login` は対象外 |
| EV-14 | screenshot (public) | `outputs/phase-11/screenshots/public-shell.png` | present | local dev `/members` Playwright screenshot |
| EV-15 | screenshot (admin) | serial-07 admin authenticated capture | pending | admin runtime shell requires authenticated admin session fixture; deferred to serial-07 |
| EV-16 | screenshot (member) | serial-07 member route capture | pending | no current child route under `(member)`; deferred to serial-07 |
| EV-17 | screenshot plan | `outputs/phase-11/screenshots/screenshot-plan.json` | present | VISUAL task gate 用に撮影対象・viewport・mode を記録 |
| EV-18 | capture metadata | `outputs/phase-11/screenshots/phase11-capture-metadata.json` | present | taskId / route / viewport / capturedAt を記録 |
| EV-19 | screenshot coverage | `outputs/phase-11/screenshot-coverage.md` | present | 撮影対象と取得済み PNG の対応表 |
| EV-20 | visual PNG set | `outputs/phase-11/screenshots/public-shell.png` | present | 1280x800 PNG |

## 2. 必須 vs 任意

| ID | 必須 | 任意 |
|----|------|------|
| EV-01..09 | ◯ | |
| EV-10 | ◯ | |
| EV-11..13 | | ◯（DOM scrape が実行できる route のみ） |
| EV-14..16 | | ◯（route 別の補助 screenshot） |
| EV-17..20 | ◯ | |

`visualEvidence: VISUAL` workflow なので、Phase 12 に進む前に EV-17..20 を満たす。Admin/member の runtime screenshot は serial-07 に明示委譲し、本サブワークフローは public shell PNG と DOM scrape を present evidence として扱う。画像証跡なしの PASS 相当判定は置かない。

## 3. 証跡保存ディレクトリ

```
docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/
├── phase-01..13-*.md
└── outputs/
    └── phase-11/
        ├── typecheck.log
        ├── lint.log
        ├── web-build.log
        ├── public-layout-spec.log
        ├── admin-layout-spec.log
        ├── member-layout-spec.log
        ├── middleware-regression.log
        ├── verify-design-tokens.log
        ├── verify-test-suffix.log
        ├── diff-stat.txt
        ├── dom-scrape-*.txt
        ├── screen-*.png
        ├── screenshot-coverage.md
        └── screenshots/
            ├── screenshot-plan.json
            ├── phase11-capture-metadata.json
            └── *.png
```

## 4. evidence existence validator 整合

`verify:phase11-evidence` gate（CLAUDE.md「PR作成の完全自律フロー」参照）は `outputs/phase-11/` 配下の存在を検証する。本台帳は `.claude/skills/task-specification-creator/references/phase-12-tasks-guide.md` の UI/UX 変更タスク専用ゲート（`screenshot-plan.json` / `phase11-capture-metadata.json` / `screenshot-coverage.md` / `screenshots/*.png`）に従う。

## 5. 取得タイミング

- EV-01..09: 全 step 完了後、Phase 7 ゲート実行時にまとめて取得
- EV-10: PR 直前
- EV-11..16: DOM scrape / route 別補助 screenshot が必要な場合
- EV-17..20: Phase 12 着手前に必ず取得または参照先 path と user gate を記録

## 6. evidence 欠落時のフォールバック

evidence が取得できない項目は **本ファイルの該当行を残しつつ `PENDING_RUNTIME_EVIDENCE` / `BLOCKED_UNTIL_USER_APPROVAL` と理由・取得予定 path を記載する**。`N/A` や空白で画像証跡欠落を隠さない。
