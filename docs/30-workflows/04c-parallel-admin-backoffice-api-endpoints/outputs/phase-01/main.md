# Phase 1 — 要件定義（admin-backoffice-api-endpoints）

## 1. 18 endpoint contract（input / output / 認可境界）

| # | method | path | 認可 | 入力 | 主出力 | 主 D1 書込 | AC |
|---|---|---|---|---|---|---|---|
| 1 | GET | /admin/dashboard | admin gate | - | AdminDashboardView | （read のみ） | AC-1, AC-9 |
| 2 | GET | /admin/members | admin gate | `?filter=published\|hidden\|deleted` | AdminMemberListView | - | AC-1, AC-3 |
| 3 | GET | /admin/members/:memberId | admin gate | path:memberId | AdminMemberDetailView | - | AC-1, AC-3 |
| 4 | PATCH | /admin/members/:memberId/status | admin gate | `{publishState?, hiddenReason?}` | `{publishState, hiddenReason, isDeleted, updatedAt}` | member_status + audit_log | AC-5, AC-9 |
| 5 | POST | /admin/members/:memberId/notes | admin gate | `{body}` | `{noteId, createdAt}` | admin_member_notes + audit_log | AC-2, AC-9, AC-12 |
| 6 | PATCH | /admin/members/:memberId/notes/:noteId | admin gate | `{body}` | `{noteId, updatedAt}` | admin_member_notes + audit_log | AC-2, AC-9, AC-12 |
| 7 | POST | /admin/members/:memberId/delete | admin gate | `{reason}` | `{memberId, isDeleted:true, deletedAt}` | member_status + deleted_members + audit_log | AC-5, AC-9 |
| 8 | POST | /admin/members/:memberId/restore | admin gate | - | `{memberId, isDeleted:false}` | member_status + audit_log | AC-5, AC-9 |
| 9 | GET | /admin/tags/queue | admin gate | `?status=queued\|reviewing\|resolved` | AdminTagQueueView | - | AC-6 |
| 10 | POST | /admin/tags/queue/:queueId/resolve | admin gate | `{appliedTags?: string[]}` | `{queueId, status:'resolved'}` | tag_assignment_queue + audit_log | AC-6, AC-9 |
| 11 | GET | /admin/schema/diff | admin gate | `?type?` | AdminSchemaDiffView | - | AC-7 |
| 12 | POST | /admin/schema/aliases | admin gate | `{questionId, stableKey}` | `{stableKey, aliasResolved:true}` | schema_questions + schema_diff_queue + audit_log | AC-7, AC-9 |
| 13 | GET | /admin/meetings | admin gate | `?limit?&offset?` | AdminMeetingListView | - | AC-1 |
| 14 | POST | /admin/meetings | admin gate | `{title, heldOn, note?}` | `{sessionId, scheduledAt}` | meeting_sessions + audit_log | AC-9 |
| 15 | POST | /admin/meetings/:sessionId/attendance | admin gate | `{memberId}` | `{sessionId, memberId}` | member_attendance + audit_log | AC-8, AC-9 |
| 16 | DELETE | /admin/meetings/:sessionId/attendance/:memberId | admin gate | - | `{removed:true}` | member_attendance + audit_log | AC-9 |
| 17 | POST | /admin/sync/schema | admin gate | - | `{jobId, status:'queued'}` | sync_jobs + audit_log | AC-10（既存 03a） |
| 18 | POST | /admin/sync/responses | admin gate | - | `{jobId, status:'queued'}` | sync_jobs + audit_log | AC-10（既存 03b） |

## 2. 上流 repository 引き渡し

| 上流タスク | 提供 repo / helper |
|---|---|
| 02a | `members.findMemberById/listMembersByIds`, `responses.findCurrentResponse`, `responseSections.listSectionsByResponseId`, `responseFields.listFieldsByResponseId` |
| 02b | `meetings.listMeetings/insertMeeting/findMeetingById`, `attendance.addAttendance/removeAttendance`, `tagQueue.listQueue/findQueueById/transitionStatus`, `schemaDiffQueue.list/findById/resolve` |
| 02c | `adminUsers.findByEmail/isActiveAdmin`, `adminNotes.create/update/findById/listByMemberId`, `auditLog.append`, `syncJobs.findLatest`, `apps/web → D1 直アクセス禁止 lint` |
| 03a | `sync/schema/runSchemaSync`（既存 `routes/admin/sync-schema.ts` で利用済み） |
| 03b | `jobs/sync-forms-responses/runResponseSync`（既存 `routes/admin/responses-sync.ts` で利用済み） |
| 01b | `AdminDashboardViewZ`, `AdminMemberListViewZ`, `AdminMemberDetailViewZ`（zod parser） |

## 3. AC × 不変条件 mapping

| AC | 関連不変条件 | endpoint で構造的に守る方法 |
|---|---|---|
| AC-1 | - | router mount 時に `app.use("*", adminGate)` を install。handler 単位でなく mount 単位で誤解放を防ぐ |
| AC-2 | #4, #11 | `apps/api/src/routes/admin/` 内に `PATCH /admin/members/:memberId/profile` を**作らない**（grep で不在確認） |
| AC-3 | #12 | `AdminMemberDetailView` のみ `audit` を含む。list / public / member view model には混入させない（zod schema が `notes` フィールド未定義） |
| AC-4 | #11 | adminGate 単一実装で 401 (unauthorized) / 403 (forbidden) / 200 (active admin) の 3 値を厳密に返す。memberId 露出ゼロは 403 body で `{ ok:false, error }` のみ返す（payload に target を含めない） |
| AC-5 | #11 | `setPublishState` と `setDeleted` を別 handler 経路（status PATCH と delete POST）に分離。zod が両方を同一 payload で受けない |
| AC-6 | #13 | `tag_assignment_queue.transitionStatus` 経由のみ。`PATCH /admin/members/:memberId/tags` は不在 |
| AC-7 | #14 | `/admin/schema/diff` と `/admin/schema/aliases` のみ提供。`PATCH /admin/sync/schema` 等は不在 |
| AC-8 | #15 | `attendance.addAttendance` の `AddAttendanceResult` を 409 (duplicate) / 422 (deleted_member) / 404 (session_not_found) に厳密マップ |
| AC-9 | - | 全 PATCH/POST/DELETE 末尾で `auditLog.append` 必須。actor は adminGate スタブ段階では `null`（05a で email 注入予定） |
| AC-10 | - | sync trigger は 202 + `jobId` を返却。重複は `sync_jobs.findLatest`で `running` 検出時 409 |
| AC-11 | - | response を `*ViewZ.parse(...)` で必ず通してから `c.json(...)` |
| AC-12 | #12 | admin_member_notes は `apps/api/src/repository/adminNotes.ts` のみ touch。public/member builder からは import 禁止（既存 repo コメントで宣言済み） |

## 4. sync trigger 仕様

- jobId: `crypto.randomUUID()`（既存 `syncJobs.start`）
- 状態遷移: `running → succeeded | failed`（一方向、`syncJobs.ALLOWED_TRANSITIONS` で型レベル保証）
- 重複防止: 同種 job が `running` の間に再 trigger → 409 ConflictError（既存 `sync/schema.ts` の `ConflictError` パターン踏襲）
- 戻り値（trigger 時）: `{ ok:true, jobId, status:'queued'|'running' }` を 202 で返す
- cron 経路: `apps/api/src/index.ts` の `scheduled` で既に登録済み（schema=18:00 UTC, response=*/15）

## 5. 4 条件評価

| 条件 | 判定 | 根拠 |
|---|---|---|
| 価値性 | PASS | 18 endpoint で spec 11 の 5 画面（dashboard / members / tags / schema / meetings）+ sync trigger を完全カバー |
| 実現性 | PASS | 上流 02a/b/c, 03a/b の repo / helper が既に揃っている（apps/api/src/repository/ 配下を読み確認済み） |
| 整合性 | PASS | 不変条件 #4 #11 #12 #13 #14 #15 を route 構造 + zod + repository アクセス境界で守る |
| 運用性 | PASS | sync trigger は 202 + cron 並走、Workers 制限内。audit_log で who/what/when/target を残す |

## handoff to Phase 2

- Phase 2 で展開する事項: Mermaid request flow / module 配置（routes/admin/ 9 ファイル + repository/dashboard.ts 追加）/ env / dependency matrix
