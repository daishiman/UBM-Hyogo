**[実装区分: 実装仕様書 / 状態: spec_created]**

# Phase 12: ドキュメント更新 / 集約 entry

issue #874 [FU-LOGIN-003] `/login` staging visual smoke (Cloudflare `dev`) evidence capture ワークフローの Phase 1-13 成果物・最終状態・受け入れ verdict を集約する index。本ファイルは Phase 12 の「指示書 (集約 entry)」として機能し、6 strict outputs のうち `phase12-task-spec-compliance-check.md` は同フォルダに併置する。Phase 12 strict 7 のうち、本 task では `phase-12.md` (= 本ファイル) と `phase12-task-spec-compliance-check.md` の 2 ファイルのみを作成し、`implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` は実装完了時に同 wave で追加する想定とする（本仕様書段階では未配置）。

## 状態

- 本仕様書時点: `spec_created` (Phase 1-13 全 spec の作成完了、実装 / staging deploy / smoke / evidence 取得は未着手)
- Phase 11 完了後の想定終端: `implemented_staging_visual_evidence_captured`
- 遷移先: `implementation_completed` (Phase 13 PR merge + user approval 後)

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
| 11 | `outputs/phase-11/phase-11.md` + (`outputs/phase-11/staging-screenshots/*.png` / `outputs/phase-11/evidence/*` は Phase 11 実行時取得) | spec ready / evidence pending |
| 12 | 本ファイル + `outputs/phase-12/phase12-task-spec-compliance-check.md` | done (spec) |
| 13 | `outputs/phase-13/phase-13.md` | done (spec) |

## 入口

- 実装着手者は **Phase 5** (実装ステップ) と **Phase 4** (実行コマンド suite) を併読
- レビュー者は本ファイルと `phase12-task-spec-compliance-check.md` (canonical 9 headings) を起点に
- PR 作成は **Phase 13** が手順書

## Part 1: 中学生レベル概念説明

このタスクは、UBM 兵庫支部会の Web サイトの「ログインページ」が、本番に近い練習場所（Cloudflare staging）でちゃんと見えるかどうかを「写真に撮って確かめる」しくみを整える作業です。

これまでは自分のパソコン (local) でログインページのスクリーンショット 8 枚を保存していました。でも自分のパソコンと本番は環境が違うため、本番に近い練習場所でも同じ見た目になっているかを別に確認する必要があります。本タスクでは、Playwright というブラウザ自動操作ツールに「保存場所を環境変数で切り替えられる」機能を 1 行だけ追加し、shell スクリプト `run-login-staging-smoke.sh` を使って staging 環境のページを撮影し、7 枚の PNG を本タスク専用フォルダに保存します。撮った 7 枚と local の 8 枚を目で見比べて、色や文字サイズが崩れていなければ完了です。

## Part 2: 技術者レベル要約

- spec env-override: `apps/web/playwright/tests/login-smoke.spec.ts` の `EVIDENCE_DIR` を `process.env.PLAYWRIGHT_EVIDENCE_DIR ? resolve(...) : <既存 local default>` に変更。`playwright.config.ts` は無改変
- shell helper: `scripts/run-login-staging-smoke.sh` を新規追加（`set -euo pipefail` / shellcheck clean / `pnpm --dir apps/web` 経由 / `--project=staging --grep 'renders LoginCard|captures mobile input' --reporter=line`）
- evidence path: `outputs/phase-11/staging-screenshots/` に local baseline と物理分離して 7 PNG を保存
- consumed trace: 親 workflow `completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-003 行と `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-003-staging-visual-smoke.md` を `consumed by issue-874-login-staging-visual-smoke` に更新
- user-gated boundary: staging deploy (`scripts/cf.sh deploy`) / smoke 本実行 / commit / push / PR

## Local validation (Phase 11 実行後に追記想定)

Phase 11 完了後、`outputs/phase-11/evidence/local-compat.log` および `outputs/phase-11/staging-smoke.log` を要約して本セクションに転記する想定:

> 例 (実行後): `pnpm typecheck` PASS / `pnpm lint` PASS / `shellcheck scripts/run-login-staging-smoke.sh` 0 finding / staging-target grep `login-smoke.spec.ts` 7 passed / staging smoke 7 passed / 7 PNG saved (each ≤ 500KB) / 目視 diff 全 OK。

## 重要不変条件 (本 task でも遵守)

1. 既存 API endpoint surface のみ利用 (新規 endpoint なし)
2. OKLch token 正本維持。本 task で design token 改変なし
3. `apps/web` から D1 直接アクセス禁止
4. test ファイルは `*.spec.{ts,tsx}` のみ（本 task は spec 改修のみ・新規 test ファイルなし）
5. Cloudflare CLI は `scripts/cf.sh` 経由。`wrangler` 直接禁止
6. 親 workflow (completed-tasks 配下) への consumed trace 追記は live ledger 扱いで許容

## 次 Phase への引き継ぎ

Phase 13 で base=`dev` の PR を user-gated で作成する。issue #874 は OPEN だが、本 task の AC 範囲（staging visual smoke + evidence）完了で `Closes #874` を PR 本文に含める方針とする（user 承認時に最終確定）。production smoke は本 task の scope 外として Phase 12 unassigned-task-detection で別 followup 化する。
