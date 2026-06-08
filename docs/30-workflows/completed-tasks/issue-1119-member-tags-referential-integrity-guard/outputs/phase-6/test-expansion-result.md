# Phase 6 出力 — テスト拡充詳細（回帰 guard / fail path）

タスク: `task-issue-1119-member-tags-referential-integrity-guard`

## 1. issue-1070 既存ガード非破壊（AC-4）

| 確認対象 | ファイル / ケース | 期待値（不変） |
|----------|-------------------|----------------|
| 削除拒否 409 | `tags.contract.spec.ts:362` | `409` / `{ ok:false, error:"tag_has_references", referenceCount:1 }` / audit 0 件 |
| count guard repository | `tagDefinitions.write.repository.spec.ts:170` | `countMemberTagReferences === 1` / `physicalDeleteTagDefinition → { ok:false, reason:"has_references", referenceCount:1 }` |
| route 登録順非干渉 | `:tagId/physical` 系 | `/tags/orphans` 追加後も `:tagId/physical` 正常動作（capture 衝突なし） |

## 2. INSERT 3 経路の tag_id 先在検証回帰（AC-3）

参照整合性の**防止**は route/workflow/repository helper 層が担い、DB-level FK は持たない。3 経路の防壁が健在であることを回帰 baseline 化する。

| 経路 | 防壁の所在 | TC | 期待値 |
|------|-----------|----|--------|
| `assignTagToMemberByAdmin` | `members.ts:828` `tag_not_found` 404（`getTagDefinitionMaster` 突合） | TC-X01 | 不在 tagId 単一 assign → `404 { ok:false, error:"tag_not_found" }` / member_tags 行増えず |
| `bulkApplyMemberTagsByAdmin` | `members.ts:719,740` `getTagDefinitionMaster` で active master 突合 | TC-X02 | 不在 tagId を含む bulk → 当該 item 拒否 / 孤児を生まない |
| `assignTagsToMember` | tagQueueResolve（07a）が解決済 tagId のみ渡し、helper 単体でも active tag master set で未定義 tagId を skip | TC-X03 / TC-R08 | 未解決 tagId は member_tags に到達しない。helper へ未定義 tagId を混ぜても孤児 0 |

> 防止の主経路は既存 route / workflow の回帰確認であり、`assignTagsToMember` には helper 誤用時の最小防壁を追加する。既存 contract spec にカバーがあれば参照のみ、未カバー部分のみ最小追加する。

検証:
```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/members.contract.spec.ts
grep -rln 'bulkApplyMemberTagsByAdmin\|members/tags/bulk' apps/api/src/routes/admin/*.spec.ts
```

## 3. エッジケース（orphan detection / implemented mapping）

| TC-ID | seed | 期待値 | 意図 |
|-------|------|--------|------|
| TC-R01 | 健全 1 + 孤児 1 | detect は孤児 1 のみ | 混在分離 |
| TC-R02 | 全 member_tags.tag_id が定義済 | `detect → []` | 全健全 |
| TC-R03 | 健全 1 + 孤児 1 | `count → 1` / `count === detect.length` | count / detect 整合 |
| TC-R04 | 全 member_tags.tag_id が定義済 | `count → 0` | count 健全 |
| TC-R05 | tag_definitions 空 + member_tags 2 行 | 全 member_tags 行を孤児として返す | 空 master 時の定義 |
| TC-R06 | 複数 member / tag の孤児 | `ORDER BY member_id, tag_id` 決定順 | ソート安定性 |
| TC-R07 | 健全 1 + 孤児 3 | `count === detect.length === 3` | 同一 WHERE 句の整合 |
| TC-R08 | `assignTagsToMember` に健全 tagId + 未定義 tagId | `applied === 1` / `countOrphanMemberTags(ctx) === 0` / 未定義 tagId は未 INSERT | helper 誤用時の孤児発生防止 |

### inactive tag の設計意図（重要）

「孤児」= tag_id が tag_definitions に**行として存在しない**こと。issue-1070 の deactivate（`active=0`）は tag_id 行を残すため孤児を生まない。この区別は `NOT IN (SELECT tag_id FROM tag_definitions)` の実装定義で固定する。

## 4. 孤児 0 件 invariant（AC-7）

| 対象 | 期待値 |
|------|--------|
| `memberTags.orphan.repository.spec.ts` TC-R08 | helper 経由で未定義 tagId を渡しても `countOrphanMemberTags(ctx) === 0` |
| `members.contract.spec.ts` | `tag_a`/`tag_b` fixture は事前 tag_definitions 定義済みで既存 assertion 全 green |
| `tags.contract.spec.ts` | orphans endpoint の意図的孤児検出と既存 409 guard が共存 |

## 5. 検証コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.contract.spec.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

## 6. 期待結果

| spec | 期待 |
|------|------|
| orphan repository（TC-R01〜R08） | 8 tests PASS |
| tags.contract（orphans + 既存 1070 ガード） | 全 PASS |
| members.contract（fixture + 3 経路回帰） | 全 PASS |
| tagDefinitions.write（count guard） | 全 PASS（非破壊） |
