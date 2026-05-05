# Artifact Inventory: ut-02a-attendance-profile-integration

## Metadata

| Field | Value |
| --- | --- |
| Workflow | `docs/30-workflows/ut-02a-attendance-profile-integration/` |
| Task ID | `task-imp-02a-attendance-profile-integration-001` |
| Issue | #107 (CLOSED, `Refs #107` のみ採用) |
| Parent | `02a-parallel-member-identity-status-and-response-repository` |
| State | `implemented / Phase 1-12 completed / NON_VISUAL / Phase 13 pending_user_approval` |
| Sync date | 2026-05-01 |
| Canonical specs | `docs/00-getting-started-manual/specs/01-api-schema.md`, `docs/00-getting-started-manual/specs/08-free-database.md` |

## Classification（責務分離）

| Layer | Responsibility | Path |
| --- | --- | --- |
| spec / workflow root | Phase 1-13 仕様の正本（旧単票より昇格） | `docs/30-workflows/ut-02a-attendance-profile-integration/` |
| repository (new) | attendance 取得の唯一経路（N+1 防止 / chunk 分割） | `apps/api/src/repository/attendance.ts` |
| repository (touched) | 02a builder の attendance 注入箇所のみ修正 | `apps/api/src/repository/_shared/builder.ts` |
| branded type module | `MeetingSessionId` / `AttendanceRecordId` 独立 module | `apps/api/src/repository/_shared/branded-types/` |
| route (touched) | profile レスポンスへの attendance 露出経路 | `apps/api/src/routes/me/index.ts`, `apps/api/src/routes/admin/members.ts` |
| repository tests | attendance provider / builder 統合テスト | `apps/api/src/repository/__tests__/attendance-provider.test.ts`, `apps/api/src/repository/__tests__/builder.test.ts` |
| skill artifacts | closeout / lessons | `.claude/skills/aiworkflow-requirements/changelog/`, `.claude/skills/aiworkflow-requirements/references/lessons-learned-*.md` |
| legacy stub | 旧単票（Canonical Status で本 root に誘導） | `docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md` |

## Workflow root artifacts

| artifact | path | purpose |
| --- | --- | --- |
| index | `docs/30-workflows/ut-02a-attendance-profile-integration/index.md` | メタ情報 / scope / dependencies / AC-1〜10 / 13 phase 一覧 |
| ledger | `docs/30-workflows/ut-02a-attendance-profile-integration/artifacts.json` | Phase ledger parity source |
| outputs ledger | `docs/30-workflows/ut-02a-attendance-profile-integration/outputs/artifacts.json` | outputs 側 parity source |

## Phase specs

| phase | file |
| --- | --- |
| 1 要件定義 | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-01.md` |
| 2 設計 | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-02.md` |
| 3 設計レビュー | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-03.md` |
| 4 テスト戦略 | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-04.md` |
| 5 実装ランブック | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-05.md` |
| 6 異常系検証 | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-06.md` |
| 7 AC マトリクス | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-07.md` |
| 8 DRY 化 | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-08.md` |
| 9 品質保証 | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-09.md` |
| 10 最終レビュー | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-10.md` |
| 11 実装 smoke | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-11.md` |
| 12 ドキュメント更新 | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-12.md` |
| 13 PR 作成 | `docs/30-workflows/ut-02a-attendance-profile-integration/phase-13.md` |

## Phase outputs

### Phase 1-3（要件 / 設計 / 設計レビュー）

| artifact | path | purpose |
| --- | --- | --- |
| phase 01 main | `outputs/phase-01/main.md` | 真の論点 / AC-1〜10 確定 |
| phase 02 main | `outputs/phase-02/main.md` | 設計 overview |
| phase 02 repository contract | `outputs/phase-02/repository-contract.md` | `AttendanceProvider.findByMemberIds()` 契約 |
| phase 02 branded type module | `outputs/phase-02/branded-type-module.md` | `MeetingSessionId` / `AttendanceRecordId` 独立 module 設計 |
| phase 02 builder injection | `outputs/phase-02/builder-injection-design.md` | builder optional `attendanceProvider` 注入方式 |
| phase 02 schema ownership | `outputs/phase-02/schema-ownership.md` | 編集権 / 02b 境界 |
| phase 03 main | `outputs/phase-03/main.md` | 設計レビュー（PASS-MINOR-MAJOR） |
| phase 03 alternatives | `outputs/phase-03/alternatives-comparison.md` | 引数追加 vs ctx 注入 vs DI container |

### Phase 4-6（テスト / ランブック / 異常系）

| artifact | path | purpose |
| --- | --- | --- |
| phase 04 main | `outputs/phase-04/main.md` | テスト戦略 overview |
| phase 04 test matrix | `outputs/phase-04/test-matrix.md` | 単体 / 統合 × AC mapping |
| phase 05 main | `outputs/phase-05/main.md` | 実装ランブック overview |
| phase 05 runbook | `outputs/phase-05/runbook.md` | schema 確認 → repository → builder → 通電 順序 |
| phase 06 main | `outputs/phase-06/main.md` | 異常系検証 overview |
| phase 06 failure cases | `outputs/phase-06/failure-cases.md` | bind 上限 / 削除 meeting / null / 空 / 500 / timeout |

### Phase 7-10（AC / DRY / QA / 最終）

| artifact | path | purpose |
| --- | --- | --- |
| phase 07 main | `outputs/phase-07/main.md` | AC マトリクス overview |
| phase 07 ac matrix | `outputs/phase-07/ac-matrix.md` | AC × test × 不変条件 × evidence trace |
| phase 08 main | `outputs/phase-08/main.md` | DRY 化 / 共通 helper / branded type module 整理 |
| phase 09 main | `outputs/phase-09/main.md` | typecheck / lint / build / coverage / regression |
| phase 09 N+1 metric | `outputs/phase-09/n-plus-1-metric.md` | N+1 計測 baseline 比較 |
| phase 10 main | `outputs/phase-10/main.md` | GO / NO-GO judgement |

### Phase 11（NON_VISUAL evidence）

| artifact | path | purpose |
| --- | --- | --- |
| phase 11 main | `outputs/phase-11/main.md` | 実装 smoke overview |
| api curl json | `outputs/phase-11/evidence/api-curl/me-profile-attendance.json` | `/me/profile` attendance 実データ |
| api curl raw | `outputs/phase-11/evidence/api-curl/me-profile-attendance.curl.txt` | curl 実行 evidence |
| ui smoke mypage | `outputs/phase-11/evidence/ui-smoke/mypage-attendance-rendered.md` | マイページ通電（既存 UI 流用） |
| ui smoke admin | `outputs/phase-11/evidence/ui-smoke/admin-detail-attendance-rendered.md` | admin 詳細通電（既存 UI 流用） |

### Phase 12（同 wave docs sync 7 成果物）

| artifact | path | purpose |
| --- | --- | --- |
| phase 12 main | `outputs/phase-12/main.md` | Phase 12 overview |
| implementation guide | `outputs/phase-12/implementation-guide.md` | Step 1-A〜2 実装ガイド |
| system spec summary | `outputs/phase-12/system-spec-update-summary.md` | system spec 同期実績 |
| documentation changelog | `outputs/phase-12/documentation-changelog.md` | 変更ログ |
| unassigned detection | `outputs/phase-12/unassigned-task-detection.md` | follow-up 検出 / 02a 側 detection との突合 |
| skill feedback | `outputs/phase-12/skill-feedback-report.md` | aiworkflow-requirements feedback |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | task-spec 準拠チェック |

### Phase 13（PR 準備 / user approval gate）

| artifact | path | purpose |
| --- | --- | --- |
| phase 13 main | `outputs/phase-13/main.md` | Phase 13 overview |
| local check result | `outputs/phase-13/local-check-result.md` | typecheck / lint / build / test 実測 |
| change summary | `outputs/phase-13/change-summary.md` | 変更内容 summary |
| pr template | `outputs/phase-13/pr-template.md` | `Refs #107` で参照（`Closes` 不採用） |

## Implementation artifacts

| layer | path | role |
| --- | --- | --- |
| repository (new) | `apps/api/src/repository/attendance.ts` | `createAttendanceProvider().findByMemberIds()`、80-id chunked read、INNER JOIN（`member_attendance` × `meeting_sessions`）、`held_on DESC` + `session_id ASC` で安定化 |
| repository shared (touched) | `apps/api/src/repository/_shared/builder.ts` | optional `attendanceProvider` 注入。02a 確定の identity / status / response 部は不変 |
| branded type module (new) | `apps/api/src/repository/_shared/branded-types/` | `MeetingSessionId` / `AttendanceRecordId` の独立 module（既存 `MemberId` / `ResponseId` import を改変しない） |
| route (touched) | `apps/api/src/routes/me/index.ts` | `/me/profile` 経由で attendance 露出 |
| route (touched) | `apps/api/src/routes/admin/members.ts` | admin 詳細経由で attendance 露出 |
| unit test (new) | `apps/api/src/repository/__tests__/attendance-provider.test.ts` | attendance 0/1/N、削除 meeting、重複、100 件超 chunk |
| unit test (touched) | `apps/api/src/repository/__tests__/builder.test.ts` | builder への attendance 注入 / 02a regression |

## Skill artifacts

| artifact | path | purpose |
| --- | --- | --- |
| closeout changelog | `.claude/skills/aiworkflow-requirements/changelog/20260501-ut-02a-attendance-profile-integration-closeout.md` | wave close-out summary |
| lessons learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-ut-02a-attendance-profile-integration-2026-05.md` | UT-02A 固有教訓 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-ut-02a-attendance-profile-integration-artifact-inventory.md` | 本 file |

## Canonical spec touchpoints

| spec | scope of update |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `MemberProfile.attendance: AttendanceRecord[]` 不変 + attendance provider 経路の記述 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | `member_attendance` / `meeting_sessions` の利用、D1 bind 上限 / chunk 戦略 |

## Legacy stub

| legacy | current | note |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md` | `docs/30-workflows/ut-02a-attendance-profile-integration/` | 旧単票は legacy stub 残置。`## Canonical Status` で本 workflow root に片方向誘導 |

## Validation chain

| command | purpose |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | 型契約（`MemberProfile.attendance` 不変）保証 |
| `mise exec -- pnpm --filter @ubm-hyogo/api test -- repository/__tests__/attendance-provider.test.ts` | attendance provider 単体（0/1/N、削除 meeting、重複、chunk）|
| `mise exec -- pnpm --filter @ubm-hyogo/api test -- repository/__tests__/builder.test.ts` | builder への attendance 注入 / 02a regression |
| `mise exec -- pnpm lint` | lint gate |
| `mise exec -- pnpm build` | build gate |
| `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | indexes 再生成（drift 検出） |

## 運用メモ

- 02a で確定した `MemberProfile.attendance: AttendanceRecord[]` 型契約は本タスクで不変。本 inventory が最短参照 set として機能する。
- 02b の進行状況に応じて schema diff（不足カラム / index）が発生する場合は 02b へ起票し、本タスクは repository / builder / branded type module / route 注入のみに閉じる。
- 09a / 09b / 09c、06b visual、U-UT01-08 enum canonicalization は本タスクで代替・上書きしない（参照のみ）。
- Issue #107 は CLOSED のままで、Phase 13 PR template は `Refs #107` のみ採用（`Closes` 禁止 / 再オープン禁止）。
