# カバレッジレポート — admin-meeting-bulk-attendance-select

本仕様の正本は [phase-7-coverage.md](../../phase-7-coverage.md)。本書は計測対象と目標の要約・実測欄を保持する。

## 計測対象と目標（[BEFORE-QUIT-002] 変更ファイルに限定）

| ファイル | 種別 | 目標 |
| --- | --- | --- |
| `useBulkAttendanceSelection.ts` | hook（新規） | Line/Branch/Func/Stmt **100%** |
| `bulk-attendance-message.ts` | 純関数（新規） | Line/Branch/Func/Stmt **100%** |
| `BulkAttendanceChecklist.tsx` | component（新規） | 80%+（推奨 90%） |
| `BulkAttendanceModal.tsx` | component（新規） | 80%+（推奨 90%） |
| `Checkbox.tsx` | primitive（新規） | 80%+（推奨 90%） |
| `importAttendance`（api.ts） | web client（編集・対象関数のみ） | 80%+（推奨 90%） |
| `MeetingsClientShell.tsx`（onBulkAdd） | shell（編集） | 参考値（`"use client"` + hooks 依存） |
| `MeetingAttendanceDrawer.tsx` | component（編集） | 参考値（既存 select 回帰は T5） |
| `globals.css` | CSS（編集） | カバレッジ対象外（jsdom 非実行 → Phase 11 視覚） |

## 個別計測コマンド（focused vitest --coverage）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --coverage \
  --coverage.include='apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts' \
  --coverage.include='apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts' \
  --coverage.include='apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx' \
  --coverage.include='apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx' \
  --coverage.include='apps/web/src/components/ui/Checkbox.tsx' \
  --coverage.include='apps/web/src/lib/admin/api.ts' \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```

## 実測欄テンプレート [Feedback 5]（実装後に埋める・推定値禁止）

| 対象ファイル | % Stmts | % Branch | % Funcs | % Lines | 目標 | 判定 |
| --- | --- | --- | --- | --- | --- | --- |
| `useBulkAttendanceSelection.ts` | _ | _ | _ | _ | 100% | _ |
| `bulk-attendance-message.ts` | _ | _ | _ | _ | 100% | _ |
| `BulkAttendanceChecklist.tsx` | _ | _ | _ | _ | 80%+ | _ |
| `BulkAttendanceModal.tsx` | _ | _ | _ | _ | 80%+ | _ |
| `Checkbox.tsx` | _ | _ | _ | _ | 80%+ | _ |
| `importAttendance`（api.ts） | _ | _ | _ | _ | 80%+ | _ |

| 項目 | 実測値 |
| --- | --- |
| 実行コマンド | _（上記コマンド）_ |
| 実行日時 | _（YYYY-MM-DD HH:MM）_ |
| テスト総数（spec / ケース） | _（--reporter=verbose 出力）_ |
| focused vitest 結果 | _（PASS/FAIL）_ |

## CSS 非カバレッジ方針

`globals.css` の `.bulk-attendance*` / `.ui-checkbox*` / `.bulk-attendance-modal*` は jsdom で実行されずカバレッジに現れない。実描画は Phase 11（user-gated）の staging 視覚確認で担保する。
