# workflow-issue-982-drawer-tag-pill-editing artifact inventory

作成日: 2026-05-29

## Summary

`issue-982-drawer-tag-pill-editing` is an `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` workflow. It formalizes and locally implements admin MemberDrawer tag pill editing, including tag write API, repository/audit changes, web optimistic UI, visual baseline spec, and invariant #13 redefinition. Staging visual baseline, commit, push, and PR remain user-gated.

The current local system exposes `GET/POST /admin/members/:memberId/tags` and `DELETE /admin/members/:memberId/tags/:tagId`. Runtime staging visual evidence, commit, push, and PR remain user-gated.

## Canonical workflow

| Artifact | Path | Status |
| --- | --- | --- |
| root | `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/` | present |
| index | `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md` | present |
| root artifacts | `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/outputs/artifacts.json` | present, mirrored |
| Phase 1-13 | `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/phase-*.md` | present |
| strict 7 | `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/outputs/phase-12/*.md` | present |
| task specs | `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/tasks/*.md` | present |

## Local implementation targets

| Target | Purpose |
| --- | --- |
| `apps/api/src/routes/admin/members.ts` | add member tag GET/POST/DELETE endpoints |
| `apps/api/src/repository/memberTags.ts` | add admin manual assign/unassign and master read functions |
| `apps/api/src/routes/admin/tags-queue.ts` | update invariant #13 comment |
| `apps/web/src/features/admin/api/members.ts` | add member tags client functions |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | make tag pills editable and remove `ALL_TAGS` |
| `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-edit.spec.ts` | visual baseline spec |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | document implemented endpoint contract after Gate-B |

## Current code anchors

| Anchor | Path |
| --- | --- |
| member route owner | `apps/api/src/routes/admin/members.ts` |
| tag queue route | `apps/api/src/routes/admin/tags-queue.ts` |
| member tag repository | `apps/api/src/repository/memberTags.ts` |
| MemberDrawer | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` |
| admin mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| tag primitive | `apps/web/src/features/admin/components/_shared/TagPill.tsx` |

## Gates

| Gate | Status | Boundary |
| --- | --- | --- |
| Gate-A | passed | spec package, strict 7, aiworkflow registration |
| Gate-B | pending | implementation, tests, local visual evidence |
| Gate-C | pending | commit, push, PR |

## Lessons Learned

- L-I982D-001: DELETE 204 No Content を `res.status === 204 ? undefined : await res.json()` で success 扱いし JSON parse しない。
- L-I982D-002: inactive tag 付与を `findTagDefinitionById WHERE active=1` で 404 tag_not_found へ閉じ、409 member_is_deleted と境界分離。
- L-I982D-003: canonical table は `member_tags`。旧 `tag_assignments` 残存ゼロを `grep` gate で DoD 化。
- L-I982D-004: 不変条件 #13 再定義。queue suggestions と admin manual を helper 単位で別レーン分離(SRP)。
- L-I982D-005: `GET /admin/members/:memberId/tags` を `{assigned, available}` 同時返却の独立 endpoint 化し #981 と decouple。
- L-I982D-006: CLOSED issue の same-cycle 実装で workflow_state を `spec_created` → `implemented_local_runtime_pending` に昇格。
- L-I982D-007: useRef snapshot rollback + `pendingTagId` pair で MemberDrawer の楽観更新と double-click 抑止。
- L-I982D-008: D1 test は `vitest.d1.config.ts`(node)、web test は `vitest.config.ts`(jsdom) に config 分離。

詳細: lessons-learned/lessons-learned-issue-982-drawer-tag-pill-editing-2026-05.md
