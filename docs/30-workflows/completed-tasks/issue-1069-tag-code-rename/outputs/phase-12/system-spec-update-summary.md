# system-spec-update-summary

> 本 workflow は `implemented_local_evidence_captured`。正本 spec の実改訂、local implementation evidence、aiworkflow 同期を同一 wave で完了した。

## Step 1-A: タスク完了記録

- 完了タスク記録先: `docs/00-getting-started-manual/specs/01-api-schema.md` の不変条件 #13 セクション + aiworkflow-requirements の関連 index。
- aiworkflow-requirements の LOGS / changelog / indexes / artifact inventory へ close-out 行を追加済み。
- topic-map.md: tag master write surface に rename を追記。

## Step 1-B: 実装状況テーブル

- 現時点: `implemented_local_evidence_captured`。
- Phase 13（commit / PR）は user-gated。

## Step 1-C: 関連タスクテーブル更新

| 関連タスク | 関係 | 状態 |
| --- | --- | --- |
| issue-1035-tag-master-write-endpoints | 親（tag master CRUD 第3経路を追加した完了タスク） | completed。本タスクが `code immutable` 判断を supersede |
| task-issue-1035-followup-001（admin tag inline-create UI） | 兄弟 | unassigned |
| task-issue-1035-followup-003（tag reactivate / physical delete） | 兄弟 | unassigned |

## Step 2: システム仕様更新（不変条件 #13 改訂・新規インターフェース追加に該当 → 更新要）

`docs/00-getting-started-manual/specs/01-api-schema.md` 不変条件 #13 の改訂方針:

- **Before**: 「tag master の `code` は immutable。PATCH は label/category のみ更新」。
- **After**: 「tag master の `code` は admin tag master CRUD（`PATCH /admin/tags/:tagId`）経由で **audit 付き rename 可能**。
  - `member_tags` は tag_id 参照のため rename しても参照整合は不変。
  - UNIQUE(code) 衝突は `tag_code_conflict`(409)、optimistic（`expectedCode` CAS）衝突は `tag_stale_conflict`(409)。
  - rename は `admin.tag.code_renamed` audit に old/new code を残す。
  - seed（`0004_seed_tags.sql`）は INSERT OR IGNORE（tag_id PK）のため renamed code を revert しない（運用注意）。」
- この改訂は親タスク issue-1035 の `issue_optimization_note`（code immutable）を **supersede** する旨を明記。

### 新規インターフェース（Step 2 対象）

- `UpdateTagDefinitionResult`（discriminated union）— 新規 export。
- `UpdateTagDefinitionInput` に `code` / `expectedCode` 追加。
- `updateTagDefinition` 戻り値型変更（`TagDefinitionRow | null` → `UpdateTagDefinitionResult`）。
- error code `tag_stale_conflict`・audit action `admin.tag.code_renamed` 追加。
</content>
