# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 13 / 13 |
| 目的 | base=dev へ PR を作成する（ユーザー明示承認後のみ） |
| 依存 | Phase 12 |
| user_approval_required | true |
| base branch | dev |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## ユーザー承認 gate

PR / commit / push の前に下記を取得:

- 承認文言: 「Approve Gate D — Issue #315 PR creation」
- 保存先: `outputs/phase-13/user-approval-issue-315-<YYYYMMDD-HHMM>.md`
- 承認内容: (1) commit message (2) PR base=dev (3) PR title / body 概要 (4) スコープアウト記録の承認

## PR 作成手順（CLAUDE.md PR autonomous flow 準拠）

1. `git fetch origin dev` → ローカル dev を ff
2. 作業ブランチへ戻り `git merge dev`、conflict は CLAUDE.md 既定方針で解消
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`
4. 残差は `git add -A` で全件 stage、`git commit`
5. `git diff dev...HEAD --name-only` で含めるファイル確認
6. PR 作成:

```bash
gh pr create --base dev --title "feat(issue-315): application audit_log cold storage to R2 (Object Lock 7y, redaction grep gate)" --body "$(cat <<'EOF'
## Summary
- application `audit_log` を D1 → R2 (Object Lock COMPLIANCE 7 年) に日次 export する cold storage 経路を新規実装
- 共通 PII redaction module (`apps/api/src/lib/audit/redact.ts`) を導入し UI 表示 / export 双方を一元化
- 2-phase commit manifest table (`0018_add_audit_log_export_manifest.sql`) で export 冪等性確保
- 外部 SIEM (Datadog/Splunk/Logpush) 連携は solo dev 無料運用ポリシーによりスコープアウト（却下記録）

Refs #315

## 変更ファイル
- `apps/api/migrations/0018_add_audit_log_export_manifest.sql` (new)
- `apps/api/src/lib/audit/redact.ts` (new)
- `apps/api/src/repository/auditLog.ts` (update: export 5 関数追加)
- `apps/api/wrangler.toml` (update: UBM_AUDIT_APP_COLD_STORAGE binding × 3 環境)
- `scripts/audit-log/export-to-r2.ts` (new)
- `.github/workflows/audit-log-cold-storage.yml` (new, schedule '0 3 * * *', dry_run default=true)
- `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md` (new)
- `docs/30-workflows/completed-tasks/task-07c-audit-log-external-siem.md` (update: status=superseded + canonical_workflow pointer)
- `docs/30-workflows/issue-315-audit-log-application-cold-storage/` (new workflow root, Phase 1-13)

## Test plan
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` GREEN
- [ ] `mise exec -- pnpm test scripts/audit-log` GREEN
- [ ] `mise exec -- pnpm typecheck` GREEN
- [ ] `mise exec -- pnpm lint` GREEN
- [ ] `bash scripts/verify-pr-ready.sh` GREEN
- [ ] redaction grep gate 0 hit
- [ ] staging で `gh workflow run audit-log-cold-storage.yml -f dry_run=true` GREEN
- [ ] production で workflow_dispatch dry_run=true → false 段階実行

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 不変条件

1. PR base は **dev**（production は別途 dev → main で release）
2. `Closes #315` を使わない（Issue は CLOSED 済み。`Refs #315` のみ）
3. ユーザー承認 marker (`outputs/phase-13/user-approval-issue-315-<timestamp>.md`) が物理存在しない限り commit / push しない
4. `--no-verify` 禁止
5. mutation 実行 evidence（Phase 11 §2.4〜2.6）が揃っていない場合は PR 作成しない

## 成果物

- `outputs/phase-13/pr-body.md`（実 PR body のスナップショット）
- `outputs/phase-13/user-approval-issue-315-<YYYYMMDD-HHMM>.md`（承認 evidence）

## 完了条件

- [ ] user approval marker 物理存在
- [ ] PR base=dev で作成
- [ ] PR body に `Refs #315` 記載
- [ ] PR URL 取得
- [ ] verify-pr-ready.sh GREEN

## 参照資料

- CLAUDE.md「PR作成の完全自律フロー」
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md` §2 Step 4（`Closes #<n>` 禁止）
