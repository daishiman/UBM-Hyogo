# ut-02a-followup-001-attendance-write-operations — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-followup-001-attendance-write-operations |
| タスクID | task-imp-ut-02a-followup-001-attendance-write-001 |
| ディレクトリ | docs/30-workflows/ut-02a-followup-001-attendance-write-operations |
| Issue | #369 |
| 親タスク | ut-02a-attendance-profile-integration |
| Wave | 2 (follow-up / write path 補完) |
| 実行種別 | sequential (single-task follow-up) |
| 作成日 | 2026-05-06 |
| 担当 | spec drafted on this branch |
| 状態 | implemented-local / resolved-by-existing-06cE-07c / Phase 12 close-out |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 | 実装仕様書（コード変更を伴うため CONST_004 のデフォルト適用） |
| 優先度 | priority:medium |
| 発見元 | ut-02a-attendance-profile-integration Phase 12 unassigned-task-detection |

## purpose

ut-02a で確立した read path（`AttendanceProvider.findByMemberIds`）に対し、対となる **write path（出席登録 / 取消 / 補正）を硬化** する。
`apps/api/src/repository/attendance.ts` と admin route には、06c-E / 07c で `addAttendance` / `removeAttendance`、`/admin/meetings/:sessionId/attendance`、`/admin/meetings/:sessionId/attendances` が実装済みである。本 follow-up は新規二重実装ではなく、起票元未タスクを既存実装へ吸収し、契約・Phase 12 evidence・正本索引を同期して close-out する。

- repository duplicate 正規化（`{ ok: false, reason: "duplicate", existing }`）と route HTTP 契約（409）を同一仕様へ固定
- canonical route `/admin/meetings/:sessionId/attendances` と legacy route `/admin/meetings/:sessionId/attendance` / DELETE の境界明示
- `AttendanceRecordId` の過剰導入を撤回し、実 contract の主キー `(memberId, sessionId)` に合わせる
- Phase 12 strict 7 files、root / outputs artifacts parity、aiworkflow-requirements 同一 wave sync を実体化

本タスクは admin / member 双方の operability を担保し、`MemberProfile.attendance` 型契約は破壊しない（02a 確定済み契約を保護）。

## scope in / out

### scope in

- `apps/api/src/repository/attendance.ts` の既存 `addAttendance` / `removeAttendance` contract を正本化（新規 Writer 抽象は作らない）
- `sessionId` は実装済み string contract を維持し、`AttendanceRecordId` は導入しない
- 楽観排他: PK `(member_id, session_id)` + `INSERT` 試行時の `isUniqueConstraintError` 補足、duplicate 時 `existing` 返却
- `deleted_at IS NULL` チェックの SQL 一元化（`active_meeting_sessions` view 化検討）
- `apps/api/src/routes/admin/meetings.ts` / `apps/api/src/routes/admin/attendance.ts` の write 経路を 05a admin gate 経由で固定、audit log (`attendance.add` / `attendance.remove`) 必須化
- 単体テスト（楽観排他、重複登録 dedupe、削除済み meeting への write 拒否、削除 member 拒否、unknown member 拒否）
- 統合テスト（write 後 read path で即時観測、bind 上限以下の連続 write 整合）
- API smoke evidence（curl）: `POST /admin/meetings/:sessionId/attendances` × add / remove / 404
- 02a Phase 12 `unassigned-task-detection.md` の本項目を「解消済み」へ更新

### scope out

- meeting session 自体の CRUD（02b スコープ）
- attendance 集計ダッシュボード / 統計可視化（[ut-02a-followup-002](../completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-002-attendance-dashboard-analytics.md)）
- ページング（[ut-02a-followup-004](../completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-004-attendance-pagination.md)）
- `MemberProfile` interface の構造変更（02a 確定済み契約を保護）
- 出席履歴 UI の新規実装 / デザイン変更（既存 admin/meeting 詳細 UI を流用）
- production deploy（09a/09b 責務）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02a `parallel-member-identity-status-and-response-repository` | `MemberProfile` interface / builder 責務確定済み |
| 上流 | ut-02a-attendance-profile-integration | read path / branded type module / chunk 戦略の正本 |
| 上流 | 02b `parallel-meeting-tag-queue-and-schema-diff-repository` | meeting domain 側の `is_deleted` semantics |
| 上流 | 05a admin auth gate | admin route の認可中継 |
| 参照 | 02a Phase 12 `outputs/phase-12/unassigned-task-detection.md` | 発見元 |
| 参照 | ut-02a-attendance-profile-integration `outputs/phase-12/implementation-guide.md` | 既存 read path 実装ガイド |
| external gate | D1 schema availability | `member_attendance` PK / `meeting_sessions.deleted_at` 利用可能性 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件全般 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | API schema / repository 契約 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 構成 / bind 上限制約 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | admin gate / audit log 方針 |
| 必須 | docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-001-attendance-write-operations.md | 発見元スタブ（要件正本） |
| 必須 | apps/api/src/repository/attendance.ts | 修正対象 |
| 必須 | apps/api/src/routes/admin/attendance.ts | 修正対象 |
| 必須 | apps/api/src/routes/admin/meetings.ts | 修正対象（attendance 連携部） |
| 必須 | apps/api/migrations/0002_admin_managed.sql | `member_attendance` PK / `assigned_by` 制約確認 |
| 必須 | apps/api/migrations/0013_meeting_sessions_soft_delete.sql | `meeting_sessions.deleted_at` soft delete 制約確認 |
| 参考 | apps/api/src/repository/_shared/branded-types/meeting.ts | branded type write 側展開 |
| 参考 | docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ | 親タスク完成形 |

## AC（Acceptance Criteria）

- AC-1: `apps/api/src/repository/attendance.ts` に `addAttendance(memberId, sessionId, by): AddAttendanceResult` / `removeAttendance(memberId, sessionId): MemberAttendanceRow | null` が存在し、write path の単一正本として使われる。新規 `AttendanceWriter` 抽象は追加しない。
- AC-2: `addAttendance` は (a) `meeting_sessions.deleted_at IS NULL`、(b) `member_identities.member_id` 存在、(c) `member_status.is_deleted = 0` を満たす場合のみ INSERT し、PK UNIQUE 違反時は `{ ok: false, reason: "duplicate", existing }` を返す。
- AC-3: `removeAttendance` は対象 row が存在する場合に DELETE し、existing row を返す。row が無い場合は `null`。soft delete 列を将来導入する場合の拡張点を Phase 2 で文書化。
- AC-4: `AttendanceRecordId` は導入しない。write contract は `MemberId` + `sessionId`（`member_attendance` 複合 PK）を正本とし、`MemberProfile.attendance: AttendanceRecord[]` は変更しない。
- AC-5: canonical route `POST /admin/meetings/:sessionId/attendances`（attended true → add / false → remove）と legacy route `POST /admin/meetings/:sessionId/attendance` / `DELETE /admin/meetings/:sessionId/attendance/:memberId` が、05a admin gate を必ず経由し、成功時のみ `audit_log` に `attendance.add` / `attendance.remove` を actor email 付きで記録する。
- AC-6: 削除済み meeting (`deleted_at IS NOT NULL`) / unknown member への write は HTTP 404 (`session_not_found` / `member_not_found`)、削除済み member への write は HTTP 422 (`member_is_deleted`)、duplicate は HTTP 409 (`attendance_already_recorded`) を返す。route 単体での権限チェックは禁止（gate 経由必須）。
- AC-7: 単体テストで「楽観排他（同時 add dedupe）/ 削除済み meeting 拒否 / 削除済み member 拒否 / unknown member 拒否 / remove 冪等性」を網羅し全 PASS。
- AC-8: 統合テストで「add 直後に `AttendanceProvider.findByMemberIds` で観測可能」「remove 直後に観測されない」「`held_on DESC` 順序が崩れない」を検証。
- AC-9: focused tests（api attendance / admin meetings / admin attendance）と `pnpm --filter @ubm-hyogo/api typecheck` が通過。02a / read path の既存テスト regression なし。
- AC-10: API smoke evidence contract（curl）として `attendance.add` 成功 / `duplicate` 409 / `session_not_found` / `remove` 成功 の 4 ケースを `outputs/phase-11/evidence/api-curl/` に保存先固定。
- AC-11: 02a Phase 12 `unassigned-task-detection.md` の本項目を「解消済み」に更新し、本 workflow への相互参照を張る。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（既存実装の硬化方針 / Writer 抽象化 / soft vs hard delete / 楽観排他キー / admin gate 結線）と AC-1〜11 確定 |
| 2 | 設計 | phase-02.md | 既存 `addAttendance` / `removeAttendance` contract / duplicate 409 / canonical+legacy admin route / audit log 結線 / 変更ファイル一覧 |
| 3 | 設計レビュー | phase-03.md | alternative（Writer 化 vs 関数群維持、hard vs soft delete、route 命名）、PASS/MINOR/MAJOR、依存契約レビュー |
| 4 | テスト戦略 | phase-04.md | 単体 / 統合 test matrix、AC × test mapping、楽観排他再現手順 |
| 5 | 実装ランブック | phase-05.md | branded type write 拡張 → Writer 実装 → admin route 結線 → audit log → 統合テストの順序固定 runbook |
| 6 | 異常系検証 | phase-06.md | UNIQUE 違反、削除済み meeting、削除済み member、unknown member、null `MemberId`、D1 timeout、admin gate bypass 試行 |
| 7 | AC マトリクス | phase-07.md | AC × test × 不変条件 × evidence の N:M トレース |
| 8 | DRY 化 | phase-08.md | `active_meeting_sessions` view 化検討、admin route 共通 helper、audit log 結線の共通化 |
| 9 | 品質保証 | phase-09.md | typecheck / lint / build / coverage / 02a regression / N+1 metric / admin gate 経路カバレッジ |
| 10 | 最終レビュー | phase-10.md | GO / NO-GO（依存 02a / 02b / 05a の AC 充足、schema 制約、interface 不変） |
| 11 | 実装 smoke | phase-11.md | API curl evidence + admin UI 通電 evidence（NON_VISUAL 縮約テンプレ準拠） |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update / changelog / unassigned / skill-feedback / compliance-check |
| 13 | PR 作成 | phase-13.md | approval gate / local-check-result / change-summary / PR template (`Refs #369`) |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/writer-contract.md
outputs/phase-02/admin-route-design.md
outputs/phase-02/audit-log-integration.md
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
outputs/phase-09/regression-check.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/api-curl/attendance-add-ok.json
outputs/phase-11/evidence/api-curl/attendance-add-duplicate.json
outputs/phase-11/evidence/api-curl/attendance-remove-ok.json
outputs/phase-11/evidence/api-curl/attendance-session-not-found.json
outputs/phase-11/evidence/ui-smoke/admin-meeting-attendance-edit.md
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
| DB | Cloudflare D1 (`ubm-hyogo-db-*`) | apps/api Worker binding | `member_attendance` / `meeting_sessions` / `member_status` |
| API | apps/api (Hono) | Worker | `/admin/meetings/:id/attendances`, `/admin/members/:id/attendance` |
| UI | apps/web (Next.js) | Worker | 既存 admin meeting 詳細 / member 詳細を流用 |
| Secrets | （新規導入なし） | — | Cloudflare Secrets / 1Password 既存運用に従う |

## invariants touched

- **#1** 実フォーム schema をコードに固定しすぎない（attendance は admin-managed data）
- **#4** admin-managed data として form schema 外で分離（`member_attendance` は admin 管理対象）
- **#5** D1 への直接アクセスは `apps/api` に閉じる（apps/web から直接 D1 触らない）
- **interface 不変**: `MemberProfile.attendance: AttendanceRecord[]` の型契約は本タスクで破壊しない（02a 確定済み）
- **admin gate 中継**: 05a で確立した admin gate を route 単体で迂回しない

## Schema / 共有コード Ownership 宣言

| 範囲 | 編集権 | 備考 |
| --- | --- | --- |
| `apps/api/src/repository/attendance.ts` の write セクション | 07c / 06c-E 実装済み正本 | 新規 `AttendanceWriter` 抽象は追加しない。既存 `addAttendance` / `removeAttendance` を正本化 |
| `apps/api/src/repository/_shared/branded-types/meeting.ts` | 本タスク（02a 後継） | write 関数への branded type 拡張のみ。read 側 type 定義は 02a の確定済み |
| `apps/api/src/routes/admin/attendance.ts` | 本タスク | 05a admin gate / audit log 結線の硬化 |
| `apps/api/src/routes/admin/meetings.ts` | 本タスク（02b 競合注意） | `POST /meetings/:id/attendances` 経路のみ。meeting CRUD は 02b 範囲 |
| `apps/api/migrations/*.sql` | 02b 優先 | 不足カラム / index がある場合は 02b と調整（本タスクでは原則 schema 変更なし） |
| `apps/web/**` の attendance UI | 既存（06b 等） | 流用のみ。新規実装なし |

## completion definition

- Phase 1〜10 が completed、Phase 11 は contract_only_not_executed として runtime curl / UI smoke を PASS 扱いしない
- AC-1〜11 が Phase 7 マトリクスで完全トレース
- 4 条件評価（価値 / 実現 / 整合 / 運用）が Phase 1 / Phase 12 で整合
- 02a / read path の既存テスト全 PASS（regression なし）
- admin gate 経路カバレッジが Phase 9 で baseline と一致または改善
- Phase 13 で user 承認後に PR 作成完了

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| implemented-local | 06c-E / 07c 既存実装で attendance write contract が満たされ、Phase 12 close-out 同期済み。runtime curl / UI smoke は contract_only_not_executed | Phase 13 user approval 待ち |
| design_locked | Phase 1〜3 完了、設計レビュー PASS | 不可 |
| implementation_in_progress | Phase 5 ランブック実行中 | 不可 |
| implemented | Writer / admin route / audit log の硬化完了、Phase 9 全ゲート PASS | 不可 |
| smoke_passed | Phase 11 evidence 全取得、AC-1〜11 充足 | Phase 11 完了可 |
| completed | smoke_passed + Phase 12 same-wave sync + Phase 13 user approval | 可 |

## 補足

- Issue #369 は CLOSED 状態のまま本仕様書を作成する（reopen しない）。Phase 13 PR template には `Refs #369` で参照する（`Closes` は使用しない）。
- 既存コード (`apps/api/src/repository/attendance.ts` の `addAttendance` / `removeAttendance`、admin route) は **部分実装済みベースライン** として扱い、本タスクは contract 化 / 結線硬化 / テスト網羅 / evidence 取得を完遂する位置づけとする。Phase 1 「現状ベースライン」節で差分を明示する。
- soft delete 列 (`deleted_at` 列の `member_attendance` への追加) は本タスクのデフォルトスコープ外とし、Phase 2 で「将来拡張点」として文書化のみ行う（hard delete 維持）。schema 変更が必要となった場合のみ Phase 1 で再判断し、ユーザーにエスカレーションする。
