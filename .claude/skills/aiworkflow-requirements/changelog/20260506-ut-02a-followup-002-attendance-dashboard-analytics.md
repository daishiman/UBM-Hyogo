# 20260506 UT-02A followup-002 attendance dashboard analytics

`docs/30-workflows/ut-02a-followup-002-attendance-dashboard-analytics/` を `implemented-local / implementation / VISUAL_ON_EXECUTION / local tests passed / runtime curl and UI screenshot pending` として同期。

## Synced Facts

- Issue #370 は CLOSED のまま、PR 時は `Refs #370` のみ。
- `meeting_sessions.session_id` が current schema の PK。`meeting_sessions.id` は使用しない。
- Dashboard aggregate は `computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking` の 3 関数を `apps/api/src/repository/attendance.ts` 末尾へ追加済み。
- Route は既存 `apps/api/src/routes/admin/dashboard.ts` を拡張し、`requireAdmin` gate 配下に `/admin/dashboard/attendance/{overview,by-session,ranking}` を追加済み。
- Web は `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`。API bridge は既存 `apps/web/app/api/admin/[...path]/route.ts` を再利用し、専用 bridge は作らない。
- Admin sidebar は `/admin/dashboard/attendance` への `出席分析` link を持つ。
- Shared schema は `AttendanceOverviewZ` / `SessionAttendanceRowsZ` / `MemberAttendanceRankingRowsZ` を正とし、route response を safeParse する。
- Index policy は新規 `idx_member_attendance_member` のみ。既存 `idx_member_attendance_session` / `idx_meeting_sessions_active_held_on` を流用する。
- 削除済み session / member は attendance count と rate から除外する。
- Phase 11 は repository / route / EXPLAIN Vitest PASS。curl / UI screenshots は user-approved runtime capture cycle で採取する。

## Updated Files

- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/api-endpoints.md`
- `references/database-implementation-core.md`
- `references/task-workflow-active.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `LOGS/_legacy.md`
- `changelog/20260506-ut-02a-followup-002-attendance-dashboard-analytics.md`

## Lessons Learned / 苦戦箇所

将来同種の admin dashboard analytics タスクで再利用する技術判断ポイント。

### L1: chunk pattern 共存設計（attendance.ts 内の 2 ポリシー併存）

`apps/api/src/repository/attendance.ts` には member profile read など 1-entity pagination 用途の **chunk 必須コード**と、本タスクで追加した cross-entity GROUP BY aggregate の **chunk 禁止コード**が同居している。誤って aggregate 側に chunk を流用すると N+1 クエリ化して D1 free tier の row read を浪費する。

- **回避策**: aggregate 関数群は単一 SQL の GROUP BY で実装し、ファイル末尾セクションに方針コメントを残す。chunk 必須/禁止の境界を将来読み手が即座に判別できるようにする。
- **再発防止**: 新 aggregate を追加する際は本 changelog と `references/database-implementation-core.md` の chunk 非流用方針を参照する。

### L2: 削除済み member / session の集計除外ポリシー統一

3 aggregate 関数すべてで「分子と分母の両方から削除済み行を除外」する必要があり、`meeting_sessions.deleted_at IS NULL` と `COALESCE(member_status.is_deleted, 0) = 0` を JOIN/WHERE で統一適用した。`computeAttendanceOverview` の subquery で NULLIF 二重ネストが発生し可読性が下がるが、ratio 算出時のゼロ除算回避と削除済み行カウント混入を同時に防ぐために必要。

- **判断根拠**: Phase 11 EXPLAIN Vitest で index 利用 + p95<300ms を満たすことを確認済み。可読性より正確性を優先。
- **再利用ポイント**: 同様の rate / ratio 集計タスクでは、削除済み除外を SQL 側に集約し、route 側で再計算しない。

### L3: ranking displayName の response_email fallback（暫定判断）

`listMemberAttendanceRanking` の `display_name` フィールドは `member_intake.response_email` を当面の表示名 fallback として使用する。MVP 時点では正規の表示名カラムが存在しないため、admin 内部閲覧用途で一意識別できる email を採用した。

- **将来 migration ポイント**: 表示名カラム（例: `members.display_name`）が導入された段階で `attendance.ts` の SELECT 句のみを差し替える。route / shared schema は影響なし。
- **privacy boundary**: response 経路は `requireAdmin` gate 配下のみ。public / member self UI には流出しない。

### L4: 既存 index 流用優先方針

新設 index は `idx_member_attendance_member` の 1 本のみ。session 側は既存 `idx_member_attendance_session`、meeting 側は既存 `idx_meeting_sessions_active_held_on` を流用した。D1 free tier の storage 制約下では、新規 index 追加コストが運用上のリスクであり、EXPLAIN で既存 index がカバーする read path を優先確認する設計が再利用可能。

- **再利用ポイント**: analytics 系タスクで新規 index を追加する前に、既存 index のカバー範囲を `EXPLAIN QUERY PLAN` で確認する step を Phase 4-5 で必ず通過させる。

