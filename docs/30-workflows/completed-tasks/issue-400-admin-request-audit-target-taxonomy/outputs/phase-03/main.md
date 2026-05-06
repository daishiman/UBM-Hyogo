# Phase 3: 設計（型・契約・互換性方針）

## 型設計

### `AuditTargetType` 拡張（apps/api/src/repository/auditLog.ts）

```ts
export type AuditTargetType =
  | "member"            // 既存 — member status / public profile 一般変更
  | "admin_member_note" // 新規 — admin request resolve（visibility_request / delete_request の approve / reject）
  | "tag_queue"
  | "schema_diff"
  | "meeting"
  | "system";
```

**設計判断**:
- 新規 enum 値は既存値を温存して append のみ（破壊的変更なし）
- `listFiltered` / `listByTarget` の `targetType` 引数型は既存の `AuditTargetType` を維持（read 時 row 型は string ゆるめ）
- `AuditLogListFilters.targetType: string` は既存維持（filter は free-form string で受け、enum 制約は append 側のみ）

## audit append 契約

| フィールド | 旧（暫定） | 新（first-class） |
| --- | --- | --- |
| `target_type` | `'member'` | `'admin_member_note'` |
| `target_id` | `member_id` | `note_id` |
| `after_json.noteId` | あり | あり（変更なし） |
| `after_json.memberId` | あり | あり（変更なし） |
| `after_json.noteType` | あり | あり |
| `after_json.resolution` | あり | あり |

`apps/api/src/routes/admin/requests.ts` の現行 INSERT は:

```sql
INSERT INTO audit_log (...) SELECT ?1, NULL, ?2, ?3, 'member', member_id, NULL, ?4, ?5
  FROM admin_member_notes WHERE note_id = ?6 AND request_status = 'pending'
```

これを以下に変更:

```sql
INSERT INTO audit_log (...) SELECT ?1, NULL, ?2, ?3, 'admin_member_note', ?6, NULL, ?4, ?5
  FROM admin_member_notes WHERE note_id = ?6 AND request_status = 'pending'
```

`target_id` は `member_id` ではなく bind パラメータ `?6 = noteId` に変える。`after_json` は既に `{ noteId, memberId, noteType, resolution }` を含んでいるため、`memberId` トレーサビリティは維持される。

## 後方互換性

| 観点 | 方針 |
| --- | --- |
| 既存 `target_type='member'` 行 | 据え置く。再分類クエリは発行しない |
| `listByTarget('member', memberId)` 呼び出し元 | 既存 member 一般変更だけを取得する用途は維持。admin request resolve 行は `listByTarget('admin_member_note', noteId)` で別途取得 |
| `/admin/audit?targetType=member` filter | 旧フォーマットの過去ログを引き続き返す（既存挙動維持） |
| `/admin/audit?targetType=admin_member_note` filter | 新規 enum 値追加分のみを返す |
| dashboard.ts `recentActions[].targetType` | `string` で透過。UI 側は既存の `item.targetType ?? "-"` で表示可能 |

## shared schema 方針

`packages/shared/src/zod/viewmodel.ts:182` の `targetType: z.string()` は変更しない（API 側 enum 拡張は web 側に破壊的影響を与えない設計）。コメントで canonical 列挙を明記し、SSOT は API 側 `AuditTargetType` 型である旨を残す。

## 完了条件

- 上記型・契約・互換性方針を Phase 5 実装時に直接参照可能
- 後方互換テーブルのすべてのケースが Phase 6 テスト計画でカバーされる
