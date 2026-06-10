# 統合テスト仕様 — admin-meeting-bulk-attendance-select（Phase 6）

本仕様の正本は [phase-6-test-additions.md](../../phase-6-test-additions.md)。本書は fail path / 回帰 guard の追加ケース一覧を保持する。

## 追加 fail path / エッジケース

| テストファイル | 追加ケース | 観点 |
| --- | --- | --- |
| `bulk-attendance-message.spec.ts`（T3） | MSG-E1..E3 | 混在内訳・ok>0 でも非 ok のみ表示 |
| `MeetingsClientShell.spec.tsx`（T8） | SH-E1..E9 | committed:false 5 内訳・通信失敗・非 2xx・>500・fresh 0・1 回呼出 |
| `BulkAttendanceChecklist.spec.tsx`（T4） | CL-E1..E4 | 空候補・検索 0 ヒット・false 保持・絞込全選択 |
| `useBulkAttendanceSelection.spec.ts`（T2） | HK-E1..E3 | 複数 stale 除去・trim 空白・大文字小文字 |
| `BulkAttendanceModal.spec.tsx`（T5） | MD-E1..E3 | open=false・空候補・選択解除 |
| `api.attendance-import.spec.ts`（T7） | API-E1..E3 | fetch throw・413・404 |

## committed:false 内訳網羅マトリクス

| status | ケース | 文言 |
| --- | --- | --- |
| `duplicate` | MSG-1 / SH-E1 | 出席済 |
| `deleted_member` | MSG-2 / SH-E2 | 削除済 |
| `unknown_member` | MSG-3 / SH-E3 | 不明 |
| `invalid` | MSG-4 / SH-E4 | 不正 |
| 混在 | MSG-5 / MSG-E1 / MSG-E2 | 連結 |
| 全 0（理論） | MSG-7 | 括弧なし汎用 |

## 回帰 guard

| 対象 | ケース | 維持内容 |
| --- | --- | --- |
| `MeetingAttendanceDrawer.spec.tsx` | DR-1 / DR-2 | 既存 2 ケース GREEN 維持（新 prop `onBulkAddAttendance` 追加） |
| `MeetingsClientShell.spec.tsx` | SH-6 / SH-7 | 単発「出席を追加」/ 出席削除の従来動作 |

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx
```

## カバレッジ範囲限定（[BEFORE-QUIT-002]）

カバレッジ計測は変更ファイル（F1..F9）に限定する。`globals.css`（F9）はカバレッジ対象外で AC-11 は `verify:tokens` / grep gate（Phase 9）が担保する。

> 各ケースの入力 / 期待値 / trace は正本 [phase-6-test-additions.md](../../phase-6-test-additions.md) §1..§4 を参照。
