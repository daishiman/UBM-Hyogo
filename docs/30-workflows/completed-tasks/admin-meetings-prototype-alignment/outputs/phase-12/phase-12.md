# Phase 12: Documentation

## 12.1 変更サマリ

- `apps/web/src/components/admin/MeetingPanel.tsx` を廃止
- `apps/web/src/features/admin/components/_meetings/` 配下に 4 component + 1 純関数 + index を新設
- `/admin/meetings` (list) と `/admin/meetings/[id]` (detail) を `AdminPageHeader` + `_shared` primitive 群に整流

## 12.2 採用 primitive

| primitive | 採用箇所 |
|-----------|---------|
| `AdminPageHeader` | list / detail |
| `AdminStat` | list KPI strip |
| `AdminSectionCard` | list (form / timeline / drawer 内側) / detail (attendance / csv) |
| `AdminTable` | detail 候補一覧 |
| `AdminEmptyState` | list 0 件時 |
| `AdminSectionErrorClient` | list / detail のフェッチ失敗時 |

## 12.3 data-testid 互換テーブル

Task A § 2.3 を正本として参照する（既存 E2E `attendance.spec.ts` 互換）。

## 12.4 関連ドキュメント

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- prototype 出典: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`
- design tokens: `docs/00-getting-started-manual/specs/design-tokens.md`
