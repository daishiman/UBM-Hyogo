# Phase 3: 設計レビュー（Gate-A）

> Phase 2 設計を Phase 4（テスト作成）へ進めてよいか判定する。Gate-A は設計上 PASS とし、local 実装後の artifacts でも passed 化済み。

## レビュー観点と判定

| 観点 | 判定 | 根拠 |
|------|------|------|
| 矛盾なし | PASS | 不変条件 #13 を `tagDefinitions.ts` コメントと `specs/01-api-schema.md` の両方で「第3経路（tag master CRUD）」として同期再定義。code immutable 方針で member_tags 参照整合を維持 |
| 漏れなし | PASS | AC-1..AC-7 をすべて endpoint/repository/audit に写像（[Phase 2 §4.3](../phase-2/phase-2.md)）。migration 不要判定の根拠も明記 |
| 整合性あり | PASS | route → repository 直結（既存 admin 慣例）。状態所有権 `active` は tag_definitions のみ。audit は state 変化時のみ |
| 依存関係整合 | PASS | 親 issue-982（member_tags write + tag master read）完了済みの上に積む。`getTagDefinitionMaster` / `listAssignedTagsForMember` の `active=1` フィルタを再利用 |

## クリティカル確認事項（実装前に潰す）

### C-1: type-level readonly gate の影響（FB-SDK-07-4）

- `memberTags.ts` には `memberTags.readonly.test-d.ts` があり `insert*`/`update*`/`delete*`/`upsert*` を禁止。
- **`tagDefinitions.ts` には readonly gate が存在しない**（`grep` で `tagDefinitions` を参照する `*.test-d.ts` は 0 件）。
- → `createTagDefinition` / `updateTagDefinition` / `deactivateTagDefinition` を `tagDefinitions.ts` に追加しても type-d test は FAIL **しない**。member_tags 側には新規 write を一切足さないため `memberTags.readonly.test-d.ts` も無影響。
- **判定**: 安全。ただし実装者は念のため `mise exec -- pnpm --filter @ubm-hyogo/api test -- --typecheck`（または既存 type-d 実行コマンド）で gate 無風化を確認すること。

### C-2: `/tags` と `/tags/queue` の routing 衝突

- 既存 `adminTagsQueueRoute` が `/tags/queue` と `/tags/queue/:queueId/resolve` を持つ。新 `adminTagsRoute` は `/tags`・`/tags/:tagId`。
- Hono の `/tags/:tagId` が `/tags/queue` を飲み込まないよう、mount 順 or path 設計を Phase 4 regression（`/tags/queue` が従来通り 200）で必ず確認。
- **判定**: `adminTagsQueueRoute` を `adminTagsRoute` より先に mount する案を採用（Phase 2 §5）。Phase 4 に `/tags/queue` regression test を必須化。

### C-3: code immutability の確定

- followup-002 は「code 変更可否は設計確定後」。本仕様は **immutable** を確定（PATCH は label/category のみ）。
- 理由: (1) code は UNIQUE で rename は 409 衝突リスク、(2) tag_id が PK で member_tags 参照は tag_id 経由のため code rename の実害は薄いが、code を識別子として使う seed/UI との整合を壊すリスクを回避、(3) MVP スコープ最小化。
- **判定**: immutable で確定。将来 rename 要件が出たら別タスク（未タスク候補に記載）。

### C-4: 論理削除と available 乖離（AC-3/AC-7）

- deactivate（active=0）後、`getTagDefinitionMaster`（`td.active=1`）から消える → `GET /admin/members/:id/tags` の available から消える。
- 既存 assigned（member_tags row）は保持 → assigned には残るが available には無い、という乖離が発生。
- **判定**: これは AC-3 で意図された挙動。AC-7（regression なし）も満たす（既存 GET の surface/フィルタは不変）。Phase 4 で「deactivate 後も member_tags row 保持」「available から消える」を test 化。

### C-5: audit の冪等性

- DELETE 再送（既に inactive）→ 204 だが audit は増やさない（`changed===false`）。
- PATCH で同値更新 → audit を増やすか? **実値が変化した時のみ append**（before≠after）。Phase 4 で no-op PATCH の audit 件数 0 を test 化。
- **判定**: state 変化時のみ audit = AC-5 と整合。

## Phase 4 への gate 判定

**PASS（実装サイクルで Gate-A を確定する前提の spec として承認）。** C-1..C-5 を Phase 4 のテストケースに織り込むこと。

## value/cost（戦略補足）

- 初回価値: tag master の read-only 制約を解消し、admin の tag 運用を自律化。
- 最大コスト部品: UI inline-create 導線 → **issue スコープ外**として分離（[Phase 12 unassigned](../phase-12/unassigned-task-detection.md)）。これにより本サイクルのコストを API 層に閉じ、1 実装サイクルで完結可能（CONST_007 充足）。
