# システム仕様更新サマリー — tag master (tag_definitions) write endpoints

**[実装区分: 実装完了 / NON_VISUAL]**

## Step 1-A: タスク完了記録

tag master CRUD の local 実装、focused D1 Vitest、API typecheck、repo lint、正本 API spec 更新を同 wave で完了した。staging runtime smoke / commit / push / PR / Issue 状態変更は user-gated。

## Step 1-B: 実装状況テーブル

| 対象 | 実装状況 |
| --- | --- |
| `apps/api/src/repository/tagDefinitions.ts` | write 3 + read 2 関数、不変条件 #13 コメント改訂済み |
| `apps/api/src/repository/auditLog.ts` | `AuditTargetType` に `"tag"` 追加済み |
| `apps/api/src/routes/admin/tags.ts` | CRUD route 新規実装済み |
| `apps/api/src/index.ts` | `adminTagsRoute` mount 済み（`adminTagsQueueRoute` 後） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 不変条件 #13 第3経路として tag master CRUD を同期済み |

## Step 1-C: 関連タスクテーブル

| ID | 関係 | 状態 |
| --- | --- | --- |
| `issue-982-drawer-tag-pill-editing` | 親（member_tags write + tag master read 実装済み） | completed |
| `issue-982-followup-002`（= #1035） | 本タスク（tag master write 第3経路） | implemented_local_evidence_captured |

## Step 2: system spec 更新結果

`docs/00-getting-started-manual/specs/01-api-schema.md` の Admin Member Tag Write API 節を更新し、不変条件 #13 を 2 経路から 3 経路へ再々定義した。

追加内容:

- `GET /admin/tags` pagination + search（inactive 含む）
- `POST /admin/tags` create、code 衝突 `409 tag_code_conflict`
- `PATCH /admin/tags/:tagId` label/category 更新、code immutable
- `DELETE /admin/tags/:tagId` active=0 論理削除、member_tags row 保持
- audit `admin.tag.created` / `admin.tag.updated` / `admin.tag.deactivated` with `targetType="tag"`

## 不変条件整合

- 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる。`apps/web` 非接触。
- 不変条件 #8: 新規 test は `*.spec.ts` suffix。
- AC-7: `members.tags.contract.spec.ts` regression PASS。
- D1 migration: `active` カラムは既存のため新規 migration 不要。
