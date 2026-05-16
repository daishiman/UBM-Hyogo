# Phase 11: Evidence 収集（grep gate 結果）

## 目的

NON_VISUAL evidence を tracked text files として保存する。

## Evidence canonical paths

本実行サイクルで以下パスに evidence を保存する。runbook 文書化は docs-only / NON_VISUAL のため、runtime deploy 実行ではなく tracked read-only grep gate を正本 evidence とする。

| ファイル | 内容 | 取得コマンド |
|---------|------|-------------|
| `outputs/phase-11/evidence/g1-heading-diff.txt` | G1 章立て diff（staging / production それぞれ） | Phase 6 G1 コマンド |
| `outputs/phase-11/main.md` | Phase 11 summary / evidence inventory | manual write |
| `outputs/phase-11/manual-smoke-log.md` | NON_VISUAL manual/static smoke matrix | manual write + command results |
| `outputs/phase-11/link-checklist.md` | Source-to-target link and sync checklist | manual write + grep results |
| `outputs/phase-11/evidence/g2-secret-literal-grep.txt` | G2 secret 様文字列 grep 結果 | Phase 6 G2 コマンド |
| `outputs/phase-11/evidence/g3-env-name-grep.txt` | G3 environment 名クロスチェック結果 | Phase 6 G3 コマンド |
| `outputs/phase-11/evidence/g4-op-reference-grep.txt` | G4 `op://` 参照 grep 結果 | Phase 6 G4 コマンド |
| `outputs/phase-11/evidence/g5-dirty-code.txt` | G5 `git status --porcelain apps/ packages/` 結果（空であること） | Phase 6 G5 コマンド |
| `outputs/phase-11/evidence/g6-parent-index-grep.txt` | G6 親 index.md からの runbook 参照 grep 結果 | Phase 6 G6 コマンド |
| `outputs/phase-11/evidence/git-diff-name-only.txt` | 本 PR に含まれる変更ファイル一覧 | `git diff dev...HEAD --name-only` |
| `outputs/phase-11/evidence/unassigned-spec-status-update.txt` | 元 unassigned spec の status 更新差分 | `git diff dev...HEAD -- docs/30-workflows/unassigned-task/ci-secret-alignment-followup-002-staging-production-secret-runbook.md` |

## NON_VISUAL 代替 evidence（visualEvidence=NON_VISUAL）

本タスクは VISUAL evidence（screenshot 等）を取得しない。代替 evidence は上記 grep gate ログ 6 種 + git diff 2 種で合計 8 ファイル。

## Evidence 取得コマンド集約スクリプト案

実装サイクルで以下を 1 コマンドで実行できると望ましい（実装は別 task に任せ、本タスクでは手動実行で良い）:

```bash
cd <workflow root>
mkdir -p outputs/phase-11/evidence
RUNBOOK_DIR=docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks

# G1
{ diff <(grep -E '^## ' "$RUNBOOK_DIR/secret-provisioning.md" | sed 's/（.*）//') \
       <(grep -E '^## ' "$RUNBOOK_DIR/staging-secret-provisioning.md" | sed 's/（.*）//'); \
  echo "---"; \
  diff <(grep -E '^## ' "$RUNBOOK_DIR/secret-provisioning.md" | sed 's/（.*）//') \
       <(grep -E '^## ' "$RUNBOOK_DIR/production-secret-provisioning.md" | sed 's/（.*）//'); } \
  > outputs/phase-11/evidence/g1-heading-diff.txt

# G2
rg -n '([A-Fa-f0-9]{32,}|eyJ[A-Za-z0-9_-]+|[A-Za-z0-9_-]{40,})' \
  "$RUNBOOK_DIR/staging-secret-provisioning.md" \
  "$RUNBOOK_DIR/production-secret-provisioning.md" \
  | rg -v 'op://|CLOUDFLARE_API_TOKEN|Cloudflare API Token|secret-provisioning|deploy-production|deploy-staging|staging-runtime-smoke' \
  > outputs/phase-11/evidence/g2-secret-literal-grep.txt || true

# G3
{ grep -nE -- '--env staging\b' "$RUNBOOK_DIR/staging-secret-provisioning.md"; \
  echo "---"; \
  grep -nE -- '--env production\b' "$RUNBOOK_DIR/production-secret-provisioning.md"; } \
  > outputs/phase-11/evidence/g3-env-name-grep.txt

# G4
grep -nE 'op://UBM-Hyogo/Cloudflare API Token' \
  "$RUNBOOK_DIR/staging-secret-provisioning.md" \
  "$RUNBOOK_DIR/production-secret-provisioning.md" \
  > outputs/phase-11/evidence/g4-op-reference-grep.txt

# G5
{ git status --porcelain apps/ packages/; git status --porcelain scripts/smoke/provision-staging-secrets.sh; } > outputs/phase-11/evidence/g5-dirty-code.txt

# G6
grep -nE 'runbooks/(staging|production)-secret-provisioning\.md' \
  docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/index.md \
  > outputs/phase-11/evidence/g6-parent-index-grep.txt

# changed files, including untracked artifacts
{ git diff --name-only; echo "--- untracked ---"; git ls-files --others --exclude-standard; } > outputs/phase-11/evidence/git-diff-name-only.txt
```

## 期待 evidence サマリ

| ファイル | 期待 |
|---------|------|
| g1 | diff 結果が空（章立て完全一致） |
| g2 | grep ヒット 0 行 |
| g3 | staging 側に `--env staging`、production 側に `--env production` のみ |
| g4 | 各 runbook で 1 件以上ヒット |
| g5 | `apps/` / `packages/` は 0 行。`scripts/smoke/provision-staging-secrets.sh` のみ stale CLI contract correction として許容 |
| g6 | 2 行（staging / production runbook 参照） |
| git-diff-name-only | tracked diff + untracked workflow dir + 新規 staging/production runbook 2 本を含む |

## workflow_state 遷移

- 本 spec 作成時点: `spec_created`
- 本実行サイクル完了時（evidence 8 ファイル取得 + DoD PASS）: `completed`
- evidence 不足や grep gate FAIL がある場合: `runtime_pending`（PASS 単独表記禁止）

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 11 |
| 状態 | completed |

## 実行タスク

- G1 から G6 と git diff evidence を保存する。

## 参照資料

- `phase-6.md`

## 成果物/実行手順

- `outputs/phase-11/evidence/*`

## 統合テスト連携

- NON_VISUAL 代替 evidence として grep gate を採用する。

- evidence canonical path が 8 件定義されている
- 取得コマンド集約スクリプトが記述されている
- workflow_state 遷移条件が明示されている
