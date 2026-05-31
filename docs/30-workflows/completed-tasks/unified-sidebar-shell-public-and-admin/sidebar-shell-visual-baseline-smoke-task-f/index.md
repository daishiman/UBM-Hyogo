---
task_id: sidebar-shell-visual-baseline-smoke-task-f
status: implemented_local_evidence_captured
task_type: implementation
visual_category: VISUAL
workflow_state: implemented_local_evidence_captured
implementation_status: implemented
created_at: 2026-05-29
parent_workflow: docs/30-workflows/unified-sidebar-shell-public-and-admin/
source_task: docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-F-visual-baseline-smoke.md
canonical_workflow: docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/sidebar-shell-visual-baseline-smoke-task-f/
---

# sidebar-shell-visual-baseline-smoke-task-f

> Branch: `docs/task-f-visual-baseline-smoke-spec`（仕様作成 + 親 A-E / Task F 実装を本ブランチで実行）
> 実装区分: **実装仕様書 + 実装（実行済み）**
> 状態: `implemented_local_evidence_captured`（親 Task A-E + Task F を本ブランチで実装済み・local typecheck/lint/vitest 45 + smoke 6/6 + visual V1-V3 green / CI Linux baseline・regression dry-run・commit/push/PR は user-gated）
> 作成日: 2026-05-29
> task type: `implementation` / `VISUAL`（visual baseline は CI Linux runner 撮影 = VISUAL_ON_EXECUTION）
> parent workflow: `docs/30-workflows/unified-sidebar-shell-public-and-admin/`
> source task: `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-F-visual-baseline-smoke.md`

## 背景

親 workflow `unified-sidebar-shell-public-and-admin` の Task A〜E で公開／会員／管理の 3 層を
共通 collapsible Sidebar Shell へ統合する。Task F はその統合シェルの regression を防ぐため、
Playwright で **3 ロール（viewer / member / admin）× 3 viewport（desktop / tablet / mobile）** の
visual baseline と smoke を捕捉する。

この workflow はコード変更を伴う実装仕様であり、Playwright spec 2 本 + 共通 helper 1 本 +
`apps/web/playwright.config.ts` の project 追加 + `.github/workflows/playwright-smoke.yml` の
job 追加を実装対象に含む。baseline PNG の実撮影・bot push 後の空 commit・required status check
PUT・commit / push / PR は user-gated として分離する。

## パストポロジ補正（Phase 1 path topology gate）

source task `task-F-visual-baseline-smoke.md` は以下のパスを参照しているが、現行リポジトリの
実構造と乖離しているため、本仕様では下表のとおり補正する（根拠は phase-1-requirements.md §7）。

| source task の記載 | 実在しない / 乖離 | 本仕様での正規パス |
| --- | --- | --- |
| `apps/web/tests/e2e/sidebar-shell-smoke.spec.ts` | `apps/web/tests/e2e/` には `staging-smoke.spec.ts` のみ。E2E 正本は `apps/web/playwright/tests/` | `apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts` |
| `apps/web/tests/e2e/sidebar-shell-visual.spec.ts` | 同上 | `apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts` |
| `apps/web/tests/e2e/_helpers/sidebar.ts` | 同上 | `apps/web/playwright/tests/sidebar-shell/_helpers.ts` |
| `apps/web/tests/e2e/fixtures/auth.ts` の `viewerStorageState` / `memberStorageState` / `adminStorageState` | 実 fixture は `apps/web/playwright/fixtures/auth.ts`。export は storageState ではなく拡張 `test`（`anonymousPage` / `memberPage` / `adminPage` + `mockApi`） | `apps/web/playwright/fixtures/auth.ts` の `test`（viewer=`anonymousPage` / member=`memberPage` / admin=`adminPage`）を再利用 |

## Scope

| 区分 | 内容 |
| --- | --- |
| smoke ケース | 6 ケース（viewer/`/`・member/`/profile`・admin/`/admin`・375px drawer・1024px collapse・route 遷移 auto-close） |
| visual baseline | 3 role × viewport の組合せ計 **7 screenshot**（task-F 表に準拠） |
| viewport | desktop 1280×800 / tablet 768×1024 / mobile 375×812 |
| baseline 正本 | `-linux.png`（CI Linux runner 撮影）。macOS dev 撮影分は commit しない |
| CI gate | `playwright-smoke / smoke (chromium)` matrix に smoke 追加 + `playwright-smoke / visual (sidebar-shell)` 新 matrix |

## Phase一覧

| Phase | File | 内容 |
| --- | --- | --- |
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタリング |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト / Evidence |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR |

## 依存（CONST_007 補足）

Task F の実装着手は親 Task A〜E（shell primitive / user-menu / public+member layout /
admin layout / mobile drawer）の完了が前提。これは「先送り」ではなく sibling task への
技術的依存であり、Task E が Task A-D に依存したのと同型。仕様書自体は本サイクルで完結し、
実装実行のみ A-E 完了後に行う。

## Strict 7

Phase 12 strict 7 outputs は本 workflow root の `outputs/phase-12/` に配置する。親 workflow の
strict 7 とは別に、Task F の成果物として root / output `artifacts.json` parity と
aiworkflow sync を保持する。
