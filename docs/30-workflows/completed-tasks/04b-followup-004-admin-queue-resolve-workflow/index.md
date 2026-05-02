# 04b-followup-004-admin-queue-resolve-workflow

```yaml
issue_number: 319
issue_url: https://github.com/daishiman/UBM-Hyogo/issues/319
issue_state: CLOSED
task_id: 04b-followup-004-admin-queue-resolve-workflow
task_name: admin queue resolve workflow（visibility/delete request 確定処理）
task_type: implementation
visual_evidence: VISUAL
workflow_state: implementation_completed
created_at: 2026-05-01
branch: docs/issue-319-admin-queue-resolve-workflow-task-spec
```

## 目的

04b で `admin_member_notes` に永続化される `note_type='visibility_request'` / `'delete_request'` を、admin が pickup → resolve する一連のワークフローを構築する実装タスクの仕様書一式を定義する。Issue #319 は closed のまま扱い、`docs/30-workflows/unassigned-task/04b-followup-004-admin-queue-resolve-workflow.md` を入力単票として、Phase 1-13 の実行可能な仕様へ分解する。前提として 04b-followup-001（Issue #217）で `request_status` / `resolved_at` / `resolved_by_admin_id` 列、および `markResolved` / `markRejected` repository helper が追加済みである。

## スコープ

含むもの:

- `GET /admin/requests?status=pending&type=visibility_request|delete_request` 一覧 API の query / pagination / admin gate 契約
- `POST /admin/requests/:noteId/resolve` 確定 API の resolution（approve / reject）契約と冪等性
- visibility_request 承認時の `member_status.publish_state` 更新、delete_request 承認時の論理削除（`member_status.is_deleted=1`）
- D1 transaction での `member_status` + `admin_member_notes` atomic 更新
- audit metadata（`resolved_by_admin_id` / `resolved_at` / `resolutionNote`）の記録
- 07a admin UI（queue 一覧 / 詳細 / resolve 操作）統合差分
- API contract test、repository transaction test、web component test、Playwright visual smoke

含まないもの:

- `admin_member_notes` schema 設計（04b-followup-001 で実施済み）
- member 側 `/me/visibility-request` `/me/delete-request` の API 仕様変更（04b で固定済み）
- 通知 / メール連携（別タスクで判断）
- Issue の reopen / close 操作、commit、push、PR 作成

## Phase 一覧

| Phase | ファイル | 目的 | 状態 |
| --- | --- | --- | --- |
| 1 | phase-01.md | 要件定義 | completed |
| 2 | phase-02.md | 設計 | completed |
| 3 | phase-03.md | 設計レビュー | completed |
| 4 | phase-04.md | テスト戦略 | completed |
| 5 | phase-05.md | API / repository 実装 | completed |
| 6 | phase-06.md | Web UI 実装 | completed |
| 7 | phase-07.md | AC マトリクス | completed |
| 8 | phase-08.md | リファクタリング / DRY 化 | completed |
| 9 | phase-09.md | 品質保証 | completed |
| 10 | phase-10.md | 最終レビュー | completed |
| 11 | phase-11.md | 手動 smoke / visual evidence | completed |
| 12 | phase-12.md | ドキュメント更新 | completed |
| 13 | phase-13.md | PR 作成準備 | pending_user_approval |

## 正本参照

| 種別 | パス | 用途 |
| --- | --- | --- |
| Issue 入力 | https://github.com/daishiman/UBM-Hyogo/issues/319 | 要件・AC |
| 元単票 | docs/30-workflows/unassigned-task/04b-followup-004-admin-queue-resolve-workflow.md | closed issue 元仕様 |
| 前提タスク | docs/30-workflows/unassigned-task/04b-followup-001-admin-queue-request-status-metadata.md | request_status 列追加 |
| API 正本 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | admin API 契約 |
| DB 正本 | .claude/skills/aiworkflow-requirements/references/database-implementation-core.md | admin_member_notes / member_status |
| Admin UI 正本 | .claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md | apps/web admin proxy / gate |
| 編集削除仕様 | docs/00-getting-started-manual/specs/07-edit-delete.md | visibility / delete request 設計 |
| Admin 正本 | docs/00-getting-started-manual/specs/11-admin-management.md | admin gate 二段防御 |
| Repository | apps/api/src/repository/adminNotes.ts | markResolved / markRejected helper |

## 実装時の不変条件

- `admin_member_notes` の書き込み主体は分離する。`/me/*` は依頼作成のみ、`/admin/*` は依頼解決のみを行う。
- `member_status` 更新は必ず D1 transaction で `admin_member_notes` の status 更新と atomic に行う。途中失敗時はロールバックする。
- 不変条件 #4（admin-managed data 分離）に従い、`admin_member_notes` 由来の追加列を Google Form schema 領域へ混入させない。
- 不変条件 #5 に従い、apps/web から D1 へ直接アクセスせず、必ず apps/api 経由に閉じる。
- 同 noteId への二重 resolve は冪等または 409 Conflict として拒否する。`request_status='pending'` 以外は確定 API を受け付けない。
- 管理者認可は apps/web layout / proxy と apps/api `requireAdmin` の二段防御を維持する。
- delete_request 承認は論理削除（`is_deleted=1`）であり、行を物理削除しない。
- audit metadata（`resolved_by_admin_id` / `resolved_at` / `resolutionNote`）は確定操作のたびに必ず記録する。`resolutionNote` は新規列を増やさず、`admin_member_notes.body` の resolution envelope に格納する。
