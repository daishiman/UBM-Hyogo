# workflow-issue-1036-bulk-member-tag-assign artifact inventory

作成日: 2026-06-01

## Summary

`issue-1036-bulk-member-tag-assign` is an `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` workflow. It extends the single-member admin manual tag write (parent issue-982) to a **multi-member × multi-tag bulk write**: a batch endpoint, repository helper with partial-success reporting, a tag master read endpoint, mutation-scoped audit with `batchId` correlation, a web BulkActionBar tag picker, and invariant #13 third-path documentation. Staging authenticated visual baseline, commit, push, and PR remain user-gated. Issue #1036 stays CLOSED (reopen 禁止; PR uses `Refs #1036`).

The current local system exposes `POST /admin/members/tags/bulk` and `GET /admin/tags` in addition to the existing single-member `GET/POST /admin/members/:memberId/tags` and `DELETE /admin/members/:memberId/tags/:tagId`. Bulk idempotency is implemented via `member_tags` composite-PK natural idempotency (no dependency on #913 server idempotency store).

## Canonical workflow

| Artifact | Path | Status |
| --- | --- | --- |
| root | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` | present |
| index | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/index.md` | present |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/artifacts.json` | present, mirrored |
| Phase 1-13 | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/phase-*.md` | present |
| strict 7 | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/*.md` | present |
| Phase 11 screenshots | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-11/screenshots/*.png` | present（4 local fixture PNG） |
| task specs | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/tasks/*.md` | present（task A/B/C） |

## Local implementation targets

| Target | Purpose |
| --- | --- |
| `apps/api/src/repository/memberTags.ts` | add `bulkApplyMemberTagsByAdmin`（partial-success, batchId-correlated audit, DB 自然冪等） |
| `apps/api/src/routes/admin/members.ts` | add `POST /admin/members/tags/bulk` + `GET /admin/tags`（route 順序: bulk を `:memberId` route より前） |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | invariant #13 第3経路を type-level allow list へ追加 |
| `apps/web/src/features/admin/api/members.ts` | add `bulkApplyMemberTags` / `fetchTagMaster` client functions |
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | tag picker（TagPill 再利用）+ assign/unassign 切替 + 部分失敗集計 |

## Current code anchors

| Anchor | Path |
| --- | --- |
| member route owner | `apps/api/src/routes/admin/members.ts` |
| member tag repository | `apps/api/src/repository/memberTags.ts` |
| BulkActionBar | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` |
| admin mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| tag primitive | `apps/web/src/features/admin/components/_shared/TagPill.tsx` |

## Gates

| Gate | Status | Boundary |
| --- | --- | --- |
| Gate-A | passed | spec package, strict 7, aiworkflow registration |
| Gate-B | passed | implementation, focused tests（API 17 + web 18 + type-level 6 = 41 PASS）, local visual fixtures |
| Gate-C | pending | staging visual baseline, commit, push, PR |

## Lessons Learned

- L-I1036-001: Hono は登録順マッチ。`POST /members/tags/bulk` を `:memberId/tags` route より前に登録し、`GET /admin/tags` は members prefix 外へ mount して collision を構造回避。
- L-I1036-002: bulk 再送冪等は #913 server idempotency store 非依存。`member_tags` 複合 PK + `INSERT OR IGNORE`/`DELETE` の `meta.changes` で AC-5 を DB 自然冪等として実現。
- L-I1036-003: 部分成功（AC-2）+ 実 mutation のみ audit（AC-3）を両立するため `db.batch()` でなく逐次 loop。tag master / 削除 map は loop 前に各 1 クエリ一括取得で N+1 回避。
- L-I1036-004: `correlation_id` 列を新設せず（D1 schema 変更禁止）、`batchId` を audit before/after payload に埋めて bulk 相関を担保。
- L-I1036-005: 不変条件 #13 第3経路（bulk admin write）を `bulkApplyMemberTagsByAdmin` helper 分離 + readonly `.test-d.ts` allow list で type-level 自己文書化。既存第1/第2経路は非破壊で温存。
- L-I1036-006: member skip 判定を tag 評価より先に行い、`skipped_deleted`（書込対象外）と `tag_not_found` の優先順位を固定。`isWriteTarget` ヘルパで意図明示。
- L-I1036-007: bulk picker は新規 primitive を生やさず既存 `TagPill` を `MemberTagsEditor` と同一 props で再利用、実行は `useAdminMutation` 経由（不変条件 #9/#10）。
- L-I1036-008: 結果は 5 値判別共用体（assigned/unassigned/noop/skipped_deleted/tag_not_found）。`GET /admin/tags` は read のみで tag master write（#1035）と責務分離。

詳細: lessons-learned/lessons-learned-issue-1036-bulk-member-tag-assign-2026-06.md
