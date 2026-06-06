# システム仕様更新サマリー — tag master reactivate + physical delete

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

## Step 1-A: 正本仕様の更新結果

`docs/00-getting-started-manual/specs/01-api-schema.md` の Admin Member Tag Write API 節を実更新した。

| 対象 | 更新内容 |
|------|----------|
| 不変条件 #13 | `tagDefinitions.ts` の write 関数に `reactivateTagDefinition` / `physicalDeleteTagDefinition` を追加し、physical delete は `member_tags` 参照 0 件のみ許可することを明記 |
| Endpoints | `POST /admin/tags/:tagId/reactivate` と `DELETE /admin/tags/:tagId/physical` を追加 |
| 冪等性 | reactivate no-op、logical delete と physical delete の `code` 占有差、参照あり physical delete の 409 拒否を明記 |
| audit action | `admin.tag.reactivated` / `admin.tag.physically_deleted` を追加 |

## Step 1-B: 実装状況

| ファイル | 状態 |
|----------|------|
| `apps/api/src/repository/tagDefinitions.ts` | 実装済み |
| `apps/api/src/routes/admin/tags.ts` | 実装済み |
| `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | focused cases 追加済み |
| `apps/api/src/routes/admin/tags.contract.spec.ts` | lifecycle contract 追加済み |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 同期済み |

## Step 1-C: 検証

| 検証 | 結果 |
|------|------|
| focused D1 Vitest | PASS: 2 files / 15 tests |
| API typecheck | PASS |
| repo lint | PASS |

## Step 2: 依存関係整合

| 関連 | 状態 |
|------|------|
| issue-1035 followup-001 (= #1068) | 兄弟（admin tag inline-create UI）/ spec_created |
| issue-1035 followup-002 (= #1069) | 兄弟（tag `code` rename）/ spec_created |
| issue-1035 followup-003 (= #1070) | 本タスク / implemented_local_evidence_captured |

本タスクは issue-1035 の logical delete contract を壊さず、reactivate と physical delete を別 endpoint に分離した。`member_tags` に DB-level FK がないため、アプリ層 count guard を正本化した。
