---
spec_classification: implementation_spec
state: spec_created
phase: 13
phase_name: commit-pr-release
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 13: PR

## 13.1 commit

```bash
git add \
  apps/web/app/\(admin\)/admin/tags/page.tsx \
  apps/web/app/\(admin\)/admin/meetings/page.tsx \
  apps/web/app/\(admin\)/admin/meetings/\[id\]/page.tsx \
  apps/web/app/\(admin\)/admin/schema/page.tsx \
  apps/web/app/\(admin\)/admin/schema/history/page.tsx \
  apps/web/app/\(admin\)/admin/requests/page.tsx \
  apps/web/app/\(admin\)/admin/identity-conflicts/page.tsx \
  apps/web/app/\(admin\)/admin/audit/page.tsx \
  apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx \
  apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx \
  apps/web/src/styles/tokens.css \
  apps/web/app/\(admin\)/admin/**/__tests__/page.spec.tsx \
  tests/structure/admin-page-header-adoption.spec.ts \
  docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/

git commit
```

commit message テンプレート:

```
feat(admin-ui): unify AdminPageHeader across 9 admin pages and detox identity-conflicts palette (Task C)

- 9 admin pages adopt AdminPageHeader with eyebrow / breadcrumbs; schema uses the actions slot
- identity-conflicts/page.tsx removes its own <main> and Tailwind palette
- AdminPageHeader extended with eyebrow / headingId props (backward compatible)
- tokens.css adds --ubm-color-link-default / --ubm-eyebrow-tracking
- adds 9 RTL spec + 1 structure gate spec

Refs: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
Parent: docs/30-workflows/admin-ui-prototype-alignment/
Sibling: Task A / B / D / E
```

## 13.2 PR

- base: `dev`
- title: `feat(admin-ui): unify AdminPageHeader across 9 admin pages and detox identity-conflicts palette (Task C)`
- body 必須項目:
  - **Summary**: 9 page で AdminPageHeader 統一 / identity-conflicts の Tailwind palette と独自 main 撤去 / AdminPageHeader に eyebrow / headingId prop 追加
  - **Scope**: 11 file (page 9 + AdminPageHeader 1 + tokens.css 1)
  - **Out of scope**: Task A / B / D / E
  - **AC checklist**: AC-C1..C8 全 check
  - **CI gate**: verify-design-tokens green / typecheck green / lint green / vitest green
  - **Screenshots**: `outputs/phase-11/` 9 枚 (visual baseline は Task E)
  - **Refs**: 親 workflow / sibling Task A,B,D,E

## 13.3 user-gated 操作

| 操作 | 実行可否 |
|------|---------|
| local commit | user 明示承認後 |
| push | user 明示承認後 |
| `gh pr create` | user 明示承認後 |
| staging deploy / required check 化 | 別タスク (Task A / E 完了後の親 workflow 側で実施) |

## 13.4 DoD (Definition of Done)

- [ ] admin 9 page で AdminPageHeader を採用 (AC-C1)
- [ ] admin 配下 page.tsx から Breadcrumb 直 import / 直 JSX 消失 (AC-C2)
- [ ] admin 配下 page.tsx で Tailwind palette / HEX 直書き 0 件 (AC-C3, C4)
- [ ] identity-conflicts/page.tsx の独自 `<main>` 撤去 (AC-C5)
- [ ] AdminPageHeader に `eyebrow` / `headingId` prop 追加・後方互換維持
- [ ] 新規 RTL 9 spec + 構造 gate 1 spec が green
- [ ] verify-design-tokens / typecheck / lint green (AC-C6)
- [ ] 新規 page-header 系 component を増やしていない (AC-C8)
- [ ] visual snapshot 更新は Task E に委譲 (範囲外明示)
- [ ] PR 本文に AC checklist / screenshots / refs 完備
- [ ] PR が `dev` を base に作成済

## 13.5 evidence

- `outputs/phase-13/pr-creation-result.md` に以下を記録:
  - PR URL
  - merged base SHA
  - CI gate 一覧と最終 status
  - 実施日時 / 実施者
