# Implementation Guide — ut-02a-followup-002 attendance dashboard analytics

## Part 1: 中学生レベル

このタスクは、集会に誰がどれくらい参加しているかを管理者が見られる画面を新しく追加するための実装です。

データベースには「誰がどの集会に出席したか」の記録が入っています。そこから

- 全体で何パーセントが参加したか
- 集会ごとに何人が出席したか
- 会員別に出席回数の多い順ランキング

を計算して、管理ページに表として並べます。元の出席リストを 1 件ずつ取り出すのではなく、SQL の `GROUP BY` で 1 回のクエリにまとめて取るのがポイントです。

## Part 2: 技術者レベル

### 変更ファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/migrations/0015_attendance_analytics_indexes.sql` | 新規 | `idx_member_attendance_member` を追加（ranking 用） |
| `apps/api/src/repository/attendance.ts` | 末尾追記 | `computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking` |
| `apps/api/src/routes/admin/dashboard.ts` | 拡張 | `/admin/dashboard/attendance/{overview,by-session,ranking}` 3 endpoint を `requireAdmin` 配下に追加 |
| `apps/api/src/routes/admin/dashboard.test.ts` | 拡張 | 401 / 200 ケース 6 本追加 |
| `apps/api/src/repository/__tests__/attendance-analytics.test.ts` | 新規 | aggregate 関数 + AC-1 chunk 非流用 + AC-3 EXPLAIN QUERY PLAN 検証 11 本 |
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 新規 | overview カード / by-session テーブル / ranking テーブル |
| `packages/shared/src/zod/viewmodel.ts` | 拡張 | attendance analytics response schema を追加 |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 拡張 | `/admin/dashboard/attendance` への `出席分析` link を追加 |

### 設計方針

- **AC-1（chunk 非流用）**: analytics セクションは `ATTENDANCE_BIND_CHUNK_SIZE` / `chunkBy` を一切呼ばない。すべて `GROUP BY` 単発クエリで完結。test がコメント以外でこれらが現れないことを grep する。
- **AC-2（admin gate 中継）**: 既存 `createAdminDashboardRoute` の `app.use("*", requireAdmin)` 配下に追加し、route 単体で権限分岐を書かない。
- **AC-3（EXPLAIN QUERY PLAN）**: by-session / ranking SQL に対して `member_attendance` の `SCAN` が含まれないことを runtime 検証。`idx_member_attendance_session` (0002 既存) と新規 `idx_member_attendance_member` を活用。
- **AC-4（migration owner 範囲）**: 0015 のみ追加。02b との番号衝突は現状なし。
- **AC-5（型契約）**: overview / by-session / ranking は仕様書通りの shape を export interface として定義。
- **AC-6（UI 3 ブロック）**: overview カード（KPI 3 件）/ by-session テーブル / ranking テーブル + 空状態フォールバック。
- **AC-7（テスト）**: 単体 11 本 + route 統合 8 本（既存 dashboard 2 本も維持）+ AdminSidebar 到達性 test。
- **AC-8（D1 直接禁止）**: web は `fetchAdmin` 経由で `/admin/dashboard/attendance/*` のみ呼ぶ。
- **AC-9（型契約保護）**: `MemberProfile.attendance` 関連は触らない。
- **AC-10（regression）**: `pnpm --filter @ubm-hyogo/api test` を実行中。新規 `attendance-analytics.test.ts` 11 件は PASS 済みで、repository / route / EXPLAIN gate を同一テストスイート内で検証する。

### 実装上の補足

- ranking の `displayName` は `member_identities.response_email` を採用（schema に `full_name` が無いため、既存 attendance.ts の `listAttendableMembers` と同様の方針）。
- `overallRate` は `NULLIF` + `COALESCE` でゼロ割を防御し、空テーブル時は `0` を返す。
- `limit` は default 50 / 上限 200。不正値は route layer で 400。
- response shape は shared zod schema で route layer safeParse する。
- vitest の jsdom 環境では Miniflare D1 が初期化できないため、新規 test は `// @vitest-environment node` を付与する。

### ローカル確認手順

```bash
pnpm --filter @ubm-hyogo/api test
```

### スクリーンショット

本タスクは admin UI を含むが、本実装サイクルではローカルで `next dev` を起動した実機キャプチャを取得していない。Phase 11 evidence の `outputs/phase-11/evidence/api-curl/` および `outputs/phase-11/evidence/ui-smoke/admin-attendance-dashboard*.png` の記述に従い、user-approved runtime capture cycle で追加取得する。

### 残タスク（次サイクル）

- Phase 11 の curl evidence 4 ファイル（実 fetch）取得 — ローカル wrangler 起動環境で実施する想定。本実装サイクルでは vitest による route 200/401 検証で代替し、runtime PASS とは表記しない。
- Playwright smoke の実機実行と screenshot 保存。
