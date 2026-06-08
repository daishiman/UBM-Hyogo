# Phase 6 — テスト拡充

> **[実装区分: 実装仕様書]**（`implementation_mode: new`）。fail path / 回帰 guard / エッジケースを追加し、issue-1070 既存ガードの非破壊を保証する。

## 1. issue-1070 既存ガード spec の非破壊確認

DB-level FK を採用しない代わりに、issue-1070 の削除時 count guard を撤去せず共存させる（AC-4）。以下の既存 spec が緑のまま壊れていないことを確認する。

| 確認対象 | ファイル / ケース | 期待値（不変） |
|----------|-------------------|----------------|
| 削除拒否（409） | `tags.contract.spec.ts:362` 「DELETE /admin/tags/:tagId/physical refuses references」 | 参照あり tag は `status 409` / `{ ok:false, error:"tag_has_references", referenceCount:1 }` で拒否され、`admin.tag.physically_deleted` audit 0 件 |
| count guard repository | `tagDefinitions.write.repository.spec.ts:170` 「physically deletes only unreferenced...」 | `countMemberTagReferences(env.ctx, "tag_eng") === 1` / `physicalDeleteTagDefinition` が `{ ok:false, reason:"has_references", referenceCount:1 }` |
| route 登録順非干渉 | `tags.contract.spec.ts` の `:tagId/physical` 系 | `/tags/orphans` 追加後も `:tagId/physical` が正しく動作（capture 衝突なし・TC-C03 と相互確認） |

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts
```

## 2. member_tags INSERT 3 経路の tag_id 先在検証回帰（AC-3）

`member_tags.tag_id` の参照整合性は **route / workflow / repository helper の tag_id 先在検証**が担う（DB-level FK は持たない）。3 経路それぞれが「tag_definitions に存在しない tagId」を拒否する／健全 tagId のみ通すことを回帰 baseline 化する。

| 経路 | 入口 / 防壁 | 回帰 TC | 期待値 |
|------|-------------|---------|--------|
| `assignTagToMemberByAdmin`（issue-982） | route `members.ts:828` `tag_not_found` 404 ガード（`getTagDefinitionMaster` と突合） | TC-X01 | 不在 tagId への単一 assign リクエストは `404 { ok:false, error:"tag_not_found" }`。member_tags に行が増えない |
| `bulkApplyMemberTagsByAdmin`（issue-1036） | route `members.ts:719,740` `getTagDefinitionMaster` で active master と突合 | TC-X02 | 不在 tagId を含む bulk リクエストは当該 item が拒否され、孤児を生まない（既存 bulk contract の `tag_not_found` / skipped 挙動に準拠） |
| `assignTagsToMember`（tagQueueResolve / 07a workflow） | tag queue resolve が tag_definitions 解決後の tagId のみ渡し、helper 単体でも active tag master set で未定義 tagId を skip | TC-X03 / TC-R08 | resolve 済 tagId のみで INSERT され、未解決 tagId は member_tags に到達しない。helper へ未定義 tagId を混ぜても孤児 0 |

> **設計上の明記**: 防止の主経路は既存 route / workflow の回帰 baseline で確認し、`assignTagsToMember` には helper 誤用時の最小防壁を追加する。本タスクの主目的は「既存孤児の検出」だが、no-FK 架構では helper 単体が孤児を書かないことも AC-3 の一部として固定する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/routes/admin/members.contract.spec.ts
# bulk 経路に専用 contract spec が存在する場合はそれも対象に含める
grep -rln 'bulkApplyMemberTagsByAdmin\|members/tags/bulk' apps/api/src/routes/admin/*.spec.ts
```

## 3. エッジケース追加（orphan detection）

Phase 4 の TC-R01〜R07 に加え、AC-3 の helper 誤用防止を TC-R08 として補強する。TC-E/I の広い設計案は、今回の実装では TC-R 系と既存 contract spec へ集約する。

| TC-ID | 対象 | 入力 | 期待値 |
|-------|------|------|--------|
| TC-R01 | 健全・孤児混在 | 健全 1 行 + 孤児 1 行 | `detect` は孤児 1 行のみ（健全は除外） |
| TC-R02 | 全行健全 | 全 member_tags.tag_id が tag_definitions に存在 | `detect → []` |
| TC-R03 | count / detect 整合 | 健全 1 行 + 孤児 1 行 | `count → 1` / `count === detect.length` |
| TC-R04 | count 健全 | 全行健全 | `count → 0` |
| TC-R05 | tag_definitions 空 | member_tags 2 行 | 全 member_tags 行が孤児として返る |
| TC-R06 | ソート安定性 | 複数 member / tag の孤児 | `ORDER BY member_id, tag_id` で決定的順序 |
| TC-R07 | count / detect 同一 WHERE | 健全 1 行 + 孤児 3 行 | `count === detect.length === 3` |
| TC-R08 | `assignTagsToMember` 未定義 tag skip | 健全 tagId + 未定義 tagId | `applied === 1` / `countOrphanMemberTags(ctx) === 0` / 未定義 tagId 未 INSERT |

> **inactive tag の扱い**: 「孤児 = tag_id が tag_definitions に**行として存在しない**」であり、「tag が無効化（active=0）されている」こととは別概念。issue-1070 の deactivate は tag_id 行を残すため孤児を生まない。今回の実装では `NOT IN (SELECT tag_id FROM tag_definitions)` によりこの定義を固定する。

## 4. 不変条件テスト（孤児 0 件 invariant・AC-7）

repository spec の TC-R08 と既存 contract spec の green により、通常 write 経路・fixture が孤児を持ち込まないことを確認する。

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

## 完了条件（Phase 6）

- [ ] issue-1070 既存ガード spec（409 拒否 / count guard / route 登録順非干渉）の非破壊を確認した
- [ ] INSERT 3 経路（assignTagsToMember / assignTagToMemberByAdmin / bulkApplyMemberTagsByAdmin）の tag_id 先在検証回帰（TC-X01〜X03・AC-3）を設計した
- [x] TC-R01〜R08（孤児検出・count 整合・ソート・helper 未定義 tag skip）を追加した
- [x] 孤児 0 件 invariant を TC-R08 と focused contract green で確認した
- [ ] 検証コマンドを記載した
- [ ] 出力: [outputs/phase-6/test-expansion-result.md](outputs/phase-6/test-expansion-result.md)
