---
workflow_id: issue-1129-single-write-batchid-correlation
task_id: task-issue-1079-followup-002-single-write-batchid-correlation
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-07
owner: daishiman
taskType: implementation
category: 改善
visualEvidence: NON_VISUAL
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: docs/issue-1129-single-write-batchid-correlation-spec
related_issue: 1129
issue_state: CLOSED
parent_workflow: issue-1079-bulk-tag-audit-batch-filter
dependencies:
  - issue-1079-bulk-tag-audit-batch-filter
  - issue-1036-bulk-member-tag-assign
---

# issue-1129 / 単一 tag write endpoint への batchId 相関キー付与（タスク仕様書）

## 実装区分

`[実装区分: 実装仕様書]` — コード変更を伴う（apps/api のみ）。

> Issue ラベルは `type:improvement`（改善）だが、目的「単一 write の audit payload に
> 相関キーを付与し `GET /admin/audit` の batchId フィルタに乗せる」は
> `apps/api/src/routes/admin/members.ts` の audit append payload を実コード変更しなければ
> 達成できない。docs/調査のみでは完結しないため **実装仕様書**（CONST_004 デフォルト・実態優先）とする。
> `audit_log` schema 変更・新 endpoint 追加・Google Form 仕様変更は一切伴わない。

## 概要

Issue #1036（bulk member tag assign）の bulk write（`POST /admin/members/tags/bulk`）は、
実 mutation した item 単位で `audit_log` に append し、`after_json`（assign）/ `before_json`（unassign）
に `batchId`（`crypto.randomUUID()`）を埋めて一括操作を相関する。Issue #1079 はこの batchId を
`GET /admin/audit` の `batchId` query で検索できるようにした（`json_extract` の after/before OR 検索）。

一方、単一 member の手動 tag 付与/解除（`POST /admin/members/:memberId/tags` /
`DELETE /admin/members/:memberId/tags/:tagId`）の audit は現状 `after: { tagId, source }`（assign）/
`before: { tagId }`（unassign）で **batchId を持たない**。このため単一 write 操作は相関キーを持たず、
bulk と同じ一括フィルタ導線に乗らない非対称が残っている。

本タスクは、単一 write endpoint の audit payload にも相関キー（`batchId`）を付与し、
bulk と同一の payload キー名・JSON path・非対称配置（assign=after_json / unassign=before_json）に揃えて、
`GET /admin/audit` の既存 batchId フィルタが改修なしでそのまま効く状態にする。

## 正本の事実（調査確定）

| 項目 | 確定値 | 出典 |
| --- | --- | --- |
| 単一 assign handler | `apps/api/src/routes/admin/members.ts:799-850`（audit append `members.ts:833-843`） | 実コード |
| 単一 unassign handler | `apps/api/src/routes/admin/members.ts:852-886`（audit append `members.ts:872-883`） | 実コード |
| 現状 assign payload | `after: { tagId, source: "manual" }`（`members.ts:841`・batchId 無） | 実コード |
| 現状 unassign payload | `before: { tagId }`（`members.ts:880`・batchId 無） | 実コード |
| bulk batchId 生成 | `bulkApplyMemberTagsByAdmin` 内 `crypto.randomUUID()`（`memberTags.ts:304`） | 実コード |
| bulk assign payload | `after: { tagId, source: "manual", batchId: result.batchId }`（`members.ts:761`） | 実コード |
| bulk unassign payload | `before: { tagId, batchId: result.batchId }`（`members.ts:770`） | 実コード |
| audit batchId 検索 SQL | `auditLog.ts:200-205` `json_extract(after_json,'$.batchId')` OR `json_extract(before_json,'$.batchId')` | 実コード |
| audit query schema | `audit.ts:22` `batchId: z.string().min(1).optional()` | 実コード |
| 単一 write の noop 判定 | `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` が `meta.changes>0` を返し、route が真のときのみ append | `memberTags.ts:208-237` |
| 不変条件 #13 | tag write 3 経路分離（`memberTags.ts:1-17`）。本タスクは第2経路（単一 admin manual）の audit payload 拡張のみ | 実コード |
| migration 0026 | 存在しない（最新 0025）。本タスクは schema 変更を伴わないため新 migration 不要 | 実コード |

## 設計の核心判断（AC-1: 相関「まとまり」定義）

**相関の「まとまり」= リクエスト単位（request-scoped correlation）に確定する。**

- 各単一 write endpoint（assign/unassign）は、実 mutation 成功（`changes>0`）後の audit append 直前で
  `crypto.randomUUID()` を 1 回生成し、`batchId` キーとして payload に埋める。
- 単一 write は「1 リクエスト = 1 mutation」なので、その batchId が相関するのは常に 1 行（=自分自身）。
  相関グループのサイズは 1 である。
- bulk の batchId も「1 bulk リクエストで実 mutation した member×tag 行群」を束ねる **request-scoped correlation**。
  単一はそのグループサイズが 1 になる特殊ケースに過ぎず、**意味論は同一**（1 write リクエスト単位の相関）。
  したがって bulk の意味論と衝突しない（AC-6）。
- payload キー名 `batchId`・JSON path `$.batchId`・assign=after_json / unassign=before_json の非対称配置を
  bulk と完全一致させる（AC-4）。これにより `GET /admin/audit` の `json_extract` OR 検索が改修なしでヒットする（AC-2/AC-3）。
- セッション単位（複数リクエスト横断）の相関は採用しない。横断には request header / session token の新設が必要で、
  schema 変更なし・1 サイクル完了・既存フィルタ非改修という制約を破るため scope out（Phase 10 §残課題に記録）。

> 命名注記（FB-SDK-07-4）: 意味論的には「correlation id（相関キー）」だが、`GET /admin/audit` の
> 既存 `json_extract(..., '$.batchId')` 検索を非改修で効かせるため payload キー名は bulk と同じ `batchId` を再利用する。
> 単一 write では群サイズ=1 であることを implementation-guide に明記する。

## 受け入れ基準

| ID | 受け入れ基準 | 充足 Phase |
| --- | --- | --- |
| AC-1 | 単一 write の相関「まとまり」（= リクエスト単位）が定義され、付与方針が確定している | Phase 1-3 |
| AC-2 | `POST /admin/members/:memberId/tags`（assign）の audit payload に `batchId` が付与され、`GET /admin/audit?batchId=` でヒットする | Phase 5/6 |
| AC-3 | `DELETE /admin/members/:memberId/tags/:tagId`（unassign）の audit payload（before_json 側）に `batchId` が付与され、batchId フィルタでヒットする | Phase 5/6 |
| AC-4 | 単一 write の payload キー名・所在が bulk（#1036）と揃っており、`GET /admin/audit` の `json_extract` after/before OR 検索が改修なしでそのまま効く | Phase 5 |
| AC-5 | state 変化時（実 mutation 時）のみ audit を残す既存挙動が維持され、noop は audit を残さない（非退化） | Phase 6 |
| AC-6 | bulk の batchId 意味論（request-scoped correlation）と衝突しない | Phase 1-3/10 |

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/routes/admin/members.ts` | 編集 | assign handler（`833-843`）/ unassign handler（`872-883`）の audit payload に `batchId: crypto.randomUUID()` を追加（assign→after / unassign→before） |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | 編集 | 単一 assign/unassign の audit payload に `batchId`（UUID v4）が付くこと・noop 時に audit 不増を回帰固定 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 編集 | 単一 write 由来 `batchId` で `GET /admin/audit?batchId=` が assign(after)/unassign(before) 両方ヒットすることを contract 固定 |

> repository（`memberTags.ts`）・migration・`apps/web` は **非変更**。`audit_log` schema・`GET /admin/audit` の query surface も非変更。

## Phase 構成

| Phase | 名称 | ファイル | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-1-requirements.md | implemented_local_evidence_captured |
| 2 | 設計 | phase-2-design.md | implemented_local_evidence_captured |
| 3 | 設計レビュー | phase-3-design-review.md | implemented_local_evidence_captured |
| 4 | テスト作成 | phase-4-test-plan.md | implemented_local_evidence_captured |
| 5 | 実装 | phase-5-implementation.md | implemented_local_evidence_captured |
| 6 | テスト拡充 | phase-6-test-additions.md | implemented_local_evidence_captured |
| 7 | カバレッジ確認 | phase-7-coverage.md | implemented_local_evidence_captured |
| 8 | リファクタリング | phase-8-refactor.md | implemented_local_evidence_captured |
| 9 | 品質保証 | phase-9-qa.md | implemented_local_evidence_captured |
| 10 | 最終レビュー | phase-10-final-review.md | implemented_local_evidence_captured |
| 11 | 手動テスト | phase-11-manual-test.md | implemented_local_evidence_captured |
| 12 | ドキュメント更新 | phase-12-documentation.md | implemented_local_evidence_captured |
| 13 | PR作成 | phase-13-pr.md | pending_user_approval |

## スコープ

### 含む
- 単一 tag write（assign/unassign）の audit payload への `batchId` 相関キー付与（route 層）
- 相関「まとまり」= リクエスト単位の確定
- contract test での batchId フィルタヒット検証・noop 非退化回帰

### 含まない（scope out）
- `audit_log` schema 変更（JSON payload 軽量方針を維持。`correlation_id` 列・generated column・index migration は作らない）
- bulk tag write 実装（#1036）の変更
- `GET /admin/audit` の query surface 変更（#1079 で確定済み）
- セッション単位（複数リクエスト横断）相関 — Phase 10 §残課題に未タスク候補として記録
- `apps/web` 変更（admin audit viewer 表示は #1079 が既に batchId 列を表示済み。単一 write の batchId も同 viewer で自動的に表示・copy 可能）
- commit / push / PR 作成 / production deploy（Phase 13・user-gated）

## 検証コマンド（実装サイクルで使用）

```bash
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

## 参照
- `docs/30-workflows/unassigned-task/task-issue-1079-followup-002-single-write-batchid-correlation.md`（baseline B-2 / 本 spec の起点）
- `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/`（親 workflow / batchId 検索導線）
- `apps/api/src/routes/admin/members.ts` / `apps/api/src/repository/memberTags.ts` / `apps/api/src/repository/auditLog.ts`
