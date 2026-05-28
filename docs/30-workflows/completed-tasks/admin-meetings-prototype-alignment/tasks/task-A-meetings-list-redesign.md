[実装区分: 実装仕様書]

# Task A — /admin/meetings list ページ再設計

- 親 workflow: `docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment/`
- Branch: `feat/admin-meetings-prototype-alignment`
- スコープ: `apps/web/app/(admin)/admin/meetings/page.tsx` + 新 `features/admin/components/_meetings/` 一式 + 既存 `MeetingPanel.tsx` の解体
- 並列性: Task B（detail ページ）と並列実行可（共有 component 衝突なし）

---

## Phase 1 — Requirements

### 1.1 ゴール

`/admin/meetings` の list ページを `AdminPageHeader` + `AdminStat` strip + `AdminSectionCard`（form + timeline + drawer）で再構成し、
プロトタイプ `AdminDashboardPage` の timeline 構造 + `AdminMembersPage` の drawer 構造を組み合わせて再現する。

### 1.2 受け入れ基準

Phase-1.3 の AC-A1〜AC-A10 を満たす（再掲は省略）。

---

## Phase 2 — Design

### 2.1 変更対象ファイル一覧

| 種別 | パス |
|------|------|
| 新規 | `apps/web/src/features/admin/components/_meetings/index.ts` |
| 新規 | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` |
| 新規 | `apps/web/src/features/admin/components/_meetings/MeetingCreateForm.tsx` |
| 新規 | `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` |
| 新規 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` |
| 新規 | `apps/web/src/features/admin/components/_meetings/meetingStats.ts` |
| 新規 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx` |
| 新規 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` |
| 新規 | `apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts` |
| 編集 | `apps/web/app/(admin)/admin/meetings/page.tsx` |
| 削除 | `apps/web/src/components/admin/MeetingPanel.tsx` |
| 削除（あれば） | `apps/web/src/components/admin/__tests__/MeetingPanel.spec.tsx` |

### 2.2 主要シグネチャ

Phase 2.3（workflow `phase-2.md`）の通り。
`meetingStats.ts`:

```ts
export interface MeetingItem {
  sessionId: string;
  title: string;
  heldOn: string;          // YYYY-MM-DD
  note: string | null;
  createdAt: string;
  attendance?: ReadonlyArray<{ memberId: string; assignedAt?: string; assignedBy?: string }>;
}
export interface MeetingStats {
  totalMeetings: number;
  recentHeldOn: string | null;
  totalAttendees: number;
  avgAttendees: number;
}
export function computeMeetingStats(items: ReadonlyArray<MeetingItem>): MeetingStats;
```

実装規定:
- `recentHeldOn = items.reduce((max, m) => m.heldOn > (max ?? "") ? m.heldOn : max, null as string | null)`
- `totalAttendees = sum(items.map(m => (m.attendance ?? []).length))`
- `avgAttendees = totalMeetings === 0 ? 0 : Math.round((totalAttendees / totalMeetings) * 10) / 10`

### 2.3 data-testid 互換テーブル

| 旧 (MeetingPanel) | 新 (component) | 維持 |
|------------------|---------------|------|
| `attendance-toast` | `MeetingsClientShell` のトースト要素 | ✅ |
| `attendance-list-session-<sessionId>` | `MeetingTimeline` の各行 wrapper | ✅ |
| `attendance-select-<sessionId>` | `MeetingAttendanceDrawer` の select | ✅ |
| `add-attendance-<sessionId>` | drawer の追加ボタン | ✅ |
| `attendance-attendee-<sessionId>` (data-member) | drawer 内出席者 li | ✅ |
| `remove-attendance-<sessionId>` (data-member) | drawer 内削除ボタン | ✅ |

---

## Phase 3 — Design Review

Workflow root `outputs/phase-3/phase-3.md` のリスク R1-R7 を参照。
特に R1（E2E 互換）と R7（token 直書き禁止）を Phase 5 で gate 化する。

---

## Phase 5 — Implementation

### 5.1 実装手順

1. `mise exec -- pnpm install`
2. `apps/web/src/features/admin/components/_meetings/` ディレクトリを作成
3. `meetingStats.ts` を実装し、`meetingStats.spec.ts` を先に書いて red → green
4. `MeetingCreateForm.tsx` を実装（`FormField` + `Input`、`useAdminMutation` 経由で POST `/api/admin/meetings`）
5. `MeetingTimeline.tsx` を実装（プロトタイプ `.tl-row` 相当の card-flat 行 + `AdminEmptyState`）
6. `MeetingAttendanceDrawer.tsx` を実装（既存 `useConfirmDialog` + `ConfirmDialog` 流用、focus trap は最小 aside + role=dialog）
7. `MeetingsClientShell.tsx` を実装（state owner: meetings local 配列 / attended Set / drawer open id / toast）
8. `index.ts` で named export
9. `apps/web/app/(admin)/admin/meetings/page.tsx` を Phase-2.4 通り書き換え
10. `apps/web/src/components/admin/MeetingPanel.tsx` を削除し、参照箇所（`MeetingPanel` import）を全消去（`grep -rn 'MeetingPanel' apps/web/src apps/web/app` が 0 件になるまで）
11. token grep gate: `grep -rnE '#[0-9a-fA-F]{3,6}' apps/web/src/features/admin/components/_meetings/` が 0 行

### 5.2 入出力 / 副作用

- 入力: server fetch 結果 `MeetingsListView` + `candidates`
- 出力: 描画 + `router.refresh()`（form 送信成功時 / drawer 保存時 / soft delete 時）
- 副作用: `useAdminMutation` 経由の API 呼び出しのみ（直接 fetch 禁止）

### 5.3 テスト方針

| spec | 主要ケース |
|------|-----------|
| `meetingStats.spec.ts` | 0 件で avg=0 / recentHeldOn=null、複数件で max date、平均が小数 1 桁丸め |
| `MeetingTimeline.spec.tsx` | 0 件で `AdminEmptyState` 表示 / `meeting-row-<id>` testid / click で `onSelect` 発火 |
| `MeetingsClientShell.spec.tsx` | (a) form submit 成功で toast 出現 + state 追加 / (b) attendance 追加で 409 → 「既に登録」toast / (c) 422 → 「削除済み会員」toast / (d) drawer open/close / (e) softDelete confirm flow |

### 5.4 ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web test -- _meetings
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# token gate
grep -rnE '#[0-9a-fA-F]{3,6}' apps/web/src/features/admin/components/_meetings/ && echo NG || echo OK
# legacy ref gate
grep -rn 'MeetingPanel' apps/web/src apps/web/app && echo NG || echo OK
# build
mise exec -- pnpm --filter @ubm-hyogo/web build
```

### 5.5 DoD（Definition of Done）

- [ ] AC-A1〜AC-A10 をすべて満たす
- [ ] `pnpm typecheck` / `pnpm lint` green
- [ ] 上記 3 spec が green
- [ ] `MeetingPanel.tsx` への参照が 0 件
- [ ] token grep gate green
- [ ] `pnpm --filter @ubm-hyogo/web build` 成功

---

## Phase 11 — Manual Test（local + staging）

1. `mise exec -- pnpm --filter @ubm-hyogo/web dev` でローカル起動
2. admin アカウント（`manjumoto.daishi@senpai-lab.com`）で /login → /admin/meetings
3. 確認項目:
   - [ ] AdminPageHeader が表示（title=「開催日 / 出席管理」, breadcrumb=管理 > 開催日 / 出席管理）
   - [ ] KPI strip 4 枚（開催数 / 直近開催 / 累計出席 / 平均出席）が `AdminStat` token で表示
   - [ ] 開催日追加 form が `FormField` + primary button で表示
   - [ ] 開催日一覧が timeline 風に表示、行 click で drawer 開く
   - [ ] drawer 内で出席追加 → 候補 select で削除済み会員が候補から外れている
   - [ ] 既出席メンバーを再選択しようとすると disabled
   - [ ] soft delete 確認 dialog → 削除実行で行が消える
   - [ ] 空状態（DB を空にして）で `AdminEmptyState` が出る
4. staging 確認は `outputs/phase-11/` に screenshot を保存

---

## Phase 12 — Documentation

- `docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment/outputs/phase-12/phase-12.md` に下記を記載:
  - 廃止: `apps/web/src/components/admin/MeetingPanel.tsx`
  - 新規: `apps/web/src/features/admin/components/_meetings/*`
  - 採用 primitives: AdminPageHeader / AdminStat / AdminSectionCard / AdminTable / AdminEmptyState / AdminSectionErrorClient
  - data-testid 互換テーブル（Phase 2.3 を転記）

---

## Phase 13 — PR

- base: `dev`
- title: `feat(admin-meetings): /admin/meetings prototype-aligned redesign`
- 本文: 親 workflow へのリンク + AC 一覧 + 主要 diff 概要 + Phase 11 screenshot
- gate: `verify-design-tokens` / `verify-test-suffix` / typecheck / lint / vitest
