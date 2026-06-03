# Phase 10: 最終レビュー / Gate 判定

> AC-1..AC-7 の達成可否を実装箇所・テストへ写像して確認し、MINOR 指摘を Phase 12 未タスク化対象として切り出す。local 実装・検証は Phase 11 で完了済み。

## 1. AC 達成チェックリスト（AC → 実装箇所 → テスト）

| AC | 内容 | 実装箇所 | 検証テスト | 判定 |
|----|------|---------|-----------|------|
| AC-1 | `POST /admin/tags { code, label, category }` で persist、`code` 衝突は 409 `tag_code_conflict` | `routes/admin/tags.ts` POST + `repository.createTagDefinition`（UNIQUE catch → `code_conflict`） | `tags.contract.spec.ts`: 201 作成 / 既存 code → 409 / `tagDefinitions.write.repository.spec.ts`: INSERT + UNIQUE 衝突 | ✅ 写像済 |
| AC-2 | `PATCH /admin/tags/:tagId { label?, category? }` 更新、`code` immutable | `routes/admin/tags.ts` PATCH（body schema に `code` 無し）+ `repository.updateTagDefinition`（SET は label/category のみ） | contract: label/category 更新 / `code` 送出は schema で無視（受理されない）/ 両方未指定 → 400 `no_update_fields` | ✅ 写像済 |
| AC-3 | `DELETE /admin/tags/:tagId` は論理削除（`active=0`）、assigned `member_tags` 保持 | `routes/admin/tags.ts` DELETE + `repository.deactivateTagDefinition`（`active=1→0` のみ UPDATE、member_tags 非接触） | contract: 204 / repository: deactivate 後も member_tags row 保持・available から消える（C-4） | ✅ 写像済 |
| AC-4 | `GET /admin/tags` が pagination + search を受理し `{ total, items }` | `routes/admin/tags.ts` GET（`ListTagsQueryZ`）+ `repository.listTagDefinitionsPaged`（count + LIMIT/OFFSET） | contract: q / page / pageSize 各分岐、`{ total, items }` shape | ✅ 写像済 |
| AC-5 | write で audit `admin.tag.created/updated/deactivated` を actor + tagId で 1 件、state 変化時のみ | 各 endpoint の `appendTagAudit`（targetType `tag`）。PATCH は値変化時、DELETE は `changed===true` 時のみ | contract: 各 write の audit 1 件 / no-op PATCH・既 inactive DELETE で audit 0（C-5） | ✅ 写像済 |
| AC-6 | D1 直接アクセスは `apps/api` に閉じる、`apps/web` 非接触 | write は `repository/tagDefinitions.ts` のみ。`apps/web` 変更ゼロ | Phase 9 §4 grep gate（`apps/web` に tag-master-write 参照 0 hit） | ✅ 写像済 |
| AC-7 | 既存 `GET /admin/members/:memberId/tags`（issue-982）に regression 無し | 既存 route 無変更。`getTagDefinitionMaster` の `active=1` フィルタ再利用のみ | `members.tags.contract.spec.ts`（regression / Phase 9 §2） | ✅ 写像済 |

## 2. MINOR 指摘 → Phase 12 未タスク化対象（unassigned-task-guidelines 準拠）

本タスクのスコープ外であり、別 follow-up として切り出す（本サイクルでは実装しない）。詳細は `outputs/phase-12/unassigned-task-detection.md` に登録する。

| # | 候補 | 種別 | スコープ外の根拠 |
|---|------|------|-----------------|
| U-1 | **admin UI の tag inline-create 導線** | UI / `apps/web` | 本タスクは API 層に閉じる（NON_VISUAL）。最大コスト部品（Phase 3 value/cost）であり分離することで 1 実装サイクル完結を担保。issue #1035 は API endpoint 新設が主題で UI 導線は含まない |
| U-2 | **tag `code` の rename 要件（immutable 解除）** | API / 設計変更 | C-3 で `code` immutable を確定。rename は UNIQUE 衝突リスク + seed/UI 整合破壊リスクがあり、要件が出た時点で別タスクの設計レビューを要する |
| U-3 | **tag の物理削除 / reactivate（active=0→1 復帰）** | API | AC-3 は論理削除（active=0）のみ。物理 DELETE と再有効化は issue スコープ外。member_tags 参照整合・available 復帰の設計判断が別途必要 |

> いずれも MINOR（本 AC を阻害しない）であり、本実装の AC-1..AC-7 充足を妨げない。

## 3. blocker 判定（CONST_007 充足）

- 変更対象は `apps/api` の repository 1 ファイル編集 + route 1 ファイル新規 + 型 1 行追加 + mount 1 行 + spec 1 節 + test 2 ファイル新規。**外部依存・前提タスク待ちは無い**（親 issue-982 完了済）。
- 設計上の未確定点（code immutability / 論理削除 available 乖離）は Phase 3 の C-3 / C-4 で確定済み。
- routing 衝突（`/tags` vs `/tags/queue`）は mount 順 + Phase 4 regression で解消方針確定済み。
- → **本サイクル内で全 AC を 1 実装サイクルで完了できる。blocker 無し（CONST_007 充足）**。

## 4. Gate 判定

| Gate | 判定 | 備考 |
|------|------|------|
| Gate-A（設計レビュー） | **PASS** | Phase 3 で C-1..C-5 を解消 |
| Gate-B（品質保証） | **PASS** | focused D1 Vitest / typecheck / lint PASS |
| Gate-C（最終レビュー） | **PASS** | Phase 12 strict 7 と正本 spec 同期完了 |

## 5. runtime boundary

local 実装・focused D1 Vitest・typecheck・lint は完了済み。staging deploy / runtime smoke / commit / push / PR / Issue #1035 状態変更は user-gated。
