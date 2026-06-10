# テスト仕様 — admin-meeting-bulk-attendance-select（Phase 4）

本仕様の正本は [phase-4-test-plan.md](../../phase-4-test-plan.md)。本書はテストファイル別の確定ケース一覧と trace を保持する。

## テストファイル一覧（T1..T8）

| T# | ファイル | 種別 | ケース数 | 対応 AC |
| --- | --- | --- | --- | --- |
| T1 | `apps/web/src/components/ui/__tests__/Checkbox.spec.tsx` | 新規 | CB-1..5 | AC-1 / AC-11 |
| T2 | `apps/web/src/features/admin/components/_meetings/__tests__/useBulkAttendanceSelection.spec.ts` | 新規 | HK-1..10 | AC-2 / AC-4 / AC-9 |
| T3 | `apps/web/src/features/admin/components/_meetings/__tests__/bulk-attendance-message.spec.ts` | 新規 | MSG-1..7 | AC-7 |
| T4 | `apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceChecklist.spec.tsx` | 新規 | CL-1..12 | AC-1..4 / AC-7 |
| T5 | `apps/web/src/features/admin/components/_meetings/__tests__/BulkAttendanceModal.spec.tsx` | 新規 | MD-1..7 | AC-8 / AC-9 |
| T6 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | 編集 | DR-1..5 | AC-10 / AC-1 / AC-8 |
| T7 | `apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts` | 新規 | API-1..6 | AC-5 |
| T8 | `apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx` | 編集 | SH-1..7 | AC-5 / AC-6 / AC-7 / AC-10 |

## props vs internal state（[VSCPKR-03]）

- internal state（hook の `useState`）: `selectedIds` / `query`。テストは UI 操作（toggle / 検索入力）で駆動する。
- external props: `candidates` / `attended` / `sessionId` / `onBulkAdd` / `onOpenModal` / `onClose`。

## 境界値文字列（[W0-RV-001]）

期待文字列ケースには `.length` をコメント併記する。例:

```ts
expect(toast).toBe("一度に追加できるのは 500 名までです"); // 22 文字
```

## 実行コマンド（SSOT §7 focused run）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```

> 新規 test は `.spec.ts(x)` のみ（不変条件 #8）。詳細ケース表（入力 / 期待値 / trace）は正本 [phase-4-test-plan.md](../../phase-4-test-plan.md) §3 を参照。
