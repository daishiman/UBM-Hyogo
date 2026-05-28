# Implementation Guide

## Part 1: 中学生レベル

管理画面のページ上部にある「小さい分類名」「ページ名」「パンくず」「右上の操作」を、ページごとにばらばらに書かず、`AdminPageHeader` という共通部品に集めた。

`identity-conflicts` だけはページ全体の箱と青・灰色の直接指定が残っていたため、共通レイアウトの箱を使い、色は `tokens.css` の名前付きトークンから取るようにした。

## Part 2: 技術者レベル

- `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx`
  - `eyebrow?: string` を追加し、`--ubm-eyebrow-tracking` で letter spacing を固定。
  - `headingId?: string` を追加し、既存 `aria-labelledby` を壊さず h1 所有権を移譲。
  - `actions` は既存通り page-specific action slot として維持。
- `apps/web/app/(admin)/admin/**/page.tsx`
  - Task C の9ページで direct `<Breadcrumb>` を撤去し、`AdminPageHeader.breadcrumbs` へ集約。
  - `schema/page.tsx` の履歴リンクは `actions` slot に昇格。
  - `dashboard/attendance/page.tsx` は本体 table/KPI を触らず、h1 だけ移譲。
- `apps/web/src/components/admin/{MeetingPanel,RequestQueuePanel,AuditLogPanel,SchemaDiffHistoryPanel}.tsx`
  - 既存 caller 向け default 表示は維持しつつ、Task C pages では `showHeading={false}` / `showChrome={false}` で legacy page chrome を抑止。
- `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`
  - `showHeading={false}` を追加し、AdminPageHeader と detail panel の h1 重複を防止。
- `apps/web/src/styles/tokens.css`
  - `--ubm-color-link-default: var(--ubm-color-accent)`
  - `--ubm-eyebrow-tracking: 0.12em`
- Tests
  - `apps/web/src/__tests__/admin-page-header-adoption.spec.ts`
  - `apps/web/src/features/admin/components/_layout/__tests__/AdminPageHeader.spec.tsx`
  - `apps/web/playwright/tests/admin-pageheader-task-c.spec.ts`
  - `apps/web/src/__tests__/tokens.runtime.spec.ts`
  - `apps/web/src/components/admin/__tests__/primitive-adoption.spec.ts`

## Phase 11 Screenshots

- `../phase-11/01-admin-tags.png`
- `../phase-11/02-admin-meetings.png`
- `../phase-11/03-admin-meetings-detail.png`
- `../phase-11/04-admin-schema.png`
- `../phase-11/05-admin-schema-history.png`
- `../phase-11/06-admin-requests.png`
- `../phase-11/07-admin-identity-conflicts.png`
- `../phase-11/08-admin-audit.png`
- `../phase-11/09-admin-dashboard-attendance.png`
- `../phase-11/manual-test-result.md`
