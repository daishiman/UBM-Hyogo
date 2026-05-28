[実装区分: 実装仕様書]

# Task B — /admin/meetings/[id] detail ページ整流

- 親 workflow: `docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment/`
- Branch: `feat/admin-meetings-prototype-alignment`
- スコープ: `apps/web/app/(admin)/admin/meetings/[id]/` 配下 3 ファイルの primitive 整流
- 並列性: Task A と並列実行可。共有 component への変更なし。

---

## Phase 1 — Requirements

### 1.1 ゴール

`/admin/meetings/[id]` を `AdminPageHeader` + `AdminSectionCard`（attendance / CSV import の 2 section）構成に整流し、
breadcrumb と token 採用を Task A と揃える。

### 1.2 受け入れ基準

workflow `phase-1.md` の AC-B1〜AC-B6 を満たす。

---

## Phase 2 — Design

### 2.1 変更対象ファイル

| 種別 | パス |
|------|------|
| 編集 | `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` |
| 編集 | `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` |
| 編集 | `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` |
| 新規（任意） | `apps/web/app/(admin)/admin/meetings/[id]/__tests__/page.spec.tsx` |

### 2.2 page.tsx 書き換え方針

```tsx
export default async function AdminMeetingDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await safeServerFetch<MeetingDetail>(`/admin/meetings/${encodeURIComponent(id)}`);
  const titleLabel = result.ok ? `${result.data.heldOn} ${result.data.title}` : "開催詳細";

  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        title={titleLabel}
        description={result.ok ? `候補 ${result.data.candidates.length} 名 / 出席 ${result.data.attendees.length} 名` : "読み込みに失敗"}
        breadcrumbs={[
          { label: "管理", href: "/admin" },
          { label: "開催日 / 出席管理", href: "/admin/meetings" },
          { label: titleLabel },
        ]}
      />
      {result.ok ? (
        <>
          <MeetingAttendancePanel detail={result.data} />
          <AttendanceCsvImportPanel sessionId={id} />
        </>
      ) : (
        <AdminSectionErrorClient sectionLabel="開催詳細" code={result.error.code} message={result.error.message} />
      )}
    </section>
  );
}
```

### 2.3 MeetingAttendancePanel.tsx の整流

内部 state machine（registered Set / mutations）は不変。表層を以下に置換:
- 最外殻を `<AdminSectionCard heading="出席登録" headingId="meeting-attendance-h">` でラップ
- 候補テーブル部分を `AdminTable` に置換、`columns` で `fullName` / `memberId` / `action` を定義
- toast 表示は既存通り `role="status"` 維持

### 2.4 AttendanceCsvImportPanel.tsx の整流

- 最外殻を `<AdminSectionCard heading="CSV 一括 import" headingId="meeting-csv-h">` でラップ
- step indicator の chip は `Chip tone={...}` 経由
- 内部 reducer は不変

---

## Phase 3 — Design Review

- token 直書きが現状 panel 内に残っているため、編集時に `grep -E '#[0-9a-fA-F]{3,6}'` で各 file 0 行を確認
- CSV import の state machine は変更しないため既存 spec 影響なし
- attendance API endpoint は不変（`POST /meetings/:id/attendances`、`treat404AsSuccess` 維持）

---

## Phase 5 — Implementation

### 5.1 手順

1. `page.tsx` を 2.2 通り書き換え
2. `MeetingAttendancePanel.tsx` の最外殻と候補一覧を 2.3 通り置換
3. `AttendanceCsvImportPanel.tsx` の最外殻を 2.4 通りラップ
4. 既存 spec を実行し回帰確認
5. token grep gate を通過

### 5.2 ローカル実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- meetings/\\[id\\]
mise exec -- pnpm typecheck
mise exec -- pnpm lint
grep -rnE '#[0-9a-fA-F]{3,6}' 'apps/web/app/(admin)/admin/meetings/[id]/' && echo NG || echo OK
mise exec -- pnpm --filter @ubm-hyogo/web build
```

### 5.3 DoD

- [ ] AC-B1〜AC-B6 すべて満たす
- [ ] typecheck / lint green
- [ ] 既存 attendance / csv import の spec が green
- [ ] token grep gate green
- [ ] build 成功

---

## Phase 11 — Manual Test

1. admin で login
2. /admin/meetings → 任意の行を click（または `/admin/meetings/<sessionId>` 直接）
3. 確認:
   - [ ] AdminPageHeader title=「<heldOn> <title>」
   - [ ] breadcrumb=管理 > 開催日 / 出席管理 > <heldOn> <title>
   - [ ] 出席登録 section が `AdminSectionCard` 内
   - [ ] CSV import section が `AdminSectionCard` 内 + step wizard 動作
   - [ ] 候補一覧テーブルで sticky header + sort（`AdminTable` 標準機能）が効く

---

## Phase 12 — Documentation

workflow `outputs/phase-12/phase-12.md` に追記。

---

## Phase 13 — PR

Task A と同一 PR にまとめて出す（base=`dev`、title 共通）。並列実装した場合も最終 commit は 1 本に集約する。
