# Phase 2: Design

## 2.1 デザイン正本のマッピング

プロトタイプに `/admin/meetings` 専用画面は存在しないため、以下 2 画面の構造を組み合わせる。

| プロトタイプ要素 | 採用先 | 出典 |
|-----------------|-------|------|
| `.page-head`（eyebrow + h-page + muted + btn-row） | `AdminPageHeader`（既存 primitive） | `pages-admin.jsx:14-25` |
| `.grid-4` の `.card.stat` × 4 | `AdminStat`（既存 primitive） | `pages-admin.jsx:46-67` |
| `.timeline` の `.tl-row`（日付 + 内容 + 出席 chip） | 新 `MeetingTimeline` | `pages-admin.jsx:118-132` |
| `Drawer`（メンバー編集モーダル） | 新 `MeetingAttendanceDrawer` | `pages-admin.jsx:278-363` |
| `Field` + `Input` + `Button variant="primary"` の form | 既存 `FormField` + `Input`、`AdminSectionCard` 内 | `pages-admin.jsx:206-220`, `pages-public.jsx`（register form） |
| `.empty-state` | `AdminEmptyState` | `pages-admin.jsx:405-408` |
| `Chip tone={ok\|warn\|danger}` | 既存 `Chip`（`apps/web/src/components/ui/Chip.tsx`） | `pages-admin.jsx:84-87` |

## 2.2 ディレクトリ / ファイル設計

### 新規ファイル

```
apps/web/src/features/admin/components/_meetings/
├── index.ts                          # named export 集約
├── MeetingsClientShell.tsx           # "use client" — list 全体の state machine + drawer 開閉
├── MeetingCreateForm.tsx             # "use client" — 開催日追加 form（AdminSectionCard 内）
├── MeetingTimeline.tsx               # "use client" — 開催日一覧（card-flat 行 + tl-date）
├── MeetingAttendanceDrawer.tsx       # "use client" — 出席編集 + メンバー追加 + 削除確認
└── meetingStats.ts                   # 純関数: items → { totalMeetings, recentHeldOn, totalAttendees, avgAttendees }
```

### 既存ファイルの取扱い

- `apps/web/src/components/admin/MeetingPanel.tsx` — **削除**（新分割で完全置換）
- `apps/web/app/(admin)/admin/meetings/page.tsx` — 新 components 群を Server Component から呼ぶ形に書き換え
- `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` — `AdminSectionCard` ラップに整流（内部 state machine 不変）
- `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` — 同上、wrap のみ
- `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` — `AdminPageHeader` 採用

### 既存 hooks / utility

- `@/features/admin/hooks/useAdminMutation` — そのまま継続使用
- `@/features/admin/hooks/useConfirmDialog` — そのまま継続使用
- `@/components/ui/ConfirmDialog` / `FormField` / `Input` / `EmptyState` — 継続使用
- `safeServerFetch` — 継続使用

## 2.3 主要コンポーネント シグネチャ

### `MeetingsClientShell`

```tsx
interface MeetingsClientShellProps {
  readonly initial: MeetingsListView;
  readonly candidates: ReadonlyArray<MemberCandidate>;
}
export function MeetingsClientShell(props: MeetingsClientShellProps): JSX.Element;
```

責務: meetings state 管理（楽観 UI / attendance Set）、drawer open/close、toast 連携。
内部で `MeetingCreateForm` / KPI 4 枚（`AdminStat`） / `MeetingTimeline` / `MeetingAttendanceDrawer` を配置。

### `MeetingCreateForm`

```tsx
interface MeetingCreateFormProps {
  readonly onCreated: (meeting: MeetingItem) => void;
  readonly setToast: (msg: string) => void;
}
export function MeetingCreateForm(props: MeetingCreateFormProps): JSX.Element;
```

責務: 既存 `meetingCreateMutation` を呼ぶ。`FormField` + `Input` + primary button を `AdminSectionCard` 内に。

### `MeetingTimeline`

```tsx
interface MeetingTimelineProps {
  readonly items: ReadonlyArray<MeetingItem>;
  readonly onSelect: (sessionId: string) => void;
  readonly selectedId: string | null;
}
export function MeetingTimeline(props: MeetingTimelineProps): JSX.Element;
```

責務: 開催日一覧を timeline 風 card-flat 行で表示。行 click で drawer 開く。
0 件時は `AdminEmptyState` を返す。

### `MeetingAttendanceDrawer`

```tsx
interface MeetingAttendanceDrawerProps {
  readonly meeting: MeetingItem | null;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onClose: () => void;
  readonly onAddAttendance: (memberId: string) => Promise<void>;
  readonly onRemoveAttendance: (memberId: string) => void;
  readonly onUpdateMeeting: (patch: { title?: string; heldOn?: string; note?: string | null }) => Promise<void>;
  readonly onSoftDelete: () => void;
}
export function MeetingAttendanceDrawer(props: MeetingAttendanceDrawerProps): JSX.Element;
```

責務: プロトタイプ `Drawer` 構造 — header / body（タイトル編集 / 出席リスト / 候補選択） / footer（削除 + 保存）。

### `meetingStats` 純関数

```ts
export interface MeetingStats {
  readonly totalMeetings: number;
  readonly recentHeldOn: string | null;
  readonly totalAttendees: number;
  readonly avgAttendees: number;
}
export function computeMeetingStats(items: ReadonlyArray<MeetingItem>): MeetingStats;
```

## 2.4 ページ Server Component の書き換え

```tsx
// apps/web/app/(admin)/admin/meetings/page.tsx
export default async function AdminMeetingsPage() {
  const [meetingsResult, membersResult] = await Promise.all([
    safeServerFetch<MeetingsListView>("/admin/meetings"),
    safeServerFetch<AdminMemberListView>("/admin/members"),
  ]);
  const ok = meetingsResult.ok && membersResult.ok;
  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        title="開催日 / 出席管理"
        description={ok ? `${meetingsResult.data.total} 件の開催` : "読み込みに失敗"}
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "開催日 / 出席管理" }]}
      />
      {ok ? (
        <MeetingsClientShell
          initial={meetingsResult.data}
          candidates={membersResult.data.members
            .filter((m) => !m.isDeleted)
            .map((m) => ({ memberId: m.memberId, fullName: m.fullName }))}
        />
      ) : (
        <AdminSectionErrorClient ... />
      )}
    </section>
  );
}
```

## 2.5 a11y / token / data attribute

- 各 section は `aria-labelledby="meeting-<role>-h"` を付与
- KPI strip は `role="group" aria-label="開催 KPI"`
- timeline は `role="list"` / 行は `role="listitem"` + `data-testid="meeting-row-<sessionId>"`
- drawer は既存 ConfirmDialog と同じ pattern で focus trap / esc close
- 全 style は `var(--ubm-color-*)` token 経由

## 2.6 既存 spec への影響

| 既存 spec | 影響 | 対応 |
|----------|------|------|
| `apps/web/src/components/admin/__tests__/MeetingPanel.spec.tsx`（あれば） | 削除（panel 廃止） | 新 `_meetings/__tests__/MeetingsClientShell.spec.tsx` に置換 |
| `apps/api/src/routes/admin/meetings.contract.spec.ts` | 影響なし | 不変 |
| E2E `attendance.spec.ts`（playwright） | data-testid 互換維持で影響なし | `attendance-toast` / `add-attendance-<id>` / `remove-attendance-<id>` の testid は維持 |
