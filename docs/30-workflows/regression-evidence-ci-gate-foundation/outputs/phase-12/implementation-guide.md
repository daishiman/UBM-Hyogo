# Implementation Guide

## Part 1: 中学生レベルの説明

この作業は、学校の発表資料を提出する前に「写真が4枚そろっているか」「チェック表に全部丸が付いているか」を確認する係を作るようなものです。見た目が前より崩れていないかを、毎回人の目だけに頼らず、決まった写真とチェックで比べられるようにします。

まず必要なのは「どの写真を撮るか」と「どのチェックを通ればよいか」を決めることです。今回はトップページ、会員一覧、会員詳細、管理画面の4つを対象にし、見た目チェック、色ルール、型チェック、整形チェック、ビルド、PR前チェックをそろえます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| Playwright | 画面を自動で開いて確認する係 |
| visual baseline | 正しい見た目として保存しておく写真 |
| CI gate | 提出前の自動チェック門 |
| required status check | 合格しないと進めないチェック項目 |
| evidence | 「本当に確認した」と示す記録 |

## Part 2: Technical implementation

Implement the workflow by adding or confirming four visual specs under `apps/web/playwright/tests/visual/`: `top.spec.ts`, `members-list.spec.ts`, `member-detail.spec.ts`, and `admin-dashboard.spec.ts`. Reuse the existing `mockApi` fixture and current Playwright config instead of adding a new server or workflow. The current `visual-chromium` project snapshot suffix is `-visual-chromium-linux.png`; do not document or copy `-chromium-linux.png` paths for these specs.

Baseline PNGs must be committed from the CI-compatible Chromium/Linux run, not from local macOS rendering. Phase 11 evidence must be copied into `docs/30-workflows/regression-evidence-ci-gate-foundation/outputs/phase-11/` and listed in the Phase 11 inventory with `present` only after the file physically exists.

| Screenshot evidence | Source baseline |
| --- | --- |
| `outputs/phase-11/screenshots/top.png` | `apps/web/playwright/tests/visual/top.spec.ts-snapshots/top-visual-chromium-linux.png` |
| `outputs/phase-11/screenshots/members-list.png` | `apps/web/playwright/tests/visual/members-list.spec.ts-snapshots/members-list-visual-chromium-linux.png` |
| `outputs/phase-11/screenshots/member-detail.png` | `apps/web/playwright/tests/visual/member-detail.spec.ts-snapshots/member-detail-visual-chromium-linux.png` |
| `outputs/phase-11/screenshots/admin-dashboard.png` | `apps/web/playwright/tests/visual/admin-dashboard.spec.ts-snapshots/admin-dashboard-visual-chromium-linux.png` |

Verification commands are defined in `phase-10-local-verification.md`: `pnpm typecheck`, `pnpm lint`, `pnpm verify:tokens`, `pnpm --filter @ubm-hyogo/web build`, Playwright visual with `PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/regression-evidence-ci-gate-foundation/outputs/phase-11/evidence`, and `bash scripts/verify-pr-ready.sh`. Branch protection mutation remains outside this workflow until explicit user approval.
