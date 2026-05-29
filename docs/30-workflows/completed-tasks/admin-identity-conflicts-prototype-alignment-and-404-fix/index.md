---
workflow_id: admin-identity-conflicts-prototype-alignment-and-404-fix
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-27
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: existing-route-alignment-and-runtime-recovery
implementation_status: local_web_alignment_implemented_staging_runtime_pending
branch: feat/admin-identity-conflicts-prototype-alignment
---

# Admin Identity Conflicts — Prototype Alignment & Staging 404 Fix

## 目的

`/admin/identity-conflicts` の以下 2 系統を 1 サイクルで解消する:

- **(A) Prototype 整合 UI 改修**: 他 admin 画面（members/meetings/tags）と同じ `AdminPageHeader` + admin primitives で再構成し、`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` の `AdminMembersPage` / `AdminTagsPage` 規範に揃える。
- **(B) Staging 404 (ADMIN_FETCH_404) 根本原因究明＆復旧**: 本番 / staging 環境で `/api/admin/identity-conflicts` 経由の fetch が 404 を返し `AdminSectionErrorClient` が `ADMIN_FETCH_404` を表示する事象の root-cause を H1〜H5 仮説で切り分け、再現可能な復旧手順とした上で fix を当てる。

## 実装サマリ

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/` |
| 状態 | `implemented_local_evidence_captured`（web UI alignment 実装 + local typecheck/Vitest PASS、staging runtime/visual は user-gated） |
| 実装対象 (A) | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`, `apps/web/src/components/admin/IdentityConflictRow.tsx`, focused vitest spec |
| 実装対象 (B) | staging 環境調査（deploy version / env / D1 migration / proxy path）。現コード上 proxy/API path は成立しているため、deploy/env/runtime 確認を user-gated evidence とする |
| 正本 prototype | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` の `AdminMembersPage` / `AdminTagsPage`（identity-conflicts 専用ページは未掲載 → 最近接規範を採用） |
| API contract | 既存 `apps/api/src/routes/admin/identity-conflicts.ts` を一切変更しない（GET list / POST :id/merge / POST :id/dismiss） |
| runtime boundary | local typecheck / Vitest は本 wave で完結。staging deploy / authenticated 404 再現 / visual baseline / commit / push / PR は Phase 13 (user-gated) |

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
| 8 | `outputs/phase-8/phase-8.md` | completed (spec) |
| 9 | `outputs/phase-9/phase-9.md` | completed (spec) |
| 10 | `outputs/phase-10/phase-10.md` | completed (spec) |
| 11 | `outputs/phase-11/phase-11.md` | completed (local evidence pending files) |
| 12 | `outputs/phase-12/main.md` | completed |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 4 条件 verdict

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | API endpoint / D1 schema / requireAdmin contract は不変。UI 整合のみ + 404 復旧は ops 主体 |
| 漏れなし | PASS | A (UI 整合) と B (404 root-cause) を Phase 2 で task 分解し、各 DoD を Phase 4 / Phase 7 で具体化 |
| 整合性あり | PASS | `existing-route-alignment-and-runtime-recovery` + `VISUAL_ON_EXECUTION` で他 admin alignment workflow と語彙統一 |
| 依存関係整合 | PASS | A は web 単独完結。B は staging deploy version / env / D1 migration を read-only 調査し、必要時のみ ops を user-gated で実行 |

## Spec-extraction (route owner / handoff / state owner / view)

詳細は `outputs/phase-1/spec-extraction-map.md` 参照。要約:

| 系統 | owner | 場所 |
| --- | --- | --- |
| route 定義 | apps/api | `apps/api/src/routes/admin/identity-conflicts.ts` |
| mount | apps/api | `apps/api/src/index.ts:283` `app.route("/admin", createAdminIdentityConflictsRoute())` |
| state (D1) | apps/api | `member_identities`, `identity_aliases`, `identity_conflict_dismissals` |
| proxy | apps/web | `apps/web/app/api/admin/[...path]/route.ts` |
| view | apps/web | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` + `apps/web/src/components/admin/IdentityConflictRow.tsx` |

## 次フェーズ（Phase 8-13）への引継ぎ

Phase 7 末尾「次 agent への引継ぎ事項」セクション参照。
