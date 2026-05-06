# Phase 1: 要件定義

実装区分: 実装仕様書（CONST_004 デフォルト適用 — `apps/api/src/repository/attendance.ts` / `apps/api/src/routes/admin/*.ts` / 単体・統合テストの追加・修正を伴う）

## 真の論点

| # | 論点 | 決定方針 | 決定根拠 |
| --- | --- | --- | --- |
| Q1 | 既存 `addAttendance` / `removeAttendance` を Writer 化するか、関数群のまま残すか | **Writer interface は追加しない**。既存関数を write 正本として維持する | 06c-E / 07c で実装済みの契約を尊重し、二重抽象を避ける |
| Q2 | hard delete か soft delete か | **hard delete を維持**。`member_attendance` への `deleted_at` 列追加は本タスク scope out（将来拡張点として Phase 2 に文書化のみ） | schema 変更は 02b 範囲。本タスクは write 経路の硬化に集中 |
| Q3 | 楽観排他キーの実装方式 | **PK `(member_id, session_id)` の UNIQUE 違反を `isUniqueConstraintError` で補足し `{ ok: false, reason: "duplicate", existing }` を返す**（既存 `addAttendance` を準拠化） | D1 では `INSERT ... ON CONFLICT DO NOTHING` も使用可能だが、既存パターン（`isUniqueConstraintError`）と整合させ duplicate row 取得経路を一本化する |
| Q4 | admin gate との結線 | **05a で確立した admin gate middleware を route 単体で迂回しない**。route 内で `c.get("adminContext")` 等の確定済み API のみを使う | 05a 仕様: route 単体での権限チェック禁止。本タスクで gate 結線を硬化する |
| Q5 | audit log の必須化 | **`attendance.add` / `attendance.remove` を `audit_log` に必ず記録**（既存 `apps/api/src/routes/admin/audit.test.ts` の前提を満たす） | admin 操作の追跡可能性を担保。既存 audit 経路を活用し新規 helper は不要 |
| Q6 | branded type の write 側展開 | **`AttendanceRecordId` / Writer 抽象は導入しない**。既存 `MemberId` + `sessionId` contract を維持する | 実装済み 06c-E / 07c contract と一致させ、過剰抽象を避ける |

## 現状ベースライン（既存実装の事実）

本タスクは「ゼロから write path を実装する」のではなく、**06c-E / 07c の既存実装を正本へ吸収して close-out** する位置づけである。Phase 5 ランブックは差分確認のみを実施する。

| 既存 | パス / 関数 | 本タスクでの扱い |
| --- | --- | --- |
| 関数 | `apps/api/src/repository/attendance.ts#addAttendance` | 既存 write 正本として維持 |
| 関数 | `apps/api/src/repository/attendance.ts#removeAttendance` | 既存 write 正本として維持（実体は hard delete） |
| 関数 | `apps/api/src/repository/attendance.ts#getAttendance` | 変更なし（duplicate 時の existing 取得に使用） |
| 関数 | `apps/api/src/repository/attendance.ts#listAttendableMembers` | 変更なし |
| route | `apps/api/src/routes/admin/attendance.ts` | 05a admin gate 結線・audit log 結線の硬化 |
| route | `apps/api/src/routes/admin/meetings.ts` | `POST /meetings/:id/attendances` の `attended` true/false → upsert/softRemove 振り分けの硬化 |
| test | `apps/api/src/routes/admin/audit.test.ts` | `attendance.add` / `attendance.remove` event の前提（変更なし、参照のみ） |
| test | `apps/api/src/routes/admin/meetings.test.ts` | `POST /meetings/:id/attendances` の既存テスト（参照、新ケース追加） |
| schema | `apps/api/migrations/0002_admin_managed.sql#member_attendance` | `PRIMARY KEY (member_id, session_id)` 利用、変更なし |

## Acceptance Criteria（再掲）

index.md に記載の AC-1〜AC-11 を本 Phase の確定 AC とする。

## 不変条件と本タスクの関係

| 不変条件 | 影響 | 守り方 |
| --- | --- | --- |
| #1 form schema を固定しない | 該当なし（attendance は admin-managed） | 変更なし |
| #4 admin-managed data の分離 | 直接該当 | `member_attendance` は admin 経由でのみ更新、Google Form schema 起点では更新しない |
| #5 D1 直接アクセスは apps/api に閉じる | 直接該当 | apps/web から D1 へ直接書かないことを Phase 9 で機械的に検査（grep gate） |
| MemberProfile.attendance 型契約不変 | 直接該当 | read path (`AttendanceRecord`) の型は変更しない。write 戻り値は別 type |
| admin gate 中継 | 直接該当 | route 単体で `if (auth)` を書かない。middleware のみが正規経路 |

## automation-30 4条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | duplicate は repository reason と HTTP 409 を分離し、06c-E / 07c の既存契約へ統一 |
| 漏れなし | PASS | repository / canonical route / legacy route / audit log / read path regression / Phase 12 evidence を対象化 |
| 整合性あり | PASS | `MemberProfile.attendance` interface 不変、D1 schema 変更なし、`meeting_sessions.deleted_at` は 0013 migration 由来として参照 |
| 依存関係整合 | PASS | 02a read path、06c-E admin meetings、07c attendance audit、05a admin gate の依存境界を維持 |

## エスカレーション条件

- `member_attendance` schema 変更が必要と判明した場合（PK 制約変更 / `deleted_at` 列追加）→ 02b と協調、ユーザー確認
- 05a admin gate の middleware 仕様が未確定の場合 → route 結線を mock で先行実装し Phase 5 で再結線

## 次フェーズへの引き渡し

Phase 2 設計書では本 Phase で確定した Q1〜Q6 の決定方針に従い、以下を成果物化する:
- `outputs/phase-02/writer-contract.md`: 既存 `addAttendance` / `removeAttendance` contract / 楽観排他 SQL
- `outputs/phase-02/admin-route-design.md`: route 一覧 / 入出力 / status code
- `outputs/phase-02/audit-log-integration.md`: audit event 結線
- `outputs/phase-02/changed-files.md`: CONST_005 必須項目を満たす変更ファイル一覧
