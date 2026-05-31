# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

endpoint shape / repository signature / 409 条件 / state ownership / lane を確定する。

## 真の論点（要件レビュー思考法）

1. **真の論点**: 「tag を見せる UI」と「tag を編集する UI」が同居できない構造的制約 = invariant #13「tag は queue resolve 経由のみ」。これを「AI/フォーム提案（queue 承認）」と「管理者手動キュレーション（専用 endpoint + audit）」の 2 経路へ分離することが本質。
2. **依存 / 責務境界**: queue resolve（`tagQueueResolve.ts`、提案承認）と admin manual（新 endpoint、直接付与）は別 service。`member_tags` への write 主体を 2 つに増やすため、`source` カラム（`'manual'` vs `'auto'`/`'form'`）で出自を区別する。
3. **価値とコスト**: 価値 = drawer での tag キュレーション完結。最大コスト部品 = 「選択可能 tag master の取得経路（現状 read 経路なし）」。これを `GET /admin/members/:memberId/tags` の `available` で最小コスト解決する（新 master 画面は作らない）。
4. **改善優先順位**: API write（task-A）→ UI 配線（task-B）→ visual/doc（task-C）。
5. **4 条件**: 価値性=管理者の tag 編集コスト削減 / 実現性=既存 audit・idempotency・pill primitive 流用で初回完結 / 整合性=invariant #13 再定義で責務境界を閉じる / 運用性=audit 記録で監査可能。

## 因果ループ

- バランスループ: tag 付与 → `member_tags` row 増 → drawer `assigned` に反映 → 重複付与 click → `INSERT OR IGNORE` で no-op（audit 増えず）→ state 収束。
- 強化ループ: master read を drawer fetch に乗せる → `ALL_TAGS` ハードコード撤去 → tag master 追加が即 drawer に反映（将来 master 画面と同期）。

## state ownership

| 状態 | owner |
| --- | --- |
| `member_tags` 永続 state | D1（`apps/api` のみ write） |
| drawer の `assigned` / `pendingTagId`（楽観） | `MemberDrawer` client state |
| idempotencyKey | `useAdminMutation`（`idempotencyKey: () => crypto.randomUUID()`） |
| audit | `audit_log`（`auditLogProvider.append`） |

## endpoint 設計（確定）

[task-A](tasks/task-A-tag-write-api-and-repository.md) の通り。要点:

- mount: `members.ts` の `createAdminMembersRoute()` 内に追記（`apps/api/src/index.ts:257` の `app.route("/admin", adminMembersRoute)`）。`requireAdmin` は admin route 群で適用済み。**idempotency middleware は無いため冪等性は PK で担保**。
- パスパラメータ `c.req.param("memberId")` / `c.req.param("tagId")`。
- POST/GET → `MemberTagsResponse { assigned: TagRef[]; available: TagRef[] }`。DELETE → 204。
- `TagRef = { tagId, code, label, category }`（`tagId` = `tag_definitions.tag_id` を正本識別子、`code` は表示/parity 用）。
- actor は `c.get("authUser")`（`{ memberId, email, isAdmin }`）→ `asAdminId` / `adminEmail` で brand 化。

## 409 条件の確定（実カラム整合）

`member_status` schema（`migrations/0002_admin_managed.sql:5-15`）— **`status` カラムは存在せず、`is_deleted INTEGER` を使う**:
```sql
member_status(member_id PK, public_consent, rules_consent,
  publish_state DEFAULT 'member_only', is_deleted INTEGER DEFAULT 0, ...)
```

- 判定: `getMemberDeletedFlag(c, memberId)` の戻り値が
  - `null`（member 不在）→ 404 `member_not_found`
  - `true`（`is_deleted = 1`）→ 409 `member_is_deleted`
  - `false`（`is_deleted = 0` or member_status 行なしで members 在）→ 通す
- detail view（`_shared/builder.ts:416`）は `isDeleted: status.is_deleted === 1` で同判定。本タスクも同一カラムを使い乖離を防ぐ。
- **HTTP コード**: Issue AC-5 は 409 を要求。既存 attendance route は同状況で 422 `member_is_deleted` を返すが、本 endpoint は Issue 契約に従い **409** を採用する（Phase 3 で確認済）。

## repository 設計

[task-A](tasks/task-A-tag-write-api-and-repository.md#repository-関数memertagsts) の signature を正本とする。`changes` ベースの state 変化検出を audit のトリガーに使う（no-op で audit を増やさないため）。

## 型 gate（test-d）設計

`memberTags.readonly.test-d.ts` は write 関数を `assign*` prefix で allowlist 化。

- `assignTagToMemberByAdmin` → prefix 一致（OK）
- `unassignTagFromMemberByAdmin` → 不一致 → allowlist に **明示的に追加**し、コメントで「admin manual 経路の例外（invariant #13 再定義）」と記す
- read 関数（`getTagDefinitionMaster` / `listAssignedTagsForMember` / `findTagDefinitionById` / `getMemberDeletedFlag`）は read なので gate 対象外

## web 設計

[task-B](tasks/task-B-member-drawer-editable-tags.md) の通り。`useAdminMutation` の実シグネチャは `(endpoint, method, options)` で `onOptimistic` は無いため、楽観更新は component の local state で行い `onSuccess`（確定）/ `onError`（rollback）callback で締める。ステップ間 state 引き渡し:

| 項目 | 反映タイミング |
| --- | --- |
| `available` | drawer open fetch（初回） |
| `assigned` | fetch 初期化 → click で楽観更新 → `onSuccess` で確定 / `onError` で `rollbackRef` から復元 |
| `pendingTagId` | click で set、mutation `finally` で null（二重発火防止） |
| toast | hook 標準（successMessage） + error toast |

ロック変数の解放経路（正常/エラー/キャンセル）: `pendingTagId` を mutation の `finally` で必ず null に戻す（成功・失敗・例外の全経路）。DELETE は `treat404AsSuccess: "silent"` で未存在 404 を静かに成功扱いにし、API 側の 204 no-op と合わせて冪等化する。

## lane（SubAgent 並列 ≤ 3）

- lane-A: apps/api（task-A）
- lane-B: apps/web（task-B、A 完了後）
- lane-C: visual + docs（task-C、B 完了後）
- validation lane（直列締め）: typecheck / lint / spec

## 参照資料

| 参照資料 | パス |
| -------- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` |
| migration | `apps/api/migrations/0002_admin_managed.sql` |
| audit | `apps/api/src/repository/audit.ts` |

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 本ファイル（endpoint / repository / 409 / state / lane 設計確定）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 完了条件

- endpoint shape・repository signature・409 条件が一意に確定（達成済み）
- 型 gate 更新方針が確定（達成済み）
- state ownership / lane が明示（達成済み）
