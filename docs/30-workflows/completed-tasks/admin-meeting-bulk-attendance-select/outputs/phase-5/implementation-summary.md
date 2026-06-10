# 実装サマリ — admin-meeting-bulk-attendance-select（Phase 5）

本仕様の正本は [phase-5-implementation.md](../../phase-5-implementation.md)。本書は変更ファイル別の概要と DoD を保持する。

> **本書および正本ではコードを実装しない。後続 `03.実装.md` が実装する。**

## 変更ファイル一覧（F1..F9）

| # | パス | 種別 | 責務 | 検証 |
| --- | --- | --- | --- | --- |
| F1 | `apps/web/src/lib/admin/api.ts` | 編集 | `importAttendance` + 型 4 種（`?dryRun=false`・1 リクエスト） | T7 API-1..6 |
| F2 | `apps/web/src/components/ui/Checkbox.tsx` | 新規 | Checkbox primitive（FormField 互換・tokens） | T1 CB-1..5 |
| F3b | `apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts` | 新規 | `bulkFailureMessage` 純関数 | T3 MSG-1..7 |
| F3 | `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts` | 新規 | 選択 / toggle / 全選択 / 絞込 / stale 除去 | T2 HK-1..10 |
| F4 | `apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx` | 新規 | ドロワー内チェックリスト UI | T4 CL-1..12 |
| F5 | `apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx` | 新規 | 大量選択モーダル | T5 MD-1..7 |
| F6 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 編集 | チェックリスト埋込・モーダル起動・単発保持 | T6 DR-1..5 |
| F7 | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | 編集 | `onBulkAdd` 配線・summary→attended（all-or-nothing） | T8 SH-1..7 |
| F8 | `apps/web/src/features/admin/components/_meetings/index.ts` | 編集 | 新規 export 追加 | typecheck |
| F9 | `apps/web/src/styles/globals.css` | 編集 | checklist / modal / chip / checkbox CSS（OKLch tokens） | verify:tokens |

## 実装順序（依存順）

F1 → F2 → F3b → F3 → F4 → F5 → F6 → F7 → F8 → F9

## 主要シグネチャ（SSOT §4 厳守）

```ts
importAttendance(sessionId: string, memberIds: ReadonlyArray<string>):
  Promise<{ok:true,status,data:ImportAttendanceResponse} | {ok:false,status,error,data?}>;

useBulkAttendanceSelection(candidates, attended): UseBulkAttendanceSelection;

bulkFailureMessage(summary: ImportAttendanceSummary): string;

// Drawer 新 prop / UI 経路共通
onBulkAddAttendance: (memberIds: ReadonlyArray<string>) => Promise<boolean>;  // committed
```

## DoD

- [ ] T1..T8 全 GREEN。
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm verify:tokens` PASS。
- [ ] `git diff --name-only -- apps/api packages` 空（AC-12）。
- [ ] 既存 DR-1 / DR-2 GREEN 維持。

> Before→After / 新規ファイル全体構造の詳細は正本 [phase-5-implementation.md](../../phase-5-implementation.md) §2 を参照。
