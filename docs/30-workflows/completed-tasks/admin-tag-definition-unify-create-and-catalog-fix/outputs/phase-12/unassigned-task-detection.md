# Unassigned Task Detection

workflow_id: `admin-tag-definition-unify-create-and-catalog-fix`

Detected unassigned tasks (current): **0**

## current — Phase 10 MINOR findings

Phase 10 raised no MINOR finding that escapes this cycle. The three reported problems (catalog crash, missing creation UI, split IA) are all in-scope and fully covered by Lane A/B/C within this single PR (no CONST_007 deferral). The one design-confirmation residue (`TagDefinitionItem` 型一本化) is resolved inside Lane A implementation step, not deferred.

| Candidate | Decision |
| --- | --- |
| Catalog `reduce` crash defensive fix | In scope (Lane A) |
| New-tag creation UI | In scope (Lane B) |
| tag-master + tag-catalog IA merge + nav + redirect | In scope (Lane C) |
| `TagDefinitionItem` type unification | Resolved in Lane A implementation step (reuse `tagCatalogLifecycle.ts`) |
| catalog redirect query carry-over | Closed as non-requirement; `/admin/tag-master` is canonical and old catalog deep-query preservation is outside AC |
| `TagCatalogRow` reuse vs absorb | Resolved: `TagCatalogRow` reused inside `TagDefinitionPanel` |
| `TagMasterEditForm` no-selection state | Resolved: retained as edit-form EmptyState; creation is owned by `TagDefinitionCreateForm` |

No backlog or Issue creation is required for current.

## baseline — future candidates (record only, out of this task's scope)

> Recorded for traceability. Not actionable in this workflow; `relatedIssue=null`, no Issue filed.

| Candidate | Why out of scope | Boundary |
| --- | --- | --- |
| B-1 タグキュー (AI 提案レビュー) の UI 整理 | Separate domain (state machine: enqueue/resolve). Invariant #9 keeps `/admin/tags` TagQueuePanel unchanged | Different domain — would dilute responsibility boundary |
| B-2 タグ ⇔ メンバー付与画面の整合 | `/admin/members` tag picker is a different surface; not part of tag-definition lifecycle | Out of Phase 1 §4 scope |
| B-3 GET `/admin/tags` のページング上限拡張 (UI 側 100 件固定) | Would touch API pagination contract / requires API discussion | Invariant #1 (no API change) |

No Issue is filed for baseline items in this wave (`relatedIssue=null`, staging-observation origin).
