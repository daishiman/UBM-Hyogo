---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
task_id: admin-ui-task-d-attendance-primitive-conformance
作成日: 2026-05-26
親ワークフロー: ../admin-ui-prototype-alignment/
ソース: ../admin-ui-prototype-alignment/tasks/task-D-attendance-primitive-conformance.md
ブランチ想定: feat/admin-ui-prototype-alignment
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
workflow_state: implemented_local_evidence_captured
implementation_status: implementation_complete_pending_pr
---

# Task D — `/admin/dashboard/attendance` の features/admin primitive 化（孤立島の解消）

## 実装区分判定

- 区分: **実装仕様書**
- 根拠: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` を `AdminPageHeader` + `KpiCard` + `AdminTable` の 3 primitive 構成へ書き換えるコード変更を伴う。新規 vitest spec も追加する。docs-only では目的（孤立島の解消・primitive 採用率 100%）を達成できない。

## CONST_007 スコープ宣言

- 本仕様書群（Phase 1-13）は **後続実装プロンプト 1 サイクル内で完了するスコープ** に収めている。
- 先送り無し。今回サイクル外に分離した項目は無し（Phase 12.2 で "作らない" と明示判定した 3 候補は本タスクの不変条件外であり、別 workflow 起票も発行しない）。

## スコープ

- 対象画面: `/admin/dashboard/attendance` 単一画面
- 変更コード: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`（Server Component fetch owner）、`apps/web/app/(admin)/admin/dashboard/attendance/AttendanceDashboardSections.client.tsx`（AdminTable / KpiCard client island）、新規 spec 1 本
- 不変条件: 既存 3 endpoint (`/admin/dashboard/attendance/{overview,by-session,ranking}`) を **新規追加なし** で再利用、`safeServerFetch` 経由、OKLch tokens、D1 直接アクセス禁止

## 成果物台帳

| 種別 | パス | 状態 |
|------|------|------|
| root artifacts | `docs/30-workflows/completed-tasks/admin-ui-task-d-attendance-primitive-conformance/artifacts.json` | implemented_local_evidence_captured |
| outputs mirror | `docs/30-workflows/completed-tasks/admin-ui-task-d-attendance-primitive-conformance/outputs/artifacts.json` | root と同値維持 |
| Phase 11 local visual evidence | `outputs/phase-11/` | Playwright screenshot 3 枚 + report 取得済み |
| Phase 12 strict 7 | `outputs/phase-12/` | 7/7 配置済、current fact へ更新済み |
| aiworkflow sync | `.claude/skills/aiworkflow-requirements/{indexes, references, changelog, LOGS}` | implemented_local_evidence_captured として同期 |

## 関連タスク

| タスク | 関係 |
|--------|------|
| Task A (layout/sidebar) | 依存なし |
| Task B (dashboard 404 / byZone) | 別画面 |
| Task C (AdminPageHeader 8 admin page 統合) | **前提**（AdminPageHeader 提供を利用） |
| Task E (visual baseline) | snapshot は本タスクで導入、baseline 撮影は Task E |

## Phase 一覧

| Phase | File |
|-------|------|
| 1 | [phase-1-requirements.md](./phase-1-requirements.md) |
| 2 | [phase-2-design.md](./phase-2-design.md) |
| 3 | [phase-3-design-review.md](./phase-3-design-review.md) |
| 4 | [phase-4-test-plan.md](./phase-4-test-plan.md) |
| 5 | [phase-5-implementation.md](./phase-5-implementation.md) |
| 6 | [phase-6-test-additions.md](./phase-6-test-additions.md) |
| 7 | [phase-7-coverage.md](./phase-7-coverage.md) |
| 8 | [phase-8-refactor.md](./phase-8-refactor.md) |
| 9 | [phase-9-qa.md](./phase-9-qa.md) |
| 10 | [phase-10-final-review.md](./phase-10-final-review.md) |
| 11 | [phase-11-manual-test.md](./phase-11-manual-test.md) |
| 12 | [phase-12-documentation.md](./phase-12-documentation.md) |
| 13 | [phase-13-pr.md](./phase-13-pr.md) |
