# System Spec Update Summary

本 wave は `implemented_local_evidence_captured`（タスク仕様書と Phase 12 strict-7 出力を整備し、テストコード + synthetic fixture + runner を追加）。system spec への新規 interface 追加はない。各 Step を以下に記録する。

## Step 1-A: 完了タスクの記録

| 項目 | 値 |
| --- | --- |
| 親機能 | bulk member tag assign / unassign（issue-1036） |
| 機能本体の状態 | dev に landed 済み（`BulkActionBar` の tag bulk / `POST /admin/members/tags/bulk` / `bulkApplyMemberTagsByAdmin`） |
| 関連実コンポーネント | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` |
| 関連 API | `POST /admin/members/tags/bulk` / `GET /admin/members` / `GET /admin/tags`（既存・本タスク非変更） |
| 既存テスト | `BulkActionBar.spec.tsx`（TC-BAB-TAG-01..05、result 描画は TC-BAB-TAG-03）/ contract spec |
| 部分消化元 | issue-1077（picker 2 状態を read-only authenticated staging spec 化済み。result 2 状態は明示スコープ外として Issue #1125 へ trace） |
| seed/cleanup + runner 基盤 | issue-1081 / #1144（`scripts/smoke/runtime-tag-bulk.sh` + `bulk-tag-staging-{seed,cleanup}.sql`・`trap` cleanup・`redact.sh`・staging guard） |

本タスク（issue-1125）は親機能の **result 2 状態の認証付き staging mutation visual baseline** を補完する残スコープ。機能本体は変更しない。

## Step 1-B: 実装状況

| 項目 | 値 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_status | `implemented_local_staging_runtime_pending`（実コード追加済み・staging mutation baseline は user-gated） |
| implementation_mode | `new`（成果物 spec / seed / cleanup / runner は新規追加。機能本体は landed 済み） |
| 追加実装ファイル | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts` / `apps/api/migrations/seed/bulk-tag-result-staging-seed.sql` / `apps/api/migrations/seed/bulk-tag-result-staging-cleanup.sql` / `scripts/smoke/capture-bulk-tag-result.sh` / `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` / `package.json` smoke:test wiring |
| 変更しないもの | apps/api・apps/web の本番ソース・D1 schema（`migrations/*.sql` の table 定義）・Google Form 仕様（AC-8） |
| runtime | 認証付き staging seed → mutation → baseline 取得 → cleanup は user-gated（未実行） |

`migrations/seed/` の SQL は synthetic データ投入であり table 定義（schema）変更ではない。本 wave では実コード追加まで完了し、staging 実行だけを user 承認後に残す。

## Step 1-C: 関連タスク

| タスク | 関係 | 状態更新 |
| --- | --- | --- |
| issue-1036 bulk member tag assign（親） | 機能本体。`docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` | 変更なし（landed） |
| issue-1077 authenticated staging picker baseline（部分消化） | picker 2 状態を read-only 化。本タスクの read-only 先例 spec モデル | 変更なし（CLOSED） |
| issue-1081 / #1144 seed/cleanup + runner 基盤 | `runtime-tag-bulk.sh` / seed・cleanup SQL の構造モデル | 変更なし（landed） |
| 消費する unassigned-task | `docs/30-workflows/unassigned-task/task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md` | 本 wave で `partially_consumed_by_issue_1077` → result 2 状態の残スコープが本タスク（issue-1125）で消化される旨を反映（consumed pointer 追記） |
| result 2 状態 baseline | 本タスクの主スコープ（all-success / partial-failure）。`notFound` 視覚網羅のみ代替担保ありの scope-out | unassigned-task-detection.md の baseline に記録 |

## Step 2: 新規 interface / 型 / API 追加

**該当なし（N/A）**。本タスクの成果物はテストコード（Playwright spec）+ synthetic fixture（seed/cleanup SQL）+ capture runner shell のみであり、公開 interface・型定義・API endpoint・D1 schema（table 定義）・Google Form schema を一切追加しない。アプリ API は不変（`POST /admin/members/tags/bulk` は既存 endpoint をそのまま叩く）。したがって system spec（`docs/00-getting-started-manual/specs/*.md`）への記述更新も不要である。

canonical screenshot 名（`bulk-tag-result-all-success.png` / `bulk-tag-result-partial-failure.png`）は artifacts.json `canonical_screenshots` を SSOT とし、phase-11 / implementation-guide と一致させる。
