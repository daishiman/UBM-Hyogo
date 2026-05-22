# Phase 12 — System Spec Update Summary

## Step 1-A: 完了記録

| 対象 | 更新内容 |
| --- | --- |
| `docs/00-getting-started-manual/lefthook-operations.md` | `skill indexes drift gate — trigger 条件と復旧 SOP` を追加 |
| `lefthook.yml` | `indexes-drift-guard.fail_text` に runbook 詳細リンクを追加 |
| `scripts/hooks/indexes-drift-guard.sh` | ユーザー向け復旧コマンド表記を `mise exec -- pnpm indexes:rebuild` に統一 |
| `docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/artifacts.json` | workflow state / phase outputs を追加 |
| `docs/30-workflows/ut-cicd-drift-impl-verify-indexes-trigger/outputs/artifacts.json` | root artifacts の full mirror |
| `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER.md` | consumed trace と canonical workflow path を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set に本 workflow を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Indexes drift recovery SOP 早見を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴に本 workflow sync を追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260517-verify-indexes-trigger-recovery-sop.md` | 本 workflow sync の履歴ファイルを追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active/current workflow 行を追加 |

## Step 1-B: 実装状況テーブル更新

`spec_created` ではなく、runbook と hook config の local implementation を含むため `implemented_local_evidence_captured / implementation / NON_VISUAL` に再分類した。

## Step 1-C: 関連タスク更新

| タスク | 状態 |
| --- | --- |
| `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER` 起票元 | `consumed`。canonical workflow path を追記 |
| `U-VIDX-01` | 継続。branch protection / Actions smoke は本タスク範囲外 |
| `U-VIDX-02` | 継続。他 skill indexes gate ADR は本タスク範囲外 |

## Step 1-H: Skill Feedback Routing

新規 skill rule は不要。既存 `task-specification-creator` の Phase 12 strict 7 / same-wave sync / docs-only再分類 rule に従い、本 workflow 側へ不足成果物を追加した。

## Step 2: システム仕様更新

**判定: N/A**

理由:

- 新規 TypeScript interface / API endpoint / DB schema / Cloudflare runtime config は追加していない。
- 既存 CI workflow と hook script は current contract と一致し、変更対象は runbook と hook fail text のみ。
- aiworkflow-requirements には searchability / workflow ledger / quick reference の同期のみを行う。

## Artifacts Parity

`artifacts.json` と `outputs/artifacts.json` は両方存在し、内容一致を `cmp -s artifacts.json outputs/artifacts.json` で確認する。root が編集正本、outputs 側は Phase evidence mirror として同値維持する。
