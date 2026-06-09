# フォーム schema と項目定義

## 役割

このファイルは Google Form の live schema を `stableKey` ベースで扱うための正本です。

- 実フォームは 31 項目・6 セクション
- formId は `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`
- メールはフォーム項目ではなく Google が自動収集する `responseEmail`
- admin-managed data はこの schema の外で持つ
- 実装先は `apps/web` の表示と `apps/api` の同期処理であり、D1 への直接参照は `apps/api` に閉じる

---

## フォーム情報

| 項目 | 値 |
|------|-----|
| formId | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |
| responderUrl | `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` |
| editorUrl | `https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit` |
| sectionCount | `6` |
| questionCount | `31` |

---

## system fields

以下はフォーム UI 上の質問ではないが、アプリで保持する system fields:

| key | source | 説明 |
|-----|--------|------|
| `responseId` | Forms API response | 回答単位の ID |
| `responseEmail` | Google auto-collected | 回答者の verified email |
| `submittedAt` | Forms API response | 回答送信日時 |
| `lastSubmittedAt` | derived | 同一メンバーの最新回答日時 |
| `editResponseUrl` | available when obtained | 再編集導線に使う候補 |
| `revisionId` | Forms API form | schema 版管理 |
| `schemaHash` | app derived | schema fingerprint |

`responseEmail` は form field として定義しない。認証照合と stable member 解決に使う。

---

## visibility ルール

| 値 | 意味 |
|----|------|
| `public` | 未ログインでも表示可能 |
| `member` | ログイン済み会員と管理者のみ表示 |
| `admin` | 管理者のみ表示 |

visibility は field 単位の表示制御であり、メンバー全体の公開状態は `publishState` で別管理する。

---

## セクション1: basic_profile

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `fullName` | お名前（フルネーム） | `shortText` | ✅ | `public` |
| `nickname` | あだ名・ニックネーム | `shortText` | - | `public` |
| `location` | お住まい（都道府県・市区町村） | `shortText` | ✅ | `public` |
| `birthDate` | 生年月日 | `date` | - | `member` |
| `occupation` | 職業・仕事内容 | `shortText` | ✅ | `public` |
| `hometown` | 出身地 | `shortText` | - | `public` |

## セクション2: ubm_profile

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `ubmZone` | UBM区画 | `radio` | ✅ | `public` |
| `ubmMembershipType` | UBM参加ステータス | `radio` | ✅ | `public` |
| `ubmJoinDate` | UBMに入会・参加した時期 | `shortText` | - | `member` |
| `businessOverview` | ビジネス概要 | `paragraph` | ✅ | `public` |
| `skills` | 得意分野・スキル | `paragraph` | - | `public` |
| `challenges` | 現在の課題・相談したいこと | `paragraph` | - | `member` |
| `canProvide` | 提供できること・協力できること | `paragraph` | - | `public` |

`ubmZone` の正規化候補:

- `0_to_1`
- `1_to_10`
- `10_to_100`

`ubmMembershipType` の正規化候補:

- `member`
- `non_member`
- `academy`

## セクション3: personal_profile

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `hobbies` | 趣味・好きなこと | `shortText` | - | `public` |
| `recentInterest` | 最近ハマっていること | `shortText` | - | `public` |
| `motto` | 座右の銘・大切にしている言葉 | `shortText` | - | `public` |
| `otherActivities` | 仕事以外の活動 | `paragraph` | - | `public` |

## セクション4: social_links

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `urlWebsite` | ホームページ URL | `url` | - | `public` |
| `urlFacebook` | Facebook URL | `url` | - | `public` |
| `urlInstagram` | Instagram URL | `url` | - | `public` |
| `urlThreads` | Threads URL | `url` | - | `public` |
| `urlYoutube` | YouTube URL | `url` | - | `public` |
| `urlTiktok` | TikTok URL | `url` | - | `public` |
| `urlX` | X URL | `url` | - | `public` |
| `urlBlog` | ブログ URL | `url` | - | `public` |
| `urlNote` | note URL | `url` | - | `public` |
| `urlLinkedin` | LinkedIn URL | `url` | - | `public` |
| `urlOthers` | その他の SNS・URL | `paragraph` | - | `public` |

## セクション5: message

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `selfIntroduction` | 自己紹介・一言メッセージ | `paragraph` | - | `public` |

## セクション6: consent

| stableKey | 表示名 | kind | required | visibility |
|-----------|--------|------|:--------:|------------|
| `publicConsent` | ホームページへの掲載に同意しますか？ | `radio` | ✅ | `admin` |
| `rulesConsent` | 勧誘ルール・免責事項への同意 | `radio` | ✅ | `admin` |

consent キーは `publicConsent` と `rulesConsent` に統一する。`ruleConsent` は使用しない。

---

## consent の扱い

```ts
type ConsentStatus = "consented" | "declined" | "unknown";
```

- `publicConsent`
  - 公開一覧・詳細への掲載可否に使う
- `rulesConsent`
  - ログイン許可の必須条件に使う
- 元の選択肢文言は `rawAnswersByQuestionId` に保持する
- choice の表示文言が変わっても `stableKey` と正規化値で吸収する

---

## schema 外の admin-managed data

以下は Google Form schema に含めない:

| key | 管理場所 | 説明 |
|-----|----------|------|
| `memberId` | D1 `member_identities` | stable member entity |
| `currentResponseId` | D1 `member_identities` | 現在採用する回答 |
| `publishState` | D1 `member_status` | `public` / `member_only` / `hidden` |
| `isDeleted` | D1 `member_status` | アプリ上の論理削除 |
| `meetingSessions` | D1 `meeting_sessions` | 開催日 |
| `attendance` | D1 `member_attendance` | 参加履歴 |
| `photo` | D1 `member_photos` + R2 `members/{memberId}/avatar` | profile 写真。`source` は `admin` / `self` |
| `memberFieldOverrides` | D1 `member_field_overrides` | 管理者が確定編集したプロフィール項目。表示時は Form 回答より優先 |
| `tags` | D1 `member_tags` | 付与済みタグ |
| `tagSource` | D1 `member_tags` | `rule` / `ai` / `manual` |
| `tagAssignmentStatus` | D1 `tag_assignment_queue` | 手動確認待ち状態 |

---

`MemberProfile.attendance` と `PublicMemberProfile.attendance` は `member_attendance` と active `meeting_sessions`（`meeting_sessions.deleted_at IS NULL`）を `session_id` で INNER JOIN して返す。API contract は `AttendanceRecord[]`（`sessionId`, `title`, `heldOn`）を維持し、`GET /me/profile`、admin member detail、`GET /public/members/:memberId` は `attendanceProviderMiddleware` が Hono context に bind した `c.var.attendanceProvider` から provider を解決する。builder call site へ optional `deps?.attendanceProvider` を渡す方式は使わない。大量履歴向けに `attendanceMeta?: { hasMore: boolean; nextCursor: string | null }` を optional 追加し、`GET /me/profile`、admin member detail、public member detail は default 50 件の先頭ページを返す。先頭ページの limit 指定は builder の optional `deps?.attendancePage` または use-case の default page request 経由でのみ渡す。public member detail は公開適格判定（`public_consent='consented'`, `publish_state='public'`, `is_deleted=0`）が成立した後に attendance を読む。非公開 member の attendance 有無や soft-deleted meeting を 404 / 除外経路で漏らさない。

`GET /me/profile` は本人の `member_photos` 行が存在し、R2 presign secrets が揃う場合だけ `photoUrl?: string` を同梱する。presign 失敗・secret 不足・写真未登録では `photoUrl` を省略し、profile response は 200 を維持する。`photoUrl` は `members/{memberId}/avatar` の presigned GET URL であり、D1/R2 read は `apps/api` に閉じる。

`GET /me/profile`、`GET /public/members`、`GET /public/members/:memberId`、admin member detail は profile field を返す前に `member_field_overrides` を合成する。値の優先順位は L1 `member_field_overrides` > L2 Google Form 本人再回答 > L3 スプレッドシート初回 seed。L1 の field は response item の `source` を `admin` として返し、Form / Sheets 由来は `forms` として扱う。本人による本文更新は Google Form 再回答を使い、本人更新用の D1 override endpoint は設けない。

### Public Profile Attendance Contract

| Endpoint | 認証 | Response 追加 | Privacy boundary |
| --- | --- | --- | --- |
| `GET /public/members/:memberId` | public / session 不要 | `attendance: AttendanceRecord[]`, `attendanceMeta?: { hasMore: boolean; nextCursor: string | null }` | `responseEmail`, `audit`, `adminNotes`, member-only/admin-only field は返さない。公開適格でない member は attendance read 前に 404 |

### Attendance pagination

| Endpoint | 認証 | Query | Response |
| --- | --- | --- | --- |
| `GET /me/attendance` | member session | `limit?: 1..200`, `cursor?: string` | `{ records: AttendanceRecord[], hasMore: boolean, nextCursor: string | null }` |
| `GET /admin/members/:memberId/attendance` | admin session | `limit?: 1..200`, `cursor?: string` | `{ records: AttendanceRecord[], hasMore: boolean, nextCursor: string | null }` |

cursor は `{ heldOn, sessionId }` を base64url JSON 化した不透明文字列で、sort は `held_on DESC, session_id DESC`。不正 cursor は 400、`limit < 1` は 400、`limit > 200` は 200 に clamp する。既存 `createAttendanceProvider(ctx).findByMemberIds(ids)` は bulk read の後方互換 API として維持し、個人ページングは `findByMemberId(id, { limit, cursor })` を使う。

## Admin Member Tag Write API（issue-982）

管理者が `MemberDrawer` 内で member へ tag を手動付与 / 解除するための専用 endpoint。すべて admin gate 配下で実行し、apps/web は `/api/admin/...` proxy 経由で呼ぶ（D1 直接参照禁止）。

### 正本テーブル

- 中間テーブルは **`member_tags`**（PK `(member_id, tag_id)`、`source`、`assigned_by`）が正本。過去仕様の旧中間テーブル名は使わない。
- tag master は **`tag_definitions`**（PK `tag_id`、UNIQUE `code`、`label`、`category`、`active`）。`tags` テーブルは存在しない。

### 不変条件 #13（2026-06 再々定義）

tag の write 経路を 3 つに正式分離する。

1. **AI / Google Form 由来の tag「提案」** — `tags-queue` の resolve（`tagQueueResolve` workflow）経由で承認する。
2. **管理者による tag の「手動付与 / 解除」** — `/admin/members/:memberId/tags` 専用 endpoint 経由で行い、必ず audit を記録する。
3. **管理者による tag master (`tag_definitions`) の CRUD** — `/admin/tags` 専用 endpoint 経由で行い、必ず audit を記録する。

`member_tags` への直接 write は上記 1 / 2 と、3 のうち `DELETE /admin/tags/:tagId/physical?migrateTo=<destTagId>` の強制移行付き物理削除経路に限り許可する。
`tag_definitions` への write は `apps/api/src/repository/tagDefinitions.ts` の `createTagDefinition` / `updateTagDefinition` / `deactivateTagDefinition` / `reactivateTagDefinition` / `physicalDeleteTagDefinition` / `forceMigrateAndPhysicalDeleteTagDefinition` だけに限定する。`code` は admin tag master CRUD 経路の PATCH でのみ rename 可能とし、code rename 時は `expectedCode` による optimistic CAS、409 `tag_code_conflict`（衝突）/ 409 `tag_stale_conflict`（expectedCode 不一致）の分離、`admin.tag.code_renamed` audit（before/after code）を必須とする。`member_tags` は `tag_id` 参照なので rename 後も既存 row を保持する。通常 DELETE は物理削除ではなく `active=0` への論理削除で、既存 `member_tags` row は保持する。physical delete は専用 endpoint でのみ許可し、`member_tags` 参照が 1 件以上ある場合は 409 `tag_has_references` で拒否して孤児行を作らない。強制移行付き physical delete は `migrateTo` で active な移行先 tag を明示した場合だけ、`member_tags` の source tag 参照を destination tag へ集約し、source 参照 0 件を再確認してから既存 physical delete を実行する。

### Endpoints

| Method | Path | Body | Response | エラー |
|--------|------|------|----------|--------|
| GET | `/admin/members/:memberId/tags` | なし | `{ assigned: TagRef[], available: TagRef[] }`（`available` は `tag_definitions WHERE active=1` 全件） | member 不在 → 404 `member_not_found` |
| POST | `/admin/members/:memberId/tags` | `{ tagId: string }` | `{ assigned, available }`（更新後） | body 不正 → 400 / member 不在 → 404 `member_not_found` / `is_deleted=1` → 409 `member_is_deleted` / active な tag master 不在 → 404 `tag_not_found` |
| DELETE | `/admin/members/:memberId/tags/:tagId` | なし | 204 No Content | member 不在 → 404 `member_not_found` / `is_deleted=1` → 409 `member_is_deleted` |
| PUT | `/admin/member-fields/:memberId` | `{ stableKey: StableKey, value: AnswerValue }` | `{ ok: true }` | body 不正 → 400 `invalid_body` / member 不在 → 404 `member_not_found` |
| GET | `/admin/tags` | query: `q?: string`, `page?: number`, `pageSize?: number` | `{ total, items: TagMasterRef[] }`（inactive 含む） | query 不正 → 400 `invalid_query` |
| POST | `/admin/tags` | `{ code, label, category }` | `TagMasterRef` | body 不正 → 400 / code 衝突 → 409 `tag_code_conflict` |
| PATCH | `/admin/tags/:tagId` | `{ code?, label?, category?, expectedCode? }`（`code` 指定時は `expectedCode` 必須） | `TagMasterRef` | body 不正 → 400 / 更新項目なし → 400 `no_update_fields` / tag 不在 → 404 `tag_not_found` / code 衝突 → 409 `tag_code_conflict` / expectedCode 不一致 → 409 `tag_stale_conflict` |
| DELETE | `/admin/tags/:tagId` | なし | 204 No Content | tag 不在 → 404 `tag_not_found` |
| POST | `/admin/tags/:tagId/reactivate` | なし | `TagMasterRef` | tag 不在 → 404 `tag_not_found` |
| DELETE | `/admin/tags/:tagId/physical` | query: `migrateTo?: tagId` | 204 No Content | tag 不在 → 404 `tag_not_found` / `migrateTo` 未指定かつ `member_tags` 参照あり → 409 `tag_has_references` + `referenceCount` / `migrateTo` 不在 → 404 `migration_target_not_found` / `migrateTo` 非 active → 409 `migration_target_inactive` / `migrateTo` が source と同一 → 400 `migration_target_same_as_source` |

`TagRef = { tagId: string; code: string; label: string; category: string }`。`tagId`（= `tag_definitions.tag_id`）を正本識別子とし、`code`（UNIQUE）は表示・既存 detail view との parity 用に併せて返す。
`TagMasterRef = TagRef & { active: boolean }`。master 管理 endpoint は inactive row も一覧対象に含め、検索 `q` は `code` / `label` の部分一致とする。
`DELETE /admin/tags/:tagId/physical` の `migrateTo` は前後空白を trim してから tag id として扱う。trim 後に空文字の場合は移行先不在と同じ 404 `migration_target_not_found` とし、移行・削除・audit は実行しない。

### 冪等性

- POST は PK `(member_id, tag_id)` の `INSERT OR IGNORE` で再送を no-op（200）にする。
- POST の tag master 検証は `tag_definitions.active = 1` を要求する。非アクティブ tag は UI に出さず、direct API でも `tag_not_found` として扱う。
- DELETE は対象行が無くても 204（冪等）。
- tag master の reactivate は active=0 の row を active=1 に戻す。既に active=1 の場合は 200 no-op とし、audit を増やさない。reactivate は同一 row の active flag だけを戻すため、`code` conflict は構造的に発生しない。
- tag master の logical delete（`DELETE /admin/tags/:tagId`）は active=0 row を残すため UNIQUE `code` を占有し続ける。physical delete（`DELETE /admin/tags/:tagId/physical`）は row を削除して `code` を解放するが、実行前に `member_tags WHERE tag_id` を count し、参照があれば削除しない。`migrateTo` 指定時だけ参照を active な移行先 tag へ集約し、PK `(member_id, tag_id)` 衝突は destination 既存行を保持して source 行を削除することで吸収する。
- client が送る `Idempotency-Key` header は受理するが、現状 server 側は no-op（idempotency middleware 未実装）。状態変化の検出は `meta.changes` で行う。

### audit action（state 変化時のみ 1 行）

| action | targetType | before | after |
|--------|-----------|--------|-------|
| `admin.member.tag_assigned` | `member` | `null` | `{ tagId, source: "manual" }` |
| `admin.member.tag_unassigned` | `member` | `{ tagId }` | `null` |
| `admin.tag.created` | `tag` | `null` | `{ code, label, category }` |
| `admin.tag.code_renamed` | `tag` | `{ code }` | `{ code }` |
| `admin.tag.updated` | `tag` | `{ label, category }` | `{ label, category }` |
| `admin.tag.deactivated` | `tag` | `{ active: true }` | `{ active: false }` |
| `admin.tag.reactivated` | `tag` | `{ active: false }` | `{ active: true }` |
| `admin.tag.references_migrated` | `tag` | `{ tag_id, dest, referenceCount }` | `{ migratedCount, deleted: true }` |
| `admin.tag.physically_deleted` | `tag` | `TagMasterRef` | `null` |

新規付与 / 削除が実際に発生した（`meta.changes > 0`）ときのみ audit を append する。再送 no-op では audit を増やさない。
tag master CRUD でも state 変化時のみ audit を append する。同値 PATCH、既 inactive tag への DELETE 再送、既 active tag への reactivate 再送、参照あり physical delete 拒否、強制移行 target 検証拒否では audit を増やさない。強制移行付き physical delete 成功時は `admin.tag.references_migrated` と `admin.tag.physically_deleted` を 1 件ずつ append する。

## Admin Dashboard Attendance Analytics API

`ut-02a-followup-002` で導入し、`admin-attendance-analytics-redesign` (2026-05) で UI 全面刷新とともに period / zone フィルタおよび trend / zone-distribution / drilldown / absentees / export を拡張した。すべて既存 admin gate 配下で実行し、apps/web は `/api/admin/...` proxy / `fetchAdmin` 経由で呼ぶ。apps/web から D1 を直接参照しない。

### 共通クエリ規約

| key | 値 | 不正時 |
|-----|----|--------|
| `periodFrom` | `YYYY-MM-DD`（半開区間 inclusive） | null fallback (no period filter) |
| `periodTo` | `YYYY-MM-DD`（半開区間 exclusive） | null fallback |
| `zone` | カンマ区切り `zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus`（旧 `0→1` / `1→10` / `10→100` は互換入力として新キーへ正規化） | 不明値は drop、全 drop なら null |
| `limit` | 1..200 整数 (default 50) | clamp |
| `lastN` | 1..10 整数 (default 3) | clamp |

**400 は返さない** — 不正値は default / clamp / null fallback で吸収する。

### Endpoints

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/admin/dashboard/attendance/overview` | `periodFrom?`, `periodTo?`, `zone?` | `AttendanceOverviewExt`: `{ totalSessions, totalMembers, overallRate, uniqueAttendeeCount, uniqueAttendanceRate, previousPeriodRate \| null, filter: AttendanceFilterEcho }` |
| GET | `/admin/dashboard/attendance/by-session` | `limit?`, `periodFrom?`, `periodTo?`, `zone?` | `Array<SessionAttendanceRow>` (既存) |
| GET | `/admin/dashboard/attendance/ranking` | `limit?`, `periodFrom?`, `periodTo?`, `zone?` | `Array<MemberAttendanceRanking>` (既存) |
| GET | `/admin/dashboard/attendance/trend` | `periodFrom?`, `periodTo?`, `zone?` | `AttendanceTrend`: `{ granularity: 'month', buckets: AttendanceTrendBucket[], filter }` |
| GET | `/admin/dashboard/attendance/zone-distribution` | `periodFrom?`, `periodTo?` | `AttendanceZoneDistribution`: `{ rows: AttendanceZoneDistributionRow[], filter }` |
| GET | `/admin/dashboard/attendance/sessions/:sessionId/attendees` | なし | `AttendanceSessionDetail`: `{ sessionId, title, heldOn, attendees, absentees }` / 404 `ADMIN_FETCH_404` |
| GET | `/admin/dashboard/attendance/absentees` | `lastN?`, `periodFrom?`, `periodTo?`, `zone?` | `AttendanceAbsenteeList`: `{ rows, lastN, filter }` |
| GET | `/admin/dashboard/attendance/export` | `periodFrom?`, `periodTo?`, `zone?` | `text/csv; charset=utf-8`（BOM + CRLF）、`attachment; filename="attendance-{from}_{to}.csv"` |

### Zone 派生

メンバー単位の `attendedCount` から SQL 側で `0` → `zone_0`、`1..9` → `zone_1_9`、`10..99` → `zone_10_99`、`>=100` → `zone_100_plus` に正規化する。`unknown` は負値・非有限値など分類不能フォールバック専用で、正常な 100 回以上の出席者には使わない。`zone` クエリ未指定時は全 zone 集計。

### 集計母数

`meeting_sessions.deleted_at IS NULL` の active session と `member_status.is_deleted != 1` の active member に揃える。`overallRate` は延べ率として `attendCount / (totalSessions * totalMembers)` で 0..1 clamp。`uniqueAttendeeCount` は期間内に 1 回以上出席した active member 数、`uniqueAttendanceRate` は `uniqueAttendeeCount / totalMembers` で 0..1 clamp。`previousPeriodRate` は指定期間と同じ長さ分だけ直前期間を再集計する（period 未指定時は null）。

### Zod スキーマ

`packages/shared/src/zod/admin-attendance.ts` に集約。`AttendanceOverviewExtZ` / `AttendanceTrendZ` / `AttendanceZoneDistributionZ` / `AttendanceSessionDetailZ` / `AttendanceAbsenteeListZ` のすべてが `.strict()`。型は `@ubm-hyogo/shared` から re-export される。

### CSV エクスポート

- ヘッダ: `sessionId,title,heldOn,memberId,displayName,zone,attended`
- BOM (`﻿`) 先頭付与、改行 CRLF (Excel 互換)
- 値内の `,` `"` 改行は二重引用符で escape
- 1 行 1 (session × member) で active member + active session の組のみ。`attended` は 0/1
- `Content-Disposition: attachment; filename="attendance-{periodFrom}_{periodTo}.csv"`（period 未指定時は `all`）

## Admin Meeting Attendance Management API

UT-07C / UT-07C-FU-001 で追加した meeting attendance の管理用 endpoint 群。すべて admin gate 配下で実行し、apps/web からは `/api/admin/...` proxy / `fetchAdmin` 経由で呼ぶ。apps/web から D1 を直接参照しない。

| Method | Path | Query / Body | Response |
|--------|------|--------------|----------|
| GET | `/admin/meetings/:sessionId/attendance/candidates` | なし | 出席候補 member 一覧 |
| POST | `/admin/meetings/:sessionId/attendance` | `{ memberId }` | 201（追加） / 409（既存） / 422（不正） / 404 |
| DELETE | `/admin/meetings/:sessionId/attendance/:memberId` | なし | 200（削除） / 404 |
| POST | `/admin/meetings/:sessionId/attendance/import?dryRun=true\|false` | `{ rows: Array<{ memberId?, email? }> }` (rows.length <= 500) | 200（summary / 行別 status / dryRun / committed） / 400（invalid_json / invalid_payload） / 401 / 403 / 404（session_not_found） / 413（payload_too_large） |

`POST /admin/meetings/:sessionId/attendance/import` は CSV 由来の attendance を一括登録する。

- `dryRun=true` または省略 / typo: D1 write 0 / audit_log 0。行別 status のみ返す
- `dryRun=false`: 全行 `ok` のときのみ insert（部分コミット禁止）。chunk size 80 で `member_attendance` と `audit_log.action='attendance.import.add'` を D1 batch に同時投入する
- 行別 status: `ok` / `duplicate` / `deleted_member` / `unknown_member` / `invalid`（`invalid` は `memberId_or_email_required` / `memberId_email_mismatch`）
- 同一 payload 内の同一 member は 2 行目以降 `duplicate` (`duplicate_in_payload`)
- email lookup は NFKC + trim + lowercase で正規化（server / client 共通）
- 500 行上限、501 行は 413

## API health contract: GET /health/db

`GET /health/db` は API Worker から D1 binding に `SELECT 1` を実行し、UT-06 AC-4 の API 経由 D1 smoke を可能にするための health endpoint である。D1 への直接アクセスは `apps/api` に閉じ、`apps/web` から D1 binding を参照しない。

### Request

| 項目 | 値 |
|------|-----|
| Method | `GET` |
| Path | `/health/db` |
| Header | `X-Health-Token: <HEALTH_DB_TOKEN>` |
| 外周制御 | Cloudflare WAF allowlist + rate limit |

### Response

| 状況 | Status | Body | Headers |
|------|--------|------|---------|
| D1 疎通成功 | `200` | `{ "ok": true, "db": "ok", "check": "SELECT 1" }` | `Content-Type: application/json` |
| token 欠落 / 誤値（WAF allowlist 内） | `401` | `{ "ok": false, "error": "unauthorized" }` | - |
| WAF allowlist 外 / rate limit | `403` | Cloudflare WAF response | Cloudflare WAF response |
| token 未設定 / D1 binding 欠落 / D1 失敗 | `503` | `{ "ok": false, "db": "error", "error": "<Error.name>" }` | `Retry-After: 30` |

`HEALTH_DB_TOKEN` は Cloudflare Secrets で管理し、実値をドキュメントやログに残さない。運用手順は `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/operator-runbook.md` を正とする。

---

## Public members API: GET /public/members

`GET /public/members` は公開メンバー一覧 `/members` の検索/フィルタ API である。認証は不要だが、D1 への直接アクセスは `apps/api` に閉じ、`apps/web` は API 経由でのみ取得する。

### Query

| key | 型 | default | 挙動 |
| --- | --- | --- | --- |
| `q` | string | `""` | trim、連続空白正規化、200文字 truncate。`%` / `_` / `\` は LIKE wildcard ではなくリテラル扱い |
| `zone` | enum | `all` | `all` / `0_to_1` / `1_to_10` / `10_to_100` |
| `status` | enum | `all` | `all` / `member` / `non_member` / `academy`。参加ステータスであり公開状態ではない |
| `tag` | repeated string | `[]` | 重複除去、空文字除去、先頭5件。複数指定は AND |
| `sort` | enum | `recent` | `recent` / `name` |
| `density` | enum | `comfy` | `comfy` / `dense` / `list`。UI 表示密度として `appliedQuery` に echo |
| `page` | int | `1` | `>=1` |
| `limit` | int | `24` | `1..100` に clamp |
| `expand` | string / repeated | `[]` | `tags` 指定時のみ `items[].tags` を返す。comma separated / repeated の unknown は除外 |

enum 外や過大値は 400 ではなく default / clamp に fallback し、内部例外以外は 200 を返す。

### Response

Response は `PublicMemberListViewZ.strict()` を正本とし、`items`、`pagination`、`appliedQuery`、`topTags`、`generatedAt` を返す。`items[]` は `memberId` / `fullName` / `nickname` / `occupation` / `location` / `ubmZone` / `ubmMembershipType` を基本 field とし、optional で `photoUrl`、`businessSummary`、`tags` を持つ。`businessSummary` は既存 `businessOverview` の先頭 1 行を trim し、120 文字で server cap した公開一覧用要約である。`tags` は `expand=tags` 指定時のみ `{ code, label, category }[]` として返す。`responseEmail`、`publicConsent`、`rulesConsent`、`publishState`、`isDeleted`、管理メモなどの admin-only field は返さない。

`topTags` は `/members` の tag chip picker 用候補であり、公開境界を通る member に紐づく active tag を `{ code, label, count }[]` として最大 20 件返す。集計は `COUNT(DISTINCT member_id)` の降順、同数時は `code ASC` とし、追加 endpoint は作らない。`tag` query による絞り込みは repeated `tag` の AND 条件を維持し、`topTags` 自体は候補提示のための補助 field として返す。

### Public boundary

公開一覧は常に `public_consent='consented'`、`publish_state='public'`、`is_deleted=0`、canonical alias source 除外を base WHERE とする。`businessSummary` は `businessOverview` が public visibility の既存 field である場合のみ projection し、D1 schema / Google Form schema / endpoint surface は変更しない。`status=private` や `status=withdrawn` のような値が来ても `status=all` に fallback し、非公開・削除済み・同意なし member を結果に混入させない。

`Cache-Control` は `no-store` とし、admin 側の公開状態変更が公開一覧へ遅延反映されないようにする。

---

## schema sync で取得する metadata

- `formId`
- `title`
- `revisionId`
- `items[].itemId`
- `items[].title`
- `items[].description`
- `items[].questionItem.question.questionId`
- `items[].questionItem.question.questionType`
- `items[].questionItem.question.choiceQuestion.options`
- `items[].questionItem.question.validation`
- `items[].pageBreakItem`
- `items[].sectionHeaderItem`

---

## 保存ルール

1. UI は `stableKey` を参照して描画する
2. `questionId` 直書きの UI を作らない
3. 未解決の追加質問は `extraFields` として保持する
4. 過去 manifest は削除しない
5. 31 項目の既知項目と schema 外データを混同しない

## schema alias assignment API（07b）

`GET /admin/schema/diff` は `recommendedStableKeys: string[]` を同梱する。候補順の label 比較は `apps/api/src/services/aliasRecommendation.ts` の `normalizeLabelForCompare` で両辺を NFKC 正規化、trim、連続 whitespace 圧縮してから Levenshtein 距離へ渡す。response shape は `string[]` のまま変えない。`stableKey` は `/^[a-zA-Z][a-zA-Z0-9_]*$/` に一致する必要がある。

`POST /admin/schema/aliases?dryRun=true` は DB / queue / audit に副作用を出さず、`affectedResponseFields` / `currentStableKeyCount` / `conflictExists` を返す。apply は `schema_aliases` へ manual alias を INSERT し、任意 `schema_diff_queue.status='resolved'`、`response_fields.stable_key='__extra__:<questionId>'` の back-fill、`audit_log.action='schema_diff.alias_assigned'` を同じ workflow 境界で実行する。`schema_questions.stable_key` は fallback 期間の参照互換として残し、manual alias の主 write target には戻さない。

collision は同一 `revision_id` 内の別 `question_id` が同じ stableKey を持つ場合に `409 stable_key_collision` + `existingStableKey`、body validation は `422` + `existingQuestionIds`、diff 不在は `404`、diff と question 不一致は `409` を返す。back-fill が CPU budget に達した場合は `202 backfill_cpu_budget_exhausted` + `retryable=true` として UI に再試行可能状態を返す。大規模 back-fill / UNIQUE index / retryable HTTP contract は `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` に分離済み。

Issue #777 schema diff resolve history view では、`/(admin)/admin/schema/history` UI が既存 `GET /admin/audit?action=schema_diff.alias_assigned` をそのまま data source として参照する（案 A 採用、新 endpoint 追加禁止）。UI は `before_json.stableKey` / `after_json.stableKey` / `after_json.questionText` / `actorEmail` / `createdAt` を表示し、cursor pagination は既存 audit endpoint の `encodeAuditCursor` を踏襲する。filter は `action` 固定 + `actorEmail` / `from` / `to` の既存 query を組み合わせる。

### Schema alias rollback / undo API（Issue #778）

`POST /admin/schema/aliases/:aliasId/rollback` は、誤った alias resolve を D1 直接修正なしで取り消す admin-only endpoint である。request は `If-Match: version=<N>` header を必須とし、body は `{ "reason"?: string }` を受け取る。version 不一致は `409 version_mismatch`、対象なしは `404 not_found`、既に soft delete 済みなら `404 already_deleted` を返す。

成功時 response は `{ aliasId, rolledBackAt, relatedAuditId, newVersion, impact: { affectedResponseCount, recomputeRequired } }`。rollback は `schema_aliases.deleted_at / deleted_by / version` を更新し、必要に応じて `schema_diff_queue.status` を `resolved -> queued` に戻し、application `audit_log.action='schema_alias.rollback'` を追加する。元 resolve audit への参照は rollback 行の `after_json.relatedAuditId` に保存する。Cloudflare Audit Logs 取り込み用 `cf_audit_log` はこの admin mutation の保存先にしない。

Issue #776 の `/admin/schema` bulk resolve は **新しい bulk endpoint を追加しない**。`apps/web/src/lib/admin/api.ts#postSchemaAliasBulk` が既存 `POST /admin/schema/aliases` を concurrency 8 の client-side bounded fan-out で呼び、入力順の `success / retryable / error` row result を返す。`stableKey` validation は single edit と同じ regex（英字開始、英数字と `_` のみ）を UI 側で共有し、`status=0` は `network`、`409` は `conflict`、`422` は `invalid` として分類する。HTTP 202 `backfill_cpu_budget_exhausted` は failure ではなく retryable row として modal に残す。

Issue #837 の `/admin/schema` bulk rollback も **新しい bulk endpoint を追加しない**。`apps/web/src/lib/admin/api.ts#rollbackSchemaAliasBulk` が既存 `POST /admin/schema/aliases/:aliasId/rollback` を concurrency 8 / 最大 50 件の client-side bounded fan-out で呼び、入力順の `{ aliasId, status, data?, error? }` row result を返す。各 row の `version` は単体 rollback helper の `If-Match: version=<N>` に渡す。`409` は `version_mismatch`、`404` は `not_found`、`401/403` は `forbidden`、network failure は `network` として分類する。transaction 境界と audit は per-alias 単位で、部分失敗は成功分を rollback 済みとして確定し失敗 row だけを UI に残す。

### Schema alias recompute API（Issue #836）

`POST /admin/schema/aliases/:aliasId/recompute` は、rollback 済み alias によって古い `response_fields.stable_key` が残る状態を admin 明示操作で整復する endpoint である。request body は `{ "reason"?: string }` のみを受け取り、`triggerKey` は client から受け取らない。server は最新 rollback audit id、または fallback `${aliasId}:${version}` から trigger key を導出し、`schema_alias_recompute_jobs` の `UNIQUE(alias_id, stable_key, trigger_key)` で冪等性を担保する。

成功時 response は `{ jobId, aliasId, status, affectedCount, processedCount, updatedCount, deletedCollisionCount, recomputeAuditId, relatedRollbackAuditId }`。`affectedCount` は job 作成時の対象件数、`processedCount` は処理した response id 件数、`updatedCount` は `alias.stableKey -> __extra__:{questionId}` に UPDATE した件数、`deletedCollisionCount` は既存 `__extra__` 行との衝突で stableKey 行を DELETE した件数である。既存 completed job の再実行では reverse-backfill と audit insert を再実行せず、job に保存された `recomputeAuditId` を返す。

error は 400 `bad_request`、404 `not_found`、409 `not_rolled_back`、500 `batch_failed`。CPU budget に達した場合は `status="running"` と last processed `response_id` cursor を job に保存し、次の POST で lease (`locked_at` / `run_token`) を取得して継続する。application `audit_log.action='schema_alias.recompute'` の `after_json` は `{ jobId, affectedCount, processedCount, updatedCount, deletedCollisionCount, relatedRollbackAuditId, triggerKey, reason }` を保持する。`cf_audit_log` はこの admin mutation の保存先にしない。

`GET /admin/schema/aliases/:aliasId/recompute` は直近 job status を返す。job 不在時は `200 null`、存在時は `{ jobId, aliasId, status, affectedCount, processedCount, updatedCount, deletedCollisionCount, lastError, updatedAt }` を返す。apps/web は `/api/admin/schema/aliases/:aliasId/recompute` proxy / `fetchAdmin` 経由で呼び、D1 を直接参照しない。

## admin identity conflict merge API（Issue #194）

03b response sync が `EMAIL_CONFLICT` を記録した運用文脈では、admin が同一人物の重複 identity を手動確認して merge できる。

| endpoint | request | response | rule |
| --- | --- | --- | --- |
| `GET /admin/identity-conflicts?cursor=&limit=` | query: `cursor?`, `limit` 1..100 default 50 | `{ items, nextCursor }` | `requireAdmin` 必須。`member_identities` 全体から `fullName` + `occupation` の NFKC/trim 完全一致を候補化し、`identity_aliases` 登録済 source と `identity_conflict_dismissals` 登録済 pair を除外する |
| `POST /admin/identity-conflicts/:id/merge` | `{ targetMemberId, reason }` | `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }` | `:id` は `source__target`。`targetMemberId` 不一致は 400、既 merge は 409、member 不在は 404 |
| `POST /admin/identity-conflicts/:id/dismiss` | `{ reason }` | `{ dismissedAt }` | 同一 pair の重複 dismiss は 200 upsert とし、reason / dismissed_by / dismissed_at を更新する |

`responseEmail` は API 応答では `responseEmailMasked` のみ返し、full email は UI / log / screenshot に出さない。merge reason は email / phone を `[redacted]` に置換して永続化する。


---

## Static Manifest Retirement Condition

`apps/api/src/repository/_shared/generated/static-manifest.json` は 03a alias queue / forms schema sync 完成までの暫定 baseline である。以下条件を**すべて**満たした時点で削除する:

1. 03a forms schema sync が D1 `schema_questions` テーブルを populate している
2. `MetadataResolver` が D1 から `resolveSectionKey` / `resolveFieldKind` / `resolveLabel` を返す実装に差し替わっている
3. `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts` の D1-backed 実装版が PASS している
4. `pnpm verify:static-manifest` が「manifest 不要」モードで PASS する（または job 自体が削除される）

retirement 実行は別 task で行い、削除と同時に本仕様の本節も削除する。stale detection の運用は `scripts/verify-static-manifest.mjs`（CI gate: `pnpm verify:static-manifest`）が担い、決定論的再生成は `scripts/regenerate-static-manifest.mjs`（`pnpm regenerate:static-manifest`）に集約する。
