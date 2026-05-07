# Phase 1: 要件定義

実装区分: 実装仕様書（CONST_004 デフォルト適用 — `apps/api/src/repository/attendance.ts` analytics セクション追加 / `apps/api/src/routes/admin/dashboard.ts` 拡張 / `apps/api/migrations/00XX_attendance_analytics_indexes.sql` 新規 / `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` 新規 / 単体・統合・UI smoke テストの追加を伴う）

## 真の論点

| # | 論点 | 決定方針 | 決定根拠 |
| --- | --- | --- | --- |
| Q1 | 集計クエリは aggregate SQL（GROUP BY）で完結させるか、read path の chunk pattern を流用するか | **`ATTENDANCE_BIND_CHUNK_SIZE = 80` chunk pattern を流用しない**。各 aggregate 関数は GROUP BY を含む単発 SQL で完結させる | Issue #370 苦戦箇所そのもの。chunk pattern はメンバー単位の取得最適化であり、集計系では full scan / N+1 を誘発する |
| Q2 | 集計エンドポイントを 1 本に統合するか 3 本に分けるか | **3 本に分割**: `GET /admin/dashboard/attendance/overview` / `/by-session` / `/ranking`。各 endpoint は単一 aggregate クエリに対応 | 単一責務原則 / response shape の分岐削減 / クエリ単位での EXPLAIN 検証容易性 / UI 側の段階的レンダリング容易性 |
| Q3 | analytics 用 index 追加の Schema Ownership | **本タスクは `apps/api/migrations/00XX_attendance_analytics_indexes.sql` の新規ファイル作成のみを owner とする**。既存 migration は変更しない。番号は Phase 5 開始時点で 02b 状況を確認し最終決定する | 02b と編集権競合を避ける。具体的には `member_attendance(member_id)`（ranking 用）の追加 index のみが新規。`session_id` / `held_on` は既存 index を流用 |
| Q4 | EXPLAIN QUERY PLAN による full scan 回避の検証 | **Phase 9 で `EXPLAIN QUERY PLAN` を 3 クエリ全てに対し実行し、`member_attendance` / `meeting_sessions` の全表 scan が無いことを機械的に検証** | AC-3 の検証ゲート。SQLite/D1 の plan detail は出力形式が揺れるため、表名単位で判定し evidence を `outputs/phase-09/explain-query-plan.md` に固定 |
| Q5 | admin gate の結線 | **05a で確立した admin gate middleware（`requireAdmin`）を route 単体で迂回しない**。route 内では `c.get("authUser")` 等の確定 API のみを使う | route 単体の権限分岐は 05a 仕様で禁止。既存 `dashboard.ts` の `app.use("*", requireAdmin)` パターンを踏襲 |
| Q6 | UI 配置 | **`apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` を新規作成**。既存 `(admin)/admin` レイアウトを流用 | 既存 admin pages（`audit/` `meetings/` `members/` 等）と同階層に統一。dashboard 配下に attendance を nested |
| Q7 | branded type の扱い | **既存 `MemberId` / `sessionId: string` を維持し、新規 ID 型を増やさない**。`MemberAttendanceRanking.memberId` は `MemberId` を継承 | 02a 確定済み branded type 体系を尊重。aggregate は read 系の派生であり新規 branded type を要求しない |

## 現状ベースライン

本タスクは既存実装の硬化ではなく **新規追加** が主体である。以下は前提として参照する既存資産。

| 資産 | パス | 本タスクでの扱い |
| --- | --- | --- |
| repository | `apps/api/src/repository/attendance.ts` | 末尾に analytics セクションを追記（既存 export 不変） |
| repository | `apps/api/src/repository/meetings.ts` | 参照のみ（`meeting_sessions` schema 確認） |
| route | `apps/api/src/routes/admin/dashboard.ts` | 既存 `createAdminDashboardRoute` を拡張、`requireAdmin` middleware は流用 |
| migration | `apps/api/migrations/0002_admin_managed.sql` | `member_attendance` PK + `idx_member_attendance_session` 既存利用 |
| migration | `apps/api/migrations/0013_meeting_sessions_soft_delete.sql` | `meeting_sessions.deleted_at` + `idx_meeting_sessions_active_held_on` 既存利用 |
| 既存定数 | `ATTENDANCE_BIND_CHUNK_SIZE = 80`（attendance.ts:164） | **流用禁止**。aggregate 関数からは import しない |
| UI レイアウト | `apps/web/app/(admin)/admin/` | 流用（既存 `audit/` `meetings/` 等と同階層） |

## Acceptance Criteria（再掲）

index.md に記載の AC-1〜AC-11 を本 Phase の確定 AC とする。特に Issue #370 苦戦箇所に対応する以下 3 項目は Phase 9 で機械的な検証ゲートを設置する。

- AC-1: chunk pattern 非流用（`ATTENDANCE_BIND_CHUNK_SIZE` の import が aggregate 関数に存在しないことを grep で検証）
- AC-3: `EXPLAIN QUERY PLAN` の出力に `member_attendance` / `meeting_sessions` の全表 scan を含まない
- AC-4: 新規 migration の owner 範囲が本宣言通りであること（02b 既存ファイルへの diff が無いことを確認）

## Schema Ownership 宣言（本タスクの編集権宣言）

| 範囲 | 編集権 | 備考 |
| --- | --- | --- |
| `apps/api/migrations/00XX_attendance_analytics_indexes.sql` | 本タスク | 新規 1 ファイル。`CREATE INDEX IF NOT EXISTS idx_member_attendance_member ON member_attendance(member_id);` のみを含む（ranking 用）。session 側 index と held_on 側 index は既存を流用 |
| `apps/api/src/repository/attendance.ts` 末尾 analytics セクション | 本タスク | 既存 export 不変、新規 3 関数の追記のみ |
| `apps/api/src/routes/admin/dashboard.ts` | 本タスク | 既存 `app.use("*", requireAdmin)` を踏襲、新規 GET 3 本を追記 |
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 本タスク | 新規ページ |
| 既存 migration ファイル（0001〜0014）/ `apps/api/src/repository/meetings.ts` | 編集禁止 | 02b / 既存タスクの owner |

## 不変条件と本タスクの関係

| 不変条件 | 影響 | 守り方 |
| --- | --- | --- |
| #1 form schema を固定しない | 該当なし（attendance は admin-managed） | 変更なし |
| #4 admin-managed data の分離 | 直接該当 | 集計対象は `member_attendance` / `meeting_sessions` / `member_status` のみ。Form schema 起点の table は触らない |
| #5 D1 直接アクセスは apps/api に閉じる | 直接該当 | UI は `/api/admin/dashboard/attendance/*` 経由のみ。apps/web から D1 binding に直接アクセスしない |
| MemberProfile.attendance 型契約不変 | 直接該当 | aggregate 関数の戻り値は `MemberProfile` と無関係な独立 DTO（`AttendanceOverview` / `SessionAttendanceRow` / `MemberAttendanceRanking`） |
| admin gate 中継 | 直接該当 | route 単体で `if (auth)` を書かない。`requireAdmin` middleware のみが正規経路 |
| chunk pattern 非流用 | 直接該当（Issue 苦戦箇所） | aggregate 関数に `ATTENDANCE_BIND_CHUNK_SIZE` を import しない（Phase 9 grep gate） |

## automation-30 4条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | aggregate path と read path は独立系統。chunk pattern を共有しない明確な境界を持つ。`meeting_sessions.session_id` を正本列として使う |
| 漏れなし | PASS | overview / by-session / ranking の 3 視点で attendance 集計の主要ニーズを網羅。AC-11 は実装サイクルで curl evidence 4 ケースを取得する予約済み |
| 整合性あり | PASS | `MemberProfile.attendance` interface 不変、既存 migration 不変、admin gate 既存 pattern 踏襲、web 側は既存 `/api/admin/[...path]` proxy を再利用 |
| 依存関係整合 | PASS | 02a read path / followup-001 write path / 02b meeting schema / 05a admin gate / 06c admin proxy の依存境界を維持。新規 index は本タスク owner として宣言済み |

## エスカレーション条件

- 02b で `member_attendance` 周辺の schema 変更が進行中と判明した場合 → migration 番号と index 重複を Phase 5 で再調整、ユーザー確認
- `EXPLAIN QUERY PLAN` で対象表の full scan が解消できない場合 → index 設計を Phase 9 で再検討、必要なら covering index / 部分 index を Phase 1 に差し戻す
- ranking クエリのパフォーマンスが許容外（D1 single query 制限超過）と判明した場合 → on-demand 集計から KV cache / cron 集計テーブル方式へ Phase 3 で代替案検討に差し戻す

## 次フェーズへの引き渡し

Phase 2 設計書では本 Phase で確定した Q1〜Q7 の決定方針に従い、以下を成果物化する:

- `outputs/phase-02/aggregate-sql-design.md`: 3 つの GROUP BY クエリ（overview / by-session / ranking）の SQL 案 + index 利用想定
- `outputs/phase-02/admin-route-design.md`: route 一覧 / 入出力 / status code / admin gate 結線
- `outputs/phase-02/ui-page-design.md`: `/admin/dashboard/attendance` ページの 3 ブロック構成 / 空データフォールバック
- `outputs/phase-02/changed-files.md`: CONST_005 必須項目を満たす変更ファイル一覧
