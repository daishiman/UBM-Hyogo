# Phase 12: main (集約 entry)

本 workflow `admin-identity-conflicts-prototype-alignment-and-404-fix` の Phase 1-13 成果物・最終状態・受け入れ verdict を集約する index。

## 状態

- 現状: `implemented_local_evidence_captured` (web UI alignment 実装 + local typecheck/Vitest PASS)
- 遷移先 1: `implemented_local_visual_evidence_captured` (local screenshot evidence 取得後)
- 遷移先 2: `implementation_completed` (staging visual smoke + Phase 13 user approval 後)

## Phase 別 entry

| Phase | path | 状態 |
|-------|------|------|
| 1 | `outputs/phase-1/phase-1.md` | done (spec) |
| 2 | `outputs/phase-2/phase-2.md` | done (spec) |
| 3 | `outputs/phase-3/phase-3.md` | done (spec) |
| 4 | `outputs/phase-4/phase-4.md` | done (spec) |
| 5 | `outputs/phase-5/phase-5.md` | done (spec) |
| 6 | `outputs/phase-6/phase-6.md` | done (spec) |
| 7 | `outputs/phase-7/phase-7.md` | done (spec) |
| 8 | `outputs/phase-8/phase-8.md` | done (spec) |
| 9 | `outputs/phase-9/phase-9.md` | done (spec) |
| 10 | `outputs/phase-10/phase-10.md` | done (spec) |
| 11 | `outputs/phase-11/phase-11.md` | done (spec) / evidence は実装後取得 |
| 12 | 本ファイル + strict 7 一式 | done (spec) |
| 13 | `outputs/phase-13/phase-13.md` | done (spec) |

## 入口

- 実装着手者は **Phase 5** の依存グラフ + **Phase 4** の実装ガイドから順に作業する
- レビュー者は **`phase12-task-spec-compliance-check.md`** + **`implementation-guide.md`** を起点に
- PR 作成は **Phase 13** が手順書
- (B) 404 仮説の切り分けは **Phase 4 / 7** の H1-H5 表に従う

## Local validation 記録枠

| 検証 | 期待 | 結果 (実装後追記) |
|------|------|------------------|
| `pnpm typecheck` (workspace) | exit 0 | PASS (2026-05-27 再実測) |
| `pnpm lint` (workspace) | exit 0 | PASS (2026-05-27 再実測) |
| `pnpm verify:no-inline-style` | exit 0 | PASS |
| `pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow` | exit 0 | PASS (159 files / 1154 tests / 1 skipped; 2026-05-27 再実測) |
| `pnpm --filter @ubm-hyogo/api test -- identity-conflicts.contract` | exit 0 | PASS (65 files / 414 tests) |
| `pnpm --filter @ubm-hyogo/web build` | exit 0 | pending (Phase 13 verify-pr-ready.sh で実行) |
| Phase 11 local screenshot 8 件 | present | pending (user-gated — Playwright dev server 必須) |
| Phase 9 grep gate (PII / D1 / legacy hook) | 0 件 | PASS (3 grep すべて 0 hits) |
| `bash scripts/verify-pr-ready.sh` | exit 0 | pending (Phase 13 user-gated) |
| staging curl (B 系) | 200 / 302 (404 禁止) | pending (user-gated) |
| local `admin_fetch_404` warn unit test | exit 0 | PASS (`safe-server-fetch.spec.ts`) |
| Sentry `admin_fetch_404` tag 24h | 0 件 | pending (user-gated) |

実装完了時に本表へ実測値を上書きし、`outputs/phase-11/evidence/local-validation-summary.txt` を同 wave に追加する。

## 関連 reference

- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`
- `.claude/skills/task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md`
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`
- 同型サンプル: `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/`
