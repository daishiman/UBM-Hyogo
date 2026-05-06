# Phase 13: PR 作成 — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 13 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

route 拡張 / test 追加 / aiworkflow-requirements 同期を含む実装 PR の作成手順を仕様化する。本 PR は **G1〜G4 multi-stage approval gate** を本文に明記し、staging 実測 PASS と production 実測 PASS を **別々の user approval** として取得する設計とする。本仕様書 cycle では PR 作成は実行しない。

## 入力

- Phase 1〜12 全成果物
- `.claude/commands/ai/diff-to-pr.md`
- `outputs/phase-12/implementation-guide.md`

## Task 13-1: branch 名

- 既定: `spec/issue-495-09b-A-sentry-slack-prod-extension`（既存）
- 実装作業ブランチに昇格する場合: `feat/issue-495-09b-A-sentry-slack-prod-extension`

## Task 13-2: PR title

- 実装 PR: `feat(09b-A): production extension for sentry slack smoke route`
- 70 文字以内

## Task 13-3: PR body フォーマット

セクション順:

1. **Summary**: 1〜3 bullet
   - production 環境向けに `POST /admin/smoke/observability` を `x-smoke-production-confirm` gate 付で 200 経路化
   - Slack message prefix `[PRODUCTION SMOKE]` / Sentry environment tag `production` を実装
   - production secret 配置 runbook と staging→production の段階的 evidence 取得契約を整備
2. **Context**:
   - Issue #495（staging 確定 PR との関係）
   - 09b-A 本体 spec（staging）の継続性
   - 09c production deploy readiness blocker 更新
3. **Files Changed**: `git diff main...HEAD --name-only`
4. **Approval gates G1〜G4**:
   - G1: production secret 配置承認（merge 前提）
   - G2: staging smoke PASS evidence 確認（`outputs/phase-11/staging-smoke-log.md`）
   - G3: production smoke 実行承認（`outputs/phase-11/production-smoke-log.md` の G3 timestamp）
   - G4: redaction grep 0 / evidence 確定承認
   - **staging 実測 PASS と production 実測 PASS を別 user approval とする**
5. **Test Plan**:
   - `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`
   - `mise exec -- pnpm --filter @ubm-hyogo/api lint`
   - `mise exec -- pnpm exec vitest run apps/api/src/routes/admin/smoke-observability.test.ts`
   - redaction grep 3 系統 0 hit
   - `bash scripts/cf.sh secret list --env staging` / `--env production` の name-only 表示
   - staging smoke / production smoke 実測 PASS（G2 / G3 / G4 record）

## Task 13-4: PR 作成前 self-check

- [ ] grep gate 3 系統 0 hit（DSN / webhook / Slack token）
- [ ] vitest（T-01〜T-06）全 PASS
- [ ] `outputs/phase-11/main.md` に staging / production template が分離されている
- [ ] `outputs/phase-12/` 配下 7 ファイル実体存在
- [ ] aiworkflow-requirements 2 reference の diff が `system-spec-update-summary.md` と整合
- [ ] indexes rebuild 後 `git status` drift 0
- [ ] PR body に実 DSN / webhook / token / hash / project numeric id が含まれていない
- [ ] G1〜G4 が PR body に明記されている
- [ ] staging-smoke-log.md と production-smoke-log.md が **別 user approval** で取得される設計が PR body 上で明示されている

## Task 13-5: 承認 gate G-05（PR 作成許可）

- 条件: 13-4 self-check 全 PASS かつ user approval
- 自走禁止: `git commit` / `git push` / `gh pr create` を本仕様書 cycle で実行しない

## 成果物

- `outputs/phase-13/main.md`（PR title / body / branch / self-check / G-05 / G1〜G4 説明）

## 完了条件（本仕様書 cycle）

- `outputs/phase-13/main.md` が PR template として完成
- 本タスクで `git commit` / `git push` / `gh pr create` を実行していない

## 自走禁止操作（再掲）

- `git commit` / `git push` / `gh pr create`
- 実 production secret 投入 / production smoke 発火
- `wrangler` 直接実行

## 次工程

PR 作成後、user approval を経て runtime execution wave（G1→G2→G3→G4）に着手し、staging-smoke-log.md と production-smoke-log.md を順次実体化する。
