# Phase 12: main (集約 entry)

本ワークフローの Phase 1-13 成果物・最終状態・受け入れ verdict を集約する index。

## 状態

- 現状: `implemented_local_visual_evidence_captured`（実装 + local static validation + local Playwright screenshot 完了、staging visual は user-gated）
- 遷移先: `implementation_completed`（staging visual smoke + Phase 13 user approval 後）

## Phase 別 entry

| Phase | path | 状態 |
|-------|------|------|
| 1 | `outputs/phase-1/phase-1.md` | done |
| 2 | `outputs/phase-2/phase-2.md` | done |
| 3 | `outputs/phase-3/phase-3.md` | done |
| 4 | `outputs/phase-4/phase-4.md` | done |
| 5 | `outputs/phase-5/phase-5.md` | done |
| 6 | `outputs/phase-6/phase-6.md` | done |
| 7 | `outputs/phase-7/phase-7.md` | done |
| 8 | `outputs/phase-8/phase-8.md` | done |
| 9 | `outputs/phase-9/phase-9.md` | done |
| 10 | `outputs/phase-10/phase-10.md` | done |
| 11 | `outputs/phase-11/phase-11.md` + `outputs/phase-11/evidence/local-validation-summary.txt` + `outputs/phase-11/screenshots/*.png` | local visual evidence captured |
| 12 | 本ファイル + strict 7 一式 | done (spec) |
| 13 | `outputs/phase-13/phase-13.md` | done |

## 入口

- 実装着手者は **Phase 5** の依存グラフから順に作業する
- レビュー者は **Phase 12-compliance-check.md** + **Phase 4 implementation-guide.md** を起点に
- PR 作成は **Phase 13** が手順書

## Local validation

`outputs/phase-11/evidence/local-validation-summary.txt` に記録。web Vitest 120 files / 865 tests PASS、typecheck PASS、lint PASS、verify-design-tokens 9 PASS、env-complete production build PASS。追加で `apps/web/playwright/tests/login-smoke.spec.ts` は desktop-chromium 9/9 PASS、Phase 11 screenshot 8 件を取得済み。
