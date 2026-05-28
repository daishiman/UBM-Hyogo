# Phase 1: Requirements

## 1.1 背景

`https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/meetings` が
プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）の
デザイン言語と大きく乖離している。

具体的な乖離点:

- 現状 `apps/web/src/components/admin/MeetingPanel.tsx` は裸 HTML（`<form>` / `<ul>` / `<select>` / `<details>`）で構成され、token / primitives を一切経由していない。
- 並走の `/admin/members`（Task C で `AdminPageHeader` / `MembersClientShell` / `_shared` primitives 適用済み）と比較すると整流の差が大きい。
- `/admin/meetings` には「開催日 / 出席管理」という統合機能があるが、プロトタイプには専用画面が無いため、**`AdminDashboardPage` の ACTIVITY timeline + `AdminMembersPage` の table + drawer 構造**を組み合わせて再構成する必要がある。

なお staging で観測されている `ADMIN_FETCH_404` は本タスクのスコープ外（auth/session 起因と想定）。本タスクは UI/UX 整流に閉じ、API 側変更は行わない。

## 1.2 ゴール

`/admin/meetings` を以下の primitive 構成に書き換え、admin/members と同等の整流度を達成する。

- `AdminPageHeader`（pretitle + title + description + actions）
- `AdminStat` × 3〜4（開催数 / 直近開催 / 累計出席 / 平均出席）
- `AdminSectionCard`（"開催日を追加" form / "開催日一覧" timeline + drawer）
- `AdminTable` または `card-flat` 行（開催日一覧）
- `AdminEmptyState`（0 件時）
- 出席編集は `Drawer`（プロトタイプ `AdminMembersPage` 準拠） or expand row

`/admin/meetings/[id]` も同様に `AdminPageHeader` + `AdminSectionCard` で primitive 整流する。

## 1.3 受け入れ基準（AC）

### List ページ（Task A）

| ID | 内容 | 検証手段 |
|----|------|---------|
| AC-A1 | `apps/web/app/(admin)/admin/meetings/page.tsx` が `AdminPageHeader` を採用 | `grep -c 'AdminPageHeader' apps/web/app/\(admin\)/admin/meetings/page.tsx` ≥ 1 |
| AC-A2 | `MeetingPanel.tsx` の "use client" コンポーネントが解体され、`MeetingsClientShell` / `MeetingCreateForm` / `MeetingTimeline` / `MeetingAttendanceDrawer` の 4 つに分割される | 各ファイルが存在し、それぞれ ≤ 200 行 |
| AC-A3 | list ページ内に裸 `<table>` が 0 件 | `grep -c '<table' apps/web/src/features/admin/components/_meetings/*.tsx` = 0 |
| AC-A4 | KPI ストリップが 3 件以上の `AdminStat` で構成される | `grep -c 'AdminStat' apps/web/src/features/admin/components/_meetings/*.tsx` ≥ 3 |
| AC-A5 | OKLch token のみ使用（HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件） | `grep -E '#[0-9a-fA-F]{3,6}' apps/web/src/features/admin/components/_meetings/*.tsx` = 0 |
| AC-A6 | 既存 API endpoint surface 不変（`apps/api/src/routes/admin/meetings.ts` diff = 0 行） | `git diff dev -- apps/api/src/routes/admin/meetings.ts` が空 |
| AC-A7 | 不変条件 #15 維持: 候補は `isDeleted=true` 除外、既出席は disabled、422/409 受信時 toast | vitest spec で再現 |
| AC-A8 | 空状態で `AdminEmptyState` が表示される | snapshot/vitest spec |
| AC-A9 | breadcrumb は `[{label:"管理", href:"/admin"}, {label:"開催日 / 出席管理"}]` | snapshot |
| AC-A10 | a11y: `aria-labelledby` で section が h1/h2 と結合 | vitest a11y spec |

### Detail ページ（Task B）

| ID | 内容 | 検証手段 |
|----|------|---------|
| AC-B1 | `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` が `AdminPageHeader` を採用 | grep ≥ 1 |
| AC-B2 | breadcrumb が `[{label:"管理", href:"/admin"}, {label:"開催日 / 出席管理", href:"/admin/meetings"}, {label: heldOn + title}]` | snapshot |
| AC-B3 | `MeetingAttendancePanel` / `AttendanceCsvImportPanel` がそれぞれ `AdminSectionCard` でラップされる | grep `AdminSectionCard` ≥ 2 |
| AC-B4 | 候補一覧が `AdminTable` で表示される | grep `AdminTable` ≥ 1 |
| AC-B5 | OKLch token のみ | 同上 |
| AC-B6 | 既存 API endpoint surface 不変 | 同上 |

## 1.4 スコープ外

- API endpoint の新規追加 / response shape 変更
- D1 schema 変更
- Google Form schema 変更
- staging 404 (`ADMIN_FETCH_404`) の根本対応（auth gate / session 関連は別 Issue 化）
- attendance CSV import wizard の機能変更（既存 `AttendanceCsvImportPanel` は wrap のみで内部 state machine 不変）

## 1.5 不変条件（再掲）

CLAUDE.md と親 workflow `admin-ui-prototype-alignment` の不変条件をすべて引き継ぐ。
