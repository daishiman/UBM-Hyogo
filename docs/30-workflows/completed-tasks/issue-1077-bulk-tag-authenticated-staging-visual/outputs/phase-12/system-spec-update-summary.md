# System Spec Update Summary

本 wave は implemented_local_runtime_pending（テストコード実装済み・runtime visual 未取得）。system spec への新規 interface 追加はない（テストコードのみ）。各 Step を以下に記録する。

## Step 1-A: 完了タスクの記録

| 項目 | 値 |
| --- | --- |
| 親機能 | bulk member tag assign / unassign（issue-1036） |
| 機能本体の状態 | dev に landed 済み（commit `ca3fb9336` / PR #1085） |
| 関連実コンポーネント | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` |
| 関連 API | `POST /admin/members/tags/bulk` / `GET /admin/tags`（既存・本タスク非変更） |
| 既存テスト | `BulkActionBar.spec.tsx`（TC-BAB-TAG-01..05）/ contract spec（B-T1..10） |

本タスク（issue-1077）は親機能の **認証付き staging visual baseline** を補完する followup-001。機能本体は変更しない。

## Step 1-B: 実装状況

| 項目 | 値 |
| --- | --- |
| workflow_state | `implemented_local_runtime_pending` |
| implementation_status | `implementation_complete_runtime_pending` |
| 実装ファイル | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`（新規・作成済み） |
| 変更しないもの | apps/api・apps/web 本番ソース・D1 schema・Google Form 仕様 |
| runtime | staging baseline 取得は user-gated（未実行） |

spec ファイルの実コードは本 wave で追加済み。local typecheck / lint / web Vitest / Playwright 登録確認は PASS。認証付き staging Playwright run、baseline 生成 / commit は user-gated。

## Step 1-C: 関連タスク

| タスク | 関係 |
| --- | --- |
| issue-1036 bulk member tag assign（親） | 機能本体。`docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| issue-901 authenticated staging visual 基盤 | `mint-staging-storage-state.ts` / `staging-visual-authenticated` project / `playwright-staging-visual-authenticated.yml` を提供。本タスクが再利用 |
| source unassigned | `docs/30-workflows/unassigned-task/task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md`。picker 2 状態は issue-1077 で partially consumed、result 2 状態は mutation 副作用ありのため残スコープ |
| result 2 状態 baseline | スコープ外（unassigned-task-detection.md の current に記録し、既存未タスクへ trace 済み） |

## Step 2: 新規 interface / 型 / API 追加

**該当なし（N/A）**。本タスクはテストコード（Playwright spec）のみの追加であり、公開 interface・型定義・API endpoint・D1 schema・Google Form schema を一切追加しない。したがって system spec（`docs/00-getting-started-manual/specs/*.md`）への記述更新も不要である。

唯一の成果物である Playwright spec は内部テスト資産であり、システム外部契約に影響しない。canonical screenshot 名（`bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png`）は artifacts.json `canonical_screenshots` を SSOT とし、phase-11 / implementation-guide と一致させる。
