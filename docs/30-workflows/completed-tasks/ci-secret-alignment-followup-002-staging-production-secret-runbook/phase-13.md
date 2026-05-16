# Phase 13: commit / push / PR（ユーザー承認 gate）

## 目的

commit / push / PR の user-gated 境界を明示する。

> **G1 governance mutation user gate**: 本 Phase の全アクション（`git commit` / `git push` / `gh pr create`）はユーザー明示承認後にのみ実行する。AI エージェントによる先行実行禁止。

## 前提

- Phase 11 evidence 8 ファイルがすべて取得済
- Phase 12 Required Sections 1〜8 が作成済
- DoD（Phase 9）の全項目が `completed` verdict
- Issue #662 は **CLOSED のまま維持**（再オープン禁止。PR 本文で `Refs #662` 紐付け）

## ブランチ戦略

- base: `dev`（CLAUDE.md「既定 PR base は dev」に従う）
- feature branch 名: `docs/ci-secret-alignment-followup-002-staging-production-secret-runbook`（または `docs/cipr-fu-002-secret-runbook`）

## commit 設計

1 PR / 複数 commit でも単一 commit でもよい。推奨は単一 commit。

### commit message テンプレート

```
docs(ci-secret-alignment): add staging/production deploy secret provisioning runbooks (#662)

- runbooks/staging-secret-provisioning.md (new): web-cd / deploy-staging 用 CLOUDFLARE_API_TOKEN provisioning
- runbooks/production-secret-provisioning.md (new): web-cd / deploy-production 用 CLOUDFLARE_API_TOKEN provisioning
- parent index.md: link to 2 new runbooks
- spec dir: ci-secret-alignment-followup-002-staging-production-secret-runbook/ (phase-1..13 + index)
- unassigned spec: status -> consumed_by_workflow

Refs #662

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## PR 本文テンプレート

```markdown
## Summary

- Issue #662（CLOSED）で対象成果物が未作成のまま残っていた `staging` / `production` Environment 用 Cloudflare deploy secret provisioning runbook 2 本を canonical 化
- `staging-runtime-smoke` 用既存 runbook と同じ 7 章立て（目的 / 必要 secret 一覧 / 投入手順 / 投入確認 / 動作確認 / ローテーション運用 / 禁止事項）で並立構成（3 ファイル）
- implementation / NON_VISUAL / docs_plus_script_fix タスク。`apps/` / `packages` / `.github/workflows` への変更なし

## 変更ファイル

- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md`（新規）
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md`（新規）
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/index.md`（In-scope に 2 行追記）
- `docs/30-workflows/ci-secret-alignment-followup-002-staging-production-secret-runbook/`（spec phase-1..13 + index + outputs/phase-11/evidence/* + outputs/phase-12/*）
- `docs/30-workflows/unassigned-task/ci-secret-alignment-followup-002-staging-production-secret-runbook.md`（status を `consumed_by_workflow` に更新）

## Grep gate 結果

- G1 章立て diff: 空（completed）
- G2 secret literal: ヒット 0（completed）
- G3 env name クロスチェック: 期待通り（completed）
- G4 op 参照: 各 runbook 1 件以上ヒット（completed）
- G5 dirty code: 0 行（completed）
- G6 親 index 整合: 2 行ヒット（completed）

## Test plan

- [x] G1〜G6 grep gate を Phase 11 evidence として保存
- [x] DoD チェックリスト全項目 completed
- [x] `apps/` / `packages/` への差分 0 行
- [x] 実 secret 値・JWT 値が runbook 内に含まれない

Refs #662

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行コマンド（ユーザー承認後）

```bash
# 1. ブランチ作成（既に作業ブランチ上であればスキップ）
git switch -c docs/ci-secret-alignment-followup-002-staging-production-secret-runbook

# 2. 変更を stage（具体的なファイル名で。-A は使わない）
git add docs/30-workflows/ci-secret-alignment-followup-002-staging-production-secret-runbook/ \
        docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md \
        docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md \
        docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/index.md \
        docs/30-workflows/unassigned-task/ci-secret-alignment-followup-002-staging-production-secret-runbook.md

# 3. commit（HEREDOC 経由）
git commit -m "$(cat <<'EOF'
docs(ci-secret-alignment): add staging/production deploy secret provisioning runbooks (#662)

- runbooks/staging-secret-provisioning.md (new)
- runbooks/production-secret-provisioning.md (new)
- parent index.md: link to 2 new runbooks
- spec dir: ci-secret-alignment-followup-002-staging-production-secret-runbook/
- unassigned spec: status -> consumed_by_workflow

Refs #662

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4. push
git push -u origin HEAD

# 5. PR 作成
gh pr create --base dev --title "docs(ci-secret-alignment): staging/production deploy secret provisioning runbooks (#662)" \
  --body "$(cat <<'EOF'
[Phase 13 PR 本文を貼付]
EOF
)"
```

## 禁止事項

- `--no-verify` フラグの使用禁止（hook FAIL 時は原因を fix）
- force push 禁止
- `main` への直接 PR 禁止（base は `dev`）
- Issue #662 の再オープン禁止
- 実 secret 値の commit message / PR 本文混入禁止

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 13 |
| 状態 | runtime_pending |

## 実行タスク

- ユーザー承認後の commit / push / PR 手順を定義する。

## 参照資料

- `phase-12.md`

## 成果物/実行手順

- PR 本文テンプレートと禁止事項。

## 統合テスト連携

- Phase 13 の mutation は未実行。実行前の NON_VISUAL 検証は Phase 11/12 で完了。

- ユーザー承認後に commit / push / PR が完了している
- PR URL がユーザーに報告されている
- Issue #662 と PR が `Refs #662` で紐付いている
- workflow_state が `completed` に遷移している
