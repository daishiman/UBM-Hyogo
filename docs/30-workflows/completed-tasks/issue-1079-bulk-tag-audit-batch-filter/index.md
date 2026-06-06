---
workflow_id: issue-1079-bulk-tag-audit-batch-filter
task_id: task-issue-1036-followup-003-bulk-tag-audit-batch-filter
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-03
owner: daishiman
taskType: implementation
category: 改善
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implementation_complete_pending_pr
branch: docs/issue-1079-bulk-tag-audit-batch-filter-spec
related_issue: 1079
issue_state: CLOSED
parent_workflow: issue-1036-bulk-member-tag-assign
dependencies:
  - issue-1036-bulk-member-tag-assign
---

# issue-1079 / bulk tag audit の batchId 検索・表示導線追加（タスク仕様書）

## 実装区分

`[実装区分: 実装仕様書]` — コード変更を伴う（apps/api + apps/web）。

> ユーザー指定ラベル（docs-only ではない）と実態が一致する。本タスクは「`/admin/audit` で
> bulk tag 操作の batchId を検索・表示できるようにする」運用 UX 改善であり、目的達成には
> API query filter / repository SQL / 管理画面 UI のコード変更が必須のため実装仕様書とする
> （CONST_004 デフォルト・実態優先）。

## 概要

Issue #1036（bulk member tag assign）は実 mutation した member×tag 単位で `audit_log` を記録し、
`after_json`（assign）/ `before_json`（unassign）に `batchId` を埋めて bulk 相関を残した。ただし
`/admin/audit` から batchId で一括操作単位を検索・表示する導線は未実装である。本タスクは
audit viewer / audit API に batchId filter・row detail 表示・copy 導線を追加し、bulk 操作の追跡性を高める。

**正本の事実（調査確定）:**

| 項目 | 確定値 |
| --- | --- |
| batchId 生成 | `crypto.randomUUID()`（`apps/api/src/repository/memberTags.ts` `bulkApplyMemberTagsByAdmin`） |
| assign の埋め込み位置 | `after_json` = `{ tagId, source: "manual", batchId }`（`apps/api/src/routes/admin/members.ts`） |
| unassign の埋め込み位置 | `before_json` = `{ tagId, batchId }` / `after: null` |
| audit action | `admin.member.tag_assigned` / `admin.member.tag_unassigned` |
| audit_log schema | `audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at`。`correlation_id` 列なし。index は `(target_type, target_id, created_at)` のみ |
| 現行 audit list filter | action / actorEmail / targetType / targetId / from / to / cursor / limit（batchId なし） |
| cursor 方式 | base64url(`{createdAt, auditId}`) の keyset pagination |

## 受け入れ基準（issue #1079 由来）

| ID | 受け入れ基準 | 担当タスク |
| --- | --- | --- |
| AC-1 | `/admin/audit` で batchId を入力して bulk tag audit rows を絞り込める | Task A + Task B |
| AC-2 | audit row detail に batchId が表示され、copy できる | Task C |
| AC-3 | `admin.member.tag_assigned` / `admin.member.tag_unassigned` action filter と batchId filter を併用できる | Task A + Task B |
| AC-4 | cursor pagination の next URL が batchId query を保持する | Task B |
| AC-5 | JSON body filter が D1 full scan になりすぎる場合の制限または index 方針が明記されている | Task A（Phase 2 設計） |

## タスク分割（並列レーン）

| Task | 責務 | 主対象 | 並列性 |
| --- | --- | --- | --- |
| Task A | audit API の batchId query filter + repository の JSON 検索 + API テスト | `apps/api` | 独立（apps/web と非干渉） |
| Task B | audit UI の batchId filter form + page wiring + URL builder + 型 + テスト | `apps/web`（AuditLogPanel filter 領域 / page.tsx / types） | Task C と同一ファイル別領域 |
| Task C | audit row detail の batchId 抽出・表示・copy 導線 + client component + テスト | `apps/web`（AuditLogPanel row 領域 / 新規 BatchIdCopyButton） | Task B と同一ファイル別領域 |

> Task B / Task C は `AuditLogPanel.tsx` を共有するが編集領域が分離（B=FilterForm/URL builder、C=AuditRow/抽出 helper）。
> 1 実装サイクル（03.実装.md）内で 1 PR にまとめて完了する。先送り分割ではない（CONST_007 準拠）。

## スコープ（1 サイクル完了原則 / CONST_007）

### 含む（今回サイクルで完了）

- audit API（`/admin/audit` GET）への `batchId` query filter 追加
- repository `listFiltered` の `json_extract` による batchId 検索（after_json / before_json 両方）
- `/admin/audit` UI の batchId filter input（FormField）と URL/cursor 保持
- audit row detail の batchId 抽出・表示・copy ボタン（新規 client component）
- contract / repository / component テスト

### 含まない（明示的スコープ外・先送りではなく別関心）

- `audit_log` schema 変更（`correlation_id` 列追加 / generated column / JSON index migration）。
  AC-5 は「制限または index 方針の**明記**」のみを要求し、schema 変更自体は要求しない。親 #1036 が
  既に「軽量 batchId 方針（schema 変更なし）」を採択済みで、index 化は schema migration を伴う別関心。
  → 将来 index 最適化が必要になった場合の別タスク化方針を Phase 2 / unassigned-task-detection に記録する。
- bulk tag write 実装（`memberTags.ts` の mutation ロジック）の変更
- 単一 endpoint（`POST /:memberId/tags` 等）への batchId 付与
- production deploy / commit / push / PR 作成（すべて user-gated）

## Phase 一覧

| Phase | ファイル | 状態 |
| --- | --- | --- |
| Phase 1 要件定義 | `phase-1-requirements.md` | spec_created |
| Phase 2 設計 | `phase-2-design.md` | spec_created |
| Phase 3 設計レビュー（Gate-A） | `phase-3-design-review.md` | spec_created |
| Phase 4 テスト作成 | `phase-4-test-plan.md` | spec_created |
| Phase 5 実装 | `phase-5-implementation.md` | spec_created |
| Phase 6 テスト拡充 | `phase-6-test-additions.md` | spec_created |
| Phase 7 カバレッジ確認 | `phase-7-coverage.md` | spec_created |
| Phase 8 リファクタリング | `phase-8-refactor.md` | spec_created |
| Phase 9 品質保証（Gate-B） | `phase-9-qa.md` | implemented_local_evidence_captured |
| Phase 10 最終レビュー（Gate-C） | `phase-10-final-review.md` | runtime_visual_pending |
| Phase 11 手動テスト | `phase-11-manual-test.md` | spec_created |
| Phase 12 ドキュメント更新 | `phase-12-documentation.md` / `outputs/phase-12/*` | spec_created |
| Phase 13 PR 作成 | `phase-13-pr.md` | pending_user_approval |

## タスク仕様書

- [tasks/task-A-api-audit-batchid-filter.md](tasks/task-A-api-audit-batchid-filter.md)
- [tasks/task-B-web-audit-filter-plumbing.md](tasks/task-B-web-audit-filter-plumbing.md)
- [tasks/task-C-web-audit-batchid-display-copy.md](tasks/task-C-web-audit-batchid-display-copy.md)

## 実装反映サマリ（2026-06-03）

本ワークフローは automation-30 / task-specification-creator / aiworkflow-requirements 準拠検証で
`taskType=implementation` の spec-only close-out 不整合を検出したため、同一サイクルで実コードへ昇格した。

| 領域 | 実変更 |
| --- | --- |
| API | `GET /admin/audit` に `batchId` query / `appliedFilters.batchId` を追加し、`auditLog.listFiltered` で `after_json.$.batchId` と `before_json.$.batchId` を同一 binding で OR 検索する。 |
| Web | `/admin/audit` filter form / API path / pagination href に `batchId` を plumbing し、row detail に `extractBatchId` + `BatchIdCopyButton` を追加する。 |
| Tests | API contract/repository と Web component/page tests に AC-1..4 の回帰を追加。 |
| 正本同期 | aiworkflow-requirements の `api-endpoints.md`、workflow active、quick/resource index、artifact inventory に同期。 |

Gate-C の authenticated visual screenshot は user-gated runtime evidence として残す。commit / push / PR は未実行。

## 参照

- `docs/30-workflows/unassigned-task/task-issue-1036-followup-003-bulk-tag-audit-batch-filter.md`
- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`
- `apps/api/src/routes/admin/audit.ts` / `apps/api/src/repository/auditLog.ts`
- `apps/api/src/routes/admin/members.ts` / `apps/api/src/repository/memberTags.ts`
- `apps/web/src/components/admin/AuditLogPanel.tsx` / `apps/web/app/(admin)/admin/audit/page.tsx`
