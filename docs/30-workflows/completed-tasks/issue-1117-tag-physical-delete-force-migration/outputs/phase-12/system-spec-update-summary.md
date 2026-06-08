# システム仕様更新サマリー — tag physical delete force-migration（参照付き tag の強制移行）

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

> 本サイクルで `docs/00-getting-started-manual/specs/01-api-schema.md` への正本同期を完了した。local code / focused tests / 正本 spec は同一 wave で整合済み。staging runtime、production mutation、commit / push / PR は user-gated。

## Step 1-A: 正本仕様の更新結果

`docs/00-getting-started-manual/specs/01-api-schema.md` の Admin Member Tag Write API 節へ、以下を同期した。

| 対象 | 同期内容 |
| --- | --- |
| 不変条件（tag write） | `tagDefinitions.ts` の write 関数に `forceMigrateAndPhysicalDeleteTagDefinition` を追加。強制移行は移行先の参照付け替え（`INSERT OR IGNORE`+`DELETE` を `c.db.batch` 実行）後に `member_tags` 参照 0 を再検証してからのみ物理削除することを明記。`member_tags` は DB-FK 不在（PK(member_id,tag_id) のみ）ゆえアプリ層 COUNT ガードが参照防壁である旨も明記 |
| Endpoint | `DELETE /admin/tags/:tagId/physical?migrateTo=<destTagId>`（query で移行先を明示したときのみ強制移行 → COUNT=0 再検証 → physical delete の二段）を追記。`migrateTo` 未指定は issue-1070 既存挙動（参照あり → 409 `tag_has_references`）を完全保持する旨を明記（AC-7） |
| error code | `migration_target_not_found`(404) / `migration_target_inactive`(409) / `migration_target_same_as_source`(400) を追加 |
| audit action | `admin.tag.references_migrated`（before=`{tag_id:src, dest, referenceCount}` / after=`{migratedCount, deleted:true}`）を追加。強制移行成功時は references_migrated + 既存 physically_deleted の 2 件を記録する旨を明記 |
| 冪等性 | 同一 (src,dest) 再実行は 2 回目 src 不在で 404 `tag_not_found`。`(member_id, dest)` PK 衝突は `INSERT OR IGNORE`+`DELETE` で孤児なく dest へ集約 |

> Step 1-A は **完了**。正本 spec への実書き込み済み。

## Step 1-B: 実装状況

| ファイル | 状態 |
| --- | --- |
| `apps/api/src/repository/tagDefinitions.ts` | 実装済み（`migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` + result union） |
| `apps/api/src/routes/admin/tags.ts` | 実装済み（`?migrateTo` 分岐 + error code 3 種 + audit action） |
| `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | 実装済み（force-migration cases 追加） |
| `apps/api/src/routes/admin/tags.contract.spec.ts` | 実装済み（force-migration contract + AC-7 regression 追加） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 同期済み（Step 1-A 差分を正本反映） |

## Step 1-C: 検証

| 検証 | 結果 |
| --- | --- |
| focused D1 Vitest | PASS。2 files / 25 tests（force-migration + AC-7 regression） |
| API typecheck | PASS: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| repo lint | PASS: `mise exec -- pnpm lint` |

## Step 2: 依存関係整合（新規インターフェース追加に該当）

本タスクは **新規インターフェース（repository 関数 2 + error code 3 + audit action 1 + endpoint query param `migrateTo`）を追加** するため Step 2 該当。

| 関連 | 状態 | 整合 |
| --- | --- | --- |
| issue-1070（= 親・tag reactivate + physical delete・completed） | landed | 本タスクは issue-1070 の `physicalDeleteTagDefinition` / `countMemberTagReferences` / `getTagDefinitionByIdRaw` / 409 `tag_has_references` 拒否経路を **再利用かつ温存**。強制移行は既存拒否経路の前段に積む |
| issue-1070 followup-001（= #1117・本タスク） | implemented_local_evidence_captured | 強制移行経路を `?migrateTo` query 分岐として追加。`migrateTo` 未指定は不変（AC-7） |
| `AuditAction`（`RepoBrand<string>`・enum なし） | 既存 | route literal union に `admin.tag.references_migrated` を足すのみ。brand 型変更不要 |
| `member_tags`（DB-FK 不在） | 既存 | 移行・ガードは全て application-level SQL。FK 追加は本タスクのスコープ外（別 Issue・U-3 相当） |

本タスクは issue-1070 の logical/physical delete contract を壊さず、強制移行を別 query 分岐に分離する。`member_tags` に DB-level FK がないため、`INSERT OR IGNORE`+`DELETE` の原子 batch と移行後 COUNT=0 再検証をアプリ層の参照整合防壁として正本化する。
