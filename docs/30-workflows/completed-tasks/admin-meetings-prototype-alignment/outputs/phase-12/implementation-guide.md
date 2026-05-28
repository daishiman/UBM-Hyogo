# Admin Meetings Prototype Alignment - 実装ガイド

## メタ情報

| 項目 | 内容 |
| --- | --- |
| 機能名 | admin-meetings-prototype-alignment |
| 作成日 | 2026-05-27 |
| 対象読者 | 開発者・技術者・学習者 |

## Part 1

### なぜ必要か

管理画面の開催日ページは、予定と出席を扱う重要な場所だが、共通部品の使い方が他の管理画面とずれていた。見た目や操作の置き場所がそろっていないと、管理者は「どこを見ればよいか」「どの操作が危険か」を毎回考える必要がある。

### 何をするか

`/admin/meetings` と `/admin/meetings/[id]` を、既存の管理画面 primitive に合わせて再構成する。API と D1 schema は増やさず、画面の責務分離、KPI 表示、空状態、出席編集 drawer、CSV import の card 化を行う。

### 日常の例え

たとえば: 学校の行事係が、予定表・参加者名簿・追加フォームを同じ黒板にばらばらに貼ると探しにくい。今回の変更は、予定表を左、人数のまとめを上、詳しい編集欄を必要な時だけ開く形に並べ直す作業に近い。

### 今回作ったもの

| 日本語 | 英語 | 役割 |
| --- | --- | --- |
| 開催日 shell | `MeetingsClientShell` | list state、toast、drawer、mutation をまとめる |
| 開催日追加フォーム | `MeetingCreateForm` | `POST /api/admin/meetings` の結果を本物の `sessionId` で反映する |
| 開催日タイムライン | `MeetingTimeline` | 一覧・空状態・選択状態を表示する |
| 出席編集 drawer | `MeetingAttendanceDrawer` | 出席追加・削除、開催日編集、soft delete を扱う |
| 統計計算 | `computeMeetingStats` | 開催数、直近日、累計出席、平均出席を計算する |
| Phase 11 画面証跡 | `outputs/phase-11/screenshots/*.png` | UI/UX 変更の実表示を記録する |

## Part 2

### アーキテクチャ設計

```txt
apps/web/app/(admin)/admin/meetings/page.tsx
  -> AdminPageHeader
  -> MeetingsClientShell

apps/web/src/features/admin/components/_meetings/
  -> MeetingCreateForm.tsx
  -> MeetingTimeline.tsx
  -> MeetingAttendanceDrawer.tsx
  -> meetingStats.ts

apps/web/app/(admin)/admin/meetings/[id]/page.tsx
  -> AdminPageHeader
  -> MeetingAttendancePanel
  -> AttendanceCsvImportPanel
```

`apps/web/src/components/admin/MeetingPanel.tsx` は削除し、admin meetings 固有 UI は `_meetings` feature directory に集約する。shared primitive は `_shared` と `components/ui` から利用する。

### インターフェース定義

画面は既存 admin proxy のみを使う。`apps/api` endpoint と D1 schema はこのタスクでは変更しない。

| Component | Contract |
| --- | --- |
| `MeetingsClientShell` | `initial.items` を local state 化し、作成・編集・削除・出席変更を反映する |
| `MeetingCreateForm` | create API の `{ ok, meeting }` を受け取り、返却された `sessionId` を UI に使う |
| `MeetingTimeline` | `items.length === 0` で `AdminEmptyState` を出す |
| `MeetingAttendanceDrawer` | 削除済み候補を受け取らず、既出席 option を disabled にする |

### 型定義

```ts
export interface MeetingItem {
  sessionId: string;
  title: string;
  heldOn: string;
  note: string | null;
  createdAt: string;
  attendance?: ReadonlyArray<{
    memberId: string;
    assignedAt?: string;
    assignedBy?: string;
  }>;
}

export interface MeetingStats {
  readonly totalMeetings: number;
  readonly recentHeldOn: string | null;
  readonly totalAttendees: number;
  readonly avgAttendees: number;
}

export interface CreateMeetingResponse {
  ok: true;
  meeting: MeetingItem;
}
```

### APIシグネチャ

```ts
createMeeting(body: {
  title: string;
  heldOn: string;
  note?: string | null;
}): Promise<AdminMutationResult<{ ok: true; meeting: MeetingItem }>>;

updateMeeting(
  sessionId: string,
  body: { title?: string; heldOn?: string; note?: string | null; deletedAt?: string | null },
): Promise<AdminMutationResult<unknown>>;

addAttendance(sessionId: string, memberId: string): Promise<AdminMutationResult<unknown>>;
```

### 使用例

```tsx
<MeetingCreateForm
  onCreated={(item) => setMeetings((prev) => [item, ...prev])}
  setToast={setToast}
/>
```

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- _meetings
PLAYWRIGHT_EVIDENCE_TASK=admin-meetings-prototype-alignment \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-meetings-prototype-alignment.spec.ts --project=desktop-chromium
```

### エラーハンドリング

| Error | UI handling |
| --- | --- |
| create API 400/500 | `開催追加に失敗: <message>` toast |
| duplicate attendance 409 | `この会員は既に出席登録されています` toast |
| deleted member 422 | `削除済み会員は登録できません` toast |
| detail fetch 404/500 | `AdminSectionErrorClient` |
| delete attendance 404 | UI から該当 member を消し `既に出席解除されています` toast |

### エッジケース

| Case | Handling |
| --- | --- |
| 開催日 0 件 | `MeetingTimeline` が `AdminEmptyState` を表示する |
| create 後すぐ編集 | API 返却の本物の `sessionId` を使うため `tmp-*` route へ飛ばない |
| 削除済み member | server result と list page filter の二重防御で候補から除外する |
| CSV import hydration | file input は hydrated 後に表示し、既存の state machine を維持する |
| staging `ADMIN_FETCH_404` | 本 UI alignment 外。`docs/30-workflows/unassigned-task/admin-meetings-staging-admin-fetch-404-runtime-followup.md` で追跡する |

### 設定項目と定数一覧

| Name | Value / Path | Purpose |
| --- | --- | --- |
| screenshot directory | `outputs/phase-11/screenshots/` | Phase 11 UI evidence |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` | required visual states |
| capture metadata | `outputs/phase-11/phase11-capture-metadata.json` | runtime capture status |
| API base | `/api/admin` | web admin proxy |
| CSV limit | 500 rows | existing import guard |

### セキュリティ・運用上の禁止事項

- web から D1 へ直接接続しない。
- profile 本文や tag を meetings UI から直接変更しない。
- commit / push / PR 作成、staging refresh/deploy はユーザー承認後に限る。
- screenshot evidence に Cookie、Authorization、個人情報の生値を含めない。

### テスト構成

| Layer | Command / File |
| --- | --- |
| unit | `apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts` |
| component | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` |
| primitive gate | `apps/web/src/components/admin/__tests__/primitive-adoption.spec.ts` |
| visual evidence | `apps/web/playwright/tests/admin-meetings-prototype-alignment.spec.ts` |
| Phase 12 validator | `.claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js` |

Phase 11 screenshot references:

- `outputs/phase-11/screenshots/list-default.png`
- `outputs/phase-11/screenshots/list-empty.png`
- `outputs/phase-11/screenshots/list-drawer-open.png`
- `outputs/phase-11/screenshots/detail-default.png`
- `outputs/phase-11/screenshots/detail-csv-preview.png`
- `outputs/phase-11/screenshot-coverage.md`

### 下流タスク連携

staging `ADMIN_FETCH_404` はこの UI alignment と独立した runtime/auth/session 調査であり、同一サイクルで unassigned task に formalize 済み。PR 本文は本ガイドを元に、実装範囲、検証コマンド、Phase 11 screenshot evidence、user-gated boundary を転記する。
