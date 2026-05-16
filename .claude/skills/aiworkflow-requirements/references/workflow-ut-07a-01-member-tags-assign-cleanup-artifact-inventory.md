# UT-07A-FU-01 memberTags.assignTagsToMember Cleanup Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| task_id | UT-07A-FU-01 |
| workflow root | `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #294 CLOSED / PR text must use `Refs #294` |
| parent | `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/` |
| source completed task | `docs/30-workflows/completed-tasks/COMPLETED-UT-07A-01-member-tags-assign-cleanup.md` |
| Phase 13 | `blocked_pending_user_approval` (commit / push / PR は user-gated) |

## Workflow Artifacts

| Area | Paths |
| --- | --- |
| root docs | `index.md`, `phase-01.md` ... `phase-13.md`, `artifacts.json`, `README.md` |
| outputs ledger | `outputs/artifacts.json` |
| Phase 11 evidence | `outputs/phase-11/` (rg / typecheck / lint / focused test logs; `NON_VISUAL` のためスクリーンショットなし) |
| Phase 12 strict 7 | `outputs/phase-12/main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` |

## Contract Summary

| Contract | Value |
| --- | --- |
| runtime behavior | unchanged (D1 schema / SQL / route / D1 binding / UI contract いずれも no change) |
| invariant | #13 tag 書き込みは `tagQueueResolve` workflow 経由のみ |
| production caller | `apps/api/src/workflows/tagQueueResolve.ts` ただ 1 件 |
| boundary signal | repository ファイル冒頭コメント + `assignTagsToMember` 関数 JSDoc + `MemberTagsProvider.assignTagsToMember` JSDoc |
| type-level gate | `UnauthorizedAssignExports = Exclude<AssignExports, "assignTagsToMember">` (派生 `assign*` export 禁止) |
| caller boundary gate | repository spec で production caller を `repository/memberTags.ts` と `workflows/tagQueueResolve.ts` のみに限定 |
| keywords | UT-07A-FU-01, ut-07a-01-member-tags-assign-cleanup, memberTags, assignTagsToMember, tagQueueResolve, invariant-13 |

## Runtime Boundary

production runtime / D1 / route / UI への変更は 0。
commit / push / PR / Issue comment / staging deploy / production deploy はいずれも Phase 13 ユーザー承認まで実行しない (Phase 12 close-out で blocked_pending_user_approval を明示)。

## Code Artifacts

| File | Purpose |
| --- | --- |
| `apps/api/src/repository/memberTags.ts` | ファイル冒頭コメントと `assignTagsToMember` 関数 / `MemberTagsProvider.assignTagsToMember` JSDoc に「直接利用禁止・`tagQueueResolve` workflow 専用 helper」を明示 |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | `UnauthorizedAssignExports = Exclude<AssignExports, "assignTagsToMember">` type-level gate を追加し、派生 `assign*` export を tsc レイヤで遮断 |
| `apps/api/src/repository/__tests__/memberTags.repository.spec.ts` | production caller boundary gate (`repository/memberTags.ts` と `workflows/tagQueueResolve.ts` 以外の caller 出現で fail) を追加 |

## Implementation Guide Pointers

| Pointer | Path |
| --- | --- |
| Phase 12 implementation guide | `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-12/implementation-guide.md` |
| System spec update summary | `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-12/system-spec-update-summary.md` |
| Documentation changelog | `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-12/documentation-changelog.md` |
| Phase 12 strict compliance | `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Skill feedback report | `docs/30-workflows/ut-07a-01-member-tags-assign-cleanup/outputs/phase-12/skill-feedback-report.md` |

## Unassigned Task Trace

| Task spec | Path | Status |
| --- | --- | --- |
| 起票元 unassigned task | `docs/30-workflows/unassigned-task/UT-07A-01-member-tags-assign-cleanup.md` (削除済み) | consumed; `docs/30-workflows/completed-tasks/COMPLETED-UT-07A-01-member-tags-assign-cleanup.md` へ移行 |
| 発見元 Phase 12 | `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md` | parent seed; current workflow root へ consumed |
| 本サイクル再検出 (`assign*` 派生 gate) | inline-resolved within UT-07A-FU-01 | resolved in `memberTags.readonly.test-d.ts` type-level gate |
| 本サイクル残課題 | n/a | `outputs/phase-12/unassigned-task-detection.md` で "No unresolved follow-up remains" を宣言 |

## Lessons Learned

苦戦箇所と適用ルールは `references/lessons-learned-07a-tag-queue-resolve-2026-04.md` の L-07A-008 (stale 起票前提と current topology 乖離時の helper boundary clarification 再解釈) を参照。
苦戦箇所の正本記録は `docs/30-workflows/completed-tasks/COMPLETED-UT-07A-01-member-tags-assign-cleanup.md` の `## 苦戦箇所【記入必須】` セクション。
