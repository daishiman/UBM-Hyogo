# Lessons Learned: issue-982 admin MemberDrawer タグ pill 編集

## L-I982D-001: DELETE 204 No Content を success 扱いし JSON parse しない
- **状況**: `DELETE /admin/members/:memberId/tags/:tagId` が 204(body なし)を返すが、mutation hook が JSON parse して SyntaxError になり rollback が破綻した。
- **教訓**: `useAdminMutation` で `res.status === 204 ? undefined : await res.json()` の status-based type narrowing を入れ、冪等 DELETE の no-op success(204)を contract spec に明記し、regression spec で固定する。

## L-I982D-002: inactive tag assignment guard (tag_not_found 404)
- **状況**: soft-delete(active=1)済みの tag を付与しようとすると zombie tag が復活する恐れがあった。
- **教訓**: write API は `findTagDefinitionById` を `WHERE active=1` で検査し inactive は 404 tag_not_found を返す。409 member_is_deleted(member 状態) と 404 tag_not_found(tag 存在性) の境界を明確に分ける。

## L-I982D-003: canonical table は member_tags (旧 tag_assignments 残存ゼロ)
- **状況**: 旧名 tag_assignments が spec / code / docs に混在する恐れがあった。
- **教訓**: rename 時は Phase 8 refactor gate に `grep -rn old_name` を組み込み、`grep tag_assignments 01-api-schema.md = 0件` を DoD 化し、integration test で正テーブルへの INSERT を確認する。

## L-I982D-004: 不変条件 #13 再定義: queue suggestions と admin manual を別レーン分離
- **状況**: 「member_tags write は tagQueueResolve のみ」という単一ルールに、admin 手動付与/解除という第 2 レーンを追加する必要があった。
- **教訓**: 同一 table に複数 source から write する場合は source ごとに helper を分離(SRP)し、`assignTagsToMember`(AI/Form) と `assignTagToMemberByAdmin`(admin) を readonly test-d.ts の allow list で type-level に self-document し、JSDoc @internal guard を付与する。

## L-I982D-005: member-specific tag fetch で #981 にブロックされない設計
- **状況**: MemberDrawer の editable tags を #981(list enrichment)と並行実装する必要があった。
- **教訓**: `GET /admin/members/:memberId/tags` を独立 endpoint 化し `{assigned, available}` を同時返却して UI state を一度に初期化する。critical path の依存を「同一 endpoint」で吸収し、並行タスクを decouple する。

## L-I982D-006: CLOSED issue の same-cycle 実装で workflow_state を昇格
- **状況**: Phase 1-13 を `spec_created` で close-out した直後に実コード実装 + focused tests green まで到達した。
- **教訓**: 同一 wave で実装完了したら `spec_created` → `implemented_local_runtime_pending` に速やかに昇格し、api-endpoints.md を current local behavior として記述する。`spec_created` のままだと API docs が「target only / not current」と誤読される。

## L-I982D-007: 楽観更新 + rollback + pending state の MemberDrawer
- **状況**: tag 付与の network 遅延中の UI freeze と二重発火破綻を防ぐ必要があった。
- **教訓**: commit 前 state を useRef snapshot に保持し、失敗時は `setAssigned(rollbackRef.current)` で復帰する。`pendingTagId` state で「状態 + identifier」pair により複数 item 同時処理に対応し、double-click を disabled する。

## L-I982D-008: D1 focused test と web component test の config 分離
- **状況**: D1 harness(Miniflare native binding)は jsdom では動かない。
- **教訓**: API contract / repository は `vitest.d1.config.ts`(node env / setupD1)、web hook / component は `vitest.config.ts`(jsdom / fetch mock)へ config を分離する。19 passed(API D1) + 42 passed(web) を独立 config で緑保証する。
