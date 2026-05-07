# ut-02a-followup-002-attendance-dashboard-analytics — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-followup-002-attendance-dashboard-analytics |
| タスクID | task-imp-ut-02a-followup-002-attendance-dashboard-001 |
| ディレクトリ | docs/30-workflows/ut-02a-followup-002-attendance-dashboard-analytics |
| Issue | #370 |
| 親タスク | ut-02a-attendance-profile-integration |
| Wave | 2 (follow-up / analytics layer) |
| 実行種別 | sequential (single-task follow-up) |
| 作成日 | 2026-05-06 |
| 担当 | spec drafted on this branch |
| 状態 | implemented-local / implementation / VISUAL_ON_EXECUTION / local tests passed / runtime curl and UI screenshot pending |
| タスク種別 | implementation / VISUAL（admin UI を含むため） |
| 実装区分 | 実装仕様書（コード変更を伴うため CONST_004 のデフォルト適用） |
| 優先度 | priority:low |
| 発見元 | ut-02a-attendance-profile-integration Phase 12 unassigned-task-detection |

## purpose

ut-02a で確立した attendance read path（`AttendanceProvider.findByMemberIds` / `ATTENDANCE_BIND_CHUNK_SIZE = 80` の chunk pattern）はメンバー単位の取得に最適化されている。本タスクは admin 向けに **attendance データを集計可視化するダッシュボード** を新設し、以下 3 視点の指標を **GROUP BY 単発クエリで完結する aggregate path** として独立実装する。

- 全体出席率 (overview): 総セッション数 / 対象会員数 / 全体平均出席率
- セッション別出席状況 (by-session): セッション毎の出席者数と出席率
- 会員別ランキング (ranking): 会員別の出席数と出席率の降順ランキング

苦戦箇所として明示されたのは (a) 既存 chunk pattern を集計系に流用しないこと、(b) `apps/api/migrations/` の index 追加が 02b と編集権競合し得るため Phase 1 で **Schema Ownership 宣言** を行うこと、(c) `EXPLAIN QUERY PLAN` で full scan を避ける検証ゲートを置くこと、の 3 点である。

本タスクは admin gate（05a 確立済み）を経由し、`MemberProfile.attendance` 型契約には破壊的変更を加えない。

## scope in / out

### scope in

- `apps/api/src/repository/attendance.ts` 末尾への analytics セクション追加（`computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking` の 3 関数）
- 既存 chunk pattern（`ATTENDANCE_BIND_CHUNK_SIZE`）を **流用しない**。各関数は GROUP BY を含む単発 SQL で完結する
- `apps/api/migrations/00XX_attendance_analytics_indexes.sql` 新規作成（analytics 専用 index）。02b と migration 番号調整
- `apps/api/src/routes/admin/dashboard.ts` の拡張（既存 `/admin/dashboard` 共存）。3 つの新規 GET エンドポイント追加
- 全エンドポイントを 05a admin gate 経由に固定（route 単体の権限チェック禁止）
- `apps/web/(admin)/admin/dashboard/attendance/` ページ新規追加（既存 `/admin` レイアウト流用）。3 ブロック（overview カード / by-session テーブル / ranking テーブル）描画
- 単体テスト（repository aggregate 関数 3 本）/ 統合テスト（route × admin gate × 401/403）/ UI smoke
- `EXPLAIN QUERY PLAN` 結果を Phase 9 で記録し、`member_attendance` / `meeting_sessions` の全表 scan を含まないことを検証ゲート化
- API smoke evidence (curl) を runtime capture cycle で `outputs/phase-11/evidence/api-curl/` に保存（4 ケース）。本 local implementation cycle では repository / route / EXPLAIN gates を Vitest で検証済みとし、curl / UI screenshot は pending 境界として残す

### scope out

- attendance write path の改修（[ut-02a-followup-001](../completed-tasks/ut-02a-followup-001-attendance-write-operations/) で完了済み）
- meeting session 自体の CRUD（02b スコープ）
- ページング（[ut-02a-followup-004](../completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-004-attendance-pagination.md)）
- `MemberProfile.attendance` interface の変更（02a 確定済み契約を保護）
- materialized view / cron 集計テーブル（将来拡張）
- 公開ディレクトリ / メンバー側 UI への可視化反映
- production deploy（09a/09b 責務）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | ut-02a-attendance-profile-integration | read path / branded type module の正本（Provider と非対称な aggregate path を新規追加する位置づけ） |
| 上流 | ut-02a-followup-001-attendance-write-operations | write path 確定後の集計対象データ整合性 |
| 上流 | 02b `parallel-meeting-tag-queue-and-schema-diff-repository` | `meeting_sessions.deleted_at` semantics と migration 番号 |
| 上流 | 05a admin auth gate | admin route の認可中継 |
| 参照 | 02a Phase 12 `outputs/phase-12/unassigned-task-detection.md` | 発見元 |
| external gate | D1 schema availability | `member_attendance` PK / `meeting_sessions.deleted_at` / `member_status` 利用可能性 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件全般 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | API schema / repository 契約 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成 / index 設計指針 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | admin gate 方針 |
| 必須 | apps/api/src/repository/attendance.ts | 拡張対象（analytics セクション末尾追記） |
| 必須 | apps/api/src/routes/admin/dashboard.ts | 拡張対象 |
| 必須 | apps/api/src/repository/meetings.ts | meeting_sessions repository 参照 |
| 必須 | apps/api/migrations/0002_admin_managed.sql | `member_attendance` PK / 既存 `idx_member_attendance_session` 確認 |
| 必須 | apps/api/migrations/0013_meeting_sessions_soft_delete.sql | `meeting_sessions.deleted_at` / `idx_meeting_sessions_active_held_on` 確認 |
| 必須 | apps/web/app/(admin)/admin/ | 既存 admin レイアウト流用元 |
| 参考 | docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/ | follow-up タスクの構造参照 |

## AC（Acceptance Criteria）

- AC-1: aggregate API 3 本（overview / by-session / ranking）が `GROUP BY` を含む **単発クエリ** で完結する。`ATTENDANCE_BIND_CHUNK_SIZE` を import せず、chunk loop / 多段クエリを書かない。
- AC-2: 各 API は 05a admin gate を経由し、非 admin リクエストには 401 / 403 を返す。route 内部に独自の権限分岐を書かない。
- AC-3: `EXPLAIN QUERY PLAN` の結果に `member_attendance` / `meeting_sessions` の全表 scan が含まれないこと（`SEARCH ... USING INDEX` または `USING COVERING INDEX`）を Phase 9 で機械的に検証する。集計分母用の小規模 count subquery は別行で理由を記録し、runtime PASS と混同しない。
- AC-4: 新規 migration ファイル `00XX_attendance_analytics_indexes.sql` で analytics 専用 index を追加する。owner 範囲は本タスク（02b と番号調整）。Phase 1 で宣言済みの index 以外は追加しない。
- AC-5: 集計結果の型契約は以下に固定する。
  - overview = `{ totalSessions: number; totalMembers: number; overallRate: number }`
  - by-session = `Array<{ sessionId: string; title: string; heldOn: string; attendeeCount: number; rate: number }>`
  - ranking = `Array<{ memberId: MemberId; displayName: string; attendedCount: number; rate: number }>`
- AC-6: admin UI ページ（`/admin/dashboard/attendance`）が 3 つのブロック（overview カード / by-session テーブル / ranking テーブル）を描画し、空データ時のフォールバック（"データがありません"）を持つ。
- AC-7: 単体テスト（repository aggregate 関数 3 本）/ route 統合テスト（admin gate 通過 / 401・403）/ UI smoke が PASS。
- AC-8: D1 への直接アクセスは `apps/api` に閉じる（不変条件 #5）。`apps/web` 側は `/api/admin/dashboard/attendance/*` 経由のみ。
- AC-9: `MemberProfile.attendance` 型契約（02a 確定）に破壊的変更を加えない。
- AC-10: focused tests + `pnpm typecheck` + `pnpm lint` が PASS。02a / followup-001 / 既存 admin dashboard route の regression なし。
- AC-11: API smoke evidence（curl 4 ケース: overview / by-session / ranking / unauthorized 401）を `outputs/phase-11/evidence/api-curl/` に保存する。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点 Q1〜Q7、Schema Ownership 宣言、AC-1〜11 確定 |
| 2 | 設計 | phase-02.md | aggregate SQL 設計、route 一覧、UI 配置、変更ファイル一覧 |
| 3 | 設計レビュー | phase-03.md | chunk vs aggregate / endpoint 分割 / view materialization の代替案レビュー |
| 4 | テスト戦略 | phase-04.md | unit / route / UI test matrix、AC × test mapping |
| 5 | 実装ランブック | phase-05.md | migration → repository → route → UI → test の順序 |
| 6 | 異常系検証 | phase-06.md | 大量データ、空テーブル、削除済み除外、unauthorized、index 未利用検出 |
| 7 | AC マトリクス | phase-07.md | AC × test × 不変条件 × evidence の N:M トレース |
| 8 | DRY 化 | phase-08.md | 集計 helper 共通化、route response shape 統一 |
| 9 | 品質保証 | phase-09.md | typecheck / lint / build / EXPLAIN check / coverage / 02a regression |
| 10 | 最終レビュー | phase-10.md | GO/NO-GO 判定 |
| 11 | 実装 smoke | phase-11.md | curl evidence 4 ケース + UI smoke |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update / changelog / unassigned / skill-feedback / compliance-check |
| 13 | PR 作成 | phase-13.md | approval gate / PR template (`Refs #370`) |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/aggregate-sql-design.md
outputs/phase-02/admin-route-design.md
outputs/phase-02/ui-page-design.md
outputs/phase-02/changed-files.md
outputs/phase-03/main.md
outputs/phase-03/alternatives-comparison.md
outputs/phase-04/main.md
outputs/phase-04/test-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-06/main.md
outputs/phase-06/failure-cases.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-09/explain-query-plan.md
outputs/phase-09/regression-check.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/api-curl/dashboard-attendance-overview-ok.json
outputs/phase-11/evidence/api-curl/dashboard-attendance-by-session-ok.json
outputs/phase-11/evidence/api-curl/dashboard-attendance-ranking-ok.json
outputs/phase-11/evidence/api-curl/dashboard-attendance-unauthorized-401.json
outputs/phase-11/evidence/ui-smoke/admin-attendance-dashboard.png
outputs/phase-11/evidence/ui-smoke/admin-attendance-dashboard-empty.png
outputs/phase-11/evidence/ui-smoke/admin-attendance-dashboard-large.png
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| DB | Cloudflare D1 (`ubm-hyogo-db-*`) | apps/api Worker binding | `member_attendance` / `meeting_sessions` / `member_identities` / `member_status` |
| API | apps/api (Hono) | Worker | `/admin/dashboard/attendance/{overview,by-session,ranking}` |
| UI | apps/web (Next.js) | Worker | 新規 `/admin/dashboard/attendance` ページ |
| Secrets | （新規導入なし） | — | 既存 Cloudflare Secrets / 1Password 運用に従う |

## invariants touched

- **#1** 実フォーム schema をコードに固定しすぎない（attendance は admin-managed data）
- **#4** admin-managed data として form schema 外で分離（集計対象は `member_attendance` / `meeting_sessions` のみ）
- **#5** D1 への直接アクセスは `apps/api` に閉じる（apps/web からは `/api/admin/...` 経由のみ）
- **interface 不変**: `MemberProfile.attendance: AttendanceRecord[]` の型契約は本タスクで破壊しない（02a 確定済み）
- **admin gate 中継**: 05a で確立した admin gate を route 単体で迂回しない
- **chunk pattern 非流用**: `ATTENDANCE_BIND_CHUNK_SIZE` の流用禁止（Issue 苦戦箇所そのもの）

## Schema / 共有コード Ownership 宣言

| 範囲 | 編集権 | 備考 |
| --- | --- | --- |
| `apps/api/migrations/00XX_attendance_analytics_indexes.sql` | 本タスク | analytics 専用 index 新規追加。02b と migration 番号調整。具体的には `member_attendance(session_id)` の既存 `idx_member_attendance_session` を再利用、追加で `idx_member_attendance_member`（ranking 用）を新規。`meeting_sessions(deleted_at, held_on)` は `idx_meeting_sessions_active_held_on`（0013 既存）を流用 |
| `apps/api/src/repository/attendance.ts` の analytics セクション | 本タスク | 既存 read/write 関数は不変。`computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking` をファイル末尾に追記 |
| `apps/api/src/routes/admin/dashboard.ts` | 本タスク | 既存 `createAdminDashboardRoute` を拡張（既存ルートと共存）。新規 GET 3 本を追加 |
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 本タスク | 新規ページ |
| `apps/api/src/repository/meetings.ts` | 02b 優先 | 参照のみ（変更しない） |
| `apps/api/migrations/0002_admin_managed.sql` / `0013_meeting_sessions_soft_delete.sql` | 既存（変更不可） | index 状態の参照のみ |

## completion definition

- Phase 1〜10 が completed、Phase 11 で curl evidence 4 件 + UI smoke が PASS
- AC-1〜11 が Phase 7 マトリクスで完全トレース
- 4 条件評価（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が Phase 1 / Phase 12 で整合
- 02a / followup-001 / 既存 admin dashboard route の regression なし
- `EXPLAIN QUERY PLAN` の結果に `member_attendance` / `meeting_sessions` の全表 scan が含まれないことを Phase 9 で確認
- Phase 13 で user 承認後に PR 作成完了

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| spec_created | Phase 1〜13 の仕様書を作成済み（実装着手前） | 不可 |
| design_locked | Phase 1〜3 完了、設計レビュー PASS | 不可 |
| implementation_in_progress | Phase 5 ランブック実行中 | 不可 |
| implemented | aggregate repository / admin route / UI / migration が実装完了、Phase 9 全ゲート PASS | 不可 |
| smoke_passed | Phase 11 evidence 全取得、AC-1〜11 充足 | Phase 11 完了可 |
| completed | smoke_passed + Phase 12 same-wave sync + Phase 13 user approval | 可 |

現在状態は `implemented-local`。aggregate repository / admin route / UI / migration / focused tests は実装済みだが、runtime curl evidence と browser screenshot は未取得のため `smoke_passed` には昇格しない。

## 補足

- Issue #370 は CLOSED 状態のまま本仕様書を作成する（reopen しない）。Phase 13 PR template には `Refs #370` で参照する（`Closes` は使用しない）。
- 苦戦箇所「`ATTENDANCE_BIND_CHUNK_SIZE = 80` chunk pattern を集計系に流用しない」は Phase 1 Q1 / AC-1 の最重要論点として位置づける。aggregate path は read path とは独立した実装系統として `apps/api/src/repository/attendance.ts` 末尾セクションに追記する。
- 苦戦箇所「migration 編集権が 02b と競合する可能性」については Phase 1 Schema Ownership 宣言で本タスクの owner 範囲を明示し、新規 migration ファイル名を `00XX_attendance_analytics_indexes.sql` として 02b と番号衝突しないよう Phase 5 で最終番号を確定する。
- 集計結果のキャッシュ / materialized view 化は本タスク scope out（Phase 3 で「将来拡張点」として代替案レビュー時に記録のみ）。MVP では on-demand 集計を採用する。
- aiworkflow-requirements skill との整合性: 本タスクは attendance read/write 契約への破壊的変更を含まないため system-spec への影響は軽微（Phase 12 で `01-api-schema.md` の admin route 一覧追記のみ）。
