# Phase 2: 設計

実装区分: 実装仕様書（CONST_005 の必須項目を本フェーズで全て確定する）

## 2.1 設計サマリ

本タスクは attendance データの集計可視化を以下 3 層で実現する。

1. **migration 層**: analytics 専用 index を 1 ファイルで追加（`member_attendance(member_id)` のみ新規。他は既存流用）
2. **repository 層**: `apps/api/src/repository/attendance.ts` 末尾に 3 つの aggregate 関数を追加。各関数は GROUP BY を含む単発クエリで完結する（`ATTENDANCE_BIND_CHUNK_SIZE` を import しない）
3. **route 層**: `apps/api/src/routes/admin/dashboard.ts` に GET 3 本を追加。`requireAdmin` middleware を経由
4. **UI 層**: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` を新規作成。3 ブロック描画

## 2.2 関数シグネチャ（CONST_005 必須）

```ts
// apps/api/src/repository/attendance.ts （末尾 analytics セクション）

export interface AttendanceOverview {
  totalSessions: number;
  totalMembers: number;
  overallRate: number;
}

export interface SessionAttendanceRow {
  sessionId: string;
  title: string;
  heldOn: string;
  attendeeCount: number;
  rate: number;
}

export interface MemberAttendanceRanking {
  memberId: MemberId;
  displayName: string;
  attendedCount: number;
  rate: number;
}

export async function computeAttendanceOverview(
  c: DbCtx,
): Promise<AttendanceOverview>;

export async function listSessionAttendanceStats(
  c: DbCtx,
  opts?: { limit?: number },
): Promise<SessionAttendanceRow[]>;

export async function listMemberAttendanceRanking(
  c: DbCtx,
  opts?: { limit?: number },
): Promise<MemberAttendanceRanking[]>;
```

### 副作用 / 不変条件

- すべて read-only。`member_attendance` / `meeting_sessions` / `members` view / `member_status` への書き込みなし
- `meeting_sessions.deleted_at IS NULL` を全クエリで条件として固定
- `member_status.is_deleted = 0` を分母 / ranking 集計で固定
- `ATTENDANCE_BIND_CHUNK_SIZE` を import しない（Phase 9 grep gate で検証）

## 2.3 aggregate SQL 設計

### overview （単発クエリ）

```sql
SELECT
  (SELECT COUNT(*) FROM meeting_sessions WHERE deleted_at IS NULL) AS total_sessions,
  (SELECT COUNT(*) FROM member_status WHERE is_deleted = 0)         AS total_members,
  COALESCE(
    CAST(COUNT(ma.member_id) AS REAL)
      / NULLIF(
          (SELECT COUNT(*) FROM meeting_sessions WHERE deleted_at IS NULL)
          * (SELECT COUNT(*) FROM member_status WHERE is_deleted = 0),
          0
        ),
    0
  ) AS overall_rate
FROM member_attendance ma
INNER JOIN meeting_sessions s ON s.session_id = ma.session_id AND s.deleted_at IS NULL
INNER JOIN member_status     ms ON ms.member_id = ma.member_id AND ms.is_deleted = 0;
```

EXPLAIN 期待: `SEARCH meeting_sessions USING INDEX idx_meeting_sessions_active_held_on`、`SEARCH member_attendance USING INDEX idx_member_attendance_session`（PK 経由）。

### by-session （GROUP BY session）

```sql
SELECT
  s.session_id  AS session_id,
  s.title       AS title,
  s.held_on     AS held_on,
  COUNT(ma.member_id) AS attendee_count,
  COALESCE(
    CAST(COUNT(ma.member_id) AS REAL)
      / NULLIF((SELECT COUNT(*) FROM member_status WHERE is_deleted = 0), 0),
    0
  ) AS rate
FROM meeting_sessions s
LEFT JOIN member_attendance ma ON ma.session_id = s.session_id
LEFT JOIN member_status    ms ON ms.member_id = ma.member_id AND ms.is_deleted = 0
WHERE s.deleted_at IS NULL
GROUP BY s.session_id, s.title, s.held_on
ORDER BY s.held_on DESC
LIMIT ?;  -- opts.limit (default 50)
```

EXPLAIN 期待: `SEARCH meeting_sessions USING INDEX idx_meeting_sessions_active_held_on`、`SEARCH member_attendance USING INDEX idx_member_attendance_session`。

### ranking （GROUP BY member）

```sql
SELECT
  m.member_id       AS member_id,
  m.full_name       AS display_name,
  COUNT(ma.session_id) AS attended_count,
  COALESCE(
    CAST(COUNT(ma.session_id) AS REAL)
      / NULLIF((SELECT COUNT(*) FROM meeting_sessions WHERE deleted_at IS NULL), 0),
    0
  ) AS rate
FROM members m
INNER JOIN member_status ms ON ms.member_id = m.member_id AND ms.is_deleted = 0
LEFT JOIN  member_attendance ma ON ma.member_id = m.member_id
LEFT JOIN  meeting_sessions   s ON s.session_id = ma.session_id AND s.deleted_at IS NULL
GROUP BY m.member_id, m.full_name
ORDER BY attended_count DESC, m.full_name ASC
LIMIT ?;  -- opts.limit (default 50)
```

EXPLAIN 期待: `members` view の current 展開を確認しつつ、`SEARCH member_attendance USING INDEX idx_member_attendance_member`（**新規 index**）を必須にする。

## 2.4 admin route 設計

| route | method | 入力 | 出力 | status | 備考 |
| --- | --- | --- | --- | --- | --- |
| `/admin/dashboard/attendance/overview` | GET | none | `AttendanceOverview` | 200 / 401 / 403 | 単発 |
| `/admin/dashboard/attendance/by-session` | GET | query: `?limit=` (1〜200, default 50) | `SessionAttendanceRow[]` | 200 / 401 / 403 / 400 | 入力 validation |
| `/admin/dashboard/attendance/ranking` | GET | query: `?limit=` (1〜200, default 50) | `MemberAttendanceRanking[]` | 200 / 401 / 403 / 400 | 入力 validation |

- 全 route は既存 `app.use("*", requireAdmin)` 配下に配置（route 単体で gate を持たせない）
- 非 admin: middleware から 401（未認証）/ 403（admin 以外）
- `limit` の数値解釈失敗 / 範囲外: 400 `invalid_query`

## 2.5 UI 配置

### page: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`

- 既存 `(admin)` レイアウト（admin chrome / nav）を流用
- データ取得は server component で `/api/admin/dashboard/attendance/{overview,by-session,ranking}` の 3 本を `Promise.all` で並列実行
- ブロック構成:
  1. **overview カード**: `totalSessions` / `totalMembers` / `overallRate`（％表示）
  2. **by-session テーブル**: `held_on` 降順、列 = 開催日 / タイトル / 出席者数 / 出席率
  3. **ranking テーブル**: `attended_count` 降順、列 = 順位 / 会員名 / 出席数 / 出席率
- 空データフォールバック: 各ブロックに「データがありません」を表示（テスト対象）

### bridge: `apps/web/app/api/admin/[...path]/route.ts`（既存再利用）

- 既存 admin API bridge pattern を踏襲（apps/web から直接 D1 アクセス禁止 / `apps/api` Worker への service-binding 経由）
- 専用 `apps/web/app/api/admin/dashboard/attendance/[...path]/route.ts` は新設しない。既存 catch-all proxy の対象 path を増やすだけで足りるため、二重 proxy を避ける。

## 2.6 変更ファイル一覧（CONST_005 必須項目）

| パス | 変更種別 | 主要差分 |
| --- | --- | --- |
| `apps/api/migrations/00XX_attendance_analytics_indexes.sql` | 新規 | `CREATE INDEX IF NOT EXISTS idx_member_attendance_member ON member_attendance(member_id);` 1 行のみ |
| `apps/api/src/repository/attendance.ts` | 編集（末尾追記） | analytics セクション: 3 type + 3 関数 + helper（共有 SQL 断片） |
| `apps/api/src/repository/attendance.test.ts` | 編集 | aggregate 関数 3 本の単体テスト追加（空 / 通常 / 削除済み除外） |
| `apps/api/src/routes/admin/dashboard.ts` | 編集 | GET 3 本を追加。既存 `requireAdmin` 配下に配置 |
| `apps/api/src/routes/admin/dashboard.test.ts` | 編集 | 統合テスト追加（admin gate 通過 / 401 / 403 / limit 400） |
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 新規 | server component。3 ブロック描画 |
| `apps/web/app/api/admin/[...path]/route.ts` | 既存流用 | API bridge（service-binding 経由）。attendance 専用 route は追加しない |
| `apps/web/app/(admin)/admin/dashboard/attendance/page.test.tsx` | 新規 | UI smoke（render + 空フォールバック） |
| `docs/30-workflows/ut-02a-followup-002-attendance-dashboard-analytics/outputs/**` | 新規 | Phase 1〜13 outputs 成果物 |

## 2.7 入出力定義

### `computeAttendanceOverview`

- **入力**: `c: DbCtx`
- **出力**: `AttendanceOverview`（`totalSessions` / `totalMembers` / `overallRate` 0〜1）
- **副作用**: なし（read-only）

### `listSessionAttendanceStats`

- **入力**: `c: DbCtx`, `opts?: { limit?: number }` (default 50, max 200)
- **出力**: `SessionAttendanceRow[]` (held_on DESC)
- **副作用**: なし

### `listMemberAttendanceRanking`

- **入力**: `c: DbCtx`, `opts?: { limit?: number }` (default 50, max 200)
- **出力**: `MemberAttendanceRanking[]` (attended_count DESC, displayName ASC)
- **副作用**: なし

## 2.8 テスト方針（追加テストファイル・ケース）

| ファイル | ケース |
| --- | --- |
| `apps/api/src/repository/attendance.test.ts` | (a) 空データで overview = 0/0/0、(b) 通常データで集計値、(c) 削除済み session / member の除外、(d) ranking limit 動作、(e) by-session held_on DESC |
| `apps/api/src/routes/admin/dashboard.test.ts` | (a) admin で 200、(b) 非 admin で 403、(c) 未認証で 401、(d) limit 範囲外で 400、(e) response shape 検証 |
| `apps/web/app/(admin)/admin/dashboard/attendance/page.test.tsx` | (a) 3 ブロック描画、(b) 空データで「データがありません」表示 |

## 2.9 ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test attendance
mise exec -- pnpm --filter @ubm-hyogo/api test admin/dashboard
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test admin/dashboard/attendance
mise exec -- pnpm typecheck && mise exec -- pnpm lint && mise exec -- pnpm build
# Phase 9: EXPLAIN QUERY PLAN を local D1 で実行し outputs/phase-09/explain-query-plan.md に固定
```

## 2.10 DoD（Definition of Done）

- 上記コマンド全 PASS
- AC-1〜11 が Phase 7 マトリクスでトレース完了
- 既存 02a / followup-001 / 既存 admin dashboard route の regression なし
- Phase 11 の curl evidence 4 件取得（overview / by-session / ranking / unauthorized 401）
- Phase 9 で `EXPLAIN QUERY PLAN` 出力に対象表の full scan を含まないことを確認
- `ATTENDANCE_BIND_CHUNK_SIZE` の grep が aggregate 関数定義に hit しないことを確認

## 2.11 system-spec への影響

`docs/00-getting-started-manual/specs/01-api-schema.md` の admin route 一覧へ 3 本を追記する（Phase 12）。aggregate 専用 index 追加は `08-free-database.md` に注記する。`MemberProfile.attendance` 型契約には変更なし。

## 2.12 将来拡張点（scope out 明示）

- materialized view / cron 集計テーブル → 本タスク scope out。Phase 3 で代替案として記録のみ
- 期間フィルタ / カテゴリ別集計 → 別 follow-up タスクで検討
- 公開ディレクトリ / メンバー側可視化 → 別タスク
- ページング → [ut-02a-followup-004](../completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-004-attendance-pagination.md) と整合
