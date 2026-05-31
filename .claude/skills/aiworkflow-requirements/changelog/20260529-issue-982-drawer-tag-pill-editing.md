# 2026-05-29 issue-982-drawer-tag-pill-editing

`docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/` を `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` として登録。Issue #982（CLOSED 維持、PR 文脈は `Refs #982`）の MemberDrawer tag pill 編集を、tag write API 3 endpoint、`member_tags` / `tag_definitions` 正本、audit action、web optimistic UI、visual baseline、invariant #13 の queue / admin manual 分離として Phase 1-13 + Phase 12 strict 7 で正本化し、同 wave で実コード・focused tests へ反映した。

Current API として `GET/POST /admin/members/:memberId/tags`、`DELETE /admin/members/:memberId/tags/:tagId` を追加。POST は active な `tag_definitions` のみ付与可能、DELETE 204 は web `useAdminMutation` で no-body 成功扱いに補正済み。staging visual baseline、commit、push、PR は user-gated。

## Lessons Learned

苦戦箇所を `lessons-learned/lessons-learned-issue-982-drawer-tag-pill-editing-2026-05.md` に L-I982D-001..008 として新規集約し、`workflow-issue-982-drawer-tag-pill-editing-artifact-inventory.md` に `## Lessons Learned` 節を追加した。

- L-I982D-001: DELETE 204 No Content を `res.status === 204 ? undefined : await res.json()` で success 扱いし JSON parse しない。
- L-I982D-002: inactive tag 付与を `findTagDefinitionById WHERE active=1` で 404 tag_not_found へ閉じ、409 member_is_deleted と境界分離。
- L-I982D-003: canonical table は `member_tags`。旧 `tag_assignments` 残存ゼロを `grep` gate で DoD 化。
- L-I982D-004: 不変条件 #13 再定義。queue suggestions と admin manual を helper 単位で別レーン分離(SRP)。
- L-I982D-005: `GET /admin/members/:memberId/tags` を `{assigned, available}` 同時返却の独立 endpoint 化し #981 と decouple。
- L-I982D-006: CLOSED issue の same-cycle 実装で workflow_state を `spec_created` → `implemented_local_runtime_pending` に昇格。
- L-I982D-007: useRef snapshot rollback + `pendingTagId` pair で MemberDrawer の楽観更新と double-click 抑止。
- L-I982D-008: D1 test は `vitest.d1.config.ts`(node)、web test は `vitest.config.ts`(jsdom) に config 分離。

詳細: lessons-learned/lessons-learned-issue-982-drawer-tag-pill-editing-2026-05.md
