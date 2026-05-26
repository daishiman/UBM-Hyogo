# Issue #895 — AdminTopbar actions slot に admin グローバル操作 client island を流し込む

[実装区分: 実装仕様書]
判定根拠: 目的達成にコード変更（新規 client island 追加 + `(admin)/layout.tsx` 注入 + spec 追加）が必須のため、CONST_004 のデフォルトに従い実装仕様書として作成する。

## 概要

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/895
- Source spec: `docs/30-workflows/completed-tasks/parallel-03-followup-004-admin-topbar-actions-buttons.md` (consumed)
- task_id: `issue-895-admin-topbar-actions-client-island`
- 親 followup: `docs/30-workflows/completed-tasks/parallel-03-followup-001-admin-topbar-primitive-extraction/`
- 種別: improvement / NON_VISUAL（既存 SignOutButton の集約位置変更のみで新規 UI primitive 追加なし）
- 規模: 小規模（新規 1 ファイル + spec 1 ファイル + layout 差分 1 箇所）
- priority: low

## 現状調査結果（2026-05-25 時点）

| 項目 | 状態 |
|------|------|
| `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx` | 作成済み |
| `apps/web/app/(admin)/layout.tsx` の AdminTopbar 呼び出し | `<AdminTopbar actions={<AdminTopbarActions />} />` |
| `AdminTopbar.tsx` の `actions?: ReactNode` slot | 注入済み → `aria-hidden` 解除 |
| 既存 client island `SignOutButton` | `apps/web/src/components/auth/SignOutButton.tsx` に存在（`Button` primitive 流用済み） |

→ 本タスクは実装済み。Phase 11/12 evidence と正本仕様同期を同一サイクルで補正済み。

## Phase 1-13 出力

| Phase | ファイル |
|-------|---------|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | [phase-2-design.md](phase-2-design.md) |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | [phase-9-qa.md](phase-9-qa.md) |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | [phase-13-pr.md](phase-13-pr.md) |

## artifacts

- [artifacts.json](artifacts.json)
