# Phase 6: 異常系検証

## 検出した異常系
| ID | 場面 | 入力 | 期待 | 実装で対応 | テスト |
| --- | --- | --- | --- | --- | --- |
| E-1 | attendance 重複 | 同一 (member_id, session_id) を 2 回 INSERT | `{ ok:false, reason:"duplicate" }` | PK 制約 + isUniqueConstraintError | attendance.test.ts |
| E-2 | attendance 削除済み会員 | is_deleted=1 の member | `{ ok:false, reason:"deleted_member" }` | member_status 先読み | attendance.test.ts |
| E-3 | attendance 未存在 session | meeting_sessions に無い sessionId | `{ ok:false, reason:"session_not_found" }` | meeting_sessions 先読み | attendance.test.ts |
| E-4 | tag queue 不正遷移 | resolved → reviewing | `RangeError` throw | ALLOWED_TRANSITIONS マップ | tagQueue.test.ts |
| E-5 | tag queue skip 遷移 | queued → resolved | throw | 同上 | tagQueue.test.ts |
| E-6 | tag queue 不在 ID | 存在しない queueId | `Error: queue ... not found` | findQueueById null check | （ユニットでカバー対象外、コード分岐有） |
| E-7 | schemaVersions active 不在 | 全て superseded | `null` | LIMIT 1 + null 返却 | schemaVersions.test.ts |
| E-8 | schemaDiffQueue findById 不在 | 不正 diffId | `null` | `.first() ?? null` | schemaDiffQueue.test.ts |
| E-9 | tagDefinitions findByCode 不在 | 未登録 code | `null` | 同上 | tagDefinitions.test.ts |
| E-10 | listAttendableMembers 全員登録済み | session 全員参加 | `[]` | NOT IN サブクエリ | attendance.test.ts |

## 不変条件マッピング
- #15 attendance 重複 / 削除済み → E-1, E-2 で阻止
- #13 tag 直接編集禁止 → E-4, E-5 (forced workflow)
- #14 schema 集約 → E-7 (active が無い場合の整合)
