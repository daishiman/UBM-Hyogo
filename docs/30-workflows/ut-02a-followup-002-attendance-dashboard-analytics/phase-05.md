# Phase 5: 実装ランブック

実装区分: 実装仕様書（CONST_004 デフォルト適用 — CONST_005 の実行手順）

## 5.1 前提

- Phase 1〜4 が design_locked
- mise + pnpm 環境セットアップ完了（CLAUDE.md 参照、Node 24.15.0 / pnpm 10.33.2）
- ブランチは `feature/issue-370-attendance-dashboard-analytics` 系
- 02a / 02a-followup-001（write operations）がすでに main にマージ済み
- 02b（attendance bulk import 等）と `apps/api/migrations/` の編集権競合可能性あり → Step 1 で必ず採番確認

## 5.2 順序固定 runbook

### Step 1 — migration ファイル作成（10 min）

1. **採番衝突回避（02b と必須調整）**:
   ```bash
   git fetch origin
   git log --oneline origin/main -- apps/api/migrations/ | head -20
   ls apps/api/migrations/ | sort
   ```
   現状 `0014_*` が複数並行。新規は **`0015_attendance_analytics_indexes.sql`** で採番。02b ブランチが先行する場合は `0016_*` 等にリネームする。
2. ファイル新規作成: `apps/api/migrations/0015_attendance_analytics_indexes.sql`
   ```sql
   -- Phase 4 EXPLAIN QUERY PLAN 検証で ranking 側の member lookup を安定化する analytics 専用 index
   -- session 側は 0002 の idx_member_attendance_session、meeting 側は 0013 の idx_meeting_sessions_active_held_on を流用する。
   CREATE INDEX IF NOT EXISTS idx_member_attendance_member
     ON member_attendance (member_id);
   ```
3. ローカル D1 反映:
   ```bash
   mise exec -- pnpm --filter @ubm-hyogo/api d1:migrations:apply:local
   ```
4. typecheck PASS を確認。

### Step 2 — repository に aggregate 関数追加（30 min）

1. `apps/api/src/repository/attendance.ts` の **末尾追記** で 3 関数を実装:
   - `computeAttendanceOverview(c: DbCtx): Promise<AttendanceOverview>`
   - `listSessionAttendanceStats(c: DbCtx, opts?: { limit?: number }): Promise<SessionAttendanceRow[]>`
   - `listMemberAttendanceRanking(c: DbCtx, opts?: { limit?: number }): Promise<MemberAttendanceRanking[]>`
2. **chunk pattern を流用しない**こと:
   - `ATTENDANCE_BIND_CHUNK_SIZE` を import しない
   - `IN (?, ?, ...)` の動的 bind は使わない
   - すべて `GROUP BY` 単発クエリで完結
3. SQL 例（overview）:
   ```sql
   SELECT
     (SELECT COUNT(*) FROM meeting_sessions WHERE deleted_at IS NULL) AS totalSessions,
     (SELECT COUNT(*) FROM members m
      LEFT JOIN member_status ms ON ms.member_id = m.member_id
      WHERE COALESCE(ms.is_deleted, 0) = 0) AS totalMembers,
     COALESCE(
       CAST(COUNT(ma.member_id) AS REAL) /
       NULLIF((SELECT COUNT(*) FROM meeting_sessions WHERE deleted_at IS NULL), 0) /
       NULLIF((SELECT COUNT(*) FROM members), 0),
       0
     ) AS overallRate
   FROM member_attendance ma
   JOIN meeting_sessions s ON s.session_id = ma.session_id AND s.deleted_at IS NULL;
   ```
4. zero-division は `NULLIF` + `COALESCE` で防御。
5. 型は `_shared/types/attendance-analytics.ts`（新規）に export interface として配置するか、`attendance.ts` 末尾に併記（既存スタイルに合わせる）。

### Step 3 — repository unit test 追加（30 min）

`apps/api/src/repository/__tests__/attendance-analytics.test.ts` 新規:
- Phase 4 T1〜T8（正常系・空テーブル・削除除外・limit）
- Phase 4 T12（chunk pattern 非流用の grep）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:run -- attendance-analytics
```

### Step 4 — EXPLAIN QUERY PLAN 検証 test 追加（20 min）

同 `attendance-analytics.test.ts` に T9〜T11 を追加:

```ts
it("computeAttendanceOverview は対象表の full scan を含まない", async () => {
  const plan = await env.DB.prepare(`EXPLAIN QUERY PLAN ${OVERVIEW_SQL}`).all();
  const text = plan.results.map((r: any) => r.detail).join("\n");
  expect(text).not.toMatch(/SCAN (member_attendance|meeting_sessions)\b/);
});
```

対象表の full scan が 1 件でも検出されたら fail。

### Step 5 — admin route 追加（30 min）

1. 既存 `apps/api/src/routes/admin/dashboard.ts` を拡張し、既存 `createAdminDashboardRoute` / `app.use("*", requireAdmin)` 配下に追加:
   - `GET /admin/dashboard/attendance/overview`
   - `GET /admin/dashboard/attendance/by-session`
   - `GET /admin/dashboard/attendance/ranking`
2. `app.use("/admin/*", adminGate)` の既存適用を確認（05a admin gate を経由）。
3. 各 route は単に repository の aggregate 関数を呼び、JSON で返す。

### Step 6 — admin route 統合テスト追加（20 min）

`apps/api/src/routes/admin/dashboard.test.ts` に追記:
- T13〜T17（200 / 401 / 403）
- admin token は `_test-auth.ts` 経由で取得

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:run -- dashboard-attendance
```

### Step 7 — admin UI page 追加（40 min）

1. 実パス確認:
   ```bash
   ls apps/web/app/\(admin\)/admin/dashboard/ 2>/dev/null || \
     find apps/web -type d -name dashboard | grep admin
   ```
2. `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` を新規作成（実パスは確認結果に従う）
3. `apps/api` の 3 endpoint を fetch し、3 つのカード/テーブルを描画:
   - Overview カード（totalSessions / totalMembers / overallRate）
   - By-session テーブル（held_on DESC、limit 20）
   - Ranking テーブル（attendedCount DESC、limit 20）
4. `apps/web` から D1 を直接 import しないこと（不変条件 #5、AC-8）。

### Step 8 — Playwright smoke 追加（20 min）

`apps/web/playwright/tests/admin-attendance-dashboard.spec.ts` 新規:
- admin としてログイン
- `/admin/dashboard/attendance` にアクセス
- 3 カード/テーブル要素の存在確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e -- admin-attendance-dashboard
```

### Step 9 — focused tests 全 PASS 確認（10 min）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:run
mise exec -- pnpm --filter @ubm-hyogo/web test:run
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm build
```

### Step 10 — curl evidence 取得（15 min）

`apps/api` ローカル起動 → admin token 取得 → 4 ケースを curl 実行:

```bash
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://127.0.0.1:8787/admin/dashboard/attendance/overview \
  | tee outputs/phase-11/evidence/api-curl/dashboard-attendance-overview-ok.json

curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://127.0.0.1:8787/admin/dashboard/attendance/by-session \
  | tee outputs/phase-11/evidence/api-curl/dashboard-attendance-by-session-ok.json

curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://127.0.0.1:8787/admin/dashboard/attendance/ranking \
  | tee outputs/phase-11/evidence/api-curl/dashboard-attendance-ranking-ok.json

curl -s -i \
  http://127.0.0.1:8787/admin/dashboard/attendance/overview \
  | tee outputs/phase-11/evidence/api-curl/dashboard-attendance-unauthorized-401.json
```

## 5.3 migration 番号衝突回避手順（02b 調整）

- Step 1 着手前に必ず `git fetch origin && git log --oneline origin/main -- apps/api/migrations/` を実行
- 02b ブランチがすでに `0015_*` を採番している場合は本タスクの migration を **`0016_attendance_analytics_indexes.sql`** にリネーム
- リネーム時は test 内の path 参照（あれば）も grep で更新
- 衝突発覚が Step 5 以降の場合でも、migration ファイル名のリネーム + ローカル D1 再 apply で復旧可能（5.4 参照）

## 5.4 ローカル D1 reset 手順

```bash
# wrangler の miniflare local D1 を初期化（test fixture を再投入）
rm -rf apps/api/.wrangler/state/v3/d1
mise exec -- pnpm --filter @ubm-hyogo/api d1:migrations:apply:local
```

test fixture seed が必要な場合は `apps/api/src/repository/__tests__/_fixtures/` 配下の seeder を呼ぶ。

## 5.5 中断時の復旧手順

- Step 2 で typecheck エラー → `_shared/types/` に型を集約してから再開
- Step 4 で `member_attendance` / `meeting_sessions` の全表 scan 残存 → index 設計を見直し、`d1:migrations:apply:local` で再適用
- Step 7 で admin route path 不明 → `apps/web/app/(admin)/admin/` の既存 dashboard ページ階層を確認し、最も近い構造に合わせる

## 5.6 DoD

- Step 1〜10 全完走
- Phase 4 test matrix（T1〜T22）全 PASS
- typecheck / lint / build / focused test 全 PASS
- curl evidence 4 件 + Playwright smoke ログ取得済み
- 既存 02a / 02a-followup-001 / 02b regression なし
- migration 番号衝突なし（02b と整合）
