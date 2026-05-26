**[実装区分: 実装ガイド]**

# Implementation Guide

## Part 1: 中学生レベル

出欠の解除ボタンを足します。すでに別ルートで解除済みのときは「既に解除済みです」と短いお知らせを出して、画面を解除状態にそろえます。エラー赤画面は出しません。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| mutation | サーバへ書き込みお願い |
| `treat404AsSuccess` | 「もう無いよ」を「もう済んでるよ」に読み替えるスイッチ |
| optimistic update | サーバ返事を待たず先に画面を更新 |
| race | 同じことを同時に複数人がやる状況 |

## Part 2: 技術者レベル

### 変更ファイル一覧

| path | 種別 | 内容 |
|---|---|---|
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | implementation | 解除 CTA + 第 2 mutation 追加 |
| `apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx` | test | A1..A8 既存互換 + B1..B5 追加 |

API / hook / 既存 type は **無改変**。

### 差分イメージ

```tsx
// MeetingAttendancePanel.tsx
const endpoint = `/api/admin/meetings/${encodeURIComponent(detail.sessionId)}/attendances`;

const registerMutation = useAdminMutation(endpoint, "POST", {
  refreshOnSuccess: false,
  // treat404AsSuccess は付けない（誤適用ガード）
});

const unregisterMutation = useAdminMutation(endpoint, "POST", {
  treat404AsSuccess: { toast: "既に解除済みです" },
  refreshOnSuccess: false,
});

await registerMutation.trigger({ memberId, attended: true });
await unregisterMutation.trigger({ memberId, attended: false });
```

### Implementation Steps

1. `MeetingAttendancePanel.tsx` を `"use client"` boundary 内で確認し、現状の register mutation 構成を読み取る。
2. 第 2 mutation インスタンス（unregister）を追加し、上記 options を渡す。register mutation には `treat404AsSuccess` を付与しない。
3. registered 行に `data-testid="attendance-unregister"` の解除 button を追加する。既存 register button は維持し、registered=false 行には解除 button を出さない。
4. `MeetingAttendancePanel.spec.tsx` に A 系既存互換 + B1..B5 を追加。`fetch` を `vi.fn()` で stub し、status 別 Response を返す。
5. `vitest` で `MeetingAttendancePanel.spec.tsx` + 既存 `useAdminMutation.spec.ts` 無回帰を実行。
6. `typecheck` / `lint` / DELETE-race caller 棚卸し grep を実行。

### Verification Commands

```bash
pnpm exec vitest run "apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx"
pnpm exec vitest run apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
rg -n 'useAdminMutation\([^)]*"DELETE"' apps/web/app apps/web/src -g '*.ts' -g '*.tsx' -g '!**/__tests__/**' -g '!**/*.spec.ts' -g '!**/*.spec.tsx'
pnpm verify:phase12-compliance -- docs/30-workflows/completed-tasks/issue-911-meeting-attendance-unregister-ui-treat404-wiring
```

### DoD

- [x] `MeetingAttendancePanel.spec.tsx` 14 tests pass
- [x] `useAdminMutation.spec.ts` 33 tests pass
- [x] web typecheck / web lint exit 0
- [x] production DELETE-race caller grep が 0 件
- [x] `MeetingAttendancePanel.tsx` 差分が register / unregister 別 mutation 構成になっている
- [x] hook 本体 (`useAdminMutation.ts`) 無改変
- [x] API (`admin/meetings.ts`) 無改変

### Known Limits

commit / push / PR / staging smoke は user-gated。local focused spec / typecheck / lint / source grep は Phase 11 に実測ログを保存済み。
