# Phase 12 Output: System Spec Update Summary

## Step 1-A

Workflow specification and local outputs were created for `utgov001-second-stage-reapply`.

| 同期対象 | 状態 | 証跡 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | done | `utgov001-second-stage-reapply` spec_created 行を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | done | 変更履歴 `v2026.04.30-utgov001-second-stage-reapply` |
| `.claude/skills/task-specification-creator/SKILL.md` | done | approval-gated NON_VISUAL implementation 事例を変更履歴へ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | done | canonical task root 表に本 workflow を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | done | UT-GOV-001 second-stage reapply 早見を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | done | Phase 13 approval gate 付き active workflow として追加 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | done | aiworkflow-requirements 側 headline log へ追加 |
| topic-map / keywords | generated | `generate-index.js` 実行対象。quick-reference 追記後に再生成する |

## Step 1-B

No implementation status is marked completed because real PUT is blocked until Phase 13 approval.

| 状態 | 意味 |
| --- | --- |
| `spec_created` | Phase 1-13 仕様書と reserved evidence paths は作成済み |
| `blocked_until_user_approval` | Phase 13 でユーザー明示承認があるまで実 PUT / commit / push / PR 禁止 |
| `applied` | Phase 13 で fresh GET / PUT / applied GET / drift-check が完了した状態 |
| `completed` | applied evidence 反映と PR merged 後にのみ使用 |

## Step 1-C

Related task references: UT-GOV-001, UT-GOV-004, Issue #202. Final aiworkflow-requirements reflection is deferred until applied GET evidence exists.

| 関連タスク | 今回の扱い |
| --- | --- |
| UT-GOV-001 first apply | `contexts=[]` fallback の後追い是正元として参照 |
| UT-GOV-004 | confirmed contexts (`ci`, `Validate Build`, `verify-indexes-up-to-date`) の上流正本 |
| Issue #202 | CLOSED のまま。仕様書化 / 実 PUT 完了はコメントで二段階記録予定 |
| `task-utgov001-references-reflect-001` | Phase 13 applied GET evidence 後の references final sync |
| `task-utgov001-drift-fix-001` | drift 検出時のみ発火 |
| `task-utgov-downstream-precondition-link-001` | UT-GOV-005〜007 への上流前提リンク追記 |

## Step 2

No immediate aiworkflow-requirements reference edit is performed in this phase. The final branch protection state must be reflected only after Phase 13 captures applied GET evidence.

Phase 12 では external state の最終値を推測で `deployment-branch-strategy.md` へ書かない。GitHub GET を最終正本とし、`branch-protection-applied-{dev,main}.json` と drift-check が揃った後に別タスクで反映する。
