---
workflow_id: issue-987-identity-conflicts-audit-log-admin-ui
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-29
owner: daishiman
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: docs/issue-987-identity-conflicts-audit-log-admin-ui
related_issue: 987
issue_state: CLOSED
---

# Issue #987 — identity-conflicts merge/dismiss 監査ログ admin UI 表示（根本解決）

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-987-identity-conflicts-audit-log-admin-ui |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| workflow_state | implemented_local_evidence_captured |
| related_issue | #987 (CLOSED 維持) |

## 実装区分

`[実装区分: 実装仕様書]` — コード変更を伴う（CONST_004 デフォルト）。

> Issue #987 はラベル上 `area:admin-ui` を含むが、本質はコード変更（API repository / route の監査記録追加）であり docs-only では目的を達成できないため実装仕様書として作成する。UI（`/admin/audit`）は既存実装を活用するため UI 新規実装はゼロで、視覚的変更が無いため `NON_VISUAL` とする（Phase 11 で根拠を明記）。

## Issue 現況調査結果（最新コードに対する最適化）

Issue #987 は「`/admin/identity-conflicts` の merge / dismiss 操作の監査履歴を admin UI から時系列に閲覧・フィルタ可能にする」を目的とする。**最新コードを調査した結果、merge は既に解決済み・dismiss のみ未解決**であることが判明した。Issue 本文は古い前提（merge / dismiss 両方とも UI から見られない）で書かれているため、根本問題を「dismiss が監査ログに残らない」一点に最適化する。

| 操作 | audit_log 記録 | `/admin/audit` 閲覧 | 判定 |
| --- | --- | --- | --- |
| merge | ✅ あり（`identity-merge.ts` が D1 batch で `action='identity.merge'` を記録） | ✅ `action=identity.merge` フィルタで時系列閲覧可 | **解決済み** |
| dismiss | ❌ なし（`identity-conflict.ts` は `identity_conflict_dismissals` のみに INSERT） | ❌ audit_log に無く検索不可 | **未解決（根本問題）** |

### 根本原因（file_path:line_number）

- `apps/api/src/repository/identity-conflict.ts:179-202` `dismissIdentityConflict()` — `identity_conflict_dismissals` への単一 INSERT のみ。`audit_log` 未記録。
- `apps/api/src/routes/admin/identity-conflicts.ts:91-110` dismiss endpoint — `actorAdminEmail` を repository へ渡していない（merge endpoint は `user.email ?? null` を渡す）。
- 対比: `apps/api/src/repository/identity-merge.ts:119-167` — merge は D1 `db.batch` で `identity_aliases` / `identity_merge_audit` / `audit_log` の 3 INSERT をアトミック実行。

## 目的

dismiss 操作を merge と対称化し、`audit_log` に `action='identity.dismiss'` を記録する。これにより既存の `/admin/audit` UI（action / actorEmail / targetId / 期間フィルタ）から dismiss 履歴を時系列に閲覧・フィルタできる状態にする。

## 実装サマリ

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/` |
| 状態 | `implemented_local_evidence_captured`（dismiss 監査ログ実装 + focused D1 Vitest evidence captured。staging runtime / commit / push / PR は user-gated） |
| 主実装対象 | `apps/api/src/repository/identity-conflict.ts`（dismiss を D1 batch 化 + audit_log INSERT）、`apps/api/src/routes/admin/identity-conflicts.ts`（dismiss endpoint に actorAdminEmail 配線） |
| UI 変更 | **不要**。`apps/web/app/(admin)/admin/audit/page.tsx` / `apps/web/src/components/admin/AuditLogPanel.tsx` は既存フィルタで `action=identity.dismiss` 閲覧可 |
| 新規 migration | **不要**。`audit_log` は既存（`apps/api/migrations/0003_auth_support.sql`） |
| API contract | dismiss endpoint の外形（POST `/identity-conflicts/:id/dismiss`、戻り値 `{ dismissedAt }`、status code）は不変。内部の監査記録のみ追加 |
| テスト | `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` に dismiss → audit_log 記録検証を追加 / `audit.contract.spec.ts` に `action=identity.dismiss` フィルタ通過を追加 |
| 不変条件 | CLAUDE.md #5（D1 直アクセスは apps/api 限定）/ #13（audit logging）を満たす。既存 endpoint surface 変更なし |

## スコープ判断（CONST_007）

本タスクは API repository / route の監査記録追加に閉じ、**1 実装サイクルで完了可能**。先送り・別 PR 分割はしない。任意の軽微 UX 改善（AuditLogPanel への `identity.dismiss` プリセット選択肢追加）は根本解決に不要なため、Phase 12 で未タスク候補として記録するに留める（スコープ外）。

## Phase 一覧

| Phase | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | completed |
| 2 | `outputs/phase-2/phase-2.md` | completed |
| 3 | `outputs/phase-3/phase-3.md` | completed |
| 4 | `outputs/phase-4/phase-4.md` | completed |
| 5 | `outputs/phase-5/phase-5.md` | completed |
| 6 | `outputs/phase-6/phase-6.md` | completed |
| 7 | `outputs/phase-7/phase-7.md` | completed |
| 8 | `outputs/phase-8/phase-8.md` | completed |
| 9 | `outputs/phase-9/phase-9.md` | completed |
| 10 | `outputs/phase-10/phase-10.md` | completed |
| 11 | `outputs/phase-11/phase-11.md` | completed (NON_VISUAL local evidence captured) |
| 12 | `outputs/phase-12/phase-12.md`（+ main.md / strict 7 成果物） | completed |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 関連

- GitHub Issue: #987（CLOSED のまま維持。Issue 本文の旧前提を最新コードに最適化して根本解決）
- 親サイクル: `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/`（FU-AIDC-002 起票元）
- 関連 FU: #989（manualMergeReason schema 拡張）
