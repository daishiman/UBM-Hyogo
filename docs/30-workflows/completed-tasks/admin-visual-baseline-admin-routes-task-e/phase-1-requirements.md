---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 1
phase_name: 要件定義
created_at: 2026-05-27
task_type: visual baseline / CI integration
visual_category: VISUAL
implementation_mode: new
parent_workflow: docs/30-workflows/admin-ui-prototype-alignment/
source_task: docs/30-workflows/admin-ui-prototype-alignment/tasks/task-E-visual-baseline-admin-routes.md
branch: feat/admin-ui-prototype-alignment
---

# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 1. ゴール

Task A-D の admin shell 整備完了を受け、admin required routes × 4 viewport の Playwright staging-visual baseline を取得し、`*-linux.png` 正本として配置する。CI `playwright-smoke.yml` に admin visual job を追加し、regression 検出を required status check 候補として整備する。

非ゴール:
- Task A-D 実装本体（先行完了が前提）
- non-admin route（public / member は issue-901 / 902 で完了済）
- 新規 mint 方式の追加（既存 `staging-visual-authenticated` storageState setup / runtime-smoke-mint パターンを継承）

---

## 2. 背景（観察事実）

- 既存 local visual spec: `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` で `adminLogin(context)` + `mockApi` fixture + `animation: none` injection + `toHaveScreenshot(..., { fullPage: true, maxDiffPixelRatio: 0.02 })` パターンが確立済み。
- 既存 staging auth pattern: `apps/web/playwright/tests/visual-staging-authenticated/setup.staging-auth.ts` + `staging-visual-authenticated` project で storageState を作る。Task E は staging baseline なので、この認証方式を継承し、cookie URL が local に向く `adminLogin(context)` 直呼びを避ける。
- baseline 配置規約: `<spec>.spec.ts-snapshots/<screenshot>-<project>-linux.png`。
- 既存 CI workflow: `.github/workflows/playwright-smoke.yml` / `playwright-visual-full.yml` / `playwright-visual-baseline-update.yml`。
- 既知 lessons:
  - `L-I902-001..004`: env-gated `[id]` / `-linux.png` 正本 / SSR fetch stub 不可 / rename grep gate。
  - `L-I901-*`: 認証後 visual の cookie mint。
  - `feedback_visual_baseline_github_token_retrigger`: bot baseline push は GITHUB_TOKEN ゆえ `pull_request` 非発火 → 空コミットを開発者トークンで push し最終 HEAD で全 check 再評価。

---

## 3. 対象 route（required 10 + env-gated 2 = 最大 12 spec）

| # | Route | 区分 |
|---|-------|------|
| 1 | `/admin` | required |
| 2 | `/admin/dashboard/attendance` | required |
| 3 | `/admin/members` | required |
| 4 | `/admin/members/[id]` | env-gated (`PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` + `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID`) |
| 5 | `/admin/tags` | required |
| 6 | `/admin/meetings` | required |
| 7 | `/admin/meetings/[id]` | env-gated (`PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` + `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID`) |
| 8 | `/admin/schema` | required |
| 9 | `/admin/schema/history` | required |
| 10 | `/admin/requests` | required |
| 11 | `/admin/identity-conflicts` | required |
| 12 | `/admin/audit` | required |

---

## 4. Acceptance Criteria

- **AC-1**: `apps/web/playwright/tests/visual/admin-shell/` 配下の spec で required 10 routes × 4 viewport = **40 baseline PNG** を生成する。`PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` / `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID` が両方ある場合だけ detail 2 routes を加え、最大 **48 baseline PNG** とする。
- **AC-2**: baseline は `*-linux.png` 正本（macOS dev 環境では撮影しない・撮影しても commit しない）。
- **AC-3**: `playwright-smoke.yml` の admin visual job 追加で `playwright test` 実行が green（diff 0）。
- **AC-4**: env-gated route（`[id]`）は env var 未設定時は `test.skip` し、設定時のみ baseline 撮影。
- **AC-5**: regression（意図的に primitive token を破壊した dry-run）で diff が detect される。
- **AC-6**: required status check 候補一覧を Phase 13 に列挙（実 PUT は user-gated）。

---

## 5. 不変条件

1. `-linux.png` を正本とし macOS 撮影分は commit しない。
2. 認証 cookie 経路は既存 `staging-visual-authenticated` storageState setup / runtime-smoke-mint パターンを継承（新規 mint 経路を作らない）。
3. bot による baseline push は GITHUB_TOKEN ゆえ `pull_request` 非発火 → 空コミット再トリガーを Phase 5/13 に明記。
4. SSR fetch stub は不可（`mockApi` は client-side のみ）→ 必要なら staging API の実応答を `route.fulfill` で固定するか env-gate で skip。
5. spec ファイルは `*.spec.ts`（`.test.ts` 禁止、lefthook `block-test-suffix` で reject される）。
6. env-gated 2 route は seed ID が両方そろった場合だけ有効化。片方だけ有効化して 44 PNG にする運用は禁止（baseline 正本の不安定化を避けるため）。

---

## 6. 依存

- Task A（admin shell topbar/sidebar）
- Task B（dashboard recovery / byZone）
- Task C（page-header token conformance）
- Task D（attendance primitive）

すべて staging 反映後でないと Task E は着手しない。
