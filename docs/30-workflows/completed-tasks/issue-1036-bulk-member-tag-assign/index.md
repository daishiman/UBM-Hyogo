---
workflow_id: issue-1036-bulk-member-tag-assign
workflow_state: implemented_local_runtime_pending
created_at: 2026-06-01
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_runtime_pending
branch: docs/issue-1036-bulk-member-tag-assign-spec
related_issue: 1036
issue_state: CLOSED
parent_workflow: issue-982-drawer-tag-pill-editing
---

# issue-1036 複数 member への tag 一括付与/解除 (bulk member tag assign)

## 概要

admin members 一覧で複数 member を checkbox 選択し、複数 tag を **一括で付与/解除** する
batch endpoint + bulk UI を実装する。issue-982（単一 member drawer の手動 tag 編集）の
followup-003 として scope-out されていた「bulk tag assign」を、最新コードに最適化して
1 実装サイクルで完結させる。

- GitHub Issue: [#1036](https://github.com/daishiman/UBM-Hyogo/issues/1036)（**CLOSED 維持** — clozed のままタスク仕様書を作成）
- 親 workflow: `docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/`
- 元仕様書: `…/issue-982-drawer-tag-pill-editing/unassigned-task-specs/issue-982-drawer-tag-pill-editing-followup-003-bulk-member-tag-assign.md`

## 実装区分

**`[実装区分: 実装仕様書]`** — apps/api（batch endpoint + repository + audit + type gate）
および apps/web（BulkActionBar 拡張 + tag picker + 部分失敗表示）のコード変更を伴う。

## 調査による判定（issue が古い可能性への対応）

| 観点 | 判定 | 根拠 |
|------|------|------|
| 別タスクで解決済みか | **未解決（未実装）** | batch endpoint / bulk tag UI ともに現行コードに存在しない。単一 endpoint（`POST/DELETE /admin/members/:memberId/tags`）のみ issue-982 で実装済み（`apps/api/src/routes/admin/members.ts` L656-744）。`BulkActionBar.tsx` は publish/hide/soft-delete のみ。 |
| 実装は必要か | **必要** | AC-1〜AC-7 のいずれも未充足。 |
| issue は最新コードと乖離しているか | **一部乖離（最適化済み）** | 元仕様の「上流前提＝#913 server idempotency store」は未実装・CLOSED。最新コードの member_tags 複合 PK `(member_id, tag_id)` + `INSERT OR IGNORE` による DB 自然冪等で AC-5 を **#913 非依存** に実現できるため、#1036 単独で 1 サイクル完結に最適化した。 |

## 最新コードへの最適化ポイント（root-cause 解決）

1. **#913 依存の除去**: AC-5 の bulk 冪等は server idempotency store ではなく、`member_tags` の複合 PK と `INSERT OR IGNORE` / `DELETE … WHERE` の `meta.changes` 判定で実現する。再送時は既成功分が自然に `noop` に落ちる。
2. **audit 相関**: `audit_log` に `correlation_id` 列は存在しないため、schema 変更せず `after_json` に `batchId`（`crypto.randomUUID()`）を埋め込み bulk 相関を残す。
3. **部分成功レポート**: D1 `db.batch()` は all-or-nothing のため、AC-2 の部分失敗レポートは member×tag 単位の loop + 個別判定で実装する（既存 `assignTagsToMember` の loop パターンを踏襲）。
4. **tag master read endpoint 新設**: bulk UI の tag picker 用に read 専用 `GET /admin/tags`（`getTagDefinitionMaster` 再利用）を最小追加。tag master write の #1035 とは read/write で責務分離。

## タスク分割（関心ごとの分離 — 全て同一サイクル内で完結）

| Task | 領域 | 責務 | 依存 |
|------|------|------|------|
| task-A | apps/api | bulk tag batch endpoint + repository helper + tag master read endpoint + audit + type-level gate 更新 | なし |
| task-B | apps/web | BulkActionBar への tag picker + assign/unassign モード + 進行/部分失敗表示 + API client | task-A |
| task-C | docs | 不変条件 #13 の「第3 write 入口（bulk admin）」再定義 + visual baseline 整合 | task-A, task-B |

> **CONST_007 遵守**: 先送り（別 PR / バックログ）はしない。3 task はすべて 1 実装サイクル（03.実装.md）で完了するスコープ。上流前提だった #913 を DB 自然冪等で代替することで単独完結を成立させた。

## Phase 一覧

| Phase | 名称 | ステータス | ファイル |
|-------|------|-----------|---------|
| 1 | 要件定義 | implemented | phase-1-requirements.md |
| 2 | 設計 | implemented | phase-2-design.md |
| 3 | 設計レビュー | implemented | phase-3-design-review.md |
| 4 | テスト作成 | implemented | phase-4-test-plan.md |
| 5 | 実装 | implemented | phase-5-implementation.md |
| 6 | テスト拡充 | implemented | phase-6-test-additions.md |
| 7 | カバレッジ確認 | implemented | phase-7-coverage.md |
| 8 | リファクタリング | implemented | phase-8-refactor.md |
| 9 | 品質保証 | implemented | phase-9-qa.md |
| 10 | 最終レビュー | implemented | phase-10-final-review.md |
| 11 | 手動テスト | runtime_pending（screenshot は staging 認証必須・user-gated） | phase-11-manual-test.md |
| 12 | ドキュメント更新 | implemented | phase-12-documentation.md |
| 13 | PR作成 | pending_user_approval | phase-13-pr.md |

## 実装結果（2026-06-01 本サイクルで実装完了）

| Task | 実装ファイル | テスト | 結果 |
|------|-------------|-------|------|
| task-A | `apps/api/src/repository/memberTags.ts`（`bulkApplyMemberTagsByAdmin` + 型 + #13 第3経路コメント）、`apps/api/src/routes/admin/members.ts`（`POST /admin/members/tags/bulk` + `GET /admin/tags`）、`memberTags.readonly.test-d.ts`（gate allow list） | `members-tags-bulk.contract.spec.ts`（11）+ `memberTags.bulk.repository.spec.ts`（6）+ 既存 `members.tags.contract.spec.ts`（13 regression） | 30 passed |
| task-B | `apps/web/src/features/admin/api/members.ts`（`bulkApplyMemberTags` / `fetchTagMaster` + 型）、`apps/web/src/features/admin/components/_members/BulkActionBar.tsx`（tag picker + op 切替 + 部分失敗表示） | `BulkActionBar.spec.tsx`（10）+ `MemberDrawer.tags.spec.tsx`（8 regression） | 18 passed |
| task-C | `apps/api/src/repository/memberTags.ts` 先頭コメント（不変条件 #13 第3経路）。CLAUDE.md は #13 記述が無く N/A（正本は memberTags.ts） | type-level gate（6） | passed |

検証ゲート: api/web typecheck（exit 0）/ pnpm lint（exit 0）/ type-level gate（6 passed）/ verify-design-tokens（91 tracked in sync）。

残（user-gated）: Phase 11 の `outputs/phase-11/screenshots/bulk-tag-*.png` baseline 取得（staging 認証必須）/ commit / push / PR 作成。

## 受入条件 (AC)

- **AC-1**: batch endpoint で複数 memberId × 複数 tagId を `op:"assign"`/`op:"unassign"` で一括処理
- **AC-2**: 部分失敗時 member×tag 単位の結果 shape（`{ results: [{ memberId, tagId, status }] }`、status ∈ `assigned`/`unassigned`/`noop`/`skipped_deleted`/`tag_not_found`）
- **AC-3**: 実 mutation した member×tag 単位で audit 1 件（既存単一 endpoint と action 名 parity）
- **AC-4**: 削除済み member（`member_status.is_deleted=1`）は `skipped_deleted` で skip、他 member は継続
- **AC-5**: 同一 bulk 再送が冪等（既成功分は `noop`、追加 audit/副作用なし） — **#913 非依存・DB 自然冪等で実現**
- **AC-6**: 既存単一 endpoint と既存 `BulkActionBar`（publish/hide/soft-delete）に regression 無し
- **AC-7**: 既存複数選択（checkbox + `selected: Set`）を再利用し `BulkActionBar` に tag picker + 一括付与/解除 + 部分失敗結果表示を追加
