# Phase 12-2: System Spec Update Summary

task_id: `members-list-prototype-alignment`
date: 2026-05-26

## Step 1-A: 既存 spec 更新

| spec | result |
| --- | --- |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | `/members` implementation note を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | current workflow entry を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow entry を追加 |

## Step 1-B: 新規 spec 追加

`workflow-members-list-prototype-alignment-artifact-inventory.md` を追加する。

## Step 1-C: 削除 / 非推奨

`MemberTable` は legacy 互換として残すが、`/members` route からは非参照にした。

## Step 2: 新規 type 反映

N/A. `PublicMemberListItem` は変更しない。
